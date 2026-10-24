// ─────────────────────────────────────────────────────────────────────────────
// interaction-lock.ts — Instagram-style touch lock for the whole app.
//
// CSS (index.css) already disables text selection / callouts and the viewport
// meta disables zoom, but iOS Safari deliberately IGNORES `user-scalable=no`
// and can still start a selection or the image-save callout during a
// long-press. These document-level guards make the lock permanent:
//   • pinch-zoom (gesturestart/gesturechange + multi-touch touchmove)
//   • double-tap zoom (rapid successive touchend)
//   • the native context menu / long-press callout
//   • any stray text selection that escapes the CSS rules
// Editable fields (input, textarea, contenteditable, .hb-selectable) are
// always exempt so typing, cursor placement and copy/paste still work.
// ─────────────────────────────────────────────────────────────────────────────

function isEditable(target: EventTarget | null): boolean {
  const el = target instanceof Element ? target : null;
  if (!el) return false;
  return !!el.closest(
    'input, textarea, select, [contenteditable="true"], [contenteditable=""], .hb-selectable',
  );
}

let installed = false;

export function installInteractionLock(): void {
  if (installed || typeof document === "undefined") return;
  installed = true;

  const prevent = (e: Event) => {
    if (!isEditable(e.target)) e.preventDefault();
  };

  // iOS Safari pinch-zoom (non-standard gesture events) — always block.
  document.addEventListener("gesturestart", prevent, { passive: false });
  document.addEventListener("gesturechange", prevent, { passive: false });
  document.addEventListener("gestureend", prevent, { passive: false });

  // Multi-finger pans/pinches on any browser → never zoom the page.
  document.addEventListener(
    "touchmove",
    (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    },
    { passive: false },
  );

  // Double-tap zoom is handled by `touch-action: manipulation` (index.css),
  // which every modern mobile browser honours — including iOS Safari. We
  // deliberately do NOT preventDefault on touchend, because that would
  // swallow the click of any fast second tap (passcode keypad, reactions).

  // Native long-press menu / "Save image" callout / desktop right-click.
  document.addEventListener("contextmenu", prevent);

  // Any selection that still sneaks through (e.g. a drag starting on text on
  // Android Chrome) is cleared immediately unless it lives in an editable.
  document.addEventListener("selectstart", prevent);
  document.addEventListener("selectionchange", () => {
    const sel = document.getSelection();
    if (!sel || sel.isCollapsed) return;
    if (isEditable(sel.anchorNode?.parentElement ?? null)) return;
    if (isEditable(document.activeElement)) return;
    sel.removeAllRanges();
  });

  // Dragging images/text out of the page.
  document.addEventListener("dragstart", prevent);
}
