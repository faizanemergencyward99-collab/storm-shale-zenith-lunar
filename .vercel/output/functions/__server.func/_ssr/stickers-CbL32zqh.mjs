import { A as supabase, k as isSupabaseConfigured } from "./routes-dAk2nEzm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/stickers-CbL32zqh.js
var BUCKET = "chat-media";
var CUSTOM_PREFIX = "sticker/custom";
var FAV_PREFIX = "sticker/favorites";
var RECENTS_KEY = "hb_sticker_recents";
var MAX_RECENTS = 24;
function stickerId(url) {
	let h = 2166136261;
	for (let i = 0; i < url.length; i++) {
		h ^= url.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return (h >>> 0).toString(36);
}
function publicUrl(path) {
	return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
/**
* Upload a custom sticker asset. The object name is the CONTENT HASH, so the
* very same sticker (saved twice, or saved then sent) resolves to one URL and
* never creates duplicates in Custom / Saved / Recent.
*/
async function uploadCustomSticker(file, opts = {}) {
	if (!isSupabaseConfigured) return null;
	try {
		const mime = (file.type || "image/png").split(";")[0];
		const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : mime.includes("gif") ? "gif" : "jpg";
		const path = `${CUSTOM_PREFIX}/${opts.hash ? `h-${opts.hash}` : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}.${ext}`;
		const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
			contentType: mime,
			upsert: true,
			cacheControl: "31536000"
		});
		if (error) {
			const url = publicUrl(path);
			try {
				if ((await fetch(url, {
					method: "HEAD",
					cache: "no-store"
				})).ok) return url;
			} catch {}
			console.error("[stickers] upload error", error);
			return null;
		}
		return publicUrl(path);
	} catch (err) {
		console.error("[stickers] upload threw", err);
		return null;
	}
}
async function listCustomStickers() {
	if (!isSupabaseConfigured) return [];
	try {
		const { data, error } = await supabase.storage.from(BUCKET).list(CUSTOM_PREFIX, {
			limit: 500,
			sortBy: {
				column: "created_at",
				order: "desc"
			}
		});
		if (error || !data) return [];
		return data.filter((f) => f.id !== null && f.name).map((f) => {
			const url = publicUrl(`${CUSTOM_PREFIX}/${f.name}`);
			return {
				id: stickerId(url),
				url,
				kind: "sticker"
			};
		});
	} catch {
		return [];
	}
}
async function deleteCustomSticker(url) {
	try {
		const marker = `/object/public/${BUCKET}/`;
		const idx = url.indexOf(marker);
		if (idx < 0) return;
		const path = url.slice(idx + marker.length);
		await supabase.storage.from(BUCKET).remove([path]);
	} catch {}
}
async function listFavorites() {
	if (!isSupabaseConfigured) return [];
	try {
		const { data, error } = await supabase.storage.from(BUCKET).list(FAV_PREFIX, {
			limit: 500,
			sortBy: {
				column: "created_at",
				order: "desc"
			}
		});
		if (error || !data) return [];
		const files = data.filter((f) => f.id !== null && f.name.endsWith(".json"));
		return (await Promise.all(files.map(async (f) => {
			try {
				const j = await (await fetch(publicUrl(`${FAV_PREFIX}/${f.name}`), { cache: "no-store" })).json();
				if (j?.url) return j;
			} catch {}
			return null;
		}))).filter((r) => Boolean(r));
	} catch {
		return [];
	}
}
async function addFavorite(ref) {
	if (!isSupabaseConfigured) return false;
	try {
		const id = ref.id || stickerId(ref.url);
		const payload = {
			...ref,
			id
		};
		const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
		const { error } = await supabase.storage.from(BUCKET).upload(`${FAV_PREFIX}/${id}.json`, blob, {
			contentType: "application/json",
			upsert: true,
			cacheControl: "0"
		});
		return !error;
	} catch {
		return false;
	}
}
async function removeFavorite(id) {
	if (!isSupabaseConfigured) return false;
	try {
		const { error } = await supabase.storage.from(BUCKET).remove([`${FAV_PREFIX}/${id}.json`]);
		return !error;
	} catch {
		return false;
	}
}
function getRecents() {
	try {
		const raw = localStorage.getItem(RECENTS_KEY);
		if (!raw) return [];
		const arr = JSON.parse(raw);
		return Array.isArray(arr) ? arr.slice(0, MAX_RECENTS) : [];
	} catch {
		return [];
	}
}
function pushRecent(ref) {
	try {
		const id = ref.id || stickerId(ref.url);
		const cur = getRecents().filter((r) => r.id !== id);
		const next = [{
			...ref,
			id
		}, ...cur].slice(0, MAX_RECENTS);
		localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
	} catch {}
}
//#endregion
export { listFavorites as a, stickerId as c, listCustomStickers as i, uploadCustomSticker as l, deleteCustomSticker as n, pushRecent as o, getRecents as r, removeFavorite as s, addFavorite as t };
