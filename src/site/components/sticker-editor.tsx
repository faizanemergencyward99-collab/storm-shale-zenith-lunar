// ─────────────────────────────────────────────────────────────────────────────
//  StickerEditor — full-screen sheet shown after picking an image for a custom
//  sticker. Original / AI Remove Background / Manual erase → Save or Send.
//  Mobile-first: touch drawing, pinch-zoom + pan, big buttons, safe areas.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { haptics } from "@/site/lib/haptics.ts";
import {
  decodeImageFile,
  describeImageError,
  finalizeSticker,
  exportSticker,
  cloneCanvas,
  snapshot,
  restore,
  type StickerExport,
} from "@/site/lib/sticker-image.ts";
import { removeBackgroundAI, type BgProgress } from "@/site/lib/bg-removal.ts";

type Mode = "original" | "ai" | "manual";
type Busy = null | "saving" | "sending";

const ACCENT = "linear-gradient(135deg,#ff6b9d,#c9184a)";
const CHECKER =
  "repeating-conic-gradient(rgba(0,0,0,0.13) 0% 25%, transparent 0% 50%) 50% / 18px 18px";

export interface StickerEditorProps {
  file: (Blob & { name?: string }) | null;
  dark: boolean;
  onClose: () => void;
  /** Persist as a saved sticker. Resolve true on success. */
  onSave: (out: StickerExport) => Promise<boolean>;
  /** Send straight into the chat. Resolve true on success. */
  onSend: (out: StickerExport) => Promise<boolean>;
}

