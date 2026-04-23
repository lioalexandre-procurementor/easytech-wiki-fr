import type { AppliesTo } from "@/lib/types";

const COLORS: Record<AppliesTo, { fg: string; bg: string; label: string }> = {
  all:       { fg: "#d4a44a", bg: "#2c2620", label: "All units" },
  infantry:  { fg: "#9bb19f", bg: "#1d2a20", label: "Infantry" },
  tank:      { fg: "#d4a44a", bg: "#2a220f", label: "Tank" },
  artillery: { fg: "#c8372d", bg: "#2a1414", label: "Artillery" },
  navy:      { fg: "#5d8ec5", bg: "#0f1f30", label: "Navy" },
  airforce:  { fg: "#a8b4c5", bg: "#1c2535", label: "Air Force" },
};

const PATH: Record<AppliesTo, JSX.Element> = {
  all: (
    <g fill="currentColor">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="14" cy="6" r="2.5" />
      <circle cx="10" cy="13" r="2.5" />
    </g>
  ),
  infantry: (
    <g fill="currentColor">
      <circle cx="10" cy="5" r="2" />
      <rect x="8" y="8" width="4" height="6" rx="0.5" />
      <rect x="5" y="9" width="3" height="1.5" rx="0.5" transform="rotate(-20 6.5 9.75)" />
      <rect x="12" y="9" width="3" height="1.5" rx="0.5" transform="rotate(20 13.5 9.75)" />
      <rect x="8" y="14" width="1.5" height="4" />
      <rect x="10.5" y="14" width="1.5" height="4" />
    </g>
  ),
  tank: (
    <g fill="currentColor">
      <rect x="3" y="11" width="14" height="4" rx="0.5" />
      <rect x="5" y="8" width="10" height="4" rx="0.8" />
      <rect x="10" y="5" width="7" height="1.5" rx="0.4" />
      <circle cx="6" cy="15.5" r="1.3" />
      <circle cx="10" cy="15.5" r="1.3" />
      <circle cx="14" cy="15.5" r="1.3" />
    </g>
  ),
  artillery: (
    <g fill="currentColor">
      <rect x="3" y="13" width="14" height="2.5" rx="0.4" />
      <rect x="6" y="10" width="8" height="4" rx="0.5" />
      <rect x="10" y="4" width="8" height="1.5" rx="0.3" transform="rotate(-25 14 4.75)" />
      <circle cx="6" cy="16" r="1.2" />
      <circle cx="14" cy="16" r="1.2" />
    </g>
  ),
  navy: (
    <g fill="currentColor" stroke="currentColor" strokeWidth="0.5">
      <path d="M2 14 L4 11 L16 11 L18 14 Z" />
      <rect x="6" y="6" width="8" height="5" rx="0.5" />
      <rect x="9" y="3" width="2" height="3" />
    </g>
  ),
  airforce: (
    <g fill="currentColor">
      <path d="M10 3 L12 11 L18 13 L12 14 L11 17 L10 14 L9 17 L8 14 L2 13 L8 11 Z" />
    </g>
  ),
};

export function FormationScopeIcon({
  scope,
  size = 20,
  withLabel = false,
}: {
  scope: AppliesTo;
  size?: number;
  withLabel?: boolean;
}) {
  const color = COLORS[scope];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wide font-semibold"
      style={{ background: color.bg, color: color.fg }}
      title={color.label}
    >
      <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" style={{ color: color.fg }}>
        {PATH[scope]}
      </svg>
      {withLabel && <span>{color.label}</span>}
    </span>
  );
}
