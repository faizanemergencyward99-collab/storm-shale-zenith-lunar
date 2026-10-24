// ─────────────────────────────────────────────────────────────────────────────
//  StickerGifPanel — Instagram-style sticker & GIF browser (bottom sheet).
//  Tabs: Recents · Favorites · Stickers · GIFs · Custom.
//  GIF/Sticker search via GIPHY (browser-direct). Favorites are shared
//  (Supabase storage); recents are per-device. Custom stickers upload to
//  the chat-media bucket and are shared automatically.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "@/site/lib/haptics.ts";
import {
  giphy,
  isGiphyConfigured,
  giphyPreviewUrl,
  giphySendUrl,
  giphyRateLimitedUntil,
  GiphyRateLimitError,
  GIPHY_PAGE_SIZE,
  type GiphyItem,
  type GiphyKind,
} from "@/site/lib/giphy.ts";
import {
  listCustomStickers,
  uploadCustomSticker,
  deleteCustomSticker,
  listFavorites,
  addFavorite,
  removeFavorite,
  getRecents,
  pushRecent,
  stickerId,
  type StickerRef,
} from "@/site/lib/stickers.ts";
import StickerEditor from "@/site/components/sticker-editor.tsx";
import { blobHash, type StickerExport } from "@/site/lib/sticker-image.ts";

type Tab = "recents" | "favorites" | "stickers" | "gifs" | "custom";
export type StickerPanelTab = Tab;

const TABS: { id: Tab; label: string }[] = [
  { id: "recents", label: "Recent" },
  { id: "favorites", label: "★ Saved" },
  { id: "stickers", label: "Stickers" },
  { id: "gifs", label: "GIFs" },
  { id: "custom", label: "＋ Custom" },
];

/** Long-press / right-click action sheet target. */
type CellMenu = { ref: StickerRef; allowDelete: boolean };

