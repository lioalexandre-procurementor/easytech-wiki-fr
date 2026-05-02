import Image from "next/image";
import { Link } from "@/src/i18n/navigation";

/**
 * Top-3 recommended-generals podium for the elite-unit page Strategy section.
 *
 * Visual: 3-column grid; 1st place is raised + gold-glow; rank crown 1/2/3.
 * Reuses the data the page already enriches via `matchedGenerals` — the
 * caller passes in name/displayName/rank/portrait/etc.
 *
 * WC4 hook: when `enableTrainingBadge` is true and a general has both
 * `hasTrainingPath` and a populated `trainedSkills` list, render a small
 * `⚔ Premium training` link directly on the podium card. EW6 and GCR pass
 * `enableTrainingBadge={false}` (their data has no training path at all).
 */

export type PodiumGeneral = {
  slug: string;
  name: string;
  displayName: string;
  rank: "S" | "A" | "B" | "C" | null;
  portrait?: string | null;
  initials?: string | null;
  hasTrainingPath?: boolean;
  hasTrainedSkills?: boolean;
};

export type PodiumLabels = {
  /** Header above the podium row, e.g. "🏆 Top voted generals". */
  topVoted: string;
  /** Top-right link, e.g. "View ranking →". */
  viewRanking: string;
  /** Optional short rank prefix, e.g. "Rank ". */
  rankPrefix: string;
  /** Linked when WC4 training path exists, e.g. "⚔ Premium training". */
  premiumTraining: string;
  votesSuffix: string;
};

const PODIUM_COLORS = ["#f2c265", "#c0c8d3", "#cd7f32"];

export function RecommendedGeneralsPodium({
  generals,
  voteCounts,
  game,
  enableTrainingBadge = false,
  leaderboardHref,
  generalHrefBuilder,
  premiumTrainingHrefBuilder,
  labels,
}: {
  generals: PodiumGeneral[];
  /** Optional vote counts per podium slot. Hidden when undefined. */
  voteCounts?: number[];
  game: "wc4" | "ew6" | "gcr";
  enableTrainingBadge?: boolean;
  leaderboardHref: string;
  generalHrefBuilder: (slug: string) => string;
  premiumTrainingHrefBuilder?: (slug: string) => string;
  labels: PodiumLabels;
}) {
  const top3 = generals.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3 pt-2">
        <h4 className="m-0 text-xs text-dim uppercase tracking-widest font-bold">
          {labels.topVoted}
        </h4>
        <Link
          href={leaderboardHref as never}
          className="text-[11px] text-gold2 no-underline font-bold tracking-wide hover:underline"
        >
          {labels.viewRanking} →
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2 md:gap-3 pt-3">
        {top3.map((g, i) => {
          const rank = i + 1;
          const c = PODIUM_COLORS[i] ?? "#9aa5b4";
          const isFirst = i === 0;
          const showTraining =
            enableTrainingBadge &&
            !!g.hasTrainingPath &&
            !!g.hasTrainedSkills &&
            !!premiumTrainingHrefBuilder;

          const initials =
            g.initials ??
            g.name
              .split(/\s+/)
              .map((s) => s[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase() ??
            "??";

          return (
            <div key={g.slug} className="relative">
              <Link
                href={generalHrefBuilder(g.slug) as never}
                className="block relative rounded-xl text-center no-underline border transition-all"
                style={{
                  background: isFirst
                    ? "linear-gradient(180deg, rgb(var(--c-gold2) / 0.10) 0%, rgb(var(--c-bg3)) 60%)"
                    : "rgb(var(--c-bg3))",
                  borderColor: isFirst
                    ? "rgb(var(--c-gold2) / 0.4)"
                    : "rgb(var(--c-border))",
                  padding: "10px 6px 12px",
                  transform: isFirst ? "translateY(-4px)" : "none",
                  boxShadow: isFirst ? "0 6px 14px rgb(var(--c-gold2) / 0.18)" : "none",
                }}
              >
                {/* Rank crown */}
                <div
                  className="absolute font-serif font-black grid place-items-center"
                  style={{
                    top: -10,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: c,
                    color: "rgb(var(--c-bg))",
                    fontSize: 12,
                    border: "2px solid rgb(var(--c-panel))",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                  }}
                  aria-hidden="true"
                >
                  {rank}
                </div>

                {/* Avatar */}
                <div
                  className="relative mx-auto rounded-full overflow-hidden"
                  style={{
                    width: 56,
                    height: 56,
                    margin: "6px auto",
                    background: "linear-gradient(135deg, rgb(var(--c-khaki)), rgb(var(--c-gold)))",
                    border: `2px solid ${isFirst ? "rgb(var(--c-gold2))" : "rgb(var(--c-border))"}`,
                    boxShadow: "inset 0 -8px 14px rgba(0,0,0,0.25)",
                  }}
                >
                  {g.portrait ? (
                    <Image
                      src={g.portrait}
                      alt={g.displayName}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full grid place-items-center font-serif font-black"
                      style={{
                        color: "rgb(var(--c-bg))",
                        fontSize: 18,
                      }}
                    >
                      {initials}
                    </div>
                  )}
                </div>

                <div className="text-[13px] text-gold2 font-extrabold mb-0.5 leading-tight px-1">
                  {g.displayName}
                </div>
                {g.rank && (
                  <div className="text-[9px] text-muted uppercase tracking-widest font-bold mb-1.5">
                    {labels.rankPrefix}
                    {g.rank}
                  </div>
                )}

                {voteCounts && voteCounts[i] !== undefined && (
                  <div className="text-[10px] text-dim flex items-center justify-center gap-1 pt-1.5 border-t border-border">
                    <span style={{ color: "rgb(var(--c-ok))" }}>▲</span>
                    {voteCounts[i]}{" "}
                    <span className="text-muted">{labels.votesSuffix}</span>
                  </div>
                )}
              </Link>

              {/* WC4-only training-path link */}
              {showTraining && premiumTrainingHrefBuilder && (
                <Link
                  href={premiumTrainingHrefBuilder(g.slug) as never}
                  className="mt-1.5 inline-flex w-full items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-bold no-underline border transition-colors"
                  style={{
                    color: "#ff8a80",
                    background: "rgb(var(--c-accent) / 0.10)",
                    borderColor: "rgb(var(--c-accent) / 0.4)",
                  }}
                  title={labels.premiumTraining}
                >
                  ⚔ {labels.premiumTraining}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
