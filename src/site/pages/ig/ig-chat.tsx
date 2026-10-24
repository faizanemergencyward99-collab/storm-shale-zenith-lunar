// Our Chat — Instagram Direct Message screen. Orchestrates the data engine,
// header, virtual list, composer and every sheet/overlay.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { VirtuosoHandle } from "react-virtuoso";
import { broadcastTyping, searchMessages, type ChatMessage, type Sender } from "@/site/lib/cloud-chat.ts";
import { haptics } from "@/site/lib/haptics.ts";
import { downloadMedia } from "@/site/lib/download.ts";
import { startChatPresence, refreshChatPresence } from "@/site/lib/presence.ts";
import { ensurePushSubscription } from "@/site/lib/push.ts";
import { useChatEngine, makeReplySnapshot, type ReplyDraft } from "./use-chat-engine.ts";
import { useSharedSettings } from "./use-shared-settings.ts";
import { useRecorder } from "./use-recorder.ts";
import { useWakeUp } from "./use-wake-up.ts";
import { startAnimClock } from "./anim.ts";
import { isLight, themeVars, type IgTheme } from "./themes.ts";
import { LAST_READ_KEY, SENDER_KEY, SESSION_ID, detectLowFx, firstName, otherOf, readSender } from "./util.ts";
import Header, { type SearchState } from "./header.tsx";
import MessageList from "./message-list.tsx";
import Composer from "./composer.tsx";
import Wallpaper from "./wallpaper.tsx";
import WakeOverlay from "./wake-overlay.tsx";
import LongPressOverlay, { type LiftTarget } from "./long-press-overlay.tsx";
import PlusMenu from "./plus-menu.tsx";
import BubbleContent, { isBare, type ViewerItem } from "./bubble-content.tsx";
import { ConfirmUnsend, EditDialog, IdentitySheet, NamesSheet, ReactionsSheet } from "./dialogs.tsx";
import type { RowHandlers } from "./message-row.tsx";
import type { TrayTab } from "./sticker-tray.tsx";
import { IconChevronDown } from "./icons.tsx";
import "./ig.css";

const MusicPage = lazy(() => import("@/site/components/music/music-page.tsx"));
const ProfileMediaPage = lazy(() => import("@/site/components/profile-media-page.tsx"));
const StickerTray = lazy(() => import("./sticker-tray.tsx"));
const ThemePicker = lazy(() => import("./theme-picker.tsx"));
const GallerySheet = lazy(() => import("./gallery-sheet.tsx"));
const Doodle = lazy(() => import("./doodle.tsx"));
const MediaViewer = lazy(() => import("./media-viewer.tsx"));
const VideoRecorder = lazy(() =>
  import("@/site/components/video-recorder.tsx").then((m) => ({ default: m.InAppVideoRecorder })),
);

const WAKE_NOTE = "⏰ Wake-up call sent 💗";
const EMPTY_SEARCH: SearchState = { open: false, query: "", index: 0, total: 0, loading: false, done: false };
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 30)));

