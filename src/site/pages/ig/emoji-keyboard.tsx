// Emoji keyboard for laptops/desktops only — phones already have one on
// their own keyboard, so the composer never shows this button there.
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { FULL_EMOJI, searchEmoji } from "@/site/lib/emoji.ts";
import { IconSearch } from "./icons.tsx";

export default function EmojiKeyboard({ onPick, onClose }: { onPick: (emoji: string) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const list = q.trim() ? searchEmoji(q) : FULL_EMOJI;

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      className="ig-emoji-pop"
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 520, damping: 36 }}
      data-testid="emoji-keyboard"
    >
      <label className="ig-emoji-pop-search">
        <IconSearch size={16} />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search emoji"
          data-testid="emoji-keyboard-search"
        />
      </label>
      <div className="ig-emoji-grid">
        {list.map((e) => (
          <button key={e} type="button" onClick={() => onPick(e)} data-testid={`emoji-key-${e}`}>
            {e}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
