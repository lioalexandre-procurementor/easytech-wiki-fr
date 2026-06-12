import Image from "next/image";
import { Link } from "@/src/i18n/navigation";

export type RelatedItem = {
  /** Locale-internal href, already localized by the caller (e.g. FR
   *  "/world-conqueror-4/competences/x" vs EN "/world-conqueror-4/skills/x")
   *  so the link resolves without a middleware 307. */
  href: string;
  name: string;
  /** Optional secondary line (effect summary, tier, category…). */
  sublabel?: string;
  /** Optional icon/sprite path (png/jpg/webp). Falls back to a monogram. */
  icon?: string | null;
  /** Optional short badge (e.g. "S", "L5", series label). */
  badge?: string;
};

/**
 * Consistent "related content" rail for detail pages — the internal-linking
 * surface that connects sibling entities (skills in a series, units in a
 * category, techs in a tree). One component, same look across all games.
 *
 * Callers pass pre-resolved, locale-correct hrefs; this component does not
 * localize path segments itself (site navigation uses
 * createSharedPathnamesNavigation, which would otherwise 307 /en|/de).
 */
export function RelatedRail({
  title,
  items,
  seeAllHref,
  seeAllLabel,
}: {
  title: string;
  items: RelatedItem[];
  seeAllHref?: string;
  seeAllLabel?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="bg-panel border border-border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg">
          {title}
        </h2>
        {seeAllHref && seeAllLabel && (
          <Link
            href={seeAllHref as any}
            className="text-gold text-xs font-semibold hover:underline whitespace-nowrap no-underline"
          >
            {seeAllLabel} →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href as any}
            className="flex items-center gap-3 bg-bg3 border border-border rounded-lg p-3 hover:border-gold transition-colors no-underline"
          >
            <div className="w-10 h-10 rounded-md border border-gold/40 bg-bg2/60 grid place-items-center relative overflow-hidden flex-shrink-0">
              {it.icon ? (
                <Image
                  src={it.icon}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-contain p-1"
                />
              ) : (
                <span className="text-gold2 font-bold text-xs">
                  {it.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-gold2 font-bold text-sm truncate">
                  {it.name}
                </span>
                {it.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gold/15 border border-gold/40 text-gold2 flex-shrink-0">
                    {it.badge}
                  </span>
                )}
              </div>
              {it.sublabel && (
                <div className="text-muted text-[11px] leading-snug line-clamp-2">
                  {it.sublabel}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
