// Theme picker in the style of the old theme gallery: pick → preview live →
// apply. Each theme sets the wallpaper and both bubble colours; "Custom"
// lets you choose any wallpaper sticker and your own bubble colours.
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { haptics } from "@/site/lib/haptics.ts";
import { listCustomStickers, listFavorites } from "@/site/lib/stickers.ts";
import { BUILTIN_WALLPAPERS, THEME_GROUPS, THEMES, textOn, type IgTheme } from "./themes.ts";
import Wallpaper from "./wallpaper.tsx";
import { IconClose } from "./icons.tsx";

interface Props {
  applied: IgTheme;
  lowFx: boolean;
  onPreview: (t: IgTheme | null) => void;
  onApply: (t: IgTheme) => void;
  onClose: () => void;
  onToggleLowFx: () => void;
}

const SWATCHES = ["#a3132f", "#262626", "#3797f0", "#ff5c8d", "#bfe0ea", "#7bd389", "#ffb4a2", "#f4f1ea", "#e63946", "#ffd166", "#6c5ce7", "#ffffff"];

function Card({ t, on, onClick }: { t: IgTheme; on: boolean; onClick: () => void }) {
  return (
    <motion.button type="button" className="ig-theme-card" data-on={on ? "" : undefined} whileTap={{ scale: 0.95 }} onClick={onClick} data-testid={`theme-${t.id}`}>
      <span className="ig-theme-thumb" style={{ background: t.bg }}>
        <Wallpaper src={t.wallpaper} mini />
        <span className="ig-theme-b ig-theme-b-in" style={{ background: t.inPaint ?? t.inBg, color: t.inFg ?? textOn(t.inBg) }}>Hey</span>
        <span className="ig-theme-b ig-theme-b-out" style={{ background: t.outPaint ?? t.outBg, color: t.outFg ?? textOn(t.outBg) }}>Hi 💗</span>
      </span>
      <span className="ig-theme-name">{t.name}</span>
    </motion.button>
  );
}

function ColorRow({ label, value, onChange, testid }: { label: string; value: string; onChange: (v: string) => void; testid: string }) {
  return (
    <div className="ig-color-row">
      <span>{label}</span>
      <div className="ig-swatches">
        {SWATCHES.map((c) => (
          <button key={c} type="button" className="ig-swatch" data-on={c.toLowerCase() === value.toLowerCase() ? "" : undefined} style={{ background: c }} onClick={() => onChange(c)} aria-label={c} />
        ))}
        <label className="ig-swatch ig-swatch-custom" style={{ background: value }}>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid} />
        </label>
      </div>
    </div>
  );
}

export default function ThemePicker({ applied, lowFx, onPreview, onApply, onClose, onToggleLowFx }: Props) {
  const [mode, setMode] = useState<"grid" | "preview" | "custom">("grid");
  const [draft, setDraft] = useState<IgTheme>(applied);
  const [stickers, setStickers] = useState<string[]>([]);

  useEffect(() => {
    void Promise.all([listFavorites(), listCustomStickers()]).then(([f, c]) => {
      const urls = [...f.filter((x) => x.kind === "sticker"), ...c].map((x) => x.url);
      setStickers(Array.from(new Set(urls)).slice(0, 40));
    });
  }, []);

  const preview = (t: IgTheme) => { haptics.light(); setDraft(t); onPreview(t); };
  const customBase = (): IgTheme => ({
    id: "custom",
    name: "Custom",
    bg: "#000000",
    wallpaper: draft.wallpaper,
    inBg: draft.inBg,
    outBg: draft.outBg,
    accent: draft.outBg,
  });
  const editCustom = (patch: Partial<IgTheme>) => {
    const t = { ...customBase(), ...patch };
    t.accent = t.outBg;
    setDraft(t);
    onPreview(t);
  };
  const cancel = () => { onPreview(null); setDraft(applied); setMode("grid"); };

  return (
    <AnimatePresence initial={false}>
      {mode === "preview" ? (
        <motion.div
          key="bar"
          className="ig-theme-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 460, damping: 36 }}
          data-testid="theme-preview-bar"
        >
          <span>Previewing <b>{draft.name}</b></span>
          <button type="button" className="ig-btn-ghost" onClick={cancel} data-testid="theme-cancel">Cancel</button>
          <button type="button" className="ig-btn-primary" onClick={() => onApply(draft)} data-testid="theme-apply">Apply</button>
        </motion.div>
      ) : (
        <motion.div key="sheet" className="ig-modal ig-modal-bottom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { onPreview(null); onClose(); }} data-testid="theme-picker">
          <motion.div
            className="ig-sheet ig-theme-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ig-sheet-grab" />
            <div className="ig-gallery-head">
              <button type="button" className="ig-icon-btn" onClick={() => { onPreview(null); onClose(); }} aria-label="Close"><IconClose size={22} /></button>
              <p className="ig-sheet-title">{mode === "custom" ? "Custom theme" : "Themes"}</p>
              <span style={{ width: 40 }} />
            </div>
            {mode === "grid" ? (
              <>
                <p className="ig-theme-note">Both of you see the theme you apply.</p>
                {THEME_GROUPS.map((g) => {
                  const list = THEMES.filter((t) => (t.group ?? "Ours") === g);
                  if (!list.length) return null;
                  return (
                    <div key={g}>
                      <p className="ig-theme-group">{g}</p>
                      <div className="ig-theme-grid">
                        {list.map((t) => (
                          <Card key={t.id} t={t} on={applied.id === t.id} onClick={() => { preview(t); setMode("preview"); }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
                <p className="ig-theme-group">Your own</p>
                <div className="ig-theme-grid">
                  <Card
                    t={applied.id === "custom" ? applied : { ...THEMES[0], id: "custom", name: "Custom" }}
                    on={applied.id === "custom"}
                    onClick={() => { const t = applied.id === "custom" ? applied : { ...THEMES[0], id: "custom", name: "Custom" }; preview(t); setMode("custom"); }}
                  />
                </div>
                <button type="button" className="ig-sheet-row ig-lowfx" onClick={onToggleLowFx} data-testid="theme-lowfx">
                  <span className="ig-sheet-row-name">Reduce effects<small>Lighter blur and motion for slower phones</small></span>
                  <span className="ig-toggle" data-on={lowFx ? "" : undefined} />
                </button>
              </>
            ) : (
              <div className="ig-custom">
                <p className="ig-custom-label">Wallpaper sticker</p>
                <div className="ig-wall-grid">
                  <button type="button" className="ig-wall-opt" data-on={!draft.wallpaper ? "" : undefined} onClick={() => editCustom({ wallpaper: null })}>None</button>
                  {[...BUILTIN_WALLPAPERS, ...stickers].map((w) => (
                    <button key={w} type="button" className="ig-wall-opt" data-on={draft.wallpaper === w ? "" : undefined} onClick={() => editCustom({ wallpaper: w })}>
                      <img src={w} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
                <ColorRow label="Their bubbles" value={draft.inBg} onChange={(v) => editCustom({ inBg: v })} testid="custom-in-color" />
                <ColorRow label="Your bubbles" value={draft.outBg} onChange={(v) => editCustom({ outBg: v })} testid="custom-out-color" />
                <div className="ig-dialog-actions">
                  <button type="button" className="ig-btn-ghost" onClick={cancel}>Back</button>
                  <button type="button" className="ig-btn-primary" onClick={() => setMode("preview")} data-testid="custom-preview">Preview</button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
