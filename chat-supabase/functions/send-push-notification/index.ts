// ─────────────────────────────────────────────────────────────────────────────
// send-push-notification — Supabase Edge Function (Deno)
//
// Sends real Web Push (VAPID) notifications for the private chat.
//
// CALLED FROM TWO PLACES (both may fire for the same message):
//   A. The sender's browser, immediately after inserting a message
//      (src/lib/push.ts → notifyNewMessage / notifyMissedWakeUp).
//   B. An AFTER INSERT trigger on chat_messages via pg_net, so delivery still
//      happens when the sender closes the app instantly after sending.
//
// EXACTLY-ONCE: the first request to insert message_id into push_dispatch wins.
// The loser returns { duplicate: true } without sending anything.
//
// PAYLOAD SHAPE must match public/sw.js, which reads { title, body, url, tag }.
//
// SECRETS (set via `supabase secrets set`):
//   VAPID_KEYS         JSON: { "publicKey": <JWK>, "privateKey": <JWK> }
//   VAPID_SUBJECT      e.g. mailto:you@example.com
//   PUSH_INTERNAL_KEY  shared secret proving a call came from the DB trigger
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
// ─────────────────────────────────────────────────────────────────────────────

import * as webpush from "jsr:@negrel/webpush@0.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";

type Persona = "faizan" | "habiba";

