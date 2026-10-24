//#region node_modules/.nitro/vite/services/ssr/assets/interaction-lock-RJP5G1zJ.js
function isEditable(target) {
	const el = target instanceof Element ? target : null;
	if (!el) return false;
	return !!el.closest("input, textarea, select, [contenteditable=\"true\"], [contenteditable=\"\"], .hb-selectable");
}
var installed = false;
function installInteractionLock() {
	if (installed || typeof document === "undefined") return;
	installed = true;
	const prevent = (e) => {
		if (!isEditable(e.target)) e.preventDefault();
	};
	document.addEventListener("gesturestart", prevent, { passive: false });
	document.addEventListener("gesturechange", prevent, { passive: false });
	document.addEventListener("gestureend", prevent, { passive: false });
	document.addEventListener("touchmove", (e) => {
		if (e.touches.length > 1) e.preventDefault();
	}, { passive: false });
	document.addEventListener("contextmenu", prevent);
	document.addEventListener("selectstart", prevent);
	document.addEventListener("selectionchange", () => {
		const sel = document.getSelection();
		if (!sel || sel.isCollapsed) return;
		if (isEditable(sel.anchorNode?.parentElement ?? null)) return;
		if (isEditable(document.activeElement)) return;
		sel.removeAllRanges();
	});
	document.addEventListener("dragstart", prevent);
}
//#endregion
export { installInteractionLock };
