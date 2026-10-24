import { i as __toESM } from "../_runtime.mjs";
import { d as require_react_dom, q as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as AnimatePresence } from "../_libs/framer-motion+[...].mjs";
import { t as motion } from "../_libs/motion.mjs";
import { C as haptics } from "./routes-dAk2nEzm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/video-recorder-B7F8R7EK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
function InAppVideoRecorder({ open, onClose, onCapture, onUnavailable }) {
	const [facing, setFacing] = (0, import_react.useState)("environment");
	const [ready, setReady] = (0, import_react.useState)(false);
	const [recording, setRecording] = (0, import_react.useState)(false);
	const [elapsed, setElapsed] = (0, import_react.useState)(0);
	const [error, setError] = (0, import_react.useState)(null);
	const [switching, setSwitching] = (0, import_react.useState)(false);
	const videoRef = (0, import_react.useRef)(null);
	const streamRef = (0, import_react.useRef)(null);
	const recRef = (0, import_react.useRef)(null);
	const chunksRef = (0, import_react.useRef)([]);
	const startTsRef = (0, import_react.useRef)(0);
	const timerRef = (0, import_react.useRef)(null);
	const mimeRef = (0, import_react.useRef)("video/webm");
	const pickMime = () => {
		for (const m of [
			"video/mp4;codecs=avc1,mp4a",
			"video/mp4",
			"video/webm;codecs=vp9,opus",
			"video/webm;codecs=vp8,opus",
			"video/webm"
		]) if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
		return "";
	};
	const stopStream = () => {
		const s = streamRef.current;
		if (s) s.getTracks().forEach((t) => {
			try {
				t.stop();
			} catch {}
		});
		streamRef.current = null;
		if (videoRef.current) try {
			videoRef.current.srcObject = null;
		} catch {}
	};
	const acquireStream = async (which) => {
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
					frameRate: { ideal: 30 }
				},
				audio: {
					echoCancellation: true,
					noiseSuppression: true
				}
			});
			const vTrack = stream.getVideoTracks()[0];
			if (vTrack && typeof vTrack.applyConstraints === "function") try {
				await vTrack.applyConstraints({ advanced: [{ focusMode: "continuous" }] });
			} catch {}
			return stream;
		} catch (err) {
			console.error("[recorder] getUserMedia failed", err);
			const msg = err?.name === "NotAllowedError" ? "Camera access was denied. Enable it in your browser settings." : err?.name === "NotFoundError" ? "No camera found on this device." : "Couldn't open the camera. Try again or pick from gallery.";
			setError(msg);
			return null;
		}
	};
	(0, import_react.useEffect)(() => {
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
				try {
					await videoRef.current.play();
				} catch {}
			}
			setReady(true);
		})();
		return () => {
			cancelled = true;
			if (timerRef.current) {
				window.clearInterval(timerRef.current);
				timerRef.current = null;
			}
			if (recRef.current && recRef.current.state !== "inactive") try {
				recRef.current.stop();
			} catch {}
			recRef.current = null;
			stopStream();
		};
	}, [open]);
	const flipCamera = async () => {
		if (recording || switching) return;
		haptics.light();
		setSwitching(true);
		const next = facing === "environment" ? "user" : "environment";
		stopStream();
		const stream = await acquireStream(next);
		if (stream) {
			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				try {
					await videoRef.current.play();
				} catch {}
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
			const rec = new MediaRecorder(stream, mime ? {
				mimeType: mime,
				videoBitsPerSecond: 4e6,
				audioBitsPerSecond: 128e3
			} : void 0);
			rec.ondataavailable = (e) => {
				if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
			};
			rec.onstop = () => {
				const blob = new Blob(chunksRef.current, { type: mimeRef.current });
				const ext = mimeRef.current.includes("mp4") ? "mp4" : "webm";
				onCapture(new File([blob], `chat-video-${Date.now()}.${ext}`, { type: mimeRef.current.split(";")[0] || "video/webm" }));
			};
			rec.start(500);
			recRef.current = rec;
			setRecording(true);
			startTsRef.current = Date.now();
			setElapsed(0);
			timerRef.current = window.setInterval(() => {
				setElapsed(Math.floor((Date.now() - startTsRef.current) / 1e3));
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
		try {
			rec.stop();
		} catch {}
		recRef.current = null;
		setRecording(false);
		if (timerRef.current) {
			window.clearInterval(timerRef.current);
			timerRef.current = null;
		}
	};
	const handleClose = () => {
		if (recording) {
			const rec = recRef.current;
			if (rec) rec.onstop = null;
			try {
				rec?.stop();
			} catch {}
			recRef.current = null;
			setRecording(false);
			if (timerRef.current) {
				window.clearInterval(timerRef.current);
				timerRef.current = null;
			}
			chunksRef.current = [];
		}
		stopStream();
		onClose();
	};
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const onKey = (e) => {
			if (e.key === "Escape") handleClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, recording]);
	if (typeof document === "undefined") return null;
	const fmt = (s) => {
		return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
	};
	const node = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		className: "fixed inset-0 z-[500] flex items-center justify-center",
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		transition: { duration: .22 },
		style: { background: "#000" },
		"data-testid": "inapp-video-recorder",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				ref: videoRef,
				autoPlay: true,
				muted: true,
				playsInline: true,
				"data-testid": "recorder-preview",
				style: {
					position: "absolute",
					inset: 0,
					width: "100%",
					height: "100%",
					objectFit: "cover",
					transform: facing === "user" ? "scaleX(-1)" : "none",
					background: "#000"
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					padding: "max(16px, env(safe-area-inset-top)) 16px 12px",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					zIndex: 2,
					background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
						onClick: handleClose,
						whileHover: { scale: 1.08 },
						whileTap: { scale: .9 },
						"data-testid": "recorder-close",
						"aria-label": "Close camera",
						style: {
							width: 42,
							height: 42,
							borderRadius: 999,
							background: "rgba(255,255,255,0.16)",
							border: "1px solid rgba(255,255,255,0.28)",
							color: "white",
							fontSize: 20,
							cursor: "pointer",
							backdropFilter: "blur(10px)",
							WebkitBackdropFilter: "blur(10px)"
						},
						children: "✕"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: recording && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
						initial: {
							opacity: 0,
							y: -6
						},
						animate: {
							opacity: 1,
							y: 0
						},
						exit: {
							opacity: 0,
							y: -6
						},
						"data-testid": "recorder-timer",
						style: {
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
							boxShadow: "0 4px 18px rgba(220,32,72,0.4)"
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
								animate: { opacity: [
									1,
									.25,
									1
								] },
								transition: {
									duration: 1.1,
									repeat: Infinity
								},
								style: {
									display: "inline-block",
									width: 9,
									height: 9,
									borderRadius: 999,
									background: "white"
								}
							}),
							"REC ",
							fmt(elapsed)
						]
					}, "timer") }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
						onClick: () => {
							flipCamera();
						},
						whileHover: { scale: recording ? 1 : 1.08 },
						whileTap: { scale: recording ? 1 : .9 },
						disabled: recording || switching || !ready,
						"data-testid": "recorder-flip",
						"aria-label": "Flip camera",
						style: {
							width: 42,
							height: 42,
							borderRadius: 999,
							background: "rgba(255,255,255,0.16)",
							border: "1px solid rgba(255,255,255,0.28)",
							color: "white",
							fontSize: 20,
							cursor: recording ? "not-allowed" : "pointer",
							backdropFilter: "blur(10px)",
							WebkitBackdropFilter: "blur(10px)",
							opacity: recording ? .4 : 1
						},
						children: "🔄"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					position: "absolute",
					left: 0,
					right: 0,
					bottom: 0,
					padding: "24px 16px max(28px, env(safe-area-inset-bottom))",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					zIndex: 2,
					background: "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)"
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
					onClick: () => recording ? stopRecording() : startRecording(),
					whileTap: { scale: .92 },
					disabled: !ready,
					"data-testid": "recorder-record-btn",
					"aria-label": recording ? "Stop recording" : "Start recording",
					style: {
						width: 78,
						height: 78,
						borderRadius: 999,
						border: "4px solid white",
						background: recording ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.15)",
						cursor: ready ? "pointer" : "wait",
						position: "relative",
						boxShadow: "0 0 0 4px rgba(255,255,255,0.18), 0 8px 30px rgba(0,0,0,0.4)"
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
						animate: recording ? {
							borderRadius: 8,
							width: 34,
							height: 34
						} : {
							borderRadius: 999,
							width: 58,
							height: 58
						},
						transition: {
							duration: .22,
							ease: [
								.22,
								1,
								.36,
								1
							]
						},
						style: {
							position: "absolute",
							left: "50%",
							top: "50%",
							transform: "translate(-50%, -50%)",
							background: "#ff2b5b",
							display: "block"
						}
					})
				})
			}),
			!ready && !error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					position: "absolute",
					inset: 0,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "rgba(255,255,255,0.7)",
					fontFamily: "'Cormorant Garamond', serif",
					fontSize: 16,
					zIndex: 3,
					pointerEvents: "none"
				},
				children: "Opening camera…"
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				"data-testid": "recorder-error",
				style: {
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
					background: "rgba(0,0,0,0.9)"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: { fontSize: 40 },
						children: "📷"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 16,
							opacity: .9
						},
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: 10
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: onUnavailable,
							style: {
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
								cursor: "pointer"
							},
							children: "Pick from gallery"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: handleClose,
							style: {
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
								cursor: "pointer"
							},
							children: "Close"
						})]
					})
				]
			})
		]
	}) });
	return (0, import_react_dom.createPortal)(node, document.body);
}
//#endregion
export { InAppVideoRecorder };
