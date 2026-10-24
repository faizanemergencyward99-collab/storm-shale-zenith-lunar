// Instagram composer: camera · "Message..." · mic / gallery / sticker / "+",
// swapping to a blue "Send" while typing. Hold the mic to record (slide left
// to cancel, slide up to lock hands-free).
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { haptics } from "@/site/lib/haptics.ts";
import type { ReplySnapshot } from "@/site/lib/cloud-chat.ts";
import { IconCamera, IconChevronUp, IconClose, IconGallery, IconLock, IconMic, IconPlus, IconSend, IconSmile, IconSticker, IconTrash } from "./icons.tsx";
import EmojiKeyboard from "./emoji-keyboard.tsx";
import { quoteText } from "./message-row.tsx";
import type { useRecorder } from "./use-recorder.ts";
import { firstName, fmtDuration } from "./util.ts";

type Recorder = ReturnType<typeof useRecorder>;

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  reply: ReplySnapshot | null;
  replyIsMine: boolean;
  onCancelReply: () => void;
  error: string | null;
  onDismissError: () => void;
  onCamera: () => void;
  onGallery: () => void;
  onSticker: () => void;
  onPlus: () => void;
  plusOpen: boolean;
  recorder: Recorder;
  onVoice: (blob: Blob, durationMs: number) => void;
  onHint: (msg: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onFocus: () => void;
}

function LiveWave({ recorder }: { recorder: Recorder }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = c.clientWidth, h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const levels: number[] = [];
    const buf = new Uint8Array(256);
    let raf = 0;
    let frame = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (timeRef.current) timeRef.current.textContent = fmtDuration(Date.now() - recorder.startTsRef.current);
      if (frame++ % 2) return;
      const a = recorder.analyserRef.current;
      let lvl = 0.05;
      if (a) {
        a.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        lvl = Math.min(1, Math.sqrt(sum / buf.length) * 4 + 0.05);
      }
      levels.push(lvl);
      const max = Math.floor(w / 4);
      if (levels.length > max) levels.shift();
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#f5f5f5";
      for (let i = 0; i < levels.length; i++) {
        const bh = Math.max(3, levels[i] * h);
        const x = w - (levels.length - i) * 4;
        ctx.beginPath();
        ctx.roundRect?.(x, (h - bh) / 2, 2.5, bh, 1.5);
        if (!ctx.roundRect) ctx.rect(x, (h - bh) / 2, 2.5, bh);
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [recorder]);
  return (
    <>
      <span className="ig-rec-dot" aria-hidden />
      <span className="ig-rec-time" ref={timeRef} data-testid="rec-timer">0:00</span>
      <canvas className="ig-rec-wave" ref={canvasRef} />
    </>
  );
}

