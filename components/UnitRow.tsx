import { Link } from "@/src/i18n/navigation";
import Image from "next/image";
import type { UnitData } from "@/lib/types";
import { TierBadge } from "./TierBadge";
import { UnitIcon } from "./UnitIcon";
import { COUNTRY_FLAGS } from "@/lib/units";
import { countryLabel } from "@/lib/countries";
import { localizedUnitField } from "@/lib/localized-copy";
import { isPlaceholder } from "@/lib/placeholder";

type Game = "wc4" | "gcr" | "ew6";

const HUB_PATH: Record<Game, "/world-conqueror-4/unites-elite" | "/great-conqueror-rome/unites-elite" | "/european-war-6/unites-elite"> = {
  wc4: "/world-conqueror-4/unites-elite",
  gcr: "/great-conqueror-rome/unites-elite",
  ew6: "/european-war-6/unites-elite",
};

export function UnitRow({
  unit,
  locale,
  game = "wc4",
}: {
  unit: UnitData;
  locale?: string;
  game?: Game;
}) {
  const displayName = locale === "fr" ? unit.name : unit.nameEn || unit.name;
  const displayShortDesc = localizedUnitField(unit as unknown as Record<string, unknown>, "shortDesc", locale);
  const href = `${HUB_PATH[game]}/${unit.slug}` as const;
  const nofollow = isPlaceholder(unit as unknown as { longDesc?: string | null });
  return (
    <Link href={href as any}
      className="bg-panel border border-border rounded-lg p-3 px-4 grid items-center gap-4 hover:border-gold transition-colors no-underline"
      style={{ gridTemplateColumns: "60px 1fr auto auto auto" }}
      rel={nofollow ? "nofollow" : undefined}>
      <div className="w-15">
        {unit.image?.sprite ? (
          <div className="relative w-[60px] h-[60px]">
            <Image src={unit.image.sprite} alt={displayName} fill sizes="60px" className="object-contain"/>
          </div>
        ) : (
          <UnitIcon category={unit.category} country={unit.country} size={60}/>
        )}
      </div>
      <div>
        <h4 className="text-gold2 font-bold text-base">{displayName}</h4>
        <div className="text-dim text-sm">
          <span className="text-muted text-xs uppercase tracking-widest mr-1.5">{COUNTRY_FLAGS[unit.country]} {countryLabel(unit.country, locale)}</span>
          {displayShortDesc}
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
