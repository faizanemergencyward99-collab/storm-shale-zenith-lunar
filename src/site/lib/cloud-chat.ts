// Supabase-backed chat store — real-time cross-device sync.
//
// Handles text, image, and voice messages plus replies + typing indicator.
// No TTL / auto-delete: messages stay forever unless explicitly unsent.

import { supabase, isSupabaseConfigured } from "./supabase";
import { notifyNewMessage } from "./push";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type MessageType = "text" | "image" | "voice" | "video" | "sticker" | "gif" | "file";
/** Every type that carries a media_url (used by the persistent media gallery). */
export const MEDIA_TYPES: MessageType[] = ["image", "video", "gif", "sticker", "file", "voice"];
export type Sender = "habiba" | "faizan";

export interface ReplySnapshot {
  id: string;
  sender: Sender;
  type: MessageType;
  text?: string | null;
  mediaUrl?: string | null;
  durationMs?: number | null;
  /** Set when the replied-to message is a multi-photo album. */
  albumCount?: number | null;
}

// emoji → array of session IDs that reacted with that emoji
export type ReactionsMap = Record<string, string[]>;

// ── Multi-image "album" messages (Instagram-style carousel) ─────────────────
// An album is ONE `type = "image"` row whose media_url is the first photo and
// whose full photo list rides along in the (otherwise unused for images)
// `file_name` column as JSON, flagged by `mime_type = ALBUM_MIME`. This keeps
// the existing schema + RLS + realtime + media gallery untouched (no
// migration), while the client decodes it into `albumItems` on read.
export interface AlbumItem {
  url: string;
  w?: number | null;
  h?: number | null;
  /** "video" for grouped videos; photos omit it. */
  kind?: "image" | "video" | null;
  /** Video duration (ms). */
  d?: number | null;
}
export const ALBUM_MIME = "application/x-hb-album";

