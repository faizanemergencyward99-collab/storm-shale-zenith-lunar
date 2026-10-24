// ─────────────────────────────────────────────────────────────────────────────
//  download.ts — save any chat media (photo / video / GIF / sticker / file /
//  voice) as the ORIGINAL file.
//
//  Strategy (most → least reliable):
//   1. fetch → Blob → <a download> (or the native share sheet on mobile,
//      which is the only way to land a file in the iOS Photos/Files app).
//   2. Supabase Storage public URLs support `?download=<name>`, which makes the
//      server answer with Content-Disposition: attachment — a plain anchor
//      download works even when fetch() is blocked (e.g. exotic CORS).
//   3. Last resort: open the URL in a new tab.
//  All URLs in this app are permanent public storage URLs (never signed /
//  expiring), so downloads keep working after refreshes and days later.
// ─────────────────────────────────────────────────────────────────────────────

const EXT_BY_MIME: Record<string, string> = {
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
  "application/zip": "zip",
};

export type DownloadKind = "image" | "video" | "gif" | "sticker" | "file" | "voice";

function extFromUrl(url: string): string {
  try {
    const p = new URL(url).pathname;
    const m = /\.([a-z0-9]{2,5})$/i.exec(p);
    return m ? m[1].toLowerCase() : "";
  } catch {
    return "";
  }
}

export function suggestFilename(
  url: string,
  kind: DownloadKind,
  mime?: string | null,
  original?: string | null,
  ts?: number | null,
): string {
  if (original) return original;
  const d = ts ? new Date(ts) : new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
  const ext =
    (mime && EXT_BY_MIME[mime.split(";")[0].trim()]) ||
    extFromUrl(url) ||
    (kind === "video" ? "mp4" : kind === "gif" || kind === "sticker" ? "gif" : kind === "voice" ? "m4a" : kind === "file" ? "bin" : "jpg");
  const label =
    kind === "image" ? "photo" : kind === "video" ? "video" : kind === "gif" ? "gif" : kind === "sticker" ? "sticker" : kind === "voice" ? "voice" : "file";
  return `ourchat-${label}-${stamp}.${ext}`;
}

/** Add Supabase's `?download=` hint when the URL is a storage public object. */
export function withDownloadHint(url: string, filename: string): string {
  if (!/\/storage\/v1\/object\/public\//.test(url)) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("download", filename);
    return u.toString();
  } catch {
    return url;
  }
}

function triggerAnchor(href: string, filename: string, newTab = false) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.rel = "noopener";
  if (newTab) a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadMedia(
  url: string,
  kind: DownloadKind,
  opts: { filename?: string | null; mime?: string | null; ts?: number | null; preferShare?: boolean } = {},
): Promise<"saved" | "shared" | "opened"> {
  const filename = suggestFilename(url, kind, opts.mime, opts.filename, opts.ts);
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const file = new File([blob], filename, { type: blob.type || opts.mime || "application/octet-stream" });
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    // Mobile: the share sheet is how you "Save to Photos" / "Save to Files".
    const coarse = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
    if ((opts.preferShare ?? coarse) && nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file] });
        return "shared";
      } catch (e) {
        // User cancelled the sheet → treat as done; otherwise fall through to <a download>.
        if ((e as { name?: string })?.name === "AbortError") return "shared";
      }
    }
    const objUrl = URL.createObjectURL(blob);
    triggerAnchor(objUrl, filename);
    setTimeout(() => URL.revokeObjectURL(objUrl), 10_000);
    return "saved";
  } catch {
    // Fallback: server-side attachment header (Supabase) or new tab.
    const hinted = withDownloadHint(url, filename);
    triggerAnchor(hinted, filename, hinted === url);
    return "opened";
  }
}

export function formatBytes(n?: number | null): string {
  if (!n || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Emoji glyph for a file bubble / gallery tile based on its MIME or name. */
export function fileGlyph(mime?: string | null, name?: string | null): string {
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
