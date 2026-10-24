//#region node_modules/.nitro/vite/services/ssr/assets/orientation-lock-CGzZ5Q_Q.js
var installed = false;
function orientationApi() {
	return typeof screen === "undefined" ? void 0 : screen.orientation;
}
/** 0 / 90 / 180 / 270 — how far the page is turned from the device's natural side. */
function currentAngle() {
	const a = orientationApi()?.angle;
	if (typeof a === "number") return (a % 360 + 360) % 360;
	const legacy = window.orientation;
	return typeof legacy === "number" ? (legacy % 360 + 360) % 360 : 0;
}
function isTouchDevice() {
	try {
		return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
	} catch {
		return false;
	}
}
function applyRotation() {
	const root = document.documentElement;
	if (!(window.innerWidth > window.innerHeight) || !isTouchDevice()) {
		delete root.dataset.forceRotate;
		return;
	}
	root.dataset.forceRotate = currentAngle() === 270 ? "cw" : "ccw";
}
function installOrientationLock() {
	if (installed || typeof window === "undefined") return;
	installed = true;
	const orientation = orientationApi();
	const tryLock = () => {
		orientation?.lock?.("portrait").catch(() => {});
	};
	tryLock();
	const sync = () => {
		tryLock();
		applyRotation();
	};
	applyRotation();
	window.addEventListener("resize", applyRotation);
	window.addEventListener("orientationchange", sync);
	orientation?.addEventListener?.("change", sync);
	document.addEventListener("fullscreenchange", sync);
	document.addEventListener("visibilitychange", () => {
		if (!document.hidden) sync();
	});
}
//#endregion
export { installOrientationLock };
