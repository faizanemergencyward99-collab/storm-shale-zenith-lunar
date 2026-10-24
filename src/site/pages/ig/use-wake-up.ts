// "Wake Me Up" — places the real Twilio call and tracks its live status.
import { useCallback, useEffect, useRef, useState } from "react";
import { haptics } from "@/site/lib/haptics.ts";
import { supabase, SUPABASE_URL } from "@/site/lib/supabase.ts";
import { startRingTone, stopRingTone } from "@/site/lib/ring-tone.ts";
import { notifyMissedWakeUp, warmPushIsolate } from "@/site/lib/push.ts";
import { fullName } from "./util.ts";

export type WakeStatus = "ringing" | "answered" | "declined" | "noanswer" | "error";

const WAKE_API_BASE =
  ((import.meta.env.VITE_WAKE_UP_API_BASE as string | undefined) ?? "").replace(/\/+$/, "") ||
  `${SUPABASE_URL}/functions/v1`;

export function useWakeUp(onPlaced: () => void) {
  const [ringing, setRinging] = useState(false);
  const [status, setStatus] = useState<WakeStatus>("ringing");
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const closeRef = useRef<number | null>(null);
  const pollRef = useRef<number | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const requestIdRef = useRef<string | null>(null);
  const startedAtRef = useRef(0);
  const onPlacedRef = useRef(onPlaced);
  onPlacedRef.current = onPlaced;

  // Keep the edge function warm so tapping the phone icon rings instantly.
  useEffect(() => {
    const warm = () => {
      void fetch(`${WAKE_API_BASE}/wake-up/health`, { cache: "no-store", keepalive: true }).catch(() => {});
      warmPushIsolate();
    };
    warm();
    const id = window.setInterval(warm, 25_000);
    const onVisible = () => { if (document.visibilityState === "visible") warm(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const teardown = useCallback(() => {
    stopRingTone();
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (closeRef.current) { clearTimeout(closeRef.current); closeRef.current = null; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (channelRef.current) { void supabase.removeChannel(channelRef.current); channelRef.current = null; }
  }, []);

  const stop = useCallback(() => {
    teardown();
    setRinging(false);
  }, [teardown]);

  useEffect(() => () => { teardown(); }, [teardown]);

  const finish = useCallback((st: WakeStatus, ms: number) => {
    stopRingTone();
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (st === "answered") haptics.success();
    setStatus(st);
    closeRef.current = window.setTimeout(() => stop(), ms);
  }, [stop]);

  const start = useCallback(() => {
    const now = Date.now();
    // pointerdown and click both call start — place exactly one call.
    if (now - startedAtRef.current < 2500) return;
    startedAtRef.current = now;
    // Fire the call FIRST so Twilio starts dialing before any other work.
    const callPromise = fetch(`${WAKE_API_BASE}/wake-up`, {
      method: "POST",
      cache: "no-store",
      keepalive: true,
    });
    haptics.light();
    teardown();
    requestIdRef.current = null;
    setError(null);
    setStatus("ringing");
    setRinging(true);
    startRingTone();
    timerRef.current = window.setTimeout(() => {
      stopRingTone();
      setStatus("noanswer");
      void notifyMissedWakeUp(requestIdRef.current);
      closeRef.current = window.setTimeout(() => stop(), 5000);
    }, 45000);

    void (async () => {
      try {
        const resp = await callPromise;
        const data = (await resp.json().catch(() => null)) as { callSid?: string; error?: string } | null;
        if (!resp.ok || !data?.callSid) throw new Error(data?.error || "Couldn't start the phone call.");
        const callSid = String(data.callSid);
        onPlacedRef.current();
        pollRef.current = window.setInterval(() => {
          void (async () => {
            try {
              const r = await fetch(`${WAKE_API_BASE}/wake-up/status?callSid=${encodeURIComponent(callSid)}`);
              const s = (await r.json().catch(() => null)) as { status?: string | null } | null;
              const st = s?.status;
              if (!st || st === "queued" || st === "initiated" || st === "ringing") return;
              if (st === "in-progress" || st === "completed") finish("answered", 6000);
              else {
                void notifyMissedWakeUp(requestIdRef.current);
                finish("noanswer", 5000);
              }
            } catch {
              /* keep polling */
            }
          })();
        }, 2000);
      } catch (err) {
        stopRingTone();
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        setError(err instanceof Error ? err.message : "Couldn't start the phone call.");
        setStatus("error");
      }
    })();

    void supabase
      .rpc("request_wake_up", { p_caller: "habiba", p_recipient: "faizan", p_caller_display: `${fullName("habiba")} 💗` })
      .then(({ data, error: rpcErr }) => {
        if (rpcErr || !data) return;
        const requestId = String(data);
        requestIdRef.current = requestId;
        channelRef.current = supabase
          .channel(`wake-up-${requestId}`)
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "wake_up_requests", filter: `id=eq.${requestId}` },
            (payload) => {
              const st = (payload.new as { status?: string } | null)?.status;
              if (!st || st === "ringing") return;
              if (channelRef.current) { void supabase.removeChannel(channelRef.current); channelRef.current = null; }
              if (st === "answered") finish("answered", 6000);
              else {
                if (st === "expired" || st === "failed") void notifyMissedWakeUp(requestId);
                finish(st === "declined" ? "declined" : "noanswer", 5000);
              }
            },
          )
          .subscribe();
      });
  }, [teardown, stop, finish]);

  return { ringing, status, error, start, stop };
}
