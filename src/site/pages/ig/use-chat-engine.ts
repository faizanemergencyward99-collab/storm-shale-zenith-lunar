// Chat data engine: history, realtime, pagination and every send/edit/react
// action. Pure logic — no UI — so the Instagram screen stays lean.
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  listMessages,
  fetchOlderMessages,
  fetchNewerMessages,
  fetchMessagesAround,
  fetchMessageTimestamp,
  takePrefetchedMessages,
  createMessage,
  createMediaMessage,
  createAlbumMessage,
  createStickerMessage,
  createFileMessage,
  editMessage,
  deleteMessage,
  setMyReaction,
  uploadChatMedia,
  subscribeToChat,
  subscribeToTyping,
  MESSAGE_PAGE_SIZE,
  MAX_UPLOAD_BYTES,
  type AlbumItem,
  type ChatMessage,
  type ReactionsMap,
  type ReplySnapshot,
  type Sender,
} from "@/site/lib/cloud-chat.ts";
import { formatBytes } from "@/site/lib/download.ts";
import { SESSION_ID } from "./util.ts";
import { markAnimated } from "./anim.ts";

export interface ReplyDraft {
  id: string;
  snapshot: ReplySnapshot;
}

export const MAX_REACTIONS_PER_PERSON = 6;
const MAX_FILE = 52_428_800;
const legacy = () => import("@/site/lib/media-compress.ts");

export function makeReplySnapshot(msg: ChatMessage): ReplySnapshot {
  return {
    id: msg.id,
    sender: msg.sender,
    type: msg.type,
    text: msg.type === "text" ? (msg.text ?? "").slice(0, 400) : null,
    mediaUrl: msg.mediaUrl ?? null,
    durationMs: msg.durationMs ?? null,
    ...(msg.albumItems && msg.albumItems.length > 1 ? { albumCount: msg.albumItems.length } : null),
  };
}

const sameOptimistic = (a: ChatMessage, b: ChatMessage) =>
  a.sender === b.sender &&
  a.type === b.type &&
  (a.text ?? "") === (b.text ?? "") &&
  (a.mediaUrl ?? "") === (b.mediaUrl ?? "") &&
  Math.abs(a.timestamp - b.timestamp) < 20000;

function reconcile(prev: ChatMessage[], fresh: ChatMessage[]): ChatMessage[] {
  if (!fresh.length) return prev;
  const oldestFreshTs = fresh[0].timestamp;
  const older = prev.filter((m) => m.timestamp < oldestFreshTs && !m.id.startsWith("opt-"));
  const pendingOpt = prev.filter((m) => m.id.startsWith("opt-") && !fresh.some((f) => sameOptimistic(f, m)));
  const merged = [...older, ...fresh, ...pendingOpt];
  merged.sort((a, b) => a.timestamp - b.timestamp);
  return merged;
}

