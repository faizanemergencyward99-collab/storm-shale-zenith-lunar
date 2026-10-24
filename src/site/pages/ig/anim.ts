// Tracks which messages should play the "new message" entrance animation, so
// rows re-mounted by the virtual list (or swapped from optimistic → saved)
// never animate twice.
const pending = new Set<string>();
const done = new Set<string>();
let openedAt = Number.POSITIVE_INFINITY;

export function startAnimClock(): void {
  openedAt = Date.now();
}

/** `fresh` = the optimistic copy that should animate; otherwise mark as played. */
export function markAnimated(id: string, fresh = false): void {
  if (fresh) pending.add(id);
  else done.add(id);
}

export function shouldAnimate(id: string, ts: number): boolean {
  if (done.has(id)) return false;
  if (pending.has(id) || ts > openedAt) {
    done.add(id);
    return true;
  }
  return false;
}
