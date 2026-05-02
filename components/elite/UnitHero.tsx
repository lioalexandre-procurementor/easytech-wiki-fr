import Image from "next/image";
import { TierBadge } from "@/components/TierBadge";
import { UnitIcon } from "@/components/UnitIcon";
import type { Tier, UnitData } from "@/lib/types";

/**
 * Zoomed-in hero block for the elite-unit page.
 *
 * The previous design used a 220×220 thumbnail tucked into a 2-col grid, which
 * left ~70% of the hero panel as wasted air on mobile. This redesign treats
 * the unit sprite as the hero — full-width container, hex-grid backdrop,
 * radial glow, tier badge in the corner, country chip in the corner, and a
 * gradient-fade name overlay along the bottom. Description prose moves below
 * the image where it can breathe.
 */
export function UnitHero({
  unit,
  displayName,
  description,
  shortDesc,
  categoryLabel,
  categoryIcon,
  categorySuffix,
  countryLabel,
  countryFlag,
  obtainabilityLabel,
  factionLabel,
  factionScorpion,
  isPreliminary,
  badgeChildren,
}: {
  unit: UnitData;
  displayName: string;
  description: string;
  shortDesc?: string | null;
  categoryLabel: string;
  categoryIcon: string;
  /** Localized "d'élite" / "elite" / "Elite" suffix appended to the category. */
  categorySuffix: string;
  countryLabel: string;
  countryFlag: string;
  obtainabilityLabel: string;
  factionLabel: string;
  factionScorpion: boolean;
  isPreliminary?: boolean;
  /** Optional extra chips rendered alongside the standard set (e.g. game tag). */
  badgeChildren?: React.ReactNode;
}) {
  const tier = unit.tier as Tier;
  return (
    <section className="bg-panel border border-border rounded-xl overflow-hidden mb-6">
      {/* Hero image — full-width, zoomed sprite on hex-grid backdrop */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: "16 / 11",
          background:
            "linear-gradient(135deg, #0d1a2a 0%, rgb(var(--c-panel)) 50%, #0d1a2a 100%)",
          boxShadow: "inset 0 0 60px rgb(var(--c-gold) / 0.08)",
        }}
      >
        <svg
          width="100%"
          height="100%"
          className="absolute inset-0 opacity-20 pointer-events-none"
          aria-hidden="true"
        >
          <defs>
            <pattern id="elite-hex" width="40" height="46" patternUnits="userSpaceOnUse">
              <polygon
                points="20,1 38,12 38,34 20,45 2,34 2,12"
                fill="none"
                stroke="rgb(var(--c-gold))"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#elite-hex)" />
        </svg>

        <div
          className="absolute pointer-events-none"
          style={{
            left: "50%",
            top: "55%",
            transform: "translate(-50%, -50%)",
            width: "70%",
            height: "70%",
            background:
              "radial-gradient(circle, rgb(var(--c-gold) / 0.25) 0%, transparent 60%)",
          }}
          aria-hidden="true"
        />

        <div className="absolute inset-0 grid place-items-center p-3 md:p-6">
          <div className="relative w-3/4 max-w-[420px] aspect-square">
            {unit.image?.sprite ? (
              <Image
                src={unit.image.sprite}
                alt={displayName}
                fill
                sizes="(max-width: 768px) 75vw, 420px"
                className="object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                priority
              />
            ) : (
              <div className="w-full h-full grid place-items-center">
                <UnitIcon category={unit.category} country={unit.country} size={180} />
              </div>
            )}
          </div>
        </div>

        {/* Country chip — top-left */}
        <div
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg backdrop-blur-md text-xs font-bold text-gold2"
          style={{
            background: "rgb(var(--c-bg) / 0.7)",
            border: "1px solid rgb(var(--c-gold) / 0.3)",
          }}
        >
          <span className="text-base leading-none">{countryFlag}</span>
          <span>{countryLabel}</span>
        </div>

        {/* Tier badge — top-right */}
        <div className="absolute top-3 right-3">
          <TierBadge tier={tier} size="md" />
        </div>

        {/* Bottom name overlay */}
        <div
          className="absolute inset-x-0 bottom-0 px-4 md:px-6 pt-10 pb-3 md:pb-4"
          style={{
            background:
              "linear-gradient(to top, rgb(var(--c-bg-deep) / 0.95) 0%, transparent 100%)",
          }}
        >
          <div className="text-[10px] md:text-xs text-gold uppercase tracking-[0.2em] font-bold mb-1">
            {categoryIcon} {categoryLabel} {categorySuffix}
          </div>
          <h1 className="m-0 font-serif font-black text-gold2 text-[26px] md:text-4xl leading-[1.05]">
            {displayName}
          </h1>
        </div>
      </div>

      {/* Body — chips + description */}
      <div className="p-4 md:p-6">
        {isPreliminary && (
          <div className="mb-3 p-2.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-200 text-xs leading-relaxed">
            ⚠️ <strong>{shortDesc ?? "Data being verified"}</strong>
          </div>
        )}

        {shortDesc && !isPreliminary && (
          <p className="m-0 mb-3 text-dim text-sm md:text-base italic">{shortDesc}</p>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          <Chip accent>🎁 {obtainabilityLabel}</Chip>
          <Chip>📊 {tier} · 1–12</Chip>
          {factionScorpion ? (
            <Chip scorpion>🦂 {factionLabel}</Chip>
          ) : (
            <Chip>🌍 {factionLabel}</Chip>
          )}
          {badgeChildren}
        </div>

        <p className="m-0 text-ink text-sm md:text-[15px] leading-relaxed">{description}</p>
      </div>
    </section>
  );
}

function Chip({
  children,
  accent,
  scorpion,
}: {
  children: React.ReactNode;
  accent?: boolean;
  scorpion?: boolean;
}) {
  if (scorpion) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border text-red-200"
        style={{
          background: "rgb(var(--c-accent) / 0.15)",
          borderColor: "rgb(var(--c-accent))",
        }}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        accent ? "bg-gold/15 border-gold text-gold2" : "bg-bg3 border-border text-dim"
      }`}
    >
      {children}
    </span>
  );
}