/** Laptops/desktops only: phones already have emoji on their own keyboard. */
const IS_DESKTOP = typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export default function Composer(p: Props) {
  const hasText = p.value.trim().length > 0;
  const { recorder } = p;
  const [holding, setHolding] = useState(false);
  const [locked, setLocked] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const hold = useRef({ x: 0, y: 0, active: false });
  const slideRef = useRef<HTMLDivElement>(null);
  const micRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const ta = p.textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(120, ta.scrollHeight)}px`;
  }, [p.value, p.textareaRef]);

  const finish = useCallback(async () => {
    hold.current.active = false;
    setHolding(false);
    setLocked(false);
    const clip = await recorder.stop();
    if (clip) { haptics.light(); p.onVoice(clip.blob, clip.durationMs); }
    else p.onHint("Hold the mic to record, release to send.");
  }, [recorder, p]);

  const cancel = useCallback(() => {
    hold.current.active = false;
    setHolding(false);
    setLocked(false);
    recorder.cancel();
    haptics.medium();
  }, [recorder]);

  /** Drop an emoji in at the caret (desktop emoji keyboard). */
  const insertEmoji = (emoji: string) => {
    const ta = p.textareaRef.current;
    const at = ta ? ta.selectionStart ?? p.value.length : p.value.length;
    const end = ta ? ta.selectionEnd ?? at : at;
    p.onChange(p.value.slice(0, at) + emoji + p.value.slice(end));
    requestAnimationFrame(() => {
      if (!ta) return;
      ta.focus();
      const caret = at + emoji.length;
      ta.setSelectionRange(caret, caret);
    });
  };

  const onMicDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (locked) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
    hold.current = { x: e.clientX, y: e.clientY, active: true };
    setHolding(true);
    haptics.medium();
    void recorder.start();
  };
  const onMicMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const h = hold.current;
    if (!h.active || locked) return;
    const dx = Math.min(0, e.clientX - h.x);
    const dy = Math.min(0, e.clientY - h.y);
    if (slideRef.current) slideRef.current.style.transform = `translate3d(${dx * 0.6}px,0,0)`;
    if (micRef.current) micRef.current.style.setProperty("--mic-x", `${dx * 0.35}px`);
    if (dx < -110) cancel();
    else if (dy < -70) { setLocked(true); h.active = false; haptics.medium(); if (micRef.current) micRef.current.style.setProperty("--mic-x", "0px"); }
  };
  const onMicUp = () => {
    if (micRef.current) micRef.current.style.setProperty("--mic-x", "0px");
    if (hold.current.active && !locked) void finish();
  };

  const recUi = holding || locked;

  return (
    <div className="ig-composer" data-testid="chat-composer">
      <AnimatePresence initial={false}>
        {p.error && (
          <motion.div key="err" className="ig-composer-error" data-testid="chat-error-banner" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            <span>{p.error}</span>
            <button type="button" onClick={p.onDismissError} aria-label="Dismiss"><IconClose size={16} /></button>
          </motion.div>
        )}
        {p.reply && !recUi && (
          <motion.div
            key="reply"
            className="ig-reply-bar"
            data-testid="reply-preview"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ type: "spring", stiffness: 520, damping: 38 }}
          >
            <span className="ig-reply-text">
              <b>Replying to {p.replyIsMine ? "yourself" : firstName(p.reply.sender)}</b>
              <span>{quoteText(p.reply)}</span>
            </span>
            <button type="button" onClick={p.onCancelReply} aria-label="Cancel reply" data-testid="reply-cancel"><IconClose size={18} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="ig-bar" data-recording={recUi ? "" : undefined}>
        {recUi ? (
          <div className="ig-rec">
            {locked && (
              <motion.button whileTap={{ scale: 0.86 }} type="button" className="ig-rec-trash" onClick={cancel} aria-label="Delete recording" data-testid="rec-cancel">
                <IconTrash size={20} />
              </motion.button>
            )}
            <LiveWave recorder={recorder} />
            {!locked && (
              <div className="ig-rec-slide" ref={slideRef}>‹ Slide to cancel</div>
            )}
          </div>
        ) : (
          <>
            <motion.button whileTap={{ scale: 0.86 }} type="button" className="ig-cam" onClick={p.onCamera} aria-label="Camera" data-testid="composer-camera">
              <IconCamera size={22} />
            </motion.button>
            <textarea
              ref={p.textareaRef}
              className="ig-input"
              rows={1}
              value={p.value}
              placeholder="Message..."
              onChange={(e) => p.onChange(e.target.value)}
              onFocus={p.onFocus}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) {
                  e.preventDefault();
                  p.onSend();
                }
              }}
              data-testid="chat-input"
            />
          </>
        )}

        <div className="ig-bar-right">
          {IS_DESKTOP && !recUi && (
            <motion.button
              whileTap={{ scale: 0.86 }}
              type="button"
              className="ig-icon-btn ig-emoji-btn"
              data-on={emojiOpen ? "" : undefined}
              onClick={() => { haptics.light(); setEmojiOpen((v) => !v); }}
              aria-label="Emoji keyboard"
              data-testid="composer-emoji-btn"
            >
              <IconSmile size={24} />
            </motion.button>
          )}
          {!hasText && (
            <button
              ref={micRef}
              type="button"
              className="ig-icon-btn ig-mic"
              data-holding={holding && !locked ? "" : undefined}
              data-locked={locked ? "" : undefined}
              onPointerDown={onMicDown}
              onPointerMove={onMicMove}
              onPointerUp={onMicUp}
              onPointerCancel={onMicUp}
              onClick={() => { if (locked) void finish(); }}
              onContextMenu={(e) => e.preventDefault()}
              aria-label={locked ? "Send voice message" : "Hold to record a voice message"}
              data-testid="composer-mic"
            >
              <span className="ig-mic-bg" aria-hidden />
              <span className="ig-mic-icon">{locked ? <IconSend size={20} /> : <IconMic size={24} />}</span>
            </button>
          )}
          <AnimatePresence initial={false} mode="popLayout">
            {hasText ? (
              <motion.button
                key="send"
                type="button"
                className="ig-send"
                onPointerDown={(e) => e.preventDefault()}
                onClick={p.onSend}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 600, damping: 32 }}
                data-testid="composer-send"
              >
                Send
              </motion.button>
            ) : !recUi ? (
              <motion.div
                key="icons"
                className="ig-bar-icons"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 600, damping: 34 }}
              >
                <motion.button whileTap={{ scale: 0.82 }} type="button" className="ig-icon-btn" onClick={p.onGallery} aria-label="Gallery" data-testid="composer-gallery">
                  <IconGallery size={24} />
                </motion.button>
                <motion.button whileTap={{ scale: 0.82 }} type="button" className="ig-icon-btn" onClick={p.onSticker} aria-label="Stickers and GIFs" data-testid="chat-sticker-btn">
                  <IconSticker size={24} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.82 }}
                  animate={{ rotate: p.plusOpen ? 45 : 0 }}
                  type="button"
                  className="ig-icon-btn"
                  onClick={p.onPlus}
                  aria-label="More options"
                  data-testid="composer-plus"
                >
                  <IconPlus size={24} />
                </motion.button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {emojiOpen && IS_DESKTOP && (
          <EmojiKeyboard key="emoji-kb" onPick={insertEmoji} onClose={() => setEmojiOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {holding && !locked && (
          <motion.div
            key="lock"
            className="ig-lock-hint"
            initial={{ opacity: 0, y: 16, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            aria-hidden
          >
            <IconLock size={18} />
            <span className="ig-lock-chev"><IconChevronUp size={16} /></span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
