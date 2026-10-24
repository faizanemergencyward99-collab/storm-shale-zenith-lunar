// ─────────────────────────────────────────────────────────────────────────────
//  Web Push (VAPID) client library — iOS PWA compatible.
//
//  Responsibilities:
//   • Detect push support + iOS Home-Screen (standalone) requirement.
//   • Register the service worker at '/sw.js' (scope '/').
//   • Request Notification permission (must be called from a user gesture).
//   • Create a PushManager subscription with the VAPID public key.
//   • Store/refresh the subscription in Supabase (write-only table).
//   • Trigger the send-push-notification Edge Function after a message insert.
//
//  Identity model matches the existing chat: a "persona" ('faizan' | 'habiba')
//  in localStorage + a per-device SESSION_ID. The recipient of a message is
//  simply the OTHER persona, so the sender is never notified.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseConfigured, SUPABASE_URL } from "./supabase";
import type { Sender } from "./cloud-chat";

const VAPID_PUBLIC_KEY =
  (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim() ||
  "BMK8jzpaTCjxeZPL96_rLqQ4P0r31nwA83CEE6BECrVNi3-HY9tIKirc2apm_skfV4Jl6CBNbWXRfs3m20qRQVI";

// Reuse the SAME session id key the chat uses, so the Edge Function can exclude
// the sender's own device when broadcasting.
const SESSION_ID_KEY = "hb_chat_session_id";

export function getSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const fresh =
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_ID_KEY, fresh);
    return fresh;
  } catch {
    return "unknown-session";
  }
}

function other(persona: Sender): Sender {
  return persona === "faizan" ? "habiba" : "faizan";
}

// ── Capability detection ─────────────────────────────────────────────────────
export function isPushSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    typeof window !== "undefined" &&
    "PushManager" in window &&
    "Notification" in window &&
    Boolean(VAPID_PUBLIC_KEY)
  );
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (/Mac/.test(navigator.platform) && "ontouchend" in document)
  );
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

export function getNotificationPermission():
  | "default"
  | "granted"
  | "denied"
  | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function base64UrlToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  // Explicit ArrayBuffer backing keeps this assignable to BufferSource
  // (applicationServerKey) under TS 5.7+ typed-array generics.
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  return reg;
}

// ── VAPID key-rotation safety ────────────────────────────────────────────────
// A PushSubscription is permanently bound to the VAPID public key it was
// created with. After moving to a new Supabase project (new keypair), any
// subscription made under the OLD key keeps "existing" in the browser but the
// push service rejects every send with 403 — a silent, permanent failure.
// So we compare the stored key and re-subscribe when it no longer matches.
function bufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let raw = "";
  for (let i = 0; i < bytes.length; i++) raw += String.fromCharCode(bytes[i]);
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function subscriptionUsesCurrentKey(sub: PushSubscription): boolean {
  try {
    const key = sub.options?.applicationServerKey;
    // Browser didn't expose it — assume OK rather than churn subscriptions.
    if (!key) return true;
    const current = VAPID_PUBLIC_KEY.replace(/=+$/, "");
    return bufferToBase64Url(key as ArrayBuffer) === current;
  } catch {
    return true;
  }
}

// ── Status ───────────────────────────────────────────────────────────────────
export async function hasActiveSubscription(): Promise<boolean> {
  try {
    if (!isPushSupported()) return false;
    if (Notification.permission !== "granted") return false;
    const reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    // A subscription tied to a retired VAPID key is effectively dead, so
    // report "off" and let the user re-enable (which re-subscribes cleanly).
    return Boolean(sub) && subscriptionUsesCurrentKey(sub as PushSubscription);
  } catch {
    return false;
  }
}

