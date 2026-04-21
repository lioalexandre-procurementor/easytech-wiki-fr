"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import ComparatorShell from "@/components/ComparatorShell";
import { ComparatorTable } from "@/components/ComparatorTable";
import { ComparatorRadar } from "@/components/ComparatorRadar";
import type { ComparableRow, SkillRating } from "@/lib/types";

type CompareMode = "unlock" | "maxed" | "trained";

export type CompareMeta = {
  headImage: string | null;
  skills: Array<{
    slot: number;
    name: string;     // EN canonical
    nameFr: string;   // FR native
    rating: SkillRating | null;
    replaceable: boolean;
    icon: string | null;
  }>;
};

interface Props {
  /**
   * Three pre-computed row sets, one per projection mode. The page component
   * does the heavy lifting (calling buildTrainedView / buildPremiumTrainingView)
   * server-side; this client just toggles which list it feeds to the shell.
   */
  rowsByMode: Record<CompareMode, ComparableRow[]>;
  /**
   * Per-mode portrait + skills metadata keyed by general slug. Not every slug
   * is present in every mode (trained mode only covers the 19 eligible
   * generals). The client looks up on demand from the currently-selected mode.
   */
  metaByMode?: Record<CompareMode, Record<string, CompareMeta>>;
  locale?: string;
  /** Subset of ids eligible for the `trained` mode (the 19 trainable generals). */
  trainedEligibleIds: string[];
  initialIds: string[];
  initialMode: CompareMode;
  tableLabels: Record<string, string>;
  radarLabels: Record<string, string>;
  statsHeading: string;
  radarHeading: string;
  skillsHeading?: string;
  slotLabel?: string;
  noSkillLabel?: string;
  modeLabels: Record<CompareMode, string>;
  modeHints: Record<CompareMode, string>;
}

