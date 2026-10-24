import { i as __toESM } from "../_runtime.mjs";
import { d as require_react_dom, q as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as haptics, h as volumeAdjustable, m as musicStore, p as fmtTime } from "./routes-dAk2nEzm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/music-page-CWg1sdOP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
var PINK_GRAD = "linear-gradient(135deg, #ff8fab, #ff4d7a, #c9184a)";
var SongRow = (0, import_react.memo)(function SongRow({ song, rowState, dark, onPlay }) {
	const active = rowState !== "idle";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		"data-testid": "music-song-row",
		className: "hb-music-row",
		onClick: () => onPlay(song.n - 1),
		style: {
			display: "flex",
			alignItems: "center",
			gap: 12,
			width: "100%",
			textAlign: "left",
			padding: "0 16px",
			height: 56,
			background: active ? dark ? "rgba(255,77,122,0.16)" : "#fff0f5" : "transparent",
			border: "none",
			borderBottom: dark ? "1px solid rgba(255,150,180,0.12)" : "1px solid rgba(255,150,180,0.22)",
			cursor: "pointer",
			WebkitTapHighlightColor: "transparent"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				style: {
					width: 30,
					flexShrink: 0,
					fontSize: 13,
					fontWeight: 700,
					fontFamily: "'Cormorant Garamond', serif",
					color: active ? "#ff4d7a" : dark ? "rgba(245,217,226,0.5)" : "#c98da1"
				},
				children: song.n
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				style: {
					flex: 1,
					minWidth: 0,
					whiteSpace: "nowrap",
					overflow: "hidden",
					textOverflow: "ellipsis",
					fontFamily: "'Cormorant Garamond', serif",
					fontSize: 17,
					fontWeight: 600,
					color: active ? "#e0316b" : dark ? "#f5d9e2" : "#3d1522"
				},
				children: song.title
			}),
			active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				style: {
					flexShrink: 0,
					fontSize: 10,
					fontWeight: 700,
					letterSpacing: "0.08em",
					textTransform: "uppercase",
					color: "#fff",
					background: PINK_GRAD,
					borderRadius: 999,
					padding: "4px 10px"
				},
				children: rowState === "playing" ? "♪ Playing" : rowState === "loading" ? "Loading…" : "Paused"
			})
		]
	});
});
function BottomPlayer({ title, playing, buffering, dark }) {
	const fillRef = (0, import_react.useRef)(null);
	const curRef = (0, import_react.useRef)(null);
	const durRef = (0, import_react.useRef)(null);
	const trackRef = (0, import_react.useRef)(null);
	const draggingRef = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		const a = musicStore.audioEl();
		const paint = () => {
			const d = a.duration;
			if (!draggingRef.current && fillRef.current) {
				const p = Number.isFinite(d) && d > 0 ? a.currentTime / d : 0;
				fillRef.current.style.transform = `scaleX(${p})`;
			}
			if (curRef.current) curRef.current.textContent = fmtTime(a.currentTime);
			if (durRef.current) durRef.current.textContent = fmtTime(a.duration);
		};
		paint();
		a.addEventListener("timeupdate", paint);
		a.addEventListener("loadedmetadata", paint);
		a.addEventListener("seeked", paint);
		return () => {
			a.removeEventListener("timeupdate", paint);
			a.removeEventListener("loadedmetadata", paint);
			a.removeEventListener("seeked", paint);
		};
	}, []);
	const fracFromEvent = (e) => {
		const el = trackRef.current;
		if (!el) return 0;
		const r = el.getBoundingClientRect();
		return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
	};
	const onPointerDown = (e) => {
		draggingRef.current = true;
		e.currentTarget.setPointerCapture(e.pointerId);
		if (fillRef.current) fillRef.current.style.transform = `scaleX(${fracFromEvent(e)})`;
	};
	const onPointerMove = (e) => {
		if (!draggingRef.current) return;
		if (fillRef.current) fillRef.current.style.transform = `scaleX(${fracFromEvent(e)})`;
	};
	const onPointerUp = (e) => {
		if (!draggingRef.current) return;
		draggingRef.current = false;
		const a = musicStore.audioEl();
		if (Number.isFinite(a.duration) && a.duration > 0) musicStore.seek(fracFromEvent(e) * a.duration);
	};
	const btnStyle = (size, primary = false) => ({
		width: size,
		height: size,
		borderRadius: 999,
		border: primary ? "none" : dark ? "1px solid rgba(255,150,180,0.3)" : "1px solid rgba(255,150,180,0.5)",
		background: primary ? PINK_GRAD : "transparent",
		color: primary ? "#fff" : dark ? "#f5d9e2" : "#c9184a",
		fontSize: primary ? 18 : 15,
		lineHeight: 1,
		cursor: "pointer",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
		WebkitTapHighlightColor: "transparent",
		boxShadow: primary ? "0 4px 14px rgba(255,77,122,0.4)" : "none"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "music-bottom-player",
		style: {
			position: "absolute",
			left: 0,
			right: 0,
			bottom: 0,
			background: dark ? "#2e181f" : "rgba(255,255,255,0.98)",
			borderTop: dark ? "1px solid rgba(255,150,180,0.2)" : "1.5px solid rgba(255,150,180,0.4)",
			boxShadow: "0 -6px 24px rgba(201,24,74,0.18)",
			padding: "10px 16px",
			paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 10
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					"data-testid": "music-player-title",
					style: {
						flex: 1,
						minWidth: 0,
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
						fontFamily: "'Cormorant Garamond', serif",
						fontSize: 16,
						fontWeight: 700,
						color: dark ? "#f5d9e2" : "#3d1522"
					},
					children: [
						"♪ ",
						title,
						buffering && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								opacity: .55,
								fontWeight: 600
							},
							children: " · loading…"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"data-testid": "music-player-close",
					"aria-label": "Stop music",
					title: "Stop music",
					onClick: () => {
						haptics.light();
						musicStore.stop();
					},
					style: btnStyle(30),
					children: "✕"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 10,
					marginTop: 8
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						ref: curRef,
						"data-testid": "music-current-time",
						style: {
							fontSize: 11,
							fontVariantNumeric: "tabular-nums",
							color: dark ? "rgba(245,217,226,0.7)" : "#a4506b",
							width: 36,
							flexShrink: 0
						},
						children: "0:00"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						ref: trackRef,
						"data-testid": "music-progress-track",
						onPointerDown,
						onPointerMove,
						onPointerUp,
						onPointerCancel: onPointerUp,
						style: {
							flex: 1,
							height: 22,
							display: "flex",
							alignItems: "center",
							cursor: "pointer",
							touchAction: "none"
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								position: "relative",
								width: "100%",
								height: 5,
								borderRadius: 999,
								background: dark ? "rgba(255,150,180,0.18)" : "rgba(255,150,180,0.3)",
								overflow: "hidden"
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								ref: fillRef,
								style: {
									position: "absolute",
									inset: 0,
									background: PINK_GRAD,
									transform: "scaleX(0)",
									transformOrigin: "left center",
									borderRadius: 999
								}
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						ref: durRef,
						"data-testid": "music-duration",
						style: {
							fontSize: 11,
							fontVariantNumeric: "tabular-nums",
							color: dark ? "rgba(245,217,226,0.7)" : "#a4506b",
							width: 36,
							flexShrink: 0,
							textAlign: "right"
						},
						children: "0:00"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: 18,
					marginTop: 6
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"data-testid": "music-prev",
						"aria-label": "Previous song",
						onClick: () => {
							haptics.light();
							musicStore.prev();
						},
						style: btnStyle(40),
						children: "⏮"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"data-testid": "music-play-pause",
						"aria-label": playing ? "Pause" : "Play",
						onClick: () => {
							haptics.light();
							musicStore.toggle();
						},
						style: btnStyle(52, true),
						children: playing ? "❚❚" : "▶"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"data-testid": "music-next",
						"aria-label": "Next song",
						onClick: () => {
							haptics.light();
							musicStore.next();
						},
						style: btnStyle(40),
						children: "⏭"
					}),
					volumeAdjustable && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 6,
							marginLeft: 6
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": true,
							style: { fontSize: 13 },
							children: "🔉"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							"data-testid": "music-volume",
							"aria-label": "Volume",
							min: 0,
							max: 1,
							step: .01,
							defaultValue: musicStore.getVolume(),
							onInput: (e) => musicStore.setVolume(Number(e.target.value)),
							style: {
								width: 84,
								accentColor: "#ff4d7a"
							}
						})]
					})
				]
			})
		]
	});
}
function MusicPage({ dark = false, onClose }) {
	const st = (0, import_react.useSyncExternalStore)(musicStore.subscribe, musicStore.getSnapshot);
	(0, import_react.useEffect)(() => {
		musicStore.loadSongs();
	}, []);
	const onPlay = (0, import_react.useCallback)((i) => {
		haptics.light();
		musicStore.playIndex(i);
	}, []);
	const current = st.index >= 0 ? st.songs[st.index] : null;
	const node = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "music-page",
		className: "hb-music-page",
		style: {
			position: "fixed",
			inset: 0,
			zIndex: 9e3,
			display: "flex",
			flexDirection: "column",
			background: dark ? "#241318" : "#fff7f9",
			overscrollBehavior: "contain"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					flexShrink: 0,
					display: "flex",
					alignItems: "center",
					gap: 12,
					padding: "16px",
					paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
					background: PINK_GRAD,
					boxShadow: "0 4px 20px rgba(255,80,130,0.28), inset 0 -1px 0 rgba(255,255,255,0.15)"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						flex: 1,
						minWidth: 0
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						style: {
							fontFamily: "'Great Vibes', cursive",
							fontSize: 27,
							color: "white",
							lineHeight: 1.4,
							padding: "2px 4px 0 2px",
							textShadow: "0 2px 10px rgba(0,0,0,0.15)",
							whiteSpace: "nowrap"
						},
						children: "Our Songs 🎵"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						style: {
							fontFamily: "'Cormorant Garamond', serif",
							fontSize: 12,
							color: "rgba(255,255,255,0.86)",
							letterSpacing: "0.02em",
							marginTop: 3
						},
						children: st.songsLoaded ? `• ${st.songs.length} song${st.songs.length === 1 ? "" : "s"} • tap one to play •` : "• loading songs •"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"data-testid": "music-close",
					"aria-label": "Back to chat",
					title: "Back to chat",
					onClick: () => {
						haptics.light();
						onClose();
					},
					style: {
						width: 36,
						height: 36,
						borderRadius: 999,
						background: "rgba(255,255,255,0.28)",
						border: "1px solid rgba(255,255,255,0.4)",
						color: "white",
						fontSize: 16,
						lineHeight: 1,
						cursor: "pointer",
						flexShrink: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						WebkitTapHighlightColor: "transparent"
					},
					children: "✕"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					flex: 1,
					overflowY: "auto",
					WebkitOverflowScrolling: "touch",
					paddingBottom: current ? "calc(env(safe-area-inset-bottom, 0px) + 178px)" : "calc(env(safe-area-inset-bottom, 0px) + 24px)"
				},
				children: [
					!st.songsLoaded && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						style: {
							textAlign: "center",
							marginTop: 48,
							fontFamily: "'Cormorant Garamond', serif",
							fontSize: 16,
							color: dark ? "rgba(245,217,226,0.6)" : "#a4506b"
						},
						children: "Loading songs…"
					}),
					st.songsLoaded && st.songsError && st.songs.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							textAlign: "center",
							marginTop: 48,
							padding: "0 24px"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							style: {
								fontFamily: "'Cormorant Garamond', serif",
								fontSize: 16,
								color: dark ? "#f5d9e2" : "#3d1522"
							},
							children: ["Couldn't load songs — ", st.songsError]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RetryButton, {})]
					}),
					st.songsLoaded && !st.songsError && st.songs.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							textAlign: "center",
							marginTop: 48,
							padding: "0 24px"
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								style: {
									fontFamily: "'Cormorant Garamond', serif",
									fontSize: 17,
									fontWeight: 600,
									color: dark ? "#f5d9e2" : "#3d1522"
								},
								children: "No songs found yet 🎶"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								style: {
									marginTop: 8,
									fontFamily: "'Cormorant Garamond', serif",
									fontSize: 14,
									color: dark ? "rgba(245,217,226,0.6)" : "#a4506b"
								},
								children: [
									"Upload audio files to the “",
									"music",
									"” bucket in Supabase Storage, then tap retry."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								style: {
									marginTop: 6,
									fontFamily: "'Cormorant Garamond', serif",
									fontSize: 12.5,
									lineHeight: 1.45,
									color: dark ? "rgba(245,217,226,0.45)" : "#bd7c93"
								},
								children: [
									"Already uploaded them? Storage needs a read policy before the browser is allowed to list the bucket — run",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
										style: { fontSize: 11.5 },
										children: "supabase/migrations/20260601000000_music_bucket.sql"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RetryButton, {})
						]
					}),
					st.songs.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SongRow, {
						song: s,
						dark,
						onPlay,
						rowState: i !== st.index ? "idle" : st.buffering ? "loading" : st.playing ? "playing" : "paused"
					}, s.path))
				]
			}),
			current && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomPlayer, {
				title: current.title,
				playing: st.playing,
				buffering: st.buffering,
				dark
			})
		]
	});
	return (0, import_react_dom.createPortal)(node, document.body);
}
function RetryButton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"data-testid": "music-retry",
		onClick: () => {
			haptics.light();
			musicStore.loadSongs();
		},
		style: {
			marginTop: 16,
			padding: "10px 22px",
			borderRadius: 999,
			border: "none",
			background: PINK_GRAD,
			color: "#fff",
			fontFamily: "'Cormorant Garamond', serif",
			fontWeight: 700,
			fontSize: 14,
			letterSpacing: "0.06em",
			textTransform: "uppercase",
			cursor: "pointer",
			boxShadow: "0 4px 14px rgba(255,77,122,0.4)"
		},
		children: "Retry"
	});
}
//#endregion
export { MusicPage as default };
