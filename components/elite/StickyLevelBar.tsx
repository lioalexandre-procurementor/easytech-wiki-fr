"use client";

/**
 * Sticky level controller for the elite-unit page.
 *
 * Mobile (default):
 *   ┌─────────────────────────────────────────┐
 *   │  [−]   [ 12  Niveau / Maximum ]   [+]   │
 *   │  ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢                │  ← scrollable chip rail
 *   │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━           │  ← progress bar
 *   └─────────────────────────────────────────┘
 *
 * Desktop (lg:): same content, chips stretched full width with all 12 visible.
 *
 * Sticks below the global TopBar (top-0 z-50). Uses z-40 so the page TopBar
 * always wins. Scope of the sticky is whatever scroll parent contains it —
 * we render it inside the interactive block (below the hero), so the user
 * sees it the moment they scroll down to read stats/perks.
 */

const MILESTONES = [5, 9, 12];

export type LevelBarLabels = {
  level: string;
  prevAria: string;
  nextAria: string;
  hint: string;
  /** Returns the textual tier for the level (e.g. "Vétéran", "Maxed out"). */
  tierFor: (lvl: number) => string;
  levelAria: (lvl: number) => string;
};

export function StickyLevelBar({
  lvl,
  setLvl,
  labels,
}: {
  lvl: number;
  setLvl: (n: number) => void;
  labels: LevelBarLabels;
}) {
  const fillPct = ((lvl - 1) / 11) * 100;
  const isMilestone = MILESTONES.includes(lvl);

  return (
    <div
      className="sticky top-14 lg:top-[72px] z-30 -mx-3 md:-mx-5 mb-4 px-3 md:px-5 py-3 border-y border-border backdrop-blur-md"
      style={{
        background:
          "linear-gradient(to bottom, rgb(var(--c-panel) / 0.96), rgb(var(--c-bg-deep) / 0.94))",
      }}
    >
      <div className="flex items-center gap-2.5 lg:gap-4 mb-2.5">
        <button
          onClick={() => setLvl(Math.max(1, lvl - 1))}
          disabled={lvl <= 1}
          aria-label={labels.prevAria}
          className="grid place-items-center shrink-0 rounded-xl border border-border bg-bg3 text-2xl font-black text-gold2 disabled:text-muted disabled:cursor-not-allowed h-11 w-11 lg:h-10 lg:w-10 transition-colors enabled:hover:bg-bg2"
        >
          −
        </button>

        <div
          className="flex-1 flex items-center gap-3 rounded-xl px-3 lg:px-4 h-11 lg:h-10 border"
          style={{
            background:
              "linear-gradient(135deg, rgb(var(--c-gold) / 0.10), rgb(var(--c-accent) / 0.06))",
            borderColor: "rgb(var(--c-gold) / 0.3)",
          }}
        >
          <div
            className="font-serif font-black text-gold2 tabular-nums leading-none text-center"
            style={{ fontSize: 28, minWidth: 36 }}
          >
            {lvl}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-muted uppercase tracking-widest font-bold leading-none">
              {labels.level}
            </div>
            <div className="text-xs text-dim font-semibold truncate mt-0.5">
              {labels.tierFor(lvl)}{" "}
              {isMilestone && <span style={{ color: "rgb(var(--c-accent))" }}>⭐</span>}
            </div>
          </div>
        </div>

        <button
          onClick={() => setLvl(Math.min(12, lvl + 1))}
          disabled={lvl >= 12}
          aria-label={labels.nextAria}
          className="grid place-items-center shrink-0 rounded-xl border border-border bg-bg3 text-2xl font-black text-gold2 disabled:text-muted disabled:cursor-not-allowed h-11 w-11 lg:h-10 lg:w-10 transition-colors enabled:hover:bg-bg2"
        >
          +
        </button>
      </div>

      <div className="flex gap-1 lg:gap-2 overflow-x-auto lg:overflow-visible lg:justify-between hide-scroll">
        {Array.from({ length: 12 }, (_, i) => {
          const n = i + 1;
          const isCurr = n === lvl;
          const isMs = MILESTONES.includes(n);
          const reached = n <= lvl;
          return (
            <button
              key={n}
              onClick={() => setLvl(n)}
              aria-label={labels.levelAria(n)}
              aria-pressed={isCurr}
              className="relative shrink-0 rounded-lg text-sm font-extrabold tabular-nums cursor-pointer transition-transform"
              style={{
                width: 36,
                height: 36,
                border: isCurr
                  ? "2px solid rgb(var(--c-gold2))"
                  : isMs
                    ? "1.5px solid rgb(var(--c-accent))"
                    : "1px solid rgb(var(--c-border))",
                background: isCurr
                  ? "linear-gradient(135deg, rgb(var(--c-gold2)), rgb(var(--c-gold)))"
                  : reached
                    ? isMs
                      ? "rgb(var(--c-accent) / 0.18)"
                      : "rgb(var(--c-gold) / 0.10)"
                    : "rgb(var(--c-bg3))",
                color: isCurr
                  ? "rgb(var(--c-bg))"
                  : reached
                    ? isMs
                      ? "#ff8a80"
                      : "rgb(var(--c-gold2))"
                    : "rgb(var(--c-muted))",
                boxShadow: isCurr ? "0 0 0 3px rgb(var(--c-gold2) / 0.25)" : "none",
                transform: isCurr ? "scale(1.05)" : "scale(1)",
              }}
            >
              {n}
              {isMs && (
                <span
                  className="absolute text-[9px] leading-none"
                  style={{ top: -2, right: -2 }}
                  aria-hidden="true"
                >
                  ⭐
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="h-0.5 bg-bg3 rounded mt-2.5 overflow-hidden">
        <div
          className="h-full transition-[width] duration-200 ease-out"
          style={{
            width: `${fillPct}%`,
            background: "linear-gradient(90deg, rgb(var(--c-gold)), rgb(var(--c-gold2)))",
          }}
        />
      </div>

      <div className="hidden lg:block text-[11px] text-muted text-center mt-2">
        {labels.hint}
      </div>
    </div>
  );
}
