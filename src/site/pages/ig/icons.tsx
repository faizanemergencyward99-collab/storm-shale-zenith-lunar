// Thin line icons drawn in an Instagram-like style (original artwork).
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconBack = (p: P) => <Svg {...p}><path d="M15 4.5 7.5 12l7.5 7.5" /></Svg>;
export const IconChevronRight = (p: P) => <Svg {...p}><path d="m9 5 7 7-7 7" /></Svg>;
export const IconChevronUp = (p: P) => <Svg {...p}><path d="m5 15 7-7 7 7" /></Svg>;
export const IconChevronDown = (p: P) => <Svg {...p}><path d="m5 9 7 7 7-7" /></Svg>;
export const IconClose = (p: P) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const IconPhone = (p: P) => (
  <Svg {...p}>
    <path d="M5.2 3.5h3.1l1.6 4.2-2.1 1.4a11.5 11.5 0 0 0 7.1 7.1l1.4-2.1 4.2 1.6v3.1a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 3.2 5.7a2 2 0 0 1 2-2.2Z" />
  </Svg>
);
export const IconSearch = (p: P) => (
  <Svg {...p}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></Svg>
);
export const IconMusic = (p: P) => (
  <Svg {...p}>
    <path d="M9 18V5.5l11-2V16" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="17.5" cy="16" r="2.5" />
  </Svg>
);
export const IconCamera = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 8.5a2 2 0 0 1 2-2h2l1.6-2.2h5.8l1.6 2.2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
    <circle cx="12" cy="12.8" r="3.6" />
  </Svg>
);
export const IconMic = (p: P) => (
  <Svg {...p}>
    <rect x="8.5" y="2.8" width="7" height="12" rx="3.5" />
    <path d="M5 11.5a7 7 0 0 0 14 0M12 18.5v3" />
  </Svg>
);
export const IconGallery = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="4.5" />
    <circle cx="9" cy="9" r="1.6" />
    <path d="m3.5 17.5 5-5.2a1.5 1.5 0 0 1 2.2 0L15 17l2-2a1.5 1.5 0 0 1 2.1 0l1.6 1.6" />
  </Svg>
);
export const IconSticker = (p: P) => (
  <Svg {...p}>
    <path d="M20.5 12.5V8A4.5 4.5 0 0 0 16 3.5H8A4.5 4.5 0 0 0 3.5 8v8A4.5 4.5 0 0 0 8 20.5h4.5Z" />
    <path d="M12.5 20.5c0-4.4 3.6-8 8-8" />
    <path d="M8.5 9.5v.5M14.5 9.5v.5M8.5 14.2c.9.8 2 1.2 3.2 1.2" />
  </Svg>
);
export const IconSmile = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9.6v.6M15 9.6v.6" />
    <path d="M8.2 14.2a5 5 0 0 0 7.6 0" />
  </Svg>
);

export const IconPlus = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7.8v8.4M7.8 12h8.4" /></Svg>
);
export const IconReply = (p: P) => <Svg {...p}><path d="M10 6 4 12l6 6" /><path d="M4.5 12H14a6 6 0 0 1 6 6v1" /></Svg>;
export const IconCopy = (p: P) => (
  <Svg {...p}><rect x="8.5" y="8.5" width="12" height="12" rx="2.5" /><path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5" /></Svg>
);
export const IconEdit = (p: P) => (
  <Svg {...p}><path d="M14.5 5.5 18.5 9.5M4 20l1-4.6L15.6 4.8a2 2 0 0 1 2.8 0l.8.8a2 2 0 0 1 0 2.8L8.6 19 4 20Z" /></Svg>
);
export const IconUnsend = (p: P) => (
  <Svg {...p}><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" /></Svg>
);
export const IconMore = (p: P) => (
  <Svg {...p}><circle cx="5.5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="18.5" cy="12" r="1" fill="currentColor" /></Svg>
);
export const IconDownload = (p: P) => <Svg {...p}><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" /></Svg>;
export const IconGif = (p: P) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="3.5" /><path d="M10 10.2a2 2 0 1 0 0 3.6V12H9M13 9.5v5M16 14.5v-5h2.2M16 12h1.8" /></Svg>
);
export const IconPlay = (p: P) => (
  <svg width={p.size ?? 24} height={p.size ?? 24} viewBox="0 0 24 24" aria-hidden><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z" fill="currentColor" /></svg>
);
export const IconPause = (p: P) => (
  <svg width={p.size ?? 24} height={p.size ?? 24} viewBox="0 0 24 24" aria-hidden><rect x="6" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" /><rect x="14" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" /></svg>
);
export const IconSend = (p: P) => (
  <Svg {...p}><path d="M21 3 10.2 13.8M21 3l-6.8 18-4-7.2L3 9.8 21 3Z" /></Svg>
);
export const IconLock = (p: P) => (
  <Svg {...p}><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></Svg>
);
export const IconTrash = IconUnsend;
export const IconPalette = (p: P) => (
  <Svg {...p}>
    <path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Z" />
    <circle cx="7.5" cy="11.5" r="1" fill="currentColor" /><circle cx="10" cy="7.5" r="1" fill="currentColor" /><circle cx="15" cy="7.5" r="1" fill="currentColor" />
  </Svg>
);
export const IconAlarm = (p: P) => (
  <Svg {...p}><circle cx="12" cy="13" r="7.5" /><path d="M12 9.5V13l2.5 1.8M4 5l3-2.5M20 5l-3-2.5" /></Svg>
);
export const IconVideo = (p: P) => (
  <Svg {...p}><rect x="2.5" y="6" width="13.5" height="12" rx="3" /><path d="m16 10.5 5.5-3v9l-5.5-3" /></Svg>
);
export const IconFile = (p: P) => (
  <Svg {...p}><path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8Z" /><path d="M14 3.5V8h4.5" /></Svg>
);
export const IconHeart = (p: P) => (
  <Svg {...p}><path d="M12 20.5s-8.5-5-8.5-11A4.8 4.8 0 0 1 12 6.6a4.8 4.8 0 0 1 8.5 2.9c0 6-8.5 11-8.5 11Z" /></Svg>
);
export const IconLayers = (p: P) => (
  <Svg {...p}><rect x="7" y="3" width="14" height="14" rx="3" /><path d="M17 21H6a3 3 0 0 1-3-3V7" /></Svg>
);
export const IconUndo = (p: P) => (
  <Svg {...p}><path d="M4 9h11a5 5 0 0 1 0 10h-5" /><path d="m8 4.5-4 4.5 4 4.5" /></Svg>
);
export const IconBrush = (p: P) => (
  <Svg {...p}>
    <path d="M13.5 6.5 17.5 10.5" />
    <path d="M9.6 19.2c-1.3 1.3-4.6 1.9-5.6.9s-.4-4.3.9-5.6L15.6 3.8a2 2 0 0 1 2.8 0l1.8 1.8a2 2 0 0 1 0 2.8Z" />
  </Svg>
);