function decodeAlbum(fileName: unknown, mime: unknown): AlbumItem[] | null {
  if (mime !== ALBUM_MIME || typeof fileName !== "string") return null;
  try {
    const parsed = JSON.parse(fileName) as unknown;
    if (!Array.isArray(parsed)) return null;
    const items = parsed
      .filter((it): it is Record<string, unknown> => !!it && typeof it === "object")
      .map((it) => ({
        url: String(it.url ?? ""),
        w: typeof it.w === "number" ? it.w : null,
        h: typeof it.h === "number" ? it.h : null,
        kind: it.t === "v" ? ("video" as const) : ("image" as const),
        d: typeof it.d === "number" ? it.d : null,
      }))
      .filter((it) => it.url.length > 0);
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

export interface ChatMessage {
  id: string;
  type: MessageType;
  text: string | null;
  sender: Sender;
  timestamp: number; // ms since epoch
  sessionId?: string | null;
  edited?: boolean;
  mediaUrl?: string | null;
  mediaWidth?: number | null;
  mediaHeight?: number | null;
  durationMs?: number | null;
  replyToId?: string | null;
  replySnapshot?: ReplySnapshot | null;
  reactions?: ReactionsMap | null;
  /** File attachments only */
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  /** Multi-image album (2+ photos in one bubble). null for everything else. */
  albumItems?: AlbumItem[] | null;
}

const SELECT_COLS =
  "id, type, text, sender, timestamp, session_id, edited, media_url, media_width, media_height, duration_ms, reply_to_id, reply_snapshot, reactions, file_name, file_size, mime_type";

const KNOWN_TYPES = new Set<string>(["text", "image", "voice", "video", "sticker", "gif", "file"]);

function mapRow(row: Record<string, unknown>): ChatMessage {
  const rawType = (row.type as string) || "text";
  const type: MessageType = (KNOWN_TYPES.has(rawType) ? rawType : "text") as MessageType;
  const album = type === "image" ? decodeAlbum(row.file_name, row.mime_type) : null;
  return {
    id: String(row.id),
    type,
    text: (row.text as string | null) ?? null,
    sender: (row.sender === "faizan" ? "faizan" : "habiba") as Sender,
    timestamp:
      typeof row.timestamp === "number"
        ? row.timestamp
        : Number(row.timestamp ?? 0),
    sessionId: (row.session_id as string | null | undefined) ?? null,
    edited: Boolean(row.edited),
    mediaUrl: (row.media_url as string | null | undefined) ?? null,
    mediaWidth: (row.media_width as number | null | undefined) ?? null,
    mediaHeight: (row.media_height as number | null | undefined) ?? null,
    durationMs: (row.duration_ms as number | null | undefined) ?? null,
    replyToId: (row.reply_to_id as string | null | undefined) ?? null,
    replySnapshot:
      (row.reply_snapshot as ReplySnapshot | null | undefined) ?? null,
    reactions:
      (row.reactions as ReactionsMap | null | undefined) ?? null,
    // Album rows borrow file_name/mime_type as their payload — never surface
    // those as "file" metadata.
    fileName: album ? null : ((row.file_name as string | null | undefined) ?? null),
    fileSize: album || row.file_size == null ? null : Number(row.file_size),
    mimeType: album ? null : ((row.mime_type as string | null | undefined) ?? null),
    albumItems: album,
  };
}

// ── LIST ───────────────────────────────────────────────────────────────────
//
// IMPORTANT — why we order DESCENDING then reverse:
//   Supabase/PostgREST enforces a server-side `max-rows` cap (1000 on this
//   project). If we fetched with `.order("timestamp", { ascending: true })`
//   the server would return the OLDEST 1000 rows and silently drop everything
//   newer once the table grew past 1000 — making brand-new messages "vanish"
//   on refresh even though they are safely stored. By ordering DESCENDING
//   (newest first) and taking a page, we always get the most-recent messages;
//   we then reverse the page back to chronological (oldest → newest) order for
//   rendering. Older history is loaded on demand via `fetchOlderMessages`
//   (keyset pagination), so the chat scales to unlimited messages.
export const MESSAGE_PAGE_SIZE = 300;

/** Fetch the most recent page of chat history, sorted oldest → newest. */
export async function listMessages(
  limit: number = MESSAGE_PAGE_SIZE,
): Promise<ChatMessage[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select(SELECT_COLS)
      .order("timestamp", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("[chat] listMessages error", error);
      return null;
    }
    // Reverse newest-first → chronological for display.
    return (data ?? [])
      .map((r) => mapRow(r as Record<string, unknown>))
      .reverse();
  } catch (err) {
    console.error("[chat] listMessages threw", err);
    return null;
  }
}

/**
 * Keyset-paginate OLDER messages (those strictly before `beforeTimestamp`),
 * newest of that batch first from the DB then reversed to chronological order.
 * `hasMore` is true when a full page came back (there may be still-older msgs).
 * Robust against concurrent inserts at the top (they never affect this query).
 */
export async function fetchOlderMessages(
  beforeTimestamp: number,
  limit: number = MESSAGE_PAGE_SIZE,
): Promise<{ messages: ChatMessage[]; hasMore: boolean } | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select(SELECT_COLS)
      .lt("timestamp", beforeTimestamp)
      .order("timestamp", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("[chat] fetchOlderMessages error", error);
      return null;
    }
    const rows = (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
    return { messages: rows.reverse(), hasMore: rows.length === limit };
  } catch (err) {
    console.error("[chat] fetchOlderMessages threw", err);
    return null;
  }
}

/** Messages strictly after `afterTimestamp`, oldest → newest. */
export async function fetchNewerMessages(
  afterTimestamp: number,
  limit: number = MESSAGE_PAGE_SIZE,
): Promise<{ messages: ChatMessage[]; hasMore: boolean } | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select(SELECT_COLS)
      .gt("timestamp", afterTimestamp)
      .order("timestamp", { ascending: true })
      .limit(limit);
    if (error) return null;
    const rows = (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
    return { messages: rows, hasMore: rows.length === limit };
  } catch {
    return null;
  }
}

/** A window of history centred on `timestamp` (used to jump to old search hits). */
export async function fetchMessagesAround(
  timestamp: number,
  each: number = 120,
): Promise<{ messages: ChatMessage[]; hasOlder: boolean; hasNewer: boolean } | null> {
  if (!isSupabaseConfigured) return null;
  const [older, newer] = await Promise.all([
    fetchOlderMessages(timestamp + 1, each),
    fetchNewerMessages(timestamp, each),
  ]);
  if (!older || !newer) return null;
  return { messages: [...older.messages, ...newer.messages], hasOlder: older.hasMore, hasNewer: newer.hasMore };
}