export function useChatEngine(senderRef: MutableRefObject<Sender>, onLocalAdd: () => void) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  // "Detached" = showing an old window of history (after a search jump), so
  // newer messages are paged in on scroll-down instead of arriving live.
  const [detached, setDetached] = useState(false);
  const detachedRef = useRef(false);
  detachedRef.current = detached;
  const newerLock = useRef(false);
  const [uploading, setUploading] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Record<string, { done: number; total: number }>>({});
  const [compressing, setCompressing] = useState<{ id: string; pct: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState<Sender | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;
  const hasMoreRef = useRef(false);
  hasMoreRef.current = hasMoreOlder;
  const olderLock = useRef(false);
  const onLocalAddRef = useRef(onLocalAdd);
  onLocalAddRef.current = onLocalAdd;

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  // ── Initial load + realtime + polling fallback ──────────────────────────
  useEffect(() => {
    let alive = true;
    let typingTimer: ReturnType<typeof setTimeout> | null = null;
    (async () => {
      const fresh = await (takePrefetchedMessages() ?? listMessages());
      if (!alive) return;
      if (fresh) {
        setMessages(fresh);
        setHasMoreOlder(fresh.length >= MESSAGE_PAGE_SIZE);
      }
      setLoading(false);
    })();

    const unsubChat = subscribeToChat(({ type, message }) => {
      if (!alive) return;
      setMessages((prev) => {
        if (type === "DELETE") return prev.filter((m) => m.id !== message.id);
        const idx = prev.findIndex((m) => m.id === message.id);
        if (idx >= 0) {
          const next = prev.slice();
          next[idx] = message;
          return next;
        }
        const optIdx = prev.findIndex((m) => m.id.startsWith("opt-") && sameOptimistic(m, message));
        if (optIdx >= 0) {
          markAnimated(message.id);
          const next = prev.slice();
          next[optIdx] = message;
          return next;
        }
        if (detachedRef.current) return prev;
        const next = [...prev, message];
        next.sort((a, b) => a.timestamp - b.timestamp);
        return next;
      });
    });

    const unsubTyping = subscribeToTyping((ev) => {
      if (!alive || ev.sender === senderRef.current) return;
      if (typingTimer) clearTimeout(typingTimer);
      if (ev.isTyping) {
        setOtherTyping(ev.sender);
        typingTimer = setTimeout(() => setOtherTyping(null), 4000);
      } else setOtherTyping(null);
    });

    const refetch = async () => {
      if (!alive || document.hidden || detachedRef.current) return;
      const fresh = await listMessages();
      if (!alive || fresh === null || detachedRef.current) return;
      setMessages((prev) => reconcile(prev, fresh));
    };
    const pollId = window.setInterval(refetch, 5000);
    const onFocus = () => { void refetch(); };
    const onVisible = () => { if (!document.hidden) void refetch(); };
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      unsubChat();
      unsubTyping();
      if (typingTimer) clearTimeout(typingTimer);
      window.clearInterval(pollId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [senderRef]);

  /** Fetch one older page; resolves with the number of messages prepended. */
  const loadOlder = useCallback(async (): Promise<number> => {
    const arr = messagesRef.current;
    if (olderLock.current || !hasMoreRef.current || arr.length === 0) return 0;
    olderLock.current = true;
    setLoadingOlder(true);
    try {
      const res = await fetchOlderMessages(arr[0].timestamp);
      if (!res) return 0;
      setHasMoreOlder(res.hasMore);
      hasMoreRef.current = res.hasMore;
      let count = 0;
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id));
        const older = res.messages.filter((m) => !known.has(m.id));
        count = older.length;
        return older.length ? [...older, ...prev] : prev;
      });
      return count;
    } finally {
      olderLock.current = false;
      setLoadingOlder(false);
    }
  }, []);

  /** Page in messages newer than the loaded window (only while detached). */
  const loadNewer = useCallback(async (): Promise<number> => {
    const arr = messagesRef.current;
    if (newerLock.current || !detachedRef.current || arr.length === 0) return 0;
    newerLock.current = true;
    try {
      const last = arr.filter((m) => !m.id.startsWith("opt-")).pop();
      const res = await fetchNewerMessages(last ? last.timestamp : arr[arr.length - 1].timestamp);
      if (!res) return 0;
      let count = 0;
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id));
        const newer = res.messages.filter((m) => !known.has(m.id));
        count = newer.length;
        return newer.length ? [...prev, ...newer] : prev;
      });
      if (!res.hasMore) { detachedRef.current = false; setDetached(false); }
      return count;
    } finally {
      newerLock.current = false;
    }
  }, []);

  /** Show a window of history around `ts` (an old search hit / quoted message). */
  const jumpAround = useCallback(async (ts: number): Promise<boolean> => {
    const res = await fetchMessagesAround(ts);
    if (!res || res.messages.length === 0) return false;
    detachedRef.current = res.hasNewer;
    setDetached(res.hasNewer);
    hasMoreRef.current = res.hasOlder;
    setHasMoreOlder(res.hasOlder);
    setMessages((prev) => (res.hasNewer ? res.messages : reconcile(res.messages, prev.filter((m) => m.timestamp > ts))));
    return true;
  }, []);

  /** Leave an old window and go back to the live, newest messages. */
  const returnToLatest = useCallback(async () => {
    if (!detachedRef.current) return;
    const fresh = await listMessages();
    if (!fresh) return;
    detachedRef.current = false;
    setDetached(false);
    hasMoreRef.current = fresh.length >= MESSAGE_PAGE_SIZE;
    setHasMoreOlder(hasMoreRef.current);
    setMessages((prev) => [...fresh, ...prev.filter((m) => m.id.startsWith("opt-"))]);
  }, []);

  const findTimestamp = useCallback((id: string) => fetchMessageTimestamp(id), []);

  // ── Optimistic helpers ──────────────────────────────────────────────────
  const addOptimistic = (m: ChatMessage) => {
    markAnimated(m.id, true);
    if (detachedRef.current) void returnToLatest();
    setMessages((prev) => [...prev, m]);
    onLocalAddRef.current();
  };
  const settle = (optId: string, saved: ChatMessage | null) => {
    if (saved) markAnimated(saved.id);
    setMessages((prev) => {
      if (!saved) return prev.filter((m) => m.id !== optId);
      if (prev.some((m) => m.id === saved.id)) return prev.filter((m) => m.id !== optId);
      return prev.map((m) => (m.id === optId ? saved : m));
    });
  };
  const base = (type: ChatMessage["type"], reply: ReplyDraft | null, extra: Partial<ChatMessage> = {}): ChatMessage => ({
    id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    text: null,
    sender: senderRef.current,
    timestamp: Date.now(),
    sessionId: SESSION_ID,
    edited: false,
    replyToId: reply?.id ?? null,
    replySnapshot: reply?.snapshot ?? null,
    ...extra,
  });
  const setBusy = (id: string, on: boolean) =>
    setUploading((prev) => {
      const n = new Set(prev);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });

  const sendText = useCallback(async (text: string, reply: ReplyDraft | null): Promise<boolean> => {
    const t = text.trim();
    if (!t) return false;
    const opt = base("text", reply, { text: t });
    addOptimistic(opt);
    const saved = await createMessage(t, senderRef.current, SESSION_ID, reply);
    settle(opt.id, saved);
    if (!saved) setError("Couldn't send. Check your connection and try again.");
    return !!saved;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendSticker = useCallback(async (url: string, kind: "sticker" | "gif", reply: ReplyDraft | null) => {
    const opt = base(kind, reply, { mediaUrl: url });
    addOptimistic(opt);
    const saved = await createStickerMessage(url, senderRef.current, SESSION_ID, { reply, kind });
    settle(opt.id, saved);
    if (!saved) setError("Couldn't send that. Check your connection and try again.");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** A blank-canvas drawing, sent as a bare "sticker" message (no bubble
   *  chrome, transparent PNG) so it floats over the wallpaper like a real
   *  Instagram drawing. `width`/`height` are the canvas's own pixel size. */
  const sendDrawing = useCallback(async (file: File, width: number, height: number, reply: ReplyDraft | null) => {
    const localUrl = URL.createObjectURL(file);
    const opt = base("sticker", reply, { mediaUrl: localUrl, mediaWidth: width, mediaHeight: height });
    addOptimistic(opt);
    setBusy(opt.id, true);
    try {
      const url = await uploadChatMedia(file, "image", senderRef.current);
      const saved = url
        ? await createStickerMessage(url, senderRef.current, SESSION_ID, { width, height, kind: "sticker", reply })
        : null;
      settle(opt.id, saved);
      if (!saved) setError("Couldn't send the drawing. Check your connection and try again.");
    } finally {
      setBusy(opt.id, false);
      URL.revokeObjectURL(localUrl);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendFile = useCallback(async (file: File, reply: ReplyDraft | null) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`"${file.name}" is ${formatBytes(file.size)} — files must be under ${formatBytes(MAX_UPLOAD_BYTES)}.`);
      return;
    }
    const localUrl = URL.createObjectURL(file);
    const opt = base("file", reply, {
      mediaUrl: localUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
    });
    addOptimistic(opt);
    setBusy(opt.id, true);
    try {
      const url = await uploadChatMedia(file, "file", senderRef.current, file.name);
      const saved = url
        ? await createFileMessage(url, senderRef.current, SESSION_ID, { name: file.name, size: file.size, mime: file.type || "application/octet-stream" }, reply)
        : null;
      settle(opt.id, saved);
      if (!saved) setError("Couldn't send the file. Please try again.");
    } finally {
      setBusy(opt.id, false);
      URL.revokeObjectURL(localUrl);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Compress/probe one photo or video and upload it. */
  const prepareAndUpload = async (file: File, optId: string, showCompress: boolean): Promise<AlbumItem | null> => {
    const { compressImage, probeVideoMeta, compressVideo } = await legacy();
    const isImage = file.type.startsWith("image/");
    let blob: Blob = file;
    let w: number | null = null;
    let h: number | null = null;
    let d: number | null = null;
    if (isImage) {
      const c = await compressImage(file);
      if (c) { blob = c.blob; w = c.width; h = c.height; }
    } else {
      const meta = await probeVideoMeta(file);
      if (meta) { w = meta.width; h = meta.height; d = meta.durationMs; }
      const longSide = meta ? Math.max(meta.width, meta.height) : 0;
      if (file.size > 45 * 1024 * 1024 || longSide > 1920) {
        if (showCompress) setCompressing({ id: optId, pct: 0 });
        const c = await compressVideo(file, (pct) => { if (showCompress) setCompressing({ id: optId, pct }); });
        if (showCompress) setCompressing(null);
        if (c) { blob = c.blob; w = c.width; h = c.height; d = c.durationMs; }
      }
    }
    if (blob.size > MAX_FILE) return null;
    const url = await uploadChatMedia(blob, isImage ? "image" : "video", senderRef.current);
    return url ? { url, w, h, d, kind: isImage ? "image" : "video" } : null;
  };

  const sendMedia = useCallback(async (file: File, reply: ReplyDraft | null) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage && !file.type.startsWith("video/")) return sendFile(file, reply);
    if (file.size > 500 * 1024 * 1024) { setError("That file is too big to send."); return; }
    const localUrl = URL.createObjectURL(file);
    const opt = base(isImage ? "image" : "video", reply, { mediaUrl: localUrl });
    addOptimistic(opt);
    setBusy(opt.id, true);
    try {
      const item = await prepareAndUpload(file, opt.id, true);
      const saved = item
        ? await createMediaMessage(isImage ? "image" : "video", item.url, senderRef.current, SESSION_ID, {
            width: item.w, height: item.h, durationMs: item.d, reply,
          })
        : null;
      settle(opt.id, saved);
      if (!saved) setError("Couldn't send that. Check your connection and try again.");
    } finally {
      setBusy(opt.id, false);
      URL.revokeObjectURL(localUrl);
    }
  }, [sendFile]); // eslint-disable-line react-hooks/exhaustive-deps

  /** 2+ photos/videos → ONE grouped message (fanned stack + swipe viewer). */
  const sendGroup = useCallback(async (files: File[], reply: ReplyDraft | null) => {
    const media = files.filter((f) => (f.type.startsWith("image/") || f.type.startsWith("video/")) && f.size <= 500 * 1024 * 1024);
    if (media.length === 0) return;
    if (media.length === 1) return sendMedia(media[0], reply);
    const localUrls = media.map((f) => URL.createObjectURL(f));
    const opt = base("image", reply, {
      mediaUrl: localUrls[0],
      albumItems: media.map((f, i) => ({ url: localUrls[i], kind: f.type.startsWith("video/") ? "video" : "image" })),
    });
    addOptimistic(opt);
    setBusy(opt.id, true);
    const total = media.length;
    let done = 0;
    setProgress((p) => ({ ...p, [opt.id]: { done, total } }));
    const results: (AlbumItem | null)[] = new Array(total).fill(null);
    let cursor = 0;
    const worker = async () => {
      for (;;) {
        const i = cursor++;
        if (i >= total) return;
        try {
          results[i] = await prepareAndUpload(media[i], opt.id, false);
        } catch {
          results[i] = null;
        }
        done += 1;
        setProgress((p) => ({ ...p, [opt.id]: { done, total } }));
      }
    };
    await Promise.all(Array.from({ length: Math.min(3, total) }, worker));
    const items = results.filter((r): r is AlbumItem => !!r);
    const saved = items.length ? await createAlbumMessage(items, senderRef.current, SESSION_ID, reply) : null;
    settle(opt.id, saved);
    if (!saved) setError("Couldn't send the photos. Check your connection and try again.");
    else if (items.length < total) setError(`${total - items.length} of ${total} items couldn't be uploaded and were skipped.`);
    setBusy(opt.id, false);
    setProgress((p) => { const n = { ...p }; delete n[opt.id]; return n; });
    localUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [sendMedia]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendVoice = useCallback(async (blob: Blob, durationMs: number, reply: ReplyDraft | null) => {
    const localUrl = URL.createObjectURL(blob);
    const opt = base("voice", reply, { mediaUrl: localUrl, durationMs });
    addOptimistic(opt);
    setBusy(opt.id, true);
    try {
      const url = await uploadChatMedia(blob, "voice", senderRef.current);
      const saved = url ? await createMediaMessage("voice", url, senderRef.current, SESSION_ID, { durationMs, reply }) : null;
      settle(opt.id, saved);
      if (!saved) setError("Couldn't send the voice message. Please try again.");
    } finally {
      setBusy(opt.id, false);
      URL.revokeObjectURL(localUrl);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const edit = useCallback(async (id: string, text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text: t, edited: true } : m)));
    const saved = await editMessage(id, t, SESSION_ID);
    if (!saved) setError("Couldn't save the edit.");
  }, []);

  const unsend = useCallback(async (msg: ChatMessage) => {
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    const ok = await deleteMessage(msg.id, SESSION_ID, msg.mediaUrl ?? null, msg.albumItems?.map((it) => it.url) ?? null);
    if (!ok) {
      const fresh = await listMessages();
      if (fresh) setMessages((prev) => reconcile(prev, fresh));
      setError("Couldn't unsend that message.");
    }
  }, []);

  // Device id → persona, so legacy reactions (stored as device ids) resolve.
  const sessionToSender = useMemo(() => {
    const counts: Record<string, { faizan: number; habiba: number }> = {};
    for (const m of messages) {
      const sid = m.sessionId;
      if (!sid) continue;
      counts[sid] ??= { faizan: 0, habiba: 0 };
      counts[sid][m.sender]++;
    }
    const map: Record<string, Sender> = {};
    for (const [sid, c] of Object.entries(counts)) map[sid] = c.faizan > c.habiba ? "faizan" : "habiba";
    return map;
  }, [messages]);

  const reactorOf = useCallback(
    (key: string): Sender | null => {
      if (key === "faizan" || key === "habiba") return key;
      if (key === SESSION_ID) return senderRef.current;
      return sessionToSender[key] ?? null;
    },
    [sessionToSender, senderRef],
  );

  /** Toggle one emoji for me. Several different emoji per person are allowed. */
  const react = useCallback(
    async (msg: ChatMessage, emoji: string, mode: "toggle" | "add" = "toggle"): Promise<"added" | "removed" | "limit" | "noop"> => {
      const me = senderRef.current;
      const live = messagesRef.current.find((m) => m.id === msg.id) ?? msg;
      const current: ReactionsMap = live.reactions ?? {};
      const mineIn = (users: string[]) => users.filter((u) => reactorOf(u) === me);
      const has = mineIn(current[emoji] ?? []).length > 0;
      if (has && mode === "add") return "noop";
      const add = !has;
      if (add) {
        const distinct = Object.values(current).filter((u) => mineIn(u).length > 0).length;
        if (distinct >= MAX_REACTIONS_PER_PERSON) return "limit";
      }
      const mine = Array.from(new Set([me, SESSION_ID, ...mineIn(current[emoji] ?? [])]));
      const users = new Set(current[emoji] ?? []);
      mine.forEach((k) => users.delete(k));
      if (add) users.add(me);
      const next: ReactionsMap = { ...current };
      if (users.size === 0) delete next[emoji];
      else next[emoji] = Array.from(users);
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, reactions: next } : m)));
      if (!msg.id.startsWith("opt-")) {
        const saved = await setMyReaction(msg.id, emoji, mine, me, add);
        if (saved) setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, reactions: saved } : m)));
      }
      return add ? "added" : "removed";
    },
    [reactorOf, senderRef],
  );

  return {
    messages,
    messagesRef,
    loading,
    hasMoreOlder,
    loadingOlder,
    loadOlder,
    detached,
    loadNewer,
    jumpAround,
    returnToLatest,
    findTimestamp,
    uploading,
    progress,
    compressing,
    error,
    setError,
    otherTyping,
    sendText,
    sendSticker,
    sendDrawing,
    sendFile,
    sendMedia,
    sendGroup,
    sendVoice,
    edit,
    unsend,
    react,
    reactorOf,
  };
}

export type ChatEngine = ReturnType<typeof useChatEngine>;
