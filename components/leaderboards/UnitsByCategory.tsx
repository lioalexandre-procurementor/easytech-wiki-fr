"use client";

import { useMemo, useState } from "react";
import UnitVoteModal, {
  type UnitVoteCandidate,
  type UnitVoteResult,
} from "@/components/UnitVoteModal";
import UnitLeaderboardRow, {
  type GeneralBoxInfo,
  type UnitRowLabels,
} from "./UnitLeaderboardRow";
import type { UnitsRanking } from "@/lib/leaderboards";
import type { Game, Category } from "@/lib/types";

/**
 * Entry the parent page passes for each candidate general — used to:
 *   1. Resolve a unit row's three display boxes (slot 1/2/3).
 *   2. Populate the shared vote modal's candidate list.
 *
 * Category-based eligibility filtering is applied server-side per row
 * (not here): the parent already provides eligible candidates per unit
 * via `eligibleByUnit`.
 */
export type GeneralDir = {
  slug: string;
  name: string;        // display name in the active locale
  nameEn?: string;
  portrait: string | null;
  rank: "S" | "A" | "B" | "C" | null;
  country: string | null;
  category: string;
};

export type CategoryMetaItem = {
  label: string;
  icon: string;
  plural: string;
};

export type UnitsByCategoryLabels = UnitRowLabels & {
  emptyCategory: string;
  sectionHeading: (icon: string, plural: string, count: number) => string;
};

type Props = {
  game: Game;
  locale: string;
  data: UnitsRanking;
  threshold: number;
  /** Ordered list of category slugs for this game — defines section order. */
  categoryOrder: Category[];
  /** Per-category metadata (icon + plural label). */
  categoryMeta: Record<string, CategoryMetaItem>;
  /** Lookup for resolving a general slug to display info (name/portrait). */
  generalsDir: Record<string, GeneralDir>;
  /** Map from unit slug → eligible candidate list for that unit. */
  eligibleByUnit: Record<string, UnitVoteCandidate[]>;
  /** Map from unit slug → editorial primary pick slug (or null). */
  editorialBySlug: Record<string, string | null>;
  /** Map from unit slug → country flag emoji (empty string = none). */
  flagBySlug: Record<string, string>;
  labels: UnitsByCategoryLabels;
};

type LiveRow = {
  totalVotes: number;
  reachedThreshold: boolean;
  topSlug: string | null;
  top2Slug: string | null;
  top3Slug: string | null;
  hasVoted: boolean;
};

