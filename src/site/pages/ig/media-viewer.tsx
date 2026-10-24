// Full-screen media viewer: zooms out of the tapped thumbnail, swipe sideways
// through a group, swipe down to close.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { downloadMedia } from "@/site/lib/download.ts";
import { haptics } from "@/site/lib/haptics.ts";
import type { ViewerItem } from "./bubble-content.tsx";
import { IconClose, IconDownload } from "./icons.tsx";
import { fmtSeparator } from "./util.ts";

interface Props {
  items: ViewerItem[];
  index: number;
  rect: DOMRect | null;
  ts: number;
  onClose: () => void;
}

export default function MediaViewer({ items, index, rect, ts, onClose }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState(index);
  const y = useMotionValue(0);
  const bgOpacity = useTransform(y, [-300, 0, 300], [0.2, 1, 0.2]);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const from = rect
    ? { scale: Math.max(0.15, rect.width / vw), x: rect.left + rect.width / 2 - vw / 2, y: rect.top + rect.height / 2 - vh / 2, opacity: 0.6 }
    : { scale: 0.92, x: 0, y: 0, opacity: 0 };

  useLayoutEffect(() => {
    const t = trackRef.current;
    if (t) t.scrollLeft = index * t.clientWidth;
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;
    t.querySelectorAll("video").forEach((v, i) => {
      if (i === cur) void v.play().catch(() => {});
      else v.pause();
    });
  }, [cur]);

  const item = items[cur];

  return createPortal(
    <motion.div className="ig-viewer" data-testid="media-viewer" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
      <motion.div className="ig-viewer-bg" style={{ opacity: bgOpacity }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <div className="ig-viewer-top">
        <button type="button" className="ig-hbtn" onClick={onClose} aria-label="Close" data-testid="viewer-close"><IconClose size={22} /></button>
        <span className="ig-viewer-meta">
          {items.length > 1 && <b>{cur + 1} / {items.length}</b>}
          <span>{fmtSeparator(ts)}</span>
        </span>
        <button
          type="button"
          className="ig-hbtn"
          onClick={() => { haptics.light(); void downloadMedia(item.url, item.kind === "video" ? "video" : item.kind, { ts }); }}
          aria-label="Save"
          data-testid="viewer-download"
        >
          <IconDownload size={22} />
        </button>
      </div>
      <motion.div
        className="ig-viewer-stage"
        style={{ y }}
        drag="y"
        dragDirectionLock
        dragElastic={0.9}
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.y) > 110 || Math.abs(info.velocity.y) > 700) onClose();
          else void animate(y, 0, { type: "spring", stiffness: 500, damping: 40 });
        }}
        initial={from}
        animate={{ scale: 1, x: 0, y: 0, opacity: 1 }}
        exit={rect ? { ...from, opacity: 0, transition: { type: "spring", stiffness: 420, damping: 40 } } : { opacity: 0, scale: 0.94 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
      >
        <div
          className="ig-viewer-track"
          ref={trackRef}
          onScroll={(e) => {
            const t = e.currentTarget;
            const i = Math.round(t.scrollLeft / Math.max(1, t.clientWidth));
            if (i !== cur) setCur(i);
          }}
        >
          {items.map((it, i) => (
            <div key={`${it.url}-${i}`} className="ig-viewer-slide">
              {it.kind === "video" ? (
                <video src={it.url} controls playsInline loop={false} preload="metadata" />
              ) : (
                <img src={it.url} alt="" decoding="async" draggable={false} />
              )}
            </div>
          ))}
        </div>
        {items.length > 1 && (
          <div className="ig-viewer-dots">
            {items.map((_, i) => <i key={i} data-on={i === cur ? "" : undefined} />)}
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
