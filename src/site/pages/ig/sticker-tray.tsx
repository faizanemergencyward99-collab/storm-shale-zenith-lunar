// Instagram-style sticker tray: dark sheet with grab handle, rounded search,
// tabs (Recents · My Stickers · Stickers · GIFs), 4-column sticker grid.
// Drag up for full height, swipe down to close. A tapped sticker shrinks,
// then flies into the chat with a little bounce.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls } from "motion/react";
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
import { blobHash, type StickerExport } from "@/site/lib/sticker-image.ts";
import { IconPlus, IconSearch } from "./icons.tsx";

const StickerEditor = lazy(() => import("@/site/components/sticker-editor.tsx"));

export type TrayTab = "recents" | "mine" | "stickers" | "gifs";
const TABS: { id: TrayTab; label: string }[] = [
  { id: "recents", label: "Recents" },
  { id: "mine", label: "My Stickers" },
  { id: "stickers", label: "Stickers" },
  { id: "gifs", label: "GIFs" },
];

interface Props {
  open: boolean;
  initialTab?: TrayTab;
  replyingTo: string | null;
  onClose: () => void;
  onSend: (url: string, kind: "sticker" | "gif") => void;
}

function Cell({ r, onTap, onLong }: { r: StickerRef; onTap: (rect: DOMRect) => void; onLong?: () => void }) {
  const t = useRef<{ timer: number; fired: boolean; x: number; y: number }>({ timer: 0, fired: false, x: 0, y: 0 });
  return (
    <motion.button
      type="button"
      className="ig-tray-cell"
      data-kind={r.kind}
      whileTap={{ scale: 0.82 }}
      transition={{ type: "spring", stiffness: 600, damping: 24 }}
      onPointerDown={(e) => {
        t.current.fired = false;
        t.current.x = e.clientX; t.current.y = e.clientY;
        if (!onLong) return;
        t.current.timer = window.setTimeout(() => { t.current.fired = true; haptics.medium(); onLong(); }, 460);
      }}
      onPointerMove={(e) => { if (Math.hypot(e.clientX - t.current.x, e.clientY - t.current.y) > 10) clearTimeout(t.current.timer); }}
      onPointerUp={() => clearTimeout(t.current.timer)}
      onPointerCancel={() => clearTimeout(t.current.timer)}
      onContextMenu={(e) => { e.preventDefault(); if (onLong) { t.current.fired = true; onLong(); } }}
      onClick={(e) => { if (t.current.fired) return; onTap(e.currentTarget.getBoundingClientRect()); }}
      data-testid="sticker-cell"
    >
      <img src={r.url} alt={r.title ?? ""} loading="lazy" decoding="async" draggable={false} />
    </motion.button>
  );
}