/** Timestamp of one message (for jumping to a reply's original). */
export async function fetchMessageTimestamp(id: string): Promise<number | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from("chat_messages").select("timestamp").eq("id", id).maybeSingle();
    if (error || !data) return null;
    return Number((data as { timestamp: number }).timestamp);
  } catch {
    return null;
  }
}


// ── MEDIA GALLERY (persistent, DB-backed) ─────────────────────────────────
// The gallery must show EVERY photo/video/GIF/sticker/file ever shared — not
// just the ~300 messages currently held in memory. We page straight from the
// database with keyset pagination on (timestamp desc) filtered by type, so the
// list scales to thousands of items and never depends on the chat window.
export type MediaFilter = "all" | "image" | "video" | "gif" | "sticker" | "file" | "voice";
export const MEDIA_PAGE_SIZE = 60;

export async function listMedia(
  filter: MediaFilter,
  beforeTimestamp: number | null = null,
  limit: number = MEDIA_PAGE_SIZE,
): Promise<{ items: ChatMessage[]; hasMore: boolean } | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const types: MessageType[] = filter === "all" ? MEDIA_TYPES : [filter];
    let q = supabase
      .from("chat_messages")
      .select(SELECT_COLS)
      .in("type", types)
      .not("media_url", "is", null)
      .order("timestamp", { ascending: false })
      .limit(limit);
    if (beforeTimestamp != null) q = q.lt("timestamp", beforeTimestamp);
    const { data, error } = await q;
    if (error) {
      console.error("[chat] listMedia error", error);
      return null;
    }
    const items = (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
    return { items, hasMore: items.length === limit };
  } catch (err) {
    console.error("[chat] listMedia threw", err);
    return null;
  }
}

/** Exact per-type counts for the gallery header (single round-trip each, HEAD only). */
export async function countMedia(): Promise<Record<MediaFilter, number> | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const kinds: MediaFilter[] = ["image", "video", "gif", "sticker", "file", "voice"];
    const results = await Promise.all(
      kinds.map((k) =>
        supabase
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("type", k)
          .not("media_url", "is", null),
      ),
    );
    const out = { all: 0, image: 0, video: 0, gif: 0, sticker: 0, file: 0, voice: 0 } as Record<MediaFilter, number>;
    kinds.forEach((k, i) => {
      const c = results[i].count ?? 0;
      out[k] = c;
      out.all += c;
    });
    return out;
  } catch (err) {
    console.error("[chat] countMedia threw", err);
    return null;
  }
}

// ── PREFETCH ─────────────────────────────────────────────────────────────
// Kick off the history fetch as early as possible (e.g. while the user is
// still typing the passcode on the lockscreen) so the network round-trip
// overlaps with that interaction instead of blocking *after* unlock. The
// chat then consumes this in-flight promise for an instant first paint.
let _prefetch: Promise<ChatMessage[] | null> | null = null;

export function prefetchMessages(): Promise<ChatMessage[] | null> {
  if (!_prefetch) _prefetch = listMessages();
  return _prefetch;
}

/** Consume the prefetched promise exactly once (null if none in flight). */
export function takePrefetchedMessages(): Promise<ChatMessage[] | null> | null {
  const p = _prefetch;
  _prefetch = null;
  return p;
}

// ── SEARCH ───────────────────────────────────────────────────────────────
// Full-history search straight against Supabase (NOT just the loaded window),
// so even very old messages are found. Two concerns are handled:
//   1) TEXT match — case-insensitive substring on the `text` column (ilike).
//   2) MEDIA match — image/video/voice messages often have text = null, so a
//      keyword like "image", "photo", "video", "voice" or "media" matches by
//      the message `type` instead. This never breaks legit null-text messages.
// Results are de-duplicated and returned newest-first.
const MEDIA_SEARCH_KEYWORDS: { types: MessageType[]; words: string[] }[] = [
  { types: ["image"], words: ["image", "images", "photo", "photos", "pic", "pics", "picture", "pictures", "img", "snap", "selfie"] },
  { types: ["video"], words: ["video", "videos", "clip", "clips", "movie", "reel", "reels", "vid"] },
  { types: ["voice"], words: ["voice", "audio", "voicenote", "voicenotes", "recording", "recordings", "vn"] },
  { types: ["gif", "sticker"], words: ["gif", "gifs", "sticker", "stickers"] },
  { types: ["file"], words: ["file", "files", "document", "documents", "doc", "pdf", "zip"] },
  { types: ["image", "video", "voice", "gif", "sticker", "file"], words: ["media", "attachment", "attachments"] },
];

