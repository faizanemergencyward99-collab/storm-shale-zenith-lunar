// Portrait lock for the chat.
//
// Two layers, because no browser gives a web app a real orientation lock:
//   1. `screen.orientation.lock("portrait")` — only honoured for an
//      *installed, standalone* PWA on Chromium (manifest already declares
//      "orientation": "portrait"). Silently rejects everywhere else.
//   2. Universal fallback: when a touch device is held sideways we flag
//      <html data-force-rotate="cw|ccw"> and index.css counter-rotates the
//      whole app, so the UI stays glued to the phone's portrait frame — the
//      chat stays fully visible and usable, exactly like a native app that
//      refuses to rotate.
type OrientationLock = {
  lock?: (orientation: string) => Promise<void>;
  angle?: number;
};

let installed = false;

function orientationApi(): OrientationLock | undefined {
  return typeof screen === "undefined" ? undefined : (screen as unknown as { orientation?: OrientationLock }).orientation;
}

/** 0 / 90 / 180 / 270 — how far the page is turned from the device's natural side. */
function currentAngle(): number {
  const a = orientationApi()?.angle;
  if (typeof a === "number") return ((a % 360) + 360) % 360;
  const legacy = (window as unknown as { orientation?: number }).orientation;
  return typeof legacy === "number" ? ((legacy % 360) + 360) % 360 : 0;
}

function isTouchDevice(): boolean {
  try {
    return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  } catch {
    return false;
  }
}

function applyRotation(): void {
  const root = document.documentElement;
  const landscape = window.innerWidth > window.innerHeight;
  if (!landscape || !isTouchDevice()) {
    delete root.dataset.forceRotate;
    return;
  }
  // angle 90 → page turned clockwise, so spin the app back anti-clockwise.
  root.dataset.forceRotate = currentAngle() === 270 ? "cw" : "ccw";
}

export function installOrientationLock(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const orientation = orientationApi();
  const tryLock = () => {
    orientation?.lock?.("portrait").catch(() => { /* not an installed PWA — the CSS counter-rotation covers it */ });
  };
  tryLock();

  const sync = () => { tryLock(); applyRotation(); };
  applyRotation();
  window.addEventListener("resize", applyRotation);
  window.addEventListener("orientationchange", sync);
  (orientation as unknown as EventTarget | undefined)?.addEventListener?.("change", sync);
  document.addEventListener("fullscreenchange", sync);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) sync(); });
}
