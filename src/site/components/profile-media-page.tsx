// ─────────────────────────────────────────────────────────────────────────────
//  ProfileMediaPage — Instagram-style shared-media page for the chat.
//
//  PERSISTENT & COMPLETE: this page reads straight from the database
//  (`listMedia`, keyset-paginated, newest first) instead of the ~300-message
//  window the chat keeps in memory. That window is why media used to "vanish"
//  from here after a day — the files were always safe in storage. Every photo,
//  video, GIF, sticker, file and voice note ever shared shows up here, loading
//  progressively as you scroll.
//
//  Tabs: All · Photos · Videos · GIFs · Stickers · Files · Voice.
//  Tap a tile → full-screen swipeable viewer with Download. Every tile also has
//  a quick ⤓ button so a single tap saves the original file.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "@/site/lib/haptics.ts";
import {
  listMedia,
  countMedia,
  type ChatMessage,
  type MediaFilter,
} from "@/site/lib/cloud-chat.ts";
import { downloadMedia, fileGlyph, formatBytes, type DownloadKind } from "@/site/lib/download.ts";
import { getNames, useNames } from "@/site/lib/names.ts";

export interface MediaEntry {
  id: string;
  url: string;
  type: DownloadKind;
  ts: number;
  sender: string;
  fileName?: string | null;
  fileSize?: number | null;
  mime?: string | null;
  durationMs?: number | null;
  width?: number | null;
  height?: number | null;
}

const TABS: { id: MediaFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "image", label: "Photos" },
  { id: "video", label: "Videos" },
  { id: "gif", label: "GIFs" },
  { id: "sticker", label: "Stickers" },
  { id: "file", label: "Files" },
  { id: "voice", label: "Voice" },
];

function toEntry(m: ChatMessage): MediaEntry | null {
  if (!m.mediaUrl) return null;
  const t = m.type;
  if (t !== "image" && t !== "video" && t !== "gif" && t !== "sticker" && t !== "file" && t !== "voice") return null;
  return {
    id: m.id,
    url: m.mediaUrl,
    type: t,
    ts: m.timestamp,
    sender: m.sender,
    fileName: m.fileName ?? null,
    fileSize: m.fileSize ?? null,
    mime: m.mimeType ?? null,
    durationMs: m.durationMs ?? null,
    width: m.mediaWidth ?? null,
    height: m.mediaHeight ?? null,
  };
}

/**
 * One message → one or MANY gallery entries: a multi-photo album expands to
 * every photo it contains (each gets a stable `${id}#${i}` key and shares
 * the message's timestamp/sender), so the grid shows the whole set.
 */
