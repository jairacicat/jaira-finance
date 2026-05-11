// Minimal inline SVG icon set — keeps bundle small, no extra dep.
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

const base: P = {
  fill: 'none',
  viewBox: '0 0 24 24',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

export const Home = (p: P) => (
  <svg {...base} {...p}><path d="M3 11l9-8 9 8" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-6h6v6" /></svg>
);
export const Plus = (p: P) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const Wallet = (p: P) => (
  <svg {...base} {...p}><path d="M3 7h15a3 3 0 013 3v7a3 3 0 01-3 3H6a3 3 0 01-3-3V7z" /><path d="M16 13h2" /><path d="M3 7c0-2 1-3 3-3h12" /></svg>
);
export const Tag = (p: P) => (
  <svg {...base} {...p}><path d="M20 12L12 4H4v8l8 8 8-8z" /><circle cx="8.5" cy="8.5" r="1.5" /></svg>
);
export const Repeat = (p: P) => (
  <svg {...base} {...p}><path d="M17 2l4 4-4 4" /><path d="M3 12V8a4 4 0 014-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 12v4a4 4 0 01-4 4H3" /></svg>
);
export const Target = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></svg>
);
export const BarChart3 = (p: P) => (
  <svg {...base} {...p}><path d="M3 21h18" /><path d="M7 17V9" /><path d="M12 17V5" /><path d="M17 17v-6" /></svg>
);
export const Settings = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></svg>
);
export const RefreshCw = (p: P) => (
  <svg {...base} {...p}><path d="M21 12a9 9 0 11-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>
);
export const Trash = (p: P) => (
  <svg {...base} {...p}><path d="M3 6h18" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
);
export const Pencil = (p: P) => (
  <svg {...base} {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
);
export const ArrowLeft = (p: P) => (
  <svg {...base} {...p}><path d="M19 12H5" /><path d="M12 5l-7 7 7 7" /></svg>
);
export const ArrowRight = (p: P) => (
  <svg {...base} {...p}><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
);
export const ArrowUp = (p: P) => (
  <svg {...base} {...p}><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></svg>
);
export const ArrowDown = (p: P) => (
  <svg {...base} {...p}><path d="M12 5v14" /><path d="M19 12l-7 7-7-7" /></svg>
);
export const X = (p: P) => (
  <svg {...base} {...p}><path d="M18 6L6 18M6 6l12 12" /></svg>
);
export const Check = (p: P) => (
  <svg {...base} {...p}><path d="M20 6L9 17l-5-5" /></svg>
);
export const ExternalLink = (p: P) => (
  <svg {...base} {...p}><path d="M14 3h7v7" /><path d="M21 3l-9 9" /><path d="M5 5h6" /><path d="M5 5v14h14v-6" /></svg>
);
