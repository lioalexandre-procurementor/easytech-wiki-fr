import type { ComparableRow, DiffClass } from "./types";

/**
 * For a given stat key, classify each row as "best", "worst", or "neutral"
 * by comparing against the other rows. Ties collapse to "neutral".
 */
export function diffClass(
  key: string,
  rowId: string,
  rows: ComparableRow[],
): DiffClass {
  const values = rows
    .map((r) => r.stats[key])
    .filter((v): v is number => typeof v === "number");
  if (values.length < 2) return "neutral";
  const mine = rows.find((r) => r.id === rowId)?.stats[key];
  if (typeof mine !== "number") return "neutral";
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === min) return "neutral";
  if (mine === max) return "best";
  if (mine === min) return "worst";
  return "neutral";
}

/**
 * Normalize all rows' stats to 0–100 for a radar chart. The max across
 * all rows for each key becomes 100; other rows are scaled proportionally.
 */
export function normalizeStats(rows: ComparableRow[]): ComparableRow[] {
  if (rows.length === 0) return rows;
  const allKeys = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r.stats)) allKeys.add(k);
  const maxByKey: Record<string, number> = {};
  for (const k of allKeys) {
    const vals = rows.map((r) => r.stats[k]).filter((v): v is number => typeof v === "number");
    maxByKey[k] = vals.length ? Math.max(...vals) : 1;
  }
  return rows.map((r) => {
    const normalized: Record<string, number | null> = {};
    for (const k of allKeys) {
      const v = r.stats[k];
      if (typeof v !== "number") normalized[k] = null;
      else normalized[k] = Math.round((v / (maxByKey[k] || 1)) * 100);
    }
    return { ...r, stats: normalized };
  });
}
