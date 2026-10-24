// Chat themes: wallpaper sticker + both bubble colours. The chosen theme is
// shared through `chat_settings.theme`, so both phones always match.

/** Section a theme appears under in the picker. */
export type ThemeGroup = "Ours" | "Love" | "Instagram" | "Minimal";

export const THEME_GROUPS: ThemeGroup[] = ["Ours", "Love", "Instagram", "Minimal"];

export interface IgTheme {
  id: string;
  name: string;
  group?: ThemeGroup;
  /** "light" flips the header, composer, sheets and labels to light chrome. */
  mode?: "dark" | "light";
  /** Solid colour or gradient behind the messages. */
  bg: string;
  wallpaper: string | null;
  inBg: string;
  outBg: string;
  /** Optional gradient paint for the bubbles (falls back to the solid colour). */
  inPaint?: string;
  outPaint?: string;
  inFg?: string;
  outFg?: string;
  accent: string;
}

export interface StoredTheme {
  id: string;
  wallpaper?: string | null;
  inBg?: string;
  outBg?: string;
}

export const THEMES: IgTheme[] = [
  // ── Ours ────────────────────────────────────────────────────────────────
  { id: "kitty", name: "Kitty", group: "Ours", bg: "#000000", wallpaper: "/wallpapers/kitty.png", inBg: "#262626", outBg: "#3797f0", accent: "#3797f0" },
  {
    id: "pink",
    name: "Classic Pink",
    group: "Ours",
    mode: "light",
    bg: "linear-gradient(180deg, #fff2f7 0%, #ffe7f0 50%, #ffdaea 100%)",
    wallpaper: null,
    inBg: "#fff4f7",
    outBg: "#ff5f8a",
    inPaint: "linear-gradient(160deg, #ffffff 0%, #fff4f7 45%, #ffe1ec 100%)",
    outPaint: "linear-gradient(160deg, #ff90b3 0%, #ff5f8a 55%, #d8285d 100%)",
    inFg: "#7a2040",
    outFg: "#ffffff",
    accent: "#e8336d",
  },
  { id: "blush", name: "Blush", group: "Ours", bg: "#140609", wallpaper: "/wallpapers/blush.png", inBg: "#3b2530", outBg: "#ff5c8d", accent: "#ff5c8d" },
  { id: "peach", name: "Peach", group: "Ours", bg: "#0c0c0c", wallpaper: "/wallpapers/peach.png", inBg: "#2f2f2f", outBg: "#ffb4a2", accent: "#ffb4a2" },
  { id: "crush", name: "Crush", group: "Ours", bg: "#000000", wallpaper: "/wallpapers/crush.png", inBg: "#303030", outBg: "#e63946", accent: "#e63946" },
  { id: "froggy", name: "Froggy", group: "Ours", bg: "#050d07", wallpaper: "/wallpapers/froggy.png", inBg: "#1e3a26", outBg: "#7bd389", accent: "#7bd389" },
  { id: "angel", name: "Angel", group: "Ours", bg: "#0a0a0a", wallpaper: "/wallpapers/angel.png", inBg: "#2a2a2a", outBg: "#f4f1ea", accent: "#f4f1ea" },

  // ── Love ────────────────────────────────────────────────────────────────
  {
    id: "love",
    name: "Love",
    group: "Love",
    bg: "#1b0409",
    wallpaper: "/wallpapers/love.png",
    inBg: "#30131a",
    outBg: "#e01e3c",
    outPaint: "linear-gradient(160deg, #ff7a7a 0%, #ff3b5c 45%, #cc0f30 100%)",
    accent: "#ff4d6d",
  },
  {
    id: "iheartyou",
    name: "I Heart You",
    group: "Love",
    mode: "light",
    bg: "linear-gradient(180deg, #fffdf9 0%, #fdf1ec 60%, #fbe6e2 100%)",
    wallpaper: "/wallpapers/iheart.png",
    inBg: "#ffffff",
    outBg: "#d61f3c",
    inPaint: "linear-gradient(160deg, #ffffff 0%, #fff7f5 100%)",
    outPaint: "linear-gradient(160deg, #ef4b60 0%, #d61f3c 55%, #a40f27 100%)",
    inFg: "#3f1017",
    outFg: "#ffffff",
    accent: "#d61f3c",
  },
  {
    id: "heartdrive",
    name: "Heart Drive",
    group: "Love",
    bg: "#140021",
    wallpaper: "/wallpapers/pixelheart.png",
    inBg: "#2a0f3a",
    outBg: "#ff2e88",
    outPaint: "linear-gradient(160deg, #ff2e88 0%, #c01fb0 55%, #7b2ff7 100%)",
    accent: "#ff2e88",
  },
  {
    id: "luckypink",
    name: "Lucky Pink",
    group: "Love",
    mode: "light",
    bg: "linear-gradient(180deg, #fff2f8 0%, #ffe6f1 55%, #ffd9ea 100%)",
    wallpaper: "/wallpapers/clover.png",
    inBg: "#ffffff",
    outBg: "#e8336d",
    inPaint: "linear-gradient(160deg, #ffffff 0%, #fff4f9 100%)",
    outPaint: "linear-gradient(160deg, #ff8fb8 0%, #ff5c96 50%, #e02766 100%)",
    inFg: "#5f1736",
    outFg: "#ffffff",
    accent: "#e8336d",
  },
  {
    id: "flirt",
    name: "Flirt",
    group: "Love",
    bg: "#17000c",
    wallpaper: "/wallpapers/lips.png",
    inBg: "#2b1020",
    outBg: "#ff3d81",
    outPaint: "linear-gradient(160deg, #ff6fae 0%, #ff2e86 50%, #c4007a 100%)",
    accent: "#ff3d81",
  },

  // ── Instagram ───────────────────────────────────────────────────────────
  { id: "classic", name: "Direct Classic", group: "Instagram", bg: "#000000", wallpaper: null, inBg: "#262626", outBg: "#3797f0", accent: "#3797f0" },
  {
    id: "aurora",
    name: "Aurora",
    group: "Instagram",
    bg: "#04111a",
    wallpaper: null,
    inBg: "#16222b",
    outBg: "#2b7cf7",
    outPaint: "linear-gradient(160deg, #35e0c6 0%, #2b7cf7 55%, #8a4df5 100%)",
    accent: "#35c7d6",
  },
  {
    id: "sunset",
    name: "Sunset",
    group: "Instagram",
    bg: "#140a06",
    wallpaper: null,
    inBg: "#241611",
    outBg: "#f2642c",
    outPaint: "linear-gradient(160deg, #ffd166 0%, #fb6f3c 55%, #e0315f 100%)",
    accent: "#fb6f3c",
  },
  {
    id: "lofi",
    name: "Lo-fi",
    group: "Instagram",
    bg: "#0d0b14",
    wallpaper: null,
    inBg: "#1d1a27",
    outBg: "#8b7cf6",
    outPaint: "linear-gradient(160deg, #a78bfa 0%, #7c6cf0 55%, #4f46b8 100%)",
    accent: "#a78bfa",
  },

  // ── Minimal ─────────────────────────────────────────────────────────────
  { id: "mono", name: "Mono", group: "Minimal", bg: "#000000", wallpaper: null, inBg: "#1c1c1e", outBg: "#f2f2f2", accent: "#f2f2f2" },
  { id: "slate", name: "Slate", group: "Minimal", bg: "#0d1117", wallpaper: null, inBg: "#1b222c", outBg: "#5b8def", accent: "#5b8def" },
  { id: "ink", name: "Ink", group: "Minimal", bg: "#101010", wallpaper: null, inBg: "#1e1e1e", outBg: "#2f6f5f", accent: "#49a088" },
  {
    id: "paper",
    name: "Paper",
    group: "Minimal",
    mode: "light",
    bg: "#f7f6f3",
    wallpaper: null,
    inBg: "#ececE6",
    outBg: "#1b1b1b",
    inFg: "#1a1a1a",
    outFg: "#ffffff",
    accent: "#1b1b1b",
  },
  {
    id: "sand",
    name: "Sand",
    group: "Minimal",
    mode: "light",
    bg: "#f6efe6",
    wallpaper: null,
    inBg: "#ece2d4",
    outBg: "#a9764f",
    inFg: "#3b2d1f",
    outFg: "#ffffff",
    accent: "#a9764f",
  },
  {
    id: "mint",
    name: "Mint",
    group: "Minimal",
    mode: "light",
    bg: "#f1faf4",
    wallpaper: null,
    inBg: "#e3f1e8",
    outBg: "#2fa36b",
    inFg: "#16301f",
    outFg: "#ffffff",
    accent: "#2fa36b",
  },
  {
    id: "lilac",
    name: "Lilac",
    group: "Minimal",
    mode: "light",
    bg: "#f6f3ff",
    wallpaper: null,
    inBg: "#ebe6fb",
    outBg: "#7c5cff",
    inFg: "#2d2240",
    outFg: "#ffffff",
    accent: "#7c5cff",
  },
];

