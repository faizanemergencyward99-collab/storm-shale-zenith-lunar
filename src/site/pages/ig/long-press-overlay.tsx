// Instagram long-press: the chat dims + blurs, the pressed bubble lifts and
// scales up, the emoji row springs in above it and the menu below. Tapping
// outside settles everything back into place.
import { useMemo, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import type { ChatMessage } from "@/site/lib/cloud-chat.ts";
import { FULL_EMOJI, QUICK_REACTIONS, searchEmoji } from "@/site/lib/emoji.ts";
import { IconCopy, IconDownload, IconEdit, IconGif, IconMore, IconPlus, IconReply, IconUnsend } from "./icons.tsx";

export interface LiftTarget {
  msg: ChatMessage;
  rect: DOMRect;
  mine: boolean;
  pos: string;
  bare: boolean;
}

interface Props {
  target: LiftTarget;
  myEmojis: Set<string>;
  renderBubble: () => ReactNode;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onUnsend: () => void;
  onDownload: () => void;
  onReplyGif: () => void;
}

const spring = { type: "spring", stiffness: 460, damping: 32, mass: 0.8 } as const;
const pop = { type: "spring", stiffness: 520, damping: 26 } as const;
const EMOJI_H = 52;
const GAP = 10;
const ITEM_H = 46;

export default function LongPressOverlay(p: Props) {
  const { msg, rect, mine } = p.target;
  const [more, setMore] = useState(false);
  const [picker, setPicker] = useState(false);
  const [q, setQ] = useState("");
  const isText = msg.type === "text";
  const hasMedia = !!msg.mediaUrl && msg.type !== "text";

  const items: { key: string; label: string; icon: ReactNode; danger?: boolean; run: () => void }[] = [
    { key: "reply", label: "Reply", icon: <IconReply size={20} />, run: p.onReply },
    ...(isText ? [{ key: "copy", label: "Copy", icon: <IconCopy size={20} />, run: p.onCopy }] : []),
    ...(isText ? [{ key: "edit", label: "Edit", icon: <IconEdit size={20} />, run: p.onEdit }] : []),
    { key: "unsend", label: "Unsend", icon: <IconUnsend size={20} />, danger: true, run: p.onUnsend },
    ...(more
      ? [
          ...(hasMedia ? [{ key: "download", label: "Save to device", icon: <IconDownload size={20} />, run: p.onDownload }] : []),
          { key: "gif", label: "Reply with GIF", icon: <IconGif size={20} />, run: p.onReplyGif },
        ]
      : [{ key: "more", label: "More", icon: <IconMore size={20} />, run: () => setMore(true) }]),
  ];

  const layout = useMemo(() => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const topLimit = 54;
    const menuH = (items.length + 1) * ITEM_H + 8;
    const scale = rect.height > vh * 0.42 ? Math.max(0.45, (vh * 0.42) / rect.height) : 1.04;
    const h = rect.height * scale;
    const minTop = topLimit + EMOJI_H + GAP;
    const maxTop = vh - 24 - menuH - GAP - h;
    const top = Math.max(minTop, Math.min(rect.top + (rect.height - h) / 2, maxTop));
    const emojiW = Math.min(vw - 16, 7 * 44 + 16);
    const emojiLeft = mine ? Math.max(8, Math.min(rect.right - emojiW, vw - emojiW - 8)) : Math.max(8, Math.min(rect.left, vw - emojiW - 8));
    const menuW = 230;
    const menuLeft = mine ? Math.max(8, rect.right - menuW) : Math.max(8, Math.min(rect.left, vw - menuW - 8));
    return { scale, h, top, emojiW, emojiLeft, menuLeft, menuW, dy: top - (rect.top + (rect.height - h) / 2) };
  }, [rect, mine, items.length]);

  const origin = mine ? "100% 50%" : "0% 50%";
  const emojis = picker ? searchEmoji(q) : null;

  return (
    <div className="ig-lp" data-testid="long-press-overlay">
      <motion.div
        className="ig-lp-backdrop"
        onClick={p.onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="ig-lp-bubble"
        style={{ left: rect.left, top: rect.top, width: rect.width, transformOrigin: origin }}
        initial={{ y: 0, scale: 1 }}
        animate={{ y: layout.dy, scale: layout.scale }}
        exit={{ y: 0, scale: 1, transition: { type: "spring", stiffness: 520, damping: 40 } }}
        transition={spring}
        onClick={p.onClose}
      >
        {p.renderBubble()}
      </motion.div>

      <motion.div
        className="ig-lp-emojis"
        style={{ left: layout.emojiLeft, top: layout.top - GAP - EMOJI_H, width: layout.emojiW, transformOrigin: mine ? "100% 100%" : "0% 100%" }}
        initial={{ opacity: 0, scale: 0.5, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.6, y: 10, transition: { duration: 0.14 } }}
        transition={pop}
        data-testid="reaction-bar"
      >
        {QUICK_REACTIONS.map((e, i) => (
          <motion.button
            key={e}
            type="button"
            className="ig-lp-emoji"
            data-on={p.myEmojis.has(e) ? "" : undefined}
            initial={{ opacity: 0, scale: 0.3, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...pop, delay: 0.03 + i * 0.025 }}
            whileTap={{ scale: 1.35 }}
            onClick={() => p.onReact(e)}
            data-testid={`react-${i}`}
          >
            {e}
          </motion.button>
        ))}
        <motion.button
          type="button"
          className="ig-lp-emoji ig-lp-emoji-plus"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...pop, delay: 0.2 }}
          onClick={() => setPicker(true)}
          aria-label="More reactions"
          data-testid="react-more"
        >
          <IconPlus size={22} />
        </motion.button>
      </motion.div>

      <motion.div
        className="ig-lp-menu"
        style={{ left: layout.menuLeft, top: layout.top + layout.h + GAP, width: layout.menuW, transformOrigin: mine ? "100% 0%" : "0% 0%" }}
        initial={{ opacity: 0, scale: 0.6, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.7, y: -6, transition: { duration: 0.14 } }}
        transition={pop}
        layout
        data-testid="action-menu"
      >
        <div className="ig-lp-menu-time">{new Date(msg.timestamp).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}</div>
        {items.map((it) => (
          <button key={it.key} type="button" className="ig-lp-item" data-danger={it.danger ? "" : undefined} onClick={it.run} data-testid={`menu-${it.key}`}>
            <span>{it.label}</span>
            {it.icon}
          </button>
        ))}
      </motion.div>

      {picker && emojis && (
        <motion.div
          className="ig-sheet ig-emoji-sheet"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 38 }}
          data-testid="emoji-picker"
        >
          <div className="ig-sheet-grab" />
          <input className="ig-sheet-search" placeholder="Search emoji" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="ig-emoji-grid">
            {(emojis.length ? emojis : FULL_EMOJI).map((e) => (
              <button key={e} type="button" data-on={p.myEmojis.has(e) ? "" : undefined} onClick={() => p.onReact(e)}>
                {e}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
