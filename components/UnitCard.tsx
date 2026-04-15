import Link from "next/link";
import Image from "next/image";
import type { UnitData } from "@/lib/types";
import { TierBadge } from "./TierBadge";
import { UnitIcon } from "./UnitIcon";
import { COUNTRY_FLAGS } from "@/lib/units";
import { countryLabel } from "@/lib/countries";
import { localizedUnitField } from "@/lib/localized-copy";

/**
 * Card used on the WC4 hub and elite-units listing.
 *
 * Prefers the APK-extracted sprite (/img/wc4/elites/<armyId>.webp) when the
 * unit carries one. Falls back to the category SVG silhouette for scorpion /
 * mystic units that don't yet have an image mapping.
 */
export function UnitCard({ unit, locale }: { unit: UnitData; locale?: string }) {
  const sprite = unit.image?.sprite ?? null;
  const displayName = locale === "fr" ? unit.name : unit.nameEn || unit.name;
  const displayShortDesc = localizedUnitField(unit as unknown as Record<string, unknown>, "shortDesc", locale);
  return (
    <Link
      href={`/world-conqueror-4/unites-elite/${unit.slug}`}
      className="block bg-panel border border-border rounded-lg p-4 hover:border-gold hover:-translate-y-0.5 transition-all no-underline"
    >
      <div className="flex justify-between items-start mb-3">
        {sprite ? (
          <div className="relative w-14 h-14 rounded-md border border-gold/40 bg-bg3 overflow-hidden">
            <Image
              src={sprite}
              alt={displayName}
              fill
              sizes="56px"
              className="object-contain p-1"
            />
          </div>
        ) : (
          <UnitIcon category={unit.category} country={unit.country} size={56} />
        )}
        <TierBadge tier={unit.tier} size="sm" />
      </div>
      <h3 className="text-gold2 font-bold text-base mb-1">{displayName}</h3>
      <p className="text-dim text-xs leading-relaxed line-clamp-2">{displayShortDesc}</p>
      <div className="text-muted text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
        <span>{COUNTRY_FLAGS[unit.country] || "🏳"}</span>
        <span>{countryLabel(unit.country, locale)}</span>
      </div>
    </Link>
  );
}