function mediaTypesForQuery(lowerQuery: string): MessageType[] {
  const found = new Set<MessageType>();
  for (const group of MEDIA_SEARCH_KEYWORDS) {
    const hit = group.words.some(
      (w) => lowerQuery === w || lowerQuery.includes(w),
    );
    if (hit) group.types.forEach((t) => found.add(t));
  }
  return Array.from(found);
}

export async function searchMessages(
  rawQuery: string,
  limit: number = 300,
): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured) return [];
  const q = rawQuery.trim();
  if (!q) return [];
  const lower = q.toLowerCase();

  const results = new Map<string, ChatMessage>();

  try {
    // 1) TEXT substring match (case-insensitive). ilike uses % as wildcard.
    const pattern = `%${q}%`;
    const { data: textRows, error: textErr } = await supabase
      .from("chat_messages")
      .select(SELECT_COLS)
      .ilike("text", pattern)
      .order("timestamp", { ascending: false })
      .limit(limit);
    if (textErr) console.warn("[chat] searchMessages text error", textErr);
    (textRows ?? []).forEach((r) => {
      const m = mapRow(r as Record<string, unknown>);
      results.set(m.id, m);
    });

    // 2) MEDIA type match when the query looks like a media keyword.
    const mediaTypes = mediaTypesForQuery(lower);
    if (mediaTypes.length > 0) {
      const { data: mediaRows, error: mediaErr } = await supabase
        .from("chat_messages")
        .select(SELECT_COLS)
        .in("type", mediaTypes)
        .order("timestamp", { ascending: false })
        .limit(limit);
      if (mediaErr) console.warn("[chat] searchMessages media error", mediaErr);
      (mediaRows ?? []).forEach((r) => {
        const m = mapRow(r as Record<string, unknown>);
        results.set(m.id, m);
      });
    }
  } catch (err) {
    console.error("[chat] searchMessages threw", err);
    return [];
  }

  // Newest-first so result #1 is the most recent match.
  return Array.from(results.values()).sort((a, b) => b.timestamp - a.timestamp);
}


function kickPush(id: string, sender: Sender, text: string | null | undefined, type: string) {
  notifyNewMessage({ id, sender, text: text ?? null, type });
}

// ── CREATE (text) ──────────────────────────────────────────────────────────
export async function createMessage(
  text: string,
  sender: Sender,
  sessionId: string,
  reply?: { id: string; snapshot: ReplySnapshot } | null,
): Promise<ChatMessage | null> {
  if (!isSupabaseConfigured) return null;
  const trimmed = text.trim().slice(0, 4000);
  if (!trimmed) return null;
  const id = crypto.randomUUID();
  kickPush(id, sender, trimmed, "text");
  try {
    const payload: Record<string, unknown> = {
      id,
      type: "text",
      text: trimmed,
      sender,
      timestamp: Date.now(),
      session_id: sessionId,
      edited: false,
    };
    if (reply) {
      payload.reply_to_id = reply.id;
      payload.reply_snapshot = reply.snapshot;
    }
    const { data, error } = await supabase
      .from("chat_messages")
      .insert(payload)
      .select(SELECT_COLS)
      .single();
    if (error || !data) {
      console.error("[chat] createMessage error", error);
      return null;
    }
    const savedText = mapRow(data as Record<string, unknown>);
    return savedText;
  } catch (err) {
    console.error("[chat] createMessage threw", err);
    return null;
  }
}

