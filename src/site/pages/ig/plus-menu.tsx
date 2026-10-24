// The composer's "+" menu: Music, Wake-up call, Themes, Search, alerts and
// the extra senders (record video, send a file).
import { motion } from "motion/react";
import type { ReactNode } from "react";
import type { Sender } from "@/site/lib/cloud-chat.ts";
import NotificationBell from "@/site/components/notification-bell.tsx";
import { IconAlarm, IconBrush, IconFile, IconMusic, IconPalette, IconSearch, IconVideo } from "./icons.tsx";

interface Props {
  sender: Sender;
  onClose: () => void;
  onMusic: () => void;
  onWake: () => void;
  onThemes: () => void;
  onSearch: () => void;
  onVideo: () => void;
  onFile: () => void;
  onDraw: () => void;
}

export default function PlusMenu(p: Props) {
  const items: { key: string; label: string; icon: ReactNode; run: () => void }[] = [
    { key: "music", label: "Music", icon: <IconMusic size={24} />, run: p.onMusic },
    { key: "wake", label: "Wake-up call", icon: <IconAlarm size={24} />, run: p.onWake },
    { key: "themes", label: "Themes", icon: <IconPalette size={24} />, run: p.onThemes },
    { key: "draw", label: "Draw", icon: <IconBrush size={24} />, run: p.onDraw },
    { key: "search", label: "Search", icon: <IconSearch size={24} />, run: p.onSearch },
    { key: "video", label: "Record video", icon: <IconVideo size={24} />, run: p.onVideo },
    { key: "file", label: "File", icon: <IconFile size={24} />, run: p.onFile },
  ];
  return (
    <>
      <motion.div className="ig-plus-scrim" onClick={p.onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div
        className="ig-plus"
        data-testid="plus-menu"
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.7, y: 14, transition: { duration: 0.14 } }}
        transition={{ type: "spring", stiffness: 520, damping: 30 }}
      >
        {items.map((it, i) => (
          <motion.button
            key={it.key}
            type="button"
            className="ig-plus-item"
            onPointerDown={(e) => {
              if (it.key !== "wake") return;
              if (e.button != null && e.button !== 0) return;
              it.run();
            }}
            onClick={() => { p.onClose(); it.run(); }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 30, delay: 0.02 * i }}
            whileTap={{ scale: 0.9 }}
            data-testid={`plus-${it.key}`}
          >
            <span className="ig-plus-icon">{it.icon}</span>
            <span className="ig-plus-label">{it.label}</span>
          </motion.button>
        ))}
        <NotificationBell sender={p.sender} renderAs="menu" />
      </motion.div>
    </>
  );
}
