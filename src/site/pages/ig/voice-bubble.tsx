// Instagram-style voice note bubble: play button, waveform that fills while
// playing, and the length. Playback uses Web Audio with gentle loudness
// normalisation so every note plays at a comfortable level on any phone.
import { useEffect, useMemo, useRef, useState } from "react";
import { IconPause, IconPlay } from "./icons.tsx";
import { fmtDuration } from "./util.ts";

const BARS = 30;

function hashBars(url: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < url.length; i++) { h ^= url.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Array.from({ length: BARS }, (_, i) => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    const r = ((h >>> 0) % 1000) / 1000;
    return 0.25 + 0.75 * Math.abs(Math.sin(i * 0.55 + r * 2.4)) * (0.55 + r * 0.45);
  });
}

function peaksOf(buf: AudioBuffer): number[] {
  const data = buf.getChannelData(0);
  const step = Math.max(1, Math.floor(data.length / BARS));
  const out: number[] = [];
  let max = 0.0001;
  for (let b = 0; b < BARS; b++) {
    let sum = 0;
    const start = b * step;
    for (let i = start; i < Math.min(data.length, start + step); i += 16) sum += Math.abs(data[i]);
    const v = sum / (step / 16);
    out.push(v);
    if (v > max) max = v;
  }
  return out.map((v) => 0.18 + 0.82 * (v / max));
}

let activeStop: (() => void) | null = null;

export default function VoiceBubble({ url, durationMs }: { url: string; durationMs: number }) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [cur, setCur] = useState(0);
  const [total, setTotal] = useState(durationMs);
  const [bars, setBars] = useState<number[]>(() => hashBars(url));
  const ctxRef = useRef<AudioContext | null>(null);
  const bufRef = useRef<AudioBuffer | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const startRef = useRef(0);
  const offsetRef = useRef(0);
  const rafRef = useRef(0);
  const gainRef = useRef(1);
  const decodeRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    try { srcRef.current?.stop(); } catch { /* noop */ }
    if (ctxRef.current) { try { void ctxRef.current.close(); } catch { /* noop */ } }
  }, []);

  const ensure = (): Promise<boolean> => {
    if (bufRef.current) return Promise.resolve(true);
    if (decodeRef.current) return decodeRef.current;
    decodeRef.current = (async () => {
      setLoading(true);
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = ctxRef.current ?? new AC();
        ctxRef.current = ctx;
        if (ctx.state === "suspended") { try { await ctx.resume(); } catch { /* noop */ } }
        const res = await fetch(url, { mode: "cors", cache: "force-cache" });
        if (!res.ok) throw new Error(String(res.status));
        const arr = await res.arrayBuffer();
        const buf = await new Promise<AudioBuffer>((resolve, reject) => {
          const p = ctx.decodeAudioData(arr.slice(0), resolve, reject);
          if (p && typeof (p as Promise<AudioBuffer>).then === "function") (p as Promise<AudioBuffer>).then(resolve, reject);
        });
        bufRef.current = buf;
        const data = buf.getChannelData(0);
        let peak = 0.0001;
        let sum = 0;
        let n = 0;
        for (let i = 0; i < data.length; i += 8) {
          const a = Math.abs(data[i]);
          if (a > peak) peak = a;
          if (a > 0.01) { sum += a * a; n++; }
        }
        const rms = n ? Math.sqrt(sum / n) : 0;
        gainRef.current = Math.min(6.3, Math.max(1, Math.min(rms > 0.0005 ? 0.126 / rms : 1, (0.97 / peak) * 1.6)));
        setBars(peaksOf(buf));
        if (isFinite(buf.duration) && buf.duration > 0) setTotal(Math.round(buf.duration * 1000));
        setFailed(false);
        return true;
      } catch {
        setFailed(true);
        decodeRef.current = null;
        return false;
      } finally {
        setLoading(false);
      }
    })();
    return decodeRef.current;
  };

  const pause = () => {
    const ctx = ctxRef.current;
    if (!ctx || !srcRef.current) return;
    offsetRef.current = Math.min(bufRef.current?.duration ?? 0, ctx.currentTime - startRef.current);
    const src = srcRef.current;
    srcRef.current = null;
    try { src.stop(); } catch { /* noop */ }
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    if (activeStop === pause) activeStop = null;
  };

  const play = () => {
    const ctx = ctxRef.current;
    const buf = bufRef.current;
    if (!ctx || !buf) return;
    if (activeStop && activeStop !== pause) activeStop();
    activeStop = pause;
    if (ctx.state === "suspended") void ctx.resume();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = gainRef.current;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.06;
    src.connect(gain).connect(limiter).connect(ctx.destination);
    const from = Math.max(0, Math.min(buf.duration - 0.01, offsetRef.current));
    src.start(0, from);
    startRef.current = ctx.currentTime - from;
    srcRef.current = src;
    setPlaying(true);
    src.onended = () => {
      if (srcRef.current !== src) return;
      srcRef.current = null;
      offsetRef.current = 0;
      setCur(0);
      setPlaying(false);
      cancelAnimationFrame(rafRef.current);
    };
    const tick = () => {
      const c = ctxRef.current;
      if (!c || srcRef.current !== src) return;
      setCur(Math.round(Math.min(buf.duration, c.currentTime - startRef.current) * 1000));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const toggle = async () => {
    if (playing) return pause();
    if (await ensure()) play();
  };

  const seek = async (pct: number) => {
    if (!(await ensure()) || !bufRef.current) return;
    offsetRef.current = pct * bufRef.current.duration;
    setCur(Math.round(offsetRef.current * 1000));
    if (playing) {
      const s = srcRef.current;
      srcRef.current = null;
      try { s?.stop(); } catch { /* noop */ }
      play();
    }
  };

  const length = total || durationMs || 1;
  const progress = Math.min(1, cur / length);
  const barEls = useMemo(
    () =>
      bars.map((b, i) => (
        <span key={i} className="ig-wave-bar" data-on={(i + 0.5) / BARS <= progress ? "" : undefined} style={{ height: `${Math.round(b * 100)}%` }} />
      )),
    [bars, progress],
  );

  return (
    <div className="ig-voice" data-testid="voice-bubble">
      <button
        type="button"
        className="ig-voice-play"
        data-testid="voice-play-btn"
        onClick={(e) => { e.stopPropagation(); void toggle(); }}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
      >
        {loading ? <span className="ig-spin" /> : failed ? "!" : playing ? <IconPause size={18} /> : <IconPlay size={18} />}
      </button>
      <div
        className="ig-wave"
        onClick={(e) => {
          e.stopPropagation();
          const r = e.currentTarget.getBoundingClientRect();
          void seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
        }}
      >
        {barEls}
      </div>
      <span className="ig-voice-time">{fmtDuration(playing || cur > 0 ? cur : length)}</span>
    </div>
  );
}
