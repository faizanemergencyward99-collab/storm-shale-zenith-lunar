// Drawing board — draw directly ON the chat screen itself (the real
// messages stay visible, just dimmed, exactly like Instagram's "Draw") or
// write/sketch over a photo before sending it. Strokes are kept as points
// so Undo and Clear can repaint cheaply, and each stroke remembers its own
// brush so switching brush/colour/size mid-drawing never changes what's
// already down.
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { haptics } from "@/site/lib/haptics.ts";
import { IconClose, IconSend, IconTrash, IconUndo } from "./icons.tsx";

export type BrushId = "neon" | "marker" | "highlighter";

interface Stroke {
  color: string;
  size: number;
  brush: BrushId;
  pts: { x: number; y: number }[];
}

interface Props {
  /** Photo to draw over. When absent, strokes land on a transparent canvas
   *  laid straight over the live chat screen behind it. */
  photo?: File | null;
  onClose: () => void;
  /** `width`/`height` are the drawing's real pixel size (for correct aspect
   *  ratio once it lands in the chat as a message). */
  onSend: (file: File, width: number, height: number) => void;
}

const COLORS = ["#ffffff", "#000000", "#ff2d55", "#ff6fae", "#ffd60a", "#34c759", "#3797f0", "#7c5cff", "#ff7a1a"];
const SIZES = [4, 9, 16, 26];
const BRUSHES: { id: BrushId; label: string }[] = [
  { id: "neon", label: "Neon" },
  { id: "marker", label: "Marker" },
  { id: "highlighter", label: "Highlighter" },
];

