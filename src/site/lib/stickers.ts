// ─────────────────────────────────────────────────────────────────────────────
//  Stickers store — custom stickers + shared favorites + per-device recents.
//
//  No DB migration required:
//   • Custom stickers  → uploaded to the existing `chat-media` bucket under
//     `sticker/custom/` (anon insert already allowed). Listable = shared library.
//   • Favorites (GIFs / stickers / custom) → one tiny JSON file per favorite in
//     `sticker/favorites/` (insert to add, delete to remove). Shared across both.
//   • Recents → per-device localStorage (fast, private to the device).
// ─────────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseConfigured } from "./supabase";

const BUCKET = "chat-media";
const CUSTOM_PREFIX = "sticker/custom";
const FAV_PREFIX = "sticker/favorites";
const RECENTS_KEY = "hb_sticker_recents";
const MAX_RECENTS = 24;

export type StickerKind = "sticker" | "gif";

export interface StickerRef {
  id: string;
  url: string;
  kind: StickerKind;
  title?: string;
}

// Stable short id from a URL (FNV-1a → base36) for favorite filenames.
export function stickerId(url: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < url.length; i++) {
    h ^= url.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function publicUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// ── Custom stickers ──────────────────────────────────────────────────────────
/**
 * Upload a custom sticker asset. The object name is the CONTENT HASH, so the
 * very same sticker (saved twice, or saved then sent) resolves to one URL and
 * never creates duplicates in Custom / Saved / Recent.
 */
export async function uploadCustomSticker(
  file: Blob,
  opts: { hash?: string } = {},
): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const mime = (file.type || "image/png").split(";")[0];
    const ext = mime.includes("png")
      ? "png"
      : mime.includes("webp")
        ? "webp"
        : mime.includes("gif")
          ? "gif"
          : "jpg";
    const name = opts.hash
      ? `h-${opts.hash}`
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const path = `${CUSTOM_PREFIX}/${name}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: mime,
      upsert: true,
      cacheControl: "31536000",
    });
    if (error) {
      // If the identical asset is already there (same content hash) the URL is
      // still valid even if the policy refused the overwrite → verify & reuse.
      const url = publicUrl(path);
      try {
        const head = await fetch(url, { method: "HEAD", cache: "no-store" });
        if (head.ok) return url;
      } catch {
        /* fall through */
      }
      console.error("[stickers] upload error", error);
      return null;
    }
    return publicUrl(path);
  } catch (err) {
    console.error("[stickers] upload threw", err);
    return null;
  }
}

export async function listCustomStickers(): Promise<StickerRef[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(CUSTOM_PREFIX, { limit: 500, sortBy: { column: "created_at", order: "desc" } });
    if (error || !data) return [];
    return data
      .filter((f) => f.id !== null && f.name)
      .map((f) => {
        const url = publicUrl(`${CUSTOM_PREFIX}/${f.name}`);
        return { id: stickerId(url), url, kind: "sticker" as StickerKind };
      });
  } catch {
    return [];
  }
}

export async function deleteCustomSticker(url: string): Promise<void> {
  try {
    const marker = `/object/public/${BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx < 0) return;
    const path = url.slice(idx + marker.length);
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    /* ignore */
  }
}

// ── Shared favorites ───────────────────────────────────────────────────────
export async function listFavorites(): Promise<StickerRef[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(FAV_PREFIX, { limit: 500, sortBy: { column: "created_at", order: "desc" } });
    if (error || !data) return [];
    const files = data.filter((f) => f.id !== null && f.name.endsWith(".json"));
    const refs = await Promise.all(
      files.map(async (f) => {
        try {
          const res = await fetch(publicUrl(`${FAV_PREFIX}/${f.name}`), {
            cache: "no-store",
          });
          const j = (await res.json()) as StickerRef;
          if (j?.url) return j;
        } catch {
          /* skip */
        }
        return null;
      }),
    );
    return refs.filter((r): r is StickerRef => Boolean(r));
  } catch {
    return [];
  }
}

export async function addFavorite(ref: StickerRef): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const id = ref.id || stickerId(ref.url);
    const payload: StickerRef = { ...ref, id };
    const blob = new Blob([JSON.stringify(payload)], {
      type: "application/json",
    });
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`${FAV_PREFIX}/${id}.json`, blob, {
        contentType: "application/json",
        upsert: true,
        cacheControl: "0",
      });
    return !error;
  } catch {
    return false;
  }
}

export async function removeFavorite(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([`${FAV_PREFIX}/${id}.json`]);
    return !error;
  } catch {
    return false;
  }
}

// ── Per-device recents ───────────────────────────────────────────────────────
export function getRecents(): StickerRef[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as StickerRef[];
    return Array.isArray(arr) ? arr.slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

export function pushRecent(ref: StickerRef): void {
  try {
    const id = ref.id || stickerId(ref.url);
    const cur = getRecents().filter((r) => r.id !== id);
    const next = [{ ...ref, id }, ...cur].slice(0, MAX_RECENTS);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
