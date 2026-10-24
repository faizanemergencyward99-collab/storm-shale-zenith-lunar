// ─────────────────────────────────────────────────────────────────────────────
//  NotificationBell — a small, self-contained 🔔 button for the chat header.
//  Encapsulates ALL push UI + logic so the huge chat-overlay only needs a
//  single import + one line. Matches the existing glass header button style.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import {
  isPushSupported,
  isIOS,
  isStandalone,
  getNotificationPermission,
  hasActiveSubscription,
  enablePush,
  disablePush,
  syncPersona,
  ensurePushSubscription,
} from "@/site/lib/push.ts";
import { haptics } from "@/site/lib/haptics.ts";
import type { Sender } from "@/site/lib/cloud-chat.ts";

export default function NotificationBell({
  sender,
  renderAs,
}: {
  sender: Sender;
  /** "menu" renders an Instagram-style menu tile instead of the header button. */
  renderAs?: "menu";
}) {
  const [perm, setPerm] = useState<
    "default" | "granted" | "denied" | "unsupported" | "unknown"
  >("unknown");
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isPushSupported()) {
      setPerm("unsupported");
      setActive(false);
      return;
    }
    setPerm(getNotificationPermission());
    try {
      setActive(await hasActiveSubscription());
    } catch {
      setActive(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Permission already granted → quietly refresh the subscription (new VAPID
  // key after a project move) so pushes start working again without a prompt.
  useEffect(() => {
    if (perm !== "granted") return;
    void ensurePushSubscription(sender).then(() => refresh());
  }, [perm, sender, refresh]);

  // Keep the stored subscription persona in sync if the user switches persona.
  useEffect(() => {
    if (perm === "granted" && active) void syncPersona(sender);
  }, [sender]);

  const showToast = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 4600);
  };

  const onClick = useCallback(async () => {
    haptics.light();
    if (!isPushSupported()) {
      showToast("This browser can\u2019t receive push notifications.");
      return;
    }
    if (isIOS() && !isStandalone()) {
      showToast(
        "On iPhone: tap Share \u2192 Add to Home Screen, open that icon, then tap \ud83d\udd14.",
      );
      return;
    }
    if (getNotificationPermission() === "denied") {
      showToast(
        "Notifications are blocked. Turn them on in Settings for this app.",
      );
      return;
    }
    setBusy(true);
    try {
      if (active) {
        await disablePush();
        haptics.medium();
        showToast("Notifications turned off.");
      } else {
        await enablePush(sender);
        haptics.success();
        showToast("Notifications on \ud83d\udd14 \u2014 you\u2019ll be pinged for new messages.");
      }
    } catch (e) {
      haptics.error();
      showToast((e as Error)?.message || "Couldn\u2019t update notifications.");
    } finally {
      setBusy(false);
      await refresh();
    }
  }, [active, sender, refresh]);

  const dimmed = perm === "unsupported";
  const icon = busy ? "\u2026" : active ? "\ud83d\udd14" : "\ud83d\udd15";

  const toastNode =
    toast &&
    typeof document !== "undefined" &&
    createPortal(
      <div className="ig-toast" data-testid="notif-toast">
        {toast}
      </div>,
      document.body,
    );

  if (renderAs === "menu") {
    return (
      <>
        <button
          type="button"
          data-testid="chat-notif-toggle"
          className="ig-plus-item"
          onClick={onClick}
          disabled={busy || dimmed}
          aria-label={active ? "Disable message notifications" : "Enable message notifications"}
          title={active ? "Notifications on" : "Enable notifications"}
          style={{ opacity: dimmed ? 0.5 : 1 }}
        >
          <span className="ig-plus-icon" data-on={active ? "" : undefined}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              {!active && <path d="M3 3l18 18" />}
            </svg>
          </span>
          <span className="ig-plus-label">{busy ? "…" : active ? "Alerts on" : "Alerts off"}</span>
        </button>
        {toastNode}
      </>
    );
  }

  return (
    <>
      <motion.button
        data-testid="chat-notif-toggle"
        onClick={onClick}
        disabled={busy || dimmed}
        whileTap={{ scale: 0.88 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] as const }}
        className="hb-hdr-btn"
        data-active={active ? "" : undefined}
        style={{
          position: "relative",
          opacity: dimmed ? 0.5 : 1,
        }}
        aria-label={active ? "Disable message notifications" : "Enable message notifications"}
        title={active ? "Notifications on" : "Enable notifications"}
      >
        <span aria-hidden style={{ fontSize: 15, lineHeight: 1 }}>
          {icon}
        </span>
        {active && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 5,
              right: 5,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#3ddc84",
              boxShadow: "0 0 0 2px rgba(255,255,255,0.85)",
            }}
          />
        )}
      </motion.button>

      {toast &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: "calc(env(safe-area-inset-top, 0px) + 16px)",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 2147483647,
              maxWidth: "min(92vw, 420px)",
              padding: "12px 18px",
              borderRadius: 18,
              background: "rgba(255,255,255,0.96)",
              border: "1px solid rgba(255,150,180,0.5)",
              boxShadow: "0 12px 40px rgba(201,24,74,0.28)",
              color: "#7a2040",
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 15,
              lineHeight: 1.4,
              textAlign: "center",
            }}
          >
            {toast}
          </div>,
          document.body,
        )}
    </>
  );
}
