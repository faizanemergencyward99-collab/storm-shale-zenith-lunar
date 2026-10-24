import { i as __toESM } from "../_runtime.mjs";
import { d as require_react_dom, q as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import "./router-CiLQKuwA.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { o as MotionConfig, s as AnimatePresence } from "../_libs/framer-motion+[...].mjs";
import { t as motion } from "../_libs/motion.mjs";
import { t as es } from "../_libs/react-virtuoso.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/supabase-xEhuGcjP.js
var FALLBACK_URL = "https://jqhstwtmhtsupkiwatyv.supabase.co";
var FALLBACK_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxaHN0d3RtaHRzdXBraXdhdHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NjYzMTksImV4cCI6MjEwODQ0MjMxOX0.5pl_uVBO6Pje-3Uw0NBHn-2eVgCFUJ-VpPofbUun8vc";
var SUPABASE_URL = FALLBACK_URL.replace(/\/+$/, "");
var SUPABASE_ANON_KEY = FALLBACK_ANON_KEY;
var isSupabaseConfigured = Boolean(SUPABASE_URL && "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxaHN0d3RtaHRzdXBraXdhdHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NjYzMTksImV4cCI6MjEwODQ0MjMxOX0.5pl_uVBO6Pje-3Uw0NBHn-2eVgCFUJ-VpPofbUun8vc");
var supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
	auth: {
		persistSession: false,
		autoRefreshToken: false,
		detectSessionInUrl: false
	},
	realtime: { params: { eventsPerSecond: 10 } }
});
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/names-ozI5EV1N.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var EXT_BY_MIME = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"image/gif": "gif",
	"image/heic": "heic",
	"video/mp4": "mp4",
	"video/quicktime": "mov",
	"video/webm": "webm",
	"audio/mp4": "m4a",
	"audio/aac": "aac",
	"audio/mpeg": "mp3",
	"audio/webm": "webm",
	"audio/ogg": "ogg",
	"audio/wav": "wav",
	"application/pdf": "pdf",
	"application/zip": "zip"
};
function extFromUrl(url) {
	try {
		const p = new URL(url).pathname;
		const m = /\.([a-z0-9]{2,5})$/i.exec(p);
		return m ? m[1].toLowerCase() : "";
	} catch {
		return "";
	}
}
function suggestFilename(url, kind, mime, original, ts) {
	if (original) return original;
	const d = ts ? new Date(ts) : /* @__PURE__ */ new Date();
	const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
	const ext = mime && EXT_BY_MIME[mime.split(";")[0].trim()] || extFromUrl(url) || (kind === "video" ? "mp4" : kind === "gif" || kind === "sticker" ? "gif" : kind === "voice" ? "m4a" : kind === "file" ? "bin" : "jpg");
	return `ourchat-${kind === "image" ? "photo" : kind === "video" ? "video" : kind === "gif" ? "gif" : kind === "sticker" ? "sticker" : kind === "voice" ? "voice" : "file"}-${stamp}.${ext}`;
}
/** Add Supabase's `?download=` hint when the URL is a storage public object. */
function withDownloadHint(url, filename) {
	if (!/\/storage\/v1\/object\/public\//.test(url)) return url;
	try {
		const u = new URL(url);
		u.searchParams.set("download", filename);
		return u.toString();
	} catch {
		return url;
	}
}
function triggerAnchor(href, filename, newTab = false) {
	const a = document.createElement("a");
	a.href = href;
	a.download = filename;
	a.rel = "noopener";
	if (newTab) a.target = "_blank";
	document.body.appendChild(a);
	a.click();
	a.remove();
}
async function downloadMedia(url, kind, opts = {}) {
	const filename = suggestFilename(url, kind, opts.mime, opts.filename, opts.ts);
	try {
		const res = await fetch(url, { mode: "cors" });
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const blob = await res.blob();
		const file = new File([blob], filename, { type: blob.type || opts.mime || "application/octet-stream" });
		const nav = navigator;
		const coarse = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
		if ((opts.preferShare ?? coarse) && nav.share && nav.canShare?.({ files: [file] })) try {
			await nav.share({ files: [file] });
			return "shared";
		} catch (e) {
			if (e?.name === "AbortError") return "shared";
		}
		const objUrl = URL.createObjectURL(blob);
		triggerAnchor(objUrl, filename);
		setTimeout(() => URL.revokeObjectURL(objUrl), 1e4);
		return "saved";
	} catch {
		const hinted = withDownloadHint(url, filename);
		triggerAnchor(hinted, filename, hinted === url);
		return "opened";
	}
}
function formatBytes(n) {
	if (!n || n <= 0) return "";
	if (n < 1024) return `${n} B`;
	if (n < 1048576) return `${(n / 1024).toFixed(0)} KB`;
	if (n < 1073741824) return `${(n / 1048576).toFixed(1)} MB`;
	return `${(n / 1073741824).toFixed(2)} GB`;
}
/** Emoji glyph for a file bubble / gallery tile based on its MIME or name. */
function fileGlyph(mime, name) {
	const m = (mime || "").toLowerCase();
	const n = (name || "").toLowerCase();
	if (m.includes("pdf") || n.endsWith(".pdf")) return "📕";
	if (m.includes("zip") || m.includes("rar") || m.includes("7z") || /\.(zip|rar|7z|tar|gz)$/.test(n)) return "🗜️";
	if (m.includes("word") || /\.(docx?|rtf|odt)$/.test(n)) return "📝";
	if (m.includes("sheet") || m.includes("excel") || /\.(xlsx?|csv|ods)$/.test(n)) return "📊";
	if (m.includes("presentation") || m.includes("powerpoint") || /\.(pptx?|key)$/.test(n)) return "📽️";
	if (m.startsWith("audio/")) return "🎵";
	if (m.startsWith("video/")) return "🎬";
	if (m.startsWith("image/")) return "🖼️";
	if (m.startsWith("text/") || /\.(txt|md|json|xml|log)$/.test(n)) return "📄";
	if (/\.(apk|exe|dmg|pkg)$/.test(n)) return "📦";
	return "📎";
}
var DEFAULT_NAMES = {
	habiba: "Habiba Jii",
	faizan: "Faizan Jii"
};
var CACHE_KEY$1 = "hb_chat_names";
function clean(value, fallback) {
	return (typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 32) : "") || fallback;
}
function normalizeNames(raw) {
	const o = raw ?? {};
	return {
		habiba: clean(o.habiba, DEFAULT_NAMES.habiba),
		faizan: clean(o.faizan, DEFAULT_NAMES.faizan)
	};
}
function readCache() {
	try {
		const raw = localStorage.getItem(CACHE_KEY$1);
		return raw ? normalizeNames(JSON.parse(raw)) : DEFAULT_NAMES;
	} catch {
		return DEFAULT_NAMES;
	}
}
var names = readCache();
var subs = /* @__PURE__ */ new Set();
var getNames = () => names;
/** Replace the names everywhere in the UI (and remember them on this phone). */
function setNames(raw) {
	const next = normalizeNames(raw);
	if (next.habiba === names.habiba && next.faizan === names.faizan) return names;
	names = next;
	try {
		localStorage.setItem(CACHE_KEY$1, JSON.stringify(next));
	} catch {}
	subs.forEach((f) => f());
	return next;
}
function subscribe(cb) {
	subs.add(cb);
	return () => {
		subs.delete(cb);
	};
}
/** Re-renders the calling component whenever the names change. */
function useNames() {
	return (0, import_react.useSyncExternalStore)(subscribe, getNames, getNames);
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/routes-dAk2nEzm.js
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var SMOOTH_TRANSITION = {
	type: "tween",
	ease: [
		.22,
		1,
		.36,
		1
	],
	duration: .5
};
function DefaultProviders({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MotionConfig, {
		transition: SMOOTH_TRANSITION,
		reducedMotion: "never",
		children
	});
}
var ErrorBoundary = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			hasError: false,
			error: null
		};
	}
	static getDerivedStateFromError(error) {
		return {
			hasError: true,
			error
		};
	}
	componentDidCatch(error, info) {
		console.error("[ErrorBoundary]", error, info);
	}
	reset = () => this.setState({
		hasError: false,
		error: null
	});
	render() {
		if (!this.state.hasError) return this.props.children;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				position: "fixed",
				inset: 0,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				padding: 24,
				background: "radial-gradient(ellipse at 50% 30%, #fce4ec 0%, #fff0f8 50%, #fff8fc 100%)",
				fontFamily: "'Cormorant Garamond', serif",
				textAlign: "center",
				zIndex: 9999
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						fontSize: 56,
						marginBottom: 16
					},
					children: "💗"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					style: {
						fontFamily: "'Great Vibes', cursive",
						fontSize: 36,
						color: "#c9184a",
						marginBottom: 12
					},
					children: "oops, a little hiccup"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					style: {
						color: "#7a2040",
						fontSize: 15,
						maxWidth: 360,
						marginBottom: 22,
						lineHeight: 1.6
					},
					children: "Something didn’t load quite right. Just tap below and we’ll start over — everything you love is still here."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => {
						this.reset();
						window.location.reload();
					},
					style: {
						background: "linear-gradient(135deg, #ff4d7a, #c9184a)",
						color: "white",
						border: "none",
						padding: "12px 32px",
						borderRadius: 20,
						fontFamily: "'Cormorant Garamond', serif",
						fontSize: 16,
						letterSpacing: "0.12em",
						cursor: "pointer",
						boxShadow: "0 6px 24px rgba(255,77,122,0.4)"
					},
					children: "try again ✨"
				}),
				this.state.error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
					style: {
						marginTop: 28,
						color: "#94526c",
						fontSize: 11,
						maxWidth: 400,
						opacity: .5
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
						style: { cursor: "pointer" },
						children: "details"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						style: {
							whiteSpace: "pre-wrap",
							textAlign: "left",
							marginTop: 8
						},
						children: this.state.error.message
					})]
				})
			]
		});
	}
};
/**
* Generates a stable device fingerprint from hardware/browser signals.
* Survives: incognito mode, clearing cookies/localStorage, new tabs.
* Does NOT survive: different browser or full OS reinstall.
*/
async function getDeviceFingerprint() {
	const signals = [];
	signals.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
	signals.push(`${screen.availWidth}x${screen.availHeight}`);
	signals.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
	signals.push(String((/* @__PURE__ */ new Date()).getTimezoneOffset()));
	signals.push(navigator.language);
	signals.push(navigator.languages?.join(",") ?? "");
	signals.push(navigator.platform ?? "");
	signals.push(String(navigator.hardwareConcurrency ?? 0));
	signals.push(String(navigator.deviceMemory ?? 0));
	try {
		const canvas = document.createElement("canvas");
		canvas.width = 200;
		canvas.height = 50;
		const ctx = canvas.getContext("2d");
		if (ctx) {
			ctx.textBaseline = "top";
			ctx.font = "14px 'Arial'";
			ctx.fillStyle = "#f60";
			ctx.fillRect(125, 1, 62, 20);
			ctx.fillStyle = "#069";
			ctx.fillText("Fingerprint🎂", 2, 15);
			ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
			ctx.fillText("Fingerprint🎂", 4, 17);
			signals.push(canvas.toDataURL());
		}
	} catch {}
	try {
		const gl = document.createElement("canvas").getContext("webgl");
		if (gl) {
			const ext = gl.getExtension("WEBGL_debug_renderer_info");
			if (ext) {
				signals.push(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL));
				signals.push(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
			}
		}
	} catch {}
	try {
		const audioCtx = new OfflineAudioContext(1, 44100, 44100);
		const oscillator = audioCtx.createOscillator();
		const analyser = audioCtx.createAnalyser();
		const gain = audioCtx.createGain();
		gain.gain.value = 0;
		oscillator.type = "triangle";
		oscillator.frequency.value = 1e4;
		oscillator.connect(analyser);
		analyser.connect(gain);
		gain.connect(audioCtx.destination);
		oscillator.start(0);
		const data = (await audioCtx.startRendering()).getChannelData(0).slice(4500, 4600);
		signals.push(data.reduce((a, b) => a + Math.abs(b), 0).toFixed(10));
	} catch {}
	const raw = signals.join("|||");
	const encoded = new TextEncoder().encode(raw);
	const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
	return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var PASSCODE = "2425";
var KEY_ATTEMPTS = "hb_auth_attempts";
var KEY_BLOCKED = "hb_auth_blocked_fp";
var KEY_UNLOCKED = "hb_auth_unlocked_fp";
function safeGet(key) {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}
function safeSet(key, value) {
	try {
		localStorage.setItem(key, value);
	} catch {}
}
function safeRemove(key) {
	try {
		localStorage.removeItem(key);
	} catch {}
}
/**
* Return the current auth state for a device fingerprint.
* Always synchronous under the hood, but async in signature to keep the
* call-site identical to the previous server-based version.
*/
async function checkAuthStatus(fp) {
	const blockedFp = safeGet(KEY_BLOCKED);
	const unlockedFp = safeGet(KEY_UNLOCKED);
	const attemptsRaw = safeGet(KEY_ATTEMPTS);
	return {
		blocked: blockedFp === fp,
		attempts: attemptsRaw ? parseInt(attemptsRaw, 10) || 0 : 0,
		unlocked: unlockedFp === fp
	};
}
/**
* Try a passcode. Increments attempt count on wrong, blocks after 10 wrongs.
* On success, marks the device as permanently unlocked (persists across reloads).
*/
async function attemptPasscode(fp, code) {
	const status = await checkAuthStatus(fp);
	if (status.blocked) return {
		success: false,
		blocked: true,
		attempts: status.attempts,
		unlocked: false
	};
	if (code === PASSCODE) {
		safeRemove(KEY_ATTEMPTS);
		safeSet(KEY_UNLOCKED, fp);
		return {
			success: true,
			blocked: false,
			attempts: 0,
			unlocked: true
		};
	}
	const newAttempts = Math.min(status.attempts + 1, 10);
	safeSet(KEY_ATTEMPTS, String(newAttempts));
	const blocked = newAttempts >= 10;
	if (blocked) safeSet(KEY_BLOCKED, fp);
	return {
		success: false,
		blocked,
		attempts: newAttempts,
		unlocked: false
	};
}
/** Preference key — flip to `false` to globally silence haptics without
*  touching call sites. Written from Homepage settings if we ever add a UI. */
var PREF_KEY = "hb_haptics_enabled";
function isEnabled() {
	try {
		const v = localStorage.getItem(PREF_KEY);
		return v === null ? true : v !== "false";
	} catch {
		return true;
	}
}
function setHapticsEnabled(on) {
	try {
		localStorage.setItem(PREF_KEY, on ? "true" : "false");
	} catch {}
}
var IS_IOS = typeof navigator !== "undefined" && (/iP(hone|od|ad)/.test(navigator.platform) || /Mac/.test(navigator.platform) && "ontouchend" in document);
var HAS_VIBRATE = typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
var iosSwitchLabel = null;
function ensureIosSwitch() {
	if (typeof document === "undefined") return null;
	if (iosSwitchLabel) return iosSwitchLabel;
	const label = document.createElement("label");
	label.setAttribute("aria-hidden", "true");
	label.style.cssText = [
		"position:fixed",
		"top:0",
		"left:0",
		"width:1px",
		"height:1px",
		"opacity:0",
		"pointer-events:none",
		"overflow:hidden",
		"clip:rect(0 0 0 0)",
		"z-index:-1"
	].join(";");
	const input = document.createElement("input");
	input.type = "checkbox";
	input.setAttribute("switch", "");
	input.tabIndex = -1;
	input.setAttribute("aria-hidden", "true");
	label.appendChild(input);
	document.body.appendChild(label);
	iosSwitchLabel = label;
	return label;
}
function iosTick() {
	const label = ensureIosSwitch();
	if (!label) return;
	try {
		label.click();
	} catch {}
}
var PATTERNS = {
	selection: 5,
	light: 10,
	medium: 20,
	heavy: 40,
	success: [
		15,
		40,
		25
	],
	error: [
		55,
		80,
		55
	],
	celebrate: [
		50,
		30,
		50,
		30,
		100
	]
};
function fire(pattern) {
	if (!isEnabled()) return;
	if (HAS_VIBRATE) {
		try {
			navigator.vibrate(pattern);
		} catch {}
		return;
	}
	if (IS_IOS) iosTick();
}
var haptics = {
	/** Feather-soft — for character-level events (typing, dot-per-digit) */
	selection() {
		fire(PATTERNS.selection);
	},
	/** Standard tap — for buttons, cards, non-critical taps */
	light() {
		fire(PATTERNS.light);
	},
	/** Solid tap — primary CTA confirmation */
	medium() {
		fire(PATTERNS.medium);
	},
	/** Heavy — reserved for irreversible / weighty moments */
	heavy() {
		fire(PATTERNS.heavy);
	},
	/** Rising bounce — used on unlock / correct answer / success */
	success() {
		fire(PATTERNS.success);
	},
	/** Stern buzz-buzz — wrong passcode / failed answer */
	error() {
		fire(PATTERNS.error);
	},
	/** Party pattern — reserved for the cake→homepage moment */
	celebrate() {
		fire(PATTERNS.celebrate);
	},
	/** Toggle on/off (kept for future settings UI) */
	setEnabled: setHapticsEnabled,
	/** Read current pref */
	enabled() {
		return isEnabled();
	}
};
var PASSCODE_LENGTH = 4;
var BG = "radial-gradient(ellipse at 50% -10%, #ffd7e6 0%, #ff9ebf 45%, #ff5c8d 80%, #e8275e 100%)";
var KEYS = [
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"",
	"0",
	"del"
];
function Lockscreen({ onUnlock }) {
	const [digits, setDigits] = (0, import_react.useState)("");
	const [blocked, setBlocked] = (0, import_react.useState)(false);
	const [attemptsUsed, setAttemptsUsed] = (0, import_react.useState)(0);
	const [wrong, setWrong] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const fpRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		(async () => {
			try {
				const fp = await getDeviceFingerprint();
				if (cancelled) return;
				fpRef.current = fp;
				const status = await checkAuthStatus(fp);
				if (cancelled) return;
				setAttemptsUsed(status.attempts);
				if (status.blocked) setBlocked(true);
			} catch {}
		})();
		return () => {
			cancelled = true;
		};
	}, []);
	const submit = (0, import_react.useCallback)(async (code) => {
		if (blocked) return;
		setBusy(true);
		let fp = fpRef.current;
		if (!fp) try {
			fp = await getDeviceFingerprint();
			fpRef.current = fp;
		} catch {
			fp = "unknown-device";
		}
		const res = await attemptPasscode(fp, code);
		setBusy(false);
		if (res.success) {
			haptics.success();
			onUnlock();
			return;
		}
		haptics.error();
		setWrong(true);
		setAttemptsUsed(res.attempts);
		setDigits("");
		if (res.blocked) setBlocked(true);
		window.setTimeout(() => setWrong(false), 500);
	}, [blocked, onUnlock]);
	const press = (0, import_react.useCallback)((d) => {
		if (blocked || busy) return;
		haptics.selection();
		setDigits((prev) => {
			if (prev.length >= PASSCODE_LENGTH) return prev;
			const next = prev + d;
			if (next.length === PASSCODE_LENGTH) window.setTimeout(() => submit(next), 70);
			return next;
		});
	}, [
		blocked,
		busy,
		submit
	]);
	const del = (0, import_react.useCallback)(() => {
		if (blocked || busy) return;
		setDigits((p) => p.slice(0, -1));
	}, [blocked, busy]);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key >= "0" && e.key <= "9") press(e.key);
			else if (e.key === "Backspace") del();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [press, del]);
	const attemptsLeft = Math.max(0, 10 - attemptsUsed);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 flex items-center justify-center",
		style: {
			background: BG,
			padding: 20
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: {
				width: "100%",
				maxWidth: 340,
				borderRadius: 28,
				padding: "36px 26px 30px",
				background: "rgba(255,255,255,0.32)",
				border: "1px solid rgba(255,255,255,0.5)",
				boxShadow: "0 12px 40px rgba(201,24,74,0.25)",
				textAlign: "center"
			},
			children: blocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: { padding: "20px 4px" },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 46,
							marginBottom: 14
						},
						children: "🔒"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						style: {
							fontFamily: "'Cormorant Garamond', serif",
							fontSize: 24,
							fontWeight: 600,
							color: "#fff",
							margin: 0
						},
						children: "Access Blocked"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						style: {
							fontFamily: "'Cormorant Garamond', serif",
							fontSize: 15,
							color: "rgba(255,255,255,0.85)",
							marginTop: 10,
							lineHeight: 1.4
						},
						children: [
							"Too many incorrect attempts.",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							"This device is permanently blocked."
						]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						fontSize: 40,
						marginBottom: 10
					},
					children: "🔒"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					style: {
						fontFamily: "'Cormorant Garamond', serif",
						fontSize: 22,
						fontWeight: 600,
						letterSpacing: "0.04em",
						color: "#fff",
						margin: "0 0 22px"
					},
					children: "Enter Passcode"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						display: "flex",
						justifyContent: "center",
						gap: 16,
						marginBottom: 26
					},
					children: Array.from({ length: PASSCODE_LENGTH }).map((_, i) => {
						const filled = i < digits.length;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: {
							width: 14,
							height: 14,
							borderRadius: "50%",
							background: wrong ? "#ffe1e1" : filled ? "#fff" : "transparent",
							border: `2px solid ${wrong ? "#ffb3b3" : "rgba(255,255,255,0.85)"}`,
							transition: "background 120ms ease"
						} }, i);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						display: "grid",
						gridTemplateColumns: "repeat(3, 1fr)",
						gap: 14,
						justifyItems: "center"
					},
					children: KEYS.map((k, idx) => {
						if (k === "") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}, idx);
						const isDel = k === "del";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => isDel ? del() : press(k),
							disabled: busy,
							"aria-label": isDel ? "Delete" : `Digit ${k}`,
							style: {
								width: 68,
								height: 68,
								borderRadius: "50%",
								border: "1px solid rgba(255,255,255,0.45)",
								background: isDel ? "transparent" : "rgba(255,255,255,0.18)",
								color: "#fff",
								fontSize: isDel ? 22 : 26,
								fontWeight: 500,
								cursor: "pointer",
								WebkitTapHighlightColor: "transparent",
								display: "flex",
								alignItems: "center",
								justifyContent: "center"
							},
							children: isDel ? "⌫" : k
						}, idx);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					style: {
						fontFamily: "'Cormorant Garamond', serif",
						fontSize: 14,
						color: "#fff0f3",
						minHeight: 20,
						marginTop: 20,
						opacity: attemptsUsed > 0 ? 1 : 0
					},
					children: attemptsUsed > 0 ? `Wrong passcode · ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left` : "·"
				})
			] })
		})
	});
}
var VAPID_PUBLIC_KEY = "BMK8jzpaTCjxeZPL96_rLqQ4P0r31nwA83CEE6BECrVNi3-HY9tIKirc2apm_skfV4Jl6CBNbWXRfs3m20qRQVI";
var SESSION_ID_KEY$1 = "hb_chat_session_id";
function getSessionId() {
	try {
		const existing = localStorage.getItem(SESSION_ID_KEY$1);
		if (existing) return existing;
		const fresh = Math.random().toString(36).slice(2) + Date.now().toString(36);
		localStorage.setItem(SESSION_ID_KEY$1, fresh);
		return fresh;
	} catch {
		return "unknown-session";
	}
}
function other(persona) {
	return persona === "faizan" ? "habiba" : "faizan";
}
function isPushSupported() {
	return typeof navigator !== "undefined" && "serviceWorker" in navigator && typeof window !== "undefined" && "PushManager" in window && "Notification" in window && Boolean(VAPID_PUBLIC_KEY);
}
function isIOS() {
	if (typeof navigator === "undefined") return false;
	return /iPhone|iPad|iPod/i.test(navigator.userAgent) || /Mac/.test(navigator.platform) && "ontouchend" in document;
}
function isStandalone() {
	if (typeof window === "undefined") return false;
	return window.matchMedia?.("(display-mode: standalone)").matches === true || window.navigator.standalone === true;
}
function getNotificationPermission() {
	if (typeof Notification === "undefined") return "unsupported";
	return Notification.permission;
}
function base64UrlToUint8Array(value) {
	const base64 = (value + "=".repeat((4 - value.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/");
	const raw = atob(base64);
	const out = new Uint8Array(new ArrayBuffer(raw.length));
	for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
	return out;
}
async function registerServiceWorker() {
	const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
	await navigator.serviceWorker.ready;
	return reg;
}
function bufferToBase64Url(buf) {
	const bytes = new Uint8Array(buf);
	let raw = "";
	for (let i = 0; i < bytes.length; i++) raw += String.fromCharCode(bytes[i]);
	return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function subscriptionUsesCurrentKey(sub) {
	try {
		const key = sub.options?.applicationServerKey;
		if (!key) return true;
		const current = VAPID_PUBLIC_KEY.replace(/=+$/, "");
		return bufferToBase64Url(key) === current;
	} catch {
		return true;
	}
}
async function hasActiveSubscription() {
	try {
		if (!isPushSupported()) return false;
		if (Notification.permission !== "granted") return false;
		const reg = await navigator.serviceWorker.getRegistration("/");
		if (!reg) return false;
		const sub = await reg.pushManager.getSubscription();
		return Boolean(sub) && subscriptionUsesCurrentKey(sub);
	} catch {
		return false;
	}
}
async function enablePush(persona) {
	if (!isSupabaseConfigured) throw new Error("Chat backend not configured.");
	if (!isPushSupported()) throw new Error("This browser can’t receive push notifications.");
	if (isIOS() && !isStandalone()) throw new Error("On iPhone: tap the Share icon → Add to Home Screen, open that icon, then tap 🔔 again.");
	const permission = await Notification.requestPermission();
	if (permission !== "granted") throw new Error(permission === "denied" ? "Notifications are blocked. Enable them in your device settings." : "Notification permission was not granted.");
	const reg = await registerServiceWorker();
	let existing = await reg.pushManager.getSubscription();
	if (existing && !subscriptionUsesCurrentKey(existing)) {
		const staleEndpoint = existing.endpoint;
		await existing.unsubscribe().catch(() => {});
		await supabase.rpc("delete_push_subscription", { p_endpoint: staleEndpoint }).then(() => {}, () => {});
		existing = null;
	}
	const json = (existing ?? await reg.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: base64UrlToUint8Array(VAPID_PUBLIC_KEY)
	})).toJSON();
	if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("Incomplete push subscription from the browser.");
	const { error } = await supabase.rpc("save_push_subscription", {
		p_persona: persona,
		p_session_id: getSessionId(),
		p_endpoint: json.endpoint,
		p_p256dh: json.keys.p256dh,
		p_auth: json.keys.auth,
		p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null
	});
	if (error) throw new Error(error.message || "Failed to save subscription.");
}
async function syncPersona(persona) {
	try {
		if (!await hasActiveSubscription()) return;
		const json = (await (await navigator.serviceWorker.getRegistration("/"))?.pushManager.getSubscription())?.toJSON();
		if (!json?.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
		await supabase.rpc("save_push_subscription", {
			p_persona: persona,
			p_session_id: getSessionId(),
			p_endpoint: json.endpoint,
			p_p256dh: json.keys.p256dh,
			p_auth: json.keys.auth,
			p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null
		});
	} catch {}
}
async function disablePush() {
	try {
		const sub = await (await navigator.serviceWorker.getRegistration("/"))?.pushManager.getSubscription();
		if (sub) {
			const endpoint = sub.endpoint;
			await sub.unsubscribe().catch(() => {});
			if (isSupabaseConfigured) await supabase.rpc("delete_push_subscription", { p_endpoint: endpoint }).then(() => {}, () => {});
		}
	} catch {}
}
var PUSH_FN_URL = `${SUPABASE_URL}/functions/v1/send-push-notification`;
function warmPushIsolate() {
	try {
		fetch(PUSH_FN_URL, {
			method: "GET",
			cache: "no-store",
			keepalive: true
		}).catch(() => {});
	} catch {}
}
function postPush(body) {
	try {
		if (!isSupabaseConfigured || false) return;
		fetch(PUSH_FN_URL, {
			method: "POST",
			cache: "no-store",
			keepalive: true,
			headers: { "Content-Type": "text/plain;charset=UTF-8" },
			body: JSON.stringify(body)
		}).catch((err) => {
			console.warn("[push] delivery failed (non-fatal)", err);
		});
	} catch (err) {
		console.warn("[push] delivery failed (non-fatal)", err);
	}
}
function notifyNewMessage(message) {
	if (!message.id) return;
	postPush({
		message_id: message.id,
		sender: message.sender,
		recipient: other(message.sender),
		text: message.text ?? null,
		type: message.type ?? "text",
		url: "/",
		exclude_session_id: getSessionId()
	});
}
function notifyMissedWakeUp(requestId) {
	postPush({
		message_id: `wakeup-missed-${requestId ?? Date.now()}`,
		sender: "habiba",
		recipient: "faizan",
		text: "📞 Missed wake-up ring! I tried to wake you up… 💗",
		type: "text",
		url: "/",
		exclude_session_id: getSessionId()
	});
}
/**
* If notification permission is already granted, make sure this device is
* subscribed with the CURRENT VAPID key. A project move rotates the key and
* the old subscription would 403 forever — this heals it on the next open,
* without asking again.
*/
async function ensurePushSubscription(persona) {
	try {
		if (!isSupabaseConfigured || !isPushSupported()) return;
		if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
		if (isIOS() && !isStandalone()) return;
		await registerServiceWorker();
		if (await hasActiveSubscription()) {
			await syncPersona(persona);
			return;
		}
		await enablePush(persona);
	} catch (err) {
		console.warn("[push] ensure subscription failed", err);
	}
}
/** Every type that carries a media_url (used by the persistent media gallery). */
var MEDIA_TYPES = [
	"image",
	"video",
	"gif",
	"sticker",
	"file",
	"voice"
];
var ALBUM_MIME = "application/x-hb-album";
function decodeAlbum(fileName, mime) {
	if (mime !== "application/x-hb-album" || typeof fileName !== "string") return null;
	try {
		const parsed = JSON.parse(fileName);
		if (!Array.isArray(parsed)) return null;
		const items = parsed.filter((it) => !!it && typeof it === "object").map((it) => ({
			url: String(it.url ?? ""),
			w: typeof it.w === "number" ? it.w : null,
			h: typeof it.h === "number" ? it.h : null,
			kind: it.t === "v" ? "video" : "image",
			d: typeof it.d === "number" ? it.d : null
		})).filter((it) => it.url.length > 0);
		return items.length > 0 ? items : null;
	} catch {
		return null;
	}
}
var SELECT_COLS = "id, type, text, sender, timestamp, session_id, edited, media_url, media_width, media_height, duration_ms, reply_to_id, reply_snapshot, reactions, file_name, file_size, mime_type";
var KNOWN_TYPES = /* @__PURE__ */ new Set([
	"text",
	"image",
	"voice",
	"video",
	"sticker",
	"gif",
	"file"
]);
function mapRow(row) {
	const rawType = row.type || "text";
	const type = KNOWN_TYPES.has(rawType) ? rawType : "text";
	const album = type === "image" ? decodeAlbum(row.file_name, row.mime_type) : null;
	return {
		id: String(row.id),
		type,
		text: row.text ?? null,
		sender: row.sender === "faizan" ? "faizan" : "habiba",
		timestamp: typeof row.timestamp === "number" ? row.timestamp : Number(row.timestamp ?? 0),
		sessionId: row.session_id ?? null,
		edited: Boolean(row.edited),
		mediaUrl: row.media_url ?? null,
		mediaWidth: row.media_width ?? null,
		mediaHeight: row.media_height ?? null,
		durationMs: row.duration_ms ?? null,
		replyToId: row.reply_to_id ?? null,
		replySnapshot: row.reply_snapshot ?? null,
		reactions: row.reactions ?? null,
		fileName: album ? null : row.file_name ?? null,
		fileSize: album || row.file_size == null ? null : Number(row.file_size),
		mimeType: album ? null : row.mime_type ?? null,
		albumItems: album
	};
}
/** Fetch the most recent page of chat history, sorted oldest → newest. */
async function listMessages(limit = 300) {
	if (!isSupabaseConfigured) return null;
	try {
		const { data, error } = await supabase.from("chat_messages").select(SELECT_COLS).order("timestamp", { ascending: false }).limit(limit);
		if (error) {
			console.error("[chat] listMessages error", error);
			return null;
		}
		return (data ?? []).map((r) => mapRow(r)).reverse();
	} catch (err) {
		console.error("[chat] listMessages threw", err);
		return null;
	}
}
/**
* Keyset-paginate OLDER messages (those strictly before `beforeTimestamp`),
* newest of that batch first from the DB then reversed to chronological order.
* `hasMore` is true when a full page came back (there may be still-older msgs).
* Robust against concurrent inserts at the top (they never affect this query).
*/
async function fetchOlderMessages(beforeTimestamp, limit = 300) {
	if (!isSupabaseConfigured) return null;
	try {
		const { data, error } = await supabase.from("chat_messages").select(SELECT_COLS).lt("timestamp", beforeTimestamp).order("timestamp", { ascending: false }).limit(limit);
		if (error) {
			console.error("[chat] fetchOlderMessages error", error);
			return null;
		}
		const rows = (data ?? []).map((r) => mapRow(r));
		return {
			messages: rows.reverse(),
			hasMore: rows.length === limit
		};
	} catch (err) {
		console.error("[chat] fetchOlderMessages threw", err);
		return null;
	}
}
/** Messages strictly after `afterTimestamp`, oldest → newest. */
async function fetchNewerMessages(afterTimestamp, limit = 300) {
	if (!isSupabaseConfigured) return null;
	try {
		const { data, error } = await supabase.from("chat_messages").select(SELECT_COLS).gt("timestamp", afterTimestamp).order("timestamp", { ascending: true }).limit(limit);
		if (error) return null;
		const rows = (data ?? []).map((r) => mapRow(r));
		return {
			messages: rows,
			hasMore: rows.length === limit
		};
	} catch {
		return null;
	}
}
/** A window of history centred on `timestamp` (used to jump to old search hits). */
async function fetchMessagesAround(timestamp, each = 120) {
	if (!isSupabaseConfigured) return null;
	const [older, newer] = await Promise.all([fetchOlderMessages(timestamp + 1, each), fetchNewerMessages(timestamp, each)]);
	if (!older || !newer) return null;
	return {
		messages: [...older.messages, ...newer.messages],
		hasOlder: older.hasMore,
		hasNewer: newer.hasMore
	};
}
/** Timestamp of one message (for jumping to a reply's original). */
async function fetchMessageTimestamp(id) {
	if (!isSupabaseConfigured) return null;
	try {
		const { data, error } = await supabase.from("chat_messages").select("timestamp").eq("id", id).maybeSingle();
		if (error || !data) return null;
		return Number(data.timestamp);
	} catch {
		return null;
	}
}
async function listMedia(filter, beforeTimestamp = null, limit = 60) {
	if (!isSupabaseConfigured) return null;
	try {
		const types = filter === "all" ? MEDIA_TYPES : [filter];
		let q = supabase.from("chat_messages").select(SELECT_COLS).in("type", types).not("media_url", "is", null).order("timestamp", { ascending: false }).limit(limit);
		if (beforeTimestamp != null) q = q.lt("timestamp", beforeTimestamp);
		const { data, error } = await q;
		if (error) {
			console.error("[chat] listMedia error", error);
			return null;
		}
		const items = (data ?? []).map((r) => mapRow(r));
		return {
			items,
			hasMore: items.length === limit
		};
	} catch (err) {
		console.error("[chat] listMedia threw", err);
		return null;
	}
}
/** Exact per-type counts for the gallery header (single round-trip each, HEAD only). */
async function countMedia() {
	if (!isSupabaseConfigured) return null;
	try {
		const kinds = [
			"image",
			"video",
			"gif",
			"sticker",
			"file",
			"voice"
		];
		const results = await Promise.all(kinds.map((k) => supabase.from("chat_messages").select("id", {
			count: "exact",
			head: true
		}).eq("type", k).not("media_url", "is", null)));
		const out = {
			all: 0,
			image: 0,
			video: 0,
			gif: 0,
			sticker: 0,
			file: 0,
			voice: 0
		};
		kinds.forEach((k, i) => {
			const c = results[i].count ?? 0;
			out[k] = c;
			out.all += c;
		});
		return out;
	} catch (err) {
		console.error("[chat] countMedia threw", err);
		return null;
	}
}
var _prefetch = null;
function prefetchMessages() {
	if (!_prefetch) _prefetch = listMessages();
	return _prefetch;
}
/** Consume the prefetched promise exactly once (null if none in flight). */
function takePrefetchedMessages() {
	const p = _prefetch;
	_prefetch = null;
	return p;
}
var MEDIA_SEARCH_KEYWORDS = [
	{
		types: ["image"],
		words: [
			"image",
			"images",
			"photo",
			"photos",
			"pic",
			"pics",
			"picture",
			"pictures",
			"img",
			"snap",
			"selfie"
		]
	},
	{
		types: ["video"],
		words: [
			"video",
			"videos",
			"clip",
			"clips",
			"movie",
			"reel",
			"reels",
			"vid"
		]
	},
	{
		types: ["voice"],
		words: [
			"voice",
			"audio",
			"voicenote",
			"voicenotes",
			"recording",
			"recordings",
			"vn"
		]
	},
	{
		types: ["gif", "sticker"],
		words: [
			"gif",
			"gifs",
			"sticker",
			"stickers"
		]
	},
	{
		types: ["file"],
		words: [
			"file",
			"files",
			"document",
			"documents",
			"doc",
			"pdf",
			"zip"
		]
	},
	{
		types: [
			"image",
			"video",
			"voice",
			"gif",
			"sticker",
			"file"
		],
		words: [
			"media",
			"attachment",
			"attachments"
		]
	}
];
function mediaTypesForQuery(lowerQuery) {
	const found = /* @__PURE__ */ new Set();
	for (const group of MEDIA_SEARCH_KEYWORDS) if (group.words.some((w) => lowerQuery === w || lowerQuery.includes(w))) group.types.forEach((t) => found.add(t));
	return Array.from(found);
}
async function searchMessages(rawQuery, limit = 300) {
	if (!isSupabaseConfigured) return [];
	const q = rawQuery.trim();
	if (!q) return [];
	const lower = q.toLowerCase();
	const results = /* @__PURE__ */ new Map();
	try {
		const pattern = `%${q}%`;
		const { data: textRows, error: textErr } = await supabase.from("chat_messages").select(SELECT_COLS).ilike("text", pattern).order("timestamp", { ascending: false }).limit(limit);
		if (textErr) console.warn("[chat] searchMessages text error", textErr);
		(textRows ?? []).forEach((r) => {
			const m = mapRow(r);
			results.set(m.id, m);
		});
		const mediaTypes = mediaTypesForQuery(lower);
		if (mediaTypes.length > 0) {
			const { data: mediaRows, error: mediaErr } = await supabase.from("chat_messages").select(SELECT_COLS).in("type", mediaTypes).order("timestamp", { ascending: false }).limit(limit);
			if (mediaErr) console.warn("[chat] searchMessages media error", mediaErr);
			(mediaRows ?? []).forEach((r) => {
				const m = mapRow(r);
				results.set(m.id, m);
			});
		}
	} catch (err) {
		console.error("[chat] searchMessages threw", err);
		return [];
	}
	return Array.from(results.values()).sort((a, b) => b.timestamp - a.timestamp);
}
function kickPush(id, sender, text, type) {
	notifyNewMessage({
		id,
		sender,
		text: text ?? null,
		type
	});
}
async function createMessage(text, sender, sessionId, reply) {
	if (!isSupabaseConfigured) return null;
	const trimmed = text.trim().slice(0, 4e3);
	if (!trimmed) return null;
	const id = crypto.randomUUID();
	kickPush(id, sender, trimmed, "text");
	try {
		const payload = {
			id,
			type: "text",
			text: trimmed,
			sender,
			timestamp: Date.now(),
			session_id: sessionId,
			edited: false
		};
		if (reply) {
			payload.reply_to_id = reply.id;
			payload.reply_snapshot = reply.snapshot;
		}
		const { data, error } = await supabase.from("chat_messages").insert(payload).select(SELECT_COLS).single();
		if (error || !data) {
			console.error("[chat] createMessage error", error);
			return null;
		}
		return mapRow(data);
	} catch (err) {
		console.error("[chat] createMessage threw", err);
		return null;
	}
}
async function createMediaMessage(type, mediaUrl, sender, sessionId, extra = {}) {
	if (!isSupabaseConfigured) return null;
	const id = crypto.randomUUID();
	kickPush(id, sender, extra.caption ?? null, type);
	try {
		const payload = {
			id,
			type,
			text: extra.caption ? extra.caption.slice(0, 4e3) : null,
			sender,
			timestamp: Date.now(),
			session_id: sessionId,
			edited: false,
			media_url: mediaUrl,
			media_width: extra.width ?? null,
			media_height: extra.height ?? null,
			duration_ms: extra.durationMs ?? null
		};
		if (extra.reply) {
			payload.reply_to_id = extra.reply.id;
			payload.reply_snapshot = extra.reply.snapshot;
		}
		const { data, error } = await supabase.from("chat_messages").insert(payload).select(SELECT_COLS).single();
		if (error || !data) {
			console.error("[chat] createMediaMessage error", error);
			return null;
		}
		return mapRow(data);
	} catch (err) {
		console.error("[chat] createMediaMessage threw", err);
		return null;
	}
}
async function createAlbumMessage(items, sender, sessionId, reply) {
	if (!isSupabaseConfigured) return null;
	const clean = items.filter((it) => it && it.url);
	if (clean.length === 0) return null;
	const id = crypto.randomUUID();
	kickPush(id, sender, null, "image");
	try {
		const first = clean[0];
		const payload = {
			id,
			type: "image",
			text: null,
			sender,
			timestamp: Date.now(),
			session_id: sessionId,
			edited: false,
			media_url: first.url,
			media_width: first.w ?? null,
			media_height: first.h ?? null,
			file_name: JSON.stringify(clean.map((it) => ({
				url: it.url,
				w: it.w ?? null,
				h: it.h ?? null,
				...it.kind === "video" ? {
					t: "v",
					d: it.d ?? null
				} : null
			}))),
			file_size: clean.length,
			mime_type: ALBUM_MIME
		};
		if (reply) {
			payload.reply_to_id = reply.id;
			payload.reply_snapshot = reply.snapshot;
		}
		const { data, error } = await supabase.from("chat_messages").insert(payload).select(SELECT_COLS).single();
		if (error || !data) {
			console.error("[chat] createAlbumMessage error", error);
			return null;
		}
		return mapRow(data);
	} catch (err) {
		console.error("[chat] createAlbumMessage threw", err);
		return null;
	}
}
async function createStickerMessage(mediaUrl, sender, sessionId, extra = {}) {
	if (!isSupabaseConfigured) return null;
	const id = crypto.randomUUID();
	kickPush(id, sender, null, extra.kind ?? "sticker");
	try {
		const payload = {
			id,
			type: extra.kind ?? "sticker",
			text: null,
			sender,
			timestamp: Date.now(),
			session_id: sessionId,
			edited: false,
			media_url: mediaUrl,
			media_width: extra.width ?? null,
			media_height: extra.height ?? null
		};
		if (extra.reply) {
			payload.reply_to_id = extra.reply.id;
			payload.reply_snapshot = extra.reply.snapshot;
		}
		const { data, error } = await supabase.from("chat_messages").insert(payload).select(SELECT_COLS).single();
		if (error || !data) {
			console.error("[chat] createStickerMessage error", error);
			return null;
		}
		return mapRow(data);
	} catch (err) {
		console.error("[chat] createStickerMessage threw", err);
		return null;
	}
}
async function createFileMessage(mediaUrl, sender, sessionId, file, reply) {
	if (!isSupabaseConfigured) return null;
	const id = crypto.randomUUID();
	kickPush(id, sender, file.name, "file");
	try {
		const payload = {
			id,
			type: "file",
			text: null,
			sender,
			timestamp: Date.now(),
			session_id: sessionId,
			edited: false,
			media_url: mediaUrl,
			file_name: file.name.slice(0, 255),
			file_size: file.size,
			mime_type: file.mime.slice(0, 120) || "application/octet-stream"
		};
		if (reply) {
			payload.reply_to_id = reply.id;
			payload.reply_snapshot = reply.snapshot;
		}
		const { data, error } = await supabase.from("chat_messages").insert(payload).select(SELECT_COLS).single();
		if (error || !data) {
			console.error("[chat] createFileMessage error", error);
			return null;
		}
		return mapRow(data);
	} catch (err) {
		console.error("[chat] createFileMessage threw", err);
		return null;
	}
}
async function editMessage(id, text, _sessionId) {
	if (!isSupabaseConfigured) return null;
	const trimmed = text.trim().slice(0, 4e3);
	if (!trimmed) return null;
	try {
		const { data, error } = await supabase.from("chat_messages").update({
			text: trimmed,
			edited: true
		}).eq("id", id).select(SELECT_COLS).single();
		if (error || !data) {
			console.warn("[chat] editMessage rejected", error);
			return null;
		}
		return mapRow(data);
	} catch (err) {
		console.error("[chat] editMessage threw", err);
		return null;
	}
}
/**
* Add or remove ONE person's reaction emoji. `mine` lists every key that
* belongs to this person (their name plus legacy device ids) so old
* reactions can be removed too. Other emoji from the same person are kept,
* which allows several different reactions per person.
*/
async function setMyReaction(id, emoji, mine, me, add) {
	if (!isSupabaseConfigured) return null;
	try {
		const { data: existing, error: readErr } = await supabase.from("chat_messages").select("reactions").eq("id", id).single();
		if (readErr || !existing) return null;
		const current = existing.reactions ?? {};
		const users = new Set(current[emoji] ?? []);
		mine.forEach((k) => users.delete(k));
		if (add) users.add(me);
		const next = { ...current };
		if (users.size === 0) delete next[emoji];
		else next[emoji] = Array.from(users);
		const { error: writeErr } = await supabase.from("chat_messages").update({ reactions: next }).eq("id", id);
		return writeErr ? null : next;
	} catch {
		return null;
	}
}
/**
* Hard-delete a message. Either partner on either device can unsend any
* message — this app is a shared journal for two, not a permission model.
* Storage media (if any) is also removed best-effort.
*/
async function deleteMessage(id, _sessionId, mediaUrl, extraMediaUrls) {
	if (!isSupabaseConfigured) return false;
	try {
		const { error } = await supabase.from("chat_messages").delete().eq("id", id);
		if (error) {
			console.warn("[chat] deleteMessage rejected", error);
			return false;
		}
		const urls = /* @__PURE__ */ new Set();
		if (mediaUrl) urls.add(mediaUrl);
		(extraMediaUrls ?? []).forEach((u) => {
			if (u) urls.add(u);
		});
		urls.forEach((u) => {
			deleteMediaByUrl(u);
		});
		return true;
	} catch (err) {
		console.error("[chat] deleteMessage threw", err);
		return false;
	}
}
var BUCKET$1 = "chat-media";
function extFromMime(mime, fallback) {
	if (mime.includes("png")) return "png";
	if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
	if (mime.includes("gif")) return "gif";
	if (mime.includes("webp")) return "webp";
	if (mime.includes("heic")) return "heic";
	if (mime.includes("video/webm")) return "webm";
	if (mime.includes("video/mp4")) return "mp4";
	if (mime.includes("video/quicktime")) return "mov";
	if (mime.includes("video/x-matroska")) return "mkv";
	if (mime.includes("video")) return "mp4";
	if (mime.includes("webm")) return "webm";
	if (mime.includes("mp4")) return "m4a";
	if (mime.includes("ogg")) return "ogg";
	if (mime.includes("wav")) return "wav";
	return fallback;
}
async function uploadChatMedia(file, kind, sender, originalName) {
	if (!isSupabaseConfigured) return null;
	try {
		if (kind === "file") return uploadChatFile(file, sender, originalName);
		const defaultMime = kind === "image" ? "image/jpeg" : kind === "video" ? "video/mp4" : "audio/webm";
		const mime = (file.type || defaultMime).split(";")[0].trim() || defaultMime;
		const ext = extFromMime(mime, kind === "image" ? "jpg" : kind === "video" ? "mp4" : "webm");
		const rand = Math.random().toString(36).slice(2, 10);
		const path = `${kind}/${sender}/${Date.now()}-${rand}.${ext}`;
		const { error } = await supabase.storage.from(BUCKET$1).upload(path, file, {
			contentType: mime,
			upsert: false,
			cacheControl: "31536000"
		});
		if (error) {
			console.error("[chat] uploadChatMedia error", error);
			return null;
		}
		const { data } = supabase.storage.from(BUCKET$1).getPublicUrl(path);
		return data?.publicUrl ?? null;
	} catch (err) {
		console.error("[chat] uploadChatMedia threw", err);
		return null;
	}
}
/** Sanitise a user filename for a storage object key (keeps the extension). */
function safeFileName(name) {
	return ((name || "file").split(/[\\/]/).pop() || "file").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 120) || "file";
}
async function uploadChatFile(file, sender, originalName) {
	try {
		const name = safeFileName(originalName || file.name || "file");
		const mime = (file.type || "application/octet-stream").split(";")[0].trim();
		const rand = Math.random().toString(36).slice(2, 8);
		const path = `file/${sender}/${Date.now()}-${rand}-${name}`;
		const { error } = await supabase.storage.from(BUCKET$1).upload(path, file, {
			contentType: mime,
			upsert: false,
			cacheControl: "31536000"
		});
		if (error) {
			console.error("[chat] uploadChatFile error", error);
			return null;
		}
		const { data } = supabase.storage.from(BUCKET$1).getPublicUrl(path);
		return data?.publicUrl ?? null;
	} catch (err) {
		console.error("[chat] uploadChatFile threw", err);
		return null;
	}
}
/** Max object size accepted by the bucket (Supabase free tier hard limit). */
var MAX_UPLOAD_BYTES = 52428800;
/** Best-effort deletion of a media object given its public URL. */
async function deleteMediaByUrl(publicUrl) {
	try {
		const marker = `/object/public/${BUCKET$1}/`;
		const idx = publicUrl.indexOf(marker);
		if (idx < 0) return;
		const path = publicUrl.slice(idx + marker.length);
		if (!path) return;
		await supabase.storage.from(BUCKET$1).remove([path]);
	} catch {}
}
function subscribeToChat(handler) {
	if (!isSupabaseConfigured) return () => {};
	const channel = supabase.channel("chat_messages_stream").on("postgres_changes", {
		event: "INSERT",
		schema: "public",
		table: "chat_messages"
	}, (payload) => {
		handler({
			type: "INSERT",
			message: mapRow(payload.new)
		});
	}).on("postgres_changes", {
		event: "UPDATE",
		schema: "public",
		table: "chat_messages"
	}, (payload) => {
		handler({
			type: "UPDATE",
			message: mapRow(payload.new)
		});
	}).on("postgres_changes", {
		event: "DELETE",
		schema: "public",
		table: "chat_messages"
	}, (payload) => {
		handler({
			type: "DELETE",
			message: mapRow(payload.old)
		});
	}).subscribe();
	return () => {
		try {
			supabase.removeChannel(channel);
		} catch {}
	};
}
var TYPING_CHANNEL_NAME = "chat_typing";
var typingListeners = /* @__PURE__ */ new Set();
var sharedTypingChannel = null;
function ensureSharedTypingChannel() {
	if (!isSupabaseConfigured) return null;
	if (sharedTypingChannel) return sharedTypingChannel;
	const ch = supabase.channel(TYPING_CHANNEL_NAME, { config: { broadcast: {
		self: true,
		ack: false
	} } });
	ch.on("broadcast", { event: "typing" }, ({ payload }) => {
		const ev = payload;
		typingListeners.forEach((fn) => {
			try {
				fn(ev);
			} catch {}
		});
	});
	ch.subscribe();
	sharedTypingChannel = ch;
	return ch;
}
function broadcastTyping(sender, sessionId, isTyping) {
	const ch = ensureSharedTypingChannel();
	if (!ch) return;
	try {
		ch.send({
			type: "broadcast",
			event: "typing",
			payload: {
				sender,
				sessionId,
				isTyping,
				ts: Date.now()
			}
		});
	} catch {}
}
function subscribeToTyping(handler) {
	if (!isSupabaseConfigured) return () => {};
	ensureSharedTypingChannel();
	typingListeners.add(handler);
	return () => {
		typingListeners.delete(handler);
	};
}
var HEARTBEAT_MS = 4e3;
var ANON_KEY = SUPABASE_ANON_KEY;
var lastSent = null;
function isActivelyUsingApp() {
	return document.visibilityState === "visible" && document.hasFocus();
}
/** Tell the service worker directly. iOS often reports a backgrounded
*  (even audio-playing) window as "visible", which used to swallow banners. */
function postAppFocus(focused) {
	try {
		const msg = {
			type: "app-focus",
			focused
		};
		navigator.serviceWorker?.controller?.postMessage(msg);
		navigator.serviceWorker?.getRegistration("/")?.then((reg) => {
			reg?.active?.postMessage(msg);
			reg?.waiting?.postMessage(msg);
		});
	} catch {}
}
async function sendPresence(persona, foreground) {
	if (!isSupabaseConfigured) return;
	if (lastSent && lastSent.fg === foreground && !foreground && Date.now() - lastSent.at < 1500) return;
	lastSent = {
		fg: foreground,
		at: Date.now()
	};
	try {
		await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_push_presence`, {
			method: "POST",
			keepalive: true,
			headers: {
				apikey: ANON_KEY,
				Authorization: `Bearer ${ANON_KEY}`,
				"Content-Type": "application/json",
				Prefer: "return=minimal"
			},
			body: JSON.stringify({
				p_session_id: getSessionId(),
				p_persona: persona,
				p_foreground: foreground
			})
		});
	} catch {}
}
/**
* Start reporting presence for the open chat. Returns a stop() that marks the
* device as background again. `getPersona` is read at send time so identity
* switches are picked up without restarting.
*/
function startChatPresence(getPersona) {
	if (typeof document === "undefined" || !isSupabaseConfigured) return () => {};
	let timer = null;
	const stopHeartbeat = () => {
		if (timer !== null) {
			window.clearInterval(timer);
			timer = null;
		}
	};
	const goForeground = () => {
		if (!isActivelyUsingApp()) {
			goBackground();
			return;
		}
		postAppFocus(true);
		sendPresence(getPersona(), true);
		stopHeartbeat();
		timer = window.setInterval(() => {
			if (isActivelyUsingApp()) {
				postAppFocus(true);
				sendPresence(getPersona(), true);
			} else goBackground();
		}, HEARTBEAT_MS);
	};
	const goBackground = () => {
		stopHeartbeat();
		postAppFocus(false);
		sendPresence(getPersona(), false);
	};
	const onVisibility = () => {
		if (isActivelyUsingApp()) goForeground();
		else goBackground();
	};
	const onPageHide = () => goBackground();
	const onPageShow = () => {
		if (isActivelyUsingApp()) goForeground();
		else goBackground();
	};
	const onFocus = () => {
		if (isActivelyUsingApp()) goForeground();
	};
	const onBlur = () => goBackground();
	const onOnline = () => {
		if (isActivelyUsingApp()) goForeground();
	};
	document.addEventListener("visibilitychange", onVisibility);
	window.addEventListener("pagehide", onPageHide);
	window.addEventListener("pageshow", onPageShow);
	window.addEventListener("focus", onFocus);
	window.addEventListener("blur", onBlur);
	window.addEventListener("online", onOnline);
	document.addEventListener("freeze", onPageHide);
	document.addEventListener("resume", onPageShow);
	if (isActivelyUsingApp()) goForeground();
	else goBackground();
	return () => {
		document.removeEventListener("visibilitychange", onVisibility);
		window.removeEventListener("pagehide", onPageHide);
		window.removeEventListener("pageshow", onPageShow);
		window.removeEventListener("focus", onFocus);
		window.removeEventListener("blur", onBlur);
		window.removeEventListener("online", onOnline);
		document.removeEventListener("freeze", onPageHide);
		document.removeEventListener("resume", onPageShow);
		goBackground();
	};
}
/** Re-announce presence right away (e.g. after the persona is switched). */
function refreshChatPresence(persona) {
	if (typeof document === "undefined") return;
	sendPresence(persona, document.visibilityState === "visible" && document.hasFocus());
}
var SESSION_ID_KEY = "hb_chat_session_id";
var SENDER_KEY = "hb_chat_sender";
var LAST_READ_KEY = "hb_chat_last_read";
function readSessionId() {
	try {
		const existing = localStorage.getItem(SESSION_ID_KEY);
		if (existing) return existing;
		const fresh = Math.random().toString(36).slice(2) + Date.now().toString(36);
		localStorage.setItem(SESSION_ID_KEY, fresh);
		return fresh;
	} catch {
		return Math.random().toString(36).slice(2);
	}
}
var SESSION_ID = readSessionId();
function readSender() {
	try {
		return localStorage.getItem("hb_chat_sender") === "faizan" ? "faizan" : "habiba";
	} catch {
		return "habiba";
	}
}
var otherOf = (s) => s === "faizan" ? "habiba" : "faizan";
var fullName = (s) => getNames()[s];
var firstName = (s) => fullName(s).split(" ")[0];
var username = (s) => fullName(s).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
var initial = (s) => fullName(s).charAt(0).toUpperCase();
function fmtClock(ts) {
	return new Date(ts).toLocaleTimeString([], {
		hour: "numeric",
		minute: "2-digit",
		hour12: true
	});
}
/** Instagram-style centred time stamp between message groups. */
function fmtSeparator(ts) {
	const d = new Date(ts);
	const now = /* @__PURE__ */ new Date();
	const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	const day = 864e5;
	if (ts >= startOfToday) return fmtClock(ts);
	if (ts >= startOfToday - day) return `Yesterday ${fmtClock(ts)}`;
	if (ts >= startOfToday - 6 * day) return `${d.toLocaleDateString([], { weekday: "short" })} ${fmtClock(ts)}`;
	return `${d.toLocaleDateString([], {
		month: "short",
		day: "numeric",
		year: d.getFullYear() !== now.getFullYear() ? "numeric" : void 0
	})}, ${fmtClock(ts)}`;
}
function fmtDuration(ms) {
	const s = Math.max(0, Math.round(ms / 1e3));
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
/** Slower Android phones get lighter effects (no live blur, softer motion). */
function detectLowFx() {
	try {
		if (localStorage.getItem("hb_chat_reduce_fx") === "1") return true;
		if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
		const ua = navigator.userAgent;
		if (/iPhone|iPad|iPod|Macintosh/.test(ua)) return false;
		const cores = navigator.hardwareConcurrency ?? 8;
		const mem = navigator.deviceMemory ?? 8;
		return /Android/.test(ua) && (cores <= 4 || mem <= 3);
	} catch {
		return false;
	}
}
var pending = /* @__PURE__ */ new Set();
var done = /* @__PURE__ */ new Set();
var openedAt = Number.POSITIVE_INFINITY;
function startAnimClock() {
	openedAt = Date.now();
}
/** `fresh` = the optimistic copy that should animate; otherwise mark as played. */
function markAnimated(id, fresh = false) {
	if (fresh) pending.add(id);
	else done.add(id);
}
function shouldAnimate(id, ts) {
	if (done.has(id)) return false;
	if (pending.has(id) || ts > openedAt) {
		done.add(id);
		return true;
	}
	return false;
}
var MAX_FILE = 52428800;
var legacy = () => import("./media-compress-BwdK0lrQ.mjs");
function makeReplySnapshot(msg) {
	return {
		id: msg.id,
		sender: msg.sender,
		type: msg.type,
		text: msg.type === "text" ? (msg.text ?? "").slice(0, 400) : null,
		mediaUrl: msg.mediaUrl ?? null,
		durationMs: msg.durationMs ?? null,
		...msg.albumItems && msg.albumItems.length > 1 ? { albumCount: msg.albumItems.length } : null
	};
}
var sameOptimistic = (a, b) => a.sender === b.sender && a.type === b.type && (a.text ?? "") === (b.text ?? "") && (a.mediaUrl ?? "") === (b.mediaUrl ?? "") && Math.abs(a.timestamp - b.timestamp) < 2e4;
function reconcile(prev, fresh) {
	if (!fresh.length) return prev;
	const oldestFreshTs = fresh[0].timestamp;
	const older = prev.filter((m) => m.timestamp < oldestFreshTs && !m.id.startsWith("opt-"));
	const pendingOpt = prev.filter((m) => m.id.startsWith("opt-") && !fresh.some((f) => sameOptimistic(f, m)));
	const merged = [
		...older,
		...fresh,
		...pendingOpt
	];
	merged.sort((a, b) => a.timestamp - b.timestamp);
	return merged;
}
function useChatEngine(senderRef, onLocalAdd) {
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [hasMoreOlder, setHasMoreOlder] = (0, import_react.useState)(false);
	const [loadingOlder, setLoadingOlder] = (0, import_react.useState)(false);
	const [detached, setDetached] = (0, import_react.useState)(false);
	const detachedRef = (0, import_react.useRef)(false);
	detachedRef.current = detached;
	const newerLock = (0, import_react.useRef)(false);
	const [uploading, setUploading] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [progress, setProgress] = (0, import_react.useState)({});
	const [compressing, setCompressing] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [otherTyping, setOtherTyping] = (0, import_react.useState)(null);
	const messagesRef = (0, import_react.useRef)([]);
	messagesRef.current = messages;
	const hasMoreRef = (0, import_react.useRef)(false);
	hasMoreRef.current = hasMoreOlder;
	const olderLock = (0, import_react.useRef)(false);
	const onLocalAddRef = (0, import_react.useRef)(onLocalAdd);
	onLocalAddRef.current = onLocalAdd;
	(0, import_react.useEffect)(() => {
		if (!error) return;
		const t = setTimeout(() => setError(null), 5e3);
		return () => clearTimeout(t);
	}, [error]);
	(0, import_react.useEffect)(() => {
		let alive = true;
		let typingTimer = null;
		(async () => {
			const fresh = await (takePrefetchedMessages() ?? listMessages());
			if (!alive) return;
			if (fresh) {
				setMessages(fresh);
				setHasMoreOlder(fresh.length >= 300);
			}
			setLoading(false);
		})();
		const unsubChat = subscribeToChat(({ type, message }) => {
			if (!alive) return;
			setMessages((prev) => {
				if (type === "DELETE") return prev.filter((m) => m.id !== message.id);
				const idx = prev.findIndex((m) => m.id === message.id);
				if (idx >= 0) {
					const next = prev.slice();
					next[idx] = message;
					return next;
				}
				const optIdx = prev.findIndex((m) => m.id.startsWith("opt-") && sameOptimistic(m, message));
				if (optIdx >= 0) {
					markAnimated(message.id);
					const next = prev.slice();
					next[optIdx] = message;
					return next;
				}
				if (detachedRef.current) return prev;
				const next = [...prev, message];
				next.sort((a, b) => a.timestamp - b.timestamp);
				return next;
			});
		});
		const unsubTyping = subscribeToTyping((ev) => {
			if (!alive || ev.sender === senderRef.current) return;
			if (typingTimer) clearTimeout(typingTimer);
			if (ev.isTyping) {
				setOtherTyping(ev.sender);
				typingTimer = setTimeout(() => setOtherTyping(null), 4e3);
			} else setOtherTyping(null);
		});
		const refetch = async () => {
			if (!alive || document.hidden || detachedRef.current) return;
			const fresh = await listMessages();
			if (!alive || fresh === null || detachedRef.current) return;
			setMessages((prev) => reconcile(prev, fresh));
		};
		const pollId = window.setInterval(refetch, 5e3);
		const onFocus = () => {
			refetch();
		};
		const onVisible = () => {
			if (!document.hidden) refetch();
		};
		window.addEventListener("focus", onFocus);
		window.addEventListener("online", onFocus);
		document.addEventListener("visibilitychange", onVisible);
		return () => {
			alive = false;
			unsubChat();
			unsubTyping();
			if (typingTimer) clearTimeout(typingTimer);
			window.clearInterval(pollId);
			window.removeEventListener("focus", onFocus);
			window.removeEventListener("online", onFocus);
			document.removeEventListener("visibilitychange", onVisible);
		};
	}, [senderRef]);
	/** Fetch one older page; resolves with the number of messages prepended. */
	const loadOlder = (0, import_react.useCallback)(async () => {
		const arr = messagesRef.current;
		if (olderLock.current || !hasMoreRef.current || arr.length === 0) return 0;
		olderLock.current = true;
		setLoadingOlder(true);
		try {
			const res = await fetchOlderMessages(arr[0].timestamp);
			if (!res) return 0;
			setHasMoreOlder(res.hasMore);
			hasMoreRef.current = res.hasMore;
			let count = 0;
			setMessages((prev) => {
				const known = new Set(prev.map((m) => m.id));
				const older = res.messages.filter((m) => !known.has(m.id));
				count = older.length;
				return older.length ? [...older, ...prev] : prev;
			});
			return count;
		} finally {
			olderLock.current = false;
			setLoadingOlder(false);
		}
	}, []);
	/** Page in messages newer than the loaded window (only while detached). */
	const loadNewer = (0, import_react.useCallback)(async () => {
		const arr = messagesRef.current;
		if (newerLock.current || !detachedRef.current || arr.length === 0) return 0;
		newerLock.current = true;
		try {
			const last = arr.filter((m) => !m.id.startsWith("opt-")).pop();
			const res = await fetchNewerMessages(last ? last.timestamp : arr[arr.length - 1].timestamp);
			if (!res) return 0;
			let count = 0;
			setMessages((prev) => {
				const known = new Set(prev.map((m) => m.id));
				const newer = res.messages.filter((m) => !known.has(m.id));
				count = newer.length;
				return newer.length ? [...prev, ...newer] : prev;
			});
			if (!res.hasMore) {
				detachedRef.current = false;
				setDetached(false);
			}
			return count;
		} finally {
			newerLock.current = false;
		}
	}, []);
	/** Show a window of history around `ts` (an old search hit / quoted message). */
	const jumpAround = (0, import_react.useCallback)(async (ts) => {
		const res = await fetchMessagesAround(ts);
		if (!res || res.messages.length === 0) return false;
		detachedRef.current = res.hasNewer;
		setDetached(res.hasNewer);
		hasMoreRef.current = res.hasOlder;
		setHasMoreOlder(res.hasOlder);
		setMessages((prev) => res.hasNewer ? res.messages : reconcile(res.messages, prev.filter((m) => m.timestamp > ts)));
		return true;
	}, []);
	/** Leave an old window and go back to the live, newest messages. */
	const returnToLatest = (0, import_react.useCallback)(async () => {
		if (!detachedRef.current) return;
		const fresh = await listMessages();
		if (!fresh) return;
		detachedRef.current = false;
		setDetached(false);
		hasMoreRef.current = fresh.length >= 300;
		setHasMoreOlder(hasMoreRef.current);
		setMessages((prev) => [...fresh, ...prev.filter((m) => m.id.startsWith("opt-"))]);
	}, []);
	const findTimestamp = (0, import_react.useCallback)((id) => fetchMessageTimestamp(id), []);
	const addOptimistic = (m) => {
		markAnimated(m.id, true);
		if (detachedRef.current) returnToLatest();
		setMessages((prev) => [...prev, m]);
		onLocalAddRef.current();
	};
	const settle = (optId, saved) => {
		if (saved) markAnimated(saved.id);
		setMessages((prev) => {
			if (!saved) return prev.filter((m) => m.id !== optId);
			if (prev.some((m) => m.id === saved.id)) return prev.filter((m) => m.id !== optId);
			return prev.map((m) => m.id === optId ? saved : m);
		});
	};
	const base = (type, reply, extra = {}) => ({
		id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
		type,
		text: null,
		sender: senderRef.current,
		timestamp: Date.now(),
		sessionId: SESSION_ID,
		edited: false,
		replyToId: reply?.id ?? null,
		replySnapshot: reply?.snapshot ?? null,
		...extra
	});
	const setBusy = (id, on) => setUploading((prev) => {
		const n = new Set(prev);
		if (on) n.add(id);
		else n.delete(id);
		return n;
	});
	const sendText = (0, import_react.useCallback)(async (text, reply) => {
		const t = text.trim();
		if (!t) return false;
		const opt = base("text", reply, { text: t });
		addOptimistic(opt);
		const saved = await createMessage(t, senderRef.current, SESSION_ID, reply);
		settle(opt.id, saved);
		if (!saved) setError("Couldn't send. Check your connection and try again.");
		return !!saved;
	}, []);
	const sendSticker = (0, import_react.useCallback)(async (url, kind, reply) => {
		const opt = base(kind, reply, { mediaUrl: url });
		addOptimistic(opt);
		const saved = await createStickerMessage(url, senderRef.current, SESSION_ID, {
			reply,
			kind
		});
		settle(opt.id, saved);
		if (!saved) setError("Couldn't send that. Check your connection and try again.");
	}, []);
	/** A blank-canvas drawing, sent as a bare "sticker" message (no bubble
	*  chrome, transparent PNG) so it floats over the wallpaper like a real
	*  Instagram drawing. `width`/`height` are the canvas's own pixel size. */
	const sendDrawing = (0, import_react.useCallback)(async (file, width, height, reply) => {
		const localUrl = URL.createObjectURL(file);
		const opt = base("sticker", reply, {
			mediaUrl: localUrl,
			mediaWidth: width,
			mediaHeight: height
		});
		addOptimistic(opt);
		setBusy(opt.id, true);
		try {
			const url = await uploadChatMedia(file, "image", senderRef.current);
			const saved = url ? await createStickerMessage(url, senderRef.current, SESSION_ID, {
				width,
				height,
				kind: "sticker",
				reply
			}) : null;
			settle(opt.id, saved);
			if (!saved) setError("Couldn't send the drawing. Check your connection and try again.");
		} finally {
			setBusy(opt.id, false);
			URL.revokeObjectURL(localUrl);
		}
	}, []);
	const sendFile = (0, import_react.useCallback)(async (file, reply) => {
		if (file.size > 52428800) {
			setError(`"${file.name}" is ${formatBytes(file.size)} — files must be under ${formatBytes(MAX_UPLOAD_BYTES)}.`);
			return;
		}
		const localUrl = URL.createObjectURL(file);
		const opt = base("file", reply, {
			mediaUrl: localUrl,
			fileName: file.name,
			fileSize: file.size,
			mimeType: file.type || "application/octet-stream"
		});
		addOptimistic(opt);
		setBusy(opt.id, true);
		try {
			const url = await uploadChatMedia(file, "file", senderRef.current, file.name);
			const saved = url ? await createFileMessage(url, senderRef.current, SESSION_ID, {
				name: file.name,
				size: file.size,
				mime: file.type || "application/octet-stream"
			}, reply) : null;
			settle(opt.id, saved);
			if (!saved) setError("Couldn't send the file. Please try again.");
		} finally {
			setBusy(opt.id, false);
			URL.revokeObjectURL(localUrl);
		}
	}, []);
	/** Compress/probe one photo or video and upload it. */
	const prepareAndUpload = async (file, optId, showCompress) => {
		const { compressImage, probeVideoMeta, compressVideo } = await legacy();
		const isImage = file.type.startsWith("image/");
		let blob = file;
		let w = null;
		let h = null;
		let d = null;
		if (isImage) {
			const c = await compressImage(file);
			if (c) {
				blob = c.blob;
				w = c.width;
				h = c.height;
			}
		} else {
			const meta = await probeVideoMeta(file);
			if (meta) {
				w = meta.width;
				h = meta.height;
				d = meta.durationMs;
			}
			const longSide = meta ? Math.max(meta.width, meta.height) : 0;
			if (file.size > 47185920 || longSide > 1920) {
				if (showCompress) setCompressing({
					id: optId,
					pct: 0
				});
				const c = await compressVideo(file, (pct) => {
					if (showCompress) setCompressing({
						id: optId,
						pct
					});
				});
				if (showCompress) setCompressing(null);
				if (c) {
					blob = c.blob;
					w = c.width;
					h = c.height;
					d = c.durationMs;
				}
			}
		}
		if (blob.size > MAX_FILE) return null;
		const url = await uploadChatMedia(blob, isImage ? "image" : "video", senderRef.current);
		return url ? {
			url,
			w,
			h,
			d,
			kind: isImage ? "image" : "video"
		} : null;
	};
	const sendMedia = (0, import_react.useCallback)(async (file, reply) => {
		const isImage = file.type.startsWith("image/");
		if (!isImage && !file.type.startsWith("video/")) return sendFile(file, reply);
		if (file.size > 524288e3) {
			setError("That file is too big to send.");
			return;
		}
		const localUrl = URL.createObjectURL(file);
		const opt = base(isImage ? "image" : "video", reply, { mediaUrl: localUrl });
		addOptimistic(opt);
		setBusy(opt.id, true);
		try {
			const item = await prepareAndUpload(file, opt.id, true);
			const saved = item ? await createMediaMessage(isImage ? "image" : "video", item.url, senderRef.current, SESSION_ID, {
				width: item.w,
				height: item.h,
				durationMs: item.d,
				reply
			}) : null;
			settle(opt.id, saved);
			if (!saved) setError("Couldn't send that. Check your connection and try again.");
		} finally {
			setBusy(opt.id, false);
			URL.revokeObjectURL(localUrl);
		}
	}, [sendFile]);
	/** 2+ photos/videos → ONE grouped message (fanned stack + swipe viewer). */
	const sendGroup = (0, import_react.useCallback)(async (files, reply) => {
		const media = files.filter((f) => (f.type.startsWith("image/") || f.type.startsWith("video/")) && f.size <= 524288e3);
		if (media.length === 0) return;
		if (media.length === 1) return sendMedia(media[0], reply);
		const localUrls = media.map((f) => URL.createObjectURL(f));
		const opt = base("image", reply, {
			mediaUrl: localUrls[0],
			albumItems: media.map((f, i) => ({
				url: localUrls[i],
				kind: f.type.startsWith("video/") ? "video" : "image"
			}))
		});
		addOptimistic(opt);
		setBusy(opt.id, true);
		const total = media.length;
		let done = 0;
		setProgress((p) => ({
			...p,
			[opt.id]: {
				done,
				total
			}
		}));
		const results = new Array(total).fill(null);
		let cursor = 0;
		const worker = async () => {
			for (;;) {
				const i = cursor++;
				if (i >= total) return;
				try {
					results[i] = await prepareAndUpload(media[i], opt.id, false);
				} catch {
					results[i] = null;
				}
				done += 1;
				setProgress((p) => ({
					...p,
					[opt.id]: {
						done,
						total
					}
				}));
			}
		};
		await Promise.all(Array.from({ length: Math.min(3, total) }, worker));
		const items = results.filter((r) => !!r);
		const saved = items.length ? await createAlbumMessage(items, senderRef.current, SESSION_ID, reply) : null;
		settle(opt.id, saved);
		if (!saved) setError("Couldn't send the photos. Check your connection and try again.");
		else if (items.length < total) setError(`${total - items.length} of ${total} items couldn't be uploaded and were skipped.`);
		setBusy(opt.id, false);
		setProgress((p) => {
			const n = { ...p };
			delete n[opt.id];
			return n;
		});
		localUrls.forEach((u) => URL.revokeObjectURL(u));
	}, [sendMedia]);
	const sendVoice = (0, import_react.useCallback)(async (blob, durationMs, reply) => {
		const localUrl = URL.createObjectURL(blob);
		const opt = base("voice", reply, {
			mediaUrl: localUrl,
			durationMs
		});
		addOptimistic(opt);
		setBusy(opt.id, true);
		try {
			const url = await uploadChatMedia(blob, "voice", senderRef.current);
			const saved = url ? await createMediaMessage("voice", url, senderRef.current, SESSION_ID, {
				durationMs,
				reply
			}) : null;
			settle(opt.id, saved);
			if (!saved) setError("Couldn't send the voice message. Please try again.");
		} finally {
			setBusy(opt.id, false);
			URL.revokeObjectURL(localUrl);
		}
	}, []);
	const edit = (0, import_react.useCallback)(async (id, text) => {
		const t = text.trim();
		if (!t) return;
		setMessages((prev) => prev.map((m) => m.id === id ? {
			...m,
			text: t,
			edited: true
		} : m));
		if (!await editMessage(id, t, SESSION_ID)) setError("Couldn't save the edit.");
	}, []);
	const unsend = (0, import_react.useCallback)(async (msg) => {
		setMessages((prev) => prev.filter((m) => m.id !== msg.id));
		if (!await deleteMessage(msg.id, SESSION_ID, msg.mediaUrl ?? null, msg.albumItems?.map((it) => it.url) ?? null)) {
			const fresh = await listMessages();
			if (fresh) setMessages((prev) => reconcile(prev, fresh));
			setError("Couldn't unsend that message.");
		}
	}, []);
	const sessionToSender = (0, import_react.useMemo)(() => {
		const counts = {};
		for (const m of messages) {
			const sid = m.sessionId;
			if (!sid) continue;
			counts[sid] ??= {
				faizan: 0,
				habiba: 0
			};
			counts[sid][m.sender]++;
		}
		const map = {};
		for (const [sid, c] of Object.entries(counts)) map[sid] = c.faizan > c.habiba ? "faizan" : "habiba";
		return map;
	}, [messages]);
	const reactorOf = (0, import_react.useCallback)((key) => {
		if (key === "faizan" || key === "habiba") return key;
		if (key === SESSION_ID) return senderRef.current;
		return sessionToSender[key] ?? null;
	}, [sessionToSender, senderRef]);
	return {
		messages,
		messagesRef,
		loading,
		hasMoreOlder,
		loadingOlder,
		loadOlder,
		detached,
		loadNewer,
		jumpAround,
		returnToLatest,
		findTimestamp,
		uploading,
		progress,
		compressing,
		error,
		setError,
		otherTyping,
		sendText,
		sendSticker,
		sendDrawing,
		sendFile,
		sendMedia,
		sendGroup,
		sendVoice,
		edit,
		unsend,
		react: (0, import_react.useCallback)(async (msg, emoji, mode = "toggle") => {
			const me = senderRef.current;
			const current = (messagesRef.current.find((m) => m.id === msg.id) ?? msg).reactions ?? {};
			const mineIn = (users) => users.filter((u) => reactorOf(u) === me);
			const has = mineIn(current[emoji] ?? []).length > 0;
			if (has && mode === "add") return "noop";
			const add = !has;
			if (add) {
				if (Object.values(current).filter((u) => mineIn(u).length > 0).length >= 6) return "limit";
			}
			const mine = Array.from(/* @__PURE__ */ new Set([
				me,
				SESSION_ID,
				...mineIn(current[emoji] ?? [])
			]));
			const users = new Set(current[emoji] ?? []);
			mine.forEach((k) => users.delete(k));
			if (add) users.add(me);
			const next = { ...current };
			if (users.size === 0) delete next[emoji];
			else next[emoji] = Array.from(users);
			setMessages((prev) => prev.map((m) => m.id === msg.id ? {
				...m,
				reactions: next
			} : m));
			if (!msg.id.startsWith("opt-")) {
				const saved = await setMyReaction(msg.id, emoji, mine, me, add);
				if (saved) setMessages((prev) => prev.map((m) => m.id === msg.id ? {
					...m,
					reactions: saved
				} : m));
			}
			return add ? "added" : "removed";
		}, [reactorOf, senderRef]),
		reactorOf
	};
}
async function fetchSettings() {
	if (!isSupabaseConfigured) return {};
	try {
		const { data, error } = await supabase.from("chat_settings").select("key, value");
		if (error || !data) return {};
		const out = {};
		for (const row of data) out[row.key] = row.value;
		return out;
	} catch {
		return {};
	}
}
async function saveSetting(key, value) {
	if (!isSupabaseConfigured) return false;
	try {
		const { error } = await supabase.from("chat_settings").upsert({
			key,
			value,
			updated_at: (/* @__PURE__ */ new Date()).toISOString()
		}, { onConflict: "key" });
		return !error;
	} catch {
		return false;
	}
}
function subscribeSettings(onChange) {
	if (!isSupabaseConfigured) return () => {};
	const ch = supabase.channel("chat_settings_stream").on("postgres_changes", {
		event: "*",
		schema: "public",
		table: "chat_settings"
	}, (payload) => {
		const row = payload.new ?? {};
		if (row.key) onChange(row.key, row.value);
	}).subscribe();
	return () => {
		try {
			supabase.removeChannel(ch);
		} catch {}
	};
}
var THEME_GROUPS = [
	"Ours",
	"Love",
	"Instagram",
	"Minimal"
];
var THEMES = [
	{
		id: "kitty",
		name: "Kitty",
		group: "Ours",
		bg: "#000000",
		wallpaper: "/wallpapers/kitty.png",
		inBg: "#262626",
		outBg: "#3797f0",
		accent: "#3797f0"
	},
	{
		id: "pink",
		name: "Classic Pink",
		group: "Ours",
		mode: "light",
		bg: "linear-gradient(180deg, #fff2f7 0%, #ffe7f0 50%, #ffdaea 100%)",
		wallpaper: null,
		inBg: "#fff4f7",
		outBg: "#ff5f8a",
		inPaint: "linear-gradient(160deg, #ffffff 0%, #fff4f7 45%, #ffe1ec 100%)",
		outPaint: "linear-gradient(160deg, #ff90b3 0%, #ff5f8a 55%, #d8285d 100%)",
		inFg: "#7a2040",
		outFg: "#ffffff",
		accent: "#e8336d"
	},
	{
		id: "blush",
		name: "Blush",
		group: "Ours",
		bg: "#140609",
		wallpaper: "/wallpapers/blush.png",
		inBg: "#3b2530",
		outBg: "#ff5c8d",
		accent: "#ff5c8d"
	},
	{
		id: "peach",
		name: "Peach",
		group: "Ours",
		bg: "#0c0c0c",
		wallpaper: "/wallpapers/peach.png",
		inBg: "#2f2f2f",
		outBg: "#ffb4a2",
		accent: "#ffb4a2"
	},
	{
		id: "crush",
		name: "Crush",
		group: "Ours",
		bg: "#000000",
		wallpaper: "/wallpapers/crush.png",
		inBg: "#303030",
		outBg: "#e63946",
		accent: "#e63946"
	},
	{
		id: "froggy",
		name: "Froggy",
		group: "Ours",
		bg: "#050d07",
		wallpaper: "/wallpapers/froggy.png",
		inBg: "#1e3a26",
		outBg: "#7bd389",
		accent: "#7bd389"
	},
	{
		id: "angel",
		name: "Angel",
		group: "Ours",
		bg: "#0a0a0a",
		wallpaper: "/wallpapers/angel.png",
		inBg: "#2a2a2a",
		outBg: "#f4f1ea",
		accent: "#f4f1ea"
	},
	{
		id: "love",
		name: "Love",
		group: "Love",
		bg: "#1b0409",
		wallpaper: "/wallpapers/love.png",
		inBg: "#30131a",
		outBg: "#e01e3c",
		outPaint: "linear-gradient(160deg, #ff7a7a 0%, #ff3b5c 45%, #cc0f30 100%)",
		accent: "#ff4d6d"
	},
	{
		id: "iheartyou",
		name: "I Heart You",
		group: "Love",
		mode: "light",
		bg: "linear-gradient(180deg, #fffdf9 0%, #fdf1ec 60%, #fbe6e2 100%)",
		wallpaper: "/wallpapers/iheart.png",
		inBg: "#ffffff",
		outBg: "#d61f3c",
		inPaint: "linear-gradient(160deg, #ffffff 0%, #fff7f5 100%)",
		outPaint: "linear-gradient(160deg, #ef4b60 0%, #d61f3c 55%, #a40f27 100%)",
		inFg: "#3f1017",
		outFg: "#ffffff",
		accent: "#d61f3c"
	},
	{
		id: "heartdrive",
		name: "Heart Drive",
		group: "Love",
		bg: "#140021",
		wallpaper: "/wallpapers/pixelheart.png",
		inBg: "#2a0f3a",
		outBg: "#ff2e88",
		outPaint: "linear-gradient(160deg, #ff2e88 0%, #c01fb0 55%, #7b2ff7 100%)",
		accent: "#ff2e88"
	},
	{
		id: "luckypink",
		name: "Lucky Pink",
		group: "Love",
		mode: "light",
		bg: "linear-gradient(180deg, #fff2f8 0%, #ffe6f1 55%, #ffd9ea 100%)",
		wallpaper: "/wallpapers/clover.png",
		inBg: "#ffffff",
		outBg: "#e8336d",
		inPaint: "linear-gradient(160deg, #ffffff 0%, #fff4f9 100%)",
		outPaint: "linear-gradient(160deg, #ff8fb8 0%, #ff5c96 50%, #e02766 100%)",
		inFg: "#5f1736",
		outFg: "#ffffff",
		accent: "#e8336d"
	},
	{
		id: "flirt",
		name: "Flirt",
		group: "Love",
		bg: "#17000c",
		wallpaper: "/wallpapers/lips.png",
		inBg: "#2b1020",
		outBg: "#ff3d81",
		outPaint: "linear-gradient(160deg, #ff6fae 0%, #ff2e86 50%, #c4007a 100%)",
		accent: "#ff3d81"
	},
	{
		id: "classic",
		name: "Direct Classic",
		group: "Instagram",
		bg: "#000000",
		wallpaper: null,
		inBg: "#262626",
		outBg: "#3797f0",
		accent: "#3797f0"
	},
	{
		id: "aurora",
		name: "Aurora",
		group: "Instagram",
		bg: "#04111a",
		wallpaper: null,
		inBg: "#16222b",
		outBg: "#2b7cf7",
		outPaint: "linear-gradient(160deg, #35e0c6 0%, #2b7cf7 55%, #8a4df5 100%)",
		accent: "#35c7d6"
	},
	{
		id: "sunset",
		name: "Sunset",
		group: "Instagram",
		bg: "#140a06",
		wallpaper: null,
		inBg: "#241611",
		outBg: "#f2642c",
		outPaint: "linear-gradient(160deg, #ffd166 0%, #fb6f3c 55%, #e0315f 100%)",
		accent: "#fb6f3c"
	},
	{
		id: "lofi",
		name: "Lo-fi",
		group: "Instagram",
		bg: "#0d0b14",
		wallpaper: null,
		inBg: "#1d1a27",
		outBg: "#8b7cf6",
		outPaint: "linear-gradient(160deg, #a78bfa 0%, #7c6cf0 55%, #4f46b8 100%)",
		accent: "#a78bfa"
	},
	{
		id: "mono",
		name: "Mono",
		group: "Minimal",
		bg: "#000000",
		wallpaper: null,
		inBg: "#1c1c1e",
		outBg: "#f2f2f2",
		accent: "#f2f2f2"
	},
	{
		id: "slate",
		name: "Slate",
		group: "Minimal",
		bg: "#0d1117",
		wallpaper: null,
		inBg: "#1b222c",
		outBg: "#5b8def",
		accent: "#5b8def"
	},
	{
		id: "ink",
		name: "Ink",
		group: "Minimal",
		bg: "#101010",
		wallpaper: null,
		inBg: "#1e1e1e",
		outBg: "#2f6f5f",
		accent: "#49a088"
	},
	{
		id: "paper",
		name: "Paper",
		group: "Minimal",
		mode: "light",
		bg: "#f7f6f3",
		wallpaper: null,
		inBg: "#ececE6",
		outBg: "#1b1b1b",
		inFg: "#1a1a1a",
		outFg: "#ffffff",
		accent: "#1b1b1b"
	},
	{
		id: "sand",
		name: "Sand",
		group: "Minimal",
		mode: "light",
		bg: "#f6efe6",
		wallpaper: null,
		inBg: "#ece2d4",
		outBg: "#a9764f",
		inFg: "#3b2d1f",
		outFg: "#ffffff",
		accent: "#a9764f"
	},
	{
		id: "mint",
		name: "Mint",
		group: "Minimal",
		mode: "light",
		bg: "#f1faf4",
		wallpaper: null,
		inBg: "#e3f1e8",
		outBg: "#2fa36b",
		inFg: "#16301f",
		outFg: "#ffffff",
		accent: "#2fa36b"
	},
	{
		id: "lilac",
		name: "Lilac",
		group: "Minimal",
		mode: "light",
		bg: "#f6f3ff",
		wallpaper: null,
		inBg: "#ebe6fb",
		outBg: "#7c5cff",
		inFg: "#2d2240",
		outFg: "#ffffff",
		accent: "#7c5cff"
	}
];
var BUILTIN_WALLPAPERS = THEMES.map((t) => t.wallpaper).filter((w) => !!w);
var DEFAULT_THEME = THEMES[0];
var CACHE_KEY = "ig_chat_theme";
/** Black or white text, whichever reads better on the given hex colour. */
function textOn(hex) {
	const h = hex.replace("#", "");
	const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
	const n = parseInt(full.slice(0, 6), 16);
	if (Number.isNaN(n)) return "#fff";
	const r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
	return (.2126 * r + .7152 * g + .0722 * b) / 255 > .6 ? "#0b0b0b" : "#ffffff";
}
function resolveTheme(stored) {
	if (!stored || typeof stored !== "object") return DEFAULT_THEME;
	if (stored.id === "custom") {
		const outBg = stored.outBg || DEFAULT_THEME.outBg;
		return {
			id: "custom",
			name: "Custom",
			bg: "#000000",
			wallpaper: stored.wallpaper ?? null,
			inBg: stored.inBg || DEFAULT_THEME.inBg,
			outBg,
			accent: outBg
		};
	}
	return THEMES.find((t) => t.id === stored.id) ?? DEFAULT_THEME;
}
function toStored(t) {
	return t.id === "custom" ? {
		id: "custom",
		wallpaper: t.wallpaper,
		inBg: t.inBg,
		outBg: t.outBg
	} : { id: t.id };
}
function readCachedTheme() {
	try {
		const raw = localStorage.getItem(CACHE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}
function cacheTheme(t) {
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify(t));
	} catch {}
}
var isLight = (t) => t.mode === "light";
function themeVars(t) {
	const edge = t.bg.startsWith("#") ? t.bg : isLight(t) ? "#ffe7f0" : "#000000";
	return {
		"--ig-bg": t.bg,
		"--ig-edge": edge,
		"--ig-in-bg": t.inBg,
		"--ig-in-paint": t.inPaint ?? t.inBg,
		"--ig-in-fg": t.inFg ?? textOn(t.inBg),
		"--ig-out-bg": t.outBg,
		"--ig-out-paint": t.outPaint ?? t.outBg,
		"--ig-out-fg": t.outFg ?? textOn(t.outBg),
		"--ig-accent": t.accent,
		"--ig-accent-fg": textOn(t.accent)
	};
}
function useSharedSettings() {
	const [theme, setTheme] = (0, import_react.useState)(() => resolveTheme(readCachedTheme()));
	const names = useNames();
	(0, import_react.useEffect)(() => {
		let alive = true;
		fetchSettings().then((s) => {
			if (!alive) return;
			if (s.theme) {
				setTheme(resolveTheme(s.theme));
				cacheTheme(s.theme);
			}
			if (s.names) setNames(s.names);
		});
		const unsub = subscribeSettings((key, value) => {
			if (key === "names") {
				setNames(value);
				return;
			}
			if (key !== "theme") return;
			setTheme(resolveTheme(value));
			cacheTheme(value);
		});
		return () => {
			alive = false;
			unsub();
		};
	}, []);
	return {
		theme,
		applyTheme: (0, import_react.useCallback)(async (t) => {
			setTheme(t);
			const stored = toStored(t);
			cacheTheme(stored);
			return saveSetting("theme", stored);
		}, []),
		names,
		applyNames: (0, import_react.useCallback)(async (next) => {
			return saveSetting("names", setNames({
				...getNames(),
				...next
			}));
		}, [])
	};
}
var MIME_CANDIDATES = [
	"audio/mp4;codecs=mp4a.40.2",
	"audio/mp4",
	"audio/aac",
	"audio/webm;codecs=opus",
	"audio/ogg;codecs=opus",
	"audio/webm"
];
function micErrorMessage(err) {
	const name = err?.name || "";
	if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") return "Microphone access is blocked. Allow mic access in your settings, then try again.";
	if (name === "NotFoundError" || name === "DevicesNotFoundError") return "No microphone was found on this device.";
	if (name === "NotReadableError" || name === "TrackStartError") return "Your microphone is being used by another app.";
	return "Couldn't start recording. Please try again.";
}
function useRecorder(onError) {
	const [recording, setRecording] = (0, import_react.useState)(false);
	const mrRef = (0, import_react.useRef)(null);
	const chunksRef = (0, import_react.useRef)([]);
	const streamRef = (0, import_react.useRef)(null);
	const ctxRef = (0, import_react.useRef)(null);
	const analyserRef = (0, import_react.useRef)(null);
	const startTsRef = (0, import_react.useRef)(0);
	const startingRef = (0, import_react.useRef)(false);
	const abortRef = (0, import_react.useRef)(false);
	const release = (0, import_react.useCallback)(() => {
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
		if (ctxRef.current) try {
			ctxRef.current.close();
		} catch {}
		ctxRef.current = null;
		analyserRef.current = null;
	}, []);
	(0, import_react.useEffect)(() => () => {
		try {
			mrRef.current?.stop();
		} catch {}
		release();
	}, [release]);
	const start = (0, import_react.useCallback)(async () => {
		if (startingRef.current || mrRef.current) return;
		startingRef.current = true;
		abortRef.current = false;
		try {
			const natural = {
				echoCancellation: false,
				noiseSuppression: false,
				autoGainControl: false,
				channelCount: { ideal: 1 }
			};
			let stream;
			try {
				stream = await navigator.mediaDevices.getUserMedia({ audio: natural });
			} catch (e) {
				if (e?.name !== "OverconstrainedError") throw e;
				stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			}
			if (abortRef.current) {
				stream.getTracks().forEach((t) => t.stop());
				return;
			}
			streamRef.current = stream;
			const mime = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
			const mr = new MediaRecorder(stream, mime ? {
				mimeType: mime,
				audioBitsPerSecond: 128e3
			} : { audioBitsPerSecond: 128e3 });
			chunksRef.current = [];
			mr.ondataavailable = (e) => {
				if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
			};
			mr.start();
			mrRef.current = mr;
			startTsRef.current = Date.now();
			const ctx = new (window.AudioContext || window.webkitAudioContext)();
			ctxRef.current = ctx;
			const analyser = ctx.createAnalyser();
			analyser.fftSize = 512;
			ctx.createMediaStreamSource(stream).connect(analyser);
			analyserRef.current = analyser;
			setRecording(true);
		} catch (err) {
			release();
			onError(micErrorMessage(err));
		} finally {
			startingRef.current = false;
		}
	}, [onError, release]);
	const cancel = (0, import_react.useCallback)(() => {
		abortRef.current = true;
		const mr = mrRef.current;
		if (mr && mr.state !== "inactive") try {
			mr.stop();
		} catch {}
		mrRef.current = null;
		chunksRef.current = [];
		release();
		setRecording(false);
	}, [release]);
	return {
		recording,
		start,
		stop: (0, import_react.useCallback)(async () => {
			const mr = mrRef.current;
			if (!mr) {
				abortRef.current = true;
				return null;
			}
			const chunks = chunksRef.current;
			const type = mr.mimeType || "audio/webm";
			const done = new Promise((resolve) => {
				mr.onstop = () => resolve(new Blob(chunks, { type }));
			});
			try {
				mr.stop();
			} catch {}
			const blob = await done;
			mrRef.current = null;
			release();
			setRecording(false);
			const durationMs = Date.now() - startTsRef.current;
			if (durationMs < 400 || blob.size < 500) return null;
			return {
				blob,
				durationMs
			};
		}, [release]),
		cancel,
		analyserRef,
		startTsRef
	};
}
var ctx = null;
var master = null;
var timer = null;
/** One gentle dual-tone pulse with a soft fade-in/out envelope. */
function pulse(at, freqs, dur) {
	if (!ctx || !master) return;
	for (const f of freqs) {
		const osc = ctx.createOscillator();
		const g = ctx.createGain();
		osc.type = "sine";
		osc.frequency.value = f;
		g.gain.setValueAtTime(0, at);
		g.gain.linearRampToValueAtTime(.05, at + .05);
		g.gain.setValueAtTime(.05, at + dur - .14);
		g.gain.linearRampToValueAtTime(0, at + dur);
		osc.connect(g);
		g.connect(master);
		osc.start(at);
		osc.stop(at + dur + .02);
	}
}
/** Classic soft double-ring: two pleasant A/C# pulses. */
function ringOnce() {
	if (!ctx) return;
	const t = ctx.currentTime + .02;
	pulse(t, [440, 554.37], .42);
	pulse(t + .56, [440, 554.37], .42);
}
function startRingTone() {
	stopRingTone();
	try {
		const AC = window.AudioContext ?? window.webkitAudioContext;
		if (!AC) return;
		ctx = ctx ?? new AC();
		if (ctx.state === "suspended") ctx.resume();
		master = ctx.createGain();
		master.gain.value = 1;
		master.connect(ctx.destination);
		ringOnce();
		timer = window.setInterval(ringOnce, 2600);
	} catch {}
}
function stopRingTone() {
	if (timer !== null) {
		clearInterval(timer);
		timer = null;
	}
	if (master) {
		try {
			master.disconnect();
		} catch {}
		master = null;
	}
}
var WAKE_API_BASE = "".replace(/\/+$/, "") || `${SUPABASE_URL}/functions/v1`;
function useWakeUp(onPlaced) {
	const [ringing, setRinging] = (0, import_react.useState)(false);
	const [status, setStatus] = (0, import_react.useState)("ringing");
	const [error, setError] = (0, import_react.useState)(null);
	const timerRef = (0, import_react.useRef)(null);
	const closeRef = (0, import_react.useRef)(null);
	const pollRef = (0, import_react.useRef)(null);
	const channelRef = (0, import_react.useRef)(null);
	const requestIdRef = (0, import_react.useRef)(null);
	const startedAtRef = (0, import_react.useRef)(0);
	const onPlacedRef = (0, import_react.useRef)(onPlaced);
	onPlacedRef.current = onPlaced;
	(0, import_react.useEffect)(() => {
		const warm = () => {
			fetch(`${WAKE_API_BASE}/wake-up/health`, {
				cache: "no-store",
				keepalive: true
			}).catch(() => {});
			warmPushIsolate();
		};
		warm();
		const id = window.setInterval(warm, 25e3);
		const onVisible = () => {
			if (document.visibilityState === "visible") warm();
		};
		document.addEventListener("visibilitychange", onVisible);
		return () => {
			window.clearInterval(id);
			document.removeEventListener("visibilitychange", onVisible);
		};
	}, []);
	const teardown = (0, import_react.useCallback)(() => {
		stopRingTone();
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		if (closeRef.current) {
			clearTimeout(closeRef.current);
			closeRef.current = null;
		}
		if (pollRef.current) {
			clearInterval(pollRef.current);
			pollRef.current = null;
		}
		if (channelRef.current) {
			supabase.removeChannel(channelRef.current);
			channelRef.current = null;
		}
	}, []);
	const stop = (0, import_react.useCallback)(() => {
		teardown();
		setRinging(false);
	}, [teardown]);
	(0, import_react.useEffect)(() => () => {
		teardown();
	}, [teardown]);
	const finish = (0, import_react.useCallback)((st, ms) => {
		stopRingTone();
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		if (pollRef.current) {
			clearInterval(pollRef.current);
			pollRef.current = null;
		}
		if (st === "answered") haptics.success();
		setStatus(st);
		closeRef.current = window.setTimeout(() => stop(), ms);
	}, [stop]);
	return {
		ringing,
		status,
		error,
		start: (0, import_react.useCallback)(() => {
			const now = Date.now();
			if (now - startedAtRef.current < 2500) return;
			startedAtRef.current = now;
			const callPromise = fetch(`${WAKE_API_BASE}/wake-up`, {
				method: "POST",
				cache: "no-store",
				keepalive: true
			});
			haptics.light();
			teardown();
			requestIdRef.current = null;
			setError(null);
			setStatus("ringing");
			setRinging(true);
			startRingTone();
			timerRef.current = window.setTimeout(() => {
				stopRingTone();
				setStatus("noanswer");
				notifyMissedWakeUp(requestIdRef.current);
				closeRef.current = window.setTimeout(() => stop(), 5e3);
			}, 45e3);
			(async () => {
				try {
					const resp = await callPromise;
					const data = await resp.json().catch(() => null);
					if (!resp.ok || !data?.callSid) throw new Error(data?.error || "Couldn't start the phone call.");
					const callSid = String(data.callSid);
					onPlacedRef.current();
					pollRef.current = window.setInterval(() => {
						(async () => {
							try {
								const st = (await (await fetch(`${WAKE_API_BASE}/wake-up/status?callSid=${encodeURIComponent(callSid)}`)).json().catch(() => null))?.status;
								if (!st || st === "queued" || st === "initiated" || st === "ringing") return;
								if (st === "in-progress" || st === "completed") finish("answered", 6e3);
								else {
									notifyMissedWakeUp(requestIdRef.current);
									finish("noanswer", 5e3);
								}
							} catch {}
						})();
					}, 2e3);
				} catch (err) {
					stopRingTone();
					if (timerRef.current) {
						clearTimeout(timerRef.current);
						timerRef.current = null;
					}
					setError(err instanceof Error ? err.message : "Couldn't start the phone call.");
					setStatus("error");
				}
			})();
			supabase.rpc("request_wake_up", {
				p_caller: "habiba",
				p_recipient: "faizan",
				p_caller_display: `${fullName("habiba")} 💗`
			}).then(({ data, error: rpcErr }) => {
				if (rpcErr || !data) return;
				const requestId = String(data);
				requestIdRef.current = requestId;
				channelRef.current = supabase.channel(`wake-up-${requestId}`).on("postgres_changes", {
					event: "UPDATE",
					schema: "public",
					table: "wake_up_requests",
					filter: `id=eq.${requestId}`
				}, (payload) => {
					const st = payload.new?.status;
					if (!st || st === "ringing") return;
					if (channelRef.current) {
						supabase.removeChannel(channelRef.current);
						channelRef.current = null;
					}
					if (st === "answered") finish("answered", 6e3);
					else {
						if (st === "expired" || st === "failed") notifyMissedWakeUp(requestId);
						finish(st === "declined" ? "declined" : "noanswer", 5e3);
					}
				}).subscribe();
			});
		}, [
			teardown,
			stop,
			finish
		]),
		stop
	};
}
var BUCKET = "music";
var AUDIO_RE = /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|webm)$/i;
var VOL_KEY = "hb_music_volume";
var state = {
	songs: [],
	songsLoaded: false,
	songsError: null,
	index: -1,
	playing: false,
	buffering: false
};
var snap = { ...state };
var listeners = /* @__PURE__ */ new Set();
function notify() {
	snap = { ...state };
	listeners.forEach((l) => l());
}
var audio = null;
var intentPlaying = false;
var errorStreak = 0;
var volumeAdjustable = (() => {
	if (typeof document === "undefined") return true;
	try {
		const probe = document.createElement("audio");
		probe.volume = .5;
		return Math.abs(probe.volume - .5) < .01;
	} catch {
		return true;
	}
})();
var preconnected = false;
function injectPreconnect(origin) {
	if (preconnected || typeof document === "undefined") return;
	preconnected = true;
	try {
		const link = document.createElement("link");
		link.rel = "preconnect";
		link.href = origin;
		document.head.appendChild(link);
	} catch {}
}
var prefetched = null;
var prefetchCtl = null;
var prefetchTargetPath = null;
var activeBlobUrl = null;
function clearPrefetched() {
	if (prefetched) {
		URL.revokeObjectURL(prefetched.blobUrl);
		prefetched = null;
	}
}
function schedulePrefetchNext() {
	if (state.songs.length < 2 || state.index < 0) return;
	const nextSong = state.songs[(state.index + 1) % state.songs.length];
	if (!nextSong) return;
	if (prefetched?.path === nextSong.path || prefetchTargetPath === nextSong.path) return;
	if (navigator.connection?.saveData) return;
	prefetchCtl?.abort();
	const ctl = new AbortController();
	prefetchCtl = ctl;
	prefetchTargetPath = nextSong.path;
	fetch(nextSong.url, { signal: ctl.signal }).then((r) => r.ok ? r.blob() : Promise.reject(/* @__PURE__ */ new Error("bad status"))).then((b) => {
		if (ctl.signal.aborted) return;
		clearPrefetched();
		prefetched = {
			path: nextSong.path,
			blobUrl: URL.createObjectURL(b)
		};
		prefetchTargetPath = null;
	}).catch(() => {
		if (prefetchTargetPath === nextSong.path) prefetchTargetPath = null;
	});
}
function takePrefetched(path) {
	if (prefetched?.path === path) {
		const u = prefetched.blobUrl;
		prefetched = null;
		return u;
	}
	return null;
}
function ensureAudio() {
	if (audio) return audio;
	const a = new Audio();
	a.preload = "auto";
	try {
		const v = Number(localStorage.getItem(VOL_KEY));
		if (Number.isFinite(v) && v >= 0 && v <= 1) a.volume = v;
	} catch {}
	a.addEventListener("playing", () => {
		errorStreak = 0;
		state.playing = true;
		state.buffering = false;
		notify();
		schedulePrefetchNext();
	});
	a.addEventListener("pause", () => {
		if (state.playing) {
			state.playing = false;
			notify();
		}
	});
	a.addEventListener("waiting", () => {
		if (!state.buffering) {
			state.buffering = true;
			notify();
		}
	});
	a.addEventListener("canplay", () => {
		if (state.buffering) {
			state.buffering = false;
			notify();
		}
	});
	a.addEventListener("ended", () => {
		if (intentPlaying && state.songs.length > 0) playIndex((state.index + 1) % state.songs.length, true);
	});
	a.addEventListener("error", () => {
		if (!a.getAttribute("src")) return;
		errorStreak += 1;
		if (intentPlaying && state.songs.length > 1 && errorStreak < state.songs.length) playIndex((state.index + 1) % state.songs.length, true);
		else {
			intentPlaying = false;
			state.playing = false;
			state.buffering = false;
			notify();
		}
	});
	if ("mediaSession" in navigator) try {
		navigator.mediaSession.setActionHandler("play", () => toggle());
		navigator.mediaSession.setActionHandler("pause", () => toggle());
		navigator.mediaSession.setActionHandler("previoustrack", () => prev());
		navigator.mediaSession.setActionHandler("nexttrack", () => next());
	} catch {}
	audio = a;
	return a;
}
function safePlay(a) {
	const p = a.play();
	if (p) p.catch(() => {
		if (a.paused) {
			state.playing = false;
			state.buffering = false;
			notify();
		}
	});
}
function playIndex(i, auto = false) {
	const s = state.songs[i];
	if (!s) return;
	const a = ensureAudio();
	if (!auto && i === state.index && a.getAttribute("src")) {
		toggle();
		return;
	}
	intentPlaying = true;
	state.index = i;
	state.playing = true;
	state.buffering = true;
	notify();
	const pre = takePrefetched(s.path);
	const oldBlob = activeBlobUrl;
	activeBlobUrl = pre;
	a.src = pre ?? s.url;
	if (oldBlob && oldBlob !== pre) URL.revokeObjectURL(oldBlob);
	safePlay(a);
	if ("mediaSession" in navigator) try {
		navigator.mediaSession.metadata = new MediaMetadata({
			title: s.title,
			artist: "Our Songs 💌"
		});
	} catch {}
}
function toggle() {
	const a = ensureAudio();
	if (state.index < 0 || !a.getAttribute("src")) {
		if (state.songs.length > 0) playIndex(Math.max(state.index, 0), true);
		return;
	}
	if (a.paused) {
		intentPlaying = true;
		state.playing = true;
		notify();
		safePlay(a);
	} else {
		intentPlaying = false;
		a.pause();
	}
}
function next() {
	if (state.songs.length === 0) return;
	playIndex((state.index + 1) % state.songs.length, true);
}
function prev() {
	if (state.songs.length === 0) return;
	const a = ensureAudio();
	if (a.currentTime > 3 && state.index >= 0) {
		a.currentTime = 0;
		return;
	}
	playIndex((state.index - 1 + state.songs.length) % state.songs.length, true);
}
function seek(t) {
	const a = ensureAudio();
	if (Number.isFinite(t) && t >= 0) a.currentTime = t;
}
function stop() {
	const a = ensureAudio();
	intentPlaying = false;
	a.pause();
	a.removeAttribute("src");
	a.load();
	if (activeBlobUrl) {
		URL.revokeObjectURL(activeBlobUrl);
		activeBlobUrl = null;
	}
	prefetchCtl?.abort();
	prefetchTargetPath = null;
	clearPrefetched();
	state.index = -1;
	state.playing = false;
	state.buffering = false;
	notify();
}
function setVolume(v) {
	const clamped = Math.min(1, Math.max(0, v));
	ensureAudio().volume = clamped;
	try {
		localStorage.setItem(VOL_KEY, String(clamped));
	} catch {}
}
function getVolume() {
	if (audio) return audio.volume;
	try {
		const v = Number(localStorage.getItem(VOL_KEY));
		if (Number.isFinite(v) && v >= 0 && v <= 1) return v;
	} catch {}
	return 1;
}
function hashName(s) {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619) >>> 0;
	}
	return h >>> 0;
}
function buildSongs(names) {
	const sorted = [...names].sort((x, y) => hashName(x) - hashName(y) || (x < y ? -1 : 1));
	const base = supabase.storage.from(BUCKET).getPublicUrl("x").data.publicUrl;
	const prefix = base.slice(0, base.length - 1);
	try {
		injectPreconnect(new URL(prefix).origin);
	} catch {}
	return sorted.map((name, i) => ({
		n: i + 1,
		title: (name.split("/").pop() ?? name).replace(/\.[^.]+$/, ""),
		path: name,
		url: prefix + name.split("/").map((seg) => encodeURIComponent(seg)).join("/")
	}));
}
async function listAllFiles() {
	const names = [];
	const LIMIT = 1e3;
	const queue = [""];
	let foldersVisited = 0;
	while (queue.length > 0 && foldersVisited < 300) {
		const prefix = queue.shift();
		foldersVisited += 1;
		let offset = 0;
		for (;;) {
			const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
				limit: LIMIT,
				offset,
				sortBy: {
					column: "name",
					order: "asc"
				}
			});
			if (error) throw new Error(error.message);
			const batch = data ?? [];
			for (const f of batch) {
				if (!f.name || f.name.startsWith(".")) continue;
				const full = prefix ? `${prefix}/${f.name}` : f.name;
				if (f.id) {
					if (AUDIO_RE.test(f.name)) names.push(full);
				} else queue.push(full);
			}
			if (batch.length < LIMIT) break;
			offset += batch.length;
			if (offset > 2e4) break;
		}
	}
	return names;
}
/**
* Called ONLY when the listing came back empty, to turn a silent
* "no songs" into an actionable message.
*
* Storage RLS makes an unauthorised list return an EMPTY ARRAY instead of an
* error, so "empty" is ambiguous: the bucket may be missing, private, or the
* SELECT policy may not have been created yet. One tiny request disambiguates.
*/
async function diagnoseEmptyBucket() {
	try {
		const probeUrl = supabase.storage.from(BUCKET).getPublicUrl("__hb_probe__.mp3").data.publicUrl;
		const res = await fetch(probeUrl, {
			method: "GET",
			cache: "no-store"
		});
		if (res.ok) return null;
		const body = await res.text();
		if (/NoSuchBucket|Bucket not found/i.test(body)) return `the “${BUCKET}” storage bucket doesn’t exist yet`;
		if (/NoSuchKey|not_found|Object not found/i.test(body)) return null;
		if (res.status === 402 || /restricted|quota/i.test(body)) return "your Supabase project is over its usage quota";
		return null;
	} catch {
		return null;
	}
}
var lastSig = "";
var inflight = null;
/**
* Stale-while-revalidate: cached songs render instantly when the page opens;
* a single background refresh picks up any newly-uploaded files. Only ONE
* list request is ever in flight.
*/
function loadSongs() {
	if (inflight) return;
	inflight = (async () => {
		try {
			const names = await listAllFiles();
			const songs = buildSongs(names);
			const sig = songs.map((s) => s.path).join("\n");
			if (sig !== lastSig) {
				lastSig = sig;
				const curPath = state.index >= 0 ? state.songs[state.index]?.path : null;
				state.songs = songs;
				state.index = curPath ? songs.findIndex((s) => s.path === curPath) : state.index >= 0 ? -1 : state.index;
			}
			state.songsError = names.length === 0 ? await diagnoseEmptyBucket() : null;
		} catch (e) {
			if (state.songs.length === 0) state.songsError = e instanceof Error ? e.message : "Could not load songs";
		} finally {
			state.songsLoaded = true;
			inflight = null;
			notify();
		}
	})();
}
function fmtTime(sec) {
	if (!Number.isFinite(sec) || sec < 0) return "0:00";
	const m = Math.floor(sec / 60);
	const s = Math.floor(sec % 60);
	return `${m}:${s < 10 ? "0" : ""}${s}`;
}
var musicStore = {
	subscribe(cb) {
		listeners.add(cb);
		return () => {
			listeners.delete(cb);
		};
	},
	getSnapshot() {
		return snap;
	},
	loadSongs,
	playIndex,
	toggle,
	next,
	prev,
	seek,
	stop,
	setVolume,
	getVolume,
	audioEl: ensureAudio
};
var NowPlayingBar = (0, import_react.memo)(function NowPlayingBar({ onOpen }) {
	const st = (0, import_react.useSyncExternalStore)(musicStore.subscribe, musicStore.getSnapshot);
	const song = st.index >= 0 ? st.songs[st.index] : null;
	const hasSong = !!song;
	const fillRef = (0, import_react.useRef)(null);
	const trackRef = (0, import_react.useRef)(null);
	const curRef = (0, import_react.useRef)(null);
	const durRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!hasSong) return;
		const a = musicStore.audioEl();
		const paint = () => {
			const d = a.duration;
			const p = Number.isFinite(d) && d > 0 ? a.currentTime / d : 0;
			if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`;
			if (curRef.current) curRef.current.textContent = fmtTime(a.currentTime);
			if (durRef.current) durRef.current.textContent = Number.isFinite(d) && d > 0 ? fmtTime(d) : "–:––";
		};
		paint();
		a.addEventListener("timeupdate", paint);
		a.addEventListener("loadedmetadata", paint);
		a.addEventListener("durationchange", paint);
		a.addEventListener("seeked", paint);
		a.addEventListener("emptied", paint);
		return () => {
			a.removeEventListener("timeupdate", paint);
			a.removeEventListener("loadedmetadata", paint);
			a.removeEventListener("durationchange", paint);
			a.removeEventListener("seeked", paint);
			a.removeEventListener("emptied", paint);
		};
	}, [hasSong, st.index]);
	if (!song) return null;
	const seekFromPointer = (e) => {
		const el = trackRef.current;
		if (!el) return;
		const r = el.getBoundingClientRect();
		const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
		const a = musicStore.audioEl();
		if (Number.isFinite(a.duration) && a.duration > 0) {
			musicStore.seek(frac * a.duration);
			if (fillRef.current) fillRef.current.style.transform = `scaleX(${frac})`;
		}
	};
	const iconBtn = {
		width: 32,
		height: 32,
		borderRadius: 999,
		border: "1px solid var(--hdr-btn-border)",
		background: "var(--hdr-btn-bg)",
		color: "var(--hdr-fg)",
		flexShrink: 0,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		cursor: "pointer",
		padding: 0,
		lineHeight: 1,
		WebkitTapHighlightColor: "transparent",
		boxShadow: "var(--hdr-btn-shadow)"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "now-playing-dock",
		className: "hb-now-playing-bar",
		role: "button",
		tabIndex: 0,
		"aria-label": `Now playing: ${song.title}. Open music page`,
		title: "Open music",
		onClick: () => {
			haptics.light();
			onOpen();
		},
		onKeyDown: (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onOpen();
			}
		},
		style: {
			flexBasis: "100%",
			width: "100%",
			order: 99,
			minWidth: 0,
			display: "flex",
			alignItems: "center",
			gap: 10,
			padding: "6px 8px 6px 8px",
			borderRadius: 14,
			cursor: "pointer",
			color: "var(--hdr-fg)",
			background: "var(--hdr-btn-bg)",
			border: "1px solid var(--hdr-btn-border)",
			boxShadow: "var(--hdr-btn-shadow)",
			WebkitTapHighlightColor: "transparent",
			userSelect: "none",
			WebkitUserSelect: "none"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				style: {
					width: 34,
					height: 34,
					borderRadius: 10,
					flexShrink: 0,
					display: "flex",
					alignItems: "flex-end",
					justifyContent: "center",
					gap: 2.5,
					padding: "0 0 8px",
					background: "linear-gradient(135deg, #ff8fab 0%, #ff4d7a 55%, #c9184a 100%)",
					boxShadow: "0 4px 12px -4px rgba(201,24,74,0.55), inset 0 1px 0 rgba(255,255,255,0.35)"
				},
				children: [
					0,
					1,
					2
				].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hb-eq-bar",
					"data-playing": st.playing && !st.buffering ? "" : void 0,
					style: {
						width: 3,
						height: 12,
						borderRadius: 2,
						background: "rgba(255,255,255,0.95)",
						transformOrigin: "bottom",
						animationDelay: `${i * .18}s`
					}
				}, i))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					flex: 1,
					minWidth: 0,
					display: "flex",
					flexDirection: "column",
					gap: 4
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "baseline",
						gap: 6,
						minWidth: 0
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"data-testid": "now-playing-title",
						style: {
							flex: 1,
							minWidth: 0,
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
							fontFamily: "'Cormorant Garamond', serif",
							fontSize: 14,
							fontWeight: 700,
							letterSpacing: "0.01em",
							lineHeight: 1.15
						},
						children: song.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						style: {
							flexShrink: 0,
							fontSize: 10.5,
							fontWeight: 600,
							opacity: .7,
							letterSpacing: "0.03em",
							fontVariantNumeric: "tabular-nums",
							fontFamily: "'Cormorant Garamond', serif"
						},
						children: st.buffering ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"data-testid": "now-playing-buffering",
							children: "loading…"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								ref: curRef,
								children: "0:00"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								style: { opacity: .6 },
								children: " / "
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								ref: durRef,
								children: "–:––"
							})
						] })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					ref: trackRef,
					"data-testid": "now-playing-progress",
					role: "slider",
					"aria-label": "Seek",
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					onClick: (e) => e.stopPropagation(),
					onPointerDown: (e) => {
						e.stopPropagation();
						seekFromPointer(e);
					},
					style: {
						position: "relative",
						height: 10,
						display: "flex",
						alignItems: "center",
						cursor: "pointer",
						touchAction: "none"
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							position: "relative",
							width: "100%",
							height: 3,
							borderRadius: 999,
							overflow: "hidden",
							background: "color-mix(in srgb, var(--hdr-fg) 18%, transparent)"
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							ref: fillRef,
							"data-testid": "now-playing-fill",
							style: {
								position: "absolute",
								inset: 0,
								transformOrigin: "left center",
								transform: "scaleX(0)",
								background: "linear-gradient(90deg, #ff6b9d, #c9184a)",
								borderRadius: 999,
								willChange: "transform"
							}
						})
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"data-testid": "now-playing-toggle",
				"aria-label": st.playing ? "Pause music" : "Play music",
				title: st.playing ? "Pause" : "Play",
				onClick: (e) => {
					e.stopPropagation();
					haptics.light();
					musicStore.toggle();
				},
				style: {
					...iconBtn,
					width: 34,
					height: 34,
					background: "linear-gradient(135deg, #ff6b9d, #c9184a)",
					border: "none",
					color: "#fff",
					fontSize: 12
				},
				children: st.playing ? "❚❚" : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					style: { marginLeft: 2 },
					children: "▶"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"data-testid": "now-playing-next",
				"aria-label": "Next song",
				title: "Next",
				onClick: (e) => {
					e.stopPropagation();
					haptics.light();
					musicStore.next();
				},
				style: {
					...iconBtn,
					fontSize: 13
				},
				children: "⏭"
			})
		]
	});
});
/** The 6 quick-reaction emojis, in the exact order requested (heart first). */
var QUICK_REACTIONS = [
	"❤️",
	"😘",
	"😭",
	"😂",
	"🫂",
	"💋"
];
/** Full react-with-any-emoji set (user-provided, de-duplicated, order preserved). */
var FULL_EMOJI = Array.from(/* @__PURE__ */ new Set([
	"❤️",
	"♥️",
	"💓",
	"💗",
	"💞",
	"🥲",
	"🥹",
	"😌",
	"🫠",
	"🤭",
	"😻",
	"🙈",
	"😛",
	"💌",
	"☺️",
	"😇",
	"🤣",
	"😆",
	"😁",
	"😊",
	"😍",
	"😜",
	"😝",
	"😋",
	"🥳",
	"🤩",
	"😎",
	"🤓",
	"😢",
	"🥺",
	"😠",
	"🤯",
	"😳",
	"😡",
	"😱",
	"😰",
	"😥",
	"😓",
	"🤗",
	"🙄",
	"🫪",
	"🫩",
	"🥱",
	"😴",
	"😲",
	"😮‍💨",
	"🤑",
	"🤕",
	"🤧",
	"🤡",
	"👺",
	"👻",
	"💀",
	"☠️",
	"👽",
	"🎃",
	"😹",
	"😸",
	"😽",
	"😼",
	"😺",
	"🙀",
	"😿",
	"🫶🏻",
	"🤲🏻",
	"😾",
	"👐🏻",
	"👍🏻",
	"🫰🏻",
	"🤟🏻",
	"👌🏻",
	"🤞🏻",
	"👋🏻",
	"🙏🏻",
	"👅",
	"👄",
	"🤦🏻‍♂️",
	"🧏🏻",
	"🙅🏻",
	"💦",
	"🧡",
	"💛",
	"💜",
	"💙",
	"🩵",
	"🩷",
	"💚",
	"🖤",
	"🩶",
	"🤍",
	"🤎",
	"❣️",
	"❤️‍🩹",
	"❤️‍🔥",
	"💕",
	"💝",
	"💘",
	"💖",
	"✅",
	"✔️"
]));
var SEG = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(void 0, { granularity: "grapheme" }) : null;
var EMOJI_RE = /(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F|\u200D|[\u{1F3FB}-\u{1F3FF}]|[\u{1F1E6}-\u{1F1FF}])/u;
function graphemes(text) {
	if (SEG) return Array.from(SEG.segment(text), (s) => s.segment);
	return Array.from(text);
}
/**
* If a message is ONLY emoji (no letters/numbers/other text), returns the emoji
* count so the caller can render it "jumbo". Returns 0 for mixed/plain text.
*/
function emojiOnlyCount(text) {
	if (!text) return 0;
	const trimmed = text.trim();
	if (!trimmed) return 0;
	const clusters = graphemes(trimmed).filter((g) => g.trim().length > 0);
	if (clusters.length === 0 || clusters.length > 200) return 0;
	return clusters.every((g) => EMOJI_RE.test(g)) ? clusters.length : 0;
}
/**
* Font size (px) for a jumbo emoji-only message. Like Instagram, emojis stay
* big no matter how many are sent — they simply wrap onto more lines.
*/
function jumboFontSize(count) {
	if (count <= 0) return 0;
	if (count === 1) return 64;
	if (count === 2) return 58;
	return 52;
}
var EMOJI_KEYWORDS = {
	"❤️": "heart love red",
	"♥️": "heart love",
	"💓": "heart beat love",
	"💗": "heart grow love pink",
	"💞": "heart love revolve",
	"💕": "hearts love two",
	"💝": "heart gift love",
	"💘": "heart arrow cupid love",
	"💖": "heart sparkle love",
	"🧡": "heart orange",
	"💛": "heart yellow",
	"💜": "heart purple",
	"💙": "heart blue",
	"🩵": "heart light blue",
	"🩷": "heart pink",
	"💚": "heart green",
	"🖤": "heart black",
	"🩶": "heart grey gray",
	"🤍": "heart white",
	"🤎": "heart brown",
	"❣️": "heart exclamation love",
	"❤️‍🩹": "heart mending healing love",
	"❤️‍🔥": "heart fire burning love",
	"😍": "love eyes heart smile",
	"😘": "kiss blow love",
	"😗": "kiss",
	"💋": "kiss lips lipstick",
	"😻": "cat heart eyes love",
	"🥰": "smile hearts love",
	"😂": "laugh cry joy tears",
	"🤣": "rofl laugh rolling",
	"😆": "laugh grin",
	"😁": "grin smile",
	"😊": "smile happy blush",
	"☺️": "smile relaxed",
	"😇": "angel innocent smile",
	"😭": "cry sob tears sad",
	"🥺": "pleading puppy eyes",
	"🥲": "smile tear happy sad",
	"🥹": "holding tears touched",
	"😢": "cry sad tear",
	"😳": "flushed shock",
	"🤭": "giggle shy hand",
	"🙈": "monkey see shy",
	"😴": "sleep zzz tired",
	"🥱": "yawn tired sleepy",
	"😠": "angry mad",
	"😡": "rage angry mad",
	"🤯": "mind blown shock",
	"😱": "scream fear shock",
	"🤗": "hug hands",
	"🫂": "hug people embrace",
	"🥳": "party celebrate hat",
	"🤩": "star struck excited",
	"😎": "cool sunglasses",
	"🤓": "nerd glasses",
	"👍🏻": "thumbs up yes ok",
	"🙏🏻": "pray thanks please",
	"🫶🏻": "heart hands love",
	"👌🏻": "ok perfect",
	"🙀": "cat scream shock",
	"😾": "cat angry",
	"💀": "skull dead",
	"👻": "ghost boo",
	"✅": "check done yes tick",
	"✔️": "check tick done",
	"💦": "sweat water drops"
};
function searchEmoji(query) {
	const q = query.trim().toLowerCase();
	if (!q) return FULL_EMOJI;
	const hits = FULL_EMOJI.filter((e) => (EMOJI_KEYWORDS[e] ?? "").includes(q));
	return hits.length > 0 ? hits : FULL_EMOJI;
}
function Svg({ size = 24, children, ...rest }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		width: size,
		height: size,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 1.9,
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": true,
		...rest,
		children
	});
}
var IconBack = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Svg, {
	...p,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M15 4.5 7.5 12l7.5 7.5" })
});
var IconChevronRight = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Svg, {
	...p,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m9 5 7 7-7 7" })
});
var IconChevronUp = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Svg, {
	...p,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m5 15 7-7 7 7" })
});
var IconChevronDown = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Svg, {
	...p,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m5 9 7 7 7-7" })
});
var IconClose = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Svg, {
	...p,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M6 6l12 12M18 6 6 18" })
});
var IconPhone = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Svg, {
	...p,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5.2 3.5h3.1l1.6 4.2-2.1 1.4a11.5 11.5 0 0 0 7.1 7.1l1.4-2.1 4.2 1.6v3.1a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 3.2 5.7a2 2 0 0 1 2-2.2Z" })
});
var IconSearch = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
		cx: "10.8",
		cy: "10.8",
		r: "6.8"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m16 16 4.5 4.5" })]
});
var IconMusic = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9 18V5.5l11-2V16" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "6.5",
			cy: "18",
			r: "2.5"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "17.5",
			cy: "16",
			r: "2.5"
		})
	]
});
var IconCamera = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3.5 8.5a2 2 0 0 1 2-2h2l1.6-2.2h5.8l1.6 2.2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
		cx: "12",
		cy: "12.8",
		r: "3.6"
	})]
});
var IconMic = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
		x: "8.5",
		y: "2.8",
		width: "7",
		height: "12",
		rx: "3.5"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5 11.5a7 7 0 0 0 14 0M12 18.5v3" })]
});
var IconGallery = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: "3",
			y: "3",
			width: "18",
			height: "18",
			rx: "4.5"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "9",
			cy: "9",
			r: "1.6"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m3.5 17.5 5-5.2a1.5 1.5 0 0 1 2.2 0L15 17l2-2a1.5 1.5 0 0 1 2.1 0l1.6 1.6" })
	]
});
var IconSticker = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M20.5 12.5V8A4.5 4.5 0 0 0 16 3.5H8A4.5 4.5 0 0 0 3.5 8v8A4.5 4.5 0 0 0 8 20.5h4.5Z" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12.5 20.5c0-4.4 3.6-8 8-8" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8.5 9.5v.5M14.5 9.5v.5M8.5 14.2c.9.8 2 1.2 3.2 1.2" })
	]
});
var IconSmile = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "12",
			cy: "12",
			r: "9"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9 9.6v.6M15 9.6v.6" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8.2 14.2a5 5 0 0 0 7.6 0" })
	]
});
var IconPlus = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
		cx: "12",
		cy: "12",
		r: "9"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 7.8v8.4M7.8 12h8.4" })]
});
var IconReply = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M10 6 4 12l6 6" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4.5 12H14a6 6 0 0 1 6 6v1" })]
});
var IconCopy = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
		x: "8.5",
		y: "8.5",
		width: "12",
		height: "12",
		rx: "2.5"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5" })]
});
var IconEdit = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Svg, {
	...p,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M14.5 5.5 18.5 9.5M4 20l1-4.6L15.6 4.8a2 2 0 0 1 2.8 0l.8.8a2 2 0 0 1 0 2.8L8.6 19 4 20Z" })
});
var IconUnsend = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Svg, {
	...p,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" })
});
var IconMore = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "5.5",
			cy: "12",
			r: "1",
			fill: "currentColor"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "12",
			cy: "12",
			r: "1",
			fill: "currentColor"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "18.5",
			cy: "12",
			r: "1",
			fill: "currentColor"
		})
	]
});
var IconDownload = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Svg, {
	...p,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 4v11M7 10.5l5 5 5-5M5 20h14" })
});
var IconGif = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
		x: "3",
		y: "5",
		width: "18",
		height: "14",
		rx: "3.5"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M10 10.2a2 2 0 1 0 0 3.6V12H9M13 9.5v5M16 14.5v-5h2.2M16 12h1.8" })]
});
var IconPlay = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
	width: p.size ?? 24,
	height: p.size ?? 24,
	viewBox: "0 0 24 24",
	"aria-hidden": true,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
		d: "M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z",
		fill: "currentColor"
	})
});
var IconPause = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
	width: p.size ?? 24,
	height: p.size ?? 24,
	viewBox: "0 0 24 24",
	"aria-hidden": true,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
		x: "6",
		y: "4.5",
		width: "4",
		height: "15",
		rx: "1.2",
		fill: "currentColor"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
		x: "14",
		y: "4.5",
		width: "4",
		height: "15",
		rx: "1.2",
		fill: "currentColor"
	})]
});
var IconSend = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Svg, {
	...p,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M21 3 10.2 13.8M21 3l-6.8 18-4-7.2L3 9.8 21 3Z" })
});
var IconLock = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
		x: "5",
		y: "10.5",
		width: "14",
		height: "10",
		rx: "2.5"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 10.5V7.5a4 4 0 0 1 8 0v3" })]
});
var IconTrash = IconUnsend;
var IconPalette = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Z" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "7.5",
			cy: "11.5",
			r: "1",
			fill: "currentColor"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "10",
			cy: "7.5",
			r: "1",
			fill: "currentColor"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "15",
			cy: "7.5",
			r: "1",
			fill: "currentColor"
		})
	]
});
var IconAlarm = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
		cx: "12",
		cy: "13",
		r: "7.5"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 9.5V13l2.5 1.8M4 5l3-2.5M20 5l-3-2.5" })]
});
var IconVideo = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
		x: "2.5",
		y: "6",
		width: "13.5",
		height: "12",
		rx: "3"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m16 10.5 5.5-3v9l-5.5-3" })]
});
var IconFile = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8Z" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M14 3.5V8h4.5" })]
});
var IconLayers = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
		x: "7",
		y: "3",
		width: "14",
		height: "14",
		rx: "3"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M17 21H6a3 3 0 0 1-3-3V7" })]
});
var IconUndo = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 9h11a5 5 0 0 1 0 10h-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m8 4.5-4 4.5 4 4.5" })]
});
var IconBrush = (p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Svg, {
	...p,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M13.5 6.5 17.5 10.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9.6 19.2c-1.3 1.3-4.6 1.9-5.6.9s-.4-4.3.9-5.6L15.6 3.8a2 2 0 0 1 2.8 0l1.8 1.8a2 2 0 0 1 0 2.8Z" })]
});
var BARS = 30;
function hashBars(url) {
	let h = 2166136261;
	for (let i = 0; i < url.length; i++) {
		h ^= url.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return Array.from({ length: BARS }, (_, i) => {
		h ^= h << 13;
		h ^= h >>> 17;
		h ^= h << 5;
		const r = (h >>> 0) % 1e3 / 1e3;
		return .25 + .75 * Math.abs(Math.sin(i * .55 + r * 2.4)) * (.55 + r * .45);
	});
}
function peaksOf(buf) {
	const data = buf.getChannelData(0);
	const step = Math.max(1, Math.floor(data.length / BARS));
	const out = [];
	let max = 1e-4;
	for (let b = 0; b < BARS; b++) {
		let sum = 0;
		const start = b * step;
		for (let i = start; i < Math.min(data.length, start + step); i += 16) sum += Math.abs(data[i]);
		const v = sum / (step / 16);
		out.push(v);
		if (v > max) max = v;
	}
	return out.map((v) => .18 + .82 * (v / max));
}
var activeStop = null;
function VoiceBubble({ url, durationMs }) {
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [failed, setFailed] = (0, import_react.useState)(false);
	const [cur, setCur] = (0, import_react.useState)(0);
	const [total, setTotal] = (0, import_react.useState)(durationMs);
	const [bars, setBars] = (0, import_react.useState)(() => hashBars(url));
	const ctxRef = (0, import_react.useRef)(null);
	const bufRef = (0, import_react.useRef)(null);
	const srcRef = (0, import_react.useRef)(null);
	const startRef = (0, import_react.useRef)(0);
	const offsetRef = (0, import_react.useRef)(0);
	const rafRef = (0, import_react.useRef)(0);
	const gainRef = (0, import_react.useRef)(1);
	const decodeRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => () => {
		cancelAnimationFrame(rafRef.current);
		try {
			srcRef.current?.stop();
		} catch {}
		if (ctxRef.current) try {
			ctxRef.current.close();
		} catch {}
	}, []);
	const ensure = () => {
		if (bufRef.current) return Promise.resolve(true);
		if (decodeRef.current) return decodeRef.current;
		decodeRef.current = (async () => {
			setLoading(true);
			try {
				const AC = window.AudioContext || window.webkitAudioContext;
				const ctx = ctxRef.current ?? new AC();
				ctxRef.current = ctx;
				if (ctx.state === "suspended") try {
					await ctx.resume();
				} catch {}
				const res = await fetch(url, {
					mode: "cors",
					cache: "force-cache"
				});
				if (!res.ok) throw new Error(String(res.status));
				const arr = await res.arrayBuffer();
				const buf = await new Promise((resolve, reject) => {
					const p = ctx.decodeAudioData(arr.slice(0), resolve, reject);
					if (p && typeof p.then === "function") p.then(resolve, reject);
				});
				bufRef.current = buf;
				const data = buf.getChannelData(0);
				let peak = 1e-4;
				let sum = 0;
				let n = 0;
				for (let i = 0; i < data.length; i += 8) {
					const a = Math.abs(data[i]);
					if (a > peak) peak = a;
					if (a > .01) {
						sum += a * a;
						n++;
					}
				}
				const rms = n ? Math.sqrt(sum / n) : 0;
				gainRef.current = Math.min(6.3, Math.max(1, Math.min(rms > 5e-4 ? .126 / rms : 1, .97 / peak * 1.6)));
				setBars(peaksOf(buf));
				if (isFinite(buf.duration) && buf.duration > 0) setTotal(Math.round(buf.duration * 1e3));
				setFailed(false);
				return true;
			} catch {
				setFailed(true);
				decodeRef.current = null;
				return false;
			} finally {
				setLoading(false);
			}
		})();
		return decodeRef.current;
	};
	const pause = () => {
		const ctx = ctxRef.current;
		if (!ctx || !srcRef.current) return;
		offsetRef.current = Math.min(bufRef.current?.duration ?? 0, ctx.currentTime - startRef.current);
		const src = srcRef.current;
		srcRef.current = null;
		try {
			src.stop();
		} catch {}
		cancelAnimationFrame(rafRef.current);
		setPlaying(false);
		if (activeStop === pause) activeStop = null;
	};
	const play = () => {
		const ctx = ctxRef.current;
		const buf = bufRef.current;
		if (!ctx || !buf) return;
		if (activeStop && activeStop !== pause) activeStop();
		activeStop = pause;
		if (ctx.state === "suspended") ctx.resume();
		const src = ctx.createBufferSource();
		src.buffer = buf;
		const gain = ctx.createGain();
		gain.gain.value = gainRef.current;
		const limiter = ctx.createDynamicsCompressor();
		limiter.threshold.value = -1;
		limiter.knee.value = 0;
		limiter.ratio.value = 20;
		limiter.attack.value = .001;
		limiter.release.value = .06;
		src.connect(gain).connect(limiter).connect(ctx.destination);
		const from = Math.max(0, Math.min(buf.duration - .01, offsetRef.current));
		src.start(0, from);
		startRef.current = ctx.currentTime - from;
		srcRef.current = src;
		setPlaying(true);
		src.onended = () => {
			if (srcRef.current !== src) return;
			srcRef.current = null;
			offsetRef.current = 0;
			setCur(0);
			setPlaying(false);
			cancelAnimationFrame(rafRef.current);
		};
		const tick = () => {
			const c = ctxRef.current;
			if (!c || srcRef.current !== src) return;
			setCur(Math.round(Math.min(buf.duration, c.currentTime - startRef.current) * 1e3));
			rafRef.current = requestAnimationFrame(tick);
		};
		rafRef.current = requestAnimationFrame(tick);
	};
	const toggle = async () => {
		if (playing) return pause();
		if (await ensure()) play();
	};
	const seek = async (pct) => {
		if (!await ensure() || !bufRef.current) return;
		offsetRef.current = pct * bufRef.current.duration;
		setCur(Math.round(offsetRef.current * 1e3));
		if (playing) {
			const s = srcRef.current;
			srcRef.current = null;
			try {
				s?.stop();
			} catch {}
			play();
		}
	};
	const length = total || durationMs || 1;
	const progress = Math.min(1, cur / length);
	const barEls = (0, import_react.useMemo)(() => bars.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "ig-wave-bar",
		"data-on": (i + .5) / BARS <= progress ? "" : void 0,
		style: { height: `${Math.round(b * 100)}%` }
	}, i)), [bars, progress]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ig-voice",
		"data-testid": "voice-bubble",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "ig-voice-play",
				"data-testid": "voice-play-btn",
				onClick: (e) => {
					e.stopPropagation();
					toggle();
				},
				"aria-label": playing ? "Pause voice message" : "Play voice message",
				children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ig-spin" }) : failed ? "!" : playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPause, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPlay, { size: 18 })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "ig-wave",
				onClick: (e) => {
					e.stopPropagation();
					const r = e.currentTarget.getBoundingClientRect();
					seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
				},
				children: barEls
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "ig-voice-time",
				children: fmtDuration(playing || cur > 0 ? cur : length)
			})
		]
	});
}
/** Emoji-only messages render big and bubble-less, however many there are. */
function jumboSize(msg) {
	if (msg.type !== "text") return 0;
	return jumboFontSize(emojiOnlyCount(msg.text));
}
/** True when the content renders without a coloured bubble. */
function isBare(msg) {
	return msg.type === "sticker" || msg.type === "gif" || msg.type === "image" || msg.type === "video" || jumboSize(msg) > 0;
}
/**
* Drawings (Doodle → "Draw") are uploaded through the same storage path as
* photos (`chat-media/image/...`) but saved as `type: "sticker"` so they get
* the bare, no-bubble-chrome rendering of a sticker. Real stickers/GIFs come
* either from an external CDN (GIPHY) or the `sticker/custom/` prefix, so
* this check never collides with either — no DB migration needed to tell
* "I drew this" apart from "I sent a sticker".
*/
function isDrawingMedia(url) {
	return !!url && url.includes("/chat-media/image/");
}
function isDrawingMessage(msg) {
	return msg.type === "sticker" && isDrawingMedia(msg.mediaUrl);
}
function escapeRe(s) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function highlight(text, term) {
	const q = term.trim();
	if (!q) return text;
	return text.split(new RegExp(`(${escapeRe(q)})`, "gi")).map((p, i) => p.toLowerCase() === q.toLowerCase() ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("mark", {
		className: "ig-mark",
		children: p
	}, i) : p);
}
function boxFor(w, h, maxW = 216, maxH = 300) {
	const aspect = w && h ? w / h : 3 / 4;
	let bw = maxW;
	let bh = Math.round(bw / aspect);
	if (bh > maxH) {
		bh = maxH;
		bw = Math.max(150, Math.round(bh * aspect));
	}
	if (bh < 130) bh = 130;
	return {
		width: bw,
		height: bh
	};
}
var onImgLoad = (e) => {
	e.currentTarget.dataset.loaded = "";
};
function Photo({ url, w, h, onOpen }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "ig-media",
		style: boxFor(w, h),
		onClick: (e) => onOpen(e.currentTarget.getBoundingClientRect()),
		"data-testid": "chat-photo",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: url,
			alt: "",
			loading: "lazy",
			decoding: "async",
			onLoad: onImgLoad,
			draggable: false
		})
	});
}
function VideoThumb({ url, w, h, durationMs, onOpen, small }) {
	const src = url.startsWith("blob:") ? url : `${url}#t=0.1`;
	const inner = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
			src,
			preload: "metadata",
			muted: true,
			playsInline: true,
			tabIndex: -1
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "ig-media-play",
			"aria-hidden": true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPlay, { size: small ? 16 : 22 })
		}),
		durationMs ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "ig-media-dur",
			children: fmtDuration(durationMs)
		}) : null
	] });
	if (!onOpen) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "ig-media ig-media-video",
		children: inner
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "ig-media ig-media-video",
		style: boxFor(w, h),
		onClick: (e) => onOpen(e.currentTarget.getBoundingClientRect()),
		"data-testid": "chat-video-bubble",
		children: inner
	});
}
function GroupStack({ items, mine, progress, onOpen }) {
	const back = items.slice(1, 3);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: "ig-stack",
		"data-side": mine ? "out" : "in",
		onClick: (e) => onOpen(e.currentTarget.getBoundingClientRect()),
		"data-testid": "chat-media-group",
		"aria-label": `${items.length} photos and videos`,
		children: [back.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `ig-stack-card ig-stack-back${i}`,
			children: it.kind === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoThumb, {
				url: it.url,
				small: true
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: it.url,
				alt: "",
				loading: "lazy",
				decoding: "async",
				onLoad: onImgLoad,
				draggable: false
			})
		}, i)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "ig-stack-card ig-stack-front",
			children: [
				items[0].kind === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoThumb, {
					url: items[0].url,
					small: true
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: items[0].url,
					alt: "",
					loading: "lazy",
					decoding: "async",
					onLoad: onImgLoad,
					draggable: false
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "ig-stack-count",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconLayers, { size: 14 }),
						" ",
						items.length
					]
				}),
				progress && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ig-stack-progress",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { transform: `scaleX(${progress.total ? progress.done / progress.total : 0})` } })
				})
			]
		})]
	});
}
function FileCard({ msg, uploading }) {
	const meta = [formatBytes(msg.fileSize), (msg.mimeType || "").split("/")[1]?.toUpperCase()].filter(Boolean).join(" · ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ig-file",
		"data-testid": "chat-file-media",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "ig-file-icon",
				children: uploading ? "…" : fileGlyph(msg.mimeType, msg.fileName)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "ig-file-text",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ig-file-name",
					children: msg.fileName || "File"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ig-file-meta",
					children: uploading ? "Uploading…" : meta
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "ig-file-dl",
				disabled: uploading,
				"aria-label": "Download file",
				"data-testid": "chat-file-download",
				onClick: (e) => {
					e.stopPropagation();
					haptics.light();
					downloadMedia(msg.mediaUrl, "file", {
						filename: msg.fileName,
						mime: msg.mimeType,
						ts: msg.timestamp
					});
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconDownload, { size: 18 })
			})
		]
	});
}
function BubbleContent({ msg, mine, term, uploading, progress, compressPct, onOpenMedia }) {
	const open = (items, i) => (r) => onOpenMedia(items, i, r, msg.timestamp);
	const jumbo = jumboSize(msg);
	let body = null;
	if (msg.type === "text") body = jumbo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "ig-jumbo",
		style: { fontSize: jumbo },
		children: msg.text
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "ig-text",
		children: highlight(msg.text ?? "", term)
	});
	else if (msg.type === "image" && msg.albumItems && msg.albumItems.length > 1) {
		const items = msg.albumItems.map((it) => ({
			url: it.url,
			kind: it.kind === "video" ? "video" : "image",
			w: it.w,
			h: it.h
		}));
		body = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GroupStack, {
			items: msg.albumItems,
			mine,
			progress,
			onOpen: open(items, 0)
		});
	} else if (msg.type === "image" && msg.mediaUrl) body = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Photo, {
		url: msg.mediaUrl,
		w: msg.mediaWidth,
		h: msg.mediaHeight,
		onOpen: open([{
			url: msg.mediaUrl,
			kind: "image",
			w: msg.mediaWidth,
			h: msg.mediaHeight
		}], 0)
	});
	else if (msg.type === "video" && msg.mediaUrl) body = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: { position: "relative" },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoThumb, {
			url: msg.mediaUrl,
			w: msg.mediaWidth,
			h: msg.mediaHeight,
			durationMs: msg.durationMs,
			onOpen: open([{
				url: msg.mediaUrl,
				kind: "video",
				w: msg.mediaWidth,
				h: msg.mediaHeight
			}], 0)
		}), compressPct != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "ig-media-busy",
			children: [
				"Compressing ",
				Math.round(compressPct * 100),
				"%"
			]
		})]
	});
	else if (msg.type === "sticker" && msg.mediaUrl && isDrawingMessage(msg)) body = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "ig-drawing",
		onClick: (e) => onOpenMedia([{
			url: msg.mediaUrl,
			kind: "sticker",
			w: msg.mediaWidth,
			h: msg.mediaHeight
		}], 0, e.currentTarget.getBoundingClientRect(), msg.timestamp),
		"data-testid": "chat-drawing-media",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: msg.mediaUrl,
			alt: "drawing",
			loading: "lazy",
			decoding: "async",
			draggable: false
		})
	});
	else if (msg.type === "sticker" && msg.mediaUrl) body = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "ig-sticker",
		"data-testid": "chat-sticker-media",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: msg.mediaUrl,
			alt: "sticker",
			loading: "lazy",
			decoding: "async",
			draggable: false
		})
	});
	else if (msg.type === "gif" && msg.mediaUrl) body = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "ig-gif",
		style: boxFor(msg.mediaWidth, msg.mediaHeight, 220, 260),
		"data-testid": "chat-gif-media",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: msg.mediaUrl,
			alt: "GIF",
			loading: "lazy",
			decoding: "async",
			onLoad: onImgLoad,
			draggable: false
		})
	});
	else if (msg.type === "voice" && msg.mediaUrl) body = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VoiceBubble, {
		url: msg.mediaUrl,
		durationMs: msg.durationMs ?? 0
	});
	else if (msg.type === "file" && msg.mediaUrl) body = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCard, {
		msg,
		uploading
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [body, uploading && msg.type !== "file" && !(msg.albumItems && msg.albumItems.length > 1) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "ig-sending",
		"aria-label": "Sending"
	})] });
}
var bubble_content_default = (0, import_react.memo)(BubbleContent);
function Avatar({ who, size = 28 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "ig-avatar",
		"data-who": who,
		style: {
			width: size,
			height: size,
			fontSize: size * .42
		},
		"aria-hidden": true,
		children: initial(who)
	});
}
function quoteText(s) {
	if (s.type === "text") return s.text || "";
	if (s.type === "image") return s.albumCount && s.albumCount > 1 ? `${s.albumCount} photos` : "Photo";
	if (s.type === "video") return `Video${s.durationMs ? ` · ${fmtDuration(s.durationMs)}` : ""}`;
	if (s.type === "voice") return `Voice message${s.durationMs ? ` · ${fmtDuration(s.durationMs)}` : ""}`;
	if (s.type === "sticker") return isDrawingMedia(s.mediaUrl) ? "Drawing" : "Sticker";
	if (s.type === "gif") return "GIF";
	return "File";
}
function Quote({ snap, missing, mine, quotedMine, onJump }) {
	const thumb = !missing && snap.mediaUrl && (snap.type === "image" || snap.type === "sticker" || snap.type === "gif");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "ig-quote-wrap",
		"data-side": mine ? "out" : "in",
		children: thumb ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "ig-quote-media",
			onClick: onJump,
			"data-testid": "reply-quote",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: snap.mediaUrl,
				alt: "",
				loading: "lazy",
				decoding: "async"
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "ig-quote",
			"data-qside": quotedMine ? "out" : "in",
			onClick: onJump,
			"data-testid": "reply-quote",
			children: missing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "Original message unavailable" }) : quoteText(snap)
		})
	});
}
function summarize(msg) {
	const r = msg.reactions;
	if (!r) return [];
	return Object.entries(r).filter(([, users]) => users.length > 0).map(([emoji, users]) => ({
		emoji,
		count: users.length
	}));
}
/** How far the row travels, and how far it must travel to fire the reply. */
var SWIPE_MAX = 78;
var SWIPE_TRIGGER = 44;
var spring$1 = {
	type: "spring",
	stiffness: 520,
	damping: 34,
	mass: .7
};
var bouncy = {
	type: "spring",
	stiffness: 420,
	damping: 15
};
function MessageRow(p) {
	const { msg, mine, handlers } = p;
	const lineRef = (0, import_react.useRef)(null);
	const bubbleRef = (0, import_react.useRef)(null);
	const g = (0, import_react.useRef)({
		x: 0,
		y: 0,
		t: 0,
		timer: 0,
		fired: false,
		swiping: false,
		moved: false,
		dx: 0,
		lastTap: 0,
		openTimer: 0
	});
	const bare = isBare(msg);
	const reactions = summarize(msg);
	const animRef = (0, import_react.useRef)(p.animate);
	const clearPress = () => {
		if (g.current.timer) {
			clearTimeout(g.current.timer);
			g.current.timer = 0;
		}
	};
	const resetSwipe = () => {
		const el = lineRef.current;
		if (!el) return;
		el.style.transition = "transform 280ms cubic-bezier(0.2, 0.9, 0.3, 1.2)";
		el.style.transform = "translate3d(0,0,0)";
		el.parentElement?.style.setProperty("--swipe", "0");
		window.setTimeout(() => {
			if (el) el.style.transition = "";
		}, 300);
	};
	const onPointerDown = (e) => {
		if (e.button !== 0) return;
		const s = g.current;
		s.x = e.clientX;
		s.y = e.clientY;
		s.t = Date.now();
		s.fired = false;
		s.swiping = false;
		s.moved = false;
		s.dx = 0;
		clearPress();
		s.timer = window.setTimeout(() => {
			s.timer = 0;
			if (s.moved) return;
			s.fired = true;
			haptics.medium();
			if (bubbleRef.current) handlers.onLongPress(msg, bubbleRef.current);
		}, 420);
	};
	const onPointerMove = (e) => {
		const s = g.current;
		if (!s.t) return;
		const dx = e.clientX - s.x;
		const dy = e.clientY - s.y;
		if (!s.moved && Math.hypot(dx, dy) > 9) {
			s.moved = true;
			clearPress();
		}
		if (!s.swiping && s.moved && dx > 8 && Math.abs(dx) > Math.abs(dy) * 1.1) s.swiping = true;
		if (s.swiping && lineRef.current) {
			const shift = Math.max(0, Math.min(SWIPE_MAX, dx * .72));
			if (s.dx < SWIPE_TRIGGER && shift >= SWIPE_TRIGGER) haptics.selection();
			s.dx = shift;
			lineRef.current.style.transform = `translate3d(${shift}px,0,0)`;
			lineRef.current.parentElement?.style.setProperty("--swipe", String(Math.min(1, shift / SWIPE_TRIGGER)));
		}
	};
	(0, import_react.useEffect)(() => {
		const el = bubbleRef.current;
		if (!el) return;
		const onTouchMove = (ev) => {
			const s = g.current;
			if (!s.t || ev.touches.length !== 1) return;
			const t = ev.touches[0];
			const dx = t.clientX - s.x;
			const dy = t.clientY - s.y;
			if (s.swiping || dx > 8 && Math.abs(dx) > Math.abs(dy) * 1.1) {
				s.swiping = true;
				if (ev.cancelable) ev.preventDefault();
			}
		};
		el.addEventListener("touchmove", onTouchMove, { passive: false });
		return () => el.removeEventListener("touchmove", onTouchMove);
	}, []);
	const onPointerEnd = (e) => {
		const s = g.current;
		clearPress();
		if (s.swiping) {
			if (s.dx >= SWIPE_TRIGGER) handlers.onSwipeReply(msg);
			resetSwipe();
		} else if (!s.fired && !s.moved && e.type === "pointerup") {
			const now = Date.now();
			if (now - s.lastTap < 300) {
				s.lastTap = 0;
				if (s.openTimer) {
					clearTimeout(s.openTimer);
					s.openTimer = 0;
				}
				handlers.onDoubleTap(msg);
			} else s.lastTap = now;
		}
		s.t = 0;
		s.swiping = false;
	};
	const openMedia = (items, i, rect, ts) => {
		const s = g.current;
		if (s.fired) return;
		if (s.openTimer) clearTimeout(s.openTimer);
		s.openTimer = window.setTimeout(() => {
			s.openTimer = 0;
			handlers.onOpenMedia(items, i, rect, ts);
		}, 260);
	};
	const enter = animRef.current ? {
		initial: bare && (msg.type === "sticker" || msg.type === "gif") ? {
			opacity: 0,
			scale: .4,
			y: 24
		} : mine ? {
			opacity: 0,
			y: 18,
			scale: .92
		} : {
			opacity: 0,
			y: 8,
			scale: .97
		},
		animate: {
			opacity: 1,
			y: 0,
			scale: 1
		},
		transition: bare && (msg.type === "sticker" || msg.type === "gif") ? bouncy : spring$1
	} : {};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ig-row",
		"data-side": mine ? "out" : "in",
		"data-pos": p.pos,
		"data-testid": `msg-${msg.id}`,
		children: [
			p.timeLabel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "ig-time",
				children: p.timeLabel
			}),
			p.label && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "ig-label",
				children: p.label
			}),
			msg.replySnapshot && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quote, {
				snap: msg.replySnapshot,
				missing: p.quoteMissing,
				mine,
				quotedMine: msg.replySnapshot.sender !== p.other,
				onJump: () => msg.replyToId && handlers.onJumpTo(msg.replyToId)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ig-line-outer",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ig-swipe-icon",
					"aria-hidden": true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconReply, { size: 18 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ig-line",
					ref: lineRef,
					children: [!mine && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ig-avatar-slot",
						children: p.showAvatar && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, { who: p.other })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
						className: "ig-bubble-col",
						style: { transformOrigin: mine ? "100% 100%" : "0% 100%" },
						...enter,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							ref: bubbleRef,
							className: bare ? "ig-bare" : "ig-bubble",
							"data-pos": p.pos,
							"data-hidden": p.hidden ? "" : void 0,
							"data-current": p.current ? "" : void 0,
							"data-flash": p.flash ? "" : void 0,
							"data-has-reactions": reactions.length ? "" : void 0,
							onPointerDown,
							onPointerMove,
							onPointerUp: onPointerEnd,
							onPointerCancel: onPointerEnd,
							onContextMenu: (e) => {
								e.preventDefault();
								if (!g.current.fired && bubbleRef.current) {
									g.current.fired = true;
									handlers.onLongPress(msg, bubbleRef.current);
								}
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(bubble_content_default, {
								msg,
								mine,
								term: p.term,
								uploading: p.uploading,
								progress: p.progress,
								compressPct: p.compressPct,
								onOpenMedia: openMedia
							})
						}), reactions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ig-react-badge",
							"data-hidden": p.hidden ? "" : void 0,
							onClick: () => handlers.onOpenReactions(msg),
							"data-testid": "reaction-badge",
							"aria-label": "See reactions",
							children: reactions.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ig-react-item",
								children: [r.emoji, r.count > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ig-react-count",
									children: r.count
								})]
							}, r.emoji))
						})]
					})]
				})]
			}),
			msg.edited && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "ig-edited",
				children: "Edited"
			})
		]
	});
}
var message_row_default = (0, import_react.memo)(MessageRow);
var tap = { scale: .86 };
var swap = {
	initial: {
		opacity: 0,
		y: -8
	},
	animate: {
		opacity: 1,
		y: 0
	},
	exit: {
		opacity: 0,
		y: -8
	},
	transition: {
		type: "spring",
		stiffness: 520,
		damping: 38
	}
};
function Header(p) {
	const ref = (0, import_react.useRef)(null);
	const press = (0, import_react.useRef)({
		timer: 0,
		long: false
	});
	const onHeight = p.onHeight;
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		const ro = new ResizeObserver(() => onHeight(el.offsetHeight));
		ro.observe(el);
		onHeight(el.offsetHeight);
		return () => ro.disconnect();
	}, [onHeight]);
	const s = p.search;
	const counter = s.loading ? "…" : s.total > 0 ? `${s.index + 1} of ${s.total}` : s.done && s.query.trim() ? "No results" : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		ref,
		className: "ig-header",
		"data-testid": "chat-header",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
			initial: false,
			mode: "popLayout",
			children: s.open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
				className: "ig-header-row",
				...swap,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
						whileTap: tap,
						className: "ig-hbtn",
						onClick: p.onCloseSearch,
						"aria-label": "Close search",
						"data-testid": "chat-search-close",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconClose, { size: 22 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ig-search-pill",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconSearch, { size: 18 }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: p.inputRef,
								value: s.query,
								onChange: (e) => p.onQuery(e.target.value),
								onKeyDown: (e) => {
									if (e.key === "ArrowUp" || e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										p.onOlder();
									} else if (e.key === "ArrowDown" || e.key === "Enter" && e.shiftKey) {
										e.preventDefault();
										p.onNewer();
									} else if (e.key === "Escape") p.onCloseSearch();
								},
								type: "search",
								inputMode: "search",
								enterKeyHint: "search",
								autoComplete: "off",
								autoCorrect: "off",
								spellCheck: false,
								placeholder: "Search",
								"data-testid": "chat-search-input"
							}),
							counter && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ig-search-count",
								"data-testid": "chat-search-counter",
								children: counter
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
						whileTap: tap,
						className: "ig-hbtn ig-hbtn-sm",
						disabled: s.total === 0 || s.index >= s.total - 1,
						onClick: p.onOlder,
						"aria-label": "Older match",
						"data-testid": "chat-search-prev",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconChevronUp, { size: 20 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
						whileTap: tap,
						className: "ig-hbtn ig-hbtn-sm",
						disabled: s.total === 0 || s.index <= 0,
						onClick: p.onNewer,
						"aria-label": "Newer match",
						"data-testid": "chat-search-next",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconChevronDown, { size: 20 })
					})
				]
			}, "search") : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
				className: "ig-header-row",
				...swap,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
						whileTap: tap,
						className: "ig-hbtn",
						onClick: p.onBack,
						"aria-label": "Back to lock screen",
						"data-testid": "chat-back-btn",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBack, { size: 24 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "ig-profile",
						"data-testid": "chat-profile",
						onPointerDown: () => {
							press.current.long = false;
							press.current.timer = window.setTimeout(() => {
								press.current.long = true;
								haptics.medium();
								p.onIdentity();
							}, 480);
						},
						onPointerUp: () => clearTimeout(press.current.timer),
						onPointerLeave: () => clearTimeout(press.current.timer),
						onPointerCancel: () => clearTimeout(press.current.timer),
						onContextMenu: (e) => e.preventDefault(),
						onClick: () => {
							if (press.current.long) return;
							haptics.light();
							p.onProfile();
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
							who: p.other,
							size: 36
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ig-profile-text",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ig-profile-name",
								"data-testid": "chat-header-title",
								children: [
									fullName(p.other),
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconChevronRight, { size: 14 })
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ig-profile-user",
								children: username(p.other)
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
						whileTap: tap,
						className: "ig-hbtn",
						onClick: p.onMusic,
						"aria-label": "Open music",
						"data-testid": "chat-music-toggle",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconMusic, { size: 22 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
						whileTap: tap,
						className: "ig-hbtn",
						"data-active": p.ringing ? "" : void 0,
						onPointerDown: (e) => {
							if (e.button != null && e.button !== 0) return;
							p.onCall();
						},
						onClick: (e) => {
							e.preventDefault();
							p.onCall();
						},
						"aria-label": "Wake-up call",
						"data-testid": "chat-wake-toggle",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPhone, { size: 22 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
						whileTap: tap,
						className: "ig-hbtn",
						onClick: p.onOpenSearch,
						"aria-label": "Search messages",
						"data-testid": "chat-search-toggle",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconSearch, { size: 22 })
					})
				]
			}, "main")
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NowPlayingBar, { onOpen: p.onMusic })]
	});
}
var START = 1e6;
var SEPARATOR_GAP = 18e5;
function Typing({ other }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "ig-row",
		"data-side": "in",
		"data-pos": "single",
		"data-testid": "typing-indicator",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "ig-line",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "ig-avatar-slot",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, { who: other })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ig-typing",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {})
				]
			})]
		})
	});
}
var Scroller = (0, import_react.forwardRef)(function Scroller(props, ref) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		...props,
		ref,
		className: "ig-scroller",
		"data-testid": "chat-scroller"
	});
});
var ListHead = ({ context }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: "ig-list-head",
	children: context?.loadingOlder && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "ig-spin",
		"data-testid": "loading-older"
	})
});
var ListFoot = ({ context }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: "ig-list-foot",
	children: context?.otherTyping && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Typing, { other: context.other })
});
var COMPONENTS = {
	Scroller,
	Header: ListHead,
	Footer: ListFoot
};
function MessageList(p) {
	const { messages, me, other } = p;
	const firstIdx = (0, import_react.useRef)(START);
	const prevFirstId = (0, import_react.useRef)(null);
	const firstItemIndex = (0, import_react.useMemo)(() => {
		if (messages.length) {
			const prevId = prevFirstId.current;
			if (prevId && messages[0].id !== prevId) {
				const k = messages.findIndex((m) => m.id === prevId);
				if (k > 0) firstIdx.current -= k;
			}
			prevFirstId.current = messages[0].id;
		}
		return firstIdx.current;
	}, [messages]);
	const ids = (0, import_react.useMemo)(() => new Set(messages.map((m) => m.id)), [messages]);
	const sep = (i) => {
		const cur = messages[i];
		const prev = messages[i - 1];
		if (!cur) return false;
		return !prev || cur.timestamp - prev.timestamp > SEPARATOR_GAP;
	};
	const joins = (a, b, bIdx) => !!a && !!b && a.sender === b.sender && !sep(bIdx) && !b.replySnapshot;
	const itemContent = (index, m) => {
		const i = index - firstItemIndex;
		const mine = m.sender === me;
		const withPrev = joins(messages[i - 1], m, i);
		const withNext = joins(m, messages[i + 1], i + 1);
		const pos = withPrev && withNext ? "middle" : withPrev ? "last" : withNext ? "first" : "single";
		let label = null;
		if (m.replySnapshot) {
			const toMe = m.replySnapshot.sender === me;
			label = mine ? toMe ? "You replied to yourself" : "You replied" : toMe ? `${firstName(other)} replied to you` : `${firstName(other)} replied`;
		}
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(message_row_default, {
			msg: m,
			mine,
			pos,
			timeLabel: sep(i) ? fmtSeparator(m.timestamp) : null,
			showAvatar: !mine && (pos === "last" || pos === "single"),
			other,
			label,
			quoteMissing: !!m.replyToId && !ids.has(m.replyToId) && !p.hasMoreOlder,
			term: p.term,
			current: p.currentHitId === m.id,
			flash: p.flashId === m.id,
			hidden: p.liftedId === m.id,
			uploading: p.uploading.has(m.id),
			progress: p.progress[m.id] ?? null,
			compressPct: p.compressing?.id === m.id ? p.compressing.pct : null,
			animate: shouldAnimate(m.id, m.timestamp),
			handlers: p.handlers
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(es, {
		ref: p.listRef,
		className: "ig-virtuoso",
		data: messages,
		firstItemIndex,
		initialTopMostItemIndex: {
			index: Math.max(0, messages.length - 1),
			align: "end"
		},
		computeItemKey: (_, m) => m.id,
		itemContent,
		alignToBottom: true,
		followOutput: (atBottom) => atBottom && !p.detached ? "smooth" : false,
		atBottomThreshold: 90,
		atBottomStateChange: p.onAtBottom,
		startReached: () => {
			p.loadOlder();
		},
		endReached: () => {
			if (p.detached) p.loadNewer();
		},
		increaseViewportBy: {
			top: 700,
			bottom: 300
		},
		context: {
			loadingOlder: p.loadingOlder,
			otherTyping: p.otherTyping,
			other
		},
		components: COMPONENTS
	});
}
var message_list_default = (0, import_react.memo)(MessageList);
function EmojiKeyboard({ onPick, onClose }) {
	const [q, setQ] = (0, import_react.useState)("");
	const ref = (0, import_react.useRef)(null);
	const list = q.trim() ? searchEmoji(q) : FULL_EMOJI;
	(0, import_react.useEffect)(() => {
		const onDown = (e) => {
			if (!ref.current?.contains(e.target)) onClose();
		};
		const onKey = (e) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("pointerdown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("pointerdown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [onClose]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		ref,
		className: "ig-emoji-pop",
		initial: {
			opacity: 0,
			y: 10,
			scale: .96
		},
		animate: {
			opacity: 1,
			y: 0,
			scale: 1
		},
		exit: {
			opacity: 0,
			y: 8,
			scale: .97
		},
		transition: {
			type: "spring",
			stiffness: 520,
			damping: 36
		},
		"data-testid": "emoji-keyboard",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "ig-emoji-pop-search",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconSearch, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				autoFocus: true,
				value: q,
				onChange: (e) => setQ(e.target.value),
				placeholder: "Search emoji",
				"data-testid": "emoji-keyboard-search"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "ig-emoji-grid",
			children: list.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => onPick(e),
				"data-testid": `emoji-key-${e}`,
				children: e
			}, e))
		})]
	});
}
function LiveWave({ recorder }) {
	const canvasRef = (0, import_react.useRef)(null);
	const timeRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const c = canvasRef.current;
		if (!c) return;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const w = c.clientWidth, h = c.clientHeight;
		c.width = w * dpr;
		c.height = h * dpr;
		const ctx = c.getContext("2d");
		if (!ctx) return;
		ctx.scale(dpr, dpr);
		const levels = [];
		const buf = /* @__PURE__ */ new Uint8Array(256);
		let raf = 0;
		let frame = 0;
		const draw = () => {
			raf = requestAnimationFrame(draw);
			if (timeRef.current) timeRef.current.textContent = fmtDuration(Date.now() - recorder.startTsRef.current);
			if (frame++ % 2) return;
			const a = recorder.analyserRef.current;
			let lvl = .05;
			if (a) {
				a.getByteTimeDomainData(buf);
				let sum = 0;
				for (let i = 0; i < buf.length; i++) {
					const v = (buf[i] - 128) / 128;
					sum += v * v;
				}
				lvl = Math.min(1, Math.sqrt(sum / buf.length) * 4 + .05);
			}
			levels.push(lvl);
			const max = Math.floor(w / 4);
			if (levels.length > max) levels.shift();
			ctx.clearRect(0, 0, w, h);
			ctx.fillStyle = "#f5f5f5";
			for (let i = 0; i < levels.length; i++) {
				const bh = Math.max(3, levels[i] * h);
				const x = w - (levels.length - i) * 4;
				ctx.beginPath();
				ctx.roundRect?.(x, (h - bh) / 2, 2.5, bh, 1.5);
				if (!ctx.roundRect) ctx.rect(x, (h - bh) / 2, 2.5, bh);
				ctx.fill();
			}
		};
		raf = requestAnimationFrame(draw);
		return () => cancelAnimationFrame(raf);
	}, [recorder]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "ig-rec-dot",
			"aria-hidden": true
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "ig-rec-time",
			ref: timeRef,
			"data-testid": "rec-timer",
			children: "0:00"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			className: "ig-rec-wave",
			ref: canvasRef
		})
	] });
}
/** Laptops/desktops only: phones already have emoji on their own keyboard. */
var IS_DESKTOP = typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
function Composer(p) {
	const hasText = p.value.trim().length > 0;
	const { recorder } = p;
	const [holding, setHolding] = (0, import_react.useState)(false);
	const [locked, setLocked] = (0, import_react.useState)(false);
	const [emojiOpen, setEmojiOpen] = (0, import_react.useState)(false);
	const hold = (0, import_react.useRef)({
		x: 0,
		y: 0,
		active: false
	});
	const slideRef = (0, import_react.useRef)(null);
	const micRef = (0, import_react.useRef)(null);
	(0, import_react.useLayoutEffect)(() => {
		const ta = p.textareaRef.current;
		if (!ta) return;
		ta.style.height = "auto";
		ta.style.height = `${Math.min(120, ta.scrollHeight)}px`;
	}, [p.value, p.textareaRef]);
	const finish = (0, import_react.useCallback)(async () => {
		hold.current.active = false;
		setHolding(false);
		setLocked(false);
		const clip = await recorder.stop();
		if (clip) {
			haptics.light();
			p.onVoice(clip.blob, clip.durationMs);
		} else p.onHint("Hold the mic to record, release to send.");
	}, [recorder, p]);
	const cancel = (0, import_react.useCallback)(() => {
		hold.current.active = false;
		setHolding(false);
		setLocked(false);
		recorder.cancel();
		haptics.medium();
	}, [recorder]);
	/** Drop an emoji in at the caret (desktop emoji keyboard). */
	const insertEmoji = (emoji) => {
		const ta = p.textareaRef.current;
		const at = ta ? ta.selectionStart ?? p.value.length : p.value.length;
		const end = ta ? ta.selectionEnd ?? at : at;
		p.onChange(p.value.slice(0, at) + emoji + p.value.slice(end));
		requestAnimationFrame(() => {
			if (!ta) return;
			ta.focus();
			const caret = at + emoji.length;
			ta.setSelectionRange(caret, caret);
		});
	};
	const onMicDown = (e) => {
		if (locked) return;
		e.preventDefault();
		try {
			e.currentTarget.setPointerCapture(e.pointerId);
		} catch {}
		hold.current = {
			x: e.clientX,
			y: e.clientY,
			active: true
		};
		setHolding(true);
		haptics.medium();
		recorder.start();
	};
	const onMicMove = (e) => {
		const h = hold.current;
		if (!h.active || locked) return;
		const dx = Math.min(0, e.clientX - h.x);
		const dy = Math.min(0, e.clientY - h.y);
		if (slideRef.current) slideRef.current.style.transform = `translate3d(${dx * .6}px,0,0)`;
		if (micRef.current) micRef.current.style.setProperty("--mic-x", `${dx * .35}px`);
		if (dx < -110) cancel();
		else if (dy < -70) {
			setLocked(true);
			h.active = false;
			haptics.medium();
			if (micRef.current) micRef.current.style.setProperty("--mic-x", "0px");
		}
	};
	const onMicUp = () => {
		if (micRef.current) micRef.current.style.setProperty("--mic-x", "0px");
		if (hold.current.active && !locked) finish();
	};
	const recUi = holding || locked;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ig-composer",
		"data-testid": "chat-composer",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AnimatePresence, {
				initial: false,
				children: [p.error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
					className: "ig-composer-error",
					"data-testid": "chat-error-banner",
					initial: {
						opacity: 0,
						y: 8
					},
					animate: {
						opacity: 1,
						y: 0
					},
					exit: {
						opacity: 0,
						y: 8
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.error }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: p.onDismissError,
						"aria-label": "Dismiss",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconClose, { size: 16 })
					})]
				}, "err"), p.reply && !recUi && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
					className: "ig-reply-bar",
					"data-testid": "reply-preview",
					initial: {
						opacity: 0,
						y: 14
					},
					animate: {
						opacity: 1,
						y: 0
					},
					exit: {
						opacity: 0,
						y: 14
					},
					transition: {
						type: "spring",
						stiffness: 520,
						damping: 38
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "ig-reply-text",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: ["Replying to ", p.replyIsMine ? "yourself" : firstName(p.reply.sender)] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: quoteText(p.reply) })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: p.onCancelReply,
						"aria-label": "Cancel reply",
						"data-testid": "reply-cancel",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconClose, { size: 18 })
					})]
				}, "reply")]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ig-bar",
				"data-recording": recUi ? "" : void 0,
				children: [recUi ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ig-rec",
					children: [
						locked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
							whileTap: { scale: .86 },
							type: "button",
							className: "ig-rec-trash",
							onClick: cancel,
							"aria-label": "Delete recording",
							"data-testid": "rec-cancel",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconTrash, { size: 20 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveWave, { recorder }),
						!locked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "ig-rec-slide",
							ref: slideRef,
							children: "‹ Slide to cancel"
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
					whileTap: { scale: .86 },
					type: "button",
					className: "ig-cam",
					onClick: p.onCamera,
					"aria-label": "Camera",
					"data-testid": "composer-camera",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconCamera, { size: 22 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					ref: p.textareaRef,
					className: "ig-input",
					rows: 1,
					value: p.value,
					placeholder: "Message...",
					onChange: (e) => p.onChange(e.target.value),
					onFocus: p.onFocus,
					onKeyDown: (e) => {
						if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) {
							e.preventDefault();
							p.onSend();
						}
					},
					"data-testid": "chat-input"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ig-bar-right",
					children: [
						IS_DESKTOP && !recUi && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
							whileTap: { scale: .86 },
							type: "button",
							className: "ig-icon-btn ig-emoji-btn",
							"data-on": emojiOpen ? "" : void 0,
							onClick: () => {
								haptics.light();
								setEmojiOpen((v) => !v);
							},
							"aria-label": "Emoji keyboard",
							"data-testid": "composer-emoji-btn",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconSmile, { size: 24 })
						}),
						!hasText && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							ref: micRef,
							type: "button",
							className: "ig-icon-btn ig-mic",
							"data-holding": holding && !locked ? "" : void 0,
							"data-locked": locked ? "" : void 0,
							onPointerDown: onMicDown,
							onPointerMove: onMicMove,
							onPointerUp: onMicUp,
							onPointerCancel: onMicUp,
							onClick: () => {
								if (locked) finish();
							},
							onContextMenu: (e) => e.preventDefault(),
							"aria-label": locked ? "Send voice message" : "Hold to record a voice message",
							"data-testid": "composer-mic",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ig-mic-bg",
								"aria-hidden": true
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ig-mic-icon",
								children: locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconSend, { size: 20 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconMic, { size: 24 })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
							initial: false,
							mode: "popLayout",
							children: hasText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
								type: "button",
								className: "ig-send",
								onPointerDown: (e) => e.preventDefault(),
								onClick: p.onSend,
								initial: {
									opacity: 0,
									scale: .7
								},
								animate: {
									opacity: 1,
									scale: 1
								},
								exit: {
									opacity: 0,
									scale: .7
								},
								whileTap: { scale: .9 },
								transition: {
									type: "spring",
									stiffness: 600,
									damping: 32
								},
								"data-testid": "composer-send",
								children: "Send"
							}, "send") : !recUi ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
								className: "ig-bar-icons",
								initial: {
									opacity: 0,
									scale: .85
								},
								animate: {
									opacity: 1,
									scale: 1
								},
								exit: {
									opacity: 0,
									scale: .85
								},
								transition: {
									type: "spring",
									stiffness: 600,
									damping: 34
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
										whileTap: { scale: .82 },
										type: "button",
										className: "ig-icon-btn",
										onClick: p.onGallery,
										"aria-label": "Gallery",
										"data-testid": "composer-gallery",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconGallery, { size: 24 })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
										whileTap: { scale: .82 },
										type: "button",
										className: "ig-icon-btn",
										onClick: p.onSticker,
										"aria-label": "Stickers and GIFs",
										"data-testid": "chat-sticker-btn",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconSticker, { size: 24 })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
										whileTap: { scale: .82 },
										animate: { rotate: p.plusOpen ? 45 : 0 },
										type: "button",
										className: "ig-icon-btn",
										onClick: p.onPlus,
										"aria-label": "More options",
										"data-testid": "composer-plus",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPlus, { size: 24 })
									})
								]
							}, "icons") : null
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: emojiOpen && IS_DESKTOP && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmojiKeyboard, {
				onPick: insertEmoji,
				onClose: () => setEmojiOpen(false)
			}, "emoji-kb") }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: holding && !locked && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
				className: "ig-lock-hint",
				initial: {
					opacity: 0,
					y: 16,
					scale: .8
				},
				animate: {
					opacity: 1,
					y: 0,
					scale: 1
				},
				exit: {
					opacity: 0,
					y: 10,
					scale: .8
				},
				transition: {
					type: "spring",
					stiffness: 500,
					damping: 28
				},
				"aria-hidden": true,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconLock, { size: 18 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ig-lock-chev",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconChevronUp, { size: 16 })
				})]
			}, "lock") })
		]
	});
}
function Wallpaper({ src, mini = false }) {
	const ref = (0, import_react.useRef)(null);
	const [box, setBox] = (0, import_react.useState)({
		w: 0,
		h: 0
	});
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		const update = () => setBox({
			w: el.clientWidth,
			h: el.clientHeight
		});
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);
	if (!src) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: "ig-wallpaper",
		"aria-hidden": true
	});
	const cell = box.w * .34;
	const rowH = box.w * .4;
	const rows = rowH > 0 ? Math.ceil(box.h / rowH) + 1 : 0;
	const tiles = [];
	for (let r = 0; r < rows; r++) (r % 2 === 0 ? [.08, .6] : [
		-.2,
		.34,
		.88
	]).forEach((x) => tiles.push({
		x: x * box.w,
		y: r * rowH - rowH * .25
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: "ig-wallpaper",
		"data-mini": mini ? "" : void 0,
		"aria-hidden": true,
		children: tiles.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src,
			alt: "",
			decoding: "async",
			draggable: false,
			style: {
				width: cell,
				transform: `translate3d(${t.x}px, ${t.y}px, 0)`
			}
		}, i))
	});
}
var wallpaper_default = (0, import_react.memo)(Wallpaper);
var EMOJI = {
	ringing: "📞",
	answered: "💗",
	declined: "💔",
	error: "⚠️",
	noanswer: "😴"
};
function WakeOverlay({ status, error, onStop }) {
	const live = status === "ringing" || status === "answered";
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "ig-wake-backdrop",
		"data-testid": "wake-overlay",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
			initial: {
				opacity: 0,
				scale: .92,
				y: 10
			},
			animate: {
				opacity: 1,
				scale: 1,
				y: 0
			},
			transition: {
				type: "spring",
				stiffness: 380,
				damping: 28
			},
			className: "ig-wake-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
					animate: status === "ringing" ? {
						rotate: [
							0,
							-14,
							12,
							-10,
							8,
							0
						],
						scale: [
							1,
							1.12,
							1
						]
					} : status === "answered" ? { scale: [
						1,
						1.18,
						1
					] } : { scale: 1 },
					transition: live ? {
						repeat: Infinity,
						duration: 1.1,
						ease: "easeInOut"
					} : { duration: .2 },
					style: {
						fontSize: 56,
						lineHeight: 1,
						marginBottom: 14
					},
					"aria-hidden": true,
					children: EMOJI[status]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ig-wake-title",
					children: "Wake Me Up"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ig-wake-status",
					"data-testid": "wake-status-text",
					children: status === "ringing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"Ringing ",
						firstName("faizan"),
						"’s mobile",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ig-wake-dots",
							children: " . . ."
						})
					] }) : status === "answered" ? `${firstName("faizan")} answered 💗` : status === "declined" ? `${firstName("faizan")} declined the call 💔` : status === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"Couldn’t ring his phone ⚠️",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								fontSize: 13,
								opacity: .92,
								fontStyle: "italic"
							},
							children: error ?? "Something went wrong with the call."
						})
					] }) : "No answer 😴 — missed-ring alert sent to his phone 📲"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
					whileTap: { scale: .94 },
					onClick: onStop,
					className: "ig-wake-btn",
					"data-testid": "wake-stop-btn",
					children: status === "ringing" ? "✕ Stop ringing" : "Close"
				})
			]
		})
	}), document.body);
}
var spring = {
	type: "spring",
	stiffness: 460,
	damping: 32,
	mass: .8
};
var pop = {
	type: "spring",
	stiffness: 520,
	damping: 26
};
var EMOJI_H = 52;
var GAP = 10;
var ITEM_H = 46;
function LongPressOverlay(p) {
	const { msg, rect, mine } = p.target;
	const [more, setMore] = (0, import_react.useState)(false);
	const [picker, setPicker] = (0, import_react.useState)(false);
	const [q, setQ] = (0, import_react.useState)("");
	const isText = msg.type === "text";
	const hasMedia = !!msg.mediaUrl && msg.type !== "text";
	const items = [
		{
			key: "reply",
			label: "Reply",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconReply, { size: 20 }),
			run: p.onReply
		},
		...isText ? [{
			key: "copy",
			label: "Copy",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconCopy, { size: 20 }),
			run: p.onCopy
		}] : [],
		...isText ? [{
			key: "edit",
			label: "Edit",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconEdit, { size: 20 }),
			run: p.onEdit
		}] : [],
		{
			key: "unsend",
			label: "Unsend",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconUnsend, { size: 20 }),
			danger: true,
			run: p.onUnsend
		},
		...more ? [...hasMedia ? [{
			key: "download",
			label: "Save to device",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconDownload, { size: 20 }),
			run: p.onDownload
		}] : [], {
			key: "gif",
			label: "Reply with GIF",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconGif, { size: 20 }),
			run: p.onReplyGif
		}] : [{
			key: "more",
			label: "More",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconMore, { size: 20 }),
			run: () => setMore(true)
		}]
	];
	const layout = (0, import_react.useMemo)(() => {
		const vh = window.innerHeight;
		const vw = window.innerWidth;
		const menuH = (items.length + 1) * ITEM_H + 8;
		const scale = rect.height > vh * .42 ? Math.max(.45, vh * .42 / rect.height) : 1.04;
		const h = rect.height * scale;
		const minTop = 116;
		const maxTop = vh - 24 - menuH - GAP - h;
		const top = Math.max(minTop, Math.min(rect.top + (rect.height - h) / 2, maxTop));
		const emojiW = Math.min(vw - 16, 324);
		const emojiLeft = mine ? Math.max(8, Math.min(rect.right - emojiW, vw - emojiW - 8)) : Math.max(8, Math.min(rect.left, vw - emojiW - 8));
		const menuW = 230;
		return {
			scale,
			h,
			top,
			emojiW,
			emojiLeft,
			menuLeft: mine ? Math.max(8, rect.right - menuW) : Math.max(8, Math.min(rect.left, vw - menuW - 8)),
			menuW,
			dy: top - (rect.top + (rect.height - h) / 2)
		};
	}, [
		rect,
		mine,
		items.length
	]);
	const origin = mine ? "100% 50%" : "0% 50%";
	const emojis = picker ? searchEmoji(q) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ig-lp",
		"data-testid": "long-press-overlay",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
				className: "ig-lp-backdrop",
				onClick: p.onClose,
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				exit: { opacity: 0 },
				transition: { duration: .2 }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
				className: "ig-lp-bubble",
				style: {
					left: rect.left,
					top: rect.top,
					width: rect.width,
					transformOrigin: origin
				},
				initial: {
					y: 0,
					scale: 1
				},
				animate: {
					y: layout.dy,
					scale: layout.scale
				},
				exit: {
					y: 0,
					scale: 1,
					transition: {
						type: "spring",
						stiffness: 520,
						damping: 40
					}
				},
				transition: spring,
				onClick: p.onClose,
				children: p.renderBubble()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
				className: "ig-lp-emojis",
				style: {
					left: layout.emojiLeft,
					top: layout.top - GAP - EMOJI_H,
					width: layout.emojiW,
					transformOrigin: mine ? "100% 100%" : "0% 100%"
				},
				initial: {
					opacity: 0,
					scale: .5,
					y: 12
				},
				animate: {
					opacity: 1,
					scale: 1,
					y: 0
				},
				exit: {
					opacity: 0,
					scale: .6,
					y: 10,
					transition: { duration: .14 }
				},
				transition: pop,
				"data-testid": "reaction-bar",
				children: [QUICK_REACTIONS.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
					type: "button",
					className: "ig-lp-emoji",
					"data-on": p.myEmojis.has(e) ? "" : void 0,
					initial: {
						opacity: 0,
						scale: .3,
						y: 10
					},
					animate: {
						opacity: 1,
						scale: 1,
						y: 0
					},
					transition: {
						...pop,
						delay: .03 + i * .025
					},
					whileTap: { scale: 1.35 },
					onClick: () => p.onReact(e),
					"data-testid": `react-${i}`,
					children: e
				}, e)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
					type: "button",
					className: "ig-lp-emoji ig-lp-emoji-plus",
					initial: {
						opacity: 0,
						scale: .3
					},
					animate: {
						opacity: 1,
						scale: 1
					},
					transition: {
						...pop,
						delay: .2
					},
					onClick: () => setPicker(true),
					"aria-label": "More reactions",
					"data-testid": "react-more",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPlus, { size: 22 })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
				className: "ig-lp-menu",
				style: {
					left: layout.menuLeft,
					top: layout.top + layout.h + GAP,
					width: layout.menuW,
					transformOrigin: mine ? "100% 0%" : "0% 0%"
				},
				initial: {
					opacity: 0,
					scale: .6,
					y: -8
				},
				animate: {
					opacity: 1,
					scale: 1,
					y: 0
				},
				exit: {
					opacity: 0,
					scale: .7,
					y: -6,
					transition: { duration: .14 }
				},
				transition: pop,
				layout: true,
				"data-testid": "action-menu",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "ig-lp-menu-time",
					children: new Date(msg.timestamp).toLocaleString([], {
						weekday: "short",
						hour: "numeric",
						minute: "2-digit"
					})
				}), items.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "ig-lp-item",
					"data-danger": it.danger ? "" : void 0,
					onClick: it.run,
					"data-testid": `menu-${it.key}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: it.label }), it.icon]
				}, it.key))]
			}),
			picker && emojis && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
				className: "ig-sheet ig-emoji-sheet",
				initial: { y: "100%" },
				animate: { y: 0 },
				transition: {
					type: "spring",
					stiffness: 420,
					damping: 38
				},
				"data-testid": "emoji-picker",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ig-sheet-grab" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ig-sheet-search",
						placeholder: "Search emoji",
						value: q,
						onChange: (e) => setQ(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "ig-emoji-grid",
						children: (emojis.length ? emojis : FULL_EMOJI).map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"data-on": p.myEmojis.has(e) ? "" : void 0,
							onClick: () => p.onReact(e),
							children: e
						}, e))
					})
				]
			})
		]
	});
}
function NotificationBell({ sender, renderAs }) {
	const [perm, setPerm] = (0, import_react.useState)("unknown");
	const [active, setActive] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [toast, setToast] = (0, import_react.useState)(null);
	const refresh = (0, import_react.useCallback)(async () => {
		if (!isPushSupported()) {
			setPerm("unsupported");
			setActive(false);
			return;
		}
		setPerm(getNotificationPermission());
		try {
			setActive(await hasActiveSubscription());
		} catch {
			setActive(false);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		refresh();
	}, [refresh]);
	(0, import_react.useEffect)(() => {
		if (perm !== "granted") return;
		ensurePushSubscription(sender).then(() => refresh());
	}, [
		perm,
		sender,
		refresh
	]);
	(0, import_react.useEffect)(() => {
		if (perm === "granted" && active) syncPersona(sender);
	}, [sender]);
	const showToast = (m) => {
		setToast(m);
		window.setTimeout(() => setToast(null), 4600);
	};
	const onClick = (0, import_react.useCallback)(async () => {
		haptics.light();
		if (!isPushSupported()) {
			showToast("This browser can’t receive push notifications.");
			return;
		}
		if (isIOS() && !isStandalone()) {
			showToast("On iPhone: tap Share → Add to Home Screen, open that icon, then tap 🔔.");
			return;
		}
		if (getNotificationPermission() === "denied") {
			showToast("Notifications are blocked. Turn them on in Settings for this app.");
			return;
		}
		setBusy(true);
		try {
			if (active) {
				await disablePush();
				haptics.medium();
				showToast("Notifications turned off.");
			} else {
				await enablePush(sender);
				haptics.success();
				showToast("Notifications on 🔔 — you’ll be pinged for new messages.");
			}
		} catch (e) {
			haptics.error();
			showToast(e?.message || "Couldn’t update notifications.");
		} finally {
			setBusy(false);
			await refresh();
		}
	}, [
		active,
		sender,
		refresh
	]);
	const dimmed = perm === "unsupported";
	const icon = busy ? "…" : active ? "🔔" : "🔕";
	const toastNode = toast && typeof document !== "undefined" && (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "ig-toast",
		"data-testid": "notif-toast",
		children: toast
	}), document.body);
	if (renderAs === "menu") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		"data-testid": "chat-notif-toggle",
		className: "ig-plus-item",
		onClick,
		disabled: busy || dimmed,
		"aria-label": active ? "Disable message notifications" : "Enable message notifications",
		title: active ? "Notifications on" : "Enable notifications",
		style: { opacity: dimmed ? .5 : 1 },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "ig-plus-icon",
			"data-on": active ? "" : void 0,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				width: "24",
				height: "24",
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.8",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": true,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M10.3 21a1.94 1.94 0 0 0 3.4 0" }),
					!active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3 3l18 18" })
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "ig-plus-label",
			children: busy ? "…" : active ? "Alerts on" : "Alerts off"
		})]
	}), toastNode] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.button, {
		"data-testid": "chat-notif-toggle",
		onClick,
		disabled: busy || dimmed,
		whileTap: { scale: .88 },
		transition: {
			duration: .18,
			ease: [
				.22,
				1,
				.36,
				1
			]
		},
		className: "hb-hdr-btn",
		"data-active": active ? "" : void 0,
		style: {
			position: "relative",
			opacity: dimmed ? .5 : 1
		},
		"aria-label": active ? "Disable message notifications" : "Enable message notifications",
		title: active ? "Notifications on" : "Enable notifications",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			"aria-hidden": true,
			style: {
				fontSize: 15,
				lineHeight: 1
			},
			children: icon
		}), active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			"aria-hidden": true,
			style: {
				position: "absolute",
				top: 5,
				right: 5,
				width: 8,
				height: 8,
				borderRadius: "50%",
				background: "#3ddc84",
				boxShadow: "0 0 0 2px rgba(255,255,255,0.85)"
			}
		})]
	}), toast && typeof document !== "undefined" && (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		style: {
			position: "fixed",
			top: "calc(env(safe-area-inset-top, 0px) + 16px)",
			left: "50%",
			transform: "translateX(-50%)",
			zIndex: 2147483647,
			maxWidth: "min(92vw, 420px)",
			padding: "12px 18px",
			borderRadius: 18,
			background: "rgba(255,255,255,0.96)",
			border: "1px solid rgba(255,150,180,0.5)",
			boxShadow: "0 12px 40px rgba(201,24,74,0.28)",
			color: "#7a2040",
			fontFamily: "'Cormorant Garamond', serif",
			fontSize: 15,
			lineHeight: 1.4,
			textAlign: "center"
		},
		children: toast
	}), document.body)] });
}
function PlusMenu(p) {
	const items = [
		{
			key: "music",
			label: "Music",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconMusic, { size: 24 }),
			run: p.onMusic
		},
		{
			key: "wake",
			label: "Wake-up call",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconAlarm, { size: 24 }),
			run: p.onWake
		},
		{
			key: "themes",
			label: "Themes",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPalette, { size: 24 }),
			run: p.onThemes
		},
		{
			key: "draw",
			label: "Draw",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBrush, { size: 24 }),
			run: p.onDraw
		},
		{
			key: "search",
			label: "Search",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconSearch, { size: 24 }),
			run: p.onSearch
		},
		{
			key: "video",
			label: "Record video",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconVideo, { size: 24 }),
			run: p.onVideo
		},
		{
			key: "file",
			label: "File",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconFile, { size: 24 }),
			run: p.onFile
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		className: "ig-plus-scrim",
		onClick: p.onClose,
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 }
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		className: "ig-plus",
		"data-testid": "plus-menu",
		initial: {
			opacity: 0,
			scale: .6,
			y: 20
		},
		animate: {
			opacity: 1,
			scale: 1,
			y: 0
		},
		exit: {
			opacity: 0,
			scale: .7,
			y: 14,
			transition: { duration: .14 }
		},
		transition: {
			type: "spring",
			stiffness: 520,
			damping: 30
		},
		children: [items.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.button, {
			type: "button",
			className: "ig-plus-item",
			onPointerDown: (e) => {
				if (it.key !== "wake") return;
				if (e.button != null && e.button !== 0) return;
				it.run();
			},
			onClick: () => {
				p.onClose();
				it.run();
			},
			initial: {
				opacity: 0,
				y: 10
			},
			animate: {
				opacity: 1,
				y: 0
			},
			transition: {
				type: "spring",
				stiffness: 520,
				damping: 30,
				delay: .02 * i
			},
			whileTap: { scale: .9 },
			"data-testid": `plus-${it.key}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "ig-plus-icon",
				children: it.icon
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "ig-plus-label",
				children: it.label
			})]
		}, it.key)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotificationBell, {
			sender: p.sender,
			renderAs: "menu"
		})]
	})] });
}
var fade = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	exit: { opacity: 0 },
	transition: { duration: .18 }
};
var popIn = {
	initial: {
		opacity: 0,
		scale: .9,
		y: 12
	},
	animate: {
		opacity: 1,
		scale: 1,
		y: 0
	},
	exit: {
		opacity: 0,
		scale: .94,
		y: 8
	},
	transition: {
		type: "spring",
		stiffness: 480,
		damping: 32
	}
};
var sheetIn = {
	initial: { y: "100%" },
	animate: { y: 0 },
	exit: { y: "100%" },
	transition: {
		type: "spring",
		stiffness: 420,
		damping: 40
	}
};
function EditDialog({ initial, onCancel, onSave }) {
	const [text, setText] = (0, import_react.useState)(initial);
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const t = window.setTimeout(() => {
			const ta = ref.current;
			if (!ta) return;
			ta.focus();
			ta.setSelectionRange(ta.value.length, ta.value.length);
		}, 120);
		return () => window.clearTimeout(t);
	}, []);
	(0, import_react.useEffect)(() => {
		const ta = ref.current;
		if (!ta) return;
		ta.style.height = "auto";
		ta.style.height = `${Math.min(window.innerHeight * .45, Math.max(140, ta.scrollHeight))}px`;
	}, [text]);
	const ok = text.trim().length > 0 && text.trim() !== initial.trim();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		className: "ig-modal",
		...fade,
		onClick: onCancel,
		"data-testid": "edit-dialog",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
			className: "ig-edit-box",
			...popIn,
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ig-dialog-title",
					children: "Edit message"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					ref,
					className: "ig-edit-input",
					value: text,
					onChange: (e) => setText(e.target.value),
					onKeyDown: (e) => {
						if (e.key === "Escape") onCancel();
						if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && ok) onSave(text);
					},
					"data-testid": "edit-input"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ig-dialog-actions",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ig-btn-ghost",
						onClick: onCancel,
						"data-testid": "edit-cancel",
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ig-btn-primary",
						disabled: !ok,
						onClick: () => onSave(text),
						"data-testid": "edit-save",
						children: "Save"
					})]
				})
			]
		})
	});
}
function ConfirmUnsend({ onCancel, onConfirm }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		className: "ig-modal",
		...fade,
		onClick: onCancel,
		"data-testid": "unsend-confirm",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
			className: "ig-alert",
			...popIn,
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ig-alert-title",
					children: "Unsend message?"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ig-alert-body",
					children: "Unsending will remove the message for both of you. This can’t be undone."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "ig-alert-btn",
					"data-danger": "",
					onClick: onConfirm,
					"data-testid": "unsend-confirm-yes",
					children: "Unsend"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "ig-alert-btn",
					onClick: onCancel,
					"data-testid": "unsend-confirm-cancel",
					children: "Cancel"
				})
			]
		})
	});
}
function IdentitySheet({ current, onPick, onRename, onClose }) {
	useNames();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		className: "ig-modal ig-modal-bottom",
		...fade,
		onClick: onClose,
		"data-testid": "identity-popup",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
			className: "ig-sheet",
			...sheetIn,
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ig-sheet-grab" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ig-sheet-title",
					children: "Chat as"
				}),
				["habiba", "faizan"].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "ig-sheet-row",
					onClick: () => onPick(s),
					"data-testid": `identity-pick-${s}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
							who: s,
							size: 40
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ig-sheet-row-name",
							children: fullName(s)
						}),
						current === s && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ig-check",
							"aria-label": "Selected",
							children: "✓"
						})
					]
				}, s)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "ig-sheet-row",
					onClick: onRename,
					"data-testid": "open-rename",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ig-sheet-row-icon",
						"aria-hidden": true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconEdit, { size: 20 })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ig-sheet-row-name",
						children: "Change names"
					})]
				})
			]
		})
	});
}
/** Rename both people in the chat; saved for both phones until changed again. */
function NamesSheet({ names, onSave, onClose }) {
	const [habiba, setHabiba] = (0, import_react.useState)(names.habiba);
	const [faizan, setFaizan] = (0, import_react.useState)(names.faizan);
	const trimmed = {
		habiba: habiba.trim(),
		faizan: faizan.trim()
	};
	const ok = !!trimmed.habiba && !!trimmed.faizan && (trimmed.habiba !== names.habiba || trimmed.faizan !== names.faizan);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		className: "ig-modal ig-modal-bottom",
		...fade,
		onClick: onClose,
		"data-testid": "names-sheet",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
			className: "ig-sheet",
			...sheetIn,
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ig-sheet-grab" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ig-sheet-title",
					children: "Change names"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ig-name-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Her name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ig-edit-input hb-selectable",
						value: habiba,
						maxLength: 32,
						autoComplete: "off",
						onChange: (e) => setHabiba(e.target.value),
						"data-testid": "name-input-habiba"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ig-name-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "His name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ig-edit-input hb-selectable",
						value: faizan,
						maxLength: 32,
						autoComplete: "off",
						onChange: (e) => setFaizan(e.target.value),
						"data-testid": "name-input-faizan"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ig-dialog-actions",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ig-btn-ghost",
						onClick: onClose,
						"data-testid": "names-cancel",
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ig-btn-primary",
						disabled: !ok,
						onClick: () => onSave(trimmed),
						"data-testid": "names-save",
						children: "Save"
					})]
				})
			]
		})
	});
}
function ReactionsSheet({ msg, me, reactorOf, onRemove, onClose }) {
	const rows = [];
	const seen = /* @__PURE__ */ new Set();
	Object.entries(msg.reactions ?? {}).forEach(([emoji, users]) => users.forEach((u) => {
		const who = reactorOf(u);
		const k = `${who ?? u}|${emoji}`;
		if (seen.has(k)) return;
		seen.add(k);
		rows.push({
			who,
			emoji,
			key: k
		});
	}));
	rows.sort((a, b) => (a.who === me ? -1 : 0) - (b.who === me ? -1 : 0));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		className: "ig-modal ig-modal-bottom",
		...fade,
		onClick: onClose,
		"data-testid": "reactions-sheet",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
			className: "ig-sheet",
			...sheetIn,
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ig-sheet-grab" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ig-sheet-title",
					children: "Reactions"
				}),
				rows.map((r) => {
					const mineRow = r.who === me;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "ig-sheet-row",
						disabled: !mineRow,
						onClick: () => mineRow && onRemove(r.emoji),
						"data-testid": mineRow ? "reaction-remove" : "reaction-row",
						children: [
							r.who ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
								who: r.who,
								size: 40
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ig-avatar",
								style: {
									width: 40,
									height: 40
								},
								children: "?"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ig-sheet-row-name",
								children: [r.who ? mineRow ? "You" : fullName(r.who) : "Someone", mineRow && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Tap to remove" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ig-sheet-row-emoji",
								children: r.emoji
							})
						]
					}, r.key);
				})
			]
		})
	});
}
var MusicPage = (0, import_react.lazy)(() => import("./music-page-CWg1sdOP.mjs"));
var ProfileMediaPage = (0, import_react.lazy)(() => import("./profile-media-page-CxbsASc_.mjs"));
var StickerTray = (0, import_react.lazy)(() => import("./sticker-tray-DKyk05Hu.mjs").then((n) => n.t));
var ThemePicker = (0, import_react.lazy)(() => import("./theme-picker-DSGMMoyr.mjs"));
var GallerySheet = (0, import_react.lazy)(() => import("./gallery-sheet-BPOCTobS.mjs"));
var Doodle = (0, import_react.lazy)(() => import("./doodle-Y1BAWMd2.mjs"));
var MediaViewer = (0, import_react.lazy)(() => import("./media-viewer-BZeQIpsx.mjs"));
var VideoRecorder = (0, import_react.lazy)(() => import("./video-recorder-B7F8R7EK.mjs").then((m) => ({ default: m.InAppVideoRecorder })));
var WAKE_NOTE = "⏰ Wake-up call sent 💗";
var EMPTY_SEARCH = {
	open: false,
	query: "",
	index: 0,
	total: 0,
	loading: false,
	done: false
};
var nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 30)));
function IgChat({ onExit }) {
	const [sender, setSender] = (0, import_react.useState)(readSender);
	const senderRef = (0, import_react.useRef)(sender);
	senderRef.current = sender;
	const other = otherOf(sender);
	const appRef = (0, import_react.useRef)(null);
	const listRef = (0, import_react.useRef)(null);
	const textareaRef = (0, import_react.useRef)(null);
	const searchInputRef = (0, import_react.useRef)(null);
	const galleryInputRef = (0, import_react.useRef)(null);
	const cameraInputRef = (0, import_react.useRef)(null);
	const fileInputRef = (0, import_react.useRef)(null);
	const videoFallbackRef = (0, import_react.useRef)(null);
	const scrollToBottom = (0, import_react.useCallback)((smooth = true) => {
		listRef.current?.scrollToIndex({
			index: "LAST",
			align: "end",
			behavior: smooth ? "smooth" : "auto"
		});
	}, []);
	const engine = useChatEngine(senderRef, () => requestAnimationFrame(() => scrollToBottom()));
	const settings = useSharedSettings();
	const [previewTheme, setPreviewTheme] = (0, import_react.useState)(null);
	const theme = previewTheme ?? settings.theme;
	const [lowFx, setLowFx] = (0, import_react.useState)(detectLowFx);
	const recorder = useRecorder(engine.setError);
	const [input, setInput] = (0, import_react.useState)("");
	const [reply, setReply] = (0, import_react.useState)(null);
	const [atBottom, setAtBottom] = (0, import_react.useState)(true);
	const [lift, setLift] = (0, import_react.useState)(null);
	const [liftedId, setLiftedId] = (0, import_react.useState)(null);
	const [editMsg, setEditMsg] = (0, import_react.useState)(null);
	const [confirmMsg, setConfirmMsg] = (0, import_react.useState)(null);
	const [reactionsMsg, setReactionsMsg] = (0, import_react.useState)(null);
	const [identityOpen, setIdentityOpen] = (0, import_react.useState)(false);
	const [namesOpen, setNamesOpen] = (0, import_react.useState)(false);
	const [profileOpen, setProfileOpen] = (0, import_react.useState)(false);
	const [profileMounted, setProfileMounted] = (0, import_react.useState)(false);
	const [musicOpen, setMusicOpen] = (0, import_react.useState)(false);
	const [tray, setTray] = (0, import_react.useState)({
		open: false,
		mounted: false
	});
	const [themeOpen, setThemeOpen] = (0, import_react.useState)(false);
	const [plusOpen, setPlusOpen] = (0, import_react.useState)(false);
	const [galleryFiles, setGalleryFiles] = (0, import_react.useState)(null);
	const [doodle, setDoodle] = (0, import_react.useState)(null);
	const [viewer, setViewer] = (0, import_react.useState)(null);
	const [videoRec, setVideoRec] = (0, import_react.useState)({
		open: false,
		mounted: false
	});
	const [search, setSearch] = (0, import_react.useState)(EMPTY_SEARCH);
	const [flashId, setFlashId] = (0, import_react.useState)(null);
	const [kbInset, setKbInset] = (0, import_react.useState)(0);
	const resultsRef = (0, import_react.useRef)([]);
	const searchSeq = (0, import_react.useRef)(0);
	const searchTimer = (0, import_react.useRef)(0);
	const typingTimer = (0, import_react.useRef)(0);
	const lastTypingSent = (0, import_react.useRef)(0);
	const wake = useWakeUp(() => {
		engine.sendText(WAKE_NOTE, null);
	});
	(0, import_react.useEffect)(() => {
		startAnimClock();
	}, []);
	(0, import_react.useEffect)(() => {
		try {
			localStorage.setItem(LAST_READ_KEY, String(Date.now()));
		} catch {}
	}, []);
	(0, import_react.useEffect)(() => startChatPresence(() => senderRef.current), []);
	(0, import_react.useEffect)(() => {
		ensurePushSubscription(sender);
	}, [sender]);
	(0, import_react.useEffect)(() => {
		refreshChatPresence(sender);
		try {
			localStorage.setItem(SENDER_KEY, sender);
		} catch {}
	}, [sender]);
	(0, import_react.useEffect)(() => {
		const vv = window.visualViewport;
		if (!vv) return;
		const update = () => setKbInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
		vv.addEventListener("resize", update);
		vv.addEventListener("scroll", update);
		update();
		return () => {
			vv.removeEventListener("resize", update);
			vv.removeEventListener("scroll", update);
		};
	}, []);
	const light = isLight(theme);
	(0, import_react.useEffect)(() => {
		const root = document.documentElement;
		root.dataset.igMode = light ? "light" : "dark";
		if (lowFx) root.dataset.igLowfx = "";
		else delete root.dataset.igLowfx;
		return () => {
			delete root.dataset.igMode;
			delete root.dataset.igLowfx;
		};
	}, [light, lowFx]);
	const setHeaderHeight = (0, import_react.useCallback)((h) => {
		appRef.current?.style.setProperty("--ig-hdr-h", `${h}px`);
	}, []);
	const flash = (0, import_react.useCallback)((id) => {
		setFlashId(id);
		window.setTimeout(() => setFlashId((c) => c === id ? null : c), 1500);
	}, []);
	const goTo = (0, import_react.useCallback)(async (id, highlight = true, ts) => {
		let idx = engine.messagesRef.current.findIndex((m) => m.id === id);
		if (idx < 0) {
			const at = ts ?? await engine.findTimestamp(id);
			if (at == null || !await engine.jumpAround(at)) return;
			await nextFrame();
			idx = engine.messagesRef.current.findIndex((m) => m.id === id);
		}
		if (idx < 0) return;
		await nextFrame();
		listRef.current?.scrollToIndex({
			index: idx,
			align: "center",
			behavior: "auto"
		});
		if (highlight) flash(id);
	}, [engine, flash]);
	const runSearch = (0, import_react.useCallback)(async (q) => {
		const seq = ++searchSeq.current;
		if (!q.trim()) {
			resultsRef.current = [];
			setSearch((s) => ({
				...s,
				total: 0,
				index: 0,
				loading: false,
				done: false
			}));
			return;
		}
		setSearch((s) => ({
			...s,
			loading: true
		}));
		const res = (await searchMessages(q)).filter((m) => m.type === "text");
		if (seq !== searchSeq.current) return;
		resultsRef.current = res;
		setSearch((s) => ({
			...s,
			total: res.length,
			index: 0,
			loading: false,
			done: true
		}));
		if (res.length) goTo(res[0].id, false, res[0].timestamp);
	}, [goTo]);
	const onQuery = (0, import_react.useCallback)((q) => {
		setSearch((s) => ({
			...s,
			query: q,
			done: false
		}));
		window.clearTimeout(searchTimer.current);
		searchTimer.current = window.setTimeout(() => {
			runSearch(q);
		}, 280);
	}, [runSearch]);
	const step = (0, import_react.useCallback)((delta) => {
		setSearch((s) => {
			const next = s.index + delta;
			if (next < 0 || next >= resultsRef.current.length) return s;
			haptics.selection();
			goTo(resultsRef.current[next].id, false, resultsRef.current[next].timestamp);
			return {
				...s,
				index: next
			};
		});
	}, [goTo]);
	const openSearch = (0, import_react.useCallback)(() => {
		haptics.light();
		setSearch({
			...EMPTY_SEARCH,
			open: true
		});
		window.setTimeout(() => searchInputRef.current?.focus(), 80);
	}, []);
	const closeSearch = (0, import_react.useCallback)(() => {
		searchSeq.current++;
		resultsRef.current = [];
		setSearch(EMPTY_SEARCH);
		engine.returnToLatest().then(() => window.setTimeout(() => scrollToBottom(false), 60));
	}, [scrollToBottom, engine]);
	const onInput = (v) => {
		setInput(v);
		const now = Date.now();
		if (now - lastTypingSent.current > 1500) {
			lastTypingSent.current = now;
			broadcastTyping(sender, SESSION_ID, true);
		}
		window.clearTimeout(typingTimer.current);
		typingTimer.current = window.setTimeout(() => {
			lastTypingSent.current = 0;
			broadcastTyping(sender, SESSION_ID, false);
		}, 2500);
	};
	const send = async () => {
		const text = input;
		if (!text.trim()) return;
		haptics.light();
		const r = reply;
		setInput("");
		setReply(null);
		window.clearTimeout(typingTimer.current);
		lastTypingSent.current = 0;
		broadcastTyping(sender, SESSION_ID, false);
		if (!await engine.sendText(text, r)) setInput((cur) => cur || text);
	};
	const beginReply = (0, import_react.useCallback)((msg) => {
		haptics.light();
		setReply({
			id: msg.id,
			snapshot: makeReplySnapshot(msg)
		});
		window.setTimeout(() => textareaRef.current?.focus(), 60);
	}, []);
	const takeReply = () => {
		const r = reply;
		setReply(null);
		return r;
	};
	const onPickedGallery = (files) => {
		if (!files || !files.length) return;
		const list = Array.from(files);
		setGalleryFiles((prev) => [...prev ?? [], ...list]);
	};
	const sendGallery = (files) => {
		setGalleryFiles(null);
		if (!files.length) return;
		const r = takeReply();
		const media = files.filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
		const rest = files.filter((f) => !media.includes(f));
		if (media.length >= 2) engine.sendGroup(media, r);
		else if (media.length === 1) engine.sendMedia(media[0], r);
		rest.forEach((f) => {
			engine.sendFile(f, null);
		});
	};
	const latest = (0, import_react.useRef)(null);
	latest.current = {
		onLongPress: (msg, el) => {
			textareaRef.current?.blur();
			setLiftedId(msg.id);
			setLift({
				msg,
				rect: el.getBoundingClientRect(),
				mine: msg.sender === sender,
				pos: el.dataset.pos ?? "single",
				bare: isBare(msg)
			});
		},
		onDoubleTap: (msg) => {
			haptics.light();
			engine.react(msg, "❤️", "add").then((r) => {
				if (r === "limit") engine.setError("You can add up to 6 different reactions to one message.");
			});
		},
		onSwipeReply: (msg) => beginReply(msg),
		onOpenMedia: (items, index, rect, ts) => setViewer({
			items,
			index,
			rect,
			ts
		}),
		onJumpTo: (id) => {
			goTo(id);
		},
		onOpenReactions: (msg) => {
			haptics.light();
			setReactionsMsg(msg);
		}
	};
	const handlers = (0, import_react.useMemo)(() => ({
		onLongPress: (m, el) => latest.current.onLongPress(m, el),
		onDoubleTap: (m) => latest.current.onDoubleTap(m),
		onSwipeReply: (m) => latest.current.onSwipeReply(m),
		onOpenMedia: (a, b, c, d) => latest.current.onOpenMedia(a, b, c, d),
		onJumpTo: (id) => latest.current.onJumpTo(id),
		onOpenReactions: (m) => latest.current.onOpenReactions(m)
	}), []);
	const myEmojis = (0, import_react.useMemo)(() => {
		const out = /* @__PURE__ */ new Set();
		const msg = lift ? engine.messages.find((m) => m.id === lift.msg.id) ?? lift.msg : null;
		Object.entries(msg?.reactions ?? {}).forEach(([e, users]) => {
			if (users.some((u) => engine.reactorOf(u) === sender)) out.add(e);
		});
		return out;
	}, [
		lift,
		engine.messages,
		engine.reactorOf,
		sender
	]);
	const closeLift = () => setLift(null);
	const liveReactionsMsg = reactionsMsg ? engine.messages.find((m) => m.id === reactionsMsg.id) ?? null : null;
	const downloadMsg = (m) => {
		haptics.light();
		if (m.albumItems && m.albumItems.length > 1) (async () => {
			for (const it of m.albumItems) {
				await downloadMedia(it.url, it.kind === "video" ? "video" : "image", { ts: m.timestamp });
				await new Promise((r) => setTimeout(r, 350));
			}
		})();
		else if (m.mediaUrl && m.type !== "text") downloadMedia(m.mediaUrl, m.type, {
			filename: m.fileName,
			mime: m.mimeType,
			ts: m.timestamp
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "ig-root",
		"data-lowfx": lowFx ? "" : void 0,
		"data-mode": light ? "light" : "dark",
		style: themeVars(theme),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "ig-app",
			ref: appRef,
			"data-testid": "ig-chat",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(wallpaper_default, { src: theme.wallpaper }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {
					other,
					ringing: wake.ringing,
					search,
					inputRef: searchInputRef,
					onBack: () => {
						haptics.light();
						onExit();
					},
					onProfile: () => {
						setProfileMounted(true);
						setProfileOpen(true);
					},
					onIdentity: () => setIdentityOpen(true),
					onMusic: () => {
						haptics.light();
						setMusicOpen(true);
					},
					onCall: wake.start,
					onOpenSearch: openSearch,
					onCloseSearch: closeSearch,
					onQuery,
					onOlder: () => step(1),
					onNewer: () => step(-1),
					onHeight: setHeaderHeight
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "ig-list",
					children: [engine.loading && engine.messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "ig-center",
						"data-testid": "chat-loading",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ig-spin ig-spin-lg" })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(message_list_default, {
						messages: engine.messages,
						me: sender,
						other,
						hasMoreOlder: engine.hasMoreOlder,
						loadingOlder: engine.loadingOlder,
						loadOlder: engine.loadOlder,
						detached: engine.detached,
						loadNewer: engine.loadNewer,
						term: search.open ? search.query : "",
						currentHitId: search.open && search.total ? resultsRef.current[search.index]?.id ?? null : null,
						flashId,
						liftedId,
						uploading: engine.uploading,
						progress: engine.progress,
						compressing: engine.compressing,
						otherTyping: engine.otherTyping === other,
						handlers,
						listRef,
						onAtBottom: setAtBottom
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: (!atBottom || engine.detached) && !search.open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
						type: "button",
						className: "ig-jump",
						initial: {
							opacity: 0,
							scale: .6,
							y: 10
						},
						animate: {
							opacity: 1,
							scale: 1,
							y: 0
						},
						exit: {
							opacity: 0,
							scale: .6,
							y: 10
						},
						transition: {
							type: "spring",
							stiffness: 520,
							damping: 30
						},
						onClick: () => {
							haptics.light();
							const far = engine.detached;
							engine.returnToLatest().then(() => window.setTimeout(() => scrollToBottom(!far), far ? 60 : 0));
						},
						"aria-label": "Jump to newest",
						"data-testid": "jump-latest-btn",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconChevronDown, { size: 22 })
					}, "jump") })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: { paddingBottom: kbInset },
					className: "ig-composer-wrap",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Composer, {
						value: input,
						onChange: onInput,
						onSend: () => {
							send();
						},
						reply: reply?.snapshot ?? null,
						replyIsMine: reply?.snapshot.sender === sender,
						onCancelReply: () => setReply(null),
						error: engine.error,
						onDismissError: () => engine.setError(null),
						onCamera: () => {
							haptics.light();
							if (cameraInputRef.current) {
								cameraInputRef.current.value = "";
								cameraInputRef.current.click();
							}
						},
						onGallery: () => {
							haptics.light();
							if (galleryInputRef.current) {
								galleryInputRef.current.value = "";
								galleryInputRef.current.click();
							}
						},
						onSticker: () => {
							haptics.light();
							setTray({
								open: true,
								mounted: true
							});
						},
						onPlus: () => {
							haptics.light();
							setPlusOpen((v) => !v);
						},
						plusOpen,
						recorder,
						onVoice: (blob, ms) => {
							engine.sendVoice(blob, ms, takeReply());
						},
						onHint: (m) => engine.setError(m),
						textareaRef,
						onFocus: () => {
							if (atBottom) window.setTimeout(() => scrollToBottom(false), 250);
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: plusOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlusMenu, {
						sender,
						onClose: () => setPlusOpen(false),
						onMusic: () => setMusicOpen(true),
						onWake: wake.start,
						onThemes: () => setThemeOpen(true),
						onDraw: () => setDoodle({
							open: true,
							photo: null
						}),
						onSearch: openSearch,
						onVideo: () => setVideoRec({
							open: true,
							mounted: true
						}),
						onFile: () => {
							if (fileInputRef.current) {
								fileInputRef.current.value = "";
								fileInputRef.current.click();
							}
						}
					}, "plus") })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
					onExitComplete: () => setLiftedId(null),
					children: lift && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LongPressOverlay, {
						target: lift,
						myEmojis,
						renderBubble: () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: lift.bare ? "ig-bare" : "ig-bubble",
							"data-pos": lift.pos,
							"data-side": lift.mine ? "out" : "in",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(bubble_content_default, {
								msg: lift.msg,
								mine: lift.mine,
								term: "",
								uploading: false,
								onOpenMedia: () => {}
							})
						}),
						onClose: closeLift,
						onReact: (e) => {
							const m = lift.msg;
							closeLift();
							haptics.light();
							engine.react(m, e).then((r) => {
								if (r === "limit") engine.setError("You can add up to 6 different reactions to one message.");
							});
						},
						onReply: () => {
							const m = lift.msg;
							closeLift();
							beginReply(m);
						},
						onCopy: () => {
							const t = lift.msg.text ?? "";
							closeLift();
							navigator.clipboard?.writeText(t).then(() => haptics.light()).catch(() => {});
						},
						onEdit: () => {
							const m = lift.msg;
							closeLift();
							setEditMsg(m);
						},
						onUnsend: () => {
							const m = lift.msg;
							closeLift();
							setConfirmMsg(m);
						},
						onDownload: () => {
							const m = lift.msg;
							closeLift();
							downloadMsg(m);
						},
						onReplyGif: () => {
							const m = lift.msg;
							closeLift();
							setReply({
								id: m.id,
								snapshot: makeReplySnapshot(m)
							});
							setTray({
								open: true,
								tab: "gifs",
								mounted: true
							});
						}
					}, lift.msg.id)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AnimatePresence, { children: [
					editMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditDialog, {
						initial: editMsg.text ?? "",
						onCancel: () => setEditMsg(null),
						onSave: (t) => {
							const id = editMsg.id;
							setEditMsg(null);
							haptics.light();
							engine.edit(id, t);
						}
					}, "edit"),
					confirmMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmUnsend, {
						onCancel: () => setConfirmMsg(null),
						onConfirm: () => {
							const m = confirmMsg;
							setConfirmMsg(null);
							haptics.medium();
							engine.unsend(m);
						}
					}, "unsend"),
					liveReactionsMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReactionsSheet, {
						msg: liveReactionsMsg,
						me: sender,
						reactorOf: engine.reactorOf,
						onRemove: (emoji) => {
							haptics.light();
							engine.react(liveReactionsMsg, emoji);
						},
						onClose: () => setReactionsMsg(null)
					}, "reactions"),
					identityOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IdentitySheet, {
						current: sender,
						onClose: () => setIdentityOpen(false),
						onRename: () => {
							haptics.light();
							setIdentityOpen(false);
							setNamesOpen(true);
						},
						onPick: (s) => {
							haptics.success();
							if (s !== sender) broadcastTyping(sender, SESSION_ID, false);
							setSender(s);
							setIdentityOpen(false);
						}
					}, "identity"),
					namesOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NamesSheet, {
						names: settings.names,
						onClose: () => setNamesOpen(false),
						onSave: (next) => {
							haptics.success();
							setNamesOpen(false);
							settings.applyNames(next).then((ok) => {
								if (!ok) engine.setError("Names saved on this phone only — couldn't sync them.");
							});
						}
					}, "names")
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Suspense, {
					fallback: null,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: galleryFiles && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GallerySheet, {
							files: galleryFiles,
							onAddMore: () => galleryInputRef.current?.click(),
							onClose: () => setGalleryFiles(null),
							onSend: sendGallery,
							onDraw: (f) => {
								setGalleryFiles(null);
								setDoodle({
									open: true,
									photo: f
								});
							}
						}, "gallery") }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: doodle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Doodle, {
							photo: doodle.photo,
							onClose: () => setDoodle(null),
							onSend: (file, w, h) => {
								const hadPhoto = !!doodle.photo;
								setDoodle(null);
								if (hadPhoto) engine.sendMedia(file, takeReply());
								else engine.sendDrawing(file, w, h, takeReply());
							}
						}, "doodle") }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: viewer && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaViewer, {
							...viewer,
							onClose: () => setViewer(null)
						}, "viewer") }),
						themeOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemePicker, {
							applied: settings.theme,
							lowFx,
							onPreview: setPreviewTheme,
							onApply: (t) => {
								haptics.success();
								setPreviewTheme(null);
								setThemeOpen(false);
								settings.applyTheme(t).then((ok) => {
									if (!ok) engine.setError("Theme saved on this phone only — couldn't sync it.");
								});
							},
							onClose: () => setThemeOpen(false),
							onToggleLowFx: () => {
								setLowFx((v) => {
									try {
										localStorage.setItem("hb_chat_reduce_fx", v ? "0" : "1");
									} catch {}
									return !v;
								});
							}
						}),
						tray.mounted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StickerTray, {
							open: tray.open,
							initialTab: tray.tab,
							replyingTo: reply ? reply.snapshot.sender === sender ? "yourself" : firstName(reply.snapshot.sender) : null,
							onClose: () => setTray((t) => ({
								...t,
								open: false,
								tab: void 0
							})),
							onSend: (url, kind) => {
								engine.sendSticker(url, kind, takeReply());
							}
						}),
						musicOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MusicPage, {
							dark: true,
							onClose: () => setMusicOpen(false)
						}),
						profileMounted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileMediaPage, {
							open: profileOpen,
							dark: true,
							onClose: () => setProfileOpen(false)
						}),
						videoRec.mounted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoRecorder, {
							open: videoRec.open,
							onClose: () => setVideoRec((v) => ({
								...v,
								open: false
							})),
							onCapture: (file) => {
								setVideoRec((v) => ({
									...v,
									open: false
								}));
								engine.sendMedia(file, takeReply());
							},
							onUnavailable: () => {
								setVideoRec((v) => ({
									...v,
									open: false
								}));
								if (videoFallbackRef.current) {
									videoFallbackRef.current.value = "";
									videoFallbackRef.current.click();
								}
							}
						})
					]
				}),
				wake.ringing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WakeOverlay, {
					status: wake.status,
					error: wake.error,
					onStop: wake.stop
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: galleryInputRef,
					type: "file",
					accept: "image/*,video/*",
					multiple: true,
					hidden: true,
					onChange: (e) => {
						onPickedGallery(e.target.files);
						e.target.value = "";
					},
					"data-testid": "gallery-input"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: cameraInputRef,
					type: "file",
					accept: "image/*,video/*",
					capture: "environment",
					hidden: true,
					onChange: (e) => {
						Array.from(e.target.files ?? []).forEach((f) => {
							engine.sendMedia(f, takeReply());
						});
						e.target.value = "";
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: videoFallbackRef,
					type: "file",
					accept: "video/*",
					capture: "environment",
					hidden: true,
					onChange: (e) => {
						const f = e.target.files?.[0];
						if (f) engine.sendMedia(f, takeReply());
						e.target.value = "";
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: fileInputRef,
					type: "file",
					multiple: true,
					hidden: true,
					onChange: (e) => {
						Array.from(e.target.files ?? []).forEach((f) => {
							engine.sendFile(f, takeReply());
						});
						e.target.value = "";
					},
					"data-testid": "chat-file-input"
				})
			]
		})
	});
}
function ChatPage({ onExit }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IgChat, { onExit });
}
/** Clear the OS app-icon badge and tell the service worker to reset its count. */
async function resetAppBadge() {
	try {
		await navigator.clearAppBadge?.();
	} catch {}
	try {
		if ("serviceWorker" in navigator) {
			const controller = navigator.serviceWorker.controller;
			if (controller) controller.postMessage({ type: "reset-badge" });
			else (await navigator.serviceWorker.ready).active?.postMessage({ type: "reset-badge" });
		}
	} catch {}
}
/**
* Start auto-clearing the badge whenever the app is in the foreground.
* Returns a cleanup function. Safe to call in a React effect.
*/
function initBadgeAutoClear() {
	const handler = () => {
		if (typeof document === "undefined") return;
		if (document.visibilityState === "visible") resetAppBadge();
	};
	handler();
	document.addEventListener("visibilitychange", handler);
	window.addEventListener("focus", handler);
	return () => {
		document.removeEventListener("visibilitychange", handler);
		window.removeEventListener("focus", handler);
	};
}
function App() {
	const [unlocked, setUnlocked] = (0, import_react.useState)(false);
	const unlock = (0, import_react.useCallback)(() => setUnlocked(true), []);
	const lock = (0, import_react.useCallback)(() => setUnlocked(false), []);
	(0, import_react.useEffect)(() => {
		prefetchMessages();
	}, []);
	(0, import_react.useEffect)(() => initBadgeAutoClear(), []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorBoundary, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DefaultProviders, { children: unlocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatPage, { onExit: lock }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lockscreen, { onUnlock: unlock }) }) });
}
var routes_exports = /* @__PURE__ */ __exportAll({ component: () => Home });
function Home() {
	(0, import_react.useEffect)(() => {
		import("./interaction-lock-RJP5G1zJ.mjs").then((m) => m.installInteractionLock());
		import("./orientation-lock-CGzZ5Q_Q.mjs").then((m) => m.installOrientationLock());
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		id: "root",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(App, {})
	});
}
//#endregion
export { supabase as A, haptics as C, getNames as D, formatBytes as E, useNames as O, listMedia as S, fileGlyph as T, THEMES as _, IconDownload as a, fmtSeparator as b, IconSearch as c, IconUndo as d, downloadMedia as f, BUILTIN_WALLPAPERS as g, volumeAdjustable as h, IconClose as i, isSupabaseConfigured as k, IconSend as l, musicStore as m, wallpaper_default as n, IconPlay as o, fmtTime as p, IconBrush as r, IconPlus as s, routes_exports as t, IconTrash as u, THEME_GROUPS as v, __exportAll as w, countMedia as x, textOn as y };
