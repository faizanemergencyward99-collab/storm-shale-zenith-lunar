import { i as __toESM } from "../_runtime.mjs";
import { q as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as AnimatePresence } from "../_libs/framer-motion+[...].mjs";
import { t as motion } from "../_libs/motion.mjs";
import { C as haptics, _ as THEMES, g as BUILTIN_WALLPAPERS, i as IconClose, n as wallpaper_default, v as THEME_GROUPS, y as textOn } from "./routes-dAk2nEzm.mjs";
import { a as listFavorites, i as listCustomStickers } from "./stickers-CbL32zqh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/theme-picker-DSGMMoyr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SWATCHES = [
	"#a3132f",
	"#262626",
	"#3797f0",
	"#ff5c8d",
	"#bfe0ea",
	"#7bd389",
	"#ffb4a2",
	"#f4f1ea",
	"#e63946",
	"#ffd166",
	"#6c5ce7",
	"#ffffff"
];
function Card({ t, on, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.button, {
		type: "button",
		className: "ig-theme-card",
		"data-on": on ? "" : void 0,
		whileTap: { scale: .95 },
		onClick,
		"data-testid": `theme-${t.id}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "ig-theme-thumb",
			style: { background: t.bg },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(wallpaper_default, {
					src: t.wallpaper,
					mini: true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ig-theme-b ig-theme-b-in",
					style: {
						background: t.inPaint ?? t.inBg,
						color: t.inFg ?? textOn(t.inBg)
					},
					children: "Hey"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ig-theme-b ig-theme-b-out",
					style: {
						background: t.outPaint ?? t.outBg,
						color: t.outFg ?? textOn(t.outBg)
					},
					children: "Hi 💗"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "ig-theme-name",
			children: t.name
		})]
	});
}
function ColorRow({ label, value, onChange, testid }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ig-color-row",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "ig-swatches",
			children: [SWATCHES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "ig-swatch",
				"data-on": c.toLowerCase() === value.toLowerCase() ? "" : void 0,
				style: { background: c },
				onClick: () => onChange(c),
				"aria-label": c
			}, c)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "ig-swatch ig-swatch-custom",
				style: { background: value },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "color",
					value,
					onChange: (e) => onChange(e.target.value),
					"data-testid": testid
				})
			})]
		})]
	});
}
function ThemePicker({ applied, lowFx, onPreview, onApply, onClose, onToggleLowFx }) {
	const [mode, setMode] = (0, import_react.useState)("grid");
	const [draft, setDraft] = (0, import_react.useState)(applied);
	const [stickers, setStickers] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		Promise.all([listFavorites(), listCustomStickers()]).then(([f, c]) => {
			const urls = [...f.filter((x) => x.kind === "sticker"), ...c].map((x) => x.url);
			setStickers(Array.from(new Set(urls)).slice(0, 40));
		});
	}, []);
	const preview = (t) => {
		haptics.light();
		setDraft(t);
		onPreview(t);
	};
	const customBase = () => ({
		id: "custom",
		name: "Custom",
		bg: "#000000",
		wallpaper: draft.wallpaper,
		inBg: draft.inBg,
		outBg: draft.outBg,
		accent: draft.outBg
	});
	const editCustom = (patch) => {
		const t = {
			...customBase(),
			...patch
		};
		t.accent = t.outBg;
		setDraft(t);
		onPreview(t);
	};
	const cancel = () => {
		onPreview(null);
		setDraft(applied);
		setMode("grid");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
		initial: false,
		children: mode === "preview" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
			className: "ig-theme-bar",
			initial: {
				y: 80,
				opacity: 0
			},
			animate: {
				y: 0,
				opacity: 1
			},
			exit: {
				y: 80,
				opacity: 0
			},
			transition: {
				type: "spring",
				stiffness: 460,
				damping: 36
			},
			"data-testid": "theme-preview-bar",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Previewing ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: draft.name })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "ig-btn-ghost",
					onClick: cancel,
					"data-testid": "theme-cancel",
					children: "Cancel"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "ig-btn-primary",
					onClick: () => onApply(draft),
					"data-testid": "theme-apply",
					children: "Apply"
				})
			]
		}, "bar") : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
			className: "ig-modal ig-modal-bottom",
			initial: { opacity: 0 },
			animate: { opacity: 1 },
			exit: { opacity: 0 },
			onClick: () => {
				onPreview(null);
				onClose();
			},
			"data-testid": "theme-picker",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
				className: "ig-sheet ig-theme-sheet",
				initial: { y: "100%" },
				animate: { y: 0 },
				exit: { y: "100%" },
				transition: {
					type: "spring",
					stiffness: 400,
					damping: 40
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
								onClick: () => {
									onPreview(null);
									onClose();
								},
								"aria-label": "Close",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconClose, { size: 22 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ig-sheet-title",
								children: mode === "custom" ? "Custom theme" : "Themes"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: 40 } })
						]
					}),
					mode === "grid" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ig-theme-note",
							children: "Both of you see the theme you apply."
						}),
						THEME_GROUPS.map((g) => {
							const list = THEMES.filter((t) => (t.group ?? "Ours") === g);
							if (!list.length) return null;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ig-theme-group",
								children: g
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "ig-theme-grid",
								children: list.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
									t,
									on: applied.id === t.id,
									onClick: () => {
										preview(t);
										setMode("preview");
									}
								}, t.id))
							})] }, g);
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ig-theme-group",
							children: "Your own"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "ig-theme-grid",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								t: applied.id === "custom" ? applied : {
									...THEMES[0],
									id: "custom",
									name: "Custom"
								},
								on: applied.id === "custom",
								onClick: () => {
									const t = applied.id === "custom" ? applied : {
										...THEMES[0],
										id: "custom",
										name: "Custom"
									};
									preview(t);
									setMode("custom");
								}
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "ig-sheet-row ig-lowfx",
							onClick: onToggleLowFx,
							"data-testid": "theme-lowfx",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ig-sheet-row-name",
								children: ["Reduce effects", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Lighter blur and motion for slower phones" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ig-toggle",
								"data-on": lowFx ? "" : void 0
							})]
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ig-custom",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ig-custom-label",
								children: "Wallpaper sticker"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "ig-wall-grid",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "ig-wall-opt",
									"data-on": !draft.wallpaper ? "" : void 0,
									onClick: () => editCustom({ wallpaper: null }),
									children: "None"
								}), [...BUILTIN_WALLPAPERS, ...stickers].map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "ig-wall-opt",
									"data-on": draft.wallpaper === w ? "" : void 0,
									onClick: () => editCustom({ wallpaper: w }),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: w,
										alt: "",
										loading: "lazy"
									})
								}, w))]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorRow, {
								label: "Their bubbles",
								value: draft.inBg,
								onChange: (v) => editCustom({ inBg: v }),
								testid: "custom-in-color"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorRow, {
								label: "Your bubbles",
								value: draft.outBg,
								onChange: (v) => editCustom({ outBg: v }),
								testid: "custom-out-color"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "ig-dialog-actions",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "ig-btn-ghost",
									onClick: cancel,
									children: "Back"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "ig-btn-primary",
									onClick: () => setMode("preview"),
									"data-testid": "custom-preview",
									children: "Preview"
								})]
							})
						]
					})
				]
			})
		}, "sheet")
	});
}
//#endregion
export { ThemePicker as default };
