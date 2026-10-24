import type { Sender } from "@/site/lib/cloud-chat.ts";
import { getNames } from "@/site/lib/names.ts";

export const SESSION_ID_KEY = "hb_chat_session_id";
export const SENDER_KEY = "hb_chat_sender";
export const LAST_READ_KEY = "hb_chat_last_read";

function readSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const fresh = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_ID_KEY, fresh);
    return fresh;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}
export const SESSION_ID = readSessionId();

export function readSender(): Sender {
  try {
    return localStorage.getItem(SENDER_KEY) === "faizan" ? "faizan" : "habiba";
  } catch {
    return "habiba";
  }
}

export const otherOf = (s: Sender): Sender => (s === "faizan" ? "habiba" : "faizan");
export const fullName = (s: Sender) => getNames()[s];
export const firstName = (s: Sender) => fullName(s).split(" ")[0];
export const username = (s: Sender) => fullName(s).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
export const initial = (s: Sender) => fullName(s).charAt(0).toUpperCase();

export function fmtClock(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}

/** Instagram-style centred time stamp between message groups. */
export function fmtSeparator(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 86_400_000;
  if (ts >= startOfToday) return fmtClock(ts);
  if (ts >= startOfToday - day) return `Yesterday ${fmtClock(ts)}`;
  if (ts >= startOfToday - 6 * day) return `${d.toLocaleDateString([], { weekday: "short" })} ${fmtClock(ts)}`;
  return `${d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })}, ${fmtClock(ts)}`;
}

export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function fmtAgo(ts: number): string {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/** Slower Android phones get lighter effects (no live blur, softer motion). */
export function detectLowFx(): boolean {
  try {
    if (localStorage.getItem("hb_chat_reduce_fx") === "1") return true;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod|Macintosh/.test(ua)) return false;
    const cores = navigator.hardwareConcurrency ?? 8;
    const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8;
    return /Android/.test(ua) && (cores <= 4 || mem <= 3);
  } catch {
    return false;
  }
}
