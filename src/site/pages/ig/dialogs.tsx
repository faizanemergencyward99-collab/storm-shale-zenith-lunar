// Small Instagram-style dialogs and sheets: edit box, unsend alert, identity
// switch and the "who reacted" list.
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { ChatMessage, Sender } from "@/site/lib/cloud-chat.ts";
import { useNames, type NameMap } from "@/site/lib/names.ts";
import { Avatar } from "./message-row.tsx";
import { IconEdit } from "./icons.tsx";
import { fullName } from "./util.ts";

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.18 } };
const popIn = {
  initial: { opacity: 0, scale: 0.9, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.94, y: 8 },
  transition: { type: "spring", stiffness: 480, damping: 32 },
} as const;
const sheetIn = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
  transition: { type: "spring", stiffness: 420, damping: 40 },
} as const;

export function EditDialog({ initial, onCancel, onSave }: { initial: string; onCancel: () => void; onSave: (text: string) => void }) {
  const [text, setText] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const t = window.setTimeout(() => {
      const ta = ref.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }, 120);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(window.innerHeight * 0.45, Math.max(140, ta.scrollHeight))}px`;
  }, [text]);
  const ok = text.trim().length > 0 && text.trim() !== initial.trim();
  return (
    <motion.div className="ig-modal" {...fade} onClick={onCancel} data-testid="edit-dialog">
      <motion.div className="ig-edit-box" {...popIn} onClick={(e) => e.stopPropagation()}>
        <p className="ig-dialog-title">Edit message</p>
        <textarea
          ref={ref}
          className="ig-edit-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancel();
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && ok) onSave(text);
          }}
          data-testid="edit-input"
        />
        <div className="ig-dialog-actions">
          <button type="button" className="ig-btn-ghost" onClick={onCancel} data-testid="edit-cancel">Cancel</button>
          <button type="button" className="ig-btn-primary" disabled={!ok} onClick={() => onSave(text)} data-testid="edit-save">Save</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ConfirmUnsend({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <motion.div className="ig-modal" {...fade} onClick={onCancel} data-testid="unsend-confirm">
      <motion.div className="ig-alert" {...popIn} onClick={(e) => e.stopPropagation()}>
        <p className="ig-alert-title">Unsend message?</p>
        <p className="ig-alert-body">Unsending will remove the message for both of you. This can&rsquo;t be undone.</p>
        <button type="button" className="ig-alert-btn" data-danger="" onClick={onConfirm} data-testid="unsend-confirm-yes">Unsend</button>
        <button type="button" className="ig-alert-btn" onClick={onCancel} data-testid="unsend-confirm-cancel">Cancel</button>
      </motion.div>
    </motion.div>
  );
}

export function IdentitySheet({
  current,
  onPick,
  onRename,
  onClose,
}: {
  current: Sender;
  onPick: (s: Sender) => void;
  onRename: () => void;
  onClose: () => void;
}) {
  useNames();
  return (
    <motion.div className="ig-modal ig-modal-bottom" {...fade} onClick={onClose} data-testid="identity-popup">
      <motion.div className="ig-sheet" {...sheetIn} onClick={(e) => e.stopPropagation()}>
        <div className="ig-sheet-grab" />
        <p className="ig-sheet-title">Chat as</p>
        {(["habiba", "faizan"] as const).map((s) => (
          <button key={s} type="button" className="ig-sheet-row" onClick={() => onPick(s)} data-testid={`identity-pick-${s}`}>
            <Avatar who={s} size={40} />
            <span className="ig-sheet-row-name">{fullName(s)}</span>
            {current === s && <span className="ig-check" aria-label="Selected">✓</span>}
          </button>
        ))}
        <button type="button" className="ig-sheet-row" onClick={onRename} data-testid="open-rename">
          <span className="ig-sheet-row-icon" aria-hidden><IconEdit size={20} /></span>
          <span className="ig-sheet-row-name">Change names</span>
        </button>
      </motion.div>
    </motion.div>
  );
}

/** Rename both people in the chat; saved for both phones until changed again. */
export function NamesSheet({
  names,
  onSave,
  onClose,
}: {
  names: NameMap;
  onSave: (next: NameMap) => void;
  onClose: () => void;
}) {
  const [habiba, setHabiba] = useState(names.habiba);
  const [faizan, setFaizan] = useState(names.faizan);
  const trimmed = { habiba: habiba.trim(), faizan: faizan.trim() };
  const ok = !!trimmed.habiba && !!trimmed.faizan && (trimmed.habiba !== names.habiba || trimmed.faizan !== names.faizan);
  return (
    <motion.div className="ig-modal ig-modal-bottom" {...fade} onClick={onClose} data-testid="names-sheet">
      <motion.div className="ig-sheet" {...sheetIn} onClick={(e) => e.stopPropagation()}>
        <div className="ig-sheet-grab" />
        <p className="ig-sheet-title">Change names</p>
        <label className="ig-name-field">
          <span>Her name</span>
          <input
            className="ig-edit-input hb-selectable"
            value={habiba}
            maxLength={32}
            autoComplete="off"
            onChange={(e) => setHabiba(e.target.value)}
            data-testid="name-input-habiba"
          />
        </label>
        <label className="ig-name-field">
          <span>His name</span>
          <input
            className="ig-edit-input hb-selectable"
            value={faizan}
            maxLength={32}
            autoComplete="off"
            onChange={(e) => setFaizan(e.target.value)}
            data-testid="name-input-faizan"
          />
        </label>
        <div className="ig-dialog-actions">
          <button type="button" className="ig-btn-ghost" onClick={onClose} data-testid="names-cancel">Cancel</button>
          <button type="button" className="ig-btn-primary" disabled={!ok} onClick={() => onSave(trimmed)} data-testid="names-save">Save</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ReactionsSheet({
  msg,
  me,
  reactorOf,
  onRemove,
  onClose,
}: {
  msg: ChatMessage;
  me: Sender;
  reactorOf: (key: string) => Sender | null;
  onRemove: (emoji: string) => void;
  onClose: () => void;
}) {
  const rows: { who: Sender | null; emoji: string; key: string }[] = [];
  const seen = new Set<string>();
  Object.entries(msg.reactions ?? {}).forEach(([emoji, users]) =>
    users.forEach((u) => {
      const who = reactorOf(u);
      const k = `${who ?? u}|${emoji}`;
      if (seen.has(k)) return;
      seen.add(k);
      rows.push({ who, emoji, key: k });
    }),
  );
  rows.sort((a, b) => (a.who === me ? -1 : 0) - (b.who === me ? -1 : 0));
  return (
    <motion.div className="ig-modal ig-modal-bottom" {...fade} onClick={onClose} data-testid="reactions-sheet">
      <motion.div className="ig-sheet" {...sheetIn} onClick={(e) => e.stopPropagation()}>
        <div className="ig-sheet-grab" />
        <p className="ig-sheet-title">Reactions</p>
        {rows.map((r) => {
          const mineRow = r.who === me;
          return (
            <button
              key={r.key}
              type="button"
              className="ig-sheet-row"
              disabled={!mineRow}
              onClick={() => mineRow && onRemove(r.emoji)}
              data-testid={mineRow ? "reaction-remove" : "reaction-row"}
            >
              {r.who ? <Avatar who={r.who} size={40} /> : <span className="ig-avatar" style={{ width: 40, height: 40 }}>?</span>}
              <span className="ig-sheet-row-name">
                {r.who ? (mineRow ? "You" : fullName(r.who)) : "Someone"}
                {mineRow && <small>Tap to remove</small>}
              </span>
              <span className="ig-sheet-row-emoji">{r.emoji}</span>
            </button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
