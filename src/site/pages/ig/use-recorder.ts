// Hold-to-record voice notes (natural, unprocessed mic + AAC when possible).
import { useCallback, useEffect, useRef, useState } from "react";

const MIME_CANDIDATES = [
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/aac",
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/webm",
];

function micErrorMessage(err: unknown): string {
  const name = (err as { name?: string })?.name || "";
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError")
    return "Microphone access is blocked. Allow mic access in your settings, then try again.";
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "No microphone was found on this device.";
  if (name === "NotReadableError" || name === "TrackStartError") return "Your microphone is being used by another app.";
  return "Couldn't start recording. Please try again.";
}

export function useRecorder(onError: (msg: string) => void) {
  const [recording, setRecording] = useState(false);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const startTsRef = useRef(0);
  const startingRef = useRef(false);
  const abortRef = useRef(false);

  const release = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current) { try { void ctxRef.current.close(); } catch { /* noop */ } }
    ctxRef.current = null;
    analyserRef.current = null;
  }, []);

  useEffect(() => () => {
    try { mrRef.current?.stop(); } catch { /* noop */ }
    release();
  }, [release]);

  const start = useCallback(async () => {
    if (startingRef.current || mrRef.current) return;
    startingRef.current = true;
    abortRef.current = false;
    try {
      const natural: MediaTrackConstraints = { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: { ideal: 1 } };
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: natural });
      } catch (e) {
        if ((e as { name?: string })?.name !== "OverconstrainedError") throw e;
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      if (abortRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;
      const mime = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 128000 } : { audioBitsPerSecond: 128000 });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start();
      mrRef.current = mr;
      startTsRef.current = Date.now();
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      analyserRef.current = analyser;
      setRecording(true);
    } catch (err) {
      release();
      onError(micErrorMessage(err));
    } finally {
      startingRef.current = false;
    }
  }, [onError, release]);

  const cancel = useCallback(() => {
    abortRef.current = true;
    const mr = mrRef.current;
    if (mr && mr.state !== "inactive") { try { mr.stop(); } catch { /* noop */ } }
    mrRef.current = null;
    chunksRef.current = [];
    release();
    setRecording(false);
  }, [release]);

  /** Stops and returns the clip, or null when it was too short / never started. */
  const stop = useCallback(async (): Promise<{ blob: Blob; durationMs: number } | null> => {
    const mr = mrRef.current;
    if (!mr) { abortRef.current = true; return null; }
    const chunks = chunksRef.current;
    const type = mr.mimeType || "audio/webm";
    const done = new Promise<Blob>((resolve) => { mr.onstop = () => resolve(new Blob(chunks, { type })); });
    try { mr.stop(); } catch { /* noop */ }
    const blob = await done;
    mrRef.current = null;
    release();
    setRecording(false);
    const durationMs = Date.now() - startTsRef.current;
    if (durationMs < 400 || blob.size < 500) return null;
    return { blob, durationMs };
  }, [release]);

  return { recording, start, stop, cancel, analyserRef, startTsRef };
}