export const BUILTIN_WALLPAPERS = THEMES.map((t) => t.wallpaper).filter((w): w is string => !!w);
export const DEFAULT_THEME = THEMES[0];
const CACHE_KEY = "ig_chat_theme";

/** Black or white text, whichever reads better on the given hex colour. */
export function textOn(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(n)) return "#fff";
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.6 ? "#0b0b0b" : "#ffffff";
}

export function resolveTheme(stored: StoredTheme | null | undefined): IgTheme {
  if (!stored || typeof stored !== "object") return DEFAULT_THEME;
  if (stored.id === "custom") {
    const outBg = stored.outBg || DEFAULT_THEME.outBg;
    return {
      id: "custom",
      name: "Custom",
      bg: "#000000",
      wallpaper: stored.wallpaper ?? null,
      inBg: stored.inBg || DEFAULT_THEME.inBg,
      outBg,
      accent: outBg,
    };
  }
  return THEMES.find((t) => t.id === stored.id) ?? DEFAULT_THEME;
}

export function toStored(t: IgTheme): StoredTheme {
  return t.id === "custom" ? { id: "custom", wallpaper: t.wallpaper, inBg: t.inBg, outBg: t.outBg } : { id: t.id };
}

export function readCachedTheme(): StoredTheme | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as StoredTheme) : null;
  } catch {
    return null;
  }
}

export function cacheTheme(t: StoredTheme): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(t));
  } catch {
    /* ignore */
  }
}

export const isLight = (t: IgTheme) => t.mode === "light";

export function themeVars(t: IgTheme): Record<string, string> {
  const edge = t.bg.startsWith("#") ? t.bg : isLight(t) ? "#ffe7f0" : "#000000";
  return {
    "--ig-bg": t.bg,
    "--ig-edge": edge,
    "--ig-in-bg": t.inBg,
    "--ig-in-paint": t.inPaint ?? t.inBg,
    "--ig-in-fg": t.inFg ?? textOn(t.inBg),
    "--ig-out-bg": t.outBg,
    "--ig-out-paint": t.outPaint ?? t.outBg,
    "--ig-out-fg": t.outFg ?? textOn(t.outBg),
    "--ig-accent": t.accent,
    "--ig-accent-fg": textOn(t.accent),
  };
}