export default function IgChat({ onExit }: { onExit: () => void }) {
  const [sender, setSender] = useState<Sender>(readSender);
  const senderRef = useRef<Sender>(sender);
  senderRef.current = sender;
  const other = otherOf(sender);
  const appRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<VirtuosoHandle | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFallbackRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    listRef.current?.scrollToIndex({ index: "LAST", align: "end", behavior: smooth ? "smooth" : "auto" });
  }, []);
  const engine = useChatEngine(senderRef, () => requestAnimationFrame(() => scrollToBottom()));
  const settings = useSharedSettings();
  const [previewTheme, setPreviewTheme] = useState<IgTheme | null>(null);
  const theme = previewTheme ?? settings.theme;
  const [lowFx, setLowFx] = useState(detectLowFx);
  const recorder = useRecorder(engine.setError);

  const [input, setInput] = useState("");
  const [reply, setReply] = useState<ReplyDraft | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [lift, setLift] = useState<LiftTarget | null>(null);
  const [liftedId, setLiftedId] = useState<string | null>(null);
  const [editMsg, setEditMsg] = useState<ChatMessage | null>(null);
  const [confirmMsg, setConfirmMsg] = useState<ChatMessage | null>(null);
  const [reactionsMsg, setReactionsMsg] = useState<ChatMessage | null>(null);
  const [identityOpen, setIdentityOpen] = useState(false);
  const [namesOpen, setNamesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMounted, setProfileMounted] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [tray, setTray] = useState<{ open: boolean; tab?: TrayTab; mounted: boolean }>({ open: false, mounted: false });
  const [themeOpen, setThemeOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<File[] | null>(null);
  const [doodle, setDoodle] = useState<{ open: boolean; photo: File | null } | null>(null);
  const [viewer, setViewer] = useState<{ items: ViewerItem[]; index: number; rect: DOMRect | null; ts: number } | null>(null);
  const [videoRec, setVideoRec] = useState<{ open: boolean; mounted: boolean }>({ open: false, mounted: false });
  const [search, setSearch] = useState<SearchState>(EMPTY_SEARCH);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [kbInset, setKbInset] = useState(0);
  const resultsRef = useRef<ChatMessage[]>([]);
  const searchSeq = useRef(0);
  const searchTimer = useRef(0);
  const typingTimer = useRef(0);
  const lastTypingSent = useRef(0);

  const wake = useWakeUp(() => { void engine.sendText(WAKE_NOTE, null); });

  // ── App-level effects ────────────────────────────────────────────────────
  useEffect(() => { startAnimClock(); }, []);
  useEffect(() => {
    try { localStorage.setItem(LAST_READ_KEY, String(Date.now())); } catch { /* noop */ }
  }, []);
  useEffect(() => startChatPresence(() => senderRef.current), []);
  useEffect(() => { void ensurePushSubscription(sender); }, [sender]);
  useEffect(() => {
    refreshChatPresence(sender);
    try { localStorage.setItem(SENDER_KEY, sender); } catch { /* noop */ }
  }, [sender]);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setKbInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => { vv.removeEventListener("resize", update); vv.removeEventListener("scroll", update); };
  }, []);

  // Light/dark chrome + reduced effects also reach the sheets portaled to <body>.
  const light = isLight(theme);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.igMode = light ? "light" : "dark";
    if (lowFx) root.dataset.igLowfx = "";
    else delete root.dataset.igLowfx;
    return () => { delete root.dataset.igMode; delete root.dataset.igLowfx; };
  }, [light, lowFx]);

  const setHeaderHeight = useCallback((h: number) => {
    appRef.current?.style.setProperty("--ig-hdr-h", `${h}px`);
  }, []);

  // ── Navigation helpers ─────────────────────────────────────────────────
  const flash = useCallback((id: string) => {
    setFlashId(id);
    window.setTimeout(() => setFlashId((c) => (c === id ? null : c)), 1500);
  }, []);

  const goTo = useCallback(async (id: string, highlight = true, ts?: number) => {
    let idx = engine.messagesRef.current.findIndex((m) => m.id === id);
    if (idx < 0) {
      const at = ts ?? (await engine.findTimestamp(id));
      if (at == null || !(await engine.jumpAround(at))) return;
      await nextFrame();
      idx = engine.messagesRef.current.findIndex((m) => m.id === id);
    }
    if (idx < 0) return;
    await nextFrame();
    listRef.current?.scrollToIndex({ index: idx, align: "center", behavior: "auto" });
    if (highlight) flash(id);
  }, [engine, flash]);

  // ── Search ─────────────────────────────────────────────────────────────
  const runSearch = useCallback(async (q: string) => {
    const seq = ++searchSeq.current;
    if (!q.trim()) {
      resultsRef.current = [];
      setSearch((s) => ({ ...s, total: 0, index: 0, loading: false, done: false }));
      return;
    }
    setSearch((s) => ({ ...s, loading: true }));
    const res = (await searchMessages(q)).filter((m) => m.type === "text");
    if (seq !== searchSeq.current) return;
    resultsRef.current = res;
    setSearch((s) => ({ ...s, total: res.length, index: 0, loading: false, done: true }));
    if (res.length) void goTo(res[0].id, false, res[0].timestamp);
  }, [goTo]);

  const onQuery = useCallback((q: string) => {
    setSearch((s) => ({ ...s, query: q, done: false }));
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => { void runSearch(q); }, 280);
  }, [runSearch]);

  const step = useCallback((delta: number) => {
    setSearch((s) => {
      const next = s.index + delta;
      if (next < 0 || next >= resultsRef.current.length) return s;
      haptics.selection();
      void goTo(resultsRef.current[next].id, false, resultsRef.current[next].timestamp);
      return { ...s, index: next };
    });
  }, [goTo]);

  const openSearch = useCallback(() => {
    haptics.light();
    setSearch({ ...EMPTY_SEARCH, open: true });
    window.setTimeout(() => searchInputRef.current?.focus(), 80);
  }, []);
  const closeSearch = useCallback(() => {
    searchSeq.current++;
    resultsRef.current = [];
    setSearch(EMPTY_SEARCH);
    void engine.returnToLatest().then(() => window.setTimeout(() => scrollToBottom(false), 60));
  }, [scrollToBottom, engine]);

  // ── Composer actions ───────────────────────────────────────────────────
  const onInput = (v: string) => {
    setInput(v);
    const now = Date.now();
    if (now - lastTypingSent.current > 1500) { lastTypingSent.current = now; broadcastTyping(sender, SESSION_ID, true); }
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => { lastTypingSent.current = 0; broadcastTyping(sender, SESSION_ID, false); }, 2500);
  };

  const send = async () => {
    const text = input;
    if (!text.trim()) return;
    haptics.light();
    const r = reply;
    setInput("");
    setReply(null);
    window.clearTimeout(typingTimer.current);
    lastTypingSent.current = 0;
    broadcastTyping(sender, SESSION_ID, false);
    const ok = await engine.sendText(text, r);
    if (!ok) setInput((cur) => cur || text);
  };

  const beginReply = useCallback((msg: ChatMessage) => {
    haptics.light();
    setReply({ id: msg.id, snapshot: makeReplySnapshot(msg) });
    window.setTimeout(() => textareaRef.current?.focus(), 60);
  }, []);

  const takeReply = () => { const r = reply; setReply(null); return r; };

  const onPickedGallery = (files: FileList | null) => {
    if (!files || !files.length) return;
    const list = Array.from(files);
    setGalleryFiles((prev) => [...(prev ?? []), ...list]);
  };

  const sendGallery = (files: File[]) => {
    setGalleryFiles(null);
    if (!files.length) return;
    const r = takeReply();
    const media = files.filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    const rest = files.filter((f) => !media.includes(f));
    if (media.length >= 2) void engine.sendGroup(media, r);
    else if (media.length === 1) void engine.sendMedia(media[0], r);
    rest.forEach((f) => { void engine.sendFile(f, null); });
  };

  // ── Row handlers (stable identity, latest logic via ref) ──────────────────
  const latest = useRef<RowHandlers>(null as unknown as RowHandlers);
  latest.current = {
    onLongPress: (msg, el) => {
      textareaRef.current?.blur();
      setLiftedId(msg.id);
      setLift({ msg, rect: el.getBoundingClientRect(), mine: msg.sender === sender, pos: el.dataset.pos ?? "single", bare: isBare(msg) });
    },
    onDoubleTap: (msg) => {
      haptics.light();
      void engine.react(msg, "❤️", "add").then((r) => { if (r === "limit") engine.setError("You can add up to 6 different reactions to one message."); });
    },
    onSwipeReply: (msg) => beginReply(msg),
    onOpenMedia: (items, index, rect, ts) => setViewer({ items, index, rect, ts }),
    onJumpTo: (id) => { void goTo(id); },
    onOpenReactions: (msg) => { haptics.light(); setReactionsMsg(msg); },
  };
  const handlers = useMemo<RowHandlers>(() => ({
    onLongPress: (m, el) => latest.current.onLongPress(m, el),
    onDoubleTap: (m) => latest.current.onDoubleTap(m),
    onSwipeReply: (m) => latest.current.onSwipeReply(m),
    onOpenMedia: (a, b, c, d) => latest.current.onOpenMedia(a, b, c, d),
    onJumpTo: (id) => latest.current.onJumpTo(id),
    onOpenReactions: (m) => latest.current.onOpenReactions(m),
  }), []);

  const myEmojis = useMemo(() => {
    const out = new Set<string>();
    const msg = lift ? engine.messages.find((m) => m.id === lift.msg.id) ?? lift.msg : null;
    Object.entries(msg?.reactions ?? {}).forEach(([e, users]) => { if (users.some((u) => engine.reactorOf(u) === sender)) out.add(e); });
    return out;
  }, [lift, engine.messages, engine.reactorOf, sender]);

  const closeLift = () => setLift(null);
  const liveReactionsMsg = reactionsMsg ? engine.messages.find((m) => m.id === reactionsMsg.id) ?? null : null;

  const downloadMsg = (m: ChatMessage) => {
    haptics.light();
    if (m.albumItems && m.albumItems.length > 1) {
      void (async () => {
        for (const it of m.albumItems!) {
          await downloadMedia(it.url, it.kind === "video" ? "video" : "image", { ts: m.timestamp });
          await new Promise((r) => setTimeout(r, 350));
        }
      })();
    } else if (m.mediaUrl && m.type !== "text") void downloadMedia(m.mediaUrl, m.type, { filename: m.fileName, mime: m.mimeType, ts: m.timestamp });
  };

  return (
    <div className="ig-root" data-lowfx={lowFx ? "" : undefined} data-mode={light ? "light" : "dark"} style={themeVars(theme) as React.CSSProperties}>
      <div className="ig-app" ref={appRef} data-testid="ig-chat">
        <Wallpaper src={theme.wallpaper} />
        <Header
          other={other}
          ringing={wake.ringing}
          search={search}
          inputRef={searchInputRef}
          onBack={() => { haptics.light(); onExit(); }}
          onProfile={() => { setProfileMounted(true); setProfileOpen(true); }}
          onIdentity={() => setIdentityOpen(true)}
          onMusic={() => { haptics.light(); setMusicOpen(true); }}
          onCall={wake.start}
          onOpenSearch={openSearch}
          onCloseSearch={closeSearch}
          onQuery={onQuery}
          onOlder={() => step(1)}
          onNewer={() => step(-1)}
          onHeight={setHeaderHeight}
        />

        <main className="ig-list">
          {engine.loading && engine.messages.length === 0 ? (
            <div className="ig-center" data-testid="chat-loading"><span className="ig-spin ig-spin-lg" /></div>
          ) : (
            <MessageList
              messages={engine.messages}
              me={sender}
              other={other}
              hasMoreOlder={engine.hasMoreOlder}
              loadingOlder={engine.loadingOlder}
              loadOlder={engine.loadOlder}
              detached={engine.detached}
              loadNewer={engine.loadNewer}
              term={search.open ? search.query : ""}
              currentHitId={search.open && search.total ? resultsRef.current[search.index]?.id ?? null : null}
              flashId={flashId}
              liftedId={liftedId}
              uploading={engine.uploading}
              progress={engine.progress}
              compressing={engine.compressing}
              otherTyping={engine.otherTyping === other}
              handlers={handlers}
              listRef={listRef}
              onAtBottom={setAtBottom}
            />
          )}
          <AnimatePresence>
            {(!atBottom || engine.detached) && !search.open && (
              <motion.button
                key="jump"
                type="button"
                className="ig-jump"
                initial={{ opacity: 0, scale: 0.6, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.6, y: 10 }}
                transition={{ type: "spring", stiffness: 520, damping: 30 }}
                onClick={() => { haptics.light(); const far = engine.detached; void engine.returnToLatest().then(() => window.setTimeout(() => scrollToBottom(!far), far ? 60 : 0)); }}
                aria-label="Jump to newest"
                data-testid="jump-latest-btn"
              >
                <IconChevronDown size={22} />
              </motion.button>
            )}
          </AnimatePresence>
        </main>

        <div style={{ paddingBottom: kbInset }} className="ig-composer-wrap">
          <Composer
            value={input}
            onChange={onInput}
            onSend={() => { void send(); }}
            reply={reply?.snapshot ?? null}
            replyIsMine={reply?.snapshot.sender === sender}
            onCancelReply={() => setReply(null)}
            error={engine.error}
            onDismissError={() => engine.setError(null)}
            onCamera={() => { haptics.light(); if (cameraInputRef.current) { cameraInputRef.current.value = ""; cameraInputRef.current.click(); } }}
            onGallery={() => { haptics.light(); if (galleryInputRef.current) { galleryInputRef.current.value = ""; galleryInputRef.current.click(); } }}
            onSticker={() => { haptics.light(); setTray({ open: true, mounted: true }); }}
            onPlus={() => { haptics.light(); setPlusOpen((v) => !v); }}
            plusOpen={plusOpen}
            recorder={recorder}
            onVoice={(blob, ms) => { void engine.sendVoice(blob, ms, takeReply()); }}
            onHint={(m) => engine.setError(m)}
            textareaRef={textareaRef}
            onFocus={() => { if (atBottom) window.setTimeout(() => scrollToBottom(false), 250); }}
          />
          <AnimatePresence>
            {plusOpen && (
              <PlusMenu
                key="plus"
                sender={sender}
                onClose={() => setPlusOpen(false)}
                onMusic={() => setMusicOpen(true)}
                onWake={wake.start}
                onThemes={() => setThemeOpen(true)}
                onDraw={() => setDoodle({ open: true, photo: null })}
                onSearch={openSearch}
                onVideo={() => setVideoRec({ open: true, mounted: true })}
                onFile={() => { if (fileInputRef.current) { fileInputRef.current.value = ""; fileInputRef.current.click(); } }}
              />
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence onExitComplete={() => setLiftedId(null)}>
          {lift && (
            <LongPressOverlay
              key={lift.msg.id}
              target={lift}
              myEmojis={myEmojis}
              renderBubble={() => (
                <div className={lift.bare ? "ig-bare" : "ig-bubble"} data-pos={lift.pos} data-side={lift.mine ? "out" : "in"}>
                  <BubbleContent msg={lift.msg} mine={lift.mine} term="" uploading={false} onOpenMedia={() => {}} />
                </div>
              )}
              onClose={closeLift}
              onReact={(e) => {
                const m = lift.msg;
                closeLift();
                haptics.light();
                void engine.react(m, e).then((r) => { if (r === "limit") engine.setError("You can add up to 6 different reactions to one message."); });
              }}
              onReply={() => { const m = lift.msg; closeLift(); beginReply(m); }}
              onCopy={() => {
                const t = lift.msg.text ?? "";
                closeLift();
                void navigator.clipboard?.writeText(t).then(() => haptics.light()).catch(() => {});
              }}
              onEdit={() => { const m = lift.msg; closeLift(); setEditMsg(m); }}
              onUnsend={() => { const m = lift.msg; closeLift(); setConfirmMsg(m); }}
              onDownload={() => { const m = lift.msg; closeLift(); downloadMsg(m); }}
              onReplyGif={() => {
                const m = lift.msg;
                closeLift();
                setReply({ id: m.id, snapshot: makeReplySnapshot(m) });
                setTray({ open: true, tab: "gifs", mounted: true });
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editMsg && (
            <EditDialog
              key="edit"
              initial={editMsg.text ?? ""}
              onCancel={() => setEditMsg(null)}
              onSave={(t) => { const id = editMsg.id; setEditMsg(null); haptics.light(); void engine.edit(id, t); }}
            />
          )}
          {confirmMsg && (
            <ConfirmUnsend
              key="unsend"
              onCancel={() => setConfirmMsg(null)}
              onConfirm={() => { const m = confirmMsg; setConfirmMsg(null); haptics.medium(); void engine.unsend(m); }}
            />
          )}
          {liveReactionsMsg && (
            <ReactionsSheet
              key="reactions"
              msg={liveReactionsMsg}
              me={sender}
              reactorOf={engine.reactorOf}
              onRemove={(emoji) => { haptics.light(); void engine.react(liveReactionsMsg, emoji); }}
              onClose={() => setReactionsMsg(null)}
            />
          )}
          {identityOpen && (
            <IdentitySheet
              key="identity"
              current={sender}
              onClose={() => setIdentityOpen(false)}
              onRename={() => { haptics.light(); setIdentityOpen(false); setNamesOpen(true); }}
              onPick={(s) => {
                haptics.success();
                if (s !== sender) broadcastTyping(sender, SESSION_ID, false);
                setSender(s);
                setIdentityOpen(false);
              }}
            />
          )}
          {namesOpen && (
            <NamesSheet
              key="names"
              names={settings.names}
              onClose={() => setNamesOpen(false)}
              onSave={(next) => {
                haptics.success();
                setNamesOpen(false);
                void settings.applyNames(next).then((ok) => { if (!ok) engine.setError("Names saved on this phone only — couldn't sync them."); });
              }}
            />
          )}
        </AnimatePresence>

        <Suspense fallback={null}>
          <AnimatePresence>
            {galleryFiles && (
              <GallerySheet
                key="gallery"
                files={galleryFiles}
                onAddMore={() => galleryInputRef.current?.click()}
                onClose={() => setGalleryFiles(null)}
                onSend={sendGallery}
                onDraw={(f) => { setGalleryFiles(null); setDoodle({ open: true, photo: f }); }}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {doodle && (
              <Doodle
                key="doodle"
                photo={doodle.photo}
                onClose={() => setDoodle(null)}
                onSend={(file, w, h) => {
                  const hadPhoto = !!doodle.photo;
                  setDoodle(null);
                  if (hadPhoto) void engine.sendMedia(file, takeReply());
                  else void engine.sendDrawing(file, w, h, takeReply());
                }}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {viewer && <MediaViewer key="viewer" {...viewer} onClose={() => setViewer(null)} />}
          </AnimatePresence>
          {themeOpen && (
            <ThemePicker
              applied={settings.theme}
              lowFx={lowFx}
              onPreview={setPreviewTheme}
              onApply={(t) => {
                haptics.success();
                setPreviewTheme(null);
                setThemeOpen(false);
                void settings.applyTheme(t).then((ok) => { if (!ok) engine.setError("Theme saved on this phone only — couldn't sync it."); });
              }}
              onClose={() => setThemeOpen(false)}
              onToggleLowFx={() => {
                setLowFx((v) => {
                  try { localStorage.setItem("hb_chat_reduce_fx", v ? "0" : "1"); } catch { /* noop */ }
                  return !v;
                });
              }}
            />
          )}
          {tray.mounted && (
            <StickerTray
              open={tray.open}
              initialTab={tray.tab}
              replyingTo={reply ? (reply.snapshot.sender === sender ? "yourself" : firstName(reply.snapshot.sender)) : null}
              onClose={() => setTray((t) => ({ ...t, open: false, tab: undefined }))}
              onSend={(url, kind) => { void engine.sendSticker(url, kind, takeReply()); }}
            />
          )}
          {musicOpen && <MusicPage dark onClose={() => setMusicOpen(false)} />}
          {profileMounted && <ProfileMediaPage open={profileOpen} dark onClose={() => setProfileOpen(false)} />}
          {videoRec.mounted && (
            <VideoRecorder
              open={videoRec.open}
              onClose={() => setVideoRec((v) => ({ ...v, open: false }))}
              onCapture={(file: File) => { setVideoRec((v) => ({ ...v, open: false })); void engine.sendMedia(file, takeReply()); }}
              onUnavailable={() => {
                setVideoRec((v) => ({ ...v, open: false }));
                if (videoFallbackRef.current) { videoFallbackRef.current.value = ""; videoFallbackRef.current.click(); }
              }}
            />
          )}
        </Suspense>

        {wake.ringing && <WakeOverlay status={wake.status} error={wake.error} onStop={wake.stop} />}

        <input ref={galleryInputRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { onPickedGallery(e.target.files); e.target.value = ""; }} data-testid="gallery-input" />
        <input ref={cameraInputRef} type="file" accept="image/*,video/*" capture="environment" hidden onChange={(e) => { Array.from(e.target.files ?? []).forEach((f) => { void engine.sendMedia(f, takeReply()); }); e.target.value = ""; }} />
        <input ref={videoFallbackRef} type="file" accept="video/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void engine.sendMedia(f, takeReply()); e.target.value = ""; }} />
        <input ref={fileInputRef} type="file" multiple hidden onChange={(e) => { Array.from(e.target.files ?? []).forEach((f) => { void engine.sendFile(f, takeReply()); }); e.target.value = ""; }} data-testid="chat-file-input" />
      </div>
    </div>
  );
}
