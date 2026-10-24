// One message row: optional time stamp + "You replied" label + faded quote,
// the bubble (grouped corners, avatar on the last incoming bubble) and the
// reaction badge. Handles long-press, double-tap ❤️ and
// swipe-right-to-reply with direct DOM updates (no re-render per frame).
import { memo, useEffect, useRef } from "react";
import { motion } from "motion/react";
import type { ChatMessage, ReplySnapshot, Sender } from "@/site/lib/cloud-chat.ts";
import { haptics } from "@/site/lib/haptics.ts";
import BubbleContent, { isBare, isDrawingMedia, type OpenMedia } from "./bubble-content.tsx";
import { IconReply } from "./icons.tsx";
import { initial, fmtDuration } from "./util.ts";

export type GroupPos = "single" | "first" | "middle" | "last";

export interface RowHandlers {
  onLongPress: (msg: ChatMessage, el: HTMLElement) => void;
  onDoubleTap: (msg: ChatMessage) => void;
  onSwipeReply: (msg: ChatMessage) => void;
  onOpenMedia: OpenMedia;
  onJumpTo: (id: string) => void;
  onOpenReactions: (msg: ChatMessage) => void;
}

interface Props {
  msg: ChatMessage;
  mine: boolean;
  pos: GroupPos;
  timeLabel: string | null;
  showAvatar: boolean;
  other: Sender;
  label: string | null;
  quoteMissing: boolean;
  term: string;
  current: boolean;
  flash: boolean;
  hidden: boolean;
  uploading: boolean;
  progress: { done: number; total: number } | null;
  compressPct: number | null;
  animate: boolean;
  handlers: RowHandlers;
}

export function Avatar({ who, size = 28 }: { who: Sender; size?: number }) {
  return (
    <span className="ig-avatar" data-who={who} style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden>
      {initial(who)}
    </span>
  );
}

export function quoteText(s: ReplySnapshot): string {
  if (s.type === "text") return s.text || "";
  if (s.type === "image") return s.albumCount && s.albumCount > 1 ? `${s.albumCount} photos` : "Photo";
  if (s.type === "video") return `Video${s.durationMs ? ` · ${fmtDuration(s.durationMs)}` : ""}`;
  if (s.type === "voice") return `Voice message${s.durationMs ? ` · ${fmtDuration(s.durationMs)}` : ""}`;
  if (s.type === "sticker") return isDrawingMedia(s.mediaUrl) ? "Drawing" : "Sticker";
  if (s.type === "gif") return "GIF";
  return "File";
}

function Quote({ snap, missing, mine, quotedMine, onJump }: { snap: ReplySnapshot; missing: boolean; mine: boolean; quotedMine: boolean; onJump: () => void }) {
  const thumb = !missing && snap.mediaUrl && (snap.type === "image" || snap.type === "sticker" || snap.type === "gif");
  return (
    <div className="ig-quote-wrap" data-side={mine ? "out" : "in"}>
      {thumb ? (
        <button type="button" className="ig-quote-media" onClick={onJump} data-testid="reply-quote">
          <img src={snap.mediaUrl!} alt="" loading="lazy" decoding="async" />
        </button>
      ) : (
        <button type="button" className="ig-quote" data-qside={quotedMine ? "out" : "in"} onClick={onJump} data-testid="reply-quote">
          {missing ? <em>Original message unavailable</em> : quoteText(snap)}
        </button>
      )}
    </div>
  );
}

function summarize(msg: ChatMessage): { emoji: string; count: number }[] {
  const r = msg.reactions;
  if (!r) return [];
  return Object.entries(r)
    .filter(([, users]) => users.length > 0)
    .map(([emoji, users]) => ({ emoji, count: users.length }));
}

/** How far the row travels, and how far it must travel to fire the reply. */
const SWIPE_MAX = 78;
const SWIPE_TRIGGER = 44;

const spring = { type: "spring", stiffness: 520, damping: 34, mass: 0.7 } as const;
const bouncy = { type: "spring", stiffness: 420, damping: 15 } as const;