// ── CREATE (media: image, voice, or video) ─────────────────────────────────
export async function createMediaMessage(
  type: "image" | "voice" | "video",
  mediaUrl: string,
  sender: Sender,
  sessionId: string,
  extra: {
    width?: number | null;
    height?: number | null;
    durationMs?: number | null;
    caption?: string | null;
    reply?: { id: string; snapshot: ReplySnapshot } | null;
  } = {},
): Promise<ChatMessage | null> {
  if (!isSupabaseConfigured) return null;
  const id = crypto.randomUUID();
  kickPush(id, sender, extra.caption ?? null, type);
  try {
    const payload: Record<string, unknown> = {
      id,
      type,
      text: extra.caption ? extra.caption.slice(0, 4000) : null,
      sender,
      timestamp: Date.now(),
      session_id: sessionId,
      edited: false,
      media_url: mediaUrl,
      media_width: extra.width ?? null,
      media_height: extra.height ?? null,
      duration_ms: extra.durationMs ?? null,
    };
    if (extra.reply) {
      payload.reply_to_id = extra.reply.id;
      payload.reply_snapshot = extra.reply.snapshot;
    }
    const { data, error } = await supabase
      .from("chat_messages")
      .insert(payload)
      .select(SELECT_COLS)
      .single();
    if (error || !data) {
      console.error("[chat] createMediaMessage error", error);
      return null;
    }
    const savedMedia = mapRow(data as Record<string, unknown>);
    return savedMedia;
  } catch (err) {
    console.error("[chat] createMediaMessage threw", err);
    return null;
  }
}

// ── CREATE (album: 2+ photos in ONE bubble) ─────────────────────────────────
export async function createAlbumMessage(
  items: AlbumItem[],
  sender: Sender,
  sessionId: string,
  reply?: { id: string; snapshot: ReplySnapshot } | null,
): Promise<ChatMessage | null> {
  if (!isSupabaseConfigured) return null;
  const clean = items.filter((it) => it && it.url);
  if (clean.length === 0) return null;
  const id = crypto.randomUUID();
  kickPush(id, sender, null, "image");
  try {
    const first = clean[0];
    const payload: Record<string, unknown> = {
      id,
      type: "image",
      text: null,
      sender,
      timestamp: Date.now(),
      session_id: sessionId,
      edited: false,
      media_url: first.url,
      media_width: first.w ?? null,
      media_height: first.h ?? null,
      // Album payload (see decodeAlbum). Compact keys keep the row small.
      file_name: JSON.stringify(
        clean.map((it) => ({
          url: it.url,
          w: it.w ?? null,
          h: it.h ?? null,
          ...(it.kind === "video" ? { t: "v", d: it.d ?? null } : null),
        })),
      ),
      file_size: clean.length,
      mime_type: ALBUM_MIME,
    };
    if (reply) {
      payload.reply_to_id = reply.id;
      payload.reply_snapshot = reply.snapshot;
    }
    const { data, error } = await supabase
      .from("chat_messages")
      .insert(payload)
      .select(SELECT_COLS)
      .single();
    if (error || !data) {
      console.error("[chat] createAlbumMessage error", error);
      return null;
    }
    const saved = mapRow(data as Record<string, unknown>);
    return saved;
  } catch (err) {
    console.error("[chat] createAlbumMessage threw", err);
    return null;
  }
}

// ── CREATE (sticker / GIF — external URL, nothing uploaded) ─────────────────
export async function createStickerMessage(
  mediaUrl: string,
  sender: Sender,
  sessionId: string,
  extra: {
    width?: number | null;
    height?: number | null;
    kind?: "sticker" | "gif";
    reply?: { id: string; snapshot: ReplySnapshot } | null;
  } = {},
): Promise<ChatMessage | null> {
  if (!isSupabaseConfigured) return null;
  const id = crypto.randomUUID();
  kickPush(id, sender, null, extra.kind ?? "sticker");
  try {
    const payload: Record<string, unknown> = {
      id,
      type: extra.kind ?? "sticker",
      text: null,
      sender,
      timestamp: Date.now(),
      session_id: sessionId,
      edited: false,
      media_url: mediaUrl,
      media_width: extra.width ?? null,
      media_height: extra.height ?? null,
    };
    if (extra.reply) {
      payload.reply_to_id = extra.reply.id;
      payload.reply_snapshot = extra.reply.snapshot;
    }
    const { data, error } = await supabase
      .from("chat_messages")
      .insert(payload)
      .select(SELECT_COLS)
      .single();
    if (error || !data) {
      console.error("[chat] createStickerMessage error", error);
      return null;
    }
    const saved = mapRow(data as Record<string, unknown>);
    return saved;
  } catch (err) {
    console.error("[chat] createStickerMessage threw", err);
    return null;
  }
}

