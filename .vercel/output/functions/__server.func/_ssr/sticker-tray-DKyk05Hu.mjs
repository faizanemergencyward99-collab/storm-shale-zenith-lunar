import { i as __toESM } from "../_runtime.mjs";
import { d as require_react_dom, q as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as AnimatePresence, t as useDragControls } from "../_libs/framer-motion+[...].mjs";
import { t as motion } from "../_libs/motion.mjs";
import { C as haptics, c as IconSearch, s as IconPlus, w as __exportAll } from "./routes-dAk2nEzm.mjs";
import { a as listFavorites, c as stickerId, i as listCustomStickers, l as uploadCustomSticker, n as deleteCustomSticker, o as pushRecent, r as getRecents, s as removeFavorite, t as addFavorite } from "./stickers-CbL32zqh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sticker-tray-DKyk05Hu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
var EDIT_MAX_SIDE = 1024;
var StickerImageError = class extends Error {};
var HEIC_TYPES = [
	"image/heic",
	"image/heif",
	"image/heic-sequence",
	"image/heif-sequence"
];
function isHeicLike(file) {
	const t = (file.type || "").toLowerCase();
	if (HEIC_TYPES.includes(t)) return true;
	const n = (file.name || "").toLowerCase();
	return n.endsWith(".heic") || n.endsWith(".heif");
}
function makeCanvas(w, h) {
	const c = document.createElement("canvas");
	c.width = Math.max(1, Math.round(w));
	c.height = Math.max(1, Math.round(h));
	return c;
}
function cloneCanvas(src) {
	const c = makeCanvas(src.width, src.height);
	c.getContext("2d").drawImage(src, 0, 0);
	return c;
}
function fitScale(w, h, maxSide) {
	const m = Math.max(w, h);
	return m > maxSide ? maxSide / m : 1;
}
async function blobToImageElement(blob) {
	const url = URL.createObjectURL(blob);
	try {
		const img = new Image();
		img.decoding = "async";
		await new Promise((res, rej) => {
			img.onload = () => res();
			img.onerror = () => rej(new StickerImageError("decode-failed"));
			img.src = url;
		});
		return img;
	} finally {
		setTimeout(() => URL.revokeObjectURL(url), 5e3);
	}
}
async function drawSourceToCanvas(src, maxSide) {
	const w = "naturalWidth" in src ? src.naturalWidth : src.width;
	const h = "naturalHeight" in src ? src.naturalHeight : src.height;
	if (!w || !h) throw new StickerImageError("empty-image");
	const s = fitScale(w, h, maxSide);
	const c = makeCanvas(w * s, h * s);
	const ctx = c.getContext("2d", { willReadFrequently: true });
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(src, 0, 0, c.width, c.height);
	if ("close" in src) src.close();
	return c;
}
async function heicToPng(blob) {
	const mod = await import("../_libs/heic2any.mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
	const out = await (mod.default ?? mod)({
		blob,
		toType: "image/png"
	});
	return Array.isArray(out) ? out[0] : out;
}
/**
* Decode a user-picked file into a canvas no larger than `maxSide`.
* Tries the fast native path first (createImageBitmap honours EXIF and can
* downscale while decoding, which keeps memory in check for 12–48 MP photos);
* falls back to <img>; converts HEIC/HEIF with heic2any when the browser
* cannot decode it natively.
*/
async function decodeImageFile(file, maxSide = EDIT_MAX_SIDE) {
	if (file.size > 41943040) throw new StickerImageError("too-large");
	if (file.size === 0) throw new StickerImageError("empty-file");
	const tryNative = async (blob) => {
		if (typeof createImageBitmap === "function") try {
			let bmp;
			try {
				bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
			} catch {
				bmp = await createImageBitmap(blob);
			}
			return await drawSourceToCanvas(bmp, maxSide);
		} catch {}
		return drawSourceToCanvas(await blobToImageElement(blob), maxSide);
	};
	try {
		return await tryNative(file);
	} catch (e) {
		if (isHeicLike(file)) try {
			return await tryNative(await heicToPng(file));
		} catch {
			throw new StickerImageError("heic-unsupported");
		}
		if (e instanceof StickerImageError) throw e;
		throw new StickerImageError("decode-failed");
	}
}
/** Human-friendly message for a StickerImageError / unknown error. */
function describeImageError(e) {
	switch (e instanceof Error ? e.message : String(e)) {
		case "too-large": return "That image is too big (max 40 MB). Try a smaller one.";
		case "empty-file": return "That file looks empty. Pick another image.";
		case "heic-unsupported": return "Couldn't open this HEIC photo here. Try sharing it as JPG/PNG.";
		case "empty-image":
		case "decode-failed": return "Couldn't read that image. Try a PNG, JPG or WebP.";
		default: return "Something went wrong with that image. Please try again.";
	}
}
/** Bounding box of pixels with alpha > threshold, or null if fully transparent. */
function alphaBounds(canvas, threshold = 10) {
	const { width: w, height: h } = canvas;
	const data = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, w, h).data;
	let x0 = w, y0 = h, x1 = -1, y1 = -1;
	for (let y = 0; y < h; y++) {
		const row = y * w * 4;
		for (let x = 0; x < w; x++) if (data[row + x * 4 + 3] > threshold) {
			if (x < x0) x0 = x;
			if (x > x1) x1 = x;
			if (y < y0) y0 = y;
			if (y > y1) y1 = y;
		}
	}
	if (x1 < 0) return null;
	return {
		x0,
		y0,
		x1: x1 + 1,
		y1: y1 + 1
	};
}
/**
* Crop to the visible subject with a little breathing room around it (no
* zoom-in beyond the subject, aspect ratio untouched). Fully-opaque images
* ("Original" mode) are returned as-is.
*/
function autoCropSticker(canvas, padRatio = .06) {
	const b = alphaBounds(canvas);
	if (!b) return canvas;
	const bw = b.x1 - b.x0;
	const bh = b.y1 - b.y0;
	if (bw >= canvas.width - 2 && bh >= canvas.height - 2) return canvas;
	const pad = Math.round(Math.max(bw, bh) * padRatio) + 2;
	const x0 = Math.max(0, b.x0 - pad);
	const y0 = Math.max(0, b.y0 - pad);
	const x1 = Math.min(canvas.width, b.x1 + pad);
	const y1 = Math.min(canvas.height, b.y1 + pad);
	const out = makeCanvas(x1 - x0, y1 - y0);
	out.getContext("2d").drawImage(canvas, x0, y0, x1 - x0, y1 - y0, 0, 0, out.width, out.height);
	return out;
}
/** Downscale (never upscale) so the longest side is ≤ maxSide. */
function limitCanvas(canvas, maxSide) {
	const s = fitScale(canvas.width, canvas.height, maxSide);
	if (s >= 1) return canvas;
	const out = makeCanvas(canvas.width * s, canvas.height * s);
	const ctx = out.getContext("2d");
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(canvas, 0, 0, out.width, out.height);
	return out;
}
/** Clean sticker canvas: tight-but-padded crop + size cap. Pure function. */
function finalizeSticker(canvas) {
	return limitCanvas(autoCropSticker(canvas), 512);
}
var webpAlphaSupport = null;
/** Can this browser ENCODE WebP with an alpha channel from a canvas? */
function supportsWebpExport() {
	if (webpAlphaSupport !== null) return webpAlphaSupport;
	try {
		const c = makeCanvas(2, 2);
		const ctx = c.getContext("2d");
		ctx.fillStyle = "rgba(255,0,0,0.5)";
		ctx.fillRect(0, 0, 1, 1);
		webpAlphaSupport = c.toDataURL("image/webp").startsWith("data:image/webp");
	} catch {
		webpAlphaSupport = false;
	}
	return webpAlphaSupport;
}
function canvasToBlob(canvas, mime, quality) {
	return new Promise((res, rej) => {
		canvas.toBlob((b) => b ? res(b) : rej(new StickerImageError("encode-failed")), mime, quality);
	});
}
/**
* Encode the finished sticker. WebP (lossy, alpha preserved) when the browser
* can encode it — ~4–8x smaller than PNG so stickers pop in fast in chat —
* otherwise PNG. Whichever is smaller wins when both are available.
*/
async function exportSticker(canvas) {
	const png = await canvasToBlob(canvas, "image/png");
	if (supportsWebpExport()) try {
		const webp = await canvasToBlob(canvas, "image/webp", .9);
		if (webp.type === "image/webp" && webp.size < png.size) return {
			blob: webp,
			mime: "image/webp",
			width: canvas.width,
			height: canvas.height
		};
	} catch {}
	return {
		blob: png,
		mime: "image/png",
		width: canvas.width,
		height: canvas.height
	};
}
/** Content hash → deterministic storage name so the same sticker never uploads twice. */
async function blobHash(blob) {
	try {
		if (crypto?.subtle) {
			const buf = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
			return Array.from(new Uint8Array(buf)).slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
		}
	} catch {}
	const bytes = new Uint8Array(await blob.arrayBuffer());
	let h1 = 2166136261, h2 = 16777619;
	for (let i = 0; i < bytes.length; i++) {
		h1 = Math.imul(h1 ^ bytes[i], 16777619);
		h2 = Math.imul(h2 ^ bytes[i * 7 % bytes.length], 16777619) ^ i;
	}
	return ((h1 >>> 0).toString(16) + (h2 >>> 0).toString(16)).padStart(16, "0");
}
/** Draw a canvas onto a fresh canvas of the same size (used for undo snapshots). */
function snapshot(canvas) {
	return canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height);
}
function restore(canvas, data) {
	canvas.getContext("2d").putImageData(data, 0, 0);
}
var API = "https://api.giphy.com/v1";
var KEY = "dcQl6lWN65C69fJTsrRVmtEx1IrVCEyp";
var STICKERS_KEY = KEY;
var isGiphyConfigured = Boolean(KEY);
var keyFor = (kind) => kind === "stickers" ? STICKERS_KEY : KEY;
/** Best display URL for an item (prefer small animated webp, then gif, then original). */
function giphyPreviewUrl(item) {
	const fw = item.images.fixed_width;
	return fw?.webp || fw?.url || item.images.fixed_height?.url || item.images.original?.url || "";
}
/** Full-size URL to actually send into the chat (keeps animation, unmodified). */
function giphySendUrl(item) {
	return item.images.original?.url || item.images.fixed_width?.url || giphyPreviewUrl(item);
}
var WINDOW_MS = 36e5;
var FALLBACK_COOLDOWN_MS = 3e5;
var LOG_PREFIX = "giphy:calls:";
var LIMIT_PREFIX = "giphy:limitUntil:";
var GiphyRateLimitError = class extends Error {
	retryAt;
	constructor(retryAt) {
		super("GIPHY hourly limit reached.");
		this.name = "GiphyRateLimitError";
		this.retryAt = retryAt;
	}
};
var safeGet = (k) => {
	try {
		return localStorage.getItem(k);
	} catch {
		return null;
	}
};
var safeSet = (k, v) => {
	try {
		localStorage.setItem(k, v);
	} catch {}
};
var keyTag = (key) => key.slice(-6);
function recordCall(key) {
	const now = Date.now();
	const prev = JSON.parse(safeGet(LOG_PREFIX + keyTag(key)) ?? "[]").filter((t) => now - t < WINDOW_MS);
	prev.push(now);
	safeSet(LOG_PREFIX + keyTag(key), JSON.stringify(prev.slice(-120)));
}
function estimateRetryAt(key) {
	const now = Date.now();
	const calls = JSON.parse(safeGet(LOG_PREFIX + keyTag(key)) ?? "[]").filter((t) => now - t < WINDOW_MS).sort((a, b) => a - b);
	const guess = calls.length ? calls[0] + WINDOW_MS : now + FALLBACK_COOLDOWN_MS;
	return Math.min(Math.max(guess, now + 3e4), now + WINDOW_MS);
}
/** If we already know this kind's key is rate-limited, returns the epoch ms it clears; else 0. */
function giphyRateLimitedUntil(kind) {
	const until = Number(safeGet(LIMIT_PREFIX + keyTag(keyFor(kind))) ?? 0);
	return until > Date.now() ? until : 0;
}
async function get(kind, path, params) {
	const key = keyFor(kind);
	if (!key) throw new Error("GIF search isn’t configured.");
	const knownUntil = giphyRateLimitedUntil(kind);
	if (knownUntil) throw new GiphyRateLimitError(knownUntil);
	const qs = new URLSearchParams({ api_key: key });
	Object.entries(params).forEach(([k, v]) => qs.set(k, String(v)));
	recordCall(key);
	const res = await fetch(`${API}${path}?${qs.toString()}`);
	const body = await res.json().catch(() => null);
	if (!res.ok || body?.meta?.status !== 200) {
		if (res.status === 429 || body?.meta?.status === 429) {
			const retryAt = estimateRetryAt(key);
			safeSet(LIMIT_PREFIX + keyTag(key), String(retryAt));
			throw new GiphyRateLimitError(retryAt);
		}
		if (res.status === 401 || res.status === 403) throw new Error("GIPHY API key is invalid or not authorized.");
		throw new Error(body?.meta?.msg ?? `GIPHY request failed (${res.status})`);
	}
	return body;
}
var paging = (offset, rating) => ({
	limit: 24,
	offset,
	rating,
	bundle: "messaging_non_clips"
});
var giphy = {
	trending: (kind, offset = 0, rating = "pg") => get(kind, `/${kind}/trending`, paging(offset, rating)),
	search: (kind, q, offset = 0, rating = "pg") => get(kind, `/${kind}/search`, {
		...paging(offset, rating),
		q: q.trim().slice(0, 50)
	})
};
var sticker_tray_exports = /* @__PURE__ */ __exportAll({ default: () => StickerTray });
var StickerEditor = (0, import_react.lazy)(() => import("./sticker-editor-B5rPyVY4.mjs"));
var TABS = [
	{
		id: "recents",
		label: "Recents"
	},
	{
		id: "mine",
		label: "My Stickers"
	},
	{
		id: "stickers",
		label: "Stickers"
	},
	{
		id: "gifs",
		label: "GIFs"
	}
];
function Cell({ r, onTap, onLong }) {
	const t = (0, import_react.useRef)({
		timer: 0,
		fired: false,
		x: 0,
		y: 0
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
		type: "button",
		className: "ig-tray-cell",
		"data-kind": r.kind,
		whileTap: { scale: .82 },
		transition: {
			type: "spring",
			stiffness: 600,
			damping: 24
		},
		onPointerDown: (e) => {
			t.current.fired = false;
			t.current.x = e.clientX;
			t.current.y = e.clientY;
			if (!onLong) return;
			t.current.timer = window.setTimeout(() => {
				t.current.fired = true;
				haptics.medium();
				onLong();
			}, 460);
		},
		onPointerMove: (e) => {
			if (Math.hypot(e.clientX - t.current.x, e.clientY - t.current.y) > 10) clearTimeout(t.current.timer);
		},
		onPointerUp: () => clearTimeout(t.current.timer),
		onPointerCancel: () => clearTimeout(t.current.timer),
		onContextMenu: (e) => {
			e.preventDefault();
			if (onLong) {
				t.current.fired = true;
				onLong();
			}
		},
		onClick: (e) => {
			if (t.current.fired) return;
			onTap(e.currentTarget.getBoundingClientRect());
		},
		"data-testid": "sticker-cell",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: r.url,
			alt: r.title ?? "",
			loading: "lazy",
			decoding: "async",
			draggable: false
		})
	});
}
function StickerTray({ open, initialTab, replyingTo, onClose, onSend }) {
	const [tab, setTab] = (0, import_react.useState)("stickers");
	const [query, setQuery] = (0, import_react.useState)("");
	const [items, setItems] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [hasMore, setHasMore] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [limitUntil, setLimitUntil] = (0, import_react.useState)(0);
	const [favorites, setFavorites] = (0, import_react.useState)([]);
	const [customs, setCustoms] = (0, import_react.useState)([]);
	const [recents, setRecents] = (0, import_react.useState)([]);
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	const [menu, setMenu] = (0, import_react.useState)(null);
	const [editorFile, setEditorFile] = (0, import_react.useState)(null);
	const [fly, setFly] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const scrollRef = (0, import_react.useRef)(null);
	const sentinelRef = (0, import_react.useRef)(null);
	const fileRef = (0, import_react.useRef)(null);
	const reqRef = (0, import_react.useRef)(0);
	const moreLock = (0, import_react.useRef)(false);
	const drag = useDragControls();
	const collapsedY = typeof window !== "undefined" ? Math.round(window.innerHeight * .36) : 300;
	const favIds = (0, import_react.useMemo)(() => new Set(favorites.map((f) => f.id)), [favorites]);
	const customIds = (0, import_react.useMemo)(() => new Set(customs.map((c) => c.id)), [customs]);
	const mine = (0, import_react.useMemo)(() => {
		const seen = /* @__PURE__ */ new Set();
		return [...favorites, ...customs].filter((r) => seen.has(r.id) ? false : (seen.add(r.id), true));
	}, [favorites, customs]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		setRecents(getRecents());
		setExpanded(false);
		if (initialTab) setTab(initialTab);
		else setTab(getRecents().length ? "recents" : "stickers");
		Promise.all([listFavorites(), listCustomStickers()]).then(([f, c]) => {
			setFavorites(f);
			setCustoms(c);
		});
	}, [open, initialTab]);
	const giphyKind = tab === "gifs" ? "gifs" : tab === "stickers" ? "stickers" : null;
	const load = (0, import_react.useCallback)(async (kind, q, offset) => {
		if (!isGiphyConfigured) {
			setError("GIF search isn't set up.");
			return;
		}
		const known = giphyRateLimitedUntil(kind);
		if (known) {
			setLimitUntil(known);
			return;
		}
		const id = offset === 0 ? ++reqRef.current : reqRef.current;
		if (offset === 0) {
			setLoading(true);
			setError("");
			setLimitUntil(0);
		}
		try {
			const r = q.trim() ? await giphy.search(kind, q, offset, "pg") : await giphy.trending(kind, offset, "pg");
			if (id !== reqRef.current) return;
			setItems((prev) => {
				if (offset === 0) return r.data;
				const ids = new Set(prev.map((p) => p.id));
				return [...prev, ...r.data.filter((d) => !ids.has(d.id))];
			});
			const total = r.pagination?.total_count;
			setHasMore(r.data.length >= 24 && (total === void 0 || offset + r.data.length < total));
			if (offset === 0) scrollRef.current?.scrollTo({ top: 0 });
		} catch (e) {
			if (id !== reqRef.current) return;
			if (e instanceof GiphyRateLimitError) setLimitUntil(e.retryAt);
			else setError(e instanceof Error ? e.message : "Couldn't load. Try again.");
			setHasMore(false);
		} finally {
			if (id === reqRef.current) setLoading(false);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		if (!open || !giphyKind) return;
		const t = setTimeout(() => {
			load(giphyKind, query, 0);
		}, query.trim() ? 350 : 0);
		return () => clearTimeout(t);
	}, [
		open,
		giphyKind,
		query,
		load
	]);
	(0, import_react.useEffect)(() => {
		const root = scrollRef.current;
		const target = sentinelRef.current;
		if (!open || !giphyKind || !root || !target || !hasMore) return;
		const io = new IntersectionObserver((en) => {
			if (!en.some((x) => x.isIntersecting) || moreLock.current) return;
			moreLock.current = true;
			load(giphyKind, query, items.length).finally(() => {
				moreLock.current = false;
			});
		}, {
			root,
			rootMargin: "0px 0px 400px 0px"
		});
		io.observe(target);
		return () => io.disconnect();
	}, [
		open,
		giphyKind,
		hasMore,
		items.length,
		query,
		load
	]);
	const pick = (r, rect) => {
		haptics.medium();
		pushRecent(r);
		setFly({
			src: r.url,
			rect,
			key: Date.now()
		});
		onSend(r.url, r.kind);
		onClose();
	};
	const toggleFav = async (r) => {
		if (favIds.has(r.id)) {
			setFavorites((p) => p.filter((f) => f.id !== r.id));
			if (!await removeFavorite(r.id)) setFavorites((p) => [r, ...p]);
		} else {
			setFavorites((p) => [r, ...p]);
			if (!await addFavorite(r)) setFavorites((p) => p.filter((f) => f.id !== r.id));
		}
	};
	const upload = async (out) => {
		setBusy(true);
		try {
			const url = await uploadCustomSticker(out.blob, { hash: await blobHash(out.blob) });
			if (!url) return null;
			const ref = {
				id: stickerId(url),
				url,
				kind: "sticker",
				title: "Custom sticker"
			};
			setCustoms((p) => p.some((c) => c.id === ref.id) ? p : [ref, ...p]);
			return ref;
		} finally {
			setBusy(false);
		}
	};
	const grid = (refs, empty, allowMenu) => refs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "ig-tray-empty",
		children: empty
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "ig-tray-grid",
		"data-gifs": tab === "gifs" ? "" : void 0,
		children: refs.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
			r,
			onTap: (rect) => pick(r, rect),
			onLong: allowMenu ? () => setMenu({
				ref: r,
				custom: customIds.has(r.id)
			}) : void 0
		}, r.id))
	});
	const giphyRefs = items.map((it) => {
		const url = giphySendUrl(it);
		return {
			id: stickerId(url),
			url,
			kind: tab === "gifs" ? "gif" : "sticker",
			title: it.title,
			preview: giphyPreviewUrl(it)
		};
	});
	const sheet = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		className: "ig-tray-root",
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
			className: "ig-tray-scrim",
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
			className: "ig-tray",
			"data-testid": "sticker-panel",
			initial: { y: "100%" },
			animate: { y: expanded ? 0 : collapsedY },
			exit: { y: "100%" },
			transition: {
				type: "spring",
				stiffness: 380,
				damping: 40
			},
			drag: "y",
			dragListener: false,
			dragControls: drag,
			dragConstraints: {
				top: 0,
				bottom: collapsedY
			},
			dragElastic: {
				top: .05,
				bottom: .8
			},
			onDragEnd: (_, info) => {
				if (info.offset.y < -60 || info.velocity.y < -500) setExpanded(true);
				else if (info.offset.y > 110 || info.velocity.y > 600) {
					if (expanded && info.offset.y < 260) setExpanded(false);
					else onClose();
				}
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ig-tray-head",
					onPointerDown: (e) => drag.start(e),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ig-sheet-grab" }),
						replyingTo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "ig-tray-reply",
							children: ["Replying to ", replyingTo]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ig-tray-search",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconSearch, { size: 17 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: query,
								onChange: (e) => {
									setQuery(e.target.value);
									if (tab === "recents" || tab === "mine") setTab("stickers");
								},
								onFocus: () => setExpanded(true),
								placeholder: "Search",
								maxLength: 50,
								"data-testid": "sticker-search-input"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "ig-tray-tabs",
							role: "tablist",
							children: TABS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								role: "tab",
								"aria-selected": tab === t.id,
								className: "ig-tray-tab",
								"data-on": tab === t.id ? "" : void 0,
								onClick: () => {
									haptics.selection();
									setTab(t.id);
								},
								"data-testid": `sticker-tab-${t.id}`,
								children: t.label
							}, t.id))
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ig-tray-scroll",
					ref: scrollRef,
					style: { paddingBottom: expanded ? 24 : collapsedY + 24 },
					"data-testid": "sticker-scroll",
					children: [
						tab === "recents" && grid(recents, "Stickers and GIFs you send show up here.", false),
						tab === "mine" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ig-tray-grid",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "ig-tray-cell ig-tray-create",
								onClick: () => fileRef.current?.click(),
								disabled: busy,
								"data-testid": "sticker-upload-btn",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPlus, { size: 26 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: busy ? "Saving…" : "Create" })]
							}), mine.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
								r,
								onTap: (rect) => pick(r, rect),
								onLong: () => setMenu({
									ref: r,
									custom: customIds.has(r.id)
								})
							}, r.id))]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ig-tray-hint",
							children: "Long-press a sticker to save, unsave or delete it."
						})] }),
						giphyKind && (limitUntil ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "ig-tray-empty",
							"data-testid": "giphy-rate-limit",
							children: [
								"GIPHY needs a short breather. Try again at ",
								new Date(limitUntil).toLocaleTimeString([], {
									hour: "numeric",
									minute: "2-digit"
								}),
								"."
							]
						}) : loading && items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "ig-tray-grid",
							children: Array.from({ length: 12 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ig-tray-skel" }, i))
						}) : error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ig-tray-empty",
							children: error
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "ig-tray-grid",
								"data-gifs": tab === "gifs" ? "" : void 0,
								"data-testid": `giphy-grid-${tab}`,
								children: giphyRefs.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
									r: {
										...r,
										url: r.preview
									},
									onTap: (rect) => pick({
										id: r.id,
										url: r.url,
										kind: r.kind,
										title: r.title
									}, rect),
									onLong: () => setMenu({
										ref: {
											id: r.id,
											url: r.url,
											kind: r.kind,
											title: r.title
										},
										custom: false
									})
								}, r.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								ref: sentinelRef,
								style: { height: 1 }
							}),
							!items.length && !loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ig-tray-empty",
								children: "No results"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ig-tray-hint",
								children: "Powered by GIPHY"
							})
						] }))
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: menu && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
					className: "ig-tray-menu-scrim",
					initial: { opacity: 0 },
					animate: { opacity: 1 },
					exit: { opacity: 0 },
					onClick: () => setMenu(null),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
						className: "ig-tray-menu",
						initial: {
							y: 40,
							opacity: 0
						},
						animate: {
							y: 0,
							opacity: 1
						},
						exit: {
							y: 40,
							opacity: 0
						},
						transition: {
							type: "spring",
							stiffness: 480,
							damping: 34
						},
						onClick: (e) => e.stopPropagation(),
						"data-testid": "sticker-cell-menu",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: menu.ref.url,
								alt: ""
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									const r = menu.ref;
									setMenu(null);
									toggleFav(r);
								},
								"data-testid": "cell-menu-save",
								children: favIds.has(menu.ref.id) ? "Remove from My Stickers" : "Save to My Stickers"
							}),
							menu.custom && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"data-danger": "",
								onClick: () => {
									const r = menu.ref;
									setMenu(null);
									setCustoms((p) => p.filter((c) => c.id !== r.id));
									deleteCustomSticker(r.url);
								},
								"data-testid": "cell-menu-delete",
								children: "Delete sticker"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setMenu(null),
								"data-testid": "cell-menu-cancel",
								children: "Cancel"
							})
						]
					})
				}, "menu") })
			]
		})]
	}, "tray") });
	const vw = typeof window !== "undefined" ? window.innerWidth : 390;
	const vh = typeof window !== "undefined" ? window.innerHeight : 800;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		(0, import_react_dom.createPortal)(sheet, document.body),
		fly && (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.img, {
			src: fly.src,
			alt: "",
			className: "ig-fly",
			style: {
				left: fly.rect.left,
				top: fly.rect.top,
				width: fly.rect.width,
				height: fly.rect.height
			},
			initial: {
				x: 0,
				y: 0,
				scale: .85,
				opacity: 1
			},
			animate: {
				x: Math.min(vw, 480) * .5 + (vw - Math.min(vw, 480)) / 2 + 60 - fly.rect.left - fly.rect.width / 2,
				y: vh - 190 - fly.rect.top,
				scale: [
					.85,
					1.25,
					1
				],
				opacity: [
					1,
					1,
					0
				]
			},
			transition: {
				duration: .5,
				ease: [
					.3,
					1.3,
					.5,
					1
				]
			},
			onAnimationComplete: () => setFly(null)
		}, fly.key), document.body),
		(0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			ref: fileRef,
			type: "file",
			accept: "image/*,.heic,.heif",
			onChange: (e) => {
				const f = e.target.files?.[0];
				e.target.value = "";
				if (f) setEditorFile(f);
			},
			style: {
				position: "fixed",
				left: -9999,
				width: 1,
				height: 1,
				opacity: 0
			},
			tabIndex: -1,
			"aria-hidden": true,
			"data-testid": "sticker-file-input"
		}), document.body),
		editorFile && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
			fallback: null,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StickerEditor, {
				file: editorFile,
				dark: true,
				onClose: () => setEditorFile(null),
				onSave: async (out) => {
					const ref = await upload(out);
					if (!ref) return false;
					setFavorites((p) => p.some((f) => f.id === ref.id) ? p : [ref, ...p]);
					await addFavorite(ref);
					setEditorFile(null);
					setTab("mine");
					return true;
				},
				onSend: async (out) => {
					const ref = await upload(out);
					if (!ref) return false;
					setEditorFile(null);
					pushRecent(ref);
					onSend(ref.url, "sticker");
					onClose();
					return true;
				}
			})
		})
	] });
}
//#endregion
export { describeImageError as a, makeCanvas as c, decodeImageFile as i, restore as l, canvasToBlob as n, exportSticker as o, cloneCanvas as r, finalizeSticker as s, sticker_tray_exports as t, snapshot as u };
