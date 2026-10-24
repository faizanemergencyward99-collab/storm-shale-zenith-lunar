// ─────────────────────────────────────────────────────────────────────────────
//  AI background removal — runs fully in the browser with @imgly/background-
//  removal (ISNet segmentation on ONNX Runtime / WASM). No server, no API key.
//  The model (~40–80 MB) downloads once and is cached by the browser.
// ─────────────────────────────────────────────────────────────────────────────
import { canvasToBlob, decodeImageFile, makeCanvas } from "./sticker-image";

export type BgProgress = { label: string; pct: number | null };

export class BgRemovalError extends Error {}

const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 900);

// Smaller quantised model on phones (memory + download), fp16 on desktop.
function pickModel(): "isnet_quint8" | "isnet_fp16" {
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof mem === "number" && mem <= 4) return "isnet_quint8";
  return isMobileDevice() ? "isnet_quint8" : "isnet_fp16";
}

type RemoveFn = (
  src: Blob,
  cfg: Record<string, unknown>,
) => Promise<Blob>;

let libPromise: Promise<RemoveFn> | null = null;
function loadLib(): Promise<RemoveFn> {
  if (!libPromise) {
    libPromise = import("@imgly/background-removal")
      .then((m) => (m.removeBackground ?? m.default) as unknown as RemoveFn)
      .catch((e) => {
        libPromise = null;
        throw e;
      });
  }
  return libPromise;
}

function humanLabel(key: string): string {
  if (/fetch:.*(onnx|model)/i.test(key)) return "Downloading AI model";
  if (/fetch:.*(wasm|ort)/i.test(key)) return "Loading AI engine";
  if (/fetch/i.test(key)) return "Preparing AI";
  if (/compute/i.test(key)) return "Finding the subject";
  return "Working";
}

/**
 * Remove the background of `source` (canvas). Resolves to a NEW canvas with a
 * transparent background at the same size as the input.
 */
export async function removeBackgroundAI(
  source: HTMLCanvasElement,
  onProgress?: (p: BgProgress) => void,
): Promise<HTMLCanvasElement> {
  onProgress?.({ label: "Loading AI engine", pct: null });
  let removeBackground: RemoveFn;
  try {
    removeBackground = await loadLib();
  } catch (e) {
    console.error("[bg-removal] lib load failed", e);
    throw new BgRemovalError("AI tools couldn't load. Check your connection and try again.");
  }

  const input = await canvasToBlob(source, "image/png");
  let outBlob: Blob;
  try {
    outBlob = await removeBackground(input, {
      model: pickModel(),
      device: "cpu",
      output: { format: "image/png", quality: 1 },
      progress: (key: string, current: number, total: number) => {
        const pct = total > 0 ? Math.round((current / total) * 100) : null;
        onProgress?.({ label: humanLabel(key), pct });
      },
    });
  } catch (e) {
    console.error("[bg-removal] failed", e);
    const msg = e instanceof Error ? e.message : String(e);
    if (/memory|allocation|OOM/i.test(msg)) {
      throw new BgRemovalError("Not enough memory for AI removal on this device. Try a smaller photo.");
    }
    throw new BgRemovalError("AI background removal failed. Check your connection and try again.");
  }

  onProgress?.({ label: "Cleaning edges", pct: null });
  const decoded = await decodeImageFile(outBlob, Math.max(source.width, source.height));
  // Ensure exact input size (library output matches, but be defensive).
  const out = makeCanvas(source.width, source.height);
  const ctx = out.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(decoded, 0, 0, out.width, out.height);
  // Kill near-invisible alpha noise so the auto-crop hugs the real subject.
  const img = ctx.getImageData(0, 0, out.width, out.height);
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) {
    if (d[i] < 12) d[i] = 0;
    else if (d[i] > 245) d[i] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return out;
}
