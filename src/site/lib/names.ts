// Display names for the two people in the chat. Editable from the app
// (long-press the header name) and shared between both phones through the
// `names` row of `chat_settings`; cached locally so a cold start shows the
// right names before Supabase answers.
import { useSyncExternalStore } from "react";
import type { Sender } from "./cloud-chat.ts";

export type NameMap = Record<Sender, string>;

export const DEFAULT_NAMES: NameMap = { habiba: "Habiba Jii", faizan: "Faizan Jii" };
const CACHE_KEY = "hb_chat_names";

function clean(value: unknown, fallback: string): string {
  const s = typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 32) : "";
  return s || fallback;
}

export function normalizeNames(raw: unknown): NameMap {
  const o = (raw ?? {}) as Partial<NameMap>;
  return {
    habiba: clean(o.habiba, DEFAULT_NAMES.habiba),
    faizan: clean(o.faizan, DEFAULT_NAMES.faizan),
  };
}

function readCache(): NameMap {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? normalizeNames(JSON.parse(raw)) : DEFAULT_NAMES;
  } catch {
    return DEFAULT_NAMES;
  }
}

let names: NameMap = readCache();
const subs = new Set<() => void>();

export const getNames = (): NameMap => names;

/** Replace the names everywhere in the UI (and remember them on this phone). */
export function setNames(raw: unknown): NameMap {
  const next = normalizeNames(raw);
  if (next.habiba === names.habiba && next.faizan === names.faizan) return names;
  names = next;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  } catch {
    /* private mode — memory only */
  }
  subs.forEach((f) => f());
  return next;
}

function subscribe(cb: () => void): () => void {
  subs.add(cb);
  return () => { subs.delete(cb); };
}

/** Re-renders the calling component whenever the names change. */
export function useNames(): NameMap {
  return useSyncExternalStore(subscribe, getNames, getNames);
}