// ── Enable (call from a click handler) ───────────────────────────────────────
export async function enablePush(persona: Sender): Promise<void> {
  if (!isSupabaseConfigured) throw new Error("Chat backend not configured.");
  if (!isPushSupported())
    throw new Error("This browser can\u2019t receive push notifications.");

  if (isIOS() && !isStandalone()) {
    throw new Error(
      "On iPhone: tap the Share icon \u2192 Add to Home Screen, open that icon, then tap \ud83d\udd14 again.",
    );
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notifications are blocked. Enable them in your device settings."
        : "Notification permission was not granted.",
    );
  }

  const reg = await registerServiceWorker();
  let existing = await reg.pushManager.getSubscription();

  // Drop a subscription that belongs to a previous VAPID keypair, otherwise
  // every push to this device would fail with 403 forever.
  if (existing && !subscriptionUsesCurrentKey(existing)) {
    const staleEndpoint = existing.endpoint;
    await existing.unsubscribe().catch(() => {});
    await supabase
      .rpc("delete_push_subscription", { p_endpoint: staleEndpoint })
      .then(
        () => {},
        () => {},
      );
    existing = null;
  }

  const subscription =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(VAPID_PUBLIC_KEY),
    }));

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Incomplete push subscription from the browser.");
  }

  // Save via a SECURITY DEFINER RPC so the browser needs only EXECUTE on the
  // function — NOT direct table privileges. This permanently fixes the
  // "permission denied for table push_subscriptions" error and keeps the table
  // unreadable to the client.
  const { error } = await supabase.rpc("save_push_subscription", {
    p_persona: persona,
    p_session_id: getSessionId(),
    p_endpoint: json.endpoint,
    p_p256dh: json.keys.p256dh,
    p_auth: json.keys.auth,
    p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  });
  if (error) throw new Error(error.message || "Failed to save subscription.");
}

// Keep the stored persona in sync if the user switches persona while enabled.
export async function syncPersona(persona: Sender): Promise<void> {
  try {
    if (!(await hasActiveSubscription())) return;
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    const json = sub?.toJSON();
    if (!json?.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
    await supabase.rpc("save_push_subscription", {
      p_persona: persona,
      p_session_id: getSessionId(),
      p_endpoint: json.endpoint,
      p_p256dh: json.keys.p256dh,
      p_auth: json.keys.auth,
      p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch {
    /* best-effort */
  }
}

// ── Disable ──────────────────────────────────────────────────────────────────
export async function disablePush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe().catch(() => {});
      if (isSupabaseConfigured) {
        await supabase
          .rpc("delete_push_subscription", { p_endpoint: endpoint })
          .then(() => {}, () => {});
      }
    }
  } catch {
    /* ignore */
  }
}

// ── Trigger a push after a message is inserted (fire-and-forget) ─────────────
// NEVER throws — a push failure must not break message sending.
//
// text/plain + no custom headers = a CORS "simple" request, so the browser
// does NOT spend a round trip on a preflight before the edge function runs.
const PUSH_FN_URL = `${SUPABASE_URL}/functions/v1/send-push-notification`;

export function warmPushIsolate(): void {
  try {
    void fetch(PUSH_FN_URL, { method: "GET", cache: "no-store", keepalive: true }).catch(() => {});
  } catch {
    /* ignore */
  }
}

function postPush(body: Record<string, unknown>): void {
  try {
    if (!isSupabaseConfigured || !VAPID_PUBLIC_KEY) return;
    void fetch(PUSH_FN_URL, {
      method: "POST",
      cache: "no-store",
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(body),
    }).catch((err) => {
      console.warn("[push] delivery failed (non-fatal)", err);
    });
  } catch (err) {
    console.warn("[push] delivery failed (non-fatal)", err);
  }
}

export function notifyNewMessage(message: {
  id: string;
  sender: Sender;
  text?: string | null;
  type?: string | null;
}): void {
  if (!message.id) return;
  postPush({
    message_id: message.id,
    sender: message.sender,
    recipient: other(message.sender),
    text: message.text ?? null,
    type: message.type ?? "text",
    url: "/",
    exclude_session_id: getSessionId(),
  });
}

// ── Missed wake-up ring → normal web push to Faizan (fire-and-forget) ────────
export function notifyMissedWakeUp(requestId?: string | null): void {
  postPush({
    message_id: `wakeup-missed-${requestId ?? Date.now()}`,
    sender: "habiba",
    recipient: "faizan",
    text: "📞 Missed wake-up ring! I tried to wake you up… 💗",
    type: "text",
    url: "/",
    exclude_session_id: getSessionId(),
  });
}

/**
 * If notification permission is already granted, make sure this device is
 * subscribed with the CURRENT VAPID key. A project move rotates the key and
 * the old subscription would 403 forever — this heals it on the next open,
 * without asking again.
 */
export async function ensurePushSubscription(persona: Sender): Promise<void> {
  try {
    if (!isSupabaseConfigured || !isPushSupported()) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (isIOS() && !isStandalone()) return;
    await registerServiceWorker();
    if (await hasActiveSubscription()) {
      await syncPersona(persona);
      return;
    }
    await enablePush(persona);
  } catch (err) {
    console.warn("[push] ensure subscription failed", err);
  }
}
