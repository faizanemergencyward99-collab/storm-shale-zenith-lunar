// ─────────────────────────────────────────────────────────────────────────────
//  Chat foreground presence → lets the push Edge Function SKIP this device
//  while the chat is on screen, and resume the moment it is backgrounded.
//
//  • visible  → set_push_presence(true) now + heartbeat every 20 s
//  • hidden / pagehide / unmount → set_push_presence(false) immediately
//    (fetch keepalive so it survives the page being suspended on iOS)
//  The server treats a `true` older than 45 s as stale, so a killed app can
//  never block notifications for long even if the hidden event never fired.
// ─────────────────────────────────────────────────────────────────────────────
import { isSupabaseConfigured, SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase";
import { getSessionId } from "./push";

type Persona = "faizan" | "habiba";

const HEARTBEAT_MS = 4_000;
const ANON_KEY = SUPABASE_ANON_KEY;

let lastSent: { fg: boolean; at: number } | null = null;

function isActivelyUsingApp(): boolean {
  return document.visibilityState === "visible" && document.hasFocus();
}

/** Tell the service worker directly. iOS often reports a backgrounded
 *  (even audio-playing) window as "visible", which used to swallow banners. */
function postAppFocus(focused: boolean): void {
  try {
    const msg = { type: "app-focus", focused };
    navigator.serviceWorker?.controller?.postMessage(msg);
    void navigator.serviceWorker?.getRegistration("/")?.then((reg) => {
      reg?.active?.postMessage(msg);
      reg?.waiting?.postMessage(msg);
    });
  } catch {
    /* no service worker yet */
  }
}

async function sendPresence(persona: Persona, foreground: boolean): Promise<void> {
  if (!isSupabaseConfigured) return;
  // Collapse duplicate "false" bursts (visibilitychange + pagehide fire together).
  if (lastSent && lastSent.fg === foreground && !foreground && Date.now() - lastSent.at < 1500) return;
  lastSent = { fg: foreground, at: Date.now() };
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_push_presence`, {
      method: "POST",
      keepalive: true, // let it finish while the page is being hidden/unloaded
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        p_session_id: getSessionId(),
        p_persona: persona,
        p_foreground: foreground,
      }),
    });
  } catch {
    /* offline — the server-side staleness window covers us */
  }
}

/**
 * Start reporting presence for the open chat. Returns a stop() that marks the
 * device as background again. `getPersona` is read at send time so identity
 * switches are picked up without restarting.
 */
export function startChatPresence(getPersona: () => Persona): () => void {
  if (typeof document === "undefined" || !isSupabaseConfigured) return () => {};

  let timer: number | null = null;

  const stopHeartbeat = () => {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };
  const goForeground = () => {
    if (!isActivelyUsingApp()) {
      goBackground();
      return;
    }
    postAppFocus(true);
    void sendPresence(getPersona(), true);
    stopHeartbeat();
    timer = window.setInterval(() => {
      if (isActivelyUsingApp()) {
        postAppFocus(true);
        void sendPresence(getPersona(), true);
      } else {
        goBackground();
      }
    }, HEARTBEAT_MS);
  };
  const goBackground = () => {
    stopHeartbeat();
    postAppFocus(false);
    void sendPresence(getPersona(), false);
  };

  const onVisibility = () => {
    if (isActivelyUsingApp()) goForeground();
    else goBackground();
  };
  const onPageHide = () => goBackground();
  const onPageShow = () => {
    if (isActivelyUsingApp()) goForeground();
    else goBackground();
  };
  const onFocus = () => {
    if (isActivelyUsingApp()) goForeground();
  };
  const onBlur = () => goBackground();
  const onOnline = () => {
    if (isActivelyUsingApp()) goForeground();
  };

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onPageShow);
  window.addEventListener("focus", onFocus);
  window.addEventListener("blur", onBlur);
  window.addEventListener("online", onOnline);
  document.addEventListener("freeze", onPageHide);
  document.addEventListener("resume", onPageShow);

  if (isActivelyUsingApp()) goForeground();
  else goBackground();

  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onPageShow);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("online", onOnline);
    document.removeEventListener("freeze", onPageHide);
    document.removeEventListener("resume", onPageShow);
    goBackground();
  };
}

/** Re-announce presence right away (e.g. after the persona is switched). */
export function refreshChatPresence(persona: Persona): void {
  if (typeof document === "undefined") return;
  void sendPresence(persona, document.visibilityState === "visible" && document.hasFocus());
}