const DISPLAY_NAME: Record<Persona, string> = {
  faizan: "Faizan",
  habiba: "Umme Habiba",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";
const INTERNAL_KEY = Deno.env.get("PUSH_INTERNAL_KEY") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// Import the VAPID keys ONCE per isolate (cold start only) — signing keys are
// reused across invocations, which keeps warm requests fast.
let appServer: webpush.ApplicationServer | null = null;
let vapidInitError: string | null = null;

async function getAppServer(): Promise<webpush.ApplicationServer> {
  if (appServer) return appServer;
  if (vapidInitError) throw new Error(vapidInitError);
  try {
    const raw = Deno.env.get("VAPID_KEYS");
    if (!raw) throw new Error("VAPID_KEYS secret is not set");
    const keys = await webpush.importVapidKeys(JSON.parse(raw), {
      extractable: false,
    });
    appServer = await webpush.ApplicationServer.new({
      contactInformation: VAPID_SUBJECT,
      vapidKeys: keys,
    });
    return appServer;
  } catch (e) {
    vapidInitError = `VAPID init failed: ${e instanceof Error ? e.message : e}`;
    throw new Error(vapidInitError);
  }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-push-internal-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function otherPersona(p: Persona): Persona {
  return p === "faizan" ? "habiba" : "faizan";
}

/** Human-readable notification body; media messages have no text. */
function bodyFor(text: string | null | undefined, type: string): string {
  const t = (text ?? "").trim();
  if (t) return t.slice(0, 240);
  switch (type) {
    case "image":
      return "📷 Sent a photo";
    case "video":
      return "🎥 Sent a video";
    case "voice":
      return "🎙️ Sent a voice note";
    default:
      return "You have a new message 💗";
  }
}

/** Accept BOTH our own body shape and Supabase's DB-webhook `{ record }`. */
function normalise(raw: Record<string, unknown>) {
  const rec = (raw.record ?? null) as Record<string, unknown> | null;
  const src = rec ?? raw;

  const sender = String(src.sender ?? "") as Persona;
  let recipient = String(raw.recipient ?? src.recipient ?? "") as Persona;
  if (recipient !== "faizan" && recipient !== "habiba") {
    // chat_messages has no recipient column — it's simply the other person.
    recipient = otherPersona(sender);
  }

  return {
    message_id: String(src.id ?? raw.message_id ?? ""),
    sender,
    recipient,
    text: (src.text ?? null) as string | null,
    type: String(src.type ?? "text"),
    url: String(raw.url ?? "/"),
    exclude_session_id: (raw.exclude_session_id ??
      src.session_id ??
      null) as string | null,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  // GET keeps the isolate + VAPID keys hot so the next message is under a second.
  if (req.method === "GET") {
    try {
      await getAppServer();
    } catch {
      /* still counts as a warm-up of the process */
    }
    return json({ ok: true, warm: true });
  }
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let msg: ReturnType<typeof normalise>;
  try {
    msg = normalise((await req.json()) as Record<string, unknown>);
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const isInternal =
    INTERNAL_KEY.length > 0 &&
    req.headers.get("x-push-internal-key") === INTERNAL_KEY;

  if (!msg.message_id) return json({ error: "message_id is required" }, 400);
  if (msg.recipient !== "faizan" && msg.recipient !== "habiba") {
    return json({ error: "invalid recipient" }, 400);
  }

  // ── Claim this message exactly once ──────────────────────────────────────
  const { error: claimErr } = await admin
    .from("push_dispatch")
    .insert({ message_id: msg.message_id });

  if (claimErr) {
    // 23505 = unique_violation → someone already sent this one.
    if (claimErr.code === "23505") {
      return json({ ok: true, duplicate: true, sent: 0 });
    }
    console.error("claim failed", claimErr);
    return json({ error: "claim failed", detail: claimErr.message }, 500);
  }

  const result = { sent: 0, removed: 0, failed: 0, skipped: 0, foreground: 0 };

  try {
    const server = await getAppServer();

    const { data: subs, error: subErr } = await admin
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth,session_id,updated_at")
      .eq("persona", msg.recipient)
      .order("updated_at", { ascending: false })
      .limit(3);
    if (subErr) throw subErr;

    // ── Foreground presence: never push to a device whose chat is ON SCREEN.
    // The chat page heartbeats set_push_presence(true) every ~20 s while
    // visible and flips it to false the moment it is hidden. A `true` older
    // than PRESENCE_TTL_MS is stale (app killed) and no longer suppresses.
    const PRESENCE_TTL_MS = 8_000;
    const foregroundSessions = new Set<string>();
    try {
      const sessionIds = (subs ?? [])
        .map((s) => s.session_id as string | null)
        .filter((s): s is string => Boolean(s));
      if (sessionIds.length > 0) {
        const { data: pres, error: presErr } = await admin
          .from("push_presence")
          .select("session_id,foreground,updated_at")
          .in("session_id", sessionIds)
          .eq("foreground", true);
        if (presErr) {
          console.error("presence lookup failed (sending anyway)", presErr.message);
        } else {
          const now = Date.now();
          for (const p of pres ?? []) {
            const age = now - new Date(p.updated_at as string).getTime();
            if (age >= 0 && age < PRESENCE_TTL_MS) foregroundSessions.add(p.session_id as string);
          }
        }
      }
    } catch (e) {
      console.error("presence check threw (sending anyway)", e);
    }

    const payload = JSON.stringify({
      title: `${DISPLAY_NAME[msg.sender] ?? "New message"} 💗`,
      body: bodyFor(msg.text, msg.type),
      url: msg.url || "/",
      tag: `m-${msg.message_id}`,
      messageId: msg.message_id,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
    });

    await Promise.all(
      (subs ?? []).map(async (row) => {
        if (msg.exclude_session_id && row.session_id === msg.exclude_session_id) {
          result.skipped += 1;
          return;
        }
        if (row.session_id && foregroundSessions.has(row.session_id as string)) {
          result.foreground += 1;
          return;
        }
        try {
          const subscriber = server.subscribe({
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          });
          await subscriber.pushTextMessage(payload, { urgency: "high", ttl: 3600 });
          result.sent += 1;
        } catch (e) {
          const err = e as { status?: number; response?: { status?: number } };
          const status = err?.status ?? err?.response?.status;
          if (status === 404 || status === 410 || status === 403) {
            await admin.from("push_subscriptions").delete().eq("endpoint", row.endpoint);
            if (status === 403) result.failed += 1;
            else result.removed += 1;
          } else {
            console.error("push failed", status, e);
            result.failed += 1;
          }
        }
      }),
    );

    await admin
      .from("push_dispatch")
      .update({ completed_at: new Date().toISOString(), result })
      .eq("message_id", msg.message_id);

    return json({ ok: true, internal: isInternal, ...result });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("send failed", detail);
    // Release the claim so a retry can still deliver this message.
    await admin
      .from("push_dispatch")
      .delete()
      .eq("message_id", msg.message_id);
    return json({ error: "send failed", detail }, 500);
  }
});
