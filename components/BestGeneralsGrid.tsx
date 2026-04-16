"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import BestGeneralVoteModal, {
  type GeneralOption,
  type VoteResult,
} from "./BestGeneralVoteModal";
import { pickPlaceholderSlugs } from "@/lib/editorial-picks";
import type { Game } from "@/lib/types";

interface Props {
  game: Game;
  generals: GeneralOption[];
  threshold: number;
  initialCounts: Record<string, number>;
  initialTotal: number;
}

const ORDINAL_KEYS = ["first", "second", "third"] as const;
const MEDAL = ["🥇", "🥈", "🥉"] as const;

function displayName(g: GeneralOption, locale: string): string {
  return locale === "fr" ? g.name : g.nameEn || g.name;
}

type Tile = {
  rank: number;                 // 1..10
  slug: string;
  general: GeneralOption;
  votes: number;
  isPlaceholder: boolean;
};

function buildTiles(
  game: Game,
  generals: GeneralOption[],
  counts: Record<string, number>,
  total: number,
  threshold: number
): Tile[] {
  const bySlug = new Map(generals.map((g) => [g.slug, g]));
  const below = total < threshold;

  if (below) {
    // All 10 tiles come from the placeholder list.
    const placeholders = pickPlaceholderSlugs(game, new Set(), 10);
    const tiles: Tile[] = [];
    placeholders.forEach((slug, i) => {
      const g = bySlug.get(slug);
      if (!g) return;
      tiles.push({
        rank: i + 1,
        slug,
        general: g,
        votes: 0,
        isPlaceholder: true,
      });
    });
    return tiles;
  }

  // Above threshold: ranks 1–8 from real votes.
  const realSorted = Object.entries(counts)
    .filter(([slug]) => bySlug.has(slug))
    .map(([slug, votes]) => ({ slug, votes, general: bySlug.get(slug)! }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 8);

  const realSlugs = new Set(realSorted.map((r) => r.slug));
  const placeholderSlugs = pickPlaceholderSlugs(game, realSlugs, 2);

  const tiles: Tile[] = realSorted.map((r, i) => ({
    rank: i + 1,
    slug: r.slug,
    general: r.general,
    votes: r.votes,
    isPlaceholder: false,
  }));

  placeholderSlugs.forEach((slug) => {
    const g = bySlug.get(slug);
    if (!g) return;
    tiles.push({
      rank: tiles.length + 1,
      slug,
      general: g,
      votes: 0,
      isPlaceholder: true,
    });
  });

  return tiles;
}

export default function BestGeneralsGrid({
  game,
  generals,
  threshold,
  initialCounts,
  initialTotal,
}: Props) {
  const t = useTranslations("leaderboardsPage");
  const tOrd = useTranslations("leaderboardsPage.ordinal");
  const tVote = useTranslations("bestGeneralVote");

  const [counts, setCounts] = useState(initialCounts);
  const [total, setTotal] = useState(initialTotal);
  const [hasVoted, setHasVoted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [prefillSlug, setPrefillSlug] = useState<string | null>(null);

  const locale =
    typeof document !== "undefined" ? document.documentElement.lang || "fr" : "fr";

  // Refresh hasVoted + counts on mount (SSR doesn't have cookie view).
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/vote/best-general?game=${game}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setHasVoted(Boolean(data.hasVoted));
        if (data.counts) setCounts(data.counts);
        if (typeof data.total === "number") setTotal(data.total);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [game]);

  const tiles = useMemo(
    () => buildTiles(game, generals, counts, total, threshold),
    [game, generals, counts, total, threshold]
  );

  const openFor = (slug: string | null) => {
    if (hasVoted) return;
    setPrefillSlug(slug);
    setModalOpen(true);
  };

  const handleVoted = (r: VoteResult) => {
    setCounts(r.counts);
    setTotal(r.total);
    setHasVoted(true);
    setModalOpen(false);
  };

  const belowThreshold = total < threshold;

  return (
    <div>
      {/* Summary + vote-for-another button */}
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div className="text-muted text-xs uppercase tracking-widest">
          {t("totalVotes", { total })}
        </div>
        {!hasVoted ? (
          <button
            type="button"
            onClick={() => openFor(null)}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-gold text-[#0a0e13] text-sm font-extrabold uppercase tracking-widest hover:bg-gold2 transition-colors shrink-0"
          >
            {t("voteForAnother")}
          </button>
        ) : (
          <div className="min-h-[44px] flex items-center text-xs text-gold2 px-4 py-2 border border-gold/30 rounded-lg bg-gold/5 shrink-0">
            {tVote("thanksVoted")}
          </div>
        )}
      </div>

      {/* 10-tile grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
        {tiles.map((tile) => {
          const isTop3 = tile.rank <= 3;
          const medal = isTop3 ? MEDAL[tile.rank - 1] : null;
          const ordinal = isTop3 ? tOrd(ORDINAL_KEYS[tile.rank - 1]) : null;
          const imgSize = tile.rank === 1 ? "w-20 h-20" : "w-16 h-16";
          const imgSizeAttr = tile.rank === 1 ? "80px" : "64px";
          const ring =
            tile.rank === 1
              ? {
                  boxShadow:
                    "0 0 0 2px rgba(212,164,74,0.9), 0 0 18px rgba(212,164,74,0.35)",
                }
              : tile.rank === 2
              ? { boxShadow: "0 0 0 2px rgba(203,213,225,0.7)" }
              : tile.rank === 3
              ? { boxShadow: "0 0 0 2px rgba(180,120,60,0.7)" }
              : undefined;
          const label = displayName(tile.general, locale);
          const ariaLabel = tile.isPlaceholder
            ? t("tileAriaPlaceholder", { name: label })
            : t("tileAria", { name: label });
          return (
            <button
              key={`${tile.slug}-${tile.rank}`}
              type="button"
              disabled={hasVoted}
              aria-disabled={hasVoted}
              aria-label={ariaLabel}
              onClick={() => openFor(tile.slug)}
              title={hasVoted ? tVote("thanksVoted") : undefined}
              className={`min-h-[180px] rounded-lg px-2 py-3 flex flex-col items-center justify-between text-center gap-1 transition-colors ${
                tile.isPlaceholder
                  ? "border border-dashed border-gold/40 bg-bg3/40"
                  : "border border-border bg-bg3 hover:border-gold"
              } ${hasVoted ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:bg-gold/5"}`}
            >
              <div
                className={`relative ${imgSize} rounded-full overflow-hidden bg-bg2`}
                style={ring}
              >
                {tile.general.portrait ? (
                  <Image
                    src={tile.general.portrait}
                    alt=""
                    fill
                    sizes={imgSizeAttr}
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="text-gold2 font-bold text-xs leading-tight line-clamp-2 w-full">
                {label}
              </div>
              <div className="text-[11px] leading-none flex items-center gap-1">
                {medal && <span aria-hidden="true">{medal}</span>}
                <span className="text-gold2 font-bold uppercase tracking-widest">
                  {ordinal ?? `#${tile.rank}`}
                </span>
              </div>
              <div className="text-muted text-[10px] tabular-nums">
                {tile.isPlaceholder
                  ? t("placeholderBadge")
                  : t("voteCountShort", { count: tile.votes })}
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress hint when below threshold */}
      {belowThreshold && (
        <div className="text-muted text-[11px] text-center italic">
          {t("generalsGridHint", { threshold, total })}
        </div>
      )}

      <BestGeneralVoteModal
        game={game}
        generals={generals}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onVoted={handleVoted}
        prefillSlug={prefillSlug}
      />
    </div>
  );
}
