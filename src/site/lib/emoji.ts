// ─────────────────────────────────────────────────────────────────────────────
//  Emoji data + helpers for reactions and jumbo emoji-only messages.
// ─────────────────────────────────────────────────────────────────────────────

/** The 6 quick-reaction emojis, in the exact order requested (heart first). */
export const QUICK_REACTIONS = ["❤️", "😘", "😭", "😂", "🫂", "💋"] as const;

/** The double-tap heart. */
export const HEART = "❤️";

/** Full react-with-any-emoji set (user-provided, de-duplicated, order preserved). */
export const FULL_EMOJI: string[] = Array.from(
  new Set([
    "❤️", "♥️", "💓", "💗", "💞", "🥲", "🥹", "😌", "🫠", "🤭", "😻", "🙈",
    "😛", "💌", "☺️", "😇", "🤣", "😆", "😁", "😊", "😍", "😜", "😝", "😋",
    "🥳", "🤩", "😎", "🤓", "😢", "🥺", "😠", "🤯", "😳", "😡", "😱", "😰",
    "😥", "😓", "🤗", "🙄", "🫪", "🫩", "🥱", "😴", "😲", "😮‍💨", "🤑", "🤕",
    "🤧", "🤡", "👺", "👻", "💀", "☠️", "👽", "🎃", "😹", "😸", "😽", "😼",
    "😺", "🙀", "😿", "🫶🏻", "🤲🏻", "😾", "👐🏻", "👍🏻", "🫰🏻", "🤟🏻", "👌🏻", "🤞🏻",
    "👋🏻", "🙏🏻", "👅", "👄", "🤦🏻‍♂️", "🧏🏻", "🙅🏻", "💦", "🧡", "💛", "💜", "💙",
    "🩵", "🩷", "💚", "🖤", "🩶", "🤍", "🤎", "❣️", "❤️‍🩹", "❤️‍🔥", "💕", "💝",
    "💘", "💖", "✅", "✔️",
  ]),
);

// Grapheme-aware emoji-only detection for jumbo rendering.
const SEG =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

// Matches emoji + common modifiers/joiners/variation selectors.
const EMOJI_RE =
  /(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F|\u200D|[\u{1F3FB}-\u{1F3FF}]|[\u{1F1E6}-\u{1F1FF}])/u;

function graphemes(text: string): string[] {
  if (SEG) return Array.from(SEG.segment(text), (s) => s.segment);
  return Array.from(text);
}

/**
 * If a message is ONLY emoji (no letters/numbers/other text), returns the emoji
 * count so the caller can render it "jumbo". Returns 0 for mixed/plain text.
 */
export function emojiOnlyCount(text: string | null | undefined): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const clusters = graphemes(trimmed).filter((g) => g.trim().length > 0);
  // No small-count limit: Instagram keeps emoji-only messages big however
  // many you send. Only absurdly long strings fall back to plain text.
  if (clusters.length === 0 || clusters.length > 200) return 0;
  const allEmoji = clusters.every((g) => EMOJI_RE.test(g));
  return allEmoji ? clusters.length : 0;
}

/**
 * Font size (px) for a jumbo emoji-only message. Like Instagram, emojis stay
 * big no matter how many are sent — they simply wrap onto more lines.
 */
export function jumboFontSize(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 64;
  if (count === 2) return 58;
  return 52;
}

// Lightweight keyword map so the "+" reaction picker is searchable.
const EMOJI_KEYWORDS: Record<string, string> = {
  "❤️": "heart love red", "♥️": "heart love", "💓": "heart beat love",
  "💗": "heart grow love pink", "💞": "heart love revolve", "💕": "hearts love two",
  "💝": "heart gift love", "💘": "heart arrow cupid love", "💖": "heart sparkle love",
  "🧡": "heart orange", "💛": "heart yellow", "💜": "heart purple", "💙": "heart blue",
  "🩵": "heart light blue", "🩷": "heart pink", "💚": "heart green", "🖤": "heart black",
  "🩶": "heart grey gray", "🤍": "heart white", "🤎": "heart brown",
  "❣️": "heart exclamation love", "❤️‍🩹": "heart mending healing love",
  "❤️‍🔥": "heart fire burning love", "😍": "love eyes heart smile",
  "😘": "kiss blow love", "😗": "kiss", "💋": "kiss lips lipstick",
  "😻": "cat heart eyes love", "🥰": "smile hearts love", "😂": "laugh cry joy tears",
  "🤣": "rofl laugh rolling", "😆": "laugh grin", "😁": "grin smile",
  "😊": "smile happy blush", "☺️": "smile relaxed", "😇": "angel innocent smile",
  "😭": "cry sob tears sad", "🥺": "pleading puppy eyes", "🥲": "smile tear happy sad",
  "🥹": "holding tears touched", "😢": "cry sad tear", "😳": "flushed shock",
  "🤭": "giggle shy hand", "🙈": "monkey see shy", "😴": "sleep zzz tired",
  "🥱": "yawn tired sleepy", "😠": "angry mad", "😡": "rage angry mad",
  "🤯": "mind blown shock", "😱": "scream fear shock", "🤗": "hug hands",
  "🫂": "hug people embrace", "🥳": "party celebrate hat", "🤩": "star struck excited",
  "😎": "cool sunglasses", "🤓": "nerd glasses", "👍🏻": "thumbs up yes ok",
  "🙏🏻": "pray thanks please", "🫶🏻": "heart hands love", "👌🏻": "ok perfect",
  "🙀": "cat scream shock", "😾": "cat angry", "💀": "skull dead", "👻": "ghost boo",
  "✅": "check done yes tick", "✔️": "check tick done", "💦": "sweat water drops",
};

export function searchEmoji(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return FULL_EMOJI;
  const hits = FULL_EMOJI.filter((e) => (EMOJI_KEYWORDS[e] ?? "").includes(q));
  return hits.length > 0 ? hits : FULL_EMOJI;
}
