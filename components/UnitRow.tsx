import Link from "next/link";
import type { UnitData } from "@/lib/types";
import { TierBadge } from "./TierBadge";
import { UnitIcon } from "./UnitIcon";
import { COUNTRY_FLAGS } from "@/lib/units";

export function UnitRow({ unit }: { unit: UnitData }) {
  const i = unit.stats.atk.length - 1;
  return (
    <Link href={`/world-conqueror-4/unites-elite/${unit.slug}`}
      className="bg-panel border border-border rounded-lg p-3 px-4 grid items-center gap-4 hover:border-gold transition-colors no-underline"
      style={{ gridTemplateColumns: "60px 1fr auto auto auto" }}>
      <div className="w-15"><UnitIcon category={unit.category} country={unit.country} size={60}/></div>
      <div>
        <h4 className="text-gold2 font-bold text-base">{unit.name}</h4>
        <div className="text-dim text-sm">
          <span className="text-muted text-xs uppercase tracking-widest mr-1.5">{COUNTRY_FLAGS[unit.country]} {unit.countryName}</span>
          {unit.shortDesc}
        </div>
      </div>
      <TierBadge tier={unit.tier} size="md"/>
      <div className="hidden md:flex gap-2.5 text-xs text-dim">
        <span>ATQ <b className="text-gold2">{unit.stats.atk[0]}</b></span>
        <span>DEF <b className="text-gold2">{unit.stats.def[0]}</b></span>
        <span>HP <b className="text-gold2">{unit.stats.hp[0]}</b></span>
      </div>
      <div className="text-dim">›</div>
    </Link>
  );
}