// ── CREATE (file attachment — any document uploaded to storage) ─────────────
export async function createFileMessage(
  mediaUrl: string,
  sender: Sender,
  sessionId: string,
  file: { name: string; size: number; mime: string },
  reply?: { id: string; snapshot: ReplySnapshot } | null,
): Promise<ChatMessage | null> {
  if (!isSupabaseConfigured) return null;
  const id = crypto.randomUUID();
  kickPush(id, sender, file.name, "file");
  try {
    const payload: Record<string, unknown> = {
      id,
      type: "file",
      text: null,
      sender,
      timestamp: Date.now(),
      session_id: sessionId,
      edited: false,
      media_url: mediaUrl,
      file_name: file.name.slice(0, 255),
      file_size: file.size,
      mime_type: file.mime.slice(0, 120) || "application/octet-stream",
    };
    if (reply) {
      payload.reply_to_id = reply.id;
      payload.reply_snapshot = reply.snapshot;
    }
    const { data, error } = await supabase
      .from("chat_messages")
      .insert(payload)
      .select(SELECT_COLS)
      .single();
    if (error || !data) {
      console.error("[chat] createFileMessage error", error);
      return null;
    }
    const saved = mapRow(data as Record<string, unknown>);
    return saved;
  } catch (err) {
    console.error("[chat] createFileMessage threw", err);
    return null;
  }
}

// ── EDIT (text only) ───────────────────────────────────────────────────────
// Anyone on either device can edit any message — this is a two-person
// shared journal, not a permission model.
export async function editMessage(
  id: string,
  text: string,
  _sessionId: string, // kept for API compatibility; no longer used to gate
): Promise<ChatMessage | null> {
  if (!isSupabaseConfigured) return null;
  const trimmed = text.trim().slice(0, 4000);
  if (!trimmed) return null;
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .update({ text: trimmed, edited: true })
      .eq("id", id)
      .select(SELECT_COLS)
      .single();
    if (error || !data) {
      console.warn("[chat] editMessage rejected", error);
      return null;
    }
    return mapRow(data as Record<string, unknown>);
  } catch (err) {
    console.error("[chat] editMessage threw", err);
    return null;
  }
}

// ── REACTIONS ──────────────────────────────────────────────────────────────
/**
 * Toggle a reaction emoji for a message.
 *   - Reactions column stores JSON like { "❤️": ["sess1","sess2"], "🔥": [...] }.
 *   - If the current session hasn't reacted with that emoji, add it.
 *   - If they already reacted with it, remove it.
 *   - Emoji keys with empty arrays are pruned.
 * Returns the new reactions map (or null on failure).
 */
export async function toggleReaction(
  id: string,
  sessionId: string,
  emoji: string,
): Promise<ReactionsMap | null> {
  if (!isSupabaseConfigured) return null;
  try {
    // Read current reactions
    const { data: existing, error: readErr } = await supabase
      .from("chat_messages")
      .select("reactions")
      .eq("id", id)
      .single();
    if (readErr || !existing) {
      console.warn("[chat] toggleReaction read failed", readErr);
      return null;
    }
    const current: ReactionsMap =
      (existing.reactions as ReactionsMap | null | undefined) ?? {};
    const users = new Set<string>(current[emoji] ?? []);
    if (users.has(sessionId)) users.delete(sessionId);
    else users.add(sessionId);
    const next: ReactionsMap = { ...current };
    if (users.size === 0) delete next[emoji];
    else next[emoji] = Array.from(users);
    const { error: writeErr } = await supabase
      .from("chat_messages")
      .update({ reactions: next })
      .eq("id", id);
    if (writeErr) {
      console.warn("[chat] toggleReaction write failed", writeErr);
      return null;
    }
    return next;
  } catch (err) {
    console.error("[chat] toggleReaction threw", err);
    return null;
  }
}