export default function StickerEditor({ file, dark, onClose, onSave, onSend }: StickerEditorProps) {
  const [original, setOriginal] = useState<HTMLCanvasElement | null>(null);
  const [aiResult, setAiResult] = useState<HTMLCanvasElement | null>(null);
  const [manualResult, setManualResult] = useState<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<Mode>("original");
  const [view, setView] = useState<"preview" | "manual">("preview");
  const [decoding, setDecoding] = useState(true);
  const [aiProgress, setAiProgress] = useState<BgProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [compare, setCompare] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [finalMeta, setFinalMeta] = useState<{ w: number; h: number; kb: number; mime: string } | null>(null);
  const finalRef = useRef<StickerExport | null>(null);
  const aliveRef = useRef(true);

  const fg = dark ? "#f2f2f2" : "#5a1530";
  const sub = dark ? "rgba(255,255,255,0.65)" : "rgba(90,21,48,0.65)";
  const sheetBg = dark ? "#121212" : "#fff6f9";
  const chipBg = dark ? "rgba(255,255,255,0.09)" : "rgba(201,24,74,0.08)";
  const border = dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(201,24,74,0.18)";

  // ── decode the picked file ─────────────────────────────────────────────────
  useEffect(() => {
    aliveRef.current = true;
    setOriginal(null);
    setAiResult(null);
    setManualResult(null);
    setMode("original");
    setView("preview");
    setError(null);
    setNotice(null);
    setCompare(false);
    setBusy(null);
    if (!file) return;
    setDecoding(true);
    decodeImageFile(file)
      .then((c) => {
        if (!aliveRef.current) return;
        setOriginal(c);
      })
      .catch((e) => {
        if (!aliveRef.current) return;
        setError(describeImageError(e));
      })
      .finally(() => aliveRef.current && setDecoding(false));
    return () => {
      aliveRef.current = false;
    };
  }, [file]);

  // The canvas the user is currently looking at (before final crop).
  const current = useMemo<HTMLCanvasElement | null>(() => {
    if (!original) return null;
    if (mode === "manual" && manualResult) return manualResult;
    if (mode === "ai" && aiResult) return aiResult;
    return original;
  }, [original, aiResult, manualResult, mode]);

  // Build the exact asset that will be saved/sent → preview it.
  useEffect(() => {
    let revoked = false;
    let url: string | null = null;
    finalRef.current = null;
    setFinalUrl(null);
    if (!current) return;
    (async () => {
      try {
        const finalCanvas = finalizeSticker(current);
        const out = await exportSticker(finalCanvas);
        if (revoked) return;
        finalRef.current = out;
        url = URL.createObjectURL(out.blob);
        setFinalUrl(url);
        setFinalMeta({ w: out.width, h: out.height, kb: Math.max(1, Math.round(out.blob.size / 1024)), mime: out.mime });
      } catch (e) {
        if (!revoked) setError(describeImageError(e));
      }
    })();
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [current]);

  // "Before" image for compare (original, uncropped → cropped same way for a fair look)
  const originalUrl = useMemo(() => (original ? original.toDataURL("image/png") : null), [original]);

  // ── AI remove background ───────────────────────────────────────────────────
  const runAI = useCallback(async () => {
    if (!original || aiProgress) return;
    haptics.light();
    setError(null);
    if (aiResult) {
      setMode("ai");
      return;
    }
    setAiProgress({ label: "Loading AI engine", pct: null });
    try {
      const res = await removeBackgroundAI(original, (p) => aliveRef.current && setAiProgress(p));
      if (!aliveRef.current) return;
      setAiResult(res);
      setMode("ai");
      setNotice("Background removed ✓ — use Manual erase for touch-ups.");
      haptics.medium();
    } catch (e) {
      if (!aliveRef.current) return;
      setError(e instanceof Error ? e.message : "AI background removal failed.");
    } finally {
      if (aliveRef.current) setAiProgress(null);
    }
  }, [original, aiResult, aiProgress]);

  const undoAI = () => {
    haptics.light();
    setMode("original");
    setNotice(null);
  };

  const openManual = () => {
    if (!current) return;
    haptics.light();
    setError(null);
    setView("manual");
  };

  const finishManual = (result: HTMLCanvasElement) => {
    setManualResult(result);
    setMode("manual");
    setView("preview");
    setNotice("Manual edit applied ✓");
    haptics.medium();
  };

  const act = async (kind: "saving" | "sending") => {
    const out = finalRef.current;
    if (!out || busy) return;
    haptics.medium();
    setBusy(kind);
    setError(null);
    try {
      const ok = kind === "saving" ? await onSave(out) : await onSend(out);
      if (!aliveRef.current) return;
      if (!ok) {
        setError(
          kind === "saving"
            ? "Couldn't save the sticker. Check your connection and try again."
            : "Couldn't send the sticker. Check your connection and try again.",
        );
      }
    } catch (e) {
      if (aliveRef.current) setError(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      if (aliveRef.current) setBusy(null);
    }
  };

  if (!file) return null;

  const modeChip = (m: Mode, label: string, onClick: () => void, disabled?: boolean, testid?: string) => {
    const active = mode === m;
    return (
      <button
        key={m}
        data-testid={testid}
        onClick={onClick}
        disabled={disabled}
        style={{
          flex: 1,
          minWidth: 0,
          padding: "12px 6px",
          borderRadius: 14,
          border: active ? "1px solid transparent" : border,
          background: active ? ACCENT : chipBg,
          color: active ? "#fff" : fg,
          fontWeight: 700,
          fontSize: 13,
          lineHeight: 1.2,
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.5 : 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </button>
    );
  };

  return createPortal(
    <div
      data-testid="sticker-editor"
      className="fixed inset-0 z-[95] flex flex-col"
      style={{
        background: sheetBg,
        color: fg,
        paddingTop: "env(safe-area-inset-top, 0px)",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      {view === "manual" && current && original ? (
        <ManualEraser
          dark={dark}
          source={current}
          original={original}
          onCancel={() => setView("preview")}
          onDone={finishManual}
        />
      ) : (
        <>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", padding: "10px 12px 6px", gap: 8 }}>
            <button
              data-testid="sticker-editor-close"
              onClick={() => { haptics.light(); onClose(); }}
              disabled={busy !== null}
              aria-label="Close"
              style={{ width: 40, height: 40, borderRadius: 999, border: "none", background: chipBg, color: fg, fontSize: 18, cursor: "pointer" }}
            >
              ✕
            </button>
            <div style={{ flex: 1, textAlign: "center", fontWeight: 800, fontSize: 16 }}>New sticker</div>
            <div style={{ width: 40 }} />
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", padding: "0 14px" }}>
            {/* Preview */}
            <div
              data-testid="sticker-editor-preview"
              style={{
                position: "relative",
                width: "100%",
                height: "min(46dvh, 420px)",
                borderRadius: 20,
                background: (dark ? "rgba(255,255,255,0.06)," : "rgba(255,255,255,0.9),") + CHECKER,
                border,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {decoding && <Spinner label="Opening image…" fg={fg} />}
              {!decoding && !original && error && (
                <div style={{ padding: 20, textAlign: "center", color: "#c9184a", fontSize: 14, fontWeight: 600 }}>{error}</div>
              )}
              {original && (compare ? originalUrl : finalUrl) && (
                <img
                  src={(compare ? originalUrl : finalUrl) as string}
                  alt="sticker preview"
                  draggable={false}
                  style={{ maxWidth: "92%", maxHeight: "92%", objectFit: "contain", display: "block", imageRendering: "auto" }}
                />
              )}
              {original && !finalUrl && !compare && <Spinner label="Preparing…" fg={fg} />}
              {aiProgress && (
                <div
                  data-testid="sticker-ai-progress"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    background: "rgba(0,0,0,0.55)",
                    color: "#fff",
                    backdropFilter: "blur(2px)",
                    padding: 20,
                    textAlign: "center",
                  }}
                >
                  <Spinner label="" fg="#fff" />
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    ✨ {aiProgress.label}{aiProgress.pct !== null ? ` ${aiProgress.pct}%` : "…"}
                  </div>
                  {aiProgress.pct !== null && (
                    <div style={{ width: "70%", height: 6, borderRadius: 999, background: "rgba(255,255,255,0.25)", overflow: "hidden" }}>
                      <div style={{ width: `${aiProgress.pct}%`, height: "100%", background: ACCENT, transition: "width 200ms" }} />
                    </div>
                  )}
                  <div style={{ fontSize: 12, opacity: 0.8 }}>First time downloads the AI model once, then it's fast.</div>
                </div>
              )}
              {finalMeta && !compare && !aiProgress && (
                <div
                  data-testid="sticker-final-meta"
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 10,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: "rgba(0,0,0,0.5)",
                    color: "#fff",
                  }}
                >
                  {finalMeta.w}×{finalMeta.h} · {finalMeta.kb} KB · {finalMeta.mime === "image/webp" ? "WebP" : "PNG"}
                </div>
              )}
              {compare && (
                <div style={{ position: "absolute", top: 8, left: 10, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: "rgba(0,0,0,0.55)", color: "#fff" }}>
                  BEFORE
                </div>
              )}
            </div>

            {/* Mode chips */}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {modeChip("original", "Original", () => { haptics.light(); setMode("original"); setNotice(null); }, !original, "sticker-mode-original")}
              {modeChip("ai", aiResult ? "✨ AI cut-out" : "✨ AI Remove BG", runAI, !original || !!aiProgress, "sticker-mode-ai")}
              {modeChip("manual", manualResult ? "✂️ Manual (edited)" : "✂️ Manual erase", openManual, !original || !!aiProgress, "sticker-mode-manual")}
            </div>

            {/* Contextual row */}
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {(mode === "ai" || mode === "manual") && (
                <button
                  data-testid="sticker-compare-btn"
                  onPointerDown={() => setCompare(true)}
                  onPointerUp={() => setCompare(false)}
                  onPointerLeave={() => setCompare(false)}
                  onPointerCancel={() => setCompare(false)}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ flex: 1, padding: "10px 12px", borderRadius: 12, border, background: chipBg, color: fg, fontWeight: 600, fontSize: 13, cursor: "pointer", touchAction: "manipulation" }}
                >
                  👁 Hold to compare
                </button>
              )}
              {mode === "ai" && (
                <button
                  data-testid="sticker-undo-ai"
                  onClick={undoAI}
                  style={{ flex: 1, padding: "10px 12px", borderRadius: 12, border, background: chipBg, color: fg, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                  ↩ Undo AI (back to original)
                </button>
              )}
              {mode === "manual" && (
                <button
                  data-testid="sticker-undo-manual"
                  onClick={() => { haptics.light(); setManualResult(null); setMode(aiResult ? "ai" : "original"); setNotice(null); }}
                  style={{ flex: 1, padding: "10px 12px", borderRadius: 12, border, background: chipBg, color: fg, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                  ↩ Discard manual edit
                </button>
              )}
            </div>

            <p style={{ margin: "10px 2px 0", fontSize: 12, color: sub, lineHeight: 1.45 }}>
              {mode === "original" && "Sends the picture as-is. Try ✨ AI Remove BG to cut out the subject automatically, or ✂️ Manual erase to do it by hand."}
              {mode === "ai" && "The subject was detected automatically. Edges are cleaned and the sticker is cropped with a little padding."}
              {mode === "manual" && "Your manual edit is applied on top. Tap ✂️ Manual erase again to keep refining."}
            </p>

            {notice && !error && (
              <div data-testid="sticker-editor-notice" style={{ marginTop: 10, padding: "9px 12px", borderRadius: 12, background: "rgba(46,160,67,0.12)", color: dark ? "#7ee2a8" : "#1e7a3c", fontSize: 13, fontWeight: 600 }}>
                {notice}
              </div>
            )}
            {error && original && (
              <div data-testid="sticker-editor-error" style={{ marginTop: 10, padding: "9px 12px", borderRadius: 12, background: "rgba(201,24,74,0.12)", color: "#c9184a", fontSize: 13, fontWeight: 600 }}>
                {error}
              </div>
            )}
            <div style={{ height: 12 }} />
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "10px 14px calc(12px + env(safe-area-inset-bottom, 0px))",
              borderTop: border,
              background: sheetBg,
            }}
          >
            <button
              data-testid="sticker-save-btn"
              onClick={() => act("saving")}
              disabled={!finalUrl || busy !== null || !!aiProgress}
              style={{
                flex: 1,
                padding: "14px 10px",
                borderRadius: 16,
                border,
                background: chipBg,
                color: fg,
                fontWeight: 800,
                fontSize: 15,
                cursor: "pointer",
                opacity: !finalUrl || !!aiProgress ? 0.5 : 1,
              }}
            >
              {busy === "saving" ? "Saving…" : "★ Save Sticker"}
            </button>
            <button
              data-testid="sticker-send-btn"
              onClick={() => act("sending")}
              disabled={!finalUrl || busy !== null || !!aiProgress}
              style={{
                flex: 1,
                padding: "14px 10px",
                borderRadius: 16,
                border: "none",
                background: ACCENT,
                color: "#fff",
                fontWeight: 800,
                fontSize: 15,
                cursor: "pointer",
                opacity: !finalUrl || !!aiProgress ? 0.5 : 1,
              }}
            >
              {busy === "sending" ? "Sending…" : "Send ➤"}
            </button>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}

function Spinner({ label, fg }: { label: string; fg: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: fg }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 999,
          border: "3px solid rgba(255,107,157,0.25)",
          borderTopColor: "#ff6b9d",
          animation: "hb-spin 0.8s linear infinite",
        }}
      />
      {label && <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8 }}>{label}</div>}
      <style>{`@keyframes hb-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Manual eraser — Picsart-style erase / restore brush with pinch-zoom & pan.
// ─────────────────────────────────────────────────────────────────────────────
type Tool = "erase" | "restore" | "move";

const MAX_HISTORY = 30;

function ManualEraser({
  dark,
  source,
  original,
  onCancel,
  onDone,
}: {
  dark: boolean;
  source: HTMLCanvasElement;
  original: HTMLCanvasElement;
  onCancel: () => void;
  onDone: (result: HTMLCanvasElement) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLCanvasElement>(null);
  const workRef = useRef<HTMLCanvasElement>(cloneCanvas(source));
  const undoRef = useRef<ImageData[]>([]);
  const redoRef = useRef<ImageData[]>([]);
  const [tool, setTool] = useState<Tool>("erase");
  const [brush, setBrush] = useState(36); // screen px
  const [hist, setHist] = useState({ undo: 0, redo: 0 });
  const [zoomPct, setZoomPct] = useState(100);
  const [hint, setHint] = useState(true);

  // view transform (image px → screen px): screen = img * scale + t
  const tRef = useRef({ scale: 1, tx: 0, ty: 0, fit: 1 });
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const strokeRef = useRef<{ last: { x: number; y: number } | null; active: boolean; pushed: boolean }>({ last: null, active: false, pushed: false });
  const pinchRef = useRef<{ d: number; mx: number; my: number; scale: number; tx: number; ty: number } | null>(null);
  const cursorRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const fg = dark ? "#f2f2f2" : "#5a1530";
  const chipBg = dark ? "rgba(255,255,255,0.09)" : "rgba(201,24,74,0.08)";
  const border = dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(201,24,74,0.18)";

  const render = useCallback(() => {
    rafRef.current = null;
    const view = viewRef.current;
    const wrap = wrapRef.current;
    if (!view || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const W = wrap.clientWidth;
    const H = wrap.clientHeight;
    if (view.width !== Math.round(W * dpr) || view.height !== Math.round(H * dpr)) {
      view.width = Math.round(W * dpr);
      view.height = Math.round(H * dpr);
    }
    const ctx = view.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, view.width, view.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { scale, tx, ty } = tRef.current;
    ctx.imageSmoothingEnabled = scale < 2;
    ctx.drawImage(workRef.current, tx, ty, workRef.current.width * scale, workRef.current.height * scale);
    // brush cursor
    const c = cursorRef.current;
    if (c && tool !== "move") {
      ctx.beginPath();
      ctx.arc(c.x, c.y, brush / 2, 0, Math.PI * 2);
      ctx.strokeStyle = tool === "erase" ? "rgba(255,60,90,0.95)" : "rgba(60,200,120,0.95)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 0.75;
      ctx.stroke();
    }
  }, [brush, tool]);

  const schedule = useCallback(() => {
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(render);
  }, [render]);

  const fit = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const W = wrap.clientWidth, H = wrap.clientHeight;
    const iw = workRef.current.width, ih = workRef.current.height;
    const s = Math.min((W - 24) / iw, (H - 24) / ih);
    tRef.current = { scale: s, tx: (W - iw * s) / 2, ty: (H - ih * s) / 2, fit: s };
    setZoomPct(100);
    schedule();
  }, [schedule]);

  useEffect(() => {
    fit();
    const ro = new ResizeObserver(() => { fit(); });
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [fit]);

  useEffect(() => { schedule(); }, [schedule, tool, brush]);

  const clampTransform = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const t = tRef.current;
    const W = wrap.clientWidth, H = wrap.clientHeight;
    const iw = workRef.current.width * t.scale, ih = workRef.current.height * t.scale;
    // keep at least 40px of image visible on each axis
    t.tx = Math.min(Math.max(t.tx, 40 - iw), W - 40);
    t.ty = Math.min(Math.max(t.ty, 40 - ih), H - 40);
  };

  const zoomAt = (factor: number, sx: number, sy: number) => {
    const t = tRef.current;
    const next = Math.min(Math.max(t.scale * factor, t.fit * 0.5), t.fit * 12);
    const k = next / t.scale;
    t.tx = sx - (sx - t.tx) * k;
    t.ty = sy - (sy - t.ty) * k;
    t.scale = next;
    clampTransform();
    setZoomPct(Math.round((t.scale / t.fit) * 100));
    schedule();
  };

  const toImage = (sx: number, sy: number) => {
    const t = tRef.current;
    return { x: (sx - t.tx) / t.scale, y: (sy - t.ty) / t.scale };
  };

  const localPoint = (e: { clientX: number; clientY: number }) => {
    const r = wrapRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const pushHistory = () => {
    undoRef.current.push(snapshot(workRef.current));
    if (undoRef.current.length > MAX_HISTORY) undoRef.current.shift();
    redoRef.current = [];
    setHist({ undo: undoRef.current.length, redo: 0 });
  };

  // paint a soft disc (erase) or reveal the original (restore) at image coords
  const dab = (x: number, y: number) => {
    const ctx = workRef.current.getContext("2d")!;
    const r = Math.max(1, brush / 2 / tRef.current.scale); // image px
    ctx.save();
    if (tool === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.clip();
      // restore = copy the original pixels back (hard edge for precision)
      ctx.clearRect(x - r, y - r, r * 2, r * 2);
      ctx.drawImage(original, 0, 0, workRef.current.width, workRef.current.height);
    }
    ctx.restore();
  };

  const strokeTo = (p: { x: number; y: number }) => {
    const s = strokeRef.current;
    const q = toImage(p.x, p.y);
    if (!s.last) {
      dab(q.x, q.y);
    } else {
      const dx = q.x - s.last.x, dy = q.y - s.last.y;
      const dist = Math.hypot(dx, dy);
      const step = Math.max(1, (brush / 2 / tRef.current.scale) * 0.35);
      const n = Math.ceil(dist / step);
      for (let i = 1; i <= n; i++) dab(s.last.x + (dx * i) / n, s.last.y + (dy * i) / n);
    }
    s.last = q;
    schedule();
  };

  const endStroke = () => {
    const s = strokeRef.current;
    if (s.active) {
      s.active = false;
      s.last = null;
      s.pushed = false;
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    setHint(false);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    const p = localPoint(e);
    pointersRef.current.set(e.pointerId, p);
    cursorRef.current = p;

    if (pointersRef.current.size === 2) {
      // second finger → pinch/pan; abandon the current stroke (already drawn)
      endStroke();
      const [a, b] = Array.from(pointersRef.current.values());
      pinchRef.current = {
        d: Math.hypot(a.x - b.x, a.y - b.y),
        mx: (a.x + b.x) / 2,
        my: (a.y + b.y) / 2,
        scale: tRef.current.scale,
        tx: tRef.current.tx,
        ty: tRef.current.ty,
      };
      schedule();
      return;
    }
    if (pointersRef.current.size > 2) return;

    if (tool === "move") {
      pinchRef.current = { d: 0, mx: p.x, my: p.y, scale: tRef.current.scale, tx: tRef.current.tx, ty: tRef.current.ty };
      return;
    }
    const s = strokeRef.current;
    s.active = true;
    s.last = null;
    if (!s.pushed) {
      pushHistory();
      s.pushed = true;
    }
    strokeTo(p);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = localPoint(e);
    if (pointersRef.current.has(e.pointerId)) pointersRef.current.set(e.pointerId, p);
    cursorRef.current = p;

    if (pinchRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const pin = pinchRef.current;
      if (pts.length >= 2) {
        const [a, b] = pts;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const k = pin.d > 0 ? d / pin.d : 1;
        const t = tRef.current;
        const next = Math.min(Math.max(pin.scale * k, t.fit * 0.5), t.fit * 12);
        const kk = next / pin.scale;
        t.scale = next;
        t.tx = mx - (pin.mx - pin.tx) * kk;
        t.ty = my - (pin.my - pin.ty) * kk;
        clampTransform();
        setZoomPct(Math.round((t.scale / t.fit) * 100));
      } else if (pts.length === 1 && tool === "move") {
        const t = tRef.current;
        t.tx = pin.tx + (p.x - pin.mx);
        t.ty = pin.ty + (p.y - pin.my);
        clampTransform();
      }
      schedule();
      return;
    }
    if (strokeRef.current.active && pointersRef.current.size === 1) {
      strokeTo(p);
      return;
    }
    schedule(); // cursor ring follows hover on desktop
  };

  const onPointerUpOrCancel = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2 && pinchRef.current && tool !== "move") pinchRef.current = null;
    if (pointersRef.current.size === 0) {
      pinchRef.current = null;
      endStroke();
    }
    if (e.pointerType !== "mouse") cursorRef.current = null;
    schedule();
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const p = localPoint(e);
    zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, p.x, p.y);
  };

  const undo = () => {
    const prev = undoRef.current.pop();
    if (!prev) return;
    haptics.light();
    redoRef.current.push(snapshot(workRef.current));
    restore(workRef.current, prev);
    setHist({ undo: undoRef.current.length, redo: redoRef.current.length });
    schedule();
  };
  const redo = () => {
    const next = redoRef.current.pop();
    if (!next) return;
    haptics.light();
    undoRef.current.push(snapshot(workRef.current));
    restore(workRef.current, next);
    setHist({ undo: undoRef.current.length, redo: redoRef.current.length });
    schedule();
  };
  const reset = () => {
    haptics.medium();
    pushHistory();
    const ctx = workRef.current.getContext("2d")!;
    ctx.clearRect(0, 0, workRef.current.width, workRef.current.height);
    ctx.drawImage(source, 0, 0);
    schedule();
  };
  const finish = () => {
    haptics.medium();
    onDone(cloneCanvas(workRef.current));
  };

  const toolBtn = (t: Tool, label: string, testid: string) => (
    <button
      data-testid={testid}
      onClick={() => { haptics.light(); setTool(t); }}
      style={{
        flex: 1,
        padding: "11px 6px",
        borderRadius: 12,
        border: tool === t ? "1px solid transparent" : border,
        background: tool === t ? ACCENT : chipBg,
        color: tool === t ? "#fff" : fg,
        fontWeight: 700,
        fontSize: 13,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );

  const iconBtn = (label: string, onClick: () => void, disabled: boolean, testid: string, aria: string) => (
    <button
      data-testid={testid}
      aria-label={aria}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 44,
        height: 40,
        borderRadius: 12,
        border,
        background: chipBg,
        color: fg,
        fontSize: 16,
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.35 : 1,
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 12px 6px", gap: 8 }}>
        <button
          data-testid="manual-cancel"
          onClick={() => { haptics.light(); onCancel(); }}
          style={{ padding: "9px 14px", borderRadius: 999, border: "none", background: chipBg, color: fg, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          Cancel
        </button>
        <div style={{ flex: 1, textAlign: "center", fontWeight: 800, fontSize: 15 }}>Manual erase</div>
        <button
          data-testid="manual-done"
          onClick={finish}
          style={{ padding: "9px 16px", borderRadius: 999, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
        >
          Done ✓
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={wrapRef}
        data-testid="manual-canvas-wrap"
        style={{
          flex: 1,
          minHeight: 0,
          margin: "0 10px",
          borderRadius: 18,
          border,
          background: (dark ? "rgba(255,255,255,0.06)," : "rgba(255,255,255,0.9),") + CHECKER,
          overflow: "hidden",
          position: "relative",
          touchAction: "none",
        }}
      >
        <canvas
          ref={viewRef}
          data-testid="manual-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUpOrCancel}
          onPointerCancel={onPointerUpOrCancel}
          onPointerLeave={(e) => { if (e.pointerType === "mouse") { cursorRef.current = null; schedule(); } }}
          onWheel={onWheel}
          onContextMenu={(e) => e.preventDefault()}
          style={{ width: "100%", height: "100%", display: "block", touchAction: "none", cursor: tool === "move" ? "grab" : "none" }}
        />
        <div style={{ position: "absolute", top: 8, left: 10, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: "rgba(0,0,0,0.5)", color: "#fff", pointerEvents: "none" }}>
          {zoomPct}%
        </div>
        {hint && (
          <div
            data-testid="manual-hint"
            style={{ position: "absolute", left: 0, right: 0, bottom: 10, display: "flex", justifyContent: "center", pointerEvents: "none" }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999, background: "rgba(0,0,0,0.55)", color: "#fff", textAlign: "center" }}>
              Drag to erase · pinch to zoom · two fingers to pan
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ padding: "10px 12px calc(10px + env(safe-area-inset-bottom, 0px))", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {toolBtn("erase", "🧽 Erase", "manual-tool-erase")}
          {toolBtn("restore", "🩹 Restore", "manual-tool-restore")}
          {toolBtn("move", "✋ Move", "manual-tool-move")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: fg, width: 46 }}>Brush</span>
          <input
            data-testid="manual-brush"
            type="range"
            min={8}
            max={140}
            value={brush}
            onChange={(e) => setBrush(Number(e.target.value))}
            style={{ flex: 1, accentColor: "#ff6b9d", height: 28 }}
            aria-label="Brush size"
          />
          <span style={{ width: 34, textAlign: "right", fontSize: 12, fontWeight: 700, color: fg, fontVariantNumeric: "tabular-nums" }}>{brush}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {iconBtn("↶", undo, hist.undo === 0, "manual-undo", "Undo")}
          {iconBtn("↷", redo, hist.redo === 0, "manual-redo", "Redo")}
          {iconBtn("－", () => { const w = wrapRef.current!; zoomAt(1 / 1.25, w.clientWidth / 2, w.clientHeight / 2); }, false, "manual-zoom-out", "Zoom out")}
          {iconBtn("＋", () => { const w = wrapRef.current!; zoomAt(1.25, w.clientWidth / 2, w.clientHeight / 2); }, false, "manual-zoom-in", "Zoom in")}
          {iconBtn("⤢", fit, false, "manual-fit", "Fit to screen")}
          <div style={{ flex: 1 }} />
          <button
            data-testid="manual-reset"
            onClick={reset}
            style={{ padding: "10px 14px", borderRadius: 12, border, background: chipBg, color: "#c9184a", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            Reset
          </button>
        </div>
      </div>
    </>
  );
}
