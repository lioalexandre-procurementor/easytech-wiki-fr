import { Link } from "@/src/i18n/navigation";

export interface TierEntry {
  slug: string;
  name: string;
  rank: string;
  country?: string | null;
  portrait?: string | null;
}

const TIERS = ["S", "A", "B", "C"] as const;
const TIER_COLORS: Record<string, string> = {
  S: "from-red-500/30 to-red-600/10 border-red-500/50 text-red-300",
  A: "from-orange-400/30 to-orange-500/10 border-orange-400/50 text-orange-300",
  B: "from-yellow-400/30 to-yellow-500/10 border-yellow-400/50 text-yellow-300",
  C: "from-emerald-400/30 to-emerald-500/10 border-emerald-400/50 text-emerald-300",
};

interface Props {
  entries: TierEntry[];
  hrefFor: (slug: string) => string;
}

export function TierList({ entries, hrefFor }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {TIERS.map((tier) => {
        const rows = entries.filter((e) => (e.rank ?? "").toUpperCase() === tier);
        if (rows.length === 0) return null;
        return (
          <div
            key={tier}
            className={`flex items-stretch rounded-lg border bg-gradient-to-r ${TIER_COLORS[tier]}`}
          >
            <div className="flex items-center justify-center w-20 md:w-24 shrink-0 text-4xl md:text-5xl font-black font-serif">
              {tier}
            </div>
            <div className="flex-1 p-3 flex flex-wrap gap-2 bg-panel/80 border-l border-border">
              {rows.map((g) => (
                <Link
                  key={g.slug}
                  href={hrefFor(g.slug) as any}
                  className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-black/30 border border-border hover:border-gold text-dim hover:text-gold2 text-xs md:text-sm no-underline transition-colors"
                >
                  {g.portrait && (
                    <img
                      src={g.portrait}
                      alt=""
                      loading="lazy"
                      className="w-6 h-6 rounded-full object-cover border border-border"
                    />
                  )}
                  <span className="font-semibold">{g.name}</span>
                  {g.country && <span className="text-[10px] text-muted uppercase">{g.country}</span>}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