function toEntries(m: ChatMessage): MediaEntry[] {
  const base = toEntry(m);
  if (!base) return [];
  if (m.type === "image" && m.albumItems && m.albumItems.length > 1) {
    return m.albumItems.map((it, i) => ({
      ...base,
      id: `${m.id}#${i}`,
      url: it.url,
      type: it.kind === "video" ? ("video" as const) : base.type,
      durationMs: it.kind === "video" ? (it.d ?? null) : base.durationMs,
      width: it.w ?? null,
      height: it.h ?? null,
    }));
  }
  return [base];
}

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const fmtDur = (ms?: number | null) => {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function ProfileMediaPage({
  open,
  dark,
  onClose,
}: {
  open: boolean;
  dark: boolean;
  /** Kept for API compatibility — the gallery no longer depends on it. */
  messages?: ChatMessage[];
  onClose: () => void;
}) {
  const names = useNames();
  const [tab, setTab] = useState<MediaFilter>("image");
  const [items, setItems] = useState<MediaEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState<Record<MediaFilter, number> | null>(null);
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const reqRef = useRef(0);
  const moreRef = useRef(false);

  const bg = dark ? "#0e0e0e" : "#fff";
  const fg = dark ? "#f0f0f0" : "#7a2040";
  const tile = dark ? "rgba(255,255,255,0.06)" : "rgba(201,24,74,0.06)";

  // First page for the active tab.
  const loadFirst = useCallback(async (filter: MediaFilter) => {
    const id = ++reqRef.current;
    setLoading(true);
    setError("");
    const r = await listMedia(filter, null);
    if (id !== reqRef.current) return;
    if (!r) {
      setError("Couldn’t load media. Check your connection and try again.");
      setItems([]);
      setHasMore(false);
    } else {
      setItems(r.items.flatMap(toEntries));
      setHasMore(r.hasMore);
      scrollRef.current?.scrollTo({ top: 0 });
    }
    setLoading(false);
  }, []);

  const loadMore = useCallback(async () => {
    if (moreRef.current || loading || !hasMore || items.length === 0) return;
    moreRef.current = true;
    setLoadingMore(true);
    const id = reqRef.current;
    const oldest = items[items.length - 1].ts;
    const r = await listMedia(tab, oldest);
    if (id === reqRef.current && r) {
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const fresh = r.items.flatMap(toEntries).filter((x) => !seen.has(x.id));
        return fresh.length ? [...prev, ...fresh] : prev;
      });
      setHasMore(r.hasMore);
    }
    moreRef.current = false;
    setLoadingMore(false);
  }, [tab, items, hasMore, loading]);

  useEffect(() => {
    if (!open) return;
    void loadFirst(tab);
  }, [open, tab, loadFirst]);

  useEffect(() => {
    if (!open) return;
    void countMedia().then((c) => c && setCounts(c));
  }, [open]);

  // Infinite scroll sentinel.
  useEffect(() => {
    if (!open || !hasMore) return;
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;
    const io = new IntersectionObserver(
      (es) => { if (es.some((e) => e.isIntersecting)) void loadMore(); },
      { root, rootMargin: "0px 0px 600px 0px" },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [open, hasMore, loadMore]);

  const openViewer = useCallback((i: number) => {
    haptics.light();
    setViewerIdx(i);
  }, []);

  if (!open) return null;

  const summary = counts
    ? `${counts.image} photos · ${counts.video} videos · ${counts.gif + counts.sticker} GIFs & stickers · ${counts.file} files`
    : "Loading your memories…";

  return createPortal(
    <motion.div
      data-testid="profile-media-page"
      className="fixed inset-0 z-[82] flex flex-col"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }}
      style={{ background: bg }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "calc(env(safe-area-inset-top,0px) + 14px) 16px 14px",
          background: "linear-gradient(135deg,#ff8fab,#ff4d7a,#c9184a)",
          color: "white",
          flexShrink: 0,
        }}
      >
        <button
          data-testid="profile-close-btn"
          onClick={() => { haptics.light(); onClose(); }}
          aria-label="Close"
          style={{ background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.4)", color: "white", width: 36, height: 36, borderRadius: 999, fontSize: 18, cursor: "pointer", flexShrink: 0 }}
        >
          ‹
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontFamily: "'Great Vibes', cursive", fontSize: 24, lineHeight: 1.1 }} data-testid="profile-media-title">{names.habiba} &amp; {names.faizan}</p>
          <p data-testid="profile-media-summary" style={{ margin: 0, fontSize: 12, opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{summary}</p>
        </div>
      </div>

      {/* Tabs (horizontally scrollable on narrow screens) */}
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          overflowX: "auto",
          scrollbarWidth: "none",
          borderBottom: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,150,180,0.28)",
        }}
      >
        {TABS.map((t) => {
          const n = counts?.[t.id];
          return (
            <button
              key={t.id}
              data-testid={`profile-tab-${t.id}`}
              onClick={() => { haptics.light(); setTab(t.id); }}
              style={{
                flex: "1 0 auto",
                minWidth: 76,
                padding: "12px 10px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: tab === t.id ? "#c9184a" : fg,
                opacity: tab === t.id ? 1 : 0.55,
                borderBottom: tab === t.id ? "2px solid #c9184a" : "2px solid transparent",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
              {typeof n === "number" && (
                <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.8 }}>{n}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div ref={scrollRef} data-testid="profile-media-scroll" style={{ flex: 1, overflowY: "auto", padding: 3, overscrollBehavior: "contain" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: fg, opacity: 0.6 }}>Loading…</div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: "center", color: "#c9184a", fontSize: 14 }}>
            {error}
            <div>
              <button onClick={() => void loadFirst(tab)} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 999, border: "none", background: "linear-gradient(135deg,#ff6b9d,#c9184a)", color: "white", fontWeight: 700, cursor: "pointer" }}>Retry</button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: fg, opacity: 0.6 }}>
            Nothing here yet
          </div>
        ) : tab === "file" || tab === "voice" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 6 }}>
            {items.map((m, i) => (
              <FileRow key={m.id} entry={m} fg={fg} tile={tile} onOpen={() => openViewer(i)} />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(33.33%, 180px), 1fr))",
              gap: 3,
            }}
          >
            {items.map((m, i) => (
              <Tile key={m.id} entry={m} tile={tile} onOpen={() => openViewer(i)} />
            ))}
          </div>
        )}
        <div ref={sentinelRef} style={{ height: 1 }} />
        {loadingMore && (
          <div data-testid="profile-media-loading-more" style={{ padding: 16, textAlign: "center", color: fg, opacity: 0.6, fontSize: 13 }}>Loading more…</div>
        )}
        {!loading && !hasMore && items.length > 0 && (
          <div data-testid="profile-media-end" style={{ padding: "16px 0 24px", textAlign: "center", color: fg, opacity: 0.45, fontSize: 12 }}>
            That’s everything — {items.length} item{items.length === 1 ? "" : "s"} ✨
          </div>
        )}
      </div>

      {/* Full-screen swipeable viewer */}
      <AnimatePresence>
        {viewerIdx !== null && items[viewerIdx] && (
          <MediaViewer
            entries={items}
            index={viewerIdx}
            onIndex={setViewerIdx}
            onClose={() => setViewerIdx(null)}
            onNeedMore={() => { if (hasMore) void loadMore(); }}
          />
        )}
      </AnimatePresence>
    </motion.div>,
    document.body,
  );
}

