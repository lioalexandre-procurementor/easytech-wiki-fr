"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { generalsHubPath } from "@/lib/games";
import UnitVoteModal, {
  type UnitVoteCandidate,
  type UnitVoteResult,
} from "./UnitVoteModal";
import type { Game } from "@/lib/types";

type VoteApiResponse = {
  counts: Record<string, number>;
  total: number;
  hasVoted: boolean;
  disabled?: boolean;
  error?: string;
};

export type Candidate = UnitVoteCandidate;

type Props = {
  game: Game;
  unitSlug: string;
  unitDisplayName: string;
  candidates: Candidate[];
  /** When total votes < threshold, the widget shows an editorial-pick slot
   *  plus two locked placeholders instead of a live leaderboard.
   *  Default: 50. Pass `0` to always show results. */
  threshold?: number;
  /** Slug of the editorial pick general — shown in slot 1 even before
   *  the threshold is reached so the widget is never fully empty. */
  editorialSlug?: string;
  /** Elite unit sprite image — displayed at the leading edge of the block. */
  unitImage?: string | null;
};

/**
 * LABELS — 3-locale strings for the on-page podium + CTA.
 * The modal body lives in `UnitVoteModal` and owns its own labels.
 */
const LABELS: Record<
  string,
  {
    heading: string;
    placeholder: (threshold: number) => string;
    progressTo: (current: number, threshold: number) => string;
    ourPick: string;
    voteToReveal: string;
    voteCta: string;
    thanks: string;
    totalVotes: (n: number) => string;
    openProfile: string;
  }
> = {
  fr: {
    heading: "🏆 Meilleur général selon la communauté",
    placeholder: (n) =>
      `Pas encore assez de votes. La recommandation communautaire s'affiche à partir de ${n} votes.`,
    progressTo: (c, n) => `${c} / ${n} votes`,
    ourPick: "Notre suggestion",
    voteToReveal: "Votez pour révéler",
    voteCta: "🗳 Voter pour votre général",
    thanks: "✓ Merci — votre vote est enregistré (valide 30 jours)",
    totalVotes: (n) => (n === 1 ? "1 vote au total" : `${n} votes au total`),
    openProfile: "Voir le profil",
  },
  en: {
    heading: "🏆 Community's top-pick general",
    placeholder: (n) =>
      `Not enough votes yet. The community pick shows up once ${n} votes are cast.`,
    progressTo: (c, n) => `${c} / ${n} votes`,
    ourPick: "Our pick",
    voteToReveal: "Vote to reveal",
    voteCta: "🗳 Vote for your general",
    thanks: "✓ Thanks — your vote is counted (valid 30 days)",
    totalVotes: (n) => (n === 1 ? "1 total vote" : `${n} total votes`),
    openProfile: "View profile",
  },
  de: {
    heading: "🏆 Community-Favorit",
    placeholder: (n) =>
      `Noch nicht genug Stimmen. Die Community-Empfehlung erscheint ab ${n} Stimmen.`,
    progressTo: (c, n) => `${c} / ${n} Stimmen`,
    ourPick: "Unser Tipp",
    voteToReveal: "Abstimmen zum Enthüllen",
    voteCta: "🗳 Für deinen General abstimmen",
    thanks: "✓ Danke — deine Stimme wurde gezählt (30 Tage gültig)",
    totalVotes: (n) =>
      n === 1 ? "1 Stimme insgesamt" : `${n} Stimmen insgesamt`,
    openProfile: "Profil öffnen",
  },
};

const RANK_COLOR: Record<string, string> = {
  S: "bg-red-500/20 border-red-500/40 text-red-300",
  A: "bg-gold/20 border-gold/40 text-gold2",
  B: "bg-blue-500/15 border-blue-500/40 text-blue-300",
  C: "bg-border text-dim",
};

/** Eye icon — opens general profile in new tab. */
function EyeLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      className="text-muted hover:text-gold2 transition-colors shrink-0 no-underline"
      onClick={(e) => e.stopPropagation()}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-3.5 h-3.5"
      >
        <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        <path
          fillRule="evenodd"
          d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
          clipRule="evenodd"
        />
      </svg>
    </a>
  );
}

