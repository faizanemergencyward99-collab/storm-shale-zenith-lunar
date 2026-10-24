// ─────────────────────────────────────────────────────────────────────────────
// NowPlayingBar — the mini music player docked directly under the chat header.
//
// Layout contract:
//   • Rendered INSIDE the floating header as a full-width second row, so the
//     header's own glass background covers it and its height is included in
//     --hb-hdr-h (published by chat-overlay's ResizeObserver). The message
//     list pads itself by that var and compensates scrollTop on the change,
//     so bubbles never hide under the bar and never jump when it appears.
//   • Renders null when no song is selected → header is exactly as before.
//
// Performance contract:
//   • Subscribes to the music store BY ITSELF and is memo()'d, so play/pause
//     or track changes re-render ONLY this bar — never the chat.
//   • Progress is painted straight onto the DOM from the <audio> "timeupdate"
//     event (~4×/s) via refs — zero React state updates per tick.
// ─────────────────────────────────────────────────────────────────────────────

import { memo, useEffect, useRef, useSyncExternalStore } from "react";
import type { PointerEvent as ReactPointerEvent, CSSProperties } from "react";
import { musicStore, fmtTime } from "@/site/lib/music.ts";
import { haptics } from "@/site/lib/haptics.ts";

const NowPlayingBar = memo(function NowPlayingBar({
  onOpen,
}: {
  onOpen: () => void;
}) {
  const st = useSyncExternalStore(musicStore.subscribe, musicStore.getSnapshot);
  const song = st.index >= 0 ? st.songs[st.index] : null;
  const hasSong = !!song;

  const fillRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const curRef = useRef<HTMLSpanElement>(null);
  const durRef = useRef<HTMLSpanElement>(null);

  // Paint progress straight onto the DOM — zero React state per tick.
  useEffect(() => {
    if (!hasSong) return;
    const a = musicStore.audioEl();
    const paint = () => {
      const d = a.duration;
      const p = Number.isFinite(d) && d > 0 ? a.currentTime / d : 0;
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`;
      if (curRef.current) curRef.current.textContent = fmtTime(a.currentTime);
      if (durRef.current) durRef.current.textContent = Number.isFinite(d) && d > 0 ? fmtTime(d) : "–:––";
    };
    paint();
    a.addEventListener("timeupdate", paint);
    a.addEventListener("loadedmetadata", paint);
    a.addEventListener("durationchange", paint);
    a.addEventListener("seeked", paint);
    a.addEventListener("emptied", paint);
    return () => {
      a.removeEventListener("timeupdate", paint);
      a.removeEventListener("loadedmetadata", paint);
      a.removeEventListener("durationchange", paint);
      a.removeEventListener("seeked", paint);
      a.removeEventListener("emptied", paint);
    };
  }, [hasSong, st.index]);

  if (!song) return null;

  const seekFromPointer = (e: ReactPointerEvent) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const a = musicStore.audioEl();
    if (Number.isFinite(a.duration) && a.duration > 0) {
      musicStore.seek(frac * a.duration);
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${frac})`;
    }
  };

  const iconBtn: CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 999,
    border: "1px solid var(--hdr-btn-border)",
    background: "var(--hdr-btn-bg)",
    color: "var(--hdr-fg)",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
    WebkitTapHighlightColor: "transparent",
    boxShadow: "var(--hdr-btn-shadow)",
  };

  return (
    <div
      data-testid="now-playing-dock"
      className="hb-now-playing-bar"
      role="button"
      tabIndex={0}
      aria-label={`Now playing: ${song.title}. Open music page`}
      title="Open music"
      onClick={() => {
        haptics.light();
        onOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      style={{
        // Full-width second row of the header (flex-wrap: wrap on the header).
        flexBasis: "100%",
        width: "100%",
        order: 99,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 8px 6px 8px",
        borderRadius: 14,
        cursor: "pointer",
        color: "var(--hdr-fg)",
        background: "var(--hdr-btn-bg)",
        border: "1px solid var(--hdr-btn-border)",
        boxShadow: "var(--hdr-btn-shadow)",
        WebkitTapHighlightColor: "transparent",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* Art / equalizer */}
      <div
        aria-hidden
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          flexShrink: 0,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 2.5,
          padding: "0 0 8px",
          background: "linear-gradient(135deg, #ff8fab 0%, #ff4d7a 55%, #c9184a 100%)",
          boxShadow: "0 4px 12px -4px rgba(201,24,74,0.55), inset 0 1px 0 rgba(255,255,255,0.35)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="hb-eq-bar"
            data-playing={st.playing && !st.buffering ? "" : undefined}
            style={{
              width: 3,
              height: 12,
              borderRadius: 2,
              background: "rgba(255,255,255,0.95)",
              transformOrigin: "bottom",
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>

      {/* Title + progress */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
          <span
            data-testid="now-playing-title"
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.01em",
              lineHeight: 1.15,
            }}
          >
            {song.title}
          </span>
          <span
            style={{
              flexShrink: 0,
              fontSize: 10.5,
              fontWeight: 600,
              opacity: 0.7,
              letterSpacing: "0.03em",
              fontVariantNumeric: "tabular-nums",
              fontFamily: "'Cormorant Garamond', serif",
            }}
          >
            {st.buffering ? (
              <span data-testid="now-playing-buffering">loading…</span>
            ) : (
              <>
                <span ref={curRef}>0:00</span>
                <span style={{ opacity: 0.6 }}> / </span>
                <span ref={durRef}>–:––</span>
              </>
            )}
          </span>
        </div>
        {/* Progress track (tap to seek) */}
        <div
          ref={trackRef}
          data-testid="now-playing-progress"
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={100}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => {
            e.stopPropagation();
            seekFromPointer(e);
          }}
          style={{
            position: "relative",
            height: 10, // generous hit area
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            touchAction: "none",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 3,
              borderRadius: 999,
              overflow: "hidden",
              background: "color-mix(in srgb, var(--hdr-fg) 18%, transparent)",
            }}
          >
            <div
              ref={fillRef}
              data-testid="now-playing-fill"
              style={{
                position: "absolute",
                inset: 0,
                transformOrigin: "left center",
                transform: "scaleX(0)",
                background: "linear-gradient(90deg, #ff6b9d, #c9184a)",
                borderRadius: 999,
                willChange: "transform",
              }}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <button
        type="button"
        data-testid="now-playing-toggle"
        aria-label={st.playing ? "Pause music" : "Play music"}
        title={st.playing ? "Pause" : "Play"}
        onClick={(e) => {
          e.stopPropagation(); // don't open the music page
          haptics.light();
          musicStore.toggle();
        }}
        style={{
          ...iconBtn,
          width: 34,
          height: 34,
          background: "linear-gradient(135deg, #ff6b9d, #c9184a)",
          border: "none",
          color: "#fff",
          fontSize: 12,
        }}
      >
        {st.playing ? "❚❚" : <span style={{ marginLeft: 2 }}>▶</span>}
      </button>
      <button
        type="button"
        data-testid="now-playing-next"
        aria-label="Next song"
        title="Next"
        onClick={(e) => {
          e.stopPropagation();
          haptics.light();
          musicStore.next();
        }}
        style={{ ...iconBtn, fontSize: 13 }}
      >
        ⏭
      </button>
    </div>
  );
});

export default NowPlayingBar;
