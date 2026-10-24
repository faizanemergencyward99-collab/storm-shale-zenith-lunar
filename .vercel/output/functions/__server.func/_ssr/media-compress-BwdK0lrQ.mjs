//#region node_modules/.nitro/vite/services/ssr/assets/media-compress-BwdK0lrQ.js
async function compressImage(file, maxSide = 1920, quality = .85) {
	try {
		const url = URL.createObjectURL(file);
		const img = new Image();
		await new Promise((resolve, reject) => {
			img.onload = () => resolve();
			img.onerror = () => reject(/* @__PURE__ */ new Error("image load failed"));
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
		return {
			blob: await new Promise((resolve) => {
				canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", quality);
			}),
			width: w,
			height: h
		};
	} catch {
		return null;
	}
}
async function probeVideoMeta(file) {
	return new Promise((resolve) => {
		try {
			const url = URL.createObjectURL(file);
			const v = document.createElement("video");
			v.preload = "metadata";
			v.muted = true;
			v.playsInline = true;
			const done = (result) => {
				try {
					URL.revokeObjectURL(url);
				} catch {}
				resolve(result);
			};
			v.onloadedmetadata = () => {
				const w = v.videoWidth || 0;
				const h = v.videoHeight || 0;
				const d = isFinite(v.duration) ? Math.round(v.duration * 1e3) : 0;
				done({
					width: w,
					height: h,
					durationMs: d
				});
			};
			v.onerror = () => done(null);
			v.src = url;
		} catch {
			resolve(null);
		}
	});
}
async function compressVideo(file, onProgress) {
	let url = "";
	let audioCtx = null;
	let raf = 0;
	try {
		url = URL.createObjectURL(file);
		const video = document.createElement("video");
		video.src = url;
		video.playsInline = true;
		video.preload = "auto";
		video.volume = 0;
		video.crossOrigin = "anonymous";
		await new Promise((resolve, reject) => {
			video.onloadedmetadata = () => resolve();
			video.onerror = () => reject(/* @__PURE__ */ new Error("metadata failed"));
		});
		const srcW = video.videoWidth || 0;
		const srcH = video.videoHeight || 0;
		const durationSec = isFinite(video.duration) ? video.duration : 0;
		if (srcW < 2 || srcH < 2 || durationSec < .05) throw new Error("invalid dimensions or duration");
		const durationMs = Math.round(durationSec * 1e3);
		const MAX_SIDE_ACTUAL = 1920;
		let w = srcW, h = srcH;
		if (Math.max(srcW, srcH) > MAX_SIDE_ACTUAL) {
			const scale = MAX_SIDE_ACTUAL / Math.max(srcW, srcH);
			w = Math.round(srcW * scale);
			h = Math.round(srcH * scale);
		}
		w = w - w % 2;
		h = h - h % 2;
		if (w < 2 || h < 2) throw new Error("target dims degenerate");
		const TARGET_BYTES = 47185920;
		const audioBps = 128e3;
		const gross = TARGET_BYTES * 8 / Math.max(1, durationSec);
		const videoBps = Math.max(15e5, Math.min(8e6, gross - audioBps));
		const mimeCandidates = [
			"video/webm;codecs=vp9,opus",
			"video/webm;codecs=vp8,opus",
			"video/webm",
			"video/mp4;codecs=avc1,mp4a",
			"video/mp4"
		];
		let outMime = "";
		for (const m of mimeCandidates) if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) {
			outMime = m;
			break;
		}
		if (!outMime) throw new Error("no supported MediaRecorder mime");
		const canvas = document.createElement("canvas");
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("no 2d context");
		const videoStream = canvas.captureStream(30);
		let combinedStream = videoStream;
		try {
			audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			const srcNode = audioCtx.createMediaElementSource(video);
			const destNode = audioCtx.createMediaStreamDestination();
			srcNode.connect(destNode);
			const aTracks = destNode.stream.getAudioTracks();
			if (aTracks.length > 0) combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...aTracks]);
		} catch {}
		const recorder = new MediaRecorder(combinedStream, {
			mimeType: outMime,
			videoBitsPerSecond: videoBps,
			audioBitsPerSecond: audioBps
		});
		const chunks = [];
		recorder.ondataavailable = (e) => {
			if (e.data && e.data.size > 0) chunks.push(e.data);
		};
		const drawLoop = () => {
			if (video.paused || video.ended) return;
			ctx.drawImage(video, 0, 0, w, h);
			if (onProgress && durationSec > 0) try {
				onProgress(Math.min(.99, video.currentTime / durationSec));
			} catch {}
			raf = requestAnimationFrame(drawLoop);
		};
		recorder.start(500);
		await video.play();
		raf = requestAnimationFrame(drawLoop);
		await new Promise((resolve) => {
			const onEnd = () => resolve();
			video.addEventListener("ended", onEnd, { once: true });
		});
		try {
			ctx.drawImage(video, 0, 0, w, h);
		} catch {}
		if (raf) {
			cancelAnimationFrame(raf);
			raf = 0;
		}
		recorder.stop();
		await new Promise((resolve) => {
			recorder.onstop = () => resolve();
		});
		const outType = outMime.split(";")[0];
		const blob = new Blob(chunks, { type: outType });
		if (onProgress) try {
			onProgress(1);
		} catch {}
		try {
			await audioCtx?.close();
		} catch {}
		audioCtx = null;
		try {
			URL.revokeObjectURL(url);
		} catch {}
		if (blob.size >= file.size) return null;
		return {
			blob,
			width: w,
			height: h,
			durationMs,
			mime: outType
		};
	} catch (err) {
		console.warn("[chat] compressVideo failed", err);
		if (raf) try {
			cancelAnimationFrame(raf);
		} catch {}
		if (audioCtx) try {
			await audioCtx.close();
		} catch {}
		if (url) try {
			URL.revokeObjectURL(url);
		} catch {}
		return null;
	}
}
//#endregion
export { compressImage, compressVideo, probeVideoMeta };
