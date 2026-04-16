"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import BestGeneralVoteModal, {
  type GeneralOption,
  type VoteResult,
} from "./BestGeneralVoteModal";
import type { Game } from "@/lib/types";

interface Props {
  game: Game;
  generals: GeneralOption[];
  placeholderTop5: string[];
  placeholderThreshold?: number;
}

const DEFAULT_THRESHOLD = 100; // lowered from 300 per voting redesign

const ORDINAL_KEY = ["first", "second", "third"] as const;
const MEDAL = ["🥇", "🥈", "🥉"] as const;

function displayName(g: GeneralOption, locale: string): string {
  return locale === "fr" ? g.name : g.nameEn || g.name;
}

export default function BestGeneralVote({
  game,
  generals,
  placeholderTop5,
  placeholderThreshold = DEFAULT_THRESHOLD,
}: Props) {
  const t = useTranslations("bestGeneralVote");
  const tOrd = useTranslations("leaderboardsPage.ordinal");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const locale =
    typeof document !== "undefined" ? document.documentElement.lang || "fr" : "fr";

  const generalBySlug = useMemo(() => {
    const map = new Map<string, GeneralOption>();
    for (const g of generals) map.set(g.slug, g);
    return map;
  }, [generals]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/vote/best-general?game=${game}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setCounts(data.counts || {});
        setTotal(data.total || 0);
        setHasVoted(Boolean(data.hasVoted));
        setDisabled(Boolean(data.disabled));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setDisabled(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [game]);

  const showPlaceholder = total < placeholderThreshold;

  const rankedReal = useMemo(() => {
    return Object.entries(counts)
      .filter(([slug]) => generalBySlug.has(slug))
      .map(([slug, votes]) => ({ slug, votes, general: generalBySlug.get(slug)! }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5);
  }, [counts, generalBySlug]);

  const placeholderResolved = useMemo(
    () =>
      placeholderTop5
        .map((slug) => generalBySlug.get(slug))
        .filter((g): g is GeneralOption => Boolean(g))
        .map((g) => ({ slug: g.slug, votes: 0, general: g })),
    [placeholderTop5, generalBySlug]
  );

  const ranked = showPlaceholder ? placeholderResolved : rankedReal;

  const handleVoted = (r: VoteResult) => {
    setCounts(r.counts);
    setTotal(r.total);
    setHasVoted(true);
    setModalOpen(false);
  };

  return (
    <div
      id="best-general-vote"
      className="scroll-mt-20 border rounded-lg p-5 bg-panel"
      style={{ borderColor: "rgba(212,164,74,0.35)" }}
    >
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-gold2 text-lg font-extrabold uppercase tracking-wide">
            {t("heading")}
          </h3>
          <p className="text-dim text-sm mt-1 max-w-2xl">{t("tagline")}</p>
        </div>
        {!disabled && !hasVoted && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-gold text-[#0a0e13] text-sm font-extrabold uppercase tracking-widest hover:bg-gold2 transition-colors shrink-0"
          >
            {t("voteCta")}
          </button>
        )}
        {hasVoted && (
          <div className="min-h-[44px] flex items-center text-xs text-gold2 px-4 py-2 border border-gold/30 rounded-lg bg-gold/5 shrink-0">
            {t("thanksVoted")}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-3 items-end">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${i === 1 ? "h-44" : i === 0 ? "h-40" : "h-36"} rounded bg-border/30 animate-pulse`}
            />
          ))}
        </div>
      ) : (
        <>
          {/* Podium: ranks 1-3 with new layout — portrait → name → medal+ordinal → vote count */}
          <div className="grid grid-cols-3 gap-3 mb-3 items-end">
            {[1, 2, 0].map((visualIdx) => {
              const entry = ranked[visualIdx];
              if (!entry) return <div key={visualIdx} className="h-40" />;
              const medal = MEDAL[visualIdx];
              const ordinalKey = ORDINAL_KEY[visualIdx];
              const height =
                visualIdx === 0 ? "h-48" : visualIdx === 1 ? "h-44" : "h-40";
              const imgSize = visualIdx === 0 ? "w-20 h-20" : "w-16 h-16";
              const imgSizeAttr = visualIdx === 0 ? "80px" : "64px";
              const ringStyle =
                visualIdx === 0
                  ? {
                      boxShadow:
                        "0 0 0 2px rgba(212,164,74,0.9), 0 0 18px rgba(212,164,74,0.35)",
                    }
                  : visualIdx === 1
                  ? { boxShadow: "0 0 0 2px rgba(203,213,225,0.7)" }
                  : { boxShadow: "0 0 0 2px rgba(180,120,60,0.7)" };
              const displayLabel = displayName(entry.general, locale);
              return (
                <div
                  key={entry.slug}
                  className={`${height} rounded-lg border border-border bg-bg3 px-2 py-3 flex flex-col items-center justify-between text-center gap-1`}
                  style={
                    visualIdx === 0
                      ? {
                          borderColor: "rgba(212,164,74,0.6)",
                          background: "rgba(212,164,74,0.1)",
                        }
                      : undefined
                  }
                >
                  {/* Portrait — no more medal overlay */}
                  <div
                    className={`relative ${imgSize} rounded-full overflow-hidden bg-bg2`}
                    style={ringStyle}
                  >
                    {entry.general.portrait ? (
                      <Image
                        src={entry.general.portrait}
                        alt={displayLabel}
                        fill
                        sizes={imgSizeAttr}
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  {/* Name */}
                  <div className="text-gold2 font-bold text-xs leading-tight line-clamp-2 w-full">
                    {displayLabel}
                  </div>
                  {/* Medal + ordinal (moved from overlay) */}
                  <div className="text-[11px] leading-none flex items-center gap-1">
                    <span aria-hidden="true">{medal}</span>
                    <span className="text-gold2 font-bold uppercase tracking-widest">
                      {tOrd(ordinalKey)}
                    </span>
                  </div>
                  {/* Vote count */}
                  <div className="text-muted text-[10px] tabular-nums">
                    {showPlaceholder
                      ? t("placeholderBadge")
                      : t("voteCount", { count: entry.votes })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ranks 4-5 unchanged */}
          {ranked.length > 3 && (
            <ul className="space-y-1.5 mb-3">
              {ranked.slice(3, 5).map((entry, i) => {
                const label = displayName(entry.general, locale);
                return (
                  <li
                    key={entry.slug}
                    className="flex items-center gap-2.5 text-sm border border-border rounded px-3 py-1.5 bg-bg3"
                  >
                    <span className="text-muted text-xs font-bold w-6 text-center tabular-nums shrink-0">
                      #{i + 4}
                    </span>
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-bg2 border border-gold/30 shrink-0">
                      {entry.general.portrait ? (
                        <Image
                          src={entry.general.portrait}
                          alt={label}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <span className="flex-1 text-ink truncate">{label}</span>
                    <span className="text-muted text-[10px] tabular-nums">
                      {showPlaceholder
                        ? t("placeholderBadge")
                        : t("voteCount", { count: entry.votes })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="text-muted text-[11px] text-center">
            {showPlaceholder
              ? t("placeholderFooter", { threshold: placeholderThreshold, total })
              : t("totalVotes", { total })}
          </div>
        </>
      )}

      {disabled && (
        <div className="text-muted text-[11px] italic text-center mt-3">
          {t("notActiveYet")}
        </div>
      )}

      <BestGeneralVoteModal
        game={game}
        generals={generals}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onVoted={handleVoted}
      />
    </div>
  );
}