export default function StickerGifPanel({
  open,
  dark,
  onClose,
  onSend,
  initialTab,
  replyingTo,
}: {
  open: boolean;
  dark: boolean;
  onClose: () => void;
  onSend: (url: string, kind: "sticker" | "gif") => void;
  /** Tab to show when the panel opens (e.g. "gifs" for "Reply with GIF"). */
  initialTab?: Tab;
  /** Short label of the message being replied to — shows a hint strip at the top. */
  replyingTo?: string | null;
}) {
  const [tab, setTab] = useState<Tab>("stickers");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<GiphyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [rateLimitUntil, setRateLimitUntil] = useState(0);
  const [favorites, setFavorites] = useState<StickerRef[]>([]);
  const [recents, setRecents] = useState<StickerRef[]>([]);
  const [customs, setCustoms] = useState<StickerRef[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [cellMenu, setCellMenu] = useState<CellMenu | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Guards against stale responses (tab/query changed mid-flight) and
  // duplicate "load more" triggers while a page is in flight.
  const reqIdRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const favIds = new Set(favorites.map((f) => f.id));

  const refreshLocalLists = useCallback(async () => {
    setRecents(getRecents());
    const [favs, cust] = await Promise.all([listFavorites(), listCustomStickers()]);
    setFavorites(favs);
    setCustoms(cust);
  }, []);

  useEffect(() => {
    if (open) void refreshLocalLists();
  }, [open, refreshLocalLists]);

  // Jump to the requested tab whenever the panel is (re)opened with one.
  useEffect(() => {
    if (open && initialTab) setTab(initialTab);
  }, [open, initialTab]);

  const applyGiphyError = (e: unknown) => {
    if (e instanceof GiphyRateLimitError) {
      setRateLimitUntil(e.retryAt);
      setError("");
    } else {
      setError(e instanceof Error ? e.message : "Couldn’t load. Try again.");
    }
  };

  // Load first page of GIPHY content for stickers/gifs tabs (trending or search).
  const loadGiphy = useCallback(
    async (kind: GiphyKind, q: string) => {
      if (!isGiphyConfigured) {
        setError("GIF search isn’t set up. Use Custom / Saved stickers.");
        setItems([]);
        setHasMore(false);
        return;
      }
      const known = giphyRateLimitedUntil(kind);
      if (known) {
        setRateLimitUntil(known);
        setItems([]);
        setHasMore(false);
        return;
      }
      const reqId = ++reqIdRef.current;
      setLoading(true);
      setError("");
      setRateLimitUntil(0);
      try {
        const r = q.trim()
          ? await giphy.search(kind, q, 0, "pg")
          : await giphy.trending(kind, 0, "pg");
        if (reqId !== reqIdRef.current) return; // stale
        setItems(r.data);
        const total = r.pagination?.total_count;
        setHasMore(
          r.data.length >= GIPHY_PAGE_SIZE &&
            (total === undefined || r.data.length < total),
        );
        scrollRef.current?.scrollTo({ top: 0 });
      } catch (e) {
        if (reqId !== reqIdRef.current) return;
        applyGiphyError(e);
        setItems([]);
        setHasMore(false);
      } finally {
        if (reqId === reqIdRef.current) setLoading(false);
      }
    },
    [],
  );

  // Append the next page (infinite scroll). Dedupes by id.
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || loading || !hasMore) return;
    if (tab !== "stickers" && tab !== "gifs") return;
    const kind: GiphyKind = tab === "gifs" ? "gifs" : "stickers";
    const reqId = reqIdRef.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const offset = items.length;
      const r = query.trim()
        ? await giphy.search(kind, query, offset, "pg")
        : await giphy.trending(kind, offset, "pg");
      if (reqId !== reqIdRef.current) return; // tab/query changed meanwhile
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const fresh = r.data.filter((d) => !seen.has(d.id));
        return fresh.length ? [...prev, ...fresh] : prev;
      });
      const total = r.pagination?.total_count;
      const nextCount = offset + r.data.length;
      setHasMore(
        r.data.length > 0 &&
          r.data.length >= GIPHY_PAGE_SIZE &&
          (total === undefined || nextCount < total),
      );
    } catch (e) {
      if (reqId !== reqIdRef.current) return;
      applyGiphyError(e);
      setHasMore(false);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [tab, query, items.length, hasMore, loading]);

  // Observe the sentinel at the bottom of the grid → fetch the next page.
  useEffect(() => {
    if (!open) return;
    if (tab !== "stickers" && tab !== "gifs") return;
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) void loadMore();
      },
      { root, rootMargin: "0px 0px 320px 0px", threshold: 0 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [open, tab, hasMore, loadMore]);

  // When the rate-limit countdown ends, auto-retry the current tab.
  useEffect(() => {
    if (!open || !rateLimitUntil) return;
    if (tab !== "stickers" && tab !== "gifs") return;
    const ms = Math.max(0, rateLimitUntil - Date.now());
    const t = setTimeout(() => {
      setRateLimitUntil(0);
      void loadGiphy(tab === "gifs" ? "gifs" : "stickers", query);
    }, ms + 250);
    return () => clearTimeout(t);
  }, [open, rateLimitUntil, tab, query, loadGiphy]);

  // React to tab / query changes for GIPHY tabs (debounced search).
  useEffect(() => {
    if (!open) return;
    if (tab !== "stickers" && tab !== "gifs") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const kind: GiphyKind = tab === "gifs" ? "gifs" : "stickers";
    debounceRef.current = setTimeout(() => {
      void loadGiphy(kind, query);
    }, query.trim() ? 380 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [tab, query, open, loadGiphy]);

  const send = (url: string, kind: "sticker" | "gif", title?: string) => {
    haptics.medium();
    const ref: StickerRef = { id: stickerId(url), url, kind, title };
    pushRecent(ref);
    setRecents(getRecents());
    onSend(url, kind);
    onClose();
  };

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1800);
  };

  const toggleFav = async (ref: StickerRef) => {
    haptics.light();
    if (favIds.has(ref.id)) {
      setFavorites((p) => p.filter((f) => f.id !== ref.id));
      const ok = await removeFavorite(ref.id);
      if (!ok) {
        setFavorites((p) => (p.some((f) => f.id === ref.id) ? p : [ref, ...p]));
        showToast("Couldn't update Saved. Try again.");
      } else showToast("Removed from Saved");
    } else {
      setFavorites((p) => (p.some((f) => f.id === ref.id) ? p : [ref, ...p]));
      const ok = await addFavorite(ref);
      if (!ok) {
        setFavorites((p) => p.filter((f) => f.id !== ref.id));
        showToast("Couldn't save. Check your connection.");
      } else showToast("★ Added to Saved");
    }
  };

  const onPickCustom = () => {
    setUploadError("");
    if (fileRef.current) fileRef.current.value = "";
    fileRef.current?.click();
  };

  // The picked file goes to the editor first (Original / AI / Manual) — never
  // straight to upload. Works for gallery, Files and camera on iOS/Android.
  const handleCustomFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    haptics.light();
    setEditorFile(file);
  };

  /** Upload the finished asset (content-hash named → idempotent) and return a ref. */
  const uploadFinished = async (out: StickerExport): Promise<StickerRef | null> => {
    setUploading(true);
    try {
      const hash = await blobHash(out.blob);
      const url = await uploadCustomSticker(out.blob, { hash });
      if (!url) return null;
      const ref: StickerRef = { id: stickerId(url), url, kind: "sticker", title: "Custom sticker" };
      setCustoms((p) => (p.some((c) => c.id === ref.id) ? p : [ref, ...p]));
      return ref;
    } finally {
      setUploading(false);
    }
  };

  const saveFromEditor = async (out: StickerExport): Promise<boolean> => {
    const ref = await uploadFinished(out);
    if (!ref) return false;
    setFavorites((p) => (p.some((f) => f.id === ref.id) ? p : [ref, ...p]));
    const ok = await addFavorite(ref);
    if (!ok) {
      setFavorites((p) => p.filter((f) => f.id !== ref.id));
      return false;
    }
    setEditorFile(null);
    setTab("favorites");
    showToast("★ Sticker saved");
    return true;
  };

  const sendFromEditor = async (out: StickerExport): Promise<boolean> => {
    const ref = await uploadFinished(out);
    if (!ref) return false;
    setEditorFile(null);
    send(ref.url, "sticker", ref.title);
    return true;
  };

  const deleteCustom = async (r: StickerRef) => {
    haptics.medium();
    setCustoms((p) => p.filter((c) => c.id !== r.id));
    await deleteCustomSticker(r.url);
  };

  const bg = dark ? "#161616" : "linear-gradient(180deg,#fff4f8,#ffe8f0)";
  const fg = dark ? "#f0f0f0" : "#7a2040";
  const chipBg = dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.75)";

  const renderGiphyGrid = (kind: "sticker" | "gif") => {
    if (rateLimitUntil)
      return (
        <RateLimitNotice
          until={rateLimitUntil}
          fg={fg}
          chipBg={chipBg}
          kindLabel={kind === "gif" ? "GIFs" : "stickers"}
          onRetry={() => {
            setRateLimitUntil(0);
            void loadGiphy(kind === "gif" ? "gifs" : "stickers", query);
          }}
        />
      );
    if (loading)
      return <div style={{ padding: 30, textAlign: "center", color: fg, opacity: 0.7 }}>Loading…</div>;
    if (error)
      return <div style={{ padding: 24, textAlign: "center", color: "#c9184a", fontSize: 14 }}>{error}</div>;
    if (items.length === 0)
      return <div style={{ padding: 30, textAlign: "center", color: fg, opacity: 0.6 }}>No results</div>;
    return (
      <>
        <div style={gridStyle} data-testid={`giphy-grid-${kind}`}>
          {items.map((it) => {
            const preview = giphyPreviewUrl(it);
            const full = giphySendUrl(it);
            const ref: StickerRef = { id: stickerId(full), url: full, kind, title: it.title };
            return (
              <GridCell
                key={it.id}
                src={preview}
                transparent={kind === "sticker"}
                faved={favIds.has(ref.id)}
                onSend={() => send(full, kind, it.title)}
                onFav={() => toggleFav(ref)}
              />
            );
          })}
        </div>
        {/* Infinite-scroll sentinel + footer state */}
        <div ref={sentinelRef} data-testid="giphy-scroll-sentinel" style={{ height: 1 }} />
        {loadingMore && (
          <div
            data-testid="giphy-loading-more"
            style={{ padding: "14px 0 4px", textAlign: "center", color: fg, opacity: 0.65, fontSize: 13 }}
          >
            Loading more…
          </div>
        )}
        {!hasMore && !loadingMore && items.length >= GIPHY_PAGE_SIZE && (
          <div
            data-testid="giphy-end"
            style={{ padding: "14px 0 4px", textAlign: "center", color: fg, opacity: 0.45, fontSize: 12 }}
          >
            You’ve reached the end ✨
          </div>
        )}
      </>
    );
  };

  const renderRefGrid = (refs: StickerRef[], empty: string, allowDelete = false) => {
    if (refs.length === 0)
      return <div style={{ padding: 30, textAlign: "center", color: fg, opacity: 0.6 }}>{empty}</div>;
    return (
      <div style={gridStyle}>
        {refs.map((r) => (
          <GridCell
            key={r.id}
            src={r.url}
            transparent={r.kind === "sticker"}
            faved={favIds.has(r.id)}
            onSend={() => send(r.url, r.kind, r.title)}
            onFav={() => toggleFav(r)}
            onLongPress={() => { haptics.medium(); setCellMenu({ ref: r, allowDelete }); }}
            onDelete={allowDelete ? () => deleteCustom(r) : undefined}
          />
        ))}
      </div>
    );
  };

  const sheet = createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="sticker-backdrop"
          data-testid="sticker-panel-backdrop"
          className="fixed inset-0 z-[85]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}
        >
          <motion.div
            key="sticker-sheet"
            data-testid="sticker-panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 right-0 bottom-0 rounded-t-3xl flex flex-col"
            style={{
              background: bg,
              height: "68dvh",
              maxHeight: 560,
              boxShadow: "0 -14px 40px rgba(0,0,0,0.3)",
              border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,150,180,0.4)",
              borderBottom: "none",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div style={{ width: 40, height: 4, borderRadius: 999, background: dark ? "rgba(255,255,255,0.2)" : "rgba(201,24,74,0.25)", margin: "10px auto 8px" }} />

            {/* Reply context (when opened via "Reply with GIF") */}
            {replyingTo && (
              <div
                data-testid="sticker-reply-hint"
                style={{
                  margin: "0 14px 8px",
                  padding: "7px 12px",
                  borderRadius: 12,
                  background: chipBg,
                  borderLeft: "3px solid #ff6b9d",
                  color: fg,
                  fontSize: 12.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                <span style={{ fontWeight: 700, flexShrink: 0 }}>↩️ Replying to</span>
                <span style={{ opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis" }}>{replyingTo}</span>
              </div>
            )}

            {/* Search (only for GIPHY tabs) */}
            {(tab === "stickers" || tab === "gifs") && (
              <div style={{ padding: "0 14px 8px" }}>
                <input
                  data-testid="sticker-search-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${tab === "gifs" ? "GIFs" : "stickers"}…`}
                  maxLength={50}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,150,180,0.4)",
                    background: chipBg,
                    color: fg,
                    fontSize: 15,
                    outline: "none",
                  }}
                />
              </div>
            )}

            {/* Content */}
            <div
              ref={scrollRef}
              data-testid="sticker-scroll"
              style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", padding: "4px 12px 12px" }}
            >
              {tab === "recents" && renderRefGrid(recents, "Nothing sent yet — pick a sticker or GIF")}
              {tab === "recents" && recents.length > 0 && (
                <p style={{ textAlign: "center", fontSize: 11, opacity: 0.55, color: fg, marginTop: 10 }}>
                  Tap ☆ or long-press a sticker to add it to Saved
                </p>
              )}
              {tab === "favorites" && renderRefGrid(favorites, "Tap ★ on any sticker/GIF to save it here")}
              {tab === "stickers" && renderGiphyGrid("sticker")}
              {tab === "gifs" && renderGiphyGrid("gif")}
              {tab === "custom" && (
                <>
                  <button
                    data-testid="sticker-upload-btn"
                    onClick={onPickCustom}
                    disabled={uploading}
                    style={{
                      width: "100%",
                      padding: "14px",
                      marginBottom: 10,
                      borderRadius: 14,
                      border: "1px dashed " + (dark ? "rgba(255,255,255,0.25)" : "rgba(201,24,74,0.4)"),
                      background: chipBg,
                      color: fg,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {uploading ? "Uploading…" : "＋ Add a custom sticker"}
                  </button>
                  <p style={{ textAlign: "center", fontSize: 11.5, opacity: 0.6, color: fg, margin: "-4px 0 10px" }}>
                    Pick a photo → ✨ AI remove background or ✂️ erase by hand → Save or Send
                  </p>
                  {uploadError && (
                    <div data-testid="sticker-upload-error" style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 12, background: "rgba(201,24,74,0.12)", color: "#c9184a", fontSize: 13, fontWeight: 600 }}>
                      {uploadError}
                    </div>
                  )}
                  {renderRefGrid(customs, "No custom stickers yet", true)}
                </>
              )}
              {(tab === "stickers" || tab === "gifs") && isGiphyConfigured && (
                <p style={{ textAlign: "center", fontSize: 10, opacity: 0.5, color: fg, marginTop: 10 }}>
                  Powered by GIPHY
                </p>
              )}
            </div>

            {/* Tab bar */}
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: "8px 10px calc(10px + env(safe-area-inset-bottom, 0px))",
                borderTop: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,150,180,0.28)",
              }}
            >
              {TABS.map((t) => (
                <button
                  key={t.id}
                  data-testid={`sticker-tab-${t.id}`}
                  onClick={() => { haptics.light(); setTab(t.id); }}
                  style={{
                    flex: 1,
                    padding: "8px 4px",
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    background: tab === t.id ? "linear-gradient(135deg,#ff6b9d,#c9184a)" : "transparent",
                    color: tab === t.id ? "white" : fg,
                    opacity: tab === t.id ? 1 : 0.65,
                    transition: "background 160ms ease, opacity 160ms ease",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                key="sticker-toast"
                data-testid="sticker-toast"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "calc(68dvh + 12px)",
                  transform: "translateX(-50%)",
                  padding: "9px 16px",
                  borderRadius: 999,
                  background: "rgba(20,20,20,0.9)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                  zIndex: 2,
                }}
              >
                {toast}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Long-press / right-click action sheet */}
          <AnimatePresence>
            {cellMenu && (
              <motion.div
                key="cell-menu-backdrop"
                data-testid="sticker-cell-menu"
                className="absolute inset-0 z-[3] flex items-end justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ background: "rgba(0,0,0,0.35)" }}
                onClick={(e) => { e.stopPropagation(); setCellMenu(null); }}
              >
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 40, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: "min(420px, calc(100% - 24px))",
                    marginBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
                    borderRadius: 22,
                    background: dark ? "#1e1e1e" : "#fff",
                    color: fg,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px 10px" }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                        flexShrink: 0,
                        background: "repeating-conic-gradient(rgba(0,0,0,0.06) 0% 25%, transparent 0% 50%) 50% / 12px 12px",
                      }}
                    >
                      <img src={cellMenu.ref.url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 600 }}>
                      {cellMenu.ref.kind === "gif" ? "GIF" : "Sticker"}
                    </div>
                  </div>
                  <MenuItem
                    testid="cell-menu-save"
                    label={favIds.has(cellMenu.ref.id) ? "★ Remove from Saved" : "☆ Add to Saved"}
                    onClick={() => { const r = cellMenu.ref; setCellMenu(null); void toggleFav(r); }}
                    dark={dark}
                  />
                  <MenuItem
                    testid="cell-menu-send"
                    label="➤ Send"
                    onClick={() => { const r = cellMenu.ref; setCellMenu(null); send(r.url, r.kind, r.title); }}
                    dark={dark}
                  />
                  {cellMenu.allowDelete && (
                    <MenuItem
                      testid="cell-menu-delete"
                      label="🗑 Delete custom sticker"
                      danger
                      onClick={() => { const r = cellMenu.ref; setCellMenu(null); void deleteCustom(r); }}
                      dark={dark}
                    />
                  )}
                  <MenuItem testid="cell-menu-cancel" label="Cancel" onClick={() => setCellMenu(null)} dark={dark} muted />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );

  // NOTE: the file input lives OUTSIDE the animated sheet on purpose. It used to
  // sit inside the backdrop (whose click handler closes the panel) — the
  // programmatic .click() bubbled up, the panel closed, the input unmounted and
  // the phone's picker had nothing to deliver the file to. It is also always
  // mounted so slow pickers (iOS Photos, Android Files) can still fire change.
  return (
    <>
      {sheet}
      {createPortal(
        <input
          ref={fileRef}
          data-testid="sticker-file-input"
          type="file"
          accept="image/*,.heic,.heif"
          onChange={handleCustomFile}
          onClick={(e) => e.stopPropagation()}
          style={{ position: "fixed", width: 1, height: 1, opacity: 0, pointerEvents: "none", left: -9999, top: 0 }}
          tabIndex={-1}
          aria-hidden
        />,
        document.body,
      )}
      <StickerEditor
        file={editorFile}
        dark={dark}
        onClose={() => setEditorFile(null)}
        onSave={saveFromEditor}
        onSend={sendFromEditor}
      />
    </>
  );
}

