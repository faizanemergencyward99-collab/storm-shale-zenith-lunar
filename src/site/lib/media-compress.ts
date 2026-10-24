// Client-side media compression before upload (lifted out of the old chat overlay).

// ─── Image compression (client-side before upload) ───────────────────────────
export async function compressImage(file: File, maxSide = 1920, quality = 0.85): Promise<{ blob: Blob; width: number; height: number } | null> {
  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image load failed"));
      img.src = url;
    });
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    let w = iw, h = ih;
    if (Math.max(iw, ih) > maxSide) {
      const scale = maxSide / Math.max(iw, ih);
      w = Math.round(iw * scale);
      h = Math.round(ih * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    const blob: Blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", quality);
    });
    return { blob, width: w, height: h };
  } catch {
    return null;
  }
}

// ─── Video metadata probe (client-side before upload) ───────────────────────
export async function probeVideoMeta(file: File): Promise<{ width: number; height: number; durationMs: number } | null> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.playsInline = true;
      const done = (result: { width: number; height: number; durationMs: number } | null) => {
        try { URL.revokeObjectURL(url); } catch { /* noop */ }
        resolve(result);
      };
      v.onloadedmetadata = () => {
        const w = v.videoWidth || 0;
        const h = v.videoHeight || 0;
        const d = isFinite(v.duration) ? Math.round(v.duration * 1000) : 0;
        done({ width: w, height: h, durationMs: d });
      };
      v.onerror = () => done(null);
      v.src = url;
    } catch {
      resolve(null);
    }
  });
}

// ─── Video compression (browser-native) ─────────────────────────────────────
// Re-encodes the video via canvas.captureStream() + MediaRecorder, scaling
// the long edge to a max of 1280 and targeting a total file size ≲ 40 MB
// (audio preserved via WebAudio graph). Only runs when the source is large.
// Returns null on failure — caller should fall back to the original file.
export async function compressVideo(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ blob: Blob; width: number; height: number; durationMs: number; mime: string } | null> {
  let url = "";
  let audioCtx: AudioContext | null = null;
  let raf = 0;
  try {
    url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.playsInline = true;
    video.preload = "auto";
    video.volume = 0; // no audible playback; audio still flows through WebAudio graph
    video.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("metadata failed"));
    });

    const srcW = video.videoWidth || 0;
    const srcH = video.videoHeight || 0;
    const durationSec = isFinite(video.duration) ? video.duration : 0;
    if (srcW < 2 || srcH < 2 || durationSec < 0.05) {
      throw new Error("invalid dimensions or duration");
    }
    const durationMs = Math.round(durationSec * 1000);

    // Scale long edge to at most MAX_SIDE_ACTUAL — 1920 preserves detail
    // for motion clips (raised from 1280 to reduce mid-recording softness).
    const MAX_SIDE_ACTUAL = 1920;

    // Scale long edge to at most MAX_SIDE_ACTUAL, preserving aspect ratio, round to even
    let w = srcW, h = srcH;
    if (Math.max(srcW, srcH) > MAX_SIDE_ACTUAL) {
      const scale = MAX_SIDE_ACTUAL / Math.max(srcW, srcH);
      w = Math.round(srcW * scale);
      h = Math.round(srcH * scale);
    }
    w = w - (w % 2);
    h = h - (h % 2);
    if (w < 2 || h < 2) throw new Error("target dims degenerate");

    // Target size ≈ 45 MB total; carve out 128 kbps for audio.
    // Larger cap on video bitrate (8 Mbps) preserves detail during motion.
    const TARGET_BYTES = 45 * 1024 * 1024;
    const audioBps = 128_000;
    const gross = (TARGET_BYTES * 8) / Math.max(1, durationSec);
    const videoBps = Math.max(1_500_000, Math.min(8_000_000, gross - audioBps));

    // Choose an output MIME the browser can encode
    const mimeCandidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4;codecs=avc1,mp4a",
      "video/mp4",
    ];
    let outMime = "";
    for (const m of mimeCandidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) {
        outMime = m; break;
      }
    }
    if (!outMime) throw new Error("no supported MediaRecorder mime");

    // Canvas + video track
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    const videoStream = (canvas as HTMLCanvasElement & {
      captureStream: (fps?: number) => MediaStream;
    }).captureStream(30);

    // Extract audio via WebAudio. NOTE: MediaElementSource disconnects the
    // element's default output → user won't hear anything. We only route to
    // a MediaStreamDestination so the recorder picks it up.
    let combinedStream: MediaStream = videoStream;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AC();
      const srcNode = audioCtx.createMediaElementSource(video);
      const destNode = audioCtx.createMediaStreamDestination();
      srcNode.connect(destNode);
      const aTracks = destNode.stream.getAudioTracks();
      if (aTracks.length > 0) {
        combinedStream = new MediaStream([
          ...videoStream.getVideoTracks(),
          ...aTracks,
        ]);
      }
    } catch {
      // No audio (or MediaElementSource unavailable) — proceed video-only
    }

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: outMime,
      videoBitsPerSecond: videoBps,
      audioBitsPerSecond: audioBps,
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };

    const drawLoop = () => {
      if (video.paused || video.ended) return;
      ctx.drawImage(video, 0, 0, w, h);
      if (onProgress && durationSec > 0) {
        try { onProgress(Math.min(0.99, video.currentTime / durationSec)); } catch { /* noop */ }
      }
      raf = requestAnimationFrame(drawLoop);
    };

    recorder.start(500);
    await video.play();
    raf = requestAnimationFrame(drawLoop);

    await new Promise<void>((resolve) => {
      const onEnd = () => resolve();
      video.addEventListener("ended", onEnd, { once: true });
    });
    // Cover the last frame
    try { ctx.drawImage(video, 0, 0, w, h); } catch { /* noop */ }
    if (raf) { cancelAnimationFrame(raf); raf = 0; }

    recorder.stop();
    await new Promise<void>((resolve) => { recorder.onstop = () => resolve(); });

    const outType = outMime.split(";")[0];
    const blob = new Blob(chunks, { type: outType });
    if (onProgress) { try { onProgress(1); } catch { /* noop */ } }

    // Cleanup audio graph
    try { await audioCtx?.close(); } catch { /* noop */ }
    audioCtx = null;
    try { URL.revokeObjectURL(url); } catch { /* noop */ }

    // If compression somehow made the file bigger, bail
    if (blob.size >= file.size) return null;
    return { blob, width: w, height: h, durationMs, mime: outType };
  } catch (err) {
    console.warn("[chat] compressVideo failed", err);
    if (raf) { try { cancelAnimationFrame(raf); } catch { /* noop */ } }
    if (audioCtx) { try { await audioCtx.close(); } catch { /* noop */ } }
    if (url) { try { URL.revokeObjectURL(url); } catch { /* noop */ } }
    return null;
  }
}
