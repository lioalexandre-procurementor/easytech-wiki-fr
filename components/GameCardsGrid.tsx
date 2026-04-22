import { Link } from "@/src/i18n/navigation";

interface GameCardData {
  key: string;
  slug: string;
  name: string;
  era: string;
  sub: string;
  status: "live" | "soon";
}

const GAME_ACCENT: Record<
  string,
  { bg: string; chip: string }
> = {
  wc4: {
    bg: "linear-gradient(135deg,#8e3a2e 0%,#c8372d 100%)",
    chip: "#ffd7a8",
  },
  ew6: {
    bg: "linear-gradient(135deg,#2f5a8a 0%,#4382c9 100%)",
    chip: "#bcd2ef",
  },
  gcr: {
    bg: "linear-gradient(135deg,#6b4a15 0%,#c48a2a 100%)",
    chip: "#ffe2a8",
  },
  ew7: {
    bg: "linear-gradient(135deg,#2b3a40 0%,#3e5358 100%)",
    chip: "#b7c2ce",
  },
};

const GRID_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14'%3E%3Cpath d='M14 0H0V14' fill='none' stroke='white' stroke-width='0.6'/%3E%3C/svg%3E\")";

interface Props {
  games: GameCardData[];
  enterLabel: string;
  soonLabel: string;
}

export function GameCardsGrid({ games, enterLabel, soonLabel }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2.5 mb-6">
      {games.map((g) => {
        const accent = GAME_ACCENT[g.key] ?? GAME_ACCENT.ew7;
        const isSoon = g.status === "soon";

        const content = (
          <div
            className="relative overflow-hidden rounded-[10px] p-4 min-h-[140px] flex flex-col"
            style={{
              background: accent.bg,
              boxShadow: isSoon ? "none" : "var(--shadow-panel)",
              opacity: isSoon ? 0.55 : 1,
              cursor: isSoon ? "default" : "pointer",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: GRID_PATTERN,
                opacity: 0.12,
              }}
            />
            <div className="relative z-10 flex flex-col flex-1">
              <span
                className="text-[9px] font-extrabold uppercase tracking-[0.2em]"
                style={{ color: accent.chip, opacity: 0.9 }}
              >
                {g.era}
              </span>
              <span className="mt-1.5 text-[15px] font-extrabold text-white leading-tight">
                {g.name}
              </span>
              <span
                className="mt-1 text-[11px]"
                style={{ color: accent.chip }}
              >
                {g.sub}
              </span>
              <span className="mt-auto pt-4">
                {isSoon ? (
                  <span
                    className="inline-flex gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    {soonLabel}
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold text-white"
                    style={{ background: "rgba(255,255,255,0.16)" }}
                  >
                    {enterLabel} →
                  </span>
                )}
              </span>
            </div>
          </div>
        );

        if (isSoon) {
          return <div key={g.key}>{content}</div>;
        }

        return (
          <Link
            key={g.key}
            href={`/${g.slug}` as any}
            className="no-underline"
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}