/**
 * Add or remove ONE person's reaction emoji. `mine` lists every key that
 * belongs to this person (their name plus legacy device ids) so old
 * reactions can be removed too. Other emoji from the same person are kept,
 * which allows several different reactions per person.
 */
export async function setMyReaction(
  id: string,
  emoji: string,
  mine: string[],
  me: string,
  add: boolean,
): Promise<ReactionsMap | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: existing, error: readErr } = await supabase
      .from("chat_messages")
      .select("reactions")
      .eq("id", id)
      .single();
    if (readErr || !existing) return null;
    const current: ReactionsMap = (existing.reactions as ReactionsMap | null | undefined) ?? {};
    const users = new Set<string>(current[emoji] ?? []);
    mine.forEach((k) => users.delete(k));
    if (add) users.add(me);
    const next: ReactionsMap = { ...current };
    if (users.size === 0) delete next[emoji];
    else next[emoji] = Array.from(users);
    const { error: writeErr } = await supabase.from("chat_messages").update({ reactions: next }).eq("id", id);
    return writeErr ? null : next;
  } catch {
    return null;
  }
}

// ── DELETE / UNSEND ────────────────────────────────────────────────────────
/**
 * Hard-delete a message. Either partner on either device can unsend any
 * message — this app is a shared journal for two, not a permission model.
 * Storage media (if any) is also removed best-effort.
 */
export async function deleteMessage(
  id: string,
  _sessionId: string, // kept for API compatibility; no longer used to gate
  mediaUrl?: string | null,
  extraMediaUrls?: string[] | null,
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", id);
    if (error) {
      console.warn("[chat] deleteMessage rejected", error);
      return false;
    }
    // Best-effort media cleanup (every photo of an album too)
    const urls = new Set<string>();
    if (mediaUrl) urls.add(mediaUrl);
    (extraMediaUrls ?? []).forEach((u) => { if (u) urls.add(u); });
    urls.forEach((u) => { void deleteMediaByUrl(u); });
    return true;
  } catch (err) {
    console.error("[chat] deleteMessage threw", err);
    return false;
  }
}

// ── STORAGE (media upload) ─────────────────────────────────────────────────
const BUCKET = "chat-media";

function extFromMime(mime: string, fallback: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("heic")) return "heic";
  if (mime.includes("video/webm")) return "webm";
  if (mime.includes("video/mp4")) return "mp4";
  if (mime.includes("video/quicktime")) return "mov";
  if (mime.includes("video/x-matroska")) return "mkv";
  if (mime.includes("video")) return "mp4";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return fallback;
}

export async function uploadChatMedia(
  file: Blob,
  kind: "image" | "voice" | "video" | "file",
  sender: Sender,
  originalName?: string,
): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    if (kind === "file") return uploadChatFile(file, sender, originalName);
    const defaultMime =
      kind === "image" ? "image/jpeg" :
      kind === "video" ? "video/mp4" :
      "audio/webm";
    const rawMime = file.type || defaultMime;
    // Strip codec parameters ("audio/webm;codecs=opus" → "audio/webm").
    // Some CDNs and browsers refuse to stream media whose stored
    // Content-Type carries codec suffixes, causing silent playback.
    const mime = rawMime.split(";")[0].trim() || defaultMime;
    const fallbackExt =
      kind === "image" ? "jpg" :
      kind === "video" ? "mp4" :
      "webm";
    const ext = extFromMime(mime, fallbackExt);
    const rand = Math.random().toString(36).slice(2, 10);
    const path = `${kind}/${sender}/${Date.now()}-${rand}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: mime,
      upsert: false,
      cacheControl: "31536000",
    });
    if (error) {
      console.error("[chat] uploadChatMedia error", error);
      return null;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch (err) {
    console.error("[chat] uploadChatMedia threw", err);
    return null;
  }
}

/** Sanitise a user filename for a storage object key (keeps the extension). */
function safeFileName(name: string): string {
  const base = (name || "file").split(/[\\/]/).pop() || "file";
  return base.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 120) || "file";
}

async function uploadChatFile(
  file: Blob,
  sender: Sender,
  originalName?: string,
): Promise<string | null> {
  try {
    const name = safeFileName(originalName || (file as File).name || "file");
    const mime = (file.type || "application/octet-stream").split(";")[0].trim();
    const rand = Math.random().toString(36).slice(2, 8);
    const path = `file/${sender}/${Date.now()}-${rand}-${name}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: mime,
      upsert: false,
      cacheControl: "31536000",
    });
    if (error) {
      console.error("[chat] uploadChatFile error", error);
      return null;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch (err) {
    console.error("[chat] uploadChatFile threw", err);
    return null;
  }
}

