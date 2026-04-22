import { Link } from "@/src/i18n/navigation";

export interface TierEntry {
  slug: string;
  name: string;
  rank: string;
  category: string;
  country?: string | null;
  portrait?: string | null;
}

const TIERS = ["S", "A", "B", "C"] as const;
const TIER_LABEL_COLORS: Record<string, string> = {
  S: "text-red-300",
  A: "text-orange-300",
  B: "text-yellow-300",
  C: "text-emerald-300",
};
const TIER_CELL_BG: Record<string, string> = {
  S: "bg-red-500/5",
  A: "bg-orange-400/5",
  B: "bg-yellow-400/5",
  C: "bg-emerald-400/5",
};

export interface CategoryColumn {
  key: string;
  label: string;
  icon: string;
}

interface Props {
  entries: TierEntry[];
  columns: CategoryColumn[];
  hrefFor: (slug: string) => string;
}

export function TierList({ entries, columns, hrefFor }: Props) {
  const usedTiers = TIERS.filter((t) =>
    entries.some((e) => (e.rank ?? "").toUpperCase() === t)
  );

  return (
    <div className="overflow-x-auto -mx-6 px-6">
      {/* Desktop: full grid table */}
      <table className="hidden md:table w-full border-collapse">
        <thead>
          <tr>
            <th className="w-16 p-2 text-center text-muted text-[10px] font-bold uppercase tracking-widest">
              Tier
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                className="p-2 text-center text-muted text-[10px] font-bold uppercase tracking-widest border-l border-border"
              >
                <span className="mr-1">{col.icon}</span>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {usedTiers.map((tier) => (
            <tr key={tier} className="border-t border-border">
              <td
                className={`text-center align-top p-3 font-black text-3xl font-serif ${TIER_LABEL_COLORS[tier]}`}
              >
                {tier}
              </td>
              {columns.map((col) => {
                const cell = entries.filter(
                  (e) =>
                    (e.rank ?? "").toUpperCase() === tier &&
                    e.category === col.key
                );
                return (
                  <td
                    key={col.key}
                    className={`align-top p-2 border-l border-border ${TIER_CELL_BG[tier]}`}
                  >
                    <div className="flex flex-col gap-1.5">
                      {cell.map((g) => (
                        <Link
                          key={g.slug}
                          href={hrefFor(g.slug) as any}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-panel border border-border hover:border-gold text-dim hover:text-gold2 text-xs no-underline transition-colors"
                        >
                          {g.portrait && (
                            <img
                              src={g.portrait}
                              alt=""
                              loading="lazy"
                              className="w-6 h-6 rounded-full object-cover border border-border shrink-0"
                            />
                          )}
                          <span className="font-semibold truncate">
                            {g.name}
                          </span>
                        </Link>
                      ))}
                      {cell.length === 0 && (
                        <span className="text-muted/30 text-xs text-center py-2">
                          —
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

      {/* Mobile: stacked cards per tier, generals tagged with category */}
      <div className="md:hidden flex flex-col gap-4">
        {usedTiers.map((tier) => {
          const rows = entries.filter(
            (e) => (e.rank ?? "").toUpperCase() === tier
          );
          if (rows.length === 0) return null;
          // Group by category in column order
          const grouped = columns
            .map((col) => ({
              col,
              items: rows.filter((r) => r.category === col.key),
            }))
            .filter((g) => g.items.length > 0);
          return (
            <div
              key={tier}
              className="rounded-lg border border-border overflow-hidden"
            >
              <div
                className={`flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-panel to-transparent border-b border-border`}
              >
                <span
                  className={`text-3xl font-black font-serif ${TIER_LABEL_COLORS[tier]}`}
                >
                  {tier}
                </span>
                <span className="text-muted text-xs font-bold uppercase tracking-widest">
                  {rows.length} generals
                </span>
              </div>
              <div className="p-3 space-y-3 bg-panel/50">
                {grouped.map(({ col, items }) => (
                  <div key={col.key}>
                    <div className="text-muted text-[10px] font-bold uppercase tracking-widest mb-1.5">
                      {col.icon} {col.label}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((g) => (
                        <Link
                          key={g.slug}
                          href={hrefFor(g.slug) as any}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-panel border border-border hover:border-gold text-dim hover:text-gold2 text-xs no-underline transition-colors"
                        >
                          {g.portrait && (
                            <img
                              src={g.portrait}
                              alt=""
                              loading="lazy"
                              className="w-5 h-5 rounded-full object-cover border border-border shrink-0"
                            />
                          )}
                          <span className="font-semibold">{g.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