function MessageRow(p: Props) {
  const { msg, mine, handlers } = p;
  const lineRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const g = useRef({ x: 0, y: 0, t: 0, timer: 0 as number | 0, fired: false, swiping: false, moved: false, dx: 0, lastTap: 0, openTimer: 0 as number | 0 });
  const bare = isBare(msg);
  const reactions = summarize(msg);
  const animRef = useRef(p.animate);

  const clearPress = () => { if (g.current.timer) { clearTimeout(g.current.timer); g.current.timer = 0; } };

  const resetSwipe = () => {
    const el = lineRef.current;
    if (!el) return;
    el.style.transition = "transform 280ms cubic-bezier(0.2, 0.9, 0.3, 1.2)";
    el.style.transform = "translate3d(0,0,0)";
    el.parentElement?.style.setProperty("--swipe", "0");
    window.setTimeout(() => { if (el) el.style.transition = ""; }, 300);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const s = g.current;
    s.x = e.clientX; s.y = e.clientY; s.t = Date.now();
    s.fired = false; s.swiping = false; s.moved = false; s.dx = 0;
    clearPress();
    s.timer = window.setTimeout(() => {
      s.timer = 0;
      if (s.moved) return;
      s.fired = true;
      haptics.medium();
      if (bubbleRef.current) handlers.onLongPress(msg, bubbleRef.current);
    }, 420);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = g.current;
    if (!s.t) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.moved && Math.hypot(dx, dy) > 9) { s.moved = true; clearPress(); }
    if (!s.swiping && s.moved && dx > 8 && Math.abs(dx) > Math.abs(dy) * 1.1) s.swiping = true;
    if (s.swiping && lineRef.current) {
      const shift = Math.max(0, Math.min(SWIPE_MAX, dx * 0.72));
      if (s.dx < SWIPE_TRIGGER && shift >= SWIPE_TRIGGER) haptics.selection();
      s.dx = shift;
      lineRef.current.style.transform = `translate3d(${shift}px,0,0)`;
      lineRef.current.parentElement?.style.setProperty("--swipe", String(Math.min(1, shift / SWIPE_TRIGGER)));
    }
  };

  // iOS Safari / Android Chrome can still hand a horizontal drag to their own
  // scroll or back-swipe once it begins, which kills the pointer stream
  // mid-gesture. Claiming the touch here (non-passive, so preventDefault is
  // allowed) keeps the reply swipe alive on every phone.
  useEffect(() => {
    const el = bubbleRef.current;
    if (!el) return;
    const onTouchMove = (ev: TouchEvent) => {
      const s = g.current;
      if (!s.t || ev.touches.length !== 1) return;
      const t = ev.touches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      if (s.swiping || (dx > 8 && Math.abs(dx) > Math.abs(dy) * 1.1)) {
        s.swiping = true;
        if (ev.cancelable) ev.preventDefault();
      }
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, []);

  const onPointerEnd = (e: React.PointerEvent) => {
    const s = g.current;
    clearPress();
    if (s.swiping) {
      if (s.dx >= SWIPE_TRIGGER) handlers.onSwipeReply(msg);
      resetSwipe();
    } else if (!s.fired && !s.moved && e.type === "pointerup") {
      const now = Date.now();
      if (now - s.lastTap < 300) {
        s.lastTap = 0;
        if (s.openTimer) { clearTimeout(s.openTimer); s.openTimer = 0; }
        handlers.onDoubleTap(msg);
      } else s.lastTap = now;
    }
    s.t = 0; s.swiping = false;
  };

  // Media opens after a short beat so a double-tap can still mean ❤️.
  const openMedia: OpenMedia = (items, i, rect, ts) => {
    const s = g.current;
    if (s.fired) return;
    if (s.openTimer) clearTimeout(s.openTimer);
    s.openTimer = window.setTimeout(() => { s.openTimer = 0; handlers.onOpenMedia(items, i, rect, ts); }, 260);
  };

  const enter = animRef.current
    ? {
        initial: bare && (msg.type === "sticker" || msg.type === "gif")
          ? { opacity: 0, scale: 0.4, y: 24 }
          : mine ? { opacity: 0, y: 18, scale: 0.92 } : { opacity: 0, y: 8, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: bare && (msg.type === "sticker" || msg.type === "gif") ? bouncy : spring,
      }
    : {};

  return (
    <div className="ig-row" data-side={mine ? "out" : "in"} data-pos={p.pos} data-testid={`msg-${msg.id}`}>
      {p.timeLabel && <div className="ig-time">{p.timeLabel}</div>}
      {p.label && <div className="ig-label">{p.label}</div>}
      {msg.replySnapshot && (
        <Quote snap={msg.replySnapshot} missing={p.quoteMissing} mine={mine} quotedMine={msg.replySnapshot.sender !== p.other} onJump={() => msg.replyToId && handlers.onJumpTo(msg.replyToId)} />
      )}
      <div className="ig-line-outer">
        <span className="ig-swipe-icon" aria-hidden><IconReply size={18} /></span>
        <div className="ig-line" ref={lineRef}>
          {!mine && <span className="ig-avatar-slot">{p.showAvatar && <Avatar who={p.other} />}</span>}
          <motion.div
            className="ig-bubble-col"
            style={{ transformOrigin: mine ? "100% 100%" : "0% 100%" }}
            {...enter}
          >
            <div
              ref={bubbleRef}
              className={bare ? "ig-bare" : "ig-bubble"}
              data-pos={p.pos}
              data-hidden={p.hidden ? "" : undefined}
              data-current={p.current ? "" : undefined}
              data-flash={p.flash ? "" : undefined}
              data-has-reactions={reactions.length ? "" : undefined}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!g.current.fired && bubbleRef.current) { g.current.fired = true; handlers.onLongPress(msg, bubbleRef.current); }
              }}
            >
              <BubbleContent
                msg={msg}
                mine={mine}
                term={p.term}
                uploading={p.uploading}
                progress={p.progress}
                compressPct={p.compressPct}
                onOpenMedia={openMedia}
              />
            </div>
            {reactions.length > 0 && (
              <button
                type="button"
                className="ig-react-badge"
                data-hidden={p.hidden ? "" : undefined}
                onClick={() => handlers.onOpenReactions(msg)}
                data-testid="reaction-badge"
                aria-label="See reactions"
              >
                {reactions.map((r) => (
                  <span key={r.emoji} className="ig-react-item">
                    {r.emoji}
                    {r.count > 1 && <span className="ig-react-count">{r.count}</span>}
                  </span>
                ))}
              </button>
            )}
          </motion.div>
        </div>
      </div>
      {msg.edited && <div className="ig-edited">Edited</div>}
    </div>
  );
}

export default memo(MessageRow);
