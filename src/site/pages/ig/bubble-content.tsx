// The inside of a message: text, jumbo emoji, photo, video, grouped stack,
// sticker, GIF, voice note or file.
import { memo, type ReactNode } from "react";
import type { AlbumItem, ChatMessage } from "@/site/lib/cloud-chat.ts";
import { emojiOnlyCount, jumboFontSize } from "@/site/lib/emoji.ts";
import { downloadMedia, fileGlyph, formatBytes } from "@/site/lib/download.ts";
import { haptics } from "@/site/lib/haptics.ts";
import VoiceBubble from "./voice-bubble.tsx";
import { IconDownload, IconLayers, IconPlay } from "./icons.tsx";
import { fmtDuration } from "./util.ts";

export interface ViewerItem {
  url: string;
  kind: "image" | "video" | "gif" | "sticker";
  w?: number | null;
  h?: number | null;
}
export type OpenMedia = (items: ViewerItem[], index: number, rect: DOMRect | null, ts: number) => void;

/** Emoji-only messages render big and bubble-less, however many there are. */
export function jumboSize(msg: ChatMessage): number {
  if (msg.type !== "text") return 0;
  return jumboFontSize(emojiOnlyCount(msg.text));
}

/** True when the content renders without a coloured bubble. */
export function isBare(msg: ChatMessage): boolean {
  return (
    msg.type === "sticker" ||
    msg.type === "gif" ||
    msg.type === "image" ||
    msg.type === "video" ||
    jumboSize(msg) > 0
  );
}

/**
 * Drawings (Doodle → "Draw") are uploaded through the same storage path as
 * photos (`chat-media/image/...`) but saved as `type: "sticker"` so they get
 * the bare, no-bubble-chrome rendering of a sticker. Real stickers/GIFs come
 * either from an external CDN (GIPHY) or the `sticker/custom/` prefix, so
 * this check never collides with either — no DB migration needed to tell
 * "I drew this" apart from "I sent a sticker".
 */
