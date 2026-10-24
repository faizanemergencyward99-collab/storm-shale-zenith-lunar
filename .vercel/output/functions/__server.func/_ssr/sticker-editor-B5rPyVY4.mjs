import { i as __toESM } from "../_runtime.mjs";
import { d as require_react_dom, q as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as haptics } from "./routes-dAk2nEzm.mjs";
import { a as describeImageError, c as makeCanvas, i as decodeImageFile, l as restore, n as canvasToBlob, o as exportSticker, r as cloneCanvas, s as finalizeSticker, u as snapshot } from "./sticker-tray-DKyk05Hu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sticker-editor-B5rPyVY4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
var BgRemovalError = class extends Error {};
var isMobileDevice = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 900;
function pickModel() {
	const mem = navigator.deviceMemory;
	if (typeof mem === "number" && mem <= 4) return "isnet_quint8";
	return isMobileDevice() ? "isnet_quint8" : "isnet_fp16";
}
var libPromise = null;
function loadLib() {
	if (!libPromise) libPromise = import("../_libs/imgly__background-removal.mjs").then((n) => n.t).then((m) => m.removeBackground ?? m.default).catch((e) => {
		libPromise = null;
		throw e;
	});
	return libPromise;
}
function humanLabel(key) {
	if (/fetch:.*(onnx|model)/i.test(key)) return "Downloading AI model";
	if (/fetch:.*(wasm|ort)/i.test(key)) return "Loading AI engine";
	if (/fetch/i.test(key)) return "Preparing AI";
	if (/compute/i.test(key)) return "Finding the subject";
	return "Working";
}
/**
* Remove the background of `source` (canvas). Resolves to a NEW canvas with a
* transparent background at the same size as the input.
*/
async function removeBackgroundAI(source, onProgress) {
	onProgress?.({
		label: "Loading AI engine",
		pct: null
	});
	let removeBackground;
	try {
		removeBackground = await loadLib();
	} catch (e) {
		console.error("[bg-removal] lib load failed", e);
		throw new BgRemovalError("AI tools couldn't load. Check your connection and try again.");
	}
	const input = await canvasToBlob(source, "image/png");
	let outBlob;
	try {
		outBlob = await removeBackground(input, {
			model: pickModel(),
			device: "cpu",
			output: {
				format: "image/png",
				quality: 1
			},
			progress: (key, current, total) => {
				const pct = total > 0 ? Math.round(current / total * 100) : null;
				onProgress?.({
					label: humanLabel(key),
					pct
				});
			}
		});
	} catch (e) {
		console.error("[bg-removal] failed", e);
		const msg = e instanceof Error ? e.message : String(e);
		if (/memory|allocation|OOM/i.test(msg)) throw new BgRemovalError("Not enough memory for AI removal on this device. Try a smaller photo.");
		throw new BgRemovalError("AI background removal failed. Check your connection and try again.");
	}
	onProgress?.({
		label: "Cleaning edges",
		pct: null
	});
	const decoded = await decodeImageFile(outBlob, Math.max(source.width, source.height));
	const out = makeCanvas(source.width, source.height);
	const ctx = out.getContext("2d", { willReadFrequently: true });
	ctx.drawImage(decoded, 0, 0, out.width, out.height);
	const img = ctx.getImageData(0, 0, out.width, out.height);
	const d = img.data;
	for (let i = 3; i < d.length; i += 4) if (d[i] < 12) d[i] = 0;
	else if (d[i] > 245) d[i] = 255;
	ctx.putImageData(img, 0, 0);
	return out;
}
var ACCENT = "linear-gradient(135deg,#ff6b9d,#c9184a)";
var CHECKER = "repeating-conic-gradient(rgba(0,0,0,0.13) 0% 25%, transparent 0% 50%) 50% / 18px 18px";
function StickerEditor({ file, dark, onClose, onSave, onSend }) {
	const [original, setOriginal] = (0, import_react.useState)(null);
	const [aiResult, setAiResult] = (0, import_react.useState)(null);
	const [manualResult, setManualResult] = (0, import_react.useState)(null);
	const [mode, setMode] = (0, import_react.useState)("original");
	const [view, setView] = (0, import_react.useState)("preview");
	const [decoding, setDecoding] = (0, import_react.useState)(true);
	const [aiProgress, setAiProgress] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [notice, setNotice] = (0, import_react.useState)(null);
	const [compare, setCompare] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(null);
	const [finalUrl, setFinalUrl] = (0, import_react.useState)(null);
	const [finalMeta, setFinalMeta] = (0, import_react.useState)(null);
	const finalRef = (0, import_react.useRef)(null);
	const aliveRef = (0, import_react.useRef)(true);
	const fg = dark ? "#f2f2f2" : "#5a1530";
	const sub = dark ? "rgba(255,255,255,0.65)" : "rgba(90,21,48,0.65)";
	const sheetBg = dark ? "#121212" : "#fff6f9";
	const chipBg = dark ? "rgba(255,255,255,0.09)" : "rgba(201,24,74,0.08)";
	const border = dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(201,24,74,0.18)";
	(0, import_react.useEffect)(() => {
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
		decodeImageFile(file).then((c) => {
			if (!aliveRef.current) return;
			setOriginal(c);
		}).catch((e) => {
			if (!aliveRef.current) return;
			setError(describeImageError(e));
		}).finally(() => aliveRef.current && setDecoding(false));
		return () => {
			aliveRef.current = false;
		};
	}, [file]);
	const current = (0, import_react.useMemo)(() => {
		if (!original) return null;
		if (mode === "manual" && manualResult) return manualResult;
		if (mode === "ai" && aiResult) return aiResult;
		return original;
	}, [
		original,
		aiResult,
		manualResult,
		mode
	]);
	(0, import_react.useEffect)(() => {
		let revoked = false;
		let url = null;
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
				setFinalMeta({
					w: out.width,
					h: out.height,
					kb: Math.max(1, Math.round(out.blob.size / 1024)),
					mime: out.mime
				});
			} catch (e) {
				if (!revoked) setError(describeImageError(e));
			}
		})();
		return () => {
			revoked = true;
			if (url) URL.revokeObjectURL(url);
		};
	}, [current]);
	const originalUrl = (0, import_react.useMemo)(() => original ? original.toDataURL("image/png") : null, [original]);
	const runAI = (0, import_react.useCallback)(async () => {
		if (!original || aiProgress) return;
		haptics.light();
		setError(null);
		if (aiResult) {
			setMode("ai");
			return;
		}
		setAiProgress({
			label: "Loading AI engine",
			pct: null
		});
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
	}, [
		original,
		aiResult,
		aiProgress
	]);
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
	const finishManual = (result) => {
		setManualResult(result);
		setMode("manual");
		setView("preview");
		setNotice("Manual edit applied ✓");
		haptics.medium();
	};
	const act = async (kind) => {
		const out = finalRef.current;
		if (!out || busy) return;
		haptics.medium();
		setBusy(kind);
		setError(null);
		try {
			const ok = kind === "saving" ? await onSave(out) : await onSend(out);
			if (!aliveRef.current) return;
			if (!ok) setError(kind === "saving" ? "Couldn't save the sticker. Check your connection and try again." : "Couldn't send the sticker. Check your connection and try again.");
		} catch (e) {
			if (aliveRef.current) setError(e instanceof Error ? e.message : "Upload failed. Try again.");
		} finally {
			if (aliveRef.current) setBusy(null);
		}
	};
	if (!file) return null;
	const modeChip = (m, label, onClick, disabled, testid) => {
		const active = mode === m;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			"data-testid": testid,
			onClick,
			disabled,
			style: {
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
				opacity: disabled ? .5 : 1,
				whiteSpace: "nowrap",
				overflow: "hidden",
				textOverflow: "ellipsis"
			},
			children: label
		}, m);
	};
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-testid": "sticker-editor",
		className: "fixed inset-0 z-[95] flex flex-col",
		style: {
			background: sheetBg,
			color: fg,
			paddingTop: "env(safe-area-inset-top, 0px)",
			WebkitUserSelect: "none",
			userSelect: "none"
		},
		children: view === "manual" && current && original ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ManualEraser, {
			dark,
			source: current,
			original,
			onCancel: () => setView("preview"),
			onDone: finishManual
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					padding: "10px 12px 6px",
					gap: 8
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						"data-testid": "sticker-editor-close",
						onClick: () => {
							haptics.light();
							onClose();
						},
						disabled: busy !== null,
						"aria-label": "Close",
						style: {
							width: 40,
							height: 40,
							borderRadius: 999,
							border: "none",
							background: chipBg,
							color: fg,
							fontSize: 18,
							cursor: "pointer"
						},
						children: "✕"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							flex: 1,
							textAlign: "center",
							fontWeight: 800,
							fontSize: 16
						},
						children: "New sticker"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 40 } })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					flex: 1,
					minHeight: 0,
					overflowY: "auto",
					overscrollBehavior: "contain",
					padding: "0 14px"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						"data-testid": "sticker-editor-preview",
						style: {
							position: "relative",
							width: "100%",
							height: "min(46dvh, 420px)",
							borderRadius: 20,
							background: (dark ? "rgba(255,255,255,0.06)," : "rgba(255,255,255,0.9),") + CHECKER,
							border,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							overflow: "hidden"
						},
						children: [
							decoding && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, {
								label: "Opening image…",
								fg
							}),
							!decoding && !original && error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									padding: 20,
									textAlign: "center",
									color: "#c9184a",
									fontSize: 14,
									fontWeight: 600
								},
								children: error
							}),
							original && (compare ? originalUrl : finalUrl) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: compare ? originalUrl : finalUrl,
								alt: "sticker preview",
								draggable: false,
								style: {
									maxWidth: "92%",
									maxHeight: "92%",
									objectFit: "contain",
									display: "block",
									imageRendering: "auto"
								}
							}),
							original && !finalUrl && !compare && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, {
								label: "Preparing…",
								fg
							}),
							aiProgress && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								"data-testid": "sticker-ai-progress",
								style: {
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
									textAlign: "center"
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, {
										label: "",
										fg: "#fff"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										style: {
											fontWeight: 700,
											fontSize: 15
										},
										children: [
											"✨ ",
											aiProgress.label,
											aiProgress.pct !== null ? ` ${aiProgress.pct}%` : "…"
										]
									}),
									aiProgress.pct !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										style: {
											width: "70%",
											height: 6,
											borderRadius: 999,
											background: "rgba(255,255,255,0.25)",
											overflow: "hidden"
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
											width: `${aiProgress.pct}%`,
											height: "100%",
											background: ACCENT,
											transition: "width 200ms"
										} })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										style: {
											fontSize: 12,
											opacity: .8
										},
										children: "First time downloads the AI model once, then it's fast."
									})
								]
							}),
							finalMeta && !compare && !aiProgress && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								"data-testid": "sticker-final-meta",
								style: {
									position: "absolute",
									bottom: 8,
									right: 10,
									fontSize: 11,
									fontWeight: 600,
									padding: "3px 8px",
									borderRadius: 999,
									background: "rgba(0,0,0,0.5)",
									color: "#fff"
								},
								children: [
									finalMeta.w,
									"×",
									finalMeta.h,
									" · ",
									finalMeta.kb,
									" KB · ",
									finalMeta.mime === "image/webp" ? "WebP" : "PNG"
								]
							}),
							compare && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									position: "absolute",
									top: 8,
									left: 10,
									fontSize: 11,
									fontWeight: 700,
									padding: "3px 8px",
									borderRadius: 999,
									background: "rgba(0,0,0,0.55)",
									color: "#fff"
								},
								children: "BEFORE"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: 8,
							marginTop: 12
						},
						children: [
							modeChip("original", "Original", () => {
								haptics.light();
								setMode("original");
								setNotice(null);
							}, !original, "sticker-mode-original"),
							modeChip("ai", aiResult ? "✨ AI cut-out" : "✨ AI Remove BG", runAI, !original || !!aiProgress, "sticker-mode-ai"),
							modeChip("manual", manualResult ? "✂️ Manual (edited)" : "✂️ Manual erase", openManual, !original || !!aiProgress, "sticker-mode-manual")
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: 8,
							marginTop: 10,
							flexWrap: "wrap"
						},
						children: [
							(mode === "ai" || mode === "manual") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								"data-testid": "sticker-compare-btn",
								onPointerDown: () => setCompare(true),
								onPointerUp: () => setCompare(false),
								onPointerLeave: () => setCompare(false),
								onPointerCancel: () => setCompare(false),
								onContextMenu: (e) => e.preventDefault(),
								style: {
									flex: 1,
									padding: "10px 12px",
									borderRadius: 12,
									border,
									background: chipBg,
									color: fg,
									fontWeight: 600,
									fontSize: 13,
									cursor: "pointer",
									touchAction: "manipulation"
								},
								children: "👁 Hold to compare"
							}),
							mode === "ai" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								"data-testid": "sticker-undo-ai",
								onClick: undoAI,
								style: {
									flex: 1,
									padding: "10px 12px",
									borderRadius: 12,
									border,
									background: chipBg,
									color: fg,
									fontWeight: 600,
									fontSize: 13,
									cursor: "pointer"
								},
								children: "↩ Undo AI (back to original)"
							}),
							mode === "manual" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								"data-testid": "sticker-undo-manual",
								onClick: () => {
									haptics.light();
									setManualResult(null);
									setMode(aiResult ? "ai" : "original");
									setNotice(null);
								},
								style: {
									flex: 1,
									padding: "10px 12px",
									borderRadius: 12,
									border,
									background: chipBg,
									color: fg,
									fontWeight: 600,
									fontSize: 13,
									cursor: "pointer"
								},
								children: "↩ Discard manual edit"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						style: {
							margin: "10px 2px 0",
							fontSize: 12,
							color: sub,
							lineHeight: 1.45
						},
						children: [
							mode === "original" && "Sends the picture as-is. Try ✨ AI Remove BG to cut out the subject automatically, or ✂️ Manual erase to do it by hand.",
							mode === "ai" && "The subject was detected automatically. Edges are cleaned and the sticker is cropped with a little padding.",
							mode === "manual" && "Your manual edit is applied on top. Tap ✂️ Manual erase again to keep refining."
						]
					}),
					notice && !error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"data-testid": "sticker-editor-notice",
						style: {
							marginTop: 10,
							padding: "9px 12px",
							borderRadius: 12,
							background: "rgba(46,160,67,0.12)",
							color: dark ? "#7ee2a8" : "#1e7a3c",
							fontSize: 13,
							fontWeight: 600
						},
						children: notice
					}),
					error && original && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"data-testid": "sticker-editor-error",
						style: {
							marginTop: 10,
							padding: "9px 12px",
							borderRadius: 12,
							background: "rgba(201,24,74,0.12)",
							color: "#c9184a",
							fontSize: 13,
							fontWeight: 600
						},
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 12 } })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					gap: 10,
					padding: "10px 14px calc(12px + env(safe-area-inset-bottom, 0px))",
					borderTop: border,
					background: sheetBg
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					"data-testid": "sticker-save-btn",
					onClick: () => act("saving"),
					disabled: !finalUrl || busy !== null || !!aiProgress,
					style: {
						flex: 1,
						padding: "14px 10px",
						borderRadius: 16,
						border,
						background: chipBg,
						color: fg,
						fontWeight: 800,
						fontSize: 15,
						cursor: "pointer",
						opacity: !finalUrl || !!aiProgress ? .5 : 1
					},
					children: busy === "saving" ? "Saving…" : "★ Save Sticker"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					"data-testid": "sticker-send-btn",
					onClick: () => act("sending"),
					disabled: !finalUrl || busy !== null || !!aiProgress,
					style: {
						flex: 1,
						padding: "14px 10px",
						borderRadius: 16,
						border: "none",
						background: ACCENT,
						color: "#fff",
						fontWeight: 800,
						fontSize: 15,
						cursor: "pointer",
						opacity: !finalUrl || !!aiProgress ? .5 : 1
					},
					children: busy === "sending" ? "Sending…" : "Send ➤"
				})]
			})
		] })
	}), document.body);
}
function Spinner({ label, fg }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			gap: 8,
			color: fg
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
				width: 30,
				height: 30,
				borderRadius: 999,
				border: "3px solid rgba(255,107,157,0.25)",
				borderTopColor: "#ff6b9d",
				animation: "hb-spin 0.8s linear infinite"
			} }),
			label && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					fontSize: 13,
					fontWeight: 600,
					opacity: .8
				},
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `@keyframes hb-spin{to{transform:rotate(360deg)}}` })
		]
	});
}
var MAX_HISTORY = 30;
function ManualEraser({ dark, source, original, onCancel, onDone }) {
	const wrapRef = (0, import_react.useRef)(null);
	const viewRef = (0, import_react.useRef)(null);
	const workRef = (0, import_react.useRef)(cloneCanvas(source));
	const undoRef = (0, import_react.useRef)([]);
	const redoRef = (0, import_react.useRef)([]);
	const [tool, setTool] = (0, import_react.useState)("erase");
	const [brush, setBrush] = (0, import_react.useState)(36);
	const [hist, setHist] = (0, import_react.useState)({
		undo: 0,
		redo: 0
	});
	const [zoomPct, setZoomPct] = (0, import_react.useState)(100);
	const [hint, setHint] = (0, import_react.useState)(true);
	const tRef = (0, import_react.useRef)({
		scale: 1,
		tx: 0,
		ty: 0,
		fit: 1
	});
	const pointersRef = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	const strokeRef = (0, import_react.useRef)({
		last: null,
		active: false,
		pushed: false
	});
	const pinchRef = (0, import_react.useRef)(null);
	const cursorRef = (0, import_react.useRef)(null);
	const rafRef = (0, import_react.useRef)(null);
	const fg = dark ? "#f2f2f2" : "#5a1530";
	const chipBg = dark ? "rgba(255,255,255,0.09)" : "rgba(201,24,74,0.08)";
	const border = dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(201,24,74,0.18)";
	const render = (0, import_react.useCallback)(() => {
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
		const ctx = view.getContext("2d");
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, view.width, view.height);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		const { scale, tx, ty } = tRef.current;
		ctx.imageSmoothingEnabled = scale < 2;
		ctx.drawImage(workRef.current, tx, ty, workRef.current.width * scale, workRef.current.height * scale);
		const c = cursorRef.current;
		if (c && tool !== "move") {
			ctx.beginPath();
			ctx.arc(c.x, c.y, brush / 2, 0, Math.PI * 2);
			ctx.strokeStyle = tool === "erase" ? "rgba(255,60,90,0.95)" : "rgba(60,200,120,0.95)";
			ctx.lineWidth = 1.5;
			ctx.stroke();
			ctx.strokeStyle = "rgba(255,255,255,0.7)";
			ctx.lineWidth = .75;
			ctx.stroke();
		}
	}, [brush, tool]);
	const schedule = (0, import_react.useCallback)(() => {
		if (rafRef.current === null) rafRef.current = requestAnimationFrame(render);
	}, [render]);
	const fit = (0, import_react.useCallback)(() => {
		const wrap = wrapRef.current;
		if (!wrap) return;
		const W = wrap.clientWidth, H = wrap.clientHeight;
		const iw = workRef.current.width, ih = workRef.current.height;
		const s = Math.min((W - 24) / iw, (H - 24) / ih);
		tRef.current = {
			scale: s,
			tx: (W - iw * s) / 2,
			ty: (H - ih * s) / 2,
			fit: s
		};
		setZoomPct(100);
		schedule();
	}, [schedule]);
	(0, import_react.useEffect)(() => {
		fit();
		const ro = new ResizeObserver(() => {
			fit();
		});
		if (wrapRef.current) ro.observe(wrapRef.current);
		return () => ro.disconnect();
	}, [fit]);
	(0, import_react.useEffect)(() => {
		schedule();
	}, [
		schedule,
		tool,
		brush
	]);
	const clampTransform = () => {
		const wrap = wrapRef.current;
		if (!wrap) return;
		const t = tRef.current;
		const W = wrap.clientWidth, H = wrap.clientHeight;
		const iw = workRef.current.width * t.scale, ih = workRef.current.height * t.scale;
		t.tx = Math.min(Math.max(t.tx, 40 - iw), W - 40);
		t.ty = Math.min(Math.max(t.ty, 40 - ih), H - 40);
	};
	const zoomAt = (factor, sx, sy) => {
		const t = tRef.current;
		const next = Math.min(Math.max(t.scale * factor, t.fit * .5), t.fit * 12);
		const k = next / t.scale;
		t.tx = sx - (sx - t.tx) * k;
		t.ty = sy - (sy - t.ty) * k;
		t.scale = next;
		clampTransform();
		setZoomPct(Math.round(t.scale / t.fit * 100));
		schedule();
	};
	const toImage = (sx, sy) => {
		const t = tRef.current;
		return {
			x: (sx - t.tx) / t.scale,
			y: (sy - t.ty) / t.scale
		};
	};
	const localPoint = (e) => {
		const r = wrapRef.current.getBoundingClientRect();
		return {
			x: e.clientX - r.left,
			y: e.clientY - r.top
		};
	};
	const pushHistory = () => {
		undoRef.current.push(snapshot(workRef.current));
		if (undoRef.current.length > MAX_HISTORY) undoRef.current.shift();
		redoRef.current = [];
		setHist({
			undo: undoRef.current.length,
			redo: 0
		});
	};
	const dab = (x, y) => {
		const ctx = workRef.current.getContext("2d");
		const r = Math.max(1, brush / 2 / tRef.current.scale);
		ctx.save();
		if (tool === "erase") {
			ctx.globalCompositeOperation = "destination-out";
			const g = ctx.createRadialGradient(x, y, r * .6, x, y, r);
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
			ctx.clearRect(x - r, y - r, r * 2, r * 2);
			ctx.drawImage(original, 0, 0, workRef.current.width, workRef.current.height);
		}
		ctx.restore();
	};
	const strokeTo = (p) => {
		const s = strokeRef.current;
		const q = toImage(p.x, p.y);
		if (!s.last) dab(q.x, q.y);
		else {
			const dx = q.x - s.last.x, dy = q.y - s.last.y;
			const dist = Math.hypot(dx, dy);
			const step = Math.max(1, brush / 2 / tRef.current.scale * .35);
			const n = Math.ceil(dist / step);
			for (let i = 1; i <= n; i++) dab(s.last.x + dx * i / n, s.last.y + dy * i / n);
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
	const onPointerDown = (e) => {
		if (e.pointerType === "mouse" && e.button !== 0) return;
		e.preventDefault();
		setHint(false);
		e.currentTarget.setPointerCapture?.(e.pointerId);
		const p = localPoint(e);
		pointersRef.current.set(e.pointerId, p);
		cursorRef.current = p;
		if (pointersRef.current.size === 2) {
			endStroke();
			const [a, b] = Array.from(pointersRef.current.values());
			pinchRef.current = {
				d: Math.hypot(a.x - b.x, a.y - b.y),
				mx: (a.x + b.x) / 2,
				my: (a.y + b.y) / 2,
				scale: tRef.current.scale,
				tx: tRef.current.tx,
				ty: tRef.current.ty
			};
			schedule();
			return;
		}
		if (pointersRef.current.size > 2) return;
		if (tool === "move") {
			pinchRef.current = {
				d: 0,
				mx: p.x,
				my: p.y,
				scale: tRef.current.scale,
				tx: tRef.current.tx,
				ty: tRef.current.ty
			};
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
	const onPointerMove = (e) => {
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
				const next = Math.min(Math.max(pin.scale * k, t.fit * .5), t.fit * 12);
				const kk = next / pin.scale;
				t.scale = next;
				t.tx = mx - (pin.mx - pin.tx) * kk;
				t.ty = my - (pin.my - pin.ty) * kk;
				clampTransform();
				setZoomPct(Math.round(t.scale / t.fit * 100));
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
		schedule();
	};
	const onPointerUpOrCancel = (e) => {
		pointersRef.current.delete(e.pointerId);
		if (pointersRef.current.size < 2 && pinchRef.current && tool !== "move") pinchRef.current = null;
		if (pointersRef.current.size === 0) {
			pinchRef.current = null;
			endStroke();
		}
		if (e.pointerType !== "mouse") cursorRef.current = null;
		schedule();
	};
	const onWheel = (e) => {
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
		setHist({
			undo: undoRef.current.length,
			redo: redoRef.current.length
		});
		schedule();
	};
	const redo = () => {
		const next = redoRef.current.pop();
		if (!next) return;
		haptics.light();
		undoRef.current.push(snapshot(workRef.current));
		restore(workRef.current, next);
		setHist({
			undo: undoRef.current.length,
			redo: redoRef.current.length
		});
		schedule();
	};
	const reset = () => {
		haptics.medium();
		pushHistory();
		const ctx = workRef.current.getContext("2d");
		ctx.clearRect(0, 0, workRef.current.width, workRef.current.height);
		ctx.drawImage(source, 0, 0);
		schedule();
	};
	const finish = () => {
		haptics.medium();
		onDone(cloneCanvas(workRef.current));
	};
	const toolBtn = (t, label, testid) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		"data-testid": testid,
		onClick: () => {
			haptics.light();
			setTool(t);
		},
		style: {
			flex: 1,
			padding: "11px 6px",
			borderRadius: 12,
			border: tool === t ? "1px solid transparent" : border,
			background: tool === t ? ACCENT : chipBg,
			color: tool === t ? "#fff" : fg,
			fontWeight: 700,
			fontSize: 13,
			cursor: "pointer",
			whiteSpace: "nowrap"
		},
		children: label
	});
	const iconBtn = (label, onClick, disabled, testid, aria) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		"data-testid": testid,
		"aria-label": aria,
		onClick,
		disabled,
		style: {
			width: 44,
			height: 40,
			borderRadius: 12,
			border,
			background: chipBg,
			color: fg,
			fontSize: 16,
			fontWeight: 700,
			cursor: disabled ? "default" : "pointer",
			opacity: disabled ? .35 : 1,
			flexShrink: 0
		},
		children: label
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				display: "flex",
				alignItems: "center",
				padding: "10px 12px 6px",
				gap: 8
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					"data-testid": "manual-cancel",
					onClick: () => {
						haptics.light();
						onCancel();
					},
					style: {
						padding: "9px 14px",
						borderRadius: 999,
						border: "none",
						background: chipBg,
						color: fg,
						fontSize: 14,
						fontWeight: 700,
						cursor: "pointer"
					},
					children: "Cancel"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						flex: 1,
						textAlign: "center",
						fontWeight: 800,
						fontSize: 15
					},
					children: "Manual erase"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					"data-testid": "manual-done",
					onClick: finish,
					style: {
						padding: "9px 16px",
						borderRadius: 999,
						border: "none",
						background: ACCENT,
						color: "#fff",
						fontSize: 14,
						fontWeight: 800,
						cursor: "pointer"
					},
					children: "Done ✓"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: wrapRef,
			"data-testid": "manual-canvas-wrap",
			style: {
				flex: 1,
				minHeight: 0,
				margin: "0 10px",
				borderRadius: 18,
				border,
				background: (dark ? "rgba(255,255,255,0.06)," : "rgba(255,255,255,0.9),") + CHECKER,
				overflow: "hidden",
				position: "relative",
				touchAction: "none"
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
					ref: viewRef,
					"data-testid": "manual-canvas",
					onPointerDown,
					onPointerMove,
					onPointerUp: onPointerUpOrCancel,
					onPointerCancel: onPointerUpOrCancel,
					onPointerLeave: (e) => {
						if (e.pointerType === "mouse") {
							cursorRef.current = null;
							schedule();
						}
					},
					onWheel,
					onContextMenu: (e) => e.preventDefault(),
					style: {
						width: "100%",
						height: "100%",
						display: "block",
						touchAction: "none",
						cursor: tool === "move" ? "grab" : "none"
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						position: "absolute",
						top: 8,
						left: 10,
						fontSize: 11,
						fontWeight: 700,
						padding: "3px 8px",
						borderRadius: 999,
						background: "rgba(0,0,0,0.5)",
						color: "#fff",
						pointerEvents: "none"
					},
					children: [zoomPct, "%"]
				}),
				hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"data-testid": "manual-hint",
					style: {
						position: "absolute",
						left: 0,
						right: 0,
						bottom: 10,
						display: "flex",
						justifyContent: "center",
						pointerEvents: "none"
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 12,
							fontWeight: 600,
							padding: "6px 12px",
							borderRadius: 999,
							background: "rgba(0,0,0,0.55)",
							color: "#fff",
							textAlign: "center"
						},
						children: "Drag to erase · pinch to zoom · two fingers to pan"
					})
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				padding: "10px 12px calc(10px + env(safe-area-inset-bottom, 0px))",
				display: "flex",
				flexDirection: "column",
				gap: 10
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						gap: 8
					},
					children: [
						toolBtn("erase", "🧽 Erase", "manual-tool-erase"),
						toolBtn("restore", "🩹 Restore", "manual-tool-restore"),
						toolBtn("move", "✋ Move", "manual-tool-move")
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 10
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								fontSize: 12,
								fontWeight: 700,
								color: fg,
								width: 46
							},
							children: "Brush"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							"data-testid": "manual-brush",
							type: "range",
							min: 8,
							max: 140,
							value: brush,
							onChange: (e) => setBrush(Number(e.target.value)),
							style: {
								flex: 1,
								accentColor: "#ff6b9d",
								height: 28
							},
							"aria-label": "Brush size"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								width: 34,
								textAlign: "right",
								fontSize: 12,
								fontWeight: 700,
								color: fg,
								fontVariantNumeric: "tabular-nums"
							},
							children: brush
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						gap: 8,
						alignItems: "center"
					},
					children: [
						iconBtn("↶", undo, hist.undo === 0, "manual-undo", "Undo"),
						iconBtn("↷", redo, hist.redo === 0, "manual-redo", "Redo"),
						iconBtn("－", () => {
							const w = wrapRef.current;
							zoomAt(1 / 1.25, w.clientWidth / 2, w.clientHeight / 2);
						}, false, "manual-zoom-out", "Zoom out"),
						iconBtn("＋", () => {
							const w = wrapRef.current;
							zoomAt(1.25, w.clientWidth / 2, w.clientHeight / 2);
						}, false, "manual-zoom-in", "Zoom in"),
						iconBtn("⤢", fit, false, "manual-fit", "Fit to screen"),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1 } }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							"data-testid": "manual-reset",
							onClick: reset,
							style: {
								padding: "10px 14px",
								borderRadius: 12,
								border,
								background: chipBg,
								color: "#c9184a",
								fontWeight: 700,
								fontSize: 13,
								cursor: "pointer"
							},
							children: "Reset"
						})
					]
				})
			]
		})
	] });
}
//#endregion
export { StickerEditor as default };