export default function StickerTray({ open, initialTab, replyingTo, onClose, onSend }: Props) {
  const [tab, setTab] = useState<TrayTab>("stickers");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<GiphyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [limitUntil, setLimitUntil] = useState(0);
  const [favorites, setFavorites] = useState<StickerRef[]>([]);
  const [customs, setCustoms] = useState<StickerRef[]>([]);
  const [recents, setRecents] = useState<StickerRef[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState<{ ref: StickerRef; custom: boolean } | null>(null);
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [fly, setFly] = useState<{ src: string; rect: DOMRect; key: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const reqRef = useRef(0);
  const moreLock = useRef(false);
  const drag = useDragControls();
  const collapsedY = typeof window !== "undefined" ? Math.round(window.innerHeight * 0.36) : 300;

  const favIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);
  const customIds = useMemo(() => new Set(customs.map((c) => c.id)), [customs]);
  const mine = useMemo(() => {
    const seen = new Set<string>();
    return [...favorites, ...customs].filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  }, [favorites, customs]);

  useEffect(() => {
    if (!open) return;
    setRecents(getRecents());
    setExpanded(false);
    if (initialTab) setTab(initialTab);
    else setTab(getRecents().length ? "recents" : "stickers");
    void Promise.all([listFavorites(), listCustomStickers()]).then(([f, c]) => { setFavorites(f); setCustoms(c); });
  }, [open, initialTab]);

  const giphyKind: GiphyKind | null = tab === "gifs" ? "gifs" : tab === "stickers" ? "stickers" : null;

  const load = useCallback(async (kind: GiphyKind, q: string, offset: number) => {
    if (!isGiphyConfigured) { setError("GIF search isn't set up."); return; }
    const known = giphyRateLimitedUntil(kind);
    if (known) { setLimitUntil(known); return; }
    const id = offset === 0 ? ++reqRef.current : reqRef.current;
    if (offset === 0) { setLoading(true); setError(""); setLimitUntil(0); }
    try {
      const r = q.trim() ? await giphy.search(kind, q, offset, "pg") : await giphy.trending(kind, offset, "pg");
      if (id !== reqRef.current) return;
      setItems((prev) => {
        if (offset === 0) return r.data;
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...r.data.filter((d) => !ids.has(d.id))];
      });
      const total = r.pagination?.total_count;
      setHasMore(r.data.length >= GIPHY_PAGE_SIZE && (total === undefined || offset + r.data.length < total));
      if (offset === 0) scrollRef.current?.scrollTo({ top: 0 });
    } catch (e) {
      if (id !== reqRef.current) return;
      if (e instanceof GiphyRateLimitError) setLimitUntil(e.retryAt);
      else setError(e instanceof Error ? e.message : "Couldn't load. Try again.");
      setHasMore(false);
    } finally {
      if (id === reqRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !giphyKind) return;
    const t = setTimeout(() => { void load(giphyKind, query, 0); }, query.trim() ? 350 : 0);
    return () => clearTimeout(t);
  }, [open, giphyKind, query, load]);

  useEffect(() => {
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!open || !giphyKind || !root || !target || !hasMore) return;
    const io = new IntersectionObserver((en) => {
      if (!en.some((x) => x.isIntersecting) || moreLock.current) return;
      moreLock.current = true;
      void load(giphyKind, query, items.length).finally(() => { moreLock.current = false; });
    }, { root, rootMargin: "0px 0px 400px 0px" });
    io.observe(target);
    return () => io.disconnect();
  }, [open, giphyKind, hasMore, items.length, query, load]);

  const pick = (r: StickerRef, rect: DOMRect) => {
    haptics.medium();
    pushRecent(r);
    setFly({ src: r.url, rect, key: Date.now() });
    onSend(r.url, r.kind);
    onClose();
  };

  const toggleFav = async (r: StickerRef) => {
    if (favIds.has(r.id)) {
      setFavorites((p) => p.filter((f) => f.id !== r.id));
      if (!(await removeFavorite(r.id))) setFavorites((p) => [r, ...p]);
    } else {
      setFavorites((p) => [r, ...p]);
      if (!(await addFavorite(r))) setFavorites((p) => p.filter((f) => f.id !== r.id));
    }
  };

  const upload = async (out: StickerExport): Promise<StickerRef | null> => {
    setBusy(true);
    try {
      const url = await uploadCustomSticker(out.blob, { hash: await blobHash(out.blob) });
      if (!url) return null;
      const ref: StickerRef = { id: stickerId(url), url, kind: "sticker", title: "Custom sticker" };
      setCustoms((p) => (p.some((c) => c.id === ref.id) ? p : [ref, ...p]));
      return ref;
    } finally {
      setBusy(false);
    }
  };

  const grid = (refs: StickerRef[], empty: string, allowMenu: boolean) =>
    refs.length === 0 ? (
      <p className="ig-tray-empty">{empty}</p>
    ) : (
      <div className="ig-tray-grid" data-gifs={tab === "gifs" ? "" : undefined}>
        {refs.map((r) => (
          <Cell key={r.id} r={r} onTap={(rect) => pick(r, rect)} onLong={allowMenu ? () => setMenu({ ref: r, custom: customIds.has(r.id) }) : undefined} />
        ))}
      </div>
    );

  const giphyRefs: StickerRef[] = items.map((it) => {
    const url = giphySendUrl(it);
    return { id: stickerId(url), url, kind: tab === "gifs" ? "gif" : "sticker", title: it.title, preview: giphyPreviewUrl(it) } as StickerRef & { preview: string };
  });

  const sheet = (
    <AnimatePresence>
      {open && (
        <motion.div key="tray" className="ig-tray-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="ig-tray-scrim" onClick={onClose} />
          <motion.div
            className="ig-tray"
            data-testid="sticker-panel"
            initial={{ y: "100%" }}
            animate={{ y: expanded ? 0 : collapsedY }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
            drag="y"
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: collapsedY }}
            dragElastic={{ top: 0.05, bottom: 0.8 }}
            onDragEnd={(_, info) => {
              if (info.offset.y < -60 || info.velocity.y < -500) setExpanded(true);
              else if (info.offset.y > 110 || info.velocity.y > 600) {
                if (expanded && info.offset.y < 260) setExpanded(false);
                else onClose();
              }
            }}
          >
            <div className="ig-tray-head" onPointerDown={(e) => drag.start(e)}>
              <div className="ig-sheet-grab" />
              {replyingTo && <p className="ig-tray-reply">Replying to {replyingTo}</p>}
              <label className="ig-tray-search">
                <IconSearch size={17} />
                <input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); if (tab === "recents" || tab === "mine") setTab("stickers"); }}
                  onFocus={() => setExpanded(true)}
                  placeholder="Search"
                  maxLength={50}
                  data-testid="sticker-search-input"
                />
              </label>
              <div className="ig-tray-tabs" role="tablist">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    className="ig-tray-tab"
                    data-on={tab === t.id ? "" : undefined}
                    onClick={() => { haptics.selection(); setTab(t.id); }}
                    data-testid={`sticker-tab-${t.id}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="ig-tray-scroll" ref={scrollRef} style={{ paddingBottom: expanded ? 24 : collapsedY + 24 }} data-testid="sticker-scroll">
              {tab === "recents" && grid(recents, "Stickers and GIFs you send show up here.", false)}
              {tab === "mine" && (
                <>
                  <div className="ig-tray-grid">
                    <button type="button" className="ig-tray-cell ig-tray-create" onClick={() => fileRef.current?.click()} disabled={busy} data-testid="sticker-upload-btn">
                      <IconPlus size={26} />
                      <span>{busy ? "Saving…" : "Create"}</span>
                    </button>
                    {mine.map((r) => (
                      <Cell key={r.id} r={r} onTap={(rect) => pick(r, rect)} onLong={() => setMenu({ ref: r, custom: customIds.has(r.id) })} />
                    ))}
                  </div>
                  <p className="ig-tray-hint">Long-press a sticker to save, unsave or delete it.</p>
                </>
              )}
              {giphyKind && (
                limitUntil ? (
                  <p className="ig-tray-empty" data-testid="giphy-rate-limit">GIPHY needs a short breather. Try again at {new Date(limitUntil).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.</p>
                ) : loading && items.length === 0 ? (
                  <div className="ig-tray-grid">{Array.from({ length: 12 }, (_, i) => <span key={i} className="ig-tray-skel" />)}</div>
                ) : error ? (
                  <p className="ig-tray-empty">{error}</p>
                ) : (
                  <>
                    <div className="ig-tray-grid" data-gifs={tab === "gifs" ? "" : undefined} data-testid={`giphy-grid-${tab}`}>
                      {giphyRefs.map((r) => (
                        <Cell
                          key={r.id}
                          r={{ ...r, url: (r as StickerRef & { preview: string }).preview }}
                          onTap={(rect) => pick({ id: r.id, url: r.url, kind: r.kind, title: r.title }, rect)}
                          onLong={() => setMenu({ ref: { id: r.id, url: r.url, kind: r.kind, title: r.title }, custom: false })}
                        />
                      ))}
                    </div>
                    <div ref={sentinelRef} style={{ height: 1 }} />
                    {!items.length && !loading && <p className="ig-tray-empty">No results</p>}
                    <p className="ig-tray-hint">Powered by GIPHY</p>
                  </>
                )
              )}
            </div>

            <AnimatePresence>
              {menu && (
                <motion.div key="menu" className="ig-tray-menu-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenu(null)}>
                  <motion.div
                    className="ig-tray-menu"
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 40, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 480, damping: 34 }}
                    onClick={(e) => e.stopPropagation()}
                    data-testid="sticker-cell-menu"
                  >
                    <img src={menu.ref.url} alt="" />
                    <button type="button" onClick={() => { const r = menu.ref; setMenu(null); void toggleFav(r); }} data-testid="cell-menu-save">
                      {favIds.has(menu.ref.id) ? "Remove from My Stickers" : "Save to My Stickers"}
                    </button>
                    {menu.custom && (
                      <button type="button" data-danger="" onClick={() => { const r = menu.ref; setMenu(null); setCustoms((p) => p.filter((c) => c.id !== r.id)); void deleteCustomSticker(r.url); }} data-testid="cell-menu-delete">
                        Delete sticker
                      </button>
                    )}
                    <button type="button" onClick={() => setMenu(null)} data-testid="cell-menu-cancel">Cancel</button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const vw = typeof window !== "undefined" ? window.innerWidth : 390;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  return (
    <>
      {createPortal(sheet, document.body)}
      {fly &&
        createPortal(
          <motion.img
            key={fly.key}
            src={fly.src}
            alt=""
            className="ig-fly"
            style={{ left: fly.rect.left, top: fly.rect.top, width: fly.rect.width, height: fly.rect.height }}
            initial={{ x: 0, y: 0, scale: 0.85, opacity: 1 }}
            animate={{ x: Math.min(vw, 480) * 0.5 + (vw - Math.min(vw, 480)) / 2 + 60 - fly.rect.left - fly.rect.width / 2, y: vh - 190 - fly.rect.top, scale: [0.85, 1.25, 1], opacity: [1, 1, 0] }}
            transition={{ duration: 0.5, ease: [0.3, 1.3, 0.5, 1] }}
            onAnimationComplete={() => setFly(null)}
          />,
          document.body,
        )}
      {createPortal(
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.heic,.heif"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) setEditorFile(f); }}
          style={{ position: "fixed", left: -9999, width: 1, height: 1, opacity: 0 }}
          tabIndex={-1}
          aria-hidden
          data-testid="sticker-file-input"
        />,
        document.body,
      )}
      {editorFile && (
        <Suspense fallback={null}>
          <StickerEditor
            file={editorFile}
            dark
            onClose={() => setEditorFile(null)}
            onSave={async (out) => {
              const ref = await upload(out);
              if (!ref) return false;
              setFavorites((p) => (p.some((f) => f.id === ref.id) ? p : [ref, ...p]));
              await addFavorite(ref);
              setEditorFile(null);
              setTab("mine");
              return true;
            }}
            onSend={async (out) => {
              const ref = await upload(out);
              if (!ref) return false;
              setEditorFile(null);
              pushRecent(ref);
              onSend(ref.url, "sticker");
              onClose();
              return true;
            }}
          />
        </Suspense>
      )}
    </>
  );
}
