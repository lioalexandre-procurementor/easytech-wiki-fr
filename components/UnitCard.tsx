import Link from "next/link";
import type { UnitData } from "@/lib/types";
import { TierBadge } from "./TierBadge";
import { UnitIcon } from "./UnitIcon";
import { COUNTRY_FLAGS } from "@/lib/units";

export function UnitCard({ unit }: { unit: UnitData }) {
  return (
    <Link href={`/world-conqueror-4/unites-elite/${unit.slug}`}
      className="block bg-panel border border-border rounded-lg p-4 hover:border-gold hover:-translate-y-0.5 transition-all no-underline">
      <div className="flex justify-between items-start mb-3">
        <UnitIcon category={unit.category} country={unit.country} size={56}/>
        <TierBadge tier={unit.tier} size="sm"/>
      </div>
      <h3 className="text-gold2 font-bold text-base mb-1">{unit.name}</h3>
      <p className="text-dim text-xs leading-relaxed line-clamp-2">{unit.shortDesc}</p>
      <div className="text-muted text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
        <span>{COUNTRY_FLAGS[unit.country] || "🏳"}</span>
        <span>{unit.countryName}</span>
      </div>
    </Link>
  );
}