// ── Tile (photos / videos / gifs / stickers) ────────────────────────────────
function Tile({ entry, tile, onOpen }: { entry: MediaEntry; tile: string; onOpen: () => void }) {
  const isSticker = entry.type === "sticker";
  return (
    <div style={{ position: "relative", aspectRatio: "1 / 1", background: tile, overflow: "hidden" }}>
      <motion.button
        data-testid="profile-media-cell"
        onClick={onOpen}
        whileTap={{ scale: 0.96 }}
        style={{ width: "100%", height: "100%", border: "none", padding: isSticker ? 8 : 0, cursor: "pointer", background: "transparent", display: "block" }}
      >
        {entry.type === "video" ? (
          <>
            <video src={entry.url} muted playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <span style={{ position: "absolute", top: 6, right: 6, color: "white", fontSize: 14, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>▶</span>
            {entry.durationMs ? (
              <span style={{ position: "absolute", bottom: 6, right: 6, color: "white", fontSize: 11, background: "rgba(0,0,0,0.5)", padding: "1px 6px", borderRadius: 6 }}>{fmtDur(entry.durationMs)}</span>
            ) : null}
          </>
        ) : (
          <img
            src={entry.url}
            alt=""
            loading="lazy"
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: isSticker ? "contain" : "cover", display: "block" }}
          />
        )}
        {entry.type === "gif" && (
          <span style={{ position: "absolute", bottom: 6, left: 6, color: "white", fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", background: "rgba(0,0,0,0.55)", padding: "2px 5px", borderRadius: 5 }}>GIF</span>
        )}
      </motion.button>
      <button
        data-testid="profile-media-download"
        aria-label="Download"
        title="Download"
        onClick={(e) => { e.stopPropagation(); haptics.light(); void downloadMedia(entry.url, entry.type, { mime: entry.mime, ts: entry.ts }); }}
        style={{ position: "absolute", bottom: 6, right: entry.type === "video" && entry.durationMs ? 46 : 6, width: 26, height: 26, borderRadius: 999, border: "none", background: "rgba(0,0,0,0.5)", color: "white", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
      >
        ⤓
      </button>
    </div>
  );
}

// ── Row (files / voice notes) ───────────────────────────────────────────────
function FileRow({ entry, fg, tile, onOpen }: { entry: MediaEntry; fg: string; tile: string; onOpen: () => void }) {
  const isVoice = entry.type === "voice";
  const name = entry.fileName || (isVoice ? `Voice note ${fmtDur(entry.durationMs)}` : "File");
  const meta = [formatBytes(entry.fileSize), fmtDate(entry.ts), (getNames() as Record<string, string>)[entry.sender]].filter(Boolean).join(" · ");
  return (
    <div
      data-testid="profile-media-row"
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14, background: tile, color: fg }}
    >
      <button
        onClick={onOpen}
        aria-label="Open"
        style={{ width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer", fontSize: 22, background: "linear-gradient(135deg,#ff6b9d,#c9184a)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
      >
        {isVoice ? "🎙️" : fileGlyph(entry.mime, entry.fileName)}
      </button>
      <button onClick={onOpen} style={{ flex: 1, minWidth: 0, textAlign: "left", border: "none", background: "transparent", color: fg, cursor: "pointer", padding: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        <div style={{ fontSize: 11.5, opacity: 0.65, marginTop: 2 }}>{meta}</div>
      </button>
      <button
        data-testid="profile-media-download"
        aria-label="Download"
        title="Download"
        onClick={() => { haptics.light(); void downloadMedia(entry.url, entry.type, { filename: entry.fileName, mime: entry.mime, ts: entry.ts }); }}
        style={{ width: 36, height: 36, borderRadius: 999, border: "1px solid rgba(201,24,74,0.35)", background: "transparent", color: "#c9184a", fontSize: 17, cursor: "pointer", flexShrink: 0 }}
      >
        ⤓
      </button>
    </div>
  );
}

// ── Viewer ──────────────────────────────────────────────────────────────────
function MediaViewer({
  entries,
  index,
  onIndex,
  onClose,
  onNeedMore,
}: {
  entries: MediaEntry[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  onNeedMore: () => void;
}) {
  const entry = entries[index];
  const go = (dir: number) => {
    const next = index + dir;
    if (next < 0 || next >= entries.length) return;
    haptics.light();
    onIndex(next);
    if (next >= entries.length - 3) onNeedMore();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, entries.length]); // go/onClose are stable per render of these deps


  const caption = `${(getNames() as Record<string, string>)[entry.sender] ?? ""} · ${fmtDate(entry.ts)}`;

  return (
    <motion.div
      data-testid="media-viewer"
      className="fixed inset-0 z-[90] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: "rgba(0,0,0,0.96)" }}
      onClick={onClose}
    >
      <motion.div
        key={entry.id}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        onDragEnd={(_e, info) => {
          if (info.offset.x < -80) go(1);
          else if (info.offset.x > 80) go(-1);
        }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "100%", maxHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px" }}
      >
        {entry.type === "video" ? (
          <video src={entry.url} controls autoPlay playsInline style={{ maxWidth: "100vw", maxHeight: "84vh", borderRadius: 8 }} />
        ) : entry.type === "voice" ? (
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: 24, color: "white", textAlign: "center", minWidth: 260 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎙️</div>
            <audio src={entry.url} controls autoPlay style={{ width: "100%" }} />
          </div>
        ) : entry.type === "file" ? (
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: 28, color: "white", textAlign: "center", maxWidth: 360 }}>
            <div style={{ fontSize: 56, marginBottom: 10 }}>{fileGlyph(entry.mime, entry.fileName)}</div>
            <div style={{ fontSize: 16, fontWeight: 700, wordBreak: "break-word" }}>{entry.fileName || "File"}</div>
            <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 4 }}>{[formatBytes(entry.fileSize), entry.mime].filter(Boolean).join(" · ")}</div>
            <button
              data-testid="viewer-file-download"
              onClick={() => { haptics.light(); void downloadMedia(entry.url, "file", { filename: entry.fileName, mime: entry.mime, ts: entry.ts }); }}
              style={{ marginTop: 18, padding: "11px 22px", borderRadius: 999, border: "none", background: "linear-gradient(135deg,#ff6b9d,#c9184a)", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              ⤓ Download
            </button>
          </div>
        ) : (
          <img src={entry.url} alt="" style={{ maxWidth: "100vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 8 }} />
        )}
      </motion.div>

      {/* Controls */}
      <button data-testid="viewer-close" onClick={onClose} aria-label="Close" style={ctrl({ top: "max(20px,env(safe-area-inset-top))", left: 16 })}>✕</button>
      <button
        data-testid="viewer-download"
        onClick={(e) => { e.stopPropagation(); haptics.light(); void downloadMedia(entry.url, entry.type, { filename: entry.fileName, mime: entry.mime, ts: entry.ts }); }}
        aria-label="Download"
        title="Download"
        style={ctrl({ top: "max(20px,env(safe-area-inset-top))", right: 16 })}
      >⤓</button>

      {index > 0 && (
        <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous" style={ctrl({ left: 12, top: "50%" })}>‹</button>
      )}
      {index < entries.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next" style={ctrl({ right: 12, top: "50%" })}>›</button>
      )}
      <div style={{ position: "absolute", bottom: "calc(20px + env(safe-area-inset-bottom))", left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.85)", fontSize: 13, textAlign: "center", whiteSpace: "nowrap" }}>
        <div>{index + 1} / {entries.length}</div>
        <div style={{ fontSize: 11.5, opacity: 0.7, marginTop: 2 }}>{caption}</div>
      </div>
    </motion.div>
  );
}

function ctrl(pos: React.CSSProperties): React.CSSProperties {
  return {
    position: "absolute",
    ...pos,
    width: 42,
    height: 42,
    borderRadius: 999,
    background: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "white",
    fontSize: 20,
    cursor: "pointer",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  };
}
