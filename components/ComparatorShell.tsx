"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "@/src/i18n/navigation";
import type { ComparableRow } from "@/lib/types";

export interface ComparatorShellProps {
  allRows: ComparableRow[];
  initialIds: string[];
  maxSlots?: number;
  children: (rows: ComparableRow[]) => React.ReactNode;
}

/**
 * Generic 2–4 slot comparator with URL-persisted state.
 * URL shape: ?left=abrams&right=leopard-2&third=t-14
 * Children receives the resolved rows (in slot order).
 */
export default function ComparatorShell({
  allRows,
  initialIds,
  maxSlots = 4,
  children,
}: ComparatorShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ids, setIds] = useState<string[]>(
    initialIds.length > 0 ? initialIds : [allRows[0]?.id ?? ""],
  );

  useEffect(() => {
    const params = new URLSearchParams();
    const keys = ["left", "right", "third", "fourth"] as const;
    ids.forEach((id, i) => {
      if (id && keys[i]) params.set(keys[i], id);
    });
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
  }, [ids, pathname, router]);

  const setAt = useCallback((slot: number, id: string) => {
    setIds((prev) => {
      const next = [...prev];
      while (next.length <= slot) next.push("");
      next[slot] = id;
      return next.slice(0, maxSlots);
    });
  }, [maxSlots]);

  const addSlot = useCallback(() => {
    setIds((prev) => (prev.length < maxSlots ? [...prev, allRows[0]?.id ?? ""] : prev));
  }, [allRows, maxSlots]);

  const removeSlot = useCallback((slot: number) => {
    setIds((prev) => prev.filter((_, i) => i !== slot));
  }, []);

  const selected = ids
    .map((id) => allRows.find((r) => r.id === id))
    .filter((r): r is ComparableRow => r !== undefined);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ids.map((id, slot) => (
          <select
            key={slot}
            value={id}
            onChange={(e) => setAt(slot, e.target.value)}
            className="bg-bg3 border border-border rounded-md px-3 py-2 min-h-[44px] text-base text-ink"
          >
            {allRows.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        ))}
        {ids.length < maxSlots && (
          <button
            type="button"
            onClick={addSlot}
            className="min-w-[44px] min-h-[44px] px-3 py-2 border border-border rounded-md text-base text-gold2 hover:bg-gold/10 cursor-pointer"
          >
            +
          </button>
        )}
        {ids.length > 1 && (
          <button
            type="button"
            onClick={() => removeSlot(ids.length - 1)}
            className="min-w-[44px] min-h-[44px] px-3 py-2 border border-border rounded-md text-base text-dim hover:text-red-400 cursor-pointer"
          >
            −
          </button>
        )}
      </div>
      {children(selected)}
    </div>
  );
}