export default function UnitsByCategory({
  game,
  locale,
  data,
  threshold,
  categoryOrder,
  categoryMeta,
  generalsDir,
  eligibleByUnit,
  editorialBySlug,
  flagBySlug,
  labels,
}: Props) {
  // Initialise per-row live state from the server-rendered ranking.
  const [liveByUnit, setLiveByUnit] = useState<Record<string, LiveRow>>(() => {
    const out: Record<string, LiveRow> = {};
    for (const r of data.rows) {
      out[r.unitSlug] = {
        totalVotes: r.totalVotes,
        reachedThreshold: r.reachedThreshold,
        topSlug: r.topGeneralSlug ?? null,
        top2Slug: r.top2GeneralSlug ?? null,
        top3Slug: r.top3GeneralSlug ?? null,
        hasVoted: false,
      };
    }
    return out;
  });

  // Modal state: which unit the modal is open for, plus an optional
  // general prefill when the user clicked a specific box.
  const [modalFor, setModalFor] = useState<
    | {
        unitSlug: string;
        unitDisplayName: string;
        prefillGeneralSlug: string | null;
      }
    | null
  >(null);

  const rowsByCategory = useMemo(() => {
    const map = new Map<string, UnitsRanking["rows"]>();
    for (const r of data.rows) {
      const list = map.get(r.unitCategory) ?? [];
      list.push(r);
      list.sort((a, b) =>
        (locale === "fr" ? a.unitName : a.unitNameEn || a.unitName).localeCompare(
          locale === "fr" ? b.unitName : b.unitNameEn || b.unitName
        )
      );
      map.set(r.unitCategory, list);
    }
    return map;
  }, [data.rows, locale]);

  const onRowVote = (
    unitSlug: string,
    unitDisplayName: string,
    prefillGeneralSlug: string | null
  ) => {
    if (liveByUnit[unitSlug]?.hasVoted) return;
    setModalFor({ unitSlug, unitDisplayName, prefillGeneralSlug });
  };

  const onVoted = (unitSlug: string) => (result: UnitVoteResult) => {
    const { counts, total } = result;
    const sorted = Object.entries(counts)
      .map(([slug, votes]) => ({ slug, votes }))
      .sort((a, b) => b.votes - a.votes);
    setLiveByUnit((prev) => ({
      ...prev,
      [unitSlug]: {
        totalVotes: total,
        reachedThreshold: total >= threshold,
        topSlug: sorted[0]?.slug ?? prev[unitSlug]?.topSlug ?? null,
        top2Slug: sorted[1]?.slug ?? null,
        top3Slug: sorted[2]?.slug ?? null,
        hasVoted: true,
      },
    }));
    setModalFor(null);
  };

  const lookupBox = (slug: string | null): GeneralBoxInfo | null => {
    if (!slug) return null;
    const g = generalsDir[slug];
    if (!g) return null;
    return {
      slug: g.slug,
      name: locale === "fr" ? g.name : g.nameEn || g.name,
      portrait: g.portrait,
    };
  };

  // Build the rendered sections. Categories with zero units are skipped.
  const sections = categoryOrder
    .map((cat) => {
      const rows = rowsByCategory.get(cat) ?? [];
      return { cat, rows };
    })
    .filter((s) => s.rows.length > 0);

  return (
    <div className="space-y-8">
      {sections.length === 0 ? (
        <p className="text-muted text-sm italic text-center py-10">
          {labels.emptyCategory}
        </p>
      ) : (
        sections.map(({ cat, rows }) => {
          const meta = categoryMeta[cat];
          const icon = meta?.icon ?? "";
          const plural = meta?.plural ?? cat;
          return (
            <section key={cat}>
              <h2 className="text-gold2 font-extrabold uppercase tracking-widest text-sm md:text-base mb-3 border-b border-border pb-2">
                {labels.sectionHeading(icon, plural, rows.length)}
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {rows.map((r) => {
                  const live = liveByUnit[r.unitSlug];
                  const reachedThreshold = live?.reachedThreshold ?? r.reachedThreshold;
                  const totalVotes = live?.totalVotes ?? r.totalVotes;

                  const slot1Slug = reachedThreshold
                    ? live?.topSlug ?? r.topGeneralSlug ?? null
                    : editorialBySlug[r.unitSlug] ?? null;
                  const slot2Slug = reachedThreshold
                    ? live?.top2Slug ?? r.top2GeneralSlug ?? null
                    : null;
                  const slot3Slug = reachedThreshold
                    ? live?.top3Slug ?? r.top3GeneralSlug ?? null
                    : null;

                  const unitName =
                    locale === "fr" ? r.unitName : r.unitNameEn || r.unitName;
                  const unitCountryFlag = flagBySlug[r.unitSlug] ?? "";

                  return (
                    <UnitLeaderboardRow
                      key={r.unitSlug}
                      game={game}
                      locale={locale}
                      unitSlug={r.unitSlug}
                      unitDisplayName={unitName}
                      unitCountryFlag={unitCountryFlag}
                      totalVotes={totalVotes}
                      reachedThreshold={reachedThreshold}
                      threshold={threshold}
                      hasVoted={Boolean(live?.hasVoted)}
                      slot1={lookupBox(slot1Slug)}
                      slot2={lookupBox(slot2Slug)}
                      slot3={lookupBox(slot3Slug)}
                      onRequestVote={(prefill) =>
                        onRowVote(r.unitSlug, unitName, prefill)
                      }
                      labels={labels}
                    />
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      {modalFor && (
        <UnitVoteModal
          game={game}
          unitSlug={modalFor.unitSlug}
          unitDisplayName={modalFor.unitDisplayName}
          candidates={eligibleByUnit[modalFor.unitSlug] ?? []}
          open={true}
          onClose={() => setModalFor(null)}
          onVoted={onVoted(modalFor.unitSlug)}
          prefillGeneralSlug={modalFor.prefillGeneralSlug}
        />
      )}
    </div>
  );
}