function MenuItem({
  label,
  onClick,
  dark,
  danger,
  muted,
  testid,
}: {
  label: string;
  onClick: () => void;
  dark: boolean;
  danger?: boolean;
  muted?: boolean;
  testid: string;
}) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        padding: "15px 18px",
        border: "none",
        borderTop: dark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)",
        background: "transparent",
        color: danger ? "#e0245e" : muted ? (dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)") : "inherit",
        fontSize: 15,
        fontWeight: 700,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
};

const fmtCountdown = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `${r}s`;
};

function RateLimitNotice({
  until,
  fg,
  chipBg,
  kindLabel,
  onRetry,
}: {
  until: number;
  fg: string;
  chipBg: string;
  kindLabel: string;
  onRetry: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = until - now;
  const done = remaining <= 0;
  return (
    <div
      data-testid="giphy-rate-limit"
      style={{
        margin: "18px 6px",
        padding: "22px 18px",
        borderRadius: 18,
        background: chipBg,
        textAlign: "center",
        color: fg,
      }}
    >
      <div style={{ fontSize: 34, lineHeight: 1, marginBottom: 10 }}>🫖</div>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
        GIPHY needs a little breather
      </div>
      <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.45 }}>
        We hit the free hourly limit for {kindLabel}. Fresh results will be back in
      </div>
      <div
        data-testid="giphy-rate-limit-countdown"
        style={{
          fontVariantNumeric: "tabular-nums",
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: "0.04em",
          margin: "10px 0 6px",
          background: "linear-gradient(135deg,#ff6b9d,#c9184a)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {done ? "now" : fmtCountdown(remaining)}
      </div>
      <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
        Meanwhile, your ★ Saved and Recent picks still work.
      </div>
      <button
        data-testid="giphy-rate-limit-retry"
        onClick={onRetry}
        disabled={!done}
        style={{
          padding: "9px 18px",
          borderRadius: 999,
          border: "none",
          cursor: done ? "pointer" : "default",
          fontWeight: 700,
          fontSize: 13,
          color: "white",
          background: done ? "linear-gradient(135deg,#ff6b9d,#c9184a)" : "rgba(150,150,150,0.35)",
          transition: "background 200ms ease",
        }}
      >
        {done ? "Try again" : "Waiting…"}
      </button>
    </div>
  );
}

function GridCell({
  src,
  transparent,
  faved,
  onSend,
  onFav,
  onDelete,
  onLongPress,
}: {
  src: string;
  transparent: boolean;
  faved: boolean;
  onSend: () => void;
  onFav: () => void;
  onDelete?: () => void;
  onLongPress?: () => void;
}) {
  // Long-press (touch) / right-click (desktop) → action sheet. A long-press
  // must NOT also fire the tap-to-send click that follows pointerup.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);
  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    startRef.current = null;
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (!onLongPress) return;
    if (e.pointerType === "mouse") return; // desktop uses right-click
    firedRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress();
    }, 450);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = startRef.current;
    if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 10) clear(); // it's a scroll
  };
  const onClick = () => {
    if (firedRef.current) {
      firedRef.current = false;
      return;
    }
    onSend();
  };
  return (
    <div style={{ position: "relative" }}>
      <motion.button
        data-testid="sticker-cell"
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={clear}
        onPointerCancel={clear}
        onPointerLeave={clear}
        onContextMenu={(e) => {
          e.preventDefault();
          if (onLongPress) {
            firedRef.current = true;
            clear();
            onLongPress();
          }
        }}
        whileTap={{ scale: 0.9 }}
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: 14,
          border: "none",
          cursor: "pointer",
          overflow: "hidden",
          padding: 4,
          WebkitTouchCallout: "none",
          background: transparent
            ? "repeating-conic-gradient(rgba(0,0,0,0.05) 0% 25%, transparent 0% 50%) 50% / 16px 16px"
            : "rgba(0,0,0,0.04)",
        }}
      >
        <img
          src={src}
          alt=""
          loading="lazy"
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", pointerEvents: "none" }}
        />
      </motion.button>
      <button
        onClick={(e) => { e.stopPropagation(); onFav(); }}
        aria-label={faved ? "Unsave" : "Save"}
        style={{
          position: "absolute",
          top: 4,
          right: 4,
          width: 30,
          height: 30,
          borderRadius: 999,
          border: "none",
          cursor: "pointer",
          background: "rgba(0,0,0,0.45)",
          color: faved ? "#ffd23f" : "white",
          fontSize: 15,
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {faved ? "★" : "☆"}
      </button>
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          aria-label="Delete"
          style={{
            position: "absolute",
            top: 4,
            left: 4,
            width: 30,
            height: 30,
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            background: "rgba(0,0,0,0.45)",
            color: "white",
            fontSize: 12,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          🗑
        </button>
      )}
    </div>
  );
}