export function isDrawingMedia(url?: string | null): boolean {
  return !!url && url.includes("/chat-media/image/");
}
export function isDrawingMessage(msg: ChatMessage): boolean {
  return msg.type === "sticker" && isDrawingMedia(msg.mediaUrl);
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlight(text: string, term: string): ReactNode {
  const q = term.trim();
  if (!q) return text;
  const parts = text.split(new RegExp(`(${escapeRe(q)})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="ig-mark">{p}</mark>
    ) : (
      p
    ),
  );
}

function boxFor(w?: number | null, h?: number | null, maxW = 216, maxH = 300) {
  const aspect = w && h ? w / h : 3 / 4;
  let bw = maxW;
  let bh = Math.round(bw / aspect);
  if (bh > maxH) { bh = maxH; bw = Math.max(150, Math.round(bh * aspect)); }
  if (bh < 130) bh = 130;
  return { width: bw, height: bh };
}

const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.dataset.loaded = ""; };

function Photo({ url, w, h, onOpen }: { url: string; w?: number | null; h?: number | null; onOpen: (r: DOMRect) => void }) {
  return (
    <button type="button" className="ig-media" style={boxFor(w, h)} onClick={(e) => onOpen(e.currentTarget.getBoundingClientRect())} data-testid="chat-photo">
      <img src={url} alt="" loading="lazy" decoding="async" onLoad={onImgLoad} draggable={false} />
    </button>
  );
}

function VideoThumb({ url, w, h, durationMs, onOpen, small }: { url: string; w?: number | null; h?: number | null; durationMs?: number | null; onOpen?: (r: DOMRect) => void; small?: boolean }) {
  const src = url.startsWith("blob:") ? url : `${url}#t=0.1`;
  const inner = (
    <>
      <video src={src} preload="metadata" muted playsInline tabIndex={-1} />
      <span className="ig-media-play" aria-hidden><IconPlay size={small ? 16 : 22} /></span>
      {durationMs ? <span className="ig-media-dur">{fmtDuration(durationMs)}</span> : null}
    </>
  );
  if (!onOpen) return <div className="ig-media ig-media-video">{inner}</div>;
  return (
    <button type="button" className="ig-media ig-media-video" style={boxFor(w, h)} onClick={(e) => onOpen(e.currentTarget.getBoundingClientRect())} data-testid="chat-video-bubble">
      {inner}
    </button>
  );
}

function GroupStack({ items, mine, progress, onOpen }: { items: AlbumItem[]; mine: boolean; progress?: { done: number; total: number } | null; onOpen: (r: DOMRect) => void }) {
  const back = items.slice(1, 3);
  return (
    <button
      type="button"
      className="ig-stack"
      data-side={mine ? "out" : "in"}
      onClick={(e) => onOpen(e.currentTarget.getBoundingClientRect())}
      data-testid="chat-media-group"
      aria-label={`${items.length} photos and videos`}
    >
      {back.map((it, i) => (
        <span key={i} className={`ig-stack-card ig-stack-back${i}`}>
          {it.kind === "video" ? <VideoThumb url={it.url} small /> : <img src={it.url} alt="" loading="lazy" decoding="async" onLoad={onImgLoad} draggable={false} />}
        </span>
      ))}
      <span className="ig-stack-card ig-stack-front">
        {items[0].kind === "video" ? <VideoThumb url={items[0].url} small /> : <img src={items[0].url} alt="" loading="lazy" decoding="async" onLoad={onImgLoad} draggable={false} />}
        <span className="ig-stack-count"><IconLayers size={14} /> {items.length}</span>
        {progress && (
          <span className="ig-stack-progress">
            <span style={{ transform: `scaleX(${progress.total ? progress.done / progress.total : 0})` }} />
          </span>
        )}
      </span>
    </button>
  );
}

function FileCard({ msg, uploading }: { msg: ChatMessage; uploading: boolean }) {
  const meta = [formatBytes(msg.fileSize), (msg.mimeType || "").split("/")[1]?.toUpperCase()].filter(Boolean).join(" · ");
  return (
    <div className="ig-file" data-testid="chat-file-media">
      <span className="ig-file-icon">{uploading ? "…" : fileGlyph(msg.mimeType, msg.fileName)}</span>
      <span className="ig-file-text">
        <span className="ig-file-name">{msg.fileName || "File"}</span>
        <span className="ig-file-meta">{uploading ? "Uploading…" : meta}</span>
      </span>
      <button
        type="button"
        className="ig-file-dl"
        disabled={uploading}
        aria-label="Download file"
        data-testid="chat-file-download"
        onClick={(e) => { e.stopPropagation(); haptics.light(); void downloadMedia(msg.mediaUrl!, "file", { filename: msg.fileName, mime: msg.mimeType, ts: msg.timestamp }); }}
      >
        <IconDownload size={18} />
      </button>
    </div>
  );
}

interface Props {
  msg: ChatMessage;
  mine: boolean;
  term: string;
  uploading: boolean;
  progress?: { done: number; total: number } | null;
  compressPct?: number | null;
  onOpenMedia: OpenMedia;
}

function BubbleContent({ msg, mine, term, uploading, progress, compressPct, onOpenMedia }: Props) {
  const open = (items: ViewerItem[], i: number) => (r: DOMRect) => onOpenMedia(items, i, r, msg.timestamp);
  const jumbo = jumboSize(msg);
  let body: ReactNode = null;

  if (msg.type === "text") {
    body = jumbo ? (
      <p className="ig-jumbo" style={{ fontSize: jumbo }}>{msg.text}</p>
    ) : (
      <p className="ig-text">{highlight(msg.text ?? "", term)}</p>
    );
  } else if (msg.type === "image" && msg.albumItems && msg.albumItems.length > 1) {
    const items: ViewerItem[] = msg.albumItems.map((it) => ({ url: it.url, kind: it.kind === "video" ? "video" : "image", w: it.w, h: it.h }));
    body = <GroupStack items={msg.albumItems} mine={mine} progress={progress} onOpen={open(items, 0)} />;
  } else if (msg.type === "image" && msg.mediaUrl) {
    body = <Photo url={msg.mediaUrl} w={msg.mediaWidth} h={msg.mediaHeight} onOpen={open([{ url: msg.mediaUrl, kind: "image", w: msg.mediaWidth, h: msg.mediaHeight }], 0)} />;
  } else if (msg.type === "video" && msg.mediaUrl) {
    body = (
      <div style={{ position: "relative" }}>
        <VideoThumb url={msg.mediaUrl} w={msg.mediaWidth} h={msg.mediaHeight} durationMs={msg.durationMs} onOpen={open([{ url: msg.mediaUrl, kind: "video", w: msg.mediaWidth, h: msg.mediaHeight }], 0)} />
        {compressPct != null && <span className="ig-media-busy">Compressing {Math.round(compressPct * 100)}%</span>}
      </div>
    );
  } else if (msg.type === "sticker" && msg.mediaUrl && isDrawingMessage(msg)) {
    body = (
      <button
        type="button"
        className="ig-drawing"
        onClick={(e) => onOpenMedia([{ url: msg.mediaUrl!, kind: "sticker", w: msg.mediaWidth, h: msg.mediaHeight }], 0, e.currentTarget.getBoundingClientRect(), msg.timestamp)}
        data-testid="chat-drawing-media"
      >
        <img src={msg.mediaUrl} alt="drawing" loading="lazy" decoding="async" draggable={false} />
      </button>
    );
  } else if (msg.type === "sticker" && msg.mediaUrl) {
    // Stickers stay exactly where they are in the chat — no viewer, no zoom.
    // Taps fall through to the row so a double-tap still reacts with ❤️.
    body = (
      <div className="ig-sticker" data-testid="chat-sticker-media">
        <img src={msg.mediaUrl} alt="sticker" loading="lazy" decoding="async" draggable={false} />
      </div>
    );
  } else if (msg.type === "gif" && msg.mediaUrl) {
    body = (
      <div className="ig-gif" style={boxFor(msg.mediaWidth, msg.mediaHeight, 220, 260)} data-testid="chat-gif-media">
        <img src={msg.mediaUrl} alt="GIF" loading="lazy" decoding="async" onLoad={onImgLoad} draggable={false} />
      </div>
    );
  } else if (msg.type === "voice" && msg.mediaUrl) {
    body = <VoiceBubble url={msg.mediaUrl} durationMs={msg.durationMs ?? 0} />;
  } else if (msg.type === "file" && msg.mediaUrl) {
    body = <FileCard msg={msg} uploading={uploading} />;
  }

  return (
    <>
      {body}
      {uploading && msg.type !== "file" && !(msg.albumItems && msg.albumItems.length > 1) && <span className="ig-sending" aria-label="Sending" />}
    </>
  );
}

export default memo(BubbleContent);
