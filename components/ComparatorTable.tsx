import type { ComparableRow, DiffClass } from "@/lib/types";
import { diffClass } from "@/lib/compare";

interface ComparatorTableProps {
  rows: ComparableRow[];
  statLabels: Record<string, string>;
}

const CLASS_MAP: Record<DiffClass, string> = {
  best: "bg-emerald-500/20 text-emerald-200",
  worst: "bg-red-500/20 text-red-200",
  neutral: "",
};

export function ComparatorTable({ rows, statLabels }: ComparatorTableProps) {
  if (rows.length === 0) return null;
  const statKeys = Object.keys(statLabels);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left text-muted text-[10px] uppercase tracking-widest p-3 border-b border-border">
              &nbsp;
            </th>
            {rows.map((r) => (
              <th
                key={r.id}
                className="text-left text-gold2 font-bold p-3 border-b border-border"
              >
                {r.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {statKeys.map((key) => (
            <tr key={key}>
              <td className="p-3 text-muted text-[11px] uppercase tracking-widest">
                {statLabels[key]}
              </td>
              {rows.map((r) => {
                const v = r.stats[key];
                const cls = typeof v === "number" ? diffClass(key, r.id, rows) : "neutral";
                return (
                  <td
                    key={r.id}
                    className={`p-3 tabular-nums font-semibold ${CLASS_MAP[cls]}`}
                  >
                    {typeof v === "number" ? v : "—"}
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
