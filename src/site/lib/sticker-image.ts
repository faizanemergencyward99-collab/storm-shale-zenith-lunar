// ─────────────────────────────────────────────────────────────────────────────
//  Sticker image helpers — decode anything the phone hands us (JPG/PNG/WebP/
//  GIF/HEIC, huge camera photos, EXIF-rotated), work on a bounded canvas,
//  auto-crop to the visible subject with padding, and export a small file
//  with alpha (WebP where the browser can encode it, PNG otherwise).
// ─────────────────────────────────────────────────────────────────────────────

export const EDIT_MAX_SIDE = 1024; // working resolution for the editor / AI
export const STICKER_MAX_SIDE = 512; // final asset (chat renders ≤168px, 3x retina)
export const MAX_INPUT_BYTES = 40 * 1024 * 1024;

export class StickerImageError extends Error {}

const HEIC_TYPES = ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"];

export function isHeicLike(file: Blob & { name?: string }): boolean {
  const t = (file.type || "").toLowerCase();
  if (HEIC_TYPES.includes(t)) return true;
  const n = (file.name || "").toLowerCase();
  return n.endsWith(".heic") || n.endsWith(".heif");
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

export function cloneCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const c = makeCanvas(src.width, src.height);
  c.getContext("2d")!.drawImage(src, 0, 0);
  return c;
}

function fitScale(w: number, h: number, maxSide: number): number {
  const m = Math.max(w, h);
  return m > maxSide ? maxSide / m : 1;
}

async function blobToImageElement(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new StickerImageError("decode-failed"));
      img.src = url;
    });
    return img;
  } finally {
    // revoke after the image has been painted to a canvas by the caller
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

async function drawSourceToCanvas(
  src: ImageBitmap | HTMLImageElement,
  maxSide: number,
): Promise<HTMLCanvasElement> {
  const w = "naturalWidth" in src ? src.naturalWidth : src.width;
  const h = "naturalHeight" in src ? src.naturalHeight : src.height;
  if (!w || !h) throw new StickerImageError("empty-image");
  const s = fitScale(w, h, maxSide);
  const c = makeCanvas(w * s, h * s);
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, c.width, c.height);
  if ("close" in src) src.close();
  return c;
}

async function heicToPng(blob: Blob): Promise<Blob> {
  const mod = await import("heic2any");
  const heic2any = (mod.default ?? mod) as unknown as (o: {
    blob: Blob;
    toType: string;
    quality?: number;
  }) => Promise<Blob | Blob[]>;
  const out = await heic2any({ blob, toType: "image/png" });
  return Array.isArray(out) ? out[0] : out;
}

/**
 * Decode a user-picked file into a canvas no larger than `maxSide`.
 * Tries the fast native path first (createImageBitmap honours EXIF and can
 * downscale while decoding, which keeps memory in check for 12–48 MP photos);
 * falls back to <img>; converts HEIC/HEIF with heic2any when the browser
 * cannot decode it natively.
 */
export async function decodeImageFile(
  file: Blob & { name?: string },
  maxSide = EDIT_MAX_SIDE,
): Promise<HTMLCanvasElement> {
  if (file.size > MAX_INPUT_BYTES) throw new StickerImageError("too-large");
  if (file.size === 0) throw new StickerImageError("empty-file");

  const tryNative = async (blob: Blob): Promise<HTMLCanvasElement> => {
    if (typeof createImageBitmap === "function") {
      try {
        // Ask the decoder to downscale for us when the picture is enormous.
        let bmp: ImageBitmap;
        try {
          bmp = await createImageBitmap(blob, { imageOrientation: "from-image" } as ImageBitmapOptions);
        } catch {
          bmp = await createImageBitmap(blob);
        }
        return await drawSourceToCanvas(bmp, maxSide);
      } catch {
        /* fall through to <img> */
      }
    }
    const img = await blobToImageElement(blob);
    return drawSourceToCanvas(img, maxSide);
  };

  try {
    return await tryNative(file);
  } catch (e) {
    if (isHeicLike(file)) {
      try {
        const png = await heicToPng(file);
        return await tryNative(png);
      } catch {
        throw new StickerImageError("heic-unsupported");
      }
    }
    if (e instanceof StickerImageError) throw e;
    throw new StickerImageError("decode-failed");
  }
}

/** Human-friendly message for a StickerImageError / unknown error. */
export function describeImageError(e: unknown): string {
  const code = e instanceof Error ? e.message : String(e);
  switch (code) {
    case "too-large":
      return "That image is too big (max 40 MB). Try a smaller one.";
    case "empty-file":
      return "That file looks empty. Pick another image.";
    case "heic-unsupported":
      return "Couldn't open this HEIC photo here. Try sharing it as JPG/PNG.";
    case "empty-image":
    case "decode-failed":
      return "Couldn't read that image. Try a PNG, JPG or WebP.";
    default:
      return "Something went wrong with that image. Please try again.";
  }
}