/** Max object size accepted by the bucket (Supabase free tier hard limit). */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Best-effort deletion of a media object given its public URL. */
async function deleteMediaByUrl(publicUrl: string): Promise<void> {
  try {
    // Public URL format: <base>/storage/v1/object/public/chat-media/<path>
    const marker = `/object/public/${BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx < 0) return;
    const path = publicUrl.slice(idx + marker.length);
    if (!path) return;
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    /* ignore */
  }
}

// ── REALTIME (postgres changes) ────────────────────────────────────────────
export type ChatChangeHandler = (event: {
  type: "INSERT" | "UPDATE" | "DELETE";
  message: ChatMessage;
}) => void;

export function subscribeToChat(handler: ChatChangeHandler): () => void {
  if (!isSupabaseConfigured) return () => {};
  const channel = supabase
    .channel("chat_messages_stream")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages" },
      (payload) => {
        handler({
          type: "INSERT",
          message: mapRow(payload.new as Record<string, unknown>),
        });
      },
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "chat_messages" },
      (payload) => {
        handler({
          type: "UPDATE",
          message: mapRow(payload.new as Record<string, unknown>),
        });
      },
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "chat_messages" },
      (payload) => {
        handler({
          type: "DELETE",
          message: mapRow(payload.old as Record<string, unknown>),
        });
      },
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch {
      /* ignore */
    }
  };
}

// ── REALTIME (typing indicator via broadcast) ──────────────────────────────
export interface TypingEvent {
  sender: Sender;
  sessionId: string;
  isTyping: boolean;
  ts: number;
}

// Supabase Realtime broadcast is scoped by channel name — sender + receiver
// MUST use the same name. We also enable `self: true` so a single tab can
// receive its own broadcasts (needed when the user switches personas mid-
// conversation to test both sides). The receiving handler in the UI filters
// out events whose `sender` matches the current persona so people never see
// their own typing bubble.
const TYPING_CHANNEL_NAME = "chat_typing";

// Registry of receive-side subscribers. We publish on the same channel used
// for subscription, keeping everything on one channel per tab.
const typingListeners = new Set<(e: TypingEvent) => void>();
let sharedTypingChannel: RealtimeChannel | null = null;

function ensureSharedTypingChannel(): RealtimeChannel | null {
  if (!isSupabaseConfigured) return null;
  if (sharedTypingChannel) return sharedTypingChannel;
  const ch = supabase.channel(TYPING_CHANNEL_NAME, {
    config: { broadcast: { self: true, ack: false } },
  });
  ch.on("broadcast", { event: "typing" }, ({ payload }) => {
    const ev = payload as TypingEvent;
    typingListeners.forEach((fn) => {
      try { fn(ev); } catch { /* noop */ }
    });
  });
  ch.subscribe();
  sharedTypingChannel = ch;
  return ch;
}

export function broadcastTyping(
  sender: Sender,
  sessionId: string,
  isTyping: boolean,
): void {
  const ch = ensureSharedTypingChannel();
  if (!ch) return;
  try {
    void ch.send({
      type: "broadcast",
      event: "typing",
      payload: { sender, sessionId, isTyping, ts: Date.now() } as TypingEvent,
    });
  } catch {
    /* ignore */
  }
}

export function subscribeToTyping(
  handler: (e: TypingEvent) => void,
): () => void {
  if (!isSupabaseConfigured) return () => {};
  ensureSharedTypingChannel();
  typingListeners.add(handler);
  return () => {
    typingListeners.delete(handler);
  };
}
