"use client";

import { useMemo, useState } from "react";
import ComparatorShell from "@/components/ComparatorShell";
import { ComparatorTable } from "@/components/ComparatorTable";
import { ComparatorRadar } from "@/components/ComparatorRadar";
import type { ComparableRow } from "@/lib/types";

type CompareMode = "unlock" | "maxed" | "trained";

interface Props {
  /**
   * Three pre-computed row sets, one per projection mode. The page component
   * does the heavy lifting (calling buildTrainedView / buildPremiumTrainingView)
   * server-side; this client just toggles which list it feeds to the shell.
   */
  rowsByMode: Record<CompareMode, ComparableRow[]>;
  /** Subset of ids eligible for the `trained` mode (the 19 trainable generals). */
  trainedEligibleIds: string[];
  initialIds: string[];
  initialMode: CompareMode;
  tableLabels: Record<string, string>;
  radarLabels: Record<string, string>;
  statsHeading: string;
  radarHeading: string;
  modeLabels: Record<CompareMode, string>;
  modeHints: Record<CompareMode, string>;
}

export default function GeneralComparatorClient({
  rowsByMode,
  trainedEligibleIds,
  initialIds,
  initialMode,
  tableLabels,
  radarLabels,
  statsHeading,
  radarHeading,
  modeLabels,
  modeHints,
}: Props) {
  const [mode, setMode] = useState<CompareMode>(initialMode);
  const trainedEligible = useMemo(
    () => new Set(trainedEligibleIds),
    [trainedEligibleIds]
  );
  const activeRows = rowsByMode[mode];

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
            <section className="bg-panel border border-border rounded-lg p-4 md:p-6">
              <h2 className="text-gold2 font-bold uppercase tracking-widest text-base md:text-lg mb-3 md:mb-4">
                {statsHeading}
              </h2>
              <ComparatorTable rows={rows} statLabels={tableLabels} />
            </section>
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
