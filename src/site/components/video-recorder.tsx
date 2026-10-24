// Full-screen in-app video recorder (lifted out of the old chat overlay).
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { haptics } from "@/site/lib/haptics.ts";

// ─── In-app video recorder ───────────────────────────────────────────────
// Full-screen modal that streams the device camera via getUserMedia, records
// with MediaRecorder, and hands the resulting File back to the caller. This
// exists because iOS's file-input video mode has an autofocus bug where the
// preview blurs a couple of seconds into recording — controlling the pipeline
// ourselves keeps the frame sharp AND lets us add a front/back camera toggle.
export function InAppVideoRecorder({
  open,
  onClose,
  onCapture,
  onUnavailable,
}: {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  onUnavailable: () => void;
}) {
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTsRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const mimeRef = useRef<string>("video/webm");

  // Pick the best MediaRecorder MIME the browser can encode.
  const pickMime = (): string => {
    const candidates = [
      "video/mp4;codecs=avc1,mp4a",
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    for (const m of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) {
        return m;
      }
    }
    return "";
  };

  const stopStream = () => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => { try { t.stop(); } catch { /* noop */ } });
    }
    streamRef.current = null;
    if (videoRef.current) {
      try { videoRef.current.srcObject = null; } catch { /* noop */ }
    }
  };

  const acquireStream = async (which: "user" | "environment") => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Camera not supported on this browser.");
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: which },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      // Fix autofocus hunting: if the browser exposes continuous focus, ask for
      // it explicitly so the preview locks quickly instead of drifting.
      const vTrack = stream.getVideoTracks()[0];
      if (vTrack && typeof vTrack.applyConstraints === "function") {
        try {
          await vTrack.applyConstraints({
            advanced: [
              { focusMode: "continuous" } as MediaTrackConstraintSet,
            ],
          });
        } catch { /* not all browsers support focusMode; ignore */ }
      }
      return stream;
    } catch (err) {
      console.error("[recorder] getUserMedia failed", err);
      const msg =
        (err as DOMException)?.name === "NotAllowedError"
          ? "Camera access was denied. Enable it in your browser settings."
          : (err as DOMException)?.name === "NotFoundError"
          ? "No camera found on this device."
          : "Couldn't open the camera. Try again or pick from gallery.";
      setError(msg);
      return null;
    }
  };

  // Open / close lifecycle
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setReady(false);
    setError(null);
    setElapsed(0);
    setRecording(false);
    chunksRef.current = [];

    (async () => {
      const stream = await acquireStream(facing);
      if (cancelled) {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        return;
      }
      if (!stream) return;
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        try { await videoRef.current.play(); } catch { /* noop */ }
      }
      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
      if (recRef.current && recRef.current.state !== "inactive") {
        try { recRef.current.stop(); } catch { /* noop */ }
      }
      recRef.current = null;
      stopStream();
    };
  }, [open]);

  // Flip camera: reacquire stream with the opposite facing mode without
  // closing the modal.
  const flipCamera = async () => {
    if (recording || switching) return;
    haptics.light();
    setSwitching(true);
    const next: "user" | "environment" = facing === "environment" ? "user" : "environment";
    stopStream();
    const stream = await acquireStream(next);
    if (stream) {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch { /* noop */ }
      }
      setFacing(next);
    }
    setSwitching(false);
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream || recording) return;
    const mime = pickMime();
    mimeRef.current = mime || "video/webm";
    haptics.light();
    try {
      chunksRef.current = [];
      const rec = new MediaRecorder(
        stream,
        mime
          ? { mimeType: mime, videoBitsPerSecond: 4_000_000, audioBitsPerSecond: 128_000 }
          : undefined,
      );
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeRef.current });
        const ext = mimeRef.current.includes("mp4") ? "mp4" : "webm";
        const file = new File(
          [blob],
          `chat-video-${Date.now()}.${ext}`,
          { type: mimeRef.current.split(";")[0] || "video/webm" },
        );
        onCapture(file);
      };
      rec.start(500);
      recRef.current = rec;
      setRecording(true);
      startTsRef.current = Date.now();
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTsRef.current) / 1000));
      }, 200);
    } catch (err) {
      console.error("[recorder] start failed", err);
      setError("Couldn't start recording. Try again.");
    }
  };

  const stopRecording = () => {
    const rec = recRef.current;
    if (!rec || rec.state === "inactive") return;
    haptics.light();
    try { rec.stop(); } catch { /* noop */ }
    recRef.current = null;
    setRecording(false);
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  };

  const handleClose = () => {
    if (recording) {
      // Abort the recording — discard buffered chunks so no clip is sent.
      const rec = recRef.current;
      if (rec) rec.onstop = null;
      try { rec?.stop(); } catch { /* noop */ }
      recRef.current = null;
      setRecording(false);
      if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
      chunksRef.current = [];
    }
    stopStream();
    onClose();
  };

  // Escape key closes the modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, recording]);

  if (typeof document === "undefined") return null;

  const fmt = (s: number) => {
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const node = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[500] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          style={{ background: "#000" }}
          data-testid="inapp-video-recorder"
        >
          {/* Live preview */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            data-testid="recorder-preview"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              // Mirror the front camera so it feels like a mirror.
              transform: facing === "user" ? "scaleX(-1)" : "none",
              background: "#000",
            }}
          />

          {/* Top bar */}
          <div
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              padding: "max(16px, env(safe-area-inset-top)) 16px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              zIndex: 2,
              background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)",
            }}
          >
            <motion.button
              onClick={handleClose}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              data-testid="recorder-close"
              aria-label="Close camera"
              style={{
                width: 42, height: 42, borderRadius: 999,
                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.28)",
                color: "white",
                fontSize: 20,
                cursor: "pointer",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
              }}
            >
              ✕
            </motion.button>

            {/* Timer (only visible while recording) */}
            <AnimatePresence>
              {recording && (
                <motion.div
                  key="timer"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  data-testid="recorder-timer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: "rgba(220,32,72,0.9)",
                    color: "white",
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 15,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "0.04em",
                    boxShadow: "0 4px 18px rgba(220,32,72,0.4)",
                  }}
                >
                  <motion.span
                    animate={{ opacity: [1, 0.25, 1] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                    style={{
                      display: "inline-block",
                      width: 9, height: 9, borderRadius: 999,
                      background: "white",
                    }}
                  />
                  REC {fmt(elapsed)}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Flip camera — disabled while recording so the take doesn't glitch */}
            <motion.button
              onClick={() => { void flipCamera(); }}
              whileHover={{ scale: recording ? 1 : 1.08 }}
              whileTap={{ scale: recording ? 1 : 0.9 }}
              disabled={recording || switching || !ready}
              data-testid="recorder-flip"
              aria-label="Flip camera"
              style={{
                width: 42, height: 42, borderRadius: 999,
                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.28)",
                color: "white",
                fontSize: 20,
                cursor: recording ? "not-allowed" : "pointer",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                opacity: recording ? 0.4 : 1,
              }}
            >
              🔄
            </motion.button>
          </div>

          {/* Bottom controls */}
          <div
            style={{
              position: "absolute",
              left: 0, right: 0, bottom: 0,
              padding: "24px 16px max(28px, env(safe-area-inset-bottom))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
              background: "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)",
            }}
          >
            <motion.button
              onClick={() => (recording ? stopRecording() : startRecording())}
              whileTap={{ scale: 0.92 }}
              disabled={!ready}
              data-testid="recorder-record-btn"
              aria-label={recording ? "Stop recording" : "Start recording"}
              style={{
                width: 78, height: 78, borderRadius: 999,
                border: "4px solid white",
                background: recording ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.15)",
                cursor: ready ? "pointer" : "wait",
                position: "relative",
                boxShadow: "0 0 0 4px rgba(255,255,255,0.18), 0 8px 30px rgba(0,0,0,0.4)",
              }}
            >
              <motion.span
                animate={
                  recording
                    ? { borderRadius: 8, width: 34, height: 34 }
                    : { borderRadius: 999, width: 58, height: 58 }
                }
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }}
                style={{
                  position: "absolute",
                  left: "50%", top: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "#ff2b5b",
                  display: "block",
                }}
              />
            </motion.button>
          </div>

          {/* Loading / error states */}
          {!ready && !error && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.7)",
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 16,
                zIndex: 3,
                pointerEvents: "none",
              }}
            >
              Opening camera…
            </div>
          )}
          {error && (
            <div
              data-testid="recorder-error"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                padding: "0 32px",
                textAlign: "center",
                color: "white",
                fontFamily: "'Cormorant Garamond', serif",
                zIndex: 4,
                background: "rgba(0,0,0,0.9)",
              }}
            >
              <div style={{ fontSize: 40 }}>📷</div>
              <div style={{ fontSize: 16, opacity: 0.9 }}>{error}</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={onUnavailable}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 999,
                    background: "linear-gradient(135deg,#ff8fab,#ff4d7a)",
                    color: "white",
                    border: "none",
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Pick from gallery
                </button>
                <button
                  onClick={handleClose}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.14)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.28)",
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(node, document.body);
}

