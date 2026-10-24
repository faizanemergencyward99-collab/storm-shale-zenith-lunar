// The existing pink "Wake Me Up" ringing card, kept as it was.
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import type { WakeStatus } from "./use-wake-up.ts";
import { firstName } from "./util.ts";

const EMOJI: Record<WakeStatus, string> = {
  ringing: "📞",
  answered: "💗",
  declined: "💔",
  error: "⚠️",
  noanswer: "😴",
};

export default function WakeOverlay({ status, error, onStop }: { status: WakeStatus; error: string | null; onStop: () => void }) {
  const live = status === "ringing" || status === "answered";
  return createPortal(
    <div className="ig-wake-backdrop" data-testid="wake-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="ig-wake-card"
      >
        <motion.div
          animate={status === "ringing" ? { rotate: [0, -14, 12, -10, 8, 0], scale: [1, 1.12, 1] } : status === "answered" ? { scale: [1, 1.18, 1] } : { scale: 1 }}
          transition={live ? { repeat: Infinity, duration: 1.1, ease: "easeInOut" } : { duration: 0.2 }}
          style={{ fontSize: 56, lineHeight: 1, marginBottom: 14 }}
          aria-hidden
        >
          {EMOJI[status]}
        </motion.div>
        <p className="ig-wake-title">Wake Me Up</p>
        <p className="ig-wake-status" data-testid="wake-status-text">
          {status === "ringing" ? (
            <>Ringing {firstName("faizan")}&rsquo;s mobile<span className="ig-wake-dots"> . . .</span></>
          ) : status === "answered" ? (
            `${firstName("faizan")} answered 💗`
          ) : status === "declined" ? (
            `${firstName("faizan")} declined the call 💔`
          ) : status === "error" ? (
            <>
              Couldn&rsquo;t ring his phone ⚠️
              <br />
              <span style={{ fontSize: 13, opacity: 0.92, fontStyle: "italic" }}>{error ?? "Something went wrong with the call."}</span>
            </>
          ) : (
            "No answer 😴 — missed-ring alert sent to his phone 📲"
          )}
        </p>
        <motion.button whileTap={{ scale: 0.94 }} onClick={onStop} className="ig-wake-btn" data-testid="wake-stop-btn">
          {status === "ringing" ? "✕ Stop ringing" : "Close"}
        </motion.button>
      </motion.div>
    </div>,
    document.body,
  );
}
