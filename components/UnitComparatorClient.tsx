"use client";
import ComparatorShell from "@/components/ComparatorShell";
import { ComparatorTable } from "@/components/ComparatorTable";
import { ComparatorRadar } from "@/components/ComparatorRadar";
import type { ComparableRow } from "@/lib/types";

interface UnitComparatorClientProps {
  allRows: ComparableRow[];
  initialIds: string[];
  statLabels: Record<string, string>;
  statsHeading: string;
  radarHeading: string;
}

export default function UnitComparatorClient({
  allRows,
  initialIds,
  statLabels,
  statsHeading,
  radarHeading,
}: UnitComparatorClientProps) {
  return (
    <ComparatorShell allRows={allRows} initialIds={initialIds}>
      {(rows) => (
        <div className="space-y-6">
          <section className="bg-panel border border-border rounded-lg p-6">
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              {statsHeading}
            </h2>
            <ComparatorTable rows={rows} statLabels={statLabels} />
          </section>
          <section className="bg-panel border border-border rounded-lg p-6">
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              {radarHeading}
            </h2>
            <ComparatorRadar rows={rows} statLabels={statLabels} />
          </section>
        </div>
      )}
    </ComparatorShell>
  );
}
