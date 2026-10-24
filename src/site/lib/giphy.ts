// ─────────────────────────────────────────────────────────────────────────────
//  GIPHY client — browser-direct (per GIPHY rules: do NOT proxy/cache media URLs).
//  Used by the sticker/GIF panel. Key is a VITE_ var (browser-safe beta key).
//  Beta key = 100 API calls/hour → we only fetch on tab open / explicit search
//  and debounce typing, never poll.
// ─────────────────────────────────────────────────────────────────────────────

export type GiphyKind = "gifs" | "stickers";
export type GiphyRating = "g" | "pg" | "pg-13" | "r";

type Rendition = { url: string; webp?: string; width?: string; height?: string };

export interface GiphyItem {
  id: string;
  title?: string;
  rating?: string;
  url: string;
  alt_text?: string;
  images: Record<string, Rendition>;
}

interface GiphyResponse {
  data: GiphyItem[];
  pagination?: { offset: number; count: number; total_count?: number };
  meta: { status: number; msg: string; response_id?: string };
}

const API = "https://api.giphy.com/v1";
// Primary key (used for GIFs). GIPHY dashboard app: "chat".
// Fallback is the key already shipped in the previous public build.
const KEY =
  (import.meta.env.VITE_GIPHY_API_KEY as string | undefined)?.trim() ||
  "dcQl6lWN65C69fJTsrRVmtEx1IrVCEyp";
// Optional dedicated key for stickers (GIPHY dashboard app: "stickers").
// Falls back to the primary key so a single key still works for both tabs.
const STICKERS_KEY =
  (import.meta.env.VITE_GIPHY_STICKERS_API_KEY as string | undefined)?.trim() || KEY;

export const isGiphyConfigured = Boolean(KEY);

const keyFor = (kind: GiphyKind) => (kind === "stickers" ? STICKERS_KEY : KEY);

/** Best display URL for an item (prefer small animated webp, then gif, then original). */
export function giphyPreviewUrl(item: GiphyItem): string {
  const fw = item.images.fixed_width;
  return (
    fw?.webp ||
    fw?.url ||
    item.images.fixed_height?.url ||
    item.images.original?.url ||
    ""
  );
}

/** Full-size URL to actually send into the chat (keeps animation, unmodified). */
export function giphySendUrl(item: GiphyItem): string {
  return (
    item.images.original?.url ||
    item.images.fixed_width?.url ||
    giphyPreviewUrl(item)
  );
}

// ── Rate-limit bookkeeping ───────────────────────────────────────────────────
// Beta keys allow 100 calls per rolling hour. The browser can't read GIPHY's
// rate-limit headers (CORS), so we log our own call timestamps per key in
// localStorage. When a 429 arrives, the earliest call still inside the window
// tells us when a slot frees up → accurate countdown instead of a guess.
const WINDOW_MS = 60 * 60 * 1000;
const FALLBACK_COOLDOWN_MS = 5 * 60 * 1000;
const LOG_PREFIX = "giphy:calls:";
const LIMIT_PREFIX = "giphy:limitUntil:";

export class GiphyRateLimitError extends Error {
  retryAt: number;
  constructor(retryAt: number) {
    super("GIPHY hourly limit reached.");
    this.name = "GiphyRateLimitError";
    this.retryAt = retryAt;
  }
}

const safeGet = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const safeSet = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* private mode / quota — best-effort only */
  }
};

const keyTag = (key: string) => key.slice(-6);

function recordCall(key: string) {
  const now = Date.now();
  const prev = (JSON.parse(safeGet(LOG_PREFIX + keyTag(key)) ?? "[]") as number[]).filter(
    (t) => now - t < WINDOW_MS,
  );
  prev.push(now);
  safeSet(LOG_PREFIX + keyTag(key), JSON.stringify(prev.slice(-120)));
}

function estimateRetryAt(key: string): number {
  const now = Date.now();
  const calls = (JSON.parse(safeGet(LOG_PREFIX + keyTag(key)) ?? "[]") as number[])
    .filter((t) => now - t < WINDOW_MS)
    .sort((a, b) => a - b);
  // Oldest call inside the window + 1h = when the next slot frees up.
  const guess = calls.length ? calls[0] + WINDOW_MS : now + FALLBACK_COOLDOWN_MS;
  // Clamp to a sane range so a bad clock can't produce a 0s or 3h countdown.
  return Math.min(Math.max(guess, now + 30_000), now + WINDOW_MS);
}

/** If we already know this kind's key is rate-limited, returns the epoch ms it clears; else 0. */
export function giphyRateLimitedUntil(kind: GiphyKind): number {
  const until = Number(safeGet(LIMIT_PREFIX + keyTag(keyFor(kind))) ?? 0);
  return until > Date.now() ? until : 0;
}

async function get<T>(
  kind: GiphyKind,
  path: string,
  params: Record<string, string | number>,
): Promise<T> {
  const key = keyFor(kind);
  if (!key) throw new Error("GIF search isn’t configured.");
  const knownUntil = giphyRateLimitedUntil(kind);
  if (knownUntil) throw new GiphyRateLimitError(knownUntil);

  const qs = new URLSearchParams({ api_key: key });
  Object.entries(params).forEach(([k, v]) => qs.set(k, String(v)));
  recordCall(key);
  const res = await fetch(`${API}${path}?${qs.toString()}`);
  const body = (await res.json().catch(() => null)) as GiphyResponse | null;
  if (!res.ok || body?.meta?.status !== 200) {
    if (res.status === 429 || body?.meta?.status === 429) {
      const retryAt = estimateRetryAt(key);
      safeSet(LIMIT_PREFIX + keyTag(key), String(retryAt));
      throw new GiphyRateLimitError(retryAt);
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("GIPHY API key is invalid or not authorized.");
    }
    throw new Error(body?.meta?.msg ?? `GIPHY request failed (${res.status})`);
  }
  return body as unknown as T;
}

export const GIPHY_PAGE_SIZE = 24;

const paging = (offset: number, rating: GiphyRating) => ({
  limit: GIPHY_PAGE_SIZE,
  offset,
  rating,
  bundle: "messaging_non_clips",
});

export const giphy = {
  trending: (kind: GiphyKind, offset = 0, rating: GiphyRating = "pg") =>
    get<GiphyResponse>(kind, `/${kind}/trending`, paging(offset, rating)),
  search: (kind: GiphyKind, q: string, offset = 0, rating: GiphyRating = "pg") =>
    get<GiphyResponse>(kind, `/${kind}/search`, {
      ...paging(offset, rating),
      q: q.trim().slice(0, 50),
    }),
};
