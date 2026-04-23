import Link from "next/link";
import type { Formation } from "@/lib/types";
import { localizedFormationField } from "@/lib/formations";
import { COUNTRY_FLAGS } from "@/lib/units";

const SLUG_PATH: Record<string, (slug: string) => string> = {
  fr: (slug) => `/world-conqueror-4/formations-legendes/${slug}`,
  en: (slug) => `/world-conqueror-4/legend-formations/${slug}`,
  de: (slug) => `/world-conqueror-4/legend-formations/${slug}`,
};

function localizedShort(formation: Formation, locale?: string): string {
  if (locale === "en") return formation.lore.shortEn || formation.lore.short;
  if (locale === "de") return formation.lore.shortDe || formation.lore.short;
  return formation.lore.short;
}

export function FormationCard({
  formation,
  locale,
}: {
  formation: Formation;
  locale?: string;
}) {
  const localeKey = (locale === "en" || locale === "de" ? locale : "fr") as "fr" | "en" | "de";
  const href = SLUG_PATH[localeKey](formation.slug);
  const name = localizedFormationField(formation, "name", locale);
  const unitLabel = localizedFormationField(formation, "historicalUnit", locale);
  const flag = COUNTRY_FLAGS[formation.country] || "🏳";
  return (
    <Link
      href={href}
      className="block rounded-lg border border-border bg-panel p-4 hover:border-gold hover:-translate-y-0.5 transition-all no-underline"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-gold2 font-bold text-base leading-tight">{name}</h3>
        <span className="text-lg flex-shrink-0">{flag}</span>
      </div>
      <p className="text-muted text-xs mb-2">{unitLabel}</p>
      <p className="text-dim text-xs leading-relaxed line-clamp-2">{localizedShort(formation, locale)}</p>
    </Link>
  );
}
