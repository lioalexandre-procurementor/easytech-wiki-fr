import type { Category } from "@/lib/types";

interface Props {
  category: Category;
  country?: string;
  size?: number;
}

const PALETTE: Partial<Record<Category, { fg: string; bg1: string; bg2: string }>> = {
  tank:      { fg: "#d4a44a", bg1: "#3a4a2c", bg2: "#1c2530" },
  infantry:  { fg: "#9bb19f", bg1: "#2c4a35", bg2: "#1a2a20" },
  artillery: { fg: "#c8372d", bg1: "#4a2c2c", bg2: "#2a1c1c" },
  navy:      { fg: "#5d8ec5", bg1: "#1c3550", bg2: "#0f1f30" },
  airforce:  { fg: "#a8b4c5", bg1: "#3a4555", bg2: "#1c2535" },
};

const SHAPES: Partial<Record<Category, (fg: string) => JSX.Element>> = {
  tank: (fg) => (
    <g fill={fg} stroke={fg} strokeWidth="2">
      <rect x="14" y="42" width="52" height="14" rx="2"/>
      <rect x="20" y="32" width="40" height="14" rx="3"/>
      <rect x="38" y="22" width="32" height="6" rx="1"/>
      <circle cx="22" cy="58" r="5"/>
      <circle cx="34" cy="58" r="5"/>
      <circle cx="46" cy="58" r="5"/>
      <circle cx="58" cy="58" r="5"/>
    </g>
  ),
  infantry: (fg) => (
    <g fill={fg}>
      <circle cx="40" cy="22" r="8"/>
      <rect x="32" y="32" width="16" height="22" rx="2"/>
      <rect x="20" y="36" width="14" height="6" rx="2" transform="rotate(-15 27 39)"/>
      <rect x="46" y="36" width="14" height="6" rx="2" transform="rotate(15 53 39)"/>
      <rect x="32" y="54" width="6" height="14"/>
      <rect x="42" y="54" width="6" height="14"/>
    </g>
  ),
  artillery: (fg) => (
    <g fill={fg} stroke={fg} strokeWidth="2">
      <rect x="12" y="50" width="56" height="10" rx="2"/>
      <rect x="22" y="36" width="32" height="14" rx="2"/>
      <rect x="38" y="14" width="32" height="6" rx="1" transform="rotate(-25 54 17)"/>
      <circle cx="22" cy="62" r="5"/>
      <circle cx="58" cy="62" r="5"/>
    </g>
  ),
  navy: (fg) => (
    <g fill={fg} stroke={fg} strokeWidth="2">
      <path d="M8 56 L16 44 L64 44 L72 56 Z"/>
      <rect x="28" y="28" width="24" height="16" rx="1"/>
      <rect x="36" y="14" width="6" height="14"/>
      <rect x="20" y="32" width="6" height="6"/>
      <rect x="54" y="32" width="6" height="6"/>
    </g>
  ),
  airforce: (fg) => (
    <g fill={fg} stroke={fg} strokeWidth="2">
      <path d="M40 14 L46 36 L70 40 L46 44 L42 64 L38 44 L14 40 L36 36 Z"/>
    </g>
  ),
};

export function UnitIcon({ category, country, size = 80 }: Props) {
  const p = PALETTE[category] ?? { fg: "#999", bg1: "#333", bg2: "#222" };
  const shape = SHAPES[category];
  const id = `g-${category}`;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className="block">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={p.bg1}/>
          <stop offset="100%" stopColor={p.bg2}/>
        </linearGradient>
      </defs>
      <rect width="80" height="80" rx="8" fill={`url(#${id})`}/>
      <rect x="0.5" y="0.5" width="79" height="79" rx="7.5" fill="none" stroke={p.fg} strokeOpacity="0.4"/>
      {shape?.(p.fg)}
      {country && (
        <text x="6" y="74" fontSize="9" fontWeight="800" fill={p.fg} fontFamily="sans-serif" letterSpacing="1">
          {country}
        </text>
      )}
    </svg>
  );
}
