// Instagram DM header: back, avatar + name/@username, Music · Phone · Search.
// In search mode it turns into a search bar with "3 of 27" and ↑/↓.
import { useEffect, useRef, type RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Sender } from "@/site/lib/cloud-chat.ts";
import NowPlayingPill from "@/site/components/music/now-playing-pill.tsx";
import { haptics } from "@/site/lib/haptics.ts";
import { Avatar } from "./message-row.tsx";
import { IconBack, IconChevronDown, IconChevronRight, IconChevronUp, IconClose, IconMusic, IconPhone, IconSearch } from "./icons.tsx";
import { fullName, username } from "./util.ts";

export interface SearchState {
  open: boolean;
  query: string;
  index: number;
  total: number;
  loading: boolean;
  done: boolean;
}

interface Props {
  other: Sender;
  ringing: boolean;
  search: SearchState;
  inputRef: RefObject<HTMLInputElement | null>;
  onBack: () => void;
  onProfile: () => void;
  onIdentity: () => void;
  onMusic: () => void;
  onCall: () => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onQuery: (q: string) => void;
  onOlder: () => void;
  onNewer: () => void;
  onHeight: (h: number) => void;
}

const tap = { scale: 0.86 };
const swap = { initial: { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { type: "spring", stiffness: 520, damping: 38 } } as const;

export default function Header(p: Props) {
  const ref = useRef<HTMLElement>(null);
  const press = useRef<{ timer: number; long: boolean }>({ timer: 0, long: false });
  const onHeight = p.onHeight;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => onHeight(el.offsetHeight));
    ro.observe(el);
    onHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, [onHeight]);

  const s = p.search;
  const counter = s.loading ? "…" : s.total > 0 ? `${s.index + 1} of ${s.total}` : s.done && s.query.trim() ? "No results" : "";

  return (
    <header ref={ref} className="ig-header" data-testid="chat-header">
      <AnimatePresence initial={false} mode="popLayout">
        {s.open ? (
          <motion.div key="search" className="ig-header-row" {...swap}>
            <motion.button whileTap={tap} className="ig-hbtn" onClick={p.onCloseSearch} aria-label="Close search" data-testid="chat-search-close">
              <IconClose size={22} />
            </motion.button>
            <label className="ig-search-pill">
              <IconSearch size={18} />
              <input
                ref={p.inputRef}
                value={s.query}
                onChange={(e) => p.onQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp" || (e.key === "Enter" && !e.shiftKey)) { e.preventDefault(); p.onOlder(); }
                  else if (e.key === "ArrowDown" || (e.key === "Enter" && e.shiftKey)) { e.preventDefault(); p.onNewer(); }
                  else if (e.key === "Escape") p.onCloseSearch();
                }}
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Search"
                data-testid="chat-search-input"
              />
              {counter && <span className="ig-search-count" data-testid="chat-search-counter">{counter}</span>}
            </label>
            <motion.button whileTap={tap} className="ig-hbtn ig-hbtn-sm" disabled={s.total === 0 || s.index >= s.total - 1} onClick={p.onOlder} aria-label="Older match" data-testid="chat-search-prev">
              <IconChevronUp size={20} />
            </motion.button>
            <motion.button whileTap={tap} className="ig-hbtn ig-hbtn-sm" disabled={s.total === 0 || s.index <= 0} onClick={p.onNewer} aria-label="Newer match" data-testid="chat-search-next">
              <IconChevronDown size={20} />
            </motion.button>
          </motion.div>
        ) : (
          <motion.div key="main" className="ig-header-row" {...swap}>
            <motion.button whileTap={tap} className="ig-hbtn" onClick={p.onBack} aria-label="Back to lock screen" data-testid="chat-back-btn">
              <IconBack size={24} />
            </motion.button>
            <button
              type="button"
              className="ig-profile"
              data-testid="chat-profile"
              onPointerDown={() => {
                press.current.long = false;
                press.current.timer = window.setTimeout(() => { press.current.long = true; haptics.medium(); p.onIdentity(); }, 480);
              }}
              onPointerUp={() => clearTimeout(press.current.timer)}
              onPointerLeave={() => clearTimeout(press.current.timer)}
              onPointerCancel={() => clearTimeout(press.current.timer)}
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => { if (press.current.long) return; haptics.light(); p.onProfile(); }}
            >
              <Avatar who={p.other} size={36} />
              <span className="ig-profile-text">
                <span className="ig-profile-name" data-testid="chat-header-title">
                  {fullName(p.other)} <IconChevronRight size={14} />
                </span>
                <span className="ig-profile-user">{username(p.other)}</span>
              </span>
            </button>
            <motion.button whileTap={tap} className="ig-hbtn" onClick={p.onMusic} aria-label="Open music" data-testid="chat-music-toggle">
              <IconMusic size={22} />
            </motion.button>
            <motion.button
              whileTap={tap}
              className="ig-hbtn"
              data-active={p.ringing ? "" : undefined}
              onPointerDown={(e) => {
                if (e.button != null && e.button !== 0) return;
                p.onCall();
              }}
              onClick={(e) => { e.preventDefault(); p.onCall(); }}
              aria-label="Wake-up call"
              data-testid="chat-wake-toggle"
            >
              <IconPhone size={22} />
            </motion.button>
            <motion.button whileTap={tap} className="ig-hbtn" onClick={p.onOpenSearch} aria-label="Search messages" data-testid="chat-search-toggle">
              <IconSearch size={22} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      <NowPlayingPill onOpen={p.onMusic} />
    </header>
  );
}
