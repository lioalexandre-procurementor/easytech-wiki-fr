"use client";
import ComparatorShell from "@/components/ComparatorShell";
import { ComparatorTable } from "@/components/ComparatorTable";
import { ComparatorRadar } from "@/components/ComparatorRadar";
import type { ComparableRow } from "@/lib/types";

interface GeneralComparatorClientProps {
  allRows: ComparableRow[];
  initialIds: string[];
  tableLabels: Record<string, string>;
  radarLabels: Record<string, string>;
  statsHeading: string;
  radarHeading: string;
}

export default function GeneralComparatorClient({
  allRows,
  initialIds,
  tableLabels,
  radarLabels,
  statsHeading,
  radarHeading,
}: GeneralComparatorClientProps) {
  return (
    <ComparatorShell allRows={allRows} initialIds={initialIds}>
      {(rows) => (
        <div className="space-y-6">
          <section className="bg-panel border border-border rounded-lg p-6">
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              {statsHeading}
            </h2>
            <ComparatorTable rows={rows} statLabels={tableLabels} />
          </section>
          <section className="bg-panel border border-border rounded-lg p-6">
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              {radarHeading}
            </h2>
            <ComparatorRadar rows={rows} statLabels={radarLabels} />
          </section>
        </div>
      )}
    </ComparatorShell>
  );
}
