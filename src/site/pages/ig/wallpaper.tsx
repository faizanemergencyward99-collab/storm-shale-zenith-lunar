// Repeating sticker wallpaper (staggered rows, like Instagram's chat themes).
// Static and fixed behind the messages, so it costs nothing while scrolling.
import { memo, useEffect, useRef, useState } from "react";

function Wallpaper({ src, mini = false }: { src: string | null; mini?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  if (!src) return <div ref={ref} className="ig-wallpaper" aria-hidden />;
  const cell = box.w * 0.34;
  const rowH = box.w * 0.4;
  const rows = rowH > 0 ? Math.ceil(box.h / rowH) + 1 : 0;
  const tiles: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    const xs = r % 2 === 0 ? [0.08, 0.6] : [-0.2, 0.34, 0.88];
    xs.forEach((x) => tiles.push({ x: x * box.w, y: r * rowH - rowH * 0.25 }));
  }
  return (
    <div ref={ref} className="ig-wallpaper" data-mini={mini ? "" : undefined} aria-hidden>
      {tiles.map((t, i) => (
        <img key={i} src={src} alt="" decoding="async" draggable={false} style={{ width: cell, transform: `translate3d(${t.x}px, ${t.y}px, 0)` }} />
      ))}
    </div>
  );
}

export default memo(Wallpaper);