export default function UnitBestGeneralVote({
  game,
  unitSlug,
  unitDisplayName,
  candidates,
  threshold = 50,
  editorialSlug,
  unitImage,
}: Props) {
  const locale = useLocale();
  const L = LABELS[locale] ?? LABELS.en;
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [prefillSlug, setPrefillSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(
      `/api/vote/unit-general?game=${game}&unit=${encodeURIComponent(unitSlug)}`,
      { cache: "no-store" }
    )
      .then((r) => r.json() as Promise<VoteApiResponse>)
      .then((d) => {
        if (cancelled) return;
        setCounts(d.counts || {});
        setTotal(d.total || 0);
        setHasVoted(Boolean(d.hasVoted));
        setDisabled(Boolean(d.disabled));
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
  }, [game, unitSlug]);

  const handleVoted = (r: UnitVoteResult) => {
    setCounts(r.counts);
    setTotal(r.total);
    setHasVoted(true);
    setModalOpen(false);
  };

  const openVote = (slug?: string) => {
    if (hasVoted) return;
    setPrefillSlug(slug ?? null);
    setModalOpen(true);
  };

  if (disabled) {
    return null;
  }

  const displayName = (c: Candidate) =>
    locale === "fr" ? c.name : c.nameEn || c.name;
  const ranked = candidates
    .map((c) => ({ ...c, votes: counts[c.slug] || 0 }))
    .sort((a, b) => b.votes - a.votes);
  const top = ranked.slice(0, 3);
  const belowThreshold = total < threshold;
  const editorial = editorialSlug
    ? candidates.find((c) => c.slug === editorialSlug)
    : null;

  return (
    <div className="mt-4 border border-gold/40 rounded-lg p-4 bg-gradient-to-br from-gold/10 to-transparent">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h5 className="text-gold2 font-extrabold uppercase tracking-widest text-xs md:text-sm">
          {L.heading}
        </h5>
        <span className="text-muted text-[10px] uppercase tracking-widest">
          {L.totalVotes(total)}
        </span>
      </div>

      {/* Body: unit image + general slots side by side */}
      <div className="flex gap-3 items-start">
        {/* Unit sprite — fixed 72×72 column. Uses plain <img> (not next/image)
            so the browser fetches the local /public path immediately without
            the optimisation pipeline that can silently skip rendering in
            client components. onError hides the element if the file is absent. */}
        {unitImage && (
          <div className="w-[72px] h-[72px] shrink-0 rounded-lg overflow-hidden bg-bg2/60 border border-border/50 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={unitImage}
              alt={unitDisplayName}
              width={72}
              height={72}
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        {/* General slots — 3 cards at 75% scale */}
        <div className="flex-1 min-w-0" style={{ fontSize: "0.75em" }}>
          {loading ? (
            <div className="grid grid-cols-3 gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-border/40 animate-pulse" />
              ))}
            </div>
          ) : belowThreshold ? (
            /* 3-card placeholder — card 1 editorial pick, cards 2–3 locked */
            <div className="space-y-1.5">
              <div className="grid grid-cols-3 gap-1.5">
                {/* Card 1 — editorial pick or locked gold slot */}
                {editorial ? (
                  <button
                    type="button"
                    disabled={hasVoted}
                    onClick={() => openVote(editorial.slug)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg border border-gold/40 bg-gold/5 hover:bg-gold/10 transition-colors text-center disabled:cursor-default"
                  >
                    <span aria-hidden="true" className="text-lg leading-none">🥇</span>
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-bg2 border border-gold/40 shrink-0">
                      {editorial.portrait ? (
                        <Image src={editorial.portrait} alt="" fill sizes="40px" className="object-cover" />
                      ) : null}
                    </div>
                    <span className="text-gold2 font-semibold leading-tight line-clamp-2 w-full">
                      {displayName(editorial)}
                    </span>
                    <div className="flex items-center gap-1 flex-wrap justify-center">
                      {editorial.rank && (
                        <span className={`font-extrabold uppercase px-1 py-0.5 rounded border ${RANK_COLOR[editorial.rank] ?? RANK_COLOR.C}`} style={{ fontSize: "0.75em" }}>
                          {editorial.rank}
                        </span>
                      )}
                      <EyeLink
                        href={`/${locale}${generalsHubPath(game)}/${editorial.slug}`}
                        label={L.openProfile}
                      />
                    </div>
                    <span className="text-gold font-bold uppercase tracking-widest" style={{ fontSize: "0.7em" }}>{L.ourPick}</span>
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-1 p-2 rounded-lg border border-dashed border-border opacity-50 text-center">
                    <span aria-hidden="true" className="text-lg leading-none">🥇</span>
                    <div className="w-10 h-10 rounded-full bg-border/60" />
                    <span className="text-muted italic leading-tight">{L.voteToReveal}</span>
                  </div>
                )}
                {/* Cards 2 & 3 — always locked */}
                {(["🥈", "🥉"] as const).map((medal, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-lg border border-dashed border-border opacity-35 text-center">
                    <span aria-hidden="true" className="text-lg leading-none">{medal}</span>
                    <div className="w-10 h-10 rounded-full bg-border/60" />
                    <span className="text-muted italic leading-tight">{L.voteToReveal}</span>
                  </div>
                ))}
              </div>
              {/* Progress bar */}
              <div className="flex items-center gap-1.5 text-muted pt-1 border-t border-border/40">
                <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-red-500 transition-all"
                    style={{ width: `${Math.min(100, (total / threshold) * 100)}%` }}
                  />
                </div>
                <span className="tabular-nums whitespace-nowrap" style={{ fontSize: "0.85em" }}>
                  {L.progressTo(total, threshold)}
                </span>
              </div>
            </div>
          ) : (
            /* Results — 3 cards with portrait + eye icon + votes */
            <ol className="grid grid-cols-3 gap-1.5 list-none p-0 m-0">
              {top.map((c, i) => {
                const pct = total > 0 ? Math.round((c.votes / total) * 100) : 0;
                const medal = ["🥇", "🥈", "🥉"][i];
                const profileHref = `/${locale}${generalsHubPath(game)}/${c.slug}`;
                return (
                  <li key={c.slug} className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border bg-bg3/60 text-center">
                    <span aria-hidden="true" className="text-lg leading-none">{medal}</span>
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-bg2 border border-gold/20 shrink-0">
                      {c.portrait ? (
                        <Image src={c.portrait} alt="" fill sizes="40px" className="object-cover" />
                      ) : null}
                    </div>
                    <a href={profileHref} className="text-gold2 hover:underline leading-tight line-clamp-2 no-underline w-full">
                      {displayName(c)}
                    </a>
                    <div className="flex items-center gap-1 flex-wrap justify-center">
                      {c.rank && (
                        <span className={`font-extrabold uppercase px-1 py-0.5 rounded border ${RANK_COLOR[c.rank] ?? RANK_COLOR.C}`} style={{ fontSize: "0.75em" }}>
                          {c.rank}
                        </span>
                      )}
                      <EyeLink href={profileHref} label={L.openProfile} />
                    </div>
                    <span className="text-gold2 font-bold tabular-nums">{c.votes}</span>
                    <span className="text-muted tabular-nums" style={{ fontSize: "0.85em" }}>({pct}%)</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      <div className="mt-3">
        {hasVoted ? (
          <div className="text-center text-xs text-gold2 py-2 border border-gold/30 rounded bg-gold/5">
            {L.thanks}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openVote()}
            className="w-full py-2.5 rounded-full border border-gold bg-gold/15 text-gold2 text-xs md:text-sm font-extrabold uppercase tracking-widest hover:bg-gold/25 hover:shadow-[0_2px_8px_rgba(212,164,74,0.3)] transition-all"
          >
            {L.voteCta}
          </button>
        )}
      </div>

      <UnitVoteModal
        game={game}
        unitSlug={unitSlug}
        unitDisplayName={unitDisplayName}
        candidates={candidates}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onVoted={handleVoted}
        prefillGeneralSlug={prefillSlug}
        initialCounts={counts}
        initialTotal={total}
        initialHasVoted={hasVoted}
      />
    </div>
  );
}
