import { i as __toESM } from "../_runtime.mjs";
import { q as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as motion } from "../_libs/motion.mjs";
import { C as haptics, i as IconClose, o as IconPlay, r as IconBrush, s as IconPlus } from "./routes-dAk2nEzm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/gallery-sheet-BPOCTobS.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function GallerySheet({ files, onAddMore, onClose, onSend, onDraw }) {
	const urls = (0, import_react.useMemo)(() => files.map((f) => URL.createObjectURL(f)), [files]);
	(0, import_react.useEffect)(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
	const [order, setOrder] = (0, import_react.useState)(() => files.map((_, i) => i));
	(0, import_react.useEffect)(() => {
		setOrder(files.map((_, i) => i));
	}, [files]);
	const toggle = (i) => {
		haptics.selection();
		setOrder((o) => o.includes(i) ? o.filter((x) => x !== i) : [...o, i]);
	};
	const count = order.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		className: "ig-modal ig-modal-bottom",
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		onClick: onClose,
		"data-testid": "gallery-sheet",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
			className: "ig-sheet ig-gallery",
			initial: { y: "100%" },
			animate: { y: 0 },
			exit: { y: "100%" },
			transition: {
				type: "spring",
				stiffness: 380,
				damping: 38
			},
			drag: "y",
			dragConstraints: {
				top: 0,
				bottom: 0
			},
			dragElastic: {
				top: 0,
				bottom: .6
			},
			onDragEnd: (_, info) => {
				if (info.offset.y > 120 || info.velocity.y > 700) onClose();
			},
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ig-sheet-grab" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ig-gallery-head",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ig-icon-btn",
							onClick: onClose,
							"aria-label": "Close",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconClose, { size: 22 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ig-sheet-title",
							children: "Recents"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: 40 } })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ig-gallery-grid",
					onPointerDown: (e) => e.stopPropagation(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "ig-gallery-add",
						onClick: onAddMore,
						"data-testid": "gallery-add-more",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPlus, { size: 28 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Add" })]
					}), files.map((f, i) => {
						const n = order.indexOf(i);
						const video = f.type.startsWith("video/");
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.button, {
							type: "button",
							className: "ig-gallery-cell",
							"data-on": n >= 0 ? "" : void 0,
							onClick: () => toggle(i),
							whileTap: { scale: .94 },
							"data-testid": `gallery-cell-${i}`,
							children: [
								video ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
									src: urls[i],
									muted: true,
									playsInline: true,
									preload: "metadata"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: urls[i],
									alt: "",
									decoding: "async"
								}),
								video && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ig-gallery-vid",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPlay, { size: 14 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ig-gallery-num",
									children: n >= 0 ? n + 1 : ""
								})
							]
						}, urls[i]);
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ig-gallery-foot",
					children: [count === 1 && files[order[0]].type.startsWith("image/") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.button, {
						type: "button",
						className: "ig-btn-ghost ig-gallery-draw",
						whileTap: { scale: .96 },
						onClick: () => onDraw(files[order[0]]),
						"data-testid": "gallery-draw",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBrush, { size: 18 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Draw" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
						type: "button",
						className: "ig-btn-primary ig-gallery-send",
						disabled: count === 0,
						whileTap: { scale: .96 },
						onClick: () => onSend(order.map((i) => files[i])),
						"data-testid": "gallery-send",
						children: count > 1 ? `Send ${count} as a group` : count === 1 ? "Send" : "Select photos"
					})]
				})
			]
		})
	});
}
//#endregion
export { GallerySheet as default };