export default function Doodle({ photo, onClose, onSend }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef<Stroke | null>(null);
  const [color, setColor] = useState(photo ? "#ffffff" : "#ff2d55");
  const [size, setSize] = useState(9);
  const [brush, setBrush] = useState<BrushId>("neon");
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);

  // ── Paint helpers ───────────────────────────────────────────────────────
  const paint = useCallback(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx || !cv.clientWidth) return;
    const dpr = cv.width / cv.clientWidth;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cv.clientWidth, cv.clientHeight);
    // A photo covers the whole canvas; a blank drawing stays fully
    // transparent so only the strokes land in the sent PNG.
    if (bgRef.current) ctx.drawImage(bgRef.current, 0, 0, cv.clientWidth, cv.clientHeight);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const all = drawingRef.current ? [...strokesRef.current, drawingRef.current] : strokesRef.current;
    all.forEach((s) => {
      if (!s.pts.length) return;
      ctx.save();
      if (s.brush === "neon") {
        ctx.shadowColor = s.color;
        ctx.shadowBlur = s.size * 1.6;
        ctx.globalAlpha = 1;
        ctx.lineWidth = Math.max(2, s.size * 0.55);
      } else if (s.brush === "highlighter") {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = s.size * 1.8;
      } else {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.lineWidth = s.size;
      }
      ctx.strokeStyle = s.color;
      ctx.beginPath();
      ctx.moveTo(s.pts[0].x, s.pts[0].y);
      if (s.pts.length === 1) ctx.lineTo(s.pts[0].x + 0.1, s.pts[0].y);
      for (let i = 1; i < s.pts.length - 1; i++) {
        const mid = { x: (s.pts[i].x + s.pts[i + 1].x) / 2, y: (s.pts[i].y + s.pts[i + 1].y) / 2 };
        ctx.quadraticCurveTo(s.pts[i].x, s.pts[i].y, mid.x, mid.y);
      }
      const last = s.pts[s.pts.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }, []);

  // ── Set the canvas up to the photo's shape (or the whole area) ───────────
  useEffect(() => {
    let dead = false;
    const sizeCanvas = (ratio: number | null) => {
      const wrap = wrapRef.current;
      const cv = canvasRef.current;
      if (!wrap || !cv || dead) return;
      const aw = wrap.clientWidth;
      const ah = wrap.clientHeight;
      let w = aw;
      let h = ah;
      if (ratio) {
        if (aw / ah > ratio) w = ah * ratio;
        else h = aw / ratio;
      }
      cv.style.width = `${Math.round(w)}px`;
      cv.style.height = `${Math.round(h)}px`;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      paint();
      setReady(true);
    };

    if (!photo) { sizeCanvas(null); return () => { dead = true; }; }
    const url = URL.createObjectURL(photo);
    const img = new Image();
    img.onload = () => { bgRef.current = img; sizeCanvas(img.width / img.height); };
    img.onerror = () => sizeCanvas(null);
    img.src = url;
    return () => { dead = true; URL.revokeObjectURL(url); };
  }, [photo, paint]);

  // ── Pointer drawing ─────────────────────────────────────────────────────
  const at = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    try { canvasRef.current?.setPointerCapture(e.pointerId); } catch { /* best-effort only */ }
    drawingRef.current = { color, size, brush, pts: [at(e)] };
    paint();
  };
  const move = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    drawingRef.current.pts.push(at(e));
    paint();
  };
  const up = () => {
    const s = drawingRef.current;
    drawingRef.current = null;
    if (!s) return;
    strokesRef.current = [...strokesRef.current, s];
    setCount(strokesRef.current.length);
  };

  const undo = () => {
    haptics.light();
    strokesRef.current = strokesRef.current.slice(0, -1);
    setCount(strokesRef.current.length);
    paint();
  };
  const clear = () => {
    haptics.medium();
    strokesRef.current = [];
    setCount(0);
    paint();
  };

  const send = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    haptics.light();
    cv.toBlob((blob) => {
      if (!blob) return;
      onSend(new File([blob], `doodle-${Date.now()}.png`, { type: "image/png" }), cv.width, cv.height);
    }, "image/png");
  };

  return (
    <motion.div
      className="ig-doodle"
      data-blank={photo ? undefined : ""}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-testid="doodle"
    >
      <div className="ig-doodle-head">
        <button type="button" className="ig-icon-btn" onClick={onClose} aria-label="Close drawing" data-testid="doodle-close"><IconClose size={24} /></button>
        <p className="ig-sheet-title">{photo ? "Draw on photo" : "Draw"}</p>
        <div className="ig-doodle-head-right">
          <button type="button" className="ig-icon-btn" disabled={!count} onClick={undo} aria-label="Undo" data-testid="doodle-undo"><IconUndo size={22} /></button>
          <button type="button" className="ig-icon-btn" disabled={!count} onClick={clear} aria-label="Clear" data-testid="doodle-clear"><IconTrash size={22} /></button>
        </div>
      </div>

      <div className="ig-doodle-stage" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          className="ig-doodle-canvas"
          data-blank={photo ? undefined : ""}
          data-ready={ready ? "" : undefined}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          data-testid="doodle-canvas"
        />
      </div>

      <div className="ig-doodle-tools">
        <div className="ig-doodle-brushes">
          {BRUSHES.map((b) => (
            <button
              key={b.id}
              type="button"
              className="ig-doodle-brush"
              data-brush={b.id}
              data-on={brush === b.id ? "" : undefined}
              onClick={() => { haptics.selection(); setBrush(b.id); }}
              aria-label={b.label}
              data-testid={`doodle-brush-${b.id}`}
            >
              <span className="ig-doodle-brush-dot" style={{ background: color }} />
              <span className="ig-doodle-brush-label">{b.label}</span>
            </button>
          ))}
        </div>
        <div className="ig-doodle-sizes">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              className="ig-doodle-size"
              data-on={size === s ? "" : undefined}
              onClick={() => { haptics.selection(); setSize(s); }}
              aria-label={`Brush size ${s}`}
              data-testid={`doodle-size-${s}`}
            >
              <span style={{ width: s, height: s, background: color }} />
            </button>
          ))}
        </div>
        <div className="ig-doodle-colors">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="ig-doodle-color"
              data-on={color === c ? "" : undefined}
              style={{ background: c }}
              onClick={() => { haptics.selection(); setColor(c); }}
              aria-label={c}
              data-testid={`doodle-color-${c.replace("#", "")}`}
            />
          ))}
        </div>
        <motion.button
          type="button"
          className="ig-btn-primary ig-doodle-send"
          whileTap={{ scale: 0.95 }}
          disabled={!photo && !count}
          onClick={send}
          data-testid="doodle-send"
        >
          <IconSend size={18} />
          <span>Send</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
