"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Formation } from "@/lib/types";
import type { ResolvedFormationUnit } from "@/lib/formations";
import { FormationUnitRow } from "@/components/FormationUnitRow";
import { FormationEffectRow, FormationGeneralBuff } from "@/components/FormationEffectRow";

// Inlined to keep this client component free of server-only `@/lib/units` imports.
const FLAGS: Record<string, string> = {
  DE: "🇩🇪",
  US: "🇺🇸",
  SU: "🇷🇺",
  GB: "🇬🇧",
  FR: "🇫🇷",
  IT: "🇮🇹",
};

function localized(
  obj: Record<string, unknown>,
  field: string,
  locale?: string,
): string {
  if (locale === "en" && typeof obj[`${field}En`] === "string") return obj[`${field}En`] as string;
  if (locale === "de" && typeof obj[`${field}De`] === "string") return obj[`${field}De`] as string;
  return (obj[field] as string) ?? "";
}

export function FormationsHubClient({
  formations,
  resolvedUnits,
  detailHrefs,
  locale,
  t,
}: {
  formations: Formation[];
  resolvedUnits: Record<string, ResolvedFormationUnit[]>;
  detailHrefs: Record<string, string>;
  locale?: string;
  t: {
    selectPrompt: string;
    historicalUnit: string;
    unitsInFormation: string;
    generalBuff: string;
    tacticalEffects: string;
    countryLock: string;
    readFullGuide: string;
  };
}) {
  const [activeSlug, setActiveSlug] = useState<string>(formations[0]?.slug ?? "");

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (hash && formations.some((f) => f.slug === hash)) {
      setActiveSlug(hash);
    }
  }, [formations]);

  const active = formations.find((f) => f.slug === activeSlug) ?? formations[0];
  if (!active) return null;

  function selectFormation(slug: string) {
    setActiveSlug(slug);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${slug}`);
    }
  }

  const loreShort = localized(active.lore as unknown as Record<string, unknown>, "short", locale);
  const generalBuffText = localized(active.generalBuff as unknown as Record<string, unknown>, "text", locale);
  const activeUnits = resolvedUnits[active.slug] ?? [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
      <nav
        className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-6rem)] pb-1 md:pb-0"
        aria-label={t.selectPrompt}
      >
        {formations.map((f) => {
          const isActive = f.slug === activeSlug;
          const name = localized(f as unknown as Record<string, unknown>, "name", locale);
          const flag = FLAGS[f.country] || "🏳";
          return (
            <button
              key={f.slug}
              onClick={() => selectFormation(f.slug)}
              className={`flex-shrink-0 md:flex-shrink text-left px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal ${
                isActive
                  ? "bg-gold/20 text-gold2 border border-gold/50"
                  : "bg-panel/60 text-text hover:bg-panel border border-transparent"
              }`}
              aria-pressed={isActive}
            >
              <span className="mr-2">{flag}</span>
              {name}
            </button>
          );
        })}
      </nav>

      <article className="min-w-0">
        <header className="mb-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-2xl" aria-hidden="true">
              {FLAGS[active.country] || "🏳"}
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-gold2 m-0">
              {localized(active as unknown as Record<string, unknown>, "name", locale)}
            </h2>
            {active.operationName && (
              <span className="text-xs uppercase tracking-wider bg-bg3 border border-border rounded px-2 py-0.5 text-muted">
                {localized(active as unknown as Record<string, unknown>, "operationName", locale)}
              </span>
            )}
          </div>
          <p className="text-sm text-muted m-0">
            <strong className="text-text">{t.historicalUnit}:</strong>{" "}
            {localized(active as unknown as Record<string, unknown>, "historicalUnit", locale)}
          </p>
        </header>

        <p className="text-text/90 leading-relaxed mb-5">{loreShort}</p>

        <section className="mb-5">
          <h3 className="text-gold2 font-semibold text-sm uppercase tracking-wider mb-2">
            {t.unitsInFormation}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {activeUnits.map((u, i) => (
              <FormationUnitRow key={i} unit={u} />
            ))}
          </div>
        </section>

        <section className="mb-5">
          <h3 className="text-gold2 font-semibold text-sm uppercase tracking-wider mb-2">
            {t.generalBuff}
          </h3>
          <FormationGeneralBuff text={generalBuffText} appliesTo={active.generalBuff.appliesTo} />
        </section>

        <section className="mb-5">
          <h3 className="text-gold2 font-semibold text-sm uppercase tracking-wider mb-2">
            {t.tacticalEffects}
          </h3>
          <div className="grid gap-2">
            {active.tacticalEffects.map((e, i) => (
              <FormationEffectRow key={i} effect={e} locale={locale} />
            ))}
          </div>
        </section>

        <p className="text-xs text-muted italic mb-4">{t.countryLock}</p>

        <Link
          href={detailHrefs[active.slug] ?? "#"}
          className="inline-flex items-center gap-1 text-gold2 font-semibold hover:text-gold no-underline"
        >
          {t.readFullGuide} →
        </Link>
      </article>
    </div>
  );
}
