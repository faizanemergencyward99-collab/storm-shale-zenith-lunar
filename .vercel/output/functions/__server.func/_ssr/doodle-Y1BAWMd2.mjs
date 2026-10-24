import { i as __toESM } from "../_runtime.mjs";
import { q as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as motion } from "../_libs/motion.mjs";
import { C as haptics, d as IconUndo, i as IconClose, l as IconSend, u as IconTrash } from "./routes-dAk2nEzm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/doodle-Y1BAWMd2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var COLORS = [
	"#ffffff",
	"#000000",
	"#ff2d55",
	"#ff6fae",
	"#ffd60a",
	"#34c759",
	"#3797f0",
	"#7c5cff",
	"#ff7a1a"
];
var SIZES = [
	4,
	9,
	16,
	26
];
var BRUSHES = [
	{
		id: "neon",
		label: "Neon"
	},
	{
		id: "marker",
		label: "Marker"
	},
	{
		id: "highlighter",
		label: "Highlighter"
	}
];
function Doodle({ photo, onClose, onSend }) {
	const wrapRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const bgRef = (0, import_react.useRef)(null);
	const strokesRef = (0, import_react.useRef)([]);
	const drawingRef = (0, import_react.useRef)(null);
	const [color, setColor] = (0, import_react.useState)(photo ? "#ffffff" : "#ff2d55");
	const [size, setSize] = (0, import_react.useState)(9);
	const [brush, setBrush] = (0, import_react.useState)("neon");
	const [count, setCount] = (0, import_react.useState)(0);
	const [ready, setReady] = (0, import_react.useState)(false);
	const paint = (0, import_react.useCallback)(() => {
		const cv = canvasRef.current;
		const ctx = cv?.getContext("2d");
		if (!cv || !ctx || !cv.clientWidth) return;
		const dpr = cv.width / cv.clientWidth;
		ctx.save();
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, cv.clientWidth, cv.clientHeight);
		if (bgRef.current) ctx.drawImage(bgRef.current, 0, 0, cv.clientWidth, cv.clientHeight);
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		(drawingRef.current ? [...strokesRef.current, drawingRef.current] : strokesRef.current).forEach((s) => {
			if (!s.pts.length) return;
			ctx.save();
			if (s.brush === "neon") {
				ctx.shadowColor = s.color;
				ctx.shadowBlur = s.size * 1.6;
				ctx.globalAlpha = 1;
				ctx.lineWidth = Math.max(2, s.size * .55);
			} else if (s.brush === "highlighter") {
				ctx.shadowBlur = 0;
				ctx.globalAlpha = .45;
				ctx.lineWidth = s.size * 1.8;
			} else {
				ctx.shadowBlur = 0;
				ctx.globalAlpha = 1;
				ctx.lineWidth = s.size;
			}
			ctx.strokeStyle = s.color;
			ctx.beginPath();
			ctx.moveTo(s.pts[0].x, s.pts[0].y);
			if (s.pts.length === 1) ctx.lineTo(s.pts[0].x + .1, s.pts[0].y);
			for (let i = 1; i < s.pts.length - 1; i++) {
				const mid = {
					x: (s.pts[i].x + s.pts[i + 1].x) / 2,
					y: (s.pts[i].y + s.pts[i + 1].y) / 2
				};
				ctx.quadraticCurveTo(s.pts[i].x, s.pts[i].y, mid.x, mid.y);
			}
			const last = s.pts[s.pts.length - 1];
			ctx.lineTo(last.x, last.y);
			ctx.stroke();
			ctx.restore();
		});
		ctx.restore();
	}, []);
	(0, import_react.useEffect)(() => {
		let dead = false;
		const sizeCanvas = (ratio) => {
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
		if (!photo) {
			sizeCanvas(null);
			return () => {
				dead = true;
			};
		}
		const url = URL.createObjectURL(photo);
		const img = new Image();
		img.onload = () => {
			bgRef.current = img;
			sizeCanvas(img.width / img.height);
		};
		img.onerror = () => sizeCanvas(null);
		img.src = url;
		return () => {
			dead = true;
			URL.revokeObjectURL(url);
		};
	}, [photo, paint]);
	const at = (e) => {
		const r = canvasRef.current.getBoundingClientRect();
		return {
			x: e.clientX - r.left,
			y: e.clientY - r.top
		};
	};
	const down = (e) => {
		e.preventDefault();
		try {
			canvasRef.current?.setPointerCapture(e.pointerId);
		} catch {}
		drawingRef.current = {
			color,
			size,
			brush,
			pts: [at(e)]
		};
		paint();
	};
	const move = (e) => {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		className: "ig-doodle",
		"data-blank": photo ? void 0 : "",
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		"data-testid": "doodle",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ig-doodle-head",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ig-icon-btn",
						onClick: onClose,
						"aria-label": "Close drawing",
						"data-testid": "doodle-close",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconClose, { size: 24 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ig-sheet-title",
						children: photo ? "Draw on photo" : "Draw"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ig-doodle-head-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ig-icon-btn",
							disabled: !count,
							onClick: undo,
							"aria-label": "Undo",
							"data-testid": "doodle-undo",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconUndo, { size: 22 })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ig-icon-btn",
							disabled: !count,
							onClick: clear,
							"aria-label": "Clear",
							"data-testid": "doodle-clear",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconTrash, { size: 22 })
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "ig-doodle-stage",
				ref: wrapRef,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
					ref: canvasRef,
					className: "ig-doodle-canvas",
					"data-blank": photo ? void 0 : "",
					"data-ready": ready ? "" : void 0,
					onPointerDown: down,
					onPointerMove: move,
					onPointerUp: up,
					onPointerCancel: up,
					"data-testid": "doodle-canvas"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ig-doodle-tools",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "ig-doodle-brushes",
						children: BRUSHES.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "ig-doodle-brush",
							"data-brush": b.id,
							"data-on": brush === b.id ? "" : void 0,
							onClick: () => {
								haptics.selection();
								setBrush(b.id);
							},
							"aria-label": b.label,
							"data-testid": `doodle-brush-${b.id}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ig-doodle-brush-dot",
								style: { background: color }
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ig-doodle-brush-label",
								children: b.label
							})]
						}, b.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "ig-doodle-sizes",
						children: SIZES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ig-doodle-size",
							"data-on": size === s ? "" : void 0,
							onClick: () => {
								haptics.selection();
								setSize(s);
							},
							"aria-label": `Brush size ${s}`,
							"data-testid": `doodle-size-${s}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: {
								width: s,
								height: s,
								background: color
							} })
						}, s))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "ig-doodle-colors",
						children: COLORS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ig-doodle-color",
							"data-on": color === c ? "" : void 0,
							style: { background: c },
							onClick: () => {
								haptics.selection();
								setColor(c);
							},
							"aria-label": c,
							"data-testid": `doodle-color-${c.replace("#", "")}`
						}, c))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.button, {
						type: "button",
						className: "ig-btn-primary ig-doodle-send",
						whileTap: { scale: .95 },
						disabled: !photo && !count,
						onClick: send,
						"data-testid": "doodle-send",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconSend, { size: 18 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Send" })]
					})
				]
			})
		]
	});
}
//#endregion
export { Doodle as default };
