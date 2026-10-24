import { i as __toESM } from "../_runtime.mjs";
import { d as require_react_dom, q as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as useMotionValue, n as animate, r as useTransform } from "../_libs/framer-motion+[...].mjs";
import { t as motion } from "../_libs/motion.mjs";
import { C as haptics, a as IconDownload, b as fmtSeparator, f as downloadMedia, i as IconClose } from "./routes-dAk2nEzm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/media-viewer-BZeQIpsx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
function MediaViewer({ items, index, rect, ts, onClose }) {
	const trackRef = (0, import_react.useRef)(null);
	const [cur, setCur] = (0, import_react.useState)(index);
	const y = useMotionValue(0);
	const bgOpacity = useTransform(y, [
		-300,
		0,
		300
	], [
		.2,
		1,
		.2
	]);
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const from = rect ? {
		scale: Math.max(.15, rect.width / vw),
		x: rect.left + rect.width / 2 - vw / 2,
		y: rect.top + rect.height / 2 - vh / 2,
		opacity: .6
	} : {
		scale: .92,
		x: 0,
		y: 0,
		opacity: 0
	};
	(0, import_react.useLayoutEffect)(() => {
		const t = trackRef.current;
		if (t) t.scrollLeft = index * t.clientWidth;
	}, [index]);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);
	(0, import_react.useEffect)(() => {
		const t = trackRef.current;
		if (!t) return;
		t.querySelectorAll("video").forEach((v, i) => {
			if (i === cur) v.play().catch(() => {});
			else v.pause();
		});
	}, [cur]);
	const item = items[cur];
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		className: "ig-viewer",
		"data-testid": "media-viewer",
		initial: { opacity: 1 },
		exit: {
			opacity: 0,
			transition: { duration: .2 }
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
				className: "ig-viewer-bg",
				style: { opacity: bgOpacity },
				initial: { opacity: 0 },
				animate: { opacity: 1 }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ig-viewer-top",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ig-hbtn",
						onClick: onClose,
						"aria-label": "Close",
						"data-testid": "viewer-close",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconClose, { size: 22 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "ig-viewer-meta",
						children: [items.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: [
							cur + 1,
							" / ",
							items.length
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: fmtSeparator(ts) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ig-hbtn",
						onClick: () => {
							haptics.light();
							downloadMedia(item.url, item.kind === "video" ? "video" : item.kind, { ts });
						},
						"aria-label": "Save",
						"data-testid": "viewer-download",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconDownload, { size: 22 })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
				className: "ig-viewer-stage",
				style: { y },
				drag: "y",
				dragDirectionLock: true,
				dragElastic: .9,
				dragConstraints: {
					top: 0,
					bottom: 0
				},
				onDragEnd: (_, info) => {
					if (Math.abs(info.offset.y) > 110 || Math.abs(info.velocity.y) > 700) onClose();
					else animate(y, 0, {
						type: "spring",
						stiffness: 500,
						damping: 40
					});
				},
				initial: from,
				animate: {
					scale: 1,
					x: 0,
					y: 0,
					opacity: 1
				},
				exit: rect ? {
					...from,
					opacity: 0,
					transition: {
						type: "spring",
						stiffness: 420,
						damping: 40
					}
				} : {
					opacity: 0,
					scale: .94
				},
				transition: {
					type: "spring",
					stiffness: 340,
					damping: 32
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "ig-viewer-track",
					ref: trackRef,
					onScroll: (e) => {
						const t = e.currentTarget;
						const i = Math.round(t.scrollLeft / Math.max(1, t.clientWidth));
						if (i !== cur) setCur(i);
					},
					children: items.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "ig-viewer-slide",
						children: it.kind === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
							src: it.url,
							controls: true,
							playsInline: true,
							loop: false,
							preload: "metadata"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: it.url,
							alt: "",
							decoding: "async",
							draggable: false
						})
					}, `${it.url}-${i}`))
				}), items.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "ig-viewer-dots",
					children: items.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { "data-on": i === cur ? "" : void 0 }, i))
				})]
			})
		]
	}), document.body);
}
//#endregion
export { MediaViewer as default };