export default function GeneralComparatorClient({
  rowsByMode,
  metaByMode,
  locale,
  trainedEligibleIds,
  initialIds,
  initialMode,
  tableLabels,
  radarLabels,
  statsHeading,
  radarHeading,
  skillsHeading,
  slotLabel,
  noSkillLabel,
  modeLabels,
  modeHints,
}: Props) {
  const [mode, setMode] = useState<CompareMode>(initialMode);
  const trainedEligible = useMemo(
    () => new Set(trainedEligibleIds),
    [trainedEligibleIds]
  );
  const activeRows = rowsByMode[mode];
  const activeMeta = metaByMode?.[mode] ?? {};
  const hasMeta = !!metaByMode;
  const effectiveLocale = locale ?? "en";

  /**
   * When a visitor switches into `trained` mode, some of the currently-picked
   * generals may not have a premium-training projection. Rather than silently
   * dropping them, surface the ones that would need to be re-picked so the
   * visitor understands why they disappeared from the comparison.
   */
  const ineligibleForTrained = useMemo(() => {
    if (mode !== "trained") return [] as string[];
    return initialIds.filter(
      (id) => id && !trainedEligible.has(id)
    );
  }, [initialIds, mode, trainedEligible]);

  return (
    <div className="space-y-5">
      {/* Mode tabs */}
      <nav
        role="tablist"
        aria-label="Compare mode"
        className="flex flex-wrap gap-1.5 md:gap-2"
      >
        {(["unlock", "maxed", "trained"] as CompareMode[]).map((m) => {
          const active = m === mode;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              role="tab"
              aria-selected={active}
              className={
                active
                  ? "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-gold/20 border border-gold text-gold2 font-bold text-xs md:text-sm uppercase tracking-widest"
                  : "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-border text-dim hover:text-gold2 hover:border-gold/40 hover:bg-gold/5 text-xs md:text-sm font-semibold uppercase tracking-widest transition-colors"
              }
            >
              {modeLabels[m]}
            </button>
          );
        })}
      </nav>

      {/* Mode hint */}
      <p className="text-muted text-xs md:text-sm italic">{modeHints[mode]}</p>

      {/* Heads-up when trained mode removed some picked generals */}
      {ineligibleForTrained.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3 text-xs md:text-sm text-amber-200">
          <strong className="font-bold">⚠</strong>{" "}
          {ineligibleForTrained.length === 1
            ? `${ineligibleForTrained[0]} `
            : `${ineligibleForTrained.join(", ")} `}
          — pas de projection d'entraînement premium disponible / no premium
          training projection available / kein Premium-Training-Profil verfügbar.
        </div>
      )}

      <ComparatorShell
        allRows={activeRows}
        initialIds={initialIds}
        // Force-remount on mode change so the shell's internal state
        // (selected ids) resets coherently when the underlying pool
        // changes — trained mode has fewer eligible generals.
        key={mode}
      >
        {(rows) => (
          <div className="space-y-5">
            {/* Portrait header — one image tile per selected general */}
            {hasMeta && (
            <section className="bg-panel border border-border rounded-lg p-4 md:p-6">
              <div
                className="grid gap-3 md:gap-4"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(rows.length, 1)}, minmax(0, 1fr))`,
                }}
              >
                {rows.map((r) => {
                  const meta = activeMeta[r.id];
                  const display = effectiveLocale === "fr" ? r.nameFr || r.name : r.name;
                  return (
                    <div
                      key={r.id}
                      className="flex flex-col items-center text-center gap-2"
                    >
                      <div
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden relative border"
                        style={{
                          borderColor: "#d4a44a",
                          background:
                            "linear-gradient(135deg, #8b7d4a, #d4a44a)",
                        }}
                      >
                        {meta?.headImage ? (
                          <Image
                            src={meta.headImage}
                            alt={display}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-2xl font-extrabold text-[#0f1419]">
                            {display
                              .split(" ")
                              .map((s) => s[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                        )}
                      </div>
                      <div className="text-gold2 font-bold text-sm md:text-base leading-tight">
                        {display}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            )}

            <section className="bg-panel border border-border rounded-lg p-4 md:p-6">
              <h2 className="text-gold2 font-bold uppercase tracking-widest text-base md:text-lg mb-3 md:mb-4">
                {statsHeading}
              </h2>
              <ComparatorTable rows={rows} statLabels={tableLabels} />
            </section>

            {/* Quick skills comparison */}
            {hasMeta && skillsHeading && (
            <section className="bg-panel border border-border rounded-lg p-4 md:p-6">
              <h2 className="text-gold2 font-bold uppercase tracking-widest text-base md:text-lg mb-3 md:mb-4">
                {skillsHeading}
              </h2>
              <SkillsCompare
                rows={rows}
                metaById={activeMeta}
                locale={effectiveLocale}
                slotLabel={slotLabel ?? "Slot"}
                noSkillLabel={noSkillLabel ?? "—"}
              />
            </section>
            )}

            <section className="bg-panel border border-border rounded-lg p-4 md:p-6">
              <h2 className="text-gold2 font-bold uppercase tracking-widest text-base md:text-lg mb-3 md:mb-4">
                {radarHeading}
              </h2>
              <ComparatorRadar rows={rows} statLabels={radarLabels} />
            </section>
          </div>
        )}
      </ComparatorShell>
    </div>
  );
}

const RATING_COLOR: Record<string, string> = {
  "S+": "bg-red-500/25 text-red-200 border-red-500/50",
  "S": "bg-red-500/20 text-red-200 border-red-500/40",
  "A": "bg-gold/20 text-gold2 border-gold/40",
  "B": "bg-emerald-500/15 text-emerald-200 border-emerald-500/40",
  "C": "bg-sky-500/15 text-sky-200 border-sky-500/40",
  "D": "bg-slate-500/15 text-slate-200 border-slate-500/40",
  "E": "bg-slate-500/10 text-slate-300 border-slate-500/30",
};

function SkillsCompare({
  rows,
  metaById,
  locale,
  slotLabel,
  noSkillLabel,
}: {
  rows: ComparableRow[];
  metaById: Record<string, CompareMeta>;
  locale: string;
  slotLabel: string;
  noSkillLabel: string;
}) {
  if (rows.length === 0) return null;
  const maxSlots = Math.max(
    1,
    ...rows.map((r) => metaById[r.id]?.skills.length ?? 0)
  );
  const slots = Array.from({ length: maxSlots }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left text-muted text-[10px] uppercase tracking-widest p-3 border-b border-border whitespace-nowrap">
              {slotLabel}
            </th>
            {rows.map((r) => (
              <th
                key={r.id}
                className="text-left text-gold2 font-bold p-3 border-b border-border"
              >
                {locale === "fr" ? r.nameFr || r.name : r.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slotIdx) => (
            <tr key={slotIdx} className="align-top">
              <td className="p-3 text-muted text-[11px] uppercase tracking-widest whitespace-nowrap">
                #{slotIdx}
              </td>
              {rows.map((r) => {
                const meta = metaById[r.id];
                const sk = meta?.skills.find((s) => s.slot === slotIdx);
                if (!sk) {
                  return (
                    <td
                      key={r.id}
                      className="p-3 text-muted italic text-xs"
                    >
                      {noSkillLabel}
                    </td>
                  );
                }
                const display = locale === "fr" ? sk.nameFr || sk.name : sk.name;
                const ratingCls = sk.rating
                  ? RATING_COLOR[sk.rating] ?? "bg-slate-500/15 text-slate-200 border-slate-500/40"
                  : "";
                return (
                  <td key={r.id} className="p-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-ink text-sm leading-tight">
                        {display}
                      </span>
                      {sk.rating && (
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded border ${ratingCls}`}
                        >
                          {sk.rating}
                        </span>
                      )}
                      {sk.replaceable && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gold/15 border border-gold/40 text-gold2"
                          title="Replaceable via Academy"
                        >
                          🎓
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
