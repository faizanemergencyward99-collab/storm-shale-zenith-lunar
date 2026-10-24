import { i as __toESM } from "../_runtime.mjs";
import { d as require_react_dom, q as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as AnimatePresence } from "../_libs/framer-motion+[...].mjs";
import { t as motion } from "../_libs/motion.mjs";
import { C as haptics, D as getNames, E as formatBytes, O as useNames, S as listMedia, T as fileGlyph, f as downloadMedia, x as countMedia } from "./routes-dAk2nEzm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-media-page-CxbsASc_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
var TABS = [
	{
		id: "all",
		label: "All"
	},
	{
		id: "image",
		label: "Photos"
	},
	{
		id: "video",
		label: "Videos"
	},
	{
		id: "gif",
		label: "GIFs"
	},
	{
		id: "sticker",
		label: "Stickers"
	},
	{
		id: "file",
		label: "Files"
	},
	{
		id: "voice",
		label: "Voice"
	}
];
function toEntry(m) {
	if (!m.mediaUrl) return null;
	const t = m.type;
	if (t !== "image" && t !== "video" && t !== "gif" && t !== "sticker" && t !== "file" && t !== "voice") return null;
	return {
		id: m.id,
		url: m.mediaUrl,
		type: t,
		ts: m.timestamp,
		sender: m.sender,
		fileName: m.fileName ?? null,
		fileSize: m.fileSize ?? null,
		mime: m.mimeType ?? null,
		durationMs: m.durationMs ?? null,
		width: m.mediaWidth ?? null,
		height: m.mediaHeight ?? null
	};
}
/**
* One message → one or MANY gallery entries: a multi-photo album expands to
* every photo it contains (each gets a stable `${id}#${i}` key and shares
* the message's timestamp/sender), so the grid shows the whole set.
*/
function toEntries(m) {
	const base = toEntry(m);
	if (!base) return [];
	if (m.type === "image" && m.albumItems && m.albumItems.length > 1) return m.albumItems.map((it, i) => ({
		...base,
		id: `${m.id}#${i}`,
		url: it.url,
		type: it.kind === "video" ? "video" : base.type,
		durationMs: it.kind === "video" ? it.d ?? null : base.durationMs,
		width: it.w ?? null,
		height: it.h ?? null
	}));
	return [base];
}
var fmtDate = (ts) => new Date(ts).toLocaleDateString(void 0, {
	day: "numeric",
	month: "short",
	year: "numeric"
});
var fmtDur = (ms) => {
	if (!ms) return "";
	const s = Math.round(ms / 1e3);
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
function ProfileMediaPage({ open, dark, onClose }) {
	const names = useNames();
	const [tab, setTab] = (0, import_react.useState)("image");
	const [items, setItems] = (0, import_react.useState)([]);
	const [hasMore, setHasMore] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [loadingMore, setLoadingMore] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [counts, setCounts] = (0, import_react.useState)(null);
	const [viewerIdx, setViewerIdx] = (0, import_react.useState)(null);
	const scrollRef = (0, import_react.useRef)(null);
	const sentinelRef = (0, import_react.useRef)(null);
	const reqRef = (0, import_react.useRef)(0);
	const moreRef = (0, import_react.useRef)(false);
	const bg = dark ? "#0e0e0e" : "#fff";
	const fg = dark ? "#f0f0f0" : "#7a2040";
	const tile = dark ? "rgba(255,255,255,0.06)" : "rgba(201,24,74,0.06)";
	const loadFirst = (0, import_react.useCallback)(async (filter) => {
		const id = ++reqRef.current;
		setLoading(true);
		setError("");
		const r = await listMedia(filter, null);
		if (id !== reqRef.current) return;
		if (!r) {
			setError("Couldn’t load media. Check your connection and try again.");
			setItems([]);
			setHasMore(false);
		} else {
			setItems(r.items.flatMap(toEntries));
			setHasMore(r.hasMore);
			scrollRef.current?.scrollTo({ top: 0 });
		}
		setLoading(false);
	}, []);
	const loadMore = (0, import_react.useCallback)(async () => {
		if (moreRef.current || loading || !hasMore || items.length === 0) return;
		moreRef.current = true;
		setLoadingMore(true);
		const id = reqRef.current;
		const oldest = items[items.length - 1].ts;
		const r = await listMedia(tab, oldest);
		if (id === reqRef.current && r) {
			setItems((prev) => {
				const seen = new Set(prev.map((p) => p.id));
				const fresh = r.items.flatMap(toEntries).filter((x) => !seen.has(x.id));
				return fresh.length ? [...prev, ...fresh] : prev;
			});
			setHasMore(r.hasMore);
		}
		moreRef.current = false;
		setLoadingMore(false);
	}, [
		tab,
		items,
		hasMore,
		loading
	]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		loadFirst(tab);
	}, [
		open,
		tab,
		loadFirst
	]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		countMedia().then((c) => c && setCounts(c));
	}, [open]);
	(0, import_react.useEffect)(() => {
		if (!open || !hasMore) return;
		const root = scrollRef.current;
		const target = sentinelRef.current;
		if (!root || !target) return;
		const io = new IntersectionObserver((es) => {
			if (es.some((e) => e.isIntersecting)) loadMore();
		}, {
			root,
			rootMargin: "0px 0px 600px 0px"
		});
		io.observe(target);
		return () => io.disconnect();
	}, [
		open,
		hasMore,
		loadMore
	]);
	const openViewer = (0, import_react.useCallback)((i) => {
		haptics.light();
		setViewerIdx(i);
	}, []);
	if (!open) return null;
	const summary = counts ? `${counts.image} photos · ${counts.video} videos · ${counts.gif + counts.sticker} GIFs & stickers · ${counts.file} files` : "Loading your memories…";
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		"data-testid": "profile-media-page",
		className: "fixed inset-0 z-[82] flex flex-col",
		initial: {
			opacity: 0,
			y: 24
		},
		animate: {
			opacity: 1,
			y: 0
		},
		exit: {
			opacity: 0,
			y: 24
		},
		transition: {
			duration: .28,
			ease: [
				.22,
				1,
				.36,
				1
			]
		},
		style: { background: bg },
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 12,
					padding: "calc(env(safe-area-inset-top,0px) + 14px) 16px 14px",
					background: "linear-gradient(135deg,#ff8fab,#ff4d7a,#c9184a)",
					color: "white",
					flexShrink: 0
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					"data-testid": "profile-close-btn",
					onClick: () => {
						haptics.light();
						onClose();
					},
					"aria-label": "Close",
					style: {
						background: "rgba(255,255,255,0.25)",
						border: "1px solid rgba(255,255,255,0.4)",
						color: "white",
						width: 36,
						height: 36,
						borderRadius: 999,
						fontSize: 18,
						cursor: "pointer",
						flexShrink: 0
					},
					children: "‹"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						flex: 1,
						minWidth: 0
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						style: {
							margin: 0,
							fontFamily: "'Great Vibes', cursive",
							fontSize: 24,
							lineHeight: 1.1
						},
						"data-testid": "profile-media-title",
						children: [
							names.habiba,
							" & ",
							names.faizan
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						"data-testid": "profile-media-summary",
						style: {
							margin: 0,
							fontSize: 12,
							opacity: .9,
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis"
						},
						children: summary
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					display: "flex",
					flexShrink: 0,
					overflowX: "auto",
					scrollbarWidth: "none",
					borderBottom: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,150,180,0.28)"
				},
				children: TABS.map((t) => {
					const n = counts?.[t.id];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						"data-testid": `profile-tab-${t.id}`,
						onClick: () => {
							haptics.light();
							setTab(t.id);
						},
						style: {
							flex: "1 0 auto",
							minWidth: 76,
							padding: "12px 10px",
							border: "none",
							background: "transparent",
							cursor: "pointer",
							fontSize: 12,
							fontWeight: 700,
							letterSpacing: "0.06em",
							textTransform: "uppercase",
							color: tab === t.id ? "#c9184a" : fg,
							opacity: tab === t.id ? 1 : .55,
							borderBottom: tab === t.id ? "2px solid #c9184a" : "2px solid transparent",
							whiteSpace: "nowrap"
						},
						children: [t.label, typeof n === "number" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								marginLeft: 5,
								fontSize: 10,
								opacity: .8
							},
							children: n
						})]
					}, t.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: scrollRef,
				"data-testid": "profile-media-scroll",
				style: {
					flex: 1,
					overflowY: "auto",
					padding: 3,
					overscrollBehavior: "contain"
				},
				children: [
					loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							padding: 60,
							textAlign: "center",
							color: fg,
							opacity: .6
						},
						children: "Loading…"
					}) : error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							padding: 40,
							textAlign: "center",
							color: "#c9184a",
							fontSize: 14
						},
						children: [error, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => void loadFirst(tab),
							style: {
								marginTop: 12,
								padding: "8px 16px",
								borderRadius: 999,
								border: "none",
								background: "linear-gradient(135deg,#ff6b9d,#c9184a)",
								color: "white",
								fontWeight: 700,
								cursor: "pointer"
							},
							children: "Retry"
						}) })]
					}) : items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							padding: 60,
							textAlign: "center",
							color: fg,
							opacity: .6
						},
						children: "Nothing here yet"
					}) : tab === "file" || tab === "voice" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							display: "flex",
							flexDirection: "column",
							gap: 6,
							padding: 6
						},
						children: items.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileRow, {
							entry: m,
							fg,
							tile,
							onOpen: () => openViewer(i)
						}, m.id))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							display: "grid",
							gridTemplateColumns: "repeat(auto-fill, minmax(min(33.33%, 180px), 1fr))",
							gap: 3
						},
						children: items.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
							entry: m,
							tile,
							onOpen: () => openViewer(i)
						}, m.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						ref: sentinelRef,
						style: { height: 1 }
					}),
					loadingMore && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"data-testid": "profile-media-loading-more",
						style: {
							padding: 16,
							textAlign: "center",
							color: fg,
							opacity: .6,
							fontSize: 13
						},
						children: "Loading more…"
					}),
					!loading && !hasMore && items.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						"data-testid": "profile-media-end",
						style: {
							padding: "16px 0 24px",
							textAlign: "center",
							color: fg,
							opacity: .45,
							fontSize: 12
						},
						children: [
							"That’s everything — ",
							items.length,
							" item",
							items.length === 1 ? "" : "s",
							" ✨"
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: viewerIdx !== null && items[viewerIdx] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaViewer, {
				entries: items,
				index: viewerIdx,
				onIndex: setViewerIdx,
				onClose: () => setViewerIdx(null),
				onNeedMore: () => {
					if (hasMore) loadMore();
				}
			}) })
		]
	}), document.body);
}
function Tile({ entry, tile, onOpen }) {
	const isSticker = entry.type === "sticker";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			position: "relative",
			aspectRatio: "1 / 1",
			background: tile,
			overflow: "hidden"
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.button, {
			"data-testid": "profile-media-cell",
			onClick: onOpen,
			whileTap: { scale: .96 },
			style: {
				width: "100%",
				height: "100%",
				border: "none",
				padding: isSticker ? 8 : 0,
				cursor: "pointer",
				background: "transparent",
				display: "block"
			},
			children: [entry.type === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					src: entry.url,
					muted: true,
					playsInline: true,
					preload: "metadata",
					style: {
						width: "100%",
						height: "100%",
						objectFit: "cover",
						display: "block"
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					style: {
						position: "absolute",
						top: 6,
						right: 6,
						color: "white",
						fontSize: 14,
						textShadow: "0 1px 3px rgba(0,0,0,0.6)"
					},
					children: "▶"
				}),
				entry.durationMs ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					style: {
						position: "absolute",
						bottom: 6,
						right: 6,
						color: "white",
						fontSize: 11,
						background: "rgba(0,0,0,0.5)",
						padding: "1px 6px",
						borderRadius: 6
					},
					children: fmtDur(entry.durationMs)
				}) : null
			] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: entry.url,
				alt: "",
				loading: "lazy",
				decoding: "async",
				style: {
					width: "100%",
					height: "100%",
					objectFit: isSticker ? "contain" : "cover",
					display: "block"
				}
			}), entry.type === "gif" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				style: {
					position: "absolute",
					bottom: 6,
					left: 6,
					color: "white",
					fontSize: 9,
					fontWeight: 900,
					letterSpacing: "0.08em",
					background: "rgba(0,0,0,0.55)",
					padding: "2px 5px",
					borderRadius: 5
				},
				children: "GIF"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			"data-testid": "profile-media-download",
			"aria-label": "Download",
			title: "Download",
			onClick: (e) => {
				e.stopPropagation();
				haptics.light();
				downloadMedia(entry.url, entry.type, {
					mime: entry.mime,
					ts: entry.ts
				});
			},
			style: {
				position: "absolute",
				bottom: 6,
				right: entry.type === "video" && entry.durationMs ? 46 : 6,
				width: 26,
				height: 26,
				borderRadius: 999,
				border: "none",
				background: "rgba(0,0,0,0.5)",
				color: "white",
				fontSize: 14,
				cursor: "pointer",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				lineHeight: 1
			},
			children: "⤓"
		})]
	});
}
function FileRow({ entry, fg, tile, onOpen }) {
	const isVoice = entry.type === "voice";
	const name = entry.fileName || (isVoice ? `Voice note ${fmtDur(entry.durationMs)}` : "File");
	const meta = [
		formatBytes(entry.fileSize),
		fmtDate(entry.ts),
		getNames()[entry.sender]
	].filter(Boolean).join(" · ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "profile-media-row",
		style: {
			display: "flex",
			alignItems: "center",
			gap: 12,
			padding: "10px 12px",
			borderRadius: 14,
			background: tile,
			color: fg
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: onOpen,
				"aria-label": "Open",
				style: {
					width: 44,
					height: 44,
					borderRadius: 12,
					border: "none",
					cursor: "pointer",
					fontSize: 22,
					background: "linear-gradient(135deg,#ff6b9d,#c9184a)",
					color: "white",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0
				},
				children: isVoice ? "🎙️" : fileGlyph(entry.mime, entry.fileName)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: onOpen,
				style: {
					flex: 1,
					minWidth: 0,
					textAlign: "left",
					border: "none",
					background: "transparent",
					color: fg,
					cursor: "pointer",
					padding: 0
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						fontSize: 14,
						fontWeight: 700,
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis"
					},
					children: name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						fontSize: 11.5,
						opacity: .65,
						marginTop: 2
					},
					children: meta
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				"data-testid": "profile-media-download",
				"aria-label": "Download",
				title: "Download",
				onClick: () => {
					haptics.light();
					downloadMedia(entry.url, entry.type, {
						filename: entry.fileName,
						mime: entry.mime,
						ts: entry.ts
					});
				},
				style: {
					width: 36,
					height: 36,
					borderRadius: 999,
					border: "1px solid rgba(201,24,74,0.35)",
					background: "transparent",
					color: "#c9184a",
					fontSize: 17,
					cursor: "pointer",
					flexShrink: 0
				},
				children: "⤓"
			})
		]
	});
}
function MediaViewer({ entries, index, onIndex, onClose, onNeedMore }) {
	const entry = entries[index];
	const go = (dir) => {
		const next = index + dir;
		if (next < 0 || next >= entries.length) return;
		haptics.light();
		onIndex(next);
		if (next >= entries.length - 3) onNeedMore();
	};
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key === "Escape") onClose();
			else if (e.key === "ArrowRight") go(1);
			else if (e.key === "ArrowLeft") go(-1);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [index, entries.length]);
	const caption = `${getNames()[entry.sender] ?? ""} · ${fmtDate(entry.ts)}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		"data-testid": "media-viewer",
		className: "fixed inset-0 z-[90] flex items-center justify-center",
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		style: { background: "rgba(0,0,0,0.96)" },
		onClick: onClose,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
				drag: "x",
				dragConstraints: {
					left: 0,
					right: 0
				},
				dragElastic: .5,
				onDragEnd: (_e, info) => {
					if (info.offset.x < -80) go(1);
					else if (info.offset.x > 80) go(-1);
				},
				initial: {
					opacity: 0,
					scale: .96
				},
				animate: {
					opacity: 1,
					scale: 1
				},
				transition: { duration: .22 },
				onClick: (e) => e.stopPropagation(),
				style: {
					maxWidth: "100%",
					maxHeight: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: "0 8px"
				},
				children: entry.type === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					src: entry.url,
					controls: true,
					autoPlay: true,
					playsInline: true,
					style: {
						maxWidth: "100vw",
						maxHeight: "84vh",
						borderRadius: 8
					}
				}) : entry.type === "voice" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						background: "rgba(255,255,255,0.08)",
						borderRadius: 20,
						padding: 24,
						color: "white",
						textAlign: "center",
						minWidth: 260
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 40,
							marginBottom: 12
						},
						children: "🎙️"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
						src: entry.url,
						controls: true,
						autoPlay: true,
						style: { width: "100%" }
					})]
				}) : entry.type === "file" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						background: "rgba(255,255,255,0.08)",
						borderRadius: 20,
						padding: 28,
						color: "white",
						textAlign: "center",
						maxWidth: 360
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								fontSize: 56,
								marginBottom: 10
							},
							children: fileGlyph(entry.mime, entry.fileName)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								fontSize: 16,
								fontWeight: 700,
								wordBreak: "break-word"
							},
							children: entry.fileName || "File"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								fontSize: 12.5,
								opacity: .7,
								marginTop: 4
							},
							children: [formatBytes(entry.fileSize), entry.mime].filter(Boolean).join(" · ")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							"data-testid": "viewer-file-download",
							onClick: () => {
								haptics.light();
								downloadMedia(entry.url, "file", {
									filename: entry.fileName,
									mime: entry.mime,
									ts: entry.ts
								});
							},
							style: {
								marginTop: 18,
								padding: "11px 22px",
								borderRadius: 999,
								border: "none",
								background: "linear-gradient(135deg,#ff6b9d,#c9184a)",
								color: "white",
								fontWeight: 700,
								fontSize: 14,
								cursor: "pointer"
							},
							children: "⤓ Download"
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: entry.url,
					alt: "",
					style: {
						maxWidth: "100vw",
						maxHeight: "88vh",
						objectFit: "contain",
						borderRadius: 8
					}
				})
			}, entry.id),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				"data-testid": "viewer-close",
				onClick: onClose,
				"aria-label": "Close",
				style: ctrl({
					top: "max(20px,env(safe-area-inset-top))",
					left: 16
				}),
				children: "✕"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				"data-testid": "viewer-download",
				onClick: (e) => {
					e.stopPropagation();
					haptics.light();
					downloadMedia(entry.url, entry.type, {
						filename: entry.fileName,
						mime: entry.mime,
						ts: entry.ts
					});
				},
				"aria-label": "Download",
				title: "Download",
				style: ctrl({
					top: "max(20px,env(safe-area-inset-top))",
					right: 16
				}),
				children: "⤓"
			}),
			index > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: (e) => {
					e.stopPropagation();
					go(-1);
				},
				"aria-label": "Previous",
				style: ctrl({
					left: 12,
					top: "50%"
				}),
				children: "‹"
			}),
			index < entries.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: (e) => {
					e.stopPropagation();
					go(1);
				},
				"aria-label": "Next",
				style: ctrl({
					right: 12,
					top: "50%"
				}),
				children: "›"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					position: "absolute",
					bottom: "calc(20px + env(safe-area-inset-bottom))",
					left: "50%",
					transform: "translateX(-50%)",
					color: "rgba(255,255,255,0.85)",
					fontSize: 13,
					textAlign: "center",
					whiteSpace: "nowrap"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					index + 1,
					" / ",
					entries.length
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						fontSize: 11.5,
						opacity: .7,
						marginTop: 2
					},
					children: caption
				})]
			})
		]
	});
}
function ctrl(pos) {
	return {
		position: "absolute",
		...pos,
		width: 42,
		height: 42,
		borderRadius: 999,
		background: "rgba(255,255,255,0.16)",
		border: "1px solid rgba(255,255,255,0.3)",
		color: "white",
		fontSize: 20,
		cursor: "pointer",
		backdropFilter: "blur(8px)",
		WebkitBackdropFilter: "blur(8px)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		zIndex: 2
	};
}
//#endregion
export { ProfileMediaPage as default };