/** Bounding box of pixels with alpha > threshold, or null if fully transparent. */
export function alphaBounds(
  canvas: HTMLCanvasElement,
  threshold = 10,
): { x0: number; y0: number; x1: number; y1: number } | null {
  const { width: w, height: h } = canvas;
  const data = canvas.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    const row = y * w * 4;
    for (let x = 0; x < w; x++) {
      if (data[row + x * 4 + 3] > threshold) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  return { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}

export function hasTransparency(canvas: HTMLCanvasElement): boolean {
  const { width: w, height: h } = canvas;
  const data = canvas.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, w, h).data;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 250) return true;
  return false;
}

/**
 * Crop to the visible subject with a little breathing room around it (no
 * zoom-in beyond the subject, aspect ratio untouched). Fully-opaque images
 * ("Original" mode) are returned as-is.
 */
export function autoCropSticker(canvas: HTMLCanvasElement, padRatio = 0.06): HTMLCanvasElement {
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
  out.getContext("2d")!.drawImage(canvas, x0, y0, x1 - x0, y1 - y0, 0, 0, out.width, out.height);
  return out;
}

/** Downscale (never upscale) so the longest side is ≤ maxSide. */
export function limitCanvas(canvas: HTMLCanvasElement, maxSide: number): HTMLCanvasElement {
  const s = fitScale(canvas.width, canvas.height, maxSide);
  if (s >= 1) return canvas;
  const out = makeCanvas(canvas.width * s, canvas.height * s);
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
}

/** Clean sticker canvas: tight-but-padded crop + size cap. Pure function. */
export function finalizeSticker(canvas: HTMLCanvasElement): HTMLCanvasElement {
  return limitCanvas(autoCropSticker(canvas), STICKER_MAX_SIDE);
}

let webpAlphaSupport: boolean | null = null;
/** Can this browser ENCODE WebP with an alpha channel from a canvas? */
export function supportsWebpExport(): boolean {
  if (webpAlphaSupport !== null) return webpAlphaSupport;
  try {
    const c = makeCanvas(2, 2);
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "rgba(255,0,0,0.5)";
    ctx.fillRect(0, 0, 1, 1);
    webpAlphaSupport = c.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    webpAlphaSupport = false;
  }
  return webpAlphaSupport;
}

export function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((res, rej) => {
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new StickerImageError("encode-failed"))),
      mime,
      quality,
    );
  });
}

export interface StickerExport {
  blob: Blob;
  mime: "image/webp" | "image/png";
  width: number;
  height: number;
}

/**
 * Encode the finished sticker. WebP (lossy, alpha preserved) when the browser
 * can encode it — ~4–8x smaller than PNG so stickers pop in fast in chat —
 * otherwise PNG. Whichever is smaller wins when both are available.
 */
export async function exportSticker(canvas: HTMLCanvasElement): Promise<StickerExport> {
  const png = await canvasToBlob(canvas, "image/png");
  if (supportsWebpExport()) {
    try {
      const webp = await canvasToBlob(canvas, "image/webp", 0.9);
      if (webp.type === "image/webp" && webp.size < png.size) {
        return { blob: webp, mime: "image/webp", width: canvas.width, height: canvas.height };
      }
    } catch {
      /* fall back to png */
    }
  }
  return { blob: png, mime: "image/png", width: canvas.width, height: canvas.height };
}

/** Content hash → deterministic storage name so the same sticker never uploads twice. */
export async function blobHash(blob: Blob): Promise<string> {
  try {
    if (crypto?.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
      return Array.from(new Uint8Array(buf))
        .slice(0, 16)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    /* insecure context etc. */
  }
  // FNV-1a over the bytes as a fallback (non-secure contexts)
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < bytes.length; i++) {
    h1 = Math.imul(h1 ^ bytes[i], 0x01000193);
    h2 = Math.imul(h2 ^ bytes[(i * 7) % bytes.length], 0x01000193) ^ i;
  }
  return ((h1 >>> 0).toString(16) + (h2 >>> 0).toString(16)).padStart(16, "0");
}

/** Draw a canvas onto a fresh canvas of the same size (used for undo snapshots). */
export function snapshot(canvas: HTMLCanvasElement): ImageData {
  return canvas.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, canvas.width, canvas.height);
}

export function restore(canvas: HTMLCanvasElement, data: ImageData): void {
  canvas.getContext("2d")!.putImageData(data, 0, 0);
}
