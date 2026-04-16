"use client";

import Image from "next/image";
import { Link } from "@/src/i18n/navigation";
import { generalsHubPath, unitHubPath } from "@/lib/games";
import type { Game } from "@/lib/types";

/**
 * Minimal display-only shape for the three general boxes in a row.
 * The parent `UnitsByCategory` resolves names/portraits from its
 * `generalLookup` once and hands the row whatever it needs to render.
 */
export type GeneralBoxInfo = {
  slug: string;
  name: string;
  portrait: string | null;
};

export type UnitRowLabels = {
  /** e.g. "12 / 50 votes · notre choix affiché jusqu'au seuil" */
  progressBelow: (count: number, threshold: number) => string;
  /** e.g. "112 votes · classement communauté" */
  progressAbove: (count: number) => string;
  /** Vote CTA button label, e.g. "🗳 Voter" */
  voteCta: string;
  /** Slot-1 caption when below threshold. */
  ourPick: string;
  /** Slot-1 caption when at or above threshold. */
  communityPick: string;
  /** Slot-2/#3 dashed-box caption when empty. */
  voteToReveal: string;
  /** Row "thanks" pill, replacing the vote CTA after the visitor has
   *  voted on this unit. */
  thanksVoted: string;
  /** Aria-label for clicking a filled general box — "{name} — voter pour cette unité". */
  boxAria: (name: string) => string;
  /** Aria-label for a dashed empty box. */
  emptyBoxAria: string;
};

type Props = {
  game: Game;
  locale: string;
  unitSlug: string;
  unitDisplayName: string;
  unitCountryFlag: string;
  totalVotes: number;
  reachedThreshold: boolean;
  threshold: number;
  hasVoted: boolean;
  slot1: GeneralBoxInfo | null;
  slot2: GeneralBoxInfo | null;
  slot3: GeneralBoxInfo | null;
  onRequestVote: (prefillGeneralSlug: string | null) => void;
  labels: UnitRowLabels;
};

export default function UnitLeaderboardRow({
  game,
  locale,
  unitSlug,
  unitDisplayName,
  unitCountryFlag,
  totalVotes,
  reachedThreshold,
  threshold,
  hasVoted,
  slot1,
  slot2,
  slot3,
  onRequestVote,
  labels,
}: Props) {
  const unitHref = `${unitHubPath(game)}/${unitSlug}`;
  const slot1Caption = reachedThreshold ? labels.communityPick : labels.ourPick;
  const progress = reachedThreshold
    ? labels.progressAbove(totalVotes)
    : labels.progressBelow(totalVotes, threshold);

  return (
    <article className="bg-bg3 border border-border rounded-lg p-3 hover:border-gold/40 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-2">
        <Link
          href={unitHref as any}
          locale={locale as any}
          className="text-gold2 font-bold text-sm md:text-base hover:underline no-underline truncate"
        >
          {unitCountryFlag && <span className="mr-1">{unitCountryFlag}</span>}
          {unitDisplayName}
        </Link>
        {hasVoted ? (
          <span className="shrink-0 text-[10px] uppercase tracking-widest text-gold2 border border-gold/30 bg-gold/5 rounded-full px-2 py-1">
            {labels.thanksVoted}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onRequestVote(null)}
            className="shrink-0 inline-flex items-center gap-1 text-[10px] md:text-[11px] font-extrabold uppercase tracking-widest rounded-full border border-gold bg-gold/15 text-gold2 hover:bg-gold/25 px-3 py-1.5 transition-colors"
          >
            {labels.voteCta}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <GeneralBox
          rank={1}
          caption={slot1Caption}
          general={slot1}
          isEditorial={!reachedThreshold && slot1 !== null}
          onClick={(slug) => onRequestVote(slug)}
          disabled={hasVoted}
          aria={slot1 ? labels.boxAria(slot1.name) : labels.emptyBoxAria}
          game={game}
          locale={locale}
        />
        <GeneralBox
          rank={2}
          caption="#2"
          general={slot2}
          isEditorial={false}
          emptyLabel={labels.voteToReveal}
          onClick={(slug) => onRequestVote(slug)}
          disabled={hasVoted}
          aria={slot2 ? labels.boxAria(slot2.name) : labels.emptyBoxAria}
          game={game}
          locale={locale}
        />
        <GeneralBox
          rank={3}
          caption="#3"
          general={slot3}
          isEditorial={false}
          emptyLabel={labels.voteToReveal}
          onClick={(slug) => onRequestVote(slug)}
          disabled={hasVoted}
          aria={slot3 ? labels.boxAria(slot3.name) : labels.emptyBoxAria}
          game={game}
          locale={locale}
        />
      </div>

      <div className="mt-2 text-muted text-[10px] md:text-[11px] tabular-nums">
        {progress}
      </div>
    </article>
  );
}

function GeneralBox({
  rank,
  caption,
  general,
  isEditorial,
  emptyLabel,
  onClick,
  disabled,
  aria,
  game,
  locale,
}: {
  rank: 1 | 2 | 3;
  caption: string;
  general: GeneralBoxInfo | null;
  isEditorial: boolean;
  emptyLabel?: string;
  onClick: (slug: string | null) => void;
  disabled: boolean;
  aria: string;
  game: Game;
  locale: string;
}) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
  const filled = general !== null;

  const base =
    "relative min-h-[118px] w-full rounded-lg p-2 flex flex-col items-center justify-start gap-1 text-center transition-colors no-underline";
  const bg = filled
    ? "bg-bg2 border border-border hover:border-gold"
    : "bg-bg3/40 border border-dashed border-gold/30";
  // Post-vote: route filled boxes to the general's profile instead of
  // reopening the modal, while keeping the "not-allowed" cursor so the
  // user still sees the ballot is closed on this unit.
  const disabledCls = disabled ? "cursor-not-allowed opacity-80" : "cursor-pointer";
  const profileHref =
    filled ? `/${locale}${generalsHubPath(game)}/${general!.slug}` : null;

  const content = (
    <>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted leading-none">
        <span aria-hidden="true">{medal}</span>
        <span>{caption}</span>
      </div>
      <div className="relative w-14 h-14 rounded-full overflow-hidden bg-bg2 border border-gold/30">
        {filled && general!.portrait ? (
          <Image
            src={general!.portrait}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : null}
      </div>
      {filled ? (
        <div className="text-gold2 font-bold text-[11px] leading-tight line-clamp-2 w-full">
          {general!.name}
        </div>
      ) : (
        <div className="text-muted italic text-[10px] leading-tight line-clamp-2 w-full">
          {emptyLabel}
        </div>
      )}
      {isEditorial && filled && (
        <span className="absolute top-1 right-1 text-[8px] font-bold uppercase tracking-widest px-1 py-0.5 rounded bg-gold/20 text-gold2 border border-gold/40">
          ✦
        </span>
      )}
    </>
  );

  if (disabled && filled && profileHref) {
    return (
      <a
        href={profileHref}
        aria-label={aria}
        className={`${base} ${bg} ${disabledCls}`}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      aria-label={aria}
      disabled={disabled}
      onClick={() => (disabled ? undefined : onClick(filled ? general!.slug : null))}
      className={`${base} ${bg} ${disabledCls}`}
    >
      {content}
    </button>
  );
}
