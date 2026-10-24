// Gallery picker: the picked photos/videos slide up in a grid with numbered
// blue circles. Tap to (de)select, then Send — 2+ go as one grouped message.
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { haptics } from "@/site/lib/haptics.ts";
import { IconBrush, IconClose, IconPlay, IconPlus } from "./icons.tsx";

interface Props {
  files: File[];
  onAddMore: () => void;
  onClose: () => void;
  onSend: (files: File[]) => void;
  onDraw: (file: File) => void;
}

export default function GallerySheet({ files, onAddMore, onClose, onSend, onDraw }: Props) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
  const [order, setOrder] = useState<number[]>(() => files.map((_, i) => i));
  useEffect(() => { setOrder(files.map((_, i) => i)); }, [files]);

  const toggle = (i: number) => {
    haptics.selection();
    setOrder((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i]));
  };
  const count = order.length;

  return (
    <motion.div className="ig-modal ig-modal-bottom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} data-testid="gallery-sheet">
      <motion.div
        className="ig-sheet ig-gallery"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 700) onClose(); }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ig-sheet-grab" />
        <div className="ig-gallery-head">
          <button type="button" className="ig-icon-btn" onClick={onClose} aria-label="Close"><IconClose size={22} /></button>
          <p className="ig-sheet-title">Recents</p>
          <span style={{ width: 40 }} />
        </div>
        <div className="ig-gallery-grid" onPointerDown={(e) => e.stopPropagation()}>
          <button type="button" className="ig-gallery-add" onClick={onAddMore} data-testid="gallery-add-more">
            <IconPlus size={28} />
            <span>Add</span>
          </button>
          {files.map((f, i) => {
            const n = order.indexOf(i);
            const video = f.type.startsWith("video/");
            return (
              <motion.button
                key={urls[i]}
                type="button"
                className="ig-gallery-cell"
                data-on={n >= 0 ? "" : undefined}
                onClick={() => toggle(i)}
                whileTap={{ scale: 0.94 }}
                data-testid={`gallery-cell-${i}`}
              >
                {video ? <video src={urls[i]} muted playsInline preload="metadata" /> : <img src={urls[i]} alt="" decoding="async" />}
                {video && <span className="ig-gallery-vid"><IconPlay size={14} /></span>}
                <span className="ig-gallery-num">{n >= 0 ? n + 1 : ""}</span>
              </motion.button>
            );
          })}
        </div>
        <div className="ig-gallery-foot">
          {count === 1 && files[order[0]].type.startsWith("image/") && (
            <motion.button
              type="button"
              className="ig-btn-ghost ig-gallery-draw"
              whileTap={{ scale: 0.96 }}
              onClick={() => onDraw(files[order[0]])}
              data-testid="gallery-draw"
            >
              <IconBrush size={18} />
              <span>Draw</span>
            </motion.button>
          )}
          <motion.button
            type="button"
            className="ig-btn-primary ig-gallery-send"
            disabled={count === 0}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSend(order.map((i) => files[i]))}
            data-testid="gallery-send"
          >
            {count > 1 ? `Send ${count} as a group` : count === 1 ? "Send" : "Select photos"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
