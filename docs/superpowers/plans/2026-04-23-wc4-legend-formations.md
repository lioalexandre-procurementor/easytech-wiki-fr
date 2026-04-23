# WC4 Legend Formations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 8 WC4 Legend Formation pages (1 hub + 8 detail) with client-side toggle, in 3 locales (fr/en/de), fully integrated with nav, sitemap, and SEO metadata.

**Architecture:** Data-first static site feature. 8 JSON files under `data/wc4/formations/`, a `lib/formations.ts` loader, new app routes under `app/[locale]/world-conqueror-4/formations-legendes/`, 4 new components (`FormationsHubClient`, `FormationCard`, `FormationUnitRow`, `FormationEffectRow`). Hub = server-rendered SEO shell + client-side toggler. Detail = 8 statically generated pages with Article JSON-LD.

**Tech Stack:** Next.js 14 App Router, next-intl, TypeScript, Tailwind. No additional deps.

**Verification strategy:** Since this is a Next.js static site with no Jest/Vitest setup, verification = `next build` (type + compile check) and Claude Preview in a browser. Each task ends with either a build check or a preview check.

---

## File Structure Overview

```
easytech-wiki/
├── lib/
│   ├── types.ts                                          [MODIFY — add Formation + AppliesTo types]
│   └── formations.ts                                     [CREATE — data loader]
├── data/wc4/formations/                                  [CREATE dir]
│   ├── _index.json                                       [CREATE — ordered slug list]
│   ├── ghost-division.json                               [CREATE]
│   ├── spearhead.json                                    [CREATE]
│   ├── taman-division.json                               [CREATE]
│   ├── desert-rats.json                                  [CREATE]
│   ├── leclerc-division.json                             [CREATE]
│   ├── lightning-division.json                           [CREATE]
│   ├── grossdeutschland-division.json                    [CREATE]
│   └── 4th-guards-tank-division.json                     [CREATE]
├── components/
│   ├── FormationScopeIcon.tsx                            [CREATE]
│   ├── FormationUnitRow.tsx                              [CREATE]
│   ├── FormationEffectRow.tsx                            [CREATE]
│   └── FormationCard.tsx                                 [CREATE]
├── app/[locale]/world-conqueror-4/formations-legendes/
│   ├── page.tsx                                          [CREATE — hub]
│   ├── FormationsHubClient.tsx                           [CREATE — client toggler]
│   └── [slug]/page.tsx                                   [CREATE — detail]
├── src/i18n/config.ts                                    [MODIFY — add pathnames]
├── app/sitemap.ts                                        [MODIFY — add formation URLs]
├── lib/nav-items.ts                                      [MODIFY — add nav link]
├── messages/fr.json                                      [MODIFY — add keys]
├── messages/en.json                                      [MODIFY — add keys]
├── messages/de.json                                      [MODIFY — add keys]
└── app/[locale]/world-conqueror-4/page.tsx               [MODIFY — add feature card]
```

---

## Task 1: Add Formation types to `lib/types.ts`

**Files:**
- Modify: `lib/types.ts` (append at end)

- [ ] **Step 1: Add the Formation types**

Append at end of `lib/types.ts`:

```typescript
/** Unit-type scope for which a formation buff/effect applies. */
export type AppliesTo = "all" | "infantry" | "tank" | "artillery" | "navy" | "airforce";

/** One unit included in a formation. Base units reference a generic Category; elite units reference an existing elite-unit slug. */
export type FormationUnit =
  | { kind: "base"; name: string; nameEn: string; nameDe: string; category: Category }
  | { kind: "elite"; slug: string };

/** One tactical effect on a formation (e.g. "Joint Offensive"). */
export interface FormationEffect {
  name: string;
  nameEn: string;
  nameDe: string;
  desc: string;
  descEn: string;
  descDe: string;
  appliesTo: AppliesTo[];
}

/** A WC4 Legend Formation (Army Group / Legend Army in game data). */
export interface Formation {
  slug: string;
  order: number;
  name: string;
  nameEn: string;
  nameDe: string;
  country: string;
  countryName: string;
  countryNameEn: string;
  countryNameDe: string;
  operationName?: string;
  operationNameEn?: string;
  operationNameDe?: string;
  historicalUnit: string;
  historicalUnitEn: string;
  historicalUnitDe: string;
  lore: {
    short: string;
    shortEn: string;
    shortDe: string;
    long: string[];
    longEn: string[];
    longDe: string[];
  };
  units: FormationUnit[];
  generalBuff: {
    text: string;
    textEn: string;
    textDe: string;
    appliesTo: AppliesTo[];
  };
  tacticalEffects: FormationEffect[];
  lockedToCountry: true;
  /** Marks entries whose unit list hasn't been cross-verified against in-game Army Group screens yet. */
  preliminaryUnits?: boolean;
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd easytech-wiki && npx tsc --noEmit`
Expected: no errors (may show unrelated warnings but no new ones from formations).

---

## Task 2: Create `lib/formations.ts` loader

**Files:**
- Create: `lib/formations.ts`

- [ ] **Step 1: Write loader**

```typescript
import fs from "node:fs";
import path from "node:path";
import type { Formation } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "wc4", "formations");

/** Read the ordered slug list from _index.json. Falls back to filesystem scan if absent. */
export function getAllFormationSlugs(): string[] {
  if (!fs.existsSync(DATA_DIR)) return [];
  const indexPath = path.join(DATA_DIR, "_index.json");
  if (fs.existsSync(indexPath)) {
    const idx = JSON.parse(fs.readFileSync(indexPath, "utf8")) as { slugs: string[] };
    return idx.slugs;
  }
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(/\.json$/, ""));
}

/** Load one formation by slug, or null if missing. */
export function getFormation(slug: string): Formation | null {
  const file = path.join(DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as Formation;
}

/** Load all formations in their canonical display order. */
export function getAllFormations(): Formation[] {
  const slugs = getAllFormationSlugs();
  return slugs
    .map((s) => getFormation(s))
    .filter((f): f is Formation => f !== null)
    .sort((a, b) => a.order - b.order);
}

/** Resolve localized fields for a formation given a locale. */
export function localizedFormationField(
  formation: Formation,
  field: "name" | "historicalUnit" | "countryName" | "operationName",
  locale?: string,
): string {
  if (locale === "en") {
    const en = (formation as any)[`${field}En`];
    if (en) return en;
  }
  if (locale === "de") {
    const de = (formation as any)[`${field}De`];
    if (de) return de;
  }
  return (formation as any)[field] ?? "";
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd easytech-wiki && npx tsc --noEmit`
Expected: no new errors.

---

## Task 3: Create 8 formation JSON files

**Files:**
- Create: `data/wc4/formations/_index.json`
- Create: `data/wc4/formations/ghost-division.json`
- Create: `data/wc4/formations/spearhead.json`
- Create: `data/wc4/formations/taman-division.json`
- Create: `data/wc4/formations/desert-rats.json`
- Create: `data/wc4/formations/leclerc-division.json`
- Create: `data/wc4/formations/lightning-division.json`
- Create: `data/wc4/formations/grossdeutschland-division.json`
- Create: `data/wc4/formations/4th-guards-tank-division.json`

- [ ] **Step 1: Write `_index.json`**

```json
{
  "slugs": [
    "ghost-division",
    "spearhead",
    "taman-division",
    "desert-rats",
    "leclerc-division",
    "lightning-division",
    "grossdeutschland-division",
    "4th-guards-tank-division"
  ]
}
```

- [ ] **Step 2: Write each formation JSON**

**Shared base-unit roster** (used in formations 1-6 which lack screenshot-verified unit lists):
- 2 infantry: Motorized Infantry, Mechanized Infantry
- 4 tank: Light Tank, Medium Tank, Heavy Tank, Super Tank
- 4 artillery: Field Artillery, Howitzer, Rocket Artillery, Super Artillery
- (Taman Division adds: Destroyer, Cruiser — naval formation)

Set `preliminaryUnits: true` on formations 1-6 (no elite units listed — can be expanded post-launch when screenshots are collected).

Formations 7 and 8 use the exact unit lists from the Operation Mars / Operation Rumyantsev screenshots attached to the brainstorm — NO `preliminaryUnits` flag.

Content for buffs/effects is pulled directly from `stringtable_en.ini` keys `synergy_tactics_N_*` (formations 1-6) and from the attached screenshots (7-8). French + German are translations.

The full JSON for each formation is listed in Appendix A at the bottom of this plan.

- [ ] **Step 3: Verify JSON parses**

Run: `cd easytech-wiki && for f in data/wc4/formations/*.json; do node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" && echo "OK: $f" || echo "FAIL: $f"; done`
Expected: every file reports "OK".

---

## Task 4: Create `FormationScopeIcon.tsx`

**Files:**
- Create: `components/FormationScopeIcon.tsx`

- [ ] **Step 1: Write the component**

```tsx
import type { AppliesTo } from "@/lib/types";

const COLORS: Record<AppliesTo, { fg: string; bg: string; label: string }> = {
  all:       { fg: "#d4a44a", bg: "#2c2620", label: "All units" },
  infantry:  { fg: "#9bb19f", bg: "#1d2a20", label: "Infantry" },
  tank:      { fg: "#d4a44a", bg: "#2a220f", label: "Tank" },
  artillery: { fg: "#c8372d", bg: "#2a1414", label: "Artillery" },
  navy:      { fg: "#5d8ec5", bg: "#0f1f30", label: "Navy" },
  airforce:  { fg: "#a8b4c5", bg: "#1c2535", label: "Air Force" },
};

const PATH: Record<AppliesTo, JSX.Element> = {
  all: (
    <g fill="currentColor">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="14" cy="6" r="2.5" />
      <circle cx="10" cy="13" r="2.5" />
    </g>
  ),
  infantry: (
    <g fill="currentColor">
      <circle cx="10" cy="5" r="2" />
      <rect x="8" y="8" width="4" height="6" rx="0.5" />
      <rect x="5" y="9" width="3" height="1.5" rx="0.5" transform="rotate(-20 6.5 9.75)" />
      <rect x="12" y="9" width="3" height="1.5" rx="0.5" transform="rotate(20 13.5 9.75)" />
      <rect x="8" y="14" width="1.5" height="4" />
      <rect x="10.5" y="14" width="1.5" height="4" />
    </g>
  ),
  tank: (
    <g fill="currentColor">
      <rect x="3" y="11" width="14" height="4" rx="0.5" />
      <rect x="5" y="8" width="10" height="4" rx="0.8" />
      <rect x="10" y="5" width="7" height="1.5" rx="0.4" />
      <circle cx="6" cy="15.5" r="1.3" />
      <circle cx="10" cy="15.5" r="1.3" />
      <circle cx="14" cy="15.5" r="1.3" />
    </g>
  ),
  artillery: (
    <g fill="currentColor">
      <rect x="3" y="13" width="14" height="2.5" rx="0.4" />
      <rect x="6" y="10" width="8" height="4" rx="0.5" />
      <rect x="10" y="4" width="8" height="1.5" rx="0.3" transform="rotate(-25 14 4.75)" />
      <circle cx="6" cy="16" r="1.2" />
      <circle cx="14" cy="16" r="1.2" />
    </g>
  ),
  navy: (
    <g fill="currentColor" stroke="currentColor" strokeWidth="0.5">
      <path d="M2 14 L4 11 L16 11 L18 14 Z" />
      <rect x="6" y="6" width="8" height="5" rx="0.5" />
      <rect x="9" y="3" width="2" height="3" />
    </g>
  ),
  airforce: (
    <g fill="currentColor">
      <path d="M10 3 L12 11 L18 13 L12 14 L11 17 L10 14 L9 17 L8 14 L2 13 L8 11 Z" />
    </g>
  ),
};

export function FormationScopeIcon({
  scope,
  size = 20,
  withLabel = false,
}: {
  scope: AppliesTo;
  size?: number;
  withLabel?: boolean;
}) {
  const color = COLORS[scope];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wide font-semibold"
      style={{ background: color.bg, color: color.fg }}
      title={color.label}
    >
      <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" style={{ color: color.fg }}>
        {PATH[scope]}
      </svg>
      {withLabel && <span>{color.label}</span>}
    </span>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd easytech-wiki && npx tsc --noEmit`
Expected: no new errors.

---

## Task 5: Create `FormationUnitRow.tsx`

**Files:**
- Create: `components/FormationUnitRow.tsx`

- [ ] **Step 1: Write the component**

```tsx
import Image from "next/image";
import Link from "next/link";
import { getEliteUnit } from "@/lib/units";
import { UnitIcon } from "./UnitIcon";
import type { FormationUnit } from "@/lib/types";

const BASE_UNIT_LOCALES: Record<string, { fr: string; de: string }> = {
  // Fallback labels when a translation isn't provided on the unit (safety net).
};

export function FormationUnitRow({
  unit,
  locale,
}: {
  unit: FormationUnit;
  locale?: string;
}) {
  if (unit.kind === "base") {
    const label = locale === "en" ? unit.nameEn : locale === "de" ? unit.nameDe : unit.name;
    return (
      <div className="flex items-center gap-2 bg-panel/50 border border-border rounded-md px-2 py-1.5 text-sm">
        <UnitIcon category={unit.category} size={24} />
        <span className="text-text">{label}</span>
      </div>
    );
  }
  // elite unit → cross-link + sprite
  const elite = getEliteUnit(unit.slug);
  if (!elite) {
    return (
      <div className="flex items-center gap-2 bg-panel/50 border border-border rounded-md px-2 py-1.5 text-sm text-muted">
        <span className="w-6 h-6 rounded bg-bg3" />
        <span>{unit.slug}</span>
      </div>
    );
  }
  const sprite = elite.image?.sprite ?? null;
  const name = locale === "en" ? elite.nameEn ?? elite.name : elite.name;
  const eliteHref =
    locale === "fr"
      ? `/world-conqueror-4/unites-elite/${elite.slug}`
      : `/world-conqueror-4/elite-units/${elite.slug}`;
  return (
    <Link
      href={eliteHref}
      className="flex items-center gap-2 bg-panel/50 border border-border hover:border-gold/60 rounded-md px-2 py-1.5 text-sm no-underline transition-colors"
    >
      {sprite ? (
        <div className="relative w-7 h-7 rounded bg-bg3 overflow-hidden flex-shrink-0">
          <Image src={sprite} alt={name} fill sizes="28px" className="object-contain p-0.5" />
        </div>
      ) : (
        <UnitIcon category={elite.category} size={28} />
      )}
      <span className="text-gold2 font-medium">{name}</span>
    </Link>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd easytech-wiki && npx tsc --noEmit`
Expected: no new errors.

---

## Task 6: Create `FormationEffectRow.tsx`

**Files:**
- Create: `components/FormationEffectRow.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { FormationScopeIcon } from "./FormationScopeIcon";
import type { FormationEffect, AppliesTo } from "@/lib/types";

function localized(effect: FormationEffect, field: "name" | "desc", locale?: string): string {
  if (locale === "en") return (effect as any)[`${field}En`] || effect[field];
  if (locale === "de") return (effect as any)[`${field}De`] || effect[field];
  return effect[field];
}

export function FormationEffectRow({
  effect,
  locale,
}: {
  effect: FormationEffect;
  locale?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-panel/70 p-3 flex gap-3">
      <div className="flex flex-col gap-1 flex-shrink-0">
        {effect.appliesTo.map((scope) => (
          <FormationScopeIcon key={scope} scope={scope} size={18} />
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-gold2 font-semibold text-sm mb-1">{localized(effect, "name", locale)}</h4>
        <p className="text-text/90 text-sm leading-relaxed">{localized(effect, "desc", locale)}</p>
      </div>
    </div>
  );
}

export function FormationGeneralBuff({
  text,
  appliesTo,
}: {
  text: string;
  appliesTo: AppliesTo[];
}) {
  return (
    <div className="rounded-lg border border-gold/40 bg-gradient-to-br from-panel to-bg3 p-3 flex gap-3">
      <div className="flex flex-col gap-1 flex-shrink-0">
        {appliesTo.map((scope) => (
          <FormationScopeIcon key={scope} scope={scope} size={18} />
        ))}
      </div>
      <p className="text-gold2 font-medium text-sm leading-relaxed flex-1">{text}</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd easytech-wiki && npx tsc --noEmit`
Expected: no new errors.

---

## Task 7: Create `FormationCard.tsx`

**Files:**
- Create: `components/FormationCard.tsx`

- [ ] **Step 1: Write the component**

```tsx
import Link from "next/link";
import type { Formation } from "@/lib/types";
import { localizedFormationField } from "@/lib/formations";
import { COUNTRY_FLAGS } from "@/lib/units";

const SLUG_PATH: Record<string, (slug: string) => string> = {
  fr: (slug) => `/world-conqueror-4/formations-legendes/${slug}`,
  en: (slug) => `/world-conqueror-4/legend-formations/${slug}`,
  de: (slug) => `/world-conqueror-4/legend-formations/${slug}`,
};

function localized(formation: Formation, field: "short" | "shortEn" | "shortDe", locale?: string): string {
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
      <p className="text-dim text-xs leading-relaxed line-clamp-2">{localized(formation, "short", locale)}</p>
    </Link>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd easytech-wiki && npx tsc --noEmit`
Expected: no new errors.

---

## Task 8: Create `FormationsHubClient.tsx`

**Files:**
- Create: `app/[locale]/world-conqueror-4/formations-legendes/FormationsHubClient.tsx`

- [ ] **Step 1: Write the client component**

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Formation } from "@/lib/types";
import { COUNTRY_FLAGS } from "@/lib/units";
import { FormationUnitRow } from "@/components/FormationUnitRow";
import { FormationEffectRow, FormationGeneralBuff } from "@/components/FormationEffectRow";

function localized<T extends Record<string, any>>(obj: T, field: string, locale?: string): string {
  if (locale === "en" && obj[`${field}En`]) return obj[`${field}En`];
  if (locale === "de" && obj[`${field}De`]) return obj[`${field}De`];
  return obj[field] ?? "";
}

function localizedArray<T extends Record<string, any>>(obj: T, field: string, locale?: string): string[] {
  if (locale === "en" && obj[`${field}En`]?.length) return obj[`${field}En`];
  if (locale === "de" && obj[`${field}De`]?.length) return obj[`${field}De`];
  return obj[field] ?? [];
}

export function FormationsHubClient({
  formations,
  locale,
  t,
  detailHrefFor,
}: {
  formations: Formation[];
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
  detailHrefFor: (slug: string) => string;
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

  const loreShort = localized(active.lore, "short", locale);
  const unitsHeading = t.unitsInFormation;
  const generalBuffText = localized(active.generalBuff, "text", locale);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
      {/* Tab rail — horizontal on mobile, vertical on desktop */}
      <nav
        className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-6rem)]"
        aria-label={t.selectPrompt}
      >
        {formations.map((f) => {
          const isActive = f.slug === activeSlug;
          const name = localized(f, "name", locale);
          const flag = COUNTRY_FLAGS[f.country] || "🏳";
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

      {/* Active formation panel */}
      <article className="min-w-0">
        <header className="mb-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-2xl" aria-hidden="true">
              {COUNTRY_FLAGS[active.country] || "🏳"}
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-gold2 m-0">
              {localized(active, "name", locale)}
            </h2>
            {active.operationName && (
              <span className="text-xs uppercase tracking-wider bg-bg3 border border-border rounded px-2 py-0.5 text-muted">
                {localized(active, "operationName", locale)}
              </span>
            )}
          </div>
          <p className="text-sm text-muted m-0">
            <strong className="text-text">{t.historicalUnit}:</strong>{" "}
            {localized(active, "historicalUnit", locale)}
          </p>
        </header>

        <p className="text-text/90 leading-relaxed mb-5">{loreShort}</p>

        <section className="mb-5">
          <h3 className="text-gold2 font-semibold text-sm uppercase tracking-wider mb-2">
            {unitsHeading}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {active.units.map((u, i) => (
              <FormationUnitRow key={i} unit={u} locale={locale} />
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
          href={detailHrefFor(active.slug)}
          className="inline-flex items-center gap-1 text-gold2 font-semibold hover:text-gold no-underline"
        >
          {t.readFullGuide} →
        </Link>
      </article>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd easytech-wiki && npx tsc --noEmit`
Expected: no new errors.

---

## Task 9: Create hub page `app/[locale]/world-conqueror-4/formations-legendes/page.tsx`

**Files:**
- Create: `app/[locale]/world-conqueror-4/formations-legendes/page.tsx`

- [ ] **Step 1: Write the server component**

```tsx
import type { Metadata } from "next";
import { unstable_setRequestLocale, getTranslations } from "next-intl/server";
import { getAllFormations } from "@/lib/formations";
import { FormationsHubClient } from "./FormationsHubClient";
import { FormationCard } from "@/components/FormationCard";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { JsonLd } from "@/components/JsonLd";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://easytech-wiki.com";

const LOCALE_PATHS = {
  fr: "/world-conqueror-4/formations-legendes",
  en: "/world-conqueror-4/legend-formations",
  de: "/world-conqueror-4/legend-formations",
} as const;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "formations.hub" });
  const localePath = LOCALE_PATHS[locale as keyof typeof LOCALE_PATHS] ?? LOCALE_PATHS.fr;
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `${BASE_URL}/${locale}${localePath}`,
      languages: {
        fr: `${BASE_URL}/fr${LOCALE_PATHS.fr}`,
        en: `${BASE_URL}/en${LOCALE_PATHS.en}`,
        de: `${BASE_URL}/de${LOCALE_PATHS.de}`,
        "x-default": `${BASE_URL}/fr${LOCALE_PATHS.fr}`,
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `${BASE_URL}/${locale}${localePath}`,
      type: "website",
    },
  };
}

export default async function FormationsHubPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "formations.hub" });
  const formations = getAllFormations();

  const detailHrefFor = (slug: string) => {
    const localeKey = (locale === "en" || locale === "de" ? locale : "fr") as "fr" | "en" | "de";
    return `${LOCALE_PATHS[localeKey]}/${slug}`;
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("metaTitle"),
    itemListElement: formations.map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: locale === "en" ? f.nameEn : locale === "de" ? f.nameDe : f.name,
      url: `${BASE_URL}/${locale}${LOCALE_PATHS[locale as keyof typeof LOCALE_PATHS] ?? LOCALE_PATHS.fr}/${f.slug}`,
    })),
  };

  const breadcrumbs = [
    { name: "World Conqueror 4", href: "/world-conqueror-4" },
    { name: t("breadcrumb"), href: LOCALE_PATHS[locale as keyof typeof LOCALE_PATHS] ?? LOCALE_PATHS.fr },
  ];

  return (
    <>
      <TopBar />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <BreadcrumbNav items={breadcrumbs} />
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gold2 mb-2">{t("h1")}</h1>
          <p className="text-muted text-base leading-relaxed max-w-3xl">{t("intro")}</p>
        </header>

        <FormationsHubClient
          formations={formations}
          locale={locale}
          detailHrefFor={detailHrefFor}
          t={{
            selectPrompt: t("selectPrompt"),
            historicalUnit: t("historicalUnit"),
            unitsInFormation: t("unitsInFormation"),
            generalBuff: t("generalBuff"),
            tacticalEffects: t("tacticalEffects"),
            countryLock: t("countryLock"),
            readFullGuide: t("readFullGuide"),
          }}
        />

        <section className="mt-10">
          <h2 className="text-xl font-bold text-gold2 mb-3">{t("browseAll")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {formations.map((f) => (
              <FormationCard key={f.slug} formation={f} locale={locale} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <JsonLd data={itemListLd} />
    </>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd easytech-wiki && npx tsc --noEmit`
Expected: errors may surface if `JsonLd`, `BreadcrumbNav`, or `TopBar` have slightly different signatures — fix them by matching the exact imports/signatures used in `app/[locale]/world-conqueror-4/unites-elite/[slug]/page.tsx`. If `BreadcrumbNav` expects a different prop shape, update the `breadcrumbs` array accordingly.

---

## Task 10: Create detail page `app/[locale]/world-conqueror-4/formations-legendes/[slug]/page.tsx`

**Files:**
- Create: `app/[locale]/world-conqueror-4/formations-legendes/[slug]/page.tsx`

- [ ] **Step 1: Write the server component**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_setRequestLocale, getTranslations } from "next-intl/server";
import { getAllFormations, getFormation, getAllFormationSlugs, localizedFormationField } from "@/lib/formations";
import { FormationUnitRow } from "@/components/FormationUnitRow";
import { FormationEffectRow, FormationGeneralBuff } from "@/components/FormationEffectRow";
import { FormationCard } from "@/components/FormationCard";
import { COUNTRY_FLAGS } from "@/lib/units";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { JsonLd } from "@/components/JsonLd";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://easytech-wiki.com";

const LOCALE_PATHS = {
  fr: "/world-conqueror-4/formations-legendes",
  en: "/world-conqueror-4/legend-formations",
  de: "/world-conqueror-4/legend-formations",
} as const;

export async function generateStaticParams() {
  return getAllFormationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const formation = getFormation(slug);
  if (!formation) return {};
  const name = localizedFormationField(formation, "name", locale);
  const short = locale === "en" ? formation.lore.shortEn : locale === "de" ? formation.lore.shortDe : formation.lore.short;
  const t = await getTranslations({ locale, namespace: "formations.detail" });
  const localeKey = (locale === "en" || locale === "de" ? locale : "fr") as "fr" | "en" | "de";
  return {
    title: `${name} — ${t("metaTitleSuffix")}`,
    description: short,
    alternates: {
      canonical: `${BASE_URL}/${locale}${LOCALE_PATHS[localeKey]}/${slug}`,
      languages: {
        fr: `${BASE_URL}/fr${LOCALE_PATHS.fr}/${slug}`,
        en: `${BASE_URL}/en${LOCALE_PATHS.en}/${slug}`,
        de: `${BASE_URL}/de${LOCALE_PATHS.de}/${slug}`,
        "x-default": `${BASE_URL}/fr${LOCALE_PATHS.fr}/${slug}`,
      },
    },
    openGraph: {
      title: name,
      description: short,
      type: "article",
    },
  };
}

export default async function FormationDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  unstable_setRequestLocale(locale);
  const formation = getFormation(slug);
  if (!formation) notFound();

  const t = await getTranslations({ locale, namespace: "formations.detail" });
  const tHub = await getTranslations({ locale, namespace: "formations.hub" });
  const all = getAllFormations();
  const others = all.filter((f) => f.slug !== slug);

  const name = localizedFormationField(formation, "name", locale);
  const countryName = localizedFormationField(formation, "countryName", locale);
  const historicalUnit = localizedFormationField(formation, "historicalUnit", locale);
  const operationName = formation.operationName ? localizedFormationField(formation, "operationName", locale) : null;
  const short = locale === "en" ? formation.lore.shortEn : locale === "de" ? formation.lore.shortDe : formation.lore.short;
  const long = locale === "en" ? formation.lore.longEn : locale === "de" ? formation.lore.longDe : formation.lore.long;
  const generalText = locale === "en" ? formation.generalBuff.textEn : locale === "de" ? formation.generalBuff.textDe : formation.generalBuff.text;

  const localeKey = (locale === "en" || locale === "de" ? locale : "fr") as "fr" | "en" | "de";
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: name,
    description: short,
    inLanguage: locale,
    about: {
      "@type": "VideoGame",
      name: "World Conqueror 4",
    },
    url: `${BASE_URL}/${locale}${LOCALE_PATHS[localeKey]}/${slug}`,
    datePublished: "2026-04-23",
  };

  const breadcrumbs = [
    { name: "World Conqueror 4", href: "/world-conqueror-4" },
    { name: tHub("breadcrumb"), href: LOCALE_PATHS[localeKey] },
    { name, href: `${LOCALE_PATHS[localeKey]}/${slug}` },
  ];

  return (
    <>
      <TopBar />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <BreadcrumbNav items={breadcrumbs} />

        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-3xl">{COUNTRY_FLAGS[formation.country] || "🏳"}</span>
            <h1 className="text-3xl md:text-4xl font-bold text-gold2 m-0">{name}</h1>
            {operationName && (
              <span className="text-xs uppercase tracking-wider bg-bg3 border border-border rounded px-2 py-0.5 text-muted">
                {operationName}
              </span>
            )}
          </div>
          <p className="text-muted text-sm m-0">
            {countryName} · <strong className="text-text">{tHub("historicalUnit")}:</strong> {historicalUnit}
          </p>
        </header>

        <section className="mb-6">
          {long.map((para, i) => (
            <p key={i} className="text-text/90 leading-relaxed mb-3">
              {para}
            </p>
          ))}
        </section>

        <section className="mb-6">
          <h2 className="text-gold2 font-semibold text-lg uppercase tracking-wider mb-3">
            {tHub("unitsInFormation")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {formation.units.map((u, i) => (
              <FormationUnitRow key={i} unit={u} locale={locale} />
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-gold2 font-semibold text-lg uppercase tracking-wider mb-3">
            {tHub("generalBuff")}
          </h2>
          <FormationGeneralBuff text={generalText} appliesTo={formation.generalBuff.appliesTo} />
        </section>

        <section className="mb-6">
          <h2 className="text-gold2 font-semibold text-lg uppercase tracking-wider mb-3">
            {tHub("tacticalEffects")}
          </h2>
          <div className="grid gap-2">
            {formation.tacticalEffects.map((e, i) => (
              <FormationEffectRow key={i} effect={e} locale={locale} />
            ))}
          </div>
        </section>

        <p className="text-xs text-muted italic mb-8">{tHub("countryLock")}</p>

        <section className="mt-10 border-t border-border pt-6">
          <h2 className="text-xl font-bold text-gold2 mb-3">{t("otherFormations")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {others.map((f) => (
              <FormationCard key={f.slug} formation={f} locale={locale} />
            ))}
          </div>
        </section>

        <div className="mt-6">
          <Link
            href={LOCALE_PATHS[localeKey]}
            className="inline-flex items-center gap-1 text-gold2 font-semibold hover:text-gold no-underline"
          >
            ← {t("backToHub")}
          </Link>
        </div>
      </main>
      <Footer />
      <JsonLd data={articleLd} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd easytech-wiki && npx tsc --noEmit`
Expected: fix any shape mismatches for `BreadcrumbNav` or `JsonLd` by matching the imports from `unites-elite/[slug]/page.tsx`.

---

## Task 11: Add i18n pathnames to `src/i18n/config.ts`

**Files:**
- Modify: `src/i18n/config.ts`

- [ ] **Step 1: Add two new pathname entries**

Locate the `pathnames` object (around line 16) and insert these two entries in the `world-conqueror-4` section (follow the same order convention as other WC4 routes):

```typescript
  "/world-conqueror-4/formations-legendes": {
    fr: "/world-conqueror-4/formations-legendes",
    en: "/world-conqueror-4/legend-formations",
    de: "/world-conqueror-4/legend-formations",
  },
  "/world-conqueror-4/formations-legendes/[slug]": {
    fr: "/world-conqueror-4/formations-legendes/[slug]",
    en: "/world-conqueror-4/legend-formations/[slug]",
    de: "/world-conqueror-4/legend-formations/[slug]",
  },
```

- [ ] **Step 2: Verify no syntax errors**

Run: `cd easytech-wiki && npx tsc --noEmit`
Expected: no errors.

---

## Task 12: Add nav link to `lib/nav-items.ts`

**Files:**
- Modify: `lib/nav-items.ts`

- [ ] **Step 1: Add the formations link inside WC4 case**

In the `"world-conqueror-4"` case in `getNavItemsForGame`, add this item (insert after the tier-list line for visibility):

```typescript
        { href: "/world-conqueror-4/formations-legendes", label: t("nav.formations"), icon: "🎖" },
```

- [ ] **Step 2: Verify it compiles**

Run: `cd easytech-wiki && npx tsc --noEmit`
Expected: no errors.

---

## Task 13: Add translations to `messages/{fr,en,de}.json`

**Files:**
- Modify: `messages/fr.json`
- Modify: `messages/en.json`
- Modify: `messages/de.json`

- [ ] **Step 1: Add `nav.formations` key to all three files**

In each message file, inside the `nav` object, add:

- `fr.json`: `"formations": "Formations Légendaires"`
- `en.json`: `"formations": "Legend Formations"`
- `de.json`: `"formations": "Legenden-Formationen"`

- [ ] **Step 2: Add `formations` namespace at the top level of each file**

For each file, add a new top-level `"formations"` key with `hub` and `detail` sub-objects.

**fr.json:**
```json
"formations": {
  "hub": {
    "metaTitle": "Formations Légendaires — World Conqueror 4",
    "metaDescription": "Guide complet des 8 formations légendaires de WC4 : Ghost Division, Spearhead, Taman, Desert Rats, Leclerc, Lightning, Großdeutschland, 4e Garde Blindée.",
    "breadcrumb": "Formations Légendaires",
    "h1": "Formations Légendaires",
    "intro": "Les formations légendaires sont des groupes d'élite historiques que vous pouvez former dans les modes Legend, Conquête ou Groupe d'Armée. Chacune accorde un bonus général et trois effets tactiques à toutes ses unités. Explorez les 8 formations disponibles dans le jeu.",
    "selectPrompt": "Sélectionner une formation",
    "historicalUnit": "Unité historique",
    "unitsInFormation": "Unités de la formation",
    "generalBuff": "Bonus Général",
    "tacticalEffects": "Effets Tactiques",
    "countryLock": "Cette formation ne peut être constituée qu'en mode Legend, Conquête ou Groupe d'Armée, avec le pays correspondant.",
    "readFullGuide": "Lire le guide complet",
    "browseAll": "Toutes les formations"
  },
  "detail": {
    "metaTitleSuffix": "Guide Formation Légendaire WC4 | EasyTech Wiki",
    "otherFormations": "Autres formations légendaires",
    "backToHub": "Retour à toutes les formations"
  }
}
```

**en.json:**
```json
"formations": {
  "hub": {
    "metaTitle": "Legend Formations — World Conqueror 4 Guide",
    "metaDescription": "Complete guide to all 8 WC4 Legend Formations: Ghost Division, Spearhead, Taman, Desert Rats, Leclerc, Lightning, Großdeutschland, 4th Guards Tank.",
    "breadcrumb": "Legend Formations",
    "h1": "Legend Formations",
    "intro": "Legend Formations are historical elite groups you can form in Legend, Conquest, or Army Group modes. Each grants a general buff and three tactical effects to all its units. Explore the 8 formations available in World Conqueror 4.",
    "selectPrompt": "Select a formation",
    "historicalUnit": "Historical unit",
    "unitsInFormation": "Units in formation",
    "generalBuff": "General Buff",
    "tacticalEffects": "Tactical Effects",
    "countryLock": "This formation can only be formed in Legend, Conquest, or Army Group modes when you are the corresponding country.",
    "readFullGuide": "Read full guide",
    "browseAll": "All formations"
  },
  "detail": {
    "metaTitleSuffix": "WC4 Legend Formation Guide | EasyTech Wiki",
    "otherFormations": "Other legend formations",
    "backToHub": "Back to all formations"
  }
}
```

**de.json:**
```json
"formations": {
  "hub": {
    "metaTitle": "Legenden-Formationen — World Conqueror 4 Guide",
    "metaDescription": "Vollständiger Guide zu allen 8 WC4 Legenden-Formationen: Ghost Division, Spearhead, Taman, Desert Rats, Leclerc, Lightning, Großdeutschland, 4. Garde-Panzerdivision.",
    "breadcrumb": "Legenden-Formationen",
    "h1": "Legenden-Formationen",
    "intro": "Legenden-Formationen sind historische Elite-Gruppen, die Sie in den Modi Legende, Eroberung oder Heeresgruppe aufstellen können. Jede gewährt einen allgemeinen Bonus und drei taktische Effekte für alle ihre Einheiten. Entdecken Sie die 8 im Spiel verfügbaren Formationen.",
    "selectPrompt": "Formation auswählen",
    "historicalUnit": "Historische Einheit",
    "unitsInFormation": "Einheiten der Formation",
    "generalBuff": "Allgemeiner Bonus",
    "tacticalEffects": "Taktische Effekte",
    "countryLock": "Diese Formation kann nur in den Modi Legende, Eroberung oder Heeresgruppe aufgestellt werden, wenn Sie das entsprechende Land spielen.",
    "readFullGuide": "Vollständigen Guide lesen",
    "browseAll": "Alle Formationen"
  },
  "detail": {
    "metaTitleSuffix": "WC4 Legenden-Formation Guide | EasyTech Wiki",
    "otherFormations": "Weitere Legenden-Formationen",
    "backToHub": "Zurück zu allen Formationen"
  }
}
```

- [ ] **Step 3: Verify JSON parses**

Run: `cd easytech-wiki && for f in messages/*.json; do node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" && echo "OK: $f" || echo "FAIL: $f"; done`
Expected: every file reports "OK".

---

## Task 14: Add formations to `app/sitemap.ts`

**Files:**
- Modify: `app/sitemap.ts`

- [ ] **Step 1: Import formation loader**

Near the top imports:

```typescript
import { getAllFormationSlugs } from "@/lib/formations";
```

- [ ] **Step 2: Add hub entry to `staticRoutes`**

Inside the `staticRoutes` array (around line 135), add this entry right after the tier-list entry:

```typescript
    { pair: { fr: "/world-conqueror-4/formations-legendes", en: "/world-conqueror-4/legend-formations", de: "/world-conqueror-4/legend-formations" }, priority: 0.8, changeFrequency: "monthly" },
```

- [ ] **Step 3: Add detail loop**

Before `return entries;` at the bottom of the sitemap function, add:

```typescript
  // Legend Formations detail pages
  for (const slug of getAllFormationSlugs()) {
    const pair: LocalePair = {
      fr: `/world-conqueror-4/formations-legendes/${slug}`,
      en: `/world-conqueror-4/legend-formations/${slug}`,
      de: `/world-conqueror-4/legend-formations/${slug}`,
    };
    for (const locale of locales) {
      entries.push({
        url: pathFor(locale, pair),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: alternates(pair),
      });
    }
  }
```

- [ ] **Step 4: Verify types compile**

Run: `cd easytech-wiki && npx tsc --noEmit`
Expected: no errors.

---

## Task 15: Build + preview verification

**Files:** none

- [ ] **Step 1: Run full Next.js build**

Run: `cd easytech-wiki && npm run build`
Expected: exits 0, shows 8 statically generated `/world-conqueror-4/formations-legendes/[slug]` pages per locale.
If build fails, fix the reported errors (most likely: component prop shape mismatches in page.tsx; align with patterns in `unites-elite/[slug]/page.tsx`).

- [ ] **Step 2: Start dev server + preview hub page**

Start: `cd easytech-wiki && npm run dev` (in background)
Open preview at `http://localhost:3000/fr/world-conqueror-4/formations-legendes`.

Verify:
- Page loads without errors
- Left rail shows 8 formations with flags
- Clicking a tab swaps the right panel instantly (no page reload)
- URL hash updates when clicking (`#spearhead` etc.)
- Hard refresh on `#ghost-division` activates Ghost Division tab
- Unit list grid renders both base (SVG silhouette) and elite (webp thumbnail) rows
- General Buff and Tactical Effects render with scope icons
- "Browse all formations" grid at bottom shows 8 cards
- Clicking a card navigates to a detail page

- [ ] **Step 3: Preview a detail page**

Navigate to `http://localhost:3000/fr/world-conqueror-4/formations-legendes/ghost-division`.

Verify:
- Long lore paragraphs render
- Unit grid renders
- General buff + effects render
- "Other legend formations" section at bottom shows 7 cards (not itself)
- Breadcrumb shows: WC4 > Formations Légendaires > Ghost Division
- Page has valid OG tags (check page source: `<meta property="og:type" content="article">`)

- [ ] **Step 4: Switch to /en/ and /de/ locales**

Open `/en/world-conqueror-4/legend-formations` and `/de/world-conqueror-4/legend-formations`.

Verify:
- Each locale shows translated text (nav label, intro paragraph, section headings)
- URLs use correct per-locale slugs
- Hreflang alternates correct (view page source)

- [ ] **Step 5: Check nav integration**

From `/fr/world-conqueror-4/`, verify the new 🎖 Formations Légendaires link appears in the top bar / mobile drawer.

- [ ] **Step 6: Check sitemap**

Open `http://localhost:3000/sitemap.xml`.
Search for `formations-legendes` — should find 9 URLs × 3 locales = 27 entries (1 hub + 8 detail).

---

## Appendix A — Formation JSON contents

**Content source key:**
- Formations 1-6 buff/effect text: extracted from `wc4_extract/assets/stringtable_en.ini` (keys `legend_army_N`, `synergy_tactics_N_*`, `legend_intro_N*`)
- Formations 7-8 buff/effect text: transcribed from the user's provided screenshots + `WC4_April_2026_Cards_Deployment_Brief.md`
- Unit lists for formations 7-8: exact list from the screenshots
- Unit lists for formations 1-6: default preliminary roster (10 base units) — `preliminaryUnits: true`
- French + German translations: written from the English source using standard WC4 terminology conventions

### `ghost-division.json`

```json
{
  "slug": "ghost-division",
  "order": 1,
  "name": "Division Fantôme",
  "nameEn": "Ghost Division",
  "nameDe": "Gespensterdivision",
  "country": "DE",
  "countryName": "Allemagne",
  "countryNameEn": "Germany",
  "countryNameDe": "Deutschland",
  "historicalUnit": "7e Panzerdivision",
  "historicalUnitEn": "7th Panzer Division",
  "historicalUnitDe": "7. Panzer-Division",
  "lore": {
    "short": "Formation blindée commandée par Rommel, célèbre pour sa vitesse fulgurante lors de la campagne de France et de l'invasion de l'Union soviétique.",
    "shortEn": "Armored formation commanded by Rommel, famous for its lightning-fast advance in the France campaign and the invasion of the Soviet Union.",
    "shortDe": "Panzerverband unter Rommels Kommando, berühmt für seinen blitzschnellen Vormarsch im Frankreichfeldzug und beim Überfall auf die Sowjetunion.",
    "long": [
      "La 7e Panzerdivision, surnommée « Division Fantôme » en raison de la vitesse à laquelle elle apparaissait et disparaissait sur les champs de bataille, a été commandée par Erwin Rommel lors de la campagne de France de 1940. Sa progression éclair la rendit célèbre dans toute l'Europe.",
      "Lors de l'opération Barbarossa, la division participa à la Bataille d'Alytus, où elle repoussa plus de 200 chars soviétiques de la 5e division blindée et ouvrit la voie vers Vilnius, puis Moscou.",
      "Le 2 octobre 1941, lors de la phase finale de Barbarossa, la Division Fantôme perça les défenses occidentales soviétiques et contribua à l'encerclement de Viazma aux côtés de la 10e Panzerdivision."
    ],
    "longEn": [
      "The 7th Panzer Division, nicknamed the 'Ghost Division' because of how fast it appeared and vanished on the battlefield, was commanded by Erwin Rommel in the 1940 France campaign. Its lightning advance made it legendary across Europe.",
      "During Operation Barbarossa, the division fought the Battle of Alytus, where it repelled more than 200 Soviet tanks of the 5th Armored Division and opened the path to Vilnius, then Moscow.",
      "On October 2, 1941, during the final phase of Barbarossa, the Ghost Division broke through Soviet western defenses and contributed to the encirclement at Vyazma alongside the 10th Panzer Division."
    ],
    "longDe": [
      "Die 7. Panzer-Division, wegen ihrer rasanten Erscheinungs- und Verschwindens-Geschwindigkeit auf dem Schlachtfeld als 'Gespensterdivision' bekannt, stand 1940 unter dem Kommando von Erwin Rommel im Frankreichfeldzug. Ihr blitzschneller Vormarsch machte sie in ganz Europa berühmt.",
      "Während des Unternehmens Barbarossa bestritt die Division die Schlacht von Alytus, bei der sie über 200 sowjetische Panzer der 5. Panzerdivision zurückwarf und den Weg nach Vilnius und weiter nach Moskau öffnete.",
      "Am 2. Oktober 1941, in der Endphase von Barbarossa, durchbrach die Gespensterdivision die sowjetischen Westverteidigungen und trug zusammen mit der 10. Panzer-Division zum Kessel von Wjasma bei."
    ]
  },
  "units": [
    { "kind": "base", "name": "Infanterie motorisée", "nameEn": "Motorized Infantry", "nameDe": "Motorisierte Infanterie", "category": "infantry" },
    { "kind": "base", "name": "Infanterie mécanisée", "nameEn": "Mechanized Infantry", "nameDe": "Mechanisierte Infanterie", "category": "infantry" },
    { "kind": "base", "name": "Char léger", "nameEn": "Light Tank", "nameDe": "Leichter Panzer", "category": "tank" },
    { "kind": "base", "name": "Char moyen", "nameEn": "Medium Tank", "nameDe": "Mittlerer Panzer", "category": "tank" },
    { "kind": "base", "name": "Char lourd", "nameEn": "Heavy Tank", "nameDe": "Schwerer Panzer", "category": "tank" },
    { "kind": "base", "name": "Super char", "nameEn": "Super Tank", "nameDe": "Superpanzer", "category": "tank" },
    { "kind": "base", "name": "Artillerie de campagne", "nameEn": "Field Artillery", "nameDe": "Feldartillerie", "category": "artillery" },
    { "kind": "base", "name": "Obusier", "nameEn": "Howitzer", "nameDe": "Haubitze", "category": "artillery" },
    { "kind": "base", "name": "Artillerie à roquettes", "nameEn": "Rocket Artillery", "nameDe": "Raketenartillerie", "category": "artillery" },
    { "kind": "base", "name": "Super artillerie", "nameEn": "Super Artillery", "nameDe": "Superartillerie", "category": "artillery" }
  ],
  "preliminaryUnits": true,
  "generalBuff": {
    "text": "Toutes les unités de la Division Fantôme gagnent +3 en mobilité.",
    "textEn": "All Ghost Division units receive +3 mobility.",
    "textDe": "Alle Einheiten der Gespensterdivision erhalten +3 Mobilität.",
    "appliesTo": ["all"]
  },
  "tacticalEffects": [
    {
      "name": "Offensive conjointe",
      "nameEn": "Joint Offensive",
      "nameDe": "Gemeinsame Offensive",
      "desc": "Pour chaque unité alliée « Division Fantôme » dans un rayon de 2 hexagones, les unités blindées infligent 2 % de dégâts supplémentaires lors d'une attaque.",
      "descEn": "For each friendly Ghost Division unit within 2 hexes, tank units deal an additional 2% damage when attacking.",
      "descDe": "Für jede befreundete Gespensterdivision-Einheit innerhalb von 2 Feldern verursachen Panzereinheiten +2 % Schaden beim Angriff.",
      "appliesTo": ["tank"]
    },
    {
      "name": "Poursuite de l'ennemi en fuite",
      "nameEn": "Pursue the Fleeing Enemy",
      "nameDe": "Verfolgung des fliehenden Feindes",
      "desc": "Si une unité alliée « Division Fantôme » adjacente a éliminé un ennemi ce tour-ci, les unités d'infanterie peuvent se déplacer à nouveau (une fois par tour).",
      "descEn": "If an adjacent friendly Ghost Division unit has eliminated an enemy this turn, infantry units can move again (once per turn).",
      "descDe": "Wenn eine benachbarte befreundete Gespensterdivision-Einheit diese Runde einen Gegner ausgeschaltet hat, können Infanterieeinheiten erneut ziehen (einmal pro Runde).",
      "appliesTo": ["infantry"]
    },
    {
      "name": "Observation frontalière",
      "nameEn": "Frontier Observations",
      "nameDe": "Grenzbeobachtung",
      "desc": "Si une unité d'infanterie alliée « Division Fantôme » est adjacente, les unités d'artillerie infligent +10 % de dégâts.",
      "descEn": "If an adjacent friendly Ghost Division infantry unit is present, artillery units damage +10%.",
      "descDe": "Befindet sich eine benachbarte befreundete Gespensterdivision-Infanterieeinheit in der Nähe, verursachen Artillerieeinheiten +10 % Schaden.",
      "appliesTo": ["artillery"]
    }
  ],
  "lockedToCountry": true
}
```

### `spearhead.json`

```json
{
  "slug": "spearhead",
  "order": 2,
  "name": "Spearhead",
  "nameEn": "Spearhead",
  "nameDe": "Spearhead",
  "country": "US",
  "countryName": "États-Unis",
  "countryNameEn": "United States",
  "countryNameDe": "Vereinigte Staaten",
  "historicalUnit": "3e Division Blindée",
  "historicalUnitEn": "3rd Armored Division",
  "historicalUnitDe": "3. US-Panzerdivision",
  "lore": {
    "short": "Division blindée d'élite de la 1ère Armée américaine, héroïne de la Bataille des Ardennes et de l'offensive à travers l'Allemagne en 1945.",
    "shortEn": "Elite armored division of the US 1st Army, hero of the Battle of the Bulge and the 1945 offensive across Germany.",
    "shortDe": "Elite-Panzerdivision der US-1. Armee, Heldin der Ardennenoffensive und des Vormarsches durch Deutschland 1945.",
    "long": [
      "Le 16 décembre 1944, l'armée allemande lance une contre-attaque surprise dans la forêt des Ardennes. La 3e Division Blindée américaine, réserve d'élite de la 1ère Armée, est dépêchée sur le front nord.",
      "Coordonnant rapidement avec d'autres unités en plusieurs points stratégiques clés, elle lance une contre-offensive qui désorganise avec succès l'assaut allemand.",
      "En 1945, Spearhead traverse l'Allemagne comme fer de lance de la percée alliée, écrasant les dernières poches de résistance de la Wehrmacht."
    ],
    "longEn": [
      "On December 16, 1944, the German army launched a surprise counterattack in the Ardennes Forest. The U.S. 3rd Armored Division, as an elite reserve of the 1st Army, was urgently dispatched to the northern front.",
      "It quickly coordinated with other units at several key strategic points to launch a counteroffensive, successfully disrupting the German offensive.",
      "In 1945, Spearhead drove across Germany as the tip of the Allied breakthrough, crushing the last pockets of Wehrmacht resistance."
    ],
    "longDe": [
      "Am 16. Dezember 1944 startete die Wehrmacht eine überraschende Gegenoffensive im Ardennenwald. Die US-3. Panzerdivision, eine Elite-Reserve der 1. Armee, wurde umgehend an die Nordfront beordert.",
      "Sie koordinierte rasch mit anderen Einheiten an mehreren strategischen Schlüsselpunkten und leitete eine Gegenoffensive ein, die den deutschen Angriff erfolgreich zerschlug.",
      "1945 zog Spearhead als Speerspitze des alliierten Durchbruchs quer durch Deutschland und zerschlug die letzten Widerstandsnester der Wehrmacht."
    ]
  },
  "units": [
    { "kind": "base", "name": "Infanterie motorisée", "nameEn": "Motorized Infantry", "nameDe": "Motorisierte Infanterie", "category": "infantry" },
    { "kind": "base", "name": "Infanterie mécanisée", "nameEn": "Mechanized Infantry", "nameDe": "Mechanisierte Infanterie", "category": "infantry" },
    { "kind": "base", "name": "Char léger", "nameEn": "Light Tank", "nameDe": "Leichter Panzer", "category": "tank" },
    { "kind": "base", "name": "Char moyen", "nameEn": "Medium Tank", "nameDe": "Mittlerer Panzer", "category": "tank" },
    { "kind": "base", "name": "Char lourd", "nameEn": "Heavy Tank", "nameDe": "Schwerer Panzer", "category": "tank" },
    { "kind": "base", "name": "Super char", "nameEn": "Super Tank", "nameDe": "Superpanzer", "category": "tank" },
    { "kind": "base", "name": "Artillerie de campagne", "nameEn": "Field Artillery", "nameDe": "Feldartillerie", "category": "artillery" },
    { "kind": "base", "name": "Obusier", "nameEn": "Howitzer", "nameDe": "Haubitze", "category": "artillery" },
    { "kind": "base", "name": "Artillerie à roquettes", "nameEn": "Rocket Artillery", "nameDe": "Raketenartillerie", "category": "artillery" },
    { "kind": "base", "name": "Super artillerie", "nameEn": "Super Artillery", "nameDe": "Superartillerie", "category": "artillery" }
  ],
  "preliminaryUnits": true,
  "generalBuff": {
    "text": "Toutes les unités « Spearhead » gagnent +10 en attaque.",
    "textEn": "All Spearhead units attack +10.",
    "textDe": "Alle Spearhead-Einheiten erhalten +10 Angriff.",
    "appliesTo": ["all"]
  },
  "tacticalEffects": [
    {
      "name": "Coordination Infanterie-Char",
      "nameEn": "Infantry-Tank Coordination",
      "nameDe": "Infanterie-Panzer-Koordination",
      "desc": "Si une unité d'infanterie alliée « Spearhead » est adjacente, les chars gagnent +20 % de dégâts critiques.",
      "descEn": "If an adjacent friendly Spearhead infantry unit is present, tank units critical damage +20%.",
      "descDe": "Befindet sich eine benachbarte befreundete Spearhead-Infanterieeinheit in der Nähe, erhalten Panzer +20 % kritischen Schaden.",
      "appliesTo": ["tank"]
    },
    {
      "name": "Manœuvres en essaim",
      "nameEn": "Swarm Maneuvers",
      "nameDe": "Schwarmmanöver",
      "desc": "Pour chaque unité alliée « Spearhead » dans un rayon de 2 hexagones, les unités d'infanterie gagnent +2 en mobilité.",
      "descEn": "For each friendly Spearhead unit within 2 hexes, infantry units mobility +2.",
      "descDe": "Für jede befreundete Spearhead-Einheit innerhalb von 2 Feldern erhalten Infanterieeinheiten +2 Mobilität.",
      "appliesTo": ["infantry"]
    },
    {
      "name": "Soutien de position défensive",
      "nameEn": "Defensive Position Support",
      "nameDe": "Unterstützung aus Defensivstellung",
      "desc": "Si une unité alliée « Spearhead » est adjacente, les unités d'artillerie reçoivent 15 % de dégâts en moins.",
      "descEn": "If an adjacent friendly Spearhead unit is present, artillery units damage received -15%.",
      "descDe": "Befindet sich eine benachbarte befreundete Spearhead-Einheit in der Nähe, erhalten Artillerieeinheiten 15 % weniger Schaden.",
      "appliesTo": ["artillery"]
    }
  ],
  "lockedToCountry": true
}
```

### `taman-division.json`

```json
{
  "slug": "taman-division",
  "order": 3,
  "name": "Division Taman",
  "nameEn": "Taman Division",
  "nameDe": "Taman-Division",
  "country": "SU",
  "countryName": "Union soviétique",
  "countryNameEn": "Soviet Union",
  "countryNameDe": "Sowjetunion",
  "historicalUnit": "Brigade d'infanterie navale de Taman",
  "historicalUnitEn": "Taman Naval Infantry Brigade",
  "historicalUnitDe": "Marineinfanterie-Brigade Taman",
  "lore": {
    "short": "Unité d'élite d'infanterie navale de la flotte de la mer Noire, célèbre pour sa contribution à la libération de Sébastopol en mai 1944.",
    "shortEn": "Elite naval infantry unit of the Black Sea Fleet, famous for its role in liberating Sevastopol in May 1944.",
    "shortDe": "Elite-Marineinfanterieeinheit der Schwarzmeerflotte, berühmt für ihren Anteil an der Befreiung Sewastopols im Mai 1944.",
    "long": [
      "En mai 1944, la « Brigade Taman », unité d'élite de la flotte de la mer Noire sous le commandement de l'Armée côtière indépendante, participa à une offensive de représailles pour libérer Sébastopol.",
      "Cette opération défit de manière décisive le dernier bastion allemand en Crimée, vengeant l'humiliation causée par la chute de cette forteresse stratégiquement vitale en 1942.",
      "Spécialisée dans les débarquements amphibies et les combats côtiers, la division est renommée pour sa mobilité exceptionnelle entre mer et terre."
    ],
    "longEn": [
      "In May 1944, the 'Taman Brigade,' an elite unit of the Black Sea Fleet operating under the command of the Independent Coastal Army, participated in a retaliatory offensive to liberate Sevastopol.",
      "This operation decisively defeated the last German stronghold in Crimea, avenging the humiliation caused by the fall of this strategically vital fortress in 1942.",
      "Specialized in amphibious landings and coastal combat, the division is renowned for its exceptional mobility between sea and land."
    ],
    "longDe": [
      "Im Mai 1944 nahm die 'Taman-Brigade', eine Elite-Einheit der Schwarzmeerflotte unter dem Kommando der Selbständigen Küstenarmee, an einer Vergeltungsoffensive zur Befreiung Sewastopols teil.",
      "Diese Operation zerschlug endgültig die letzte deutsche Bastion auf der Krim und rächte die Demütigung durch den Fall dieser strategisch wichtigen Festung im Jahr 1942.",
      "Auf amphibische Landungen und Küstengefechte spezialisiert, ist die Division für ihre außergewöhnliche Mobilität zwischen See und Land bekannt."
    ]
  },
  "units": [
    { "kind": "base", "name": "Infanterie motorisée", "nameEn": "Motorized Infantry", "nameDe": "Motorisierte Infanterie", "category": "infantry" },
    { "kind": "base", "name": "Infanterie mécanisée", "nameEn": "Mechanized Infantry", "nameDe": "Mechanisierte Infanterie", "category": "infantry" },
    { "kind": "base", "name": "Char léger", "nameEn": "Light Tank", "nameDe": "Leichter Panzer", "category": "tank" },
    { "kind": "base", "name": "Char moyen", "nameEn": "Medium Tank", "nameDe": "Mittlerer Panzer", "category": "tank" },
    { "kind": "base", "name": "Char lourd", "nameEn": "Heavy Tank", "nameDe": "Schwerer Panzer", "category": "tank" },
    { "kind": "base", "name": "Artillerie de campagne", "nameEn": "Field Artillery", "nameDe": "Feldartillerie", "category": "artillery" },
    { "kind": "base", "name": "Obusier", "nameEn": "Howitzer", "nameDe": "Haubitze", "category": "artillery" },
    { "kind": "base", "name": "Artillerie à roquettes", "nameEn": "Rocket Artillery", "nameDe": "Raketenartillerie", "category": "artillery" },
    { "kind": "base", "name": "Destroyer", "nameEn": "Destroyer", "nameDe": "Zerstörer", "category": "navy" },
    { "kind": "base", "name": "Croiseur", "nameEn": "Cruiser", "nameDe": "Kreuzer", "category": "navy" }
  ],
  "preliminaryUnits": true,
  "generalBuff": {
    "text": "Toutes les unités terrestres de la « Division Taman » gagnent 10 % de chance d'esquive (peut être contourné par une frappe aérienne).",
    "textEn": "All Taman Division land units gain a 10% chance to dodge (can be bypassed by airstrike).",
    "textDe": "Alle Landeinheiten der Taman-Division erhalten 10 % Chance auf Ausweichen (kann durch Luftangriffe umgangen werden).",
    "appliesTo": ["all"]
  },
  "tacticalEffects": [
    {
      "name": "Opérations amphibies",
      "nameEn": "Amphibious Operations",
      "nameDe": "Amphibische Operationen",
      "desc": "Les unités terrestres alliées « Division Taman » dans un rayon de 2 hexagones d'une unité navale ignorent la pénalité de mobilité lors de l'embarquement, +2 en mobilité.",
      "descEn": "Friendly Taman Division land units within 2 hexes of another naval unit ignore the mobility penalty when embarking, mobility +2.",
      "descDe": "Befreundete Landeinheiten der Taman-Division innerhalb von 2 Feldern einer Marineeinheit ignorieren beim Einschiffen den Mobilitätsabzug und erhalten +2 Mobilität.",
      "appliesTo": ["all"]
    },
    {
      "name": "Guidage de tir",
      "nameEn": "Fire Guidance",
      "nameDe": "Feuerleitung",
      "desc": "Pour chaque unité alliée « Division Taman » dans un rayon de 2 hexagones, les unités d'artillerie gagnent +4 % de chance d'attaque critique.",
      "descEn": "For each friendly Taman Division unit within 2 hexes, artillery units critical attack chance +4%.",
      "descDe": "Für jede befreundete Taman-Division-Einheit innerhalb von 2 Feldern erhalten Artillerieeinheiten +4 % kritische Trefferchance.",
      "appliesTo": ["artillery"]
    },
    {
      "name": "Appui de puissance de feu",
      "nameEn": "Firepower Support",
      "nameDe": "Feuerunterstützung",
      "desc": "Si une unité alliée « Division Taman » est adjacente, les unités d'infanterie gagnent +1 en portée, mais -15 % de dégâts à portée maximale.",
      "descEn": "If an adjacent friendly Taman Division unit is present, infantry units range +1 but damage -15% at maximum range.",
      "descDe": "Befindet sich eine benachbarte befreundete Taman-Division-Einheit in der Nähe, erhalten Infanterieeinheiten +1 Reichweite, aber -15 % Schaden auf maximaler Reichweite.",
      "appliesTo": ["infantry"]
    }
  ],
  "lockedToCountry": true
}
```

### `desert-rats.json`

```json
{
  "slug": "desert-rats",
  "order": 4,
  "name": "Desert Rats",
  "nameEn": "Desert Rats",
  "nameDe": "Desert Rats",
  "country": "GB",
  "countryName": "Royaume-Uni",
  "countryNameEn": "United Kingdom",
  "countryNameDe": "Vereinigtes Königreich",
  "historicalUnit": "7e Division Blindée",
  "historicalUnitEn": "7th Armoured Division",
  "historicalUnitDe": "7. Panzerdivision (Britisch)",
  "lore": {
    "short": "Division blindée britannique légendaire de la campagne d'Afrique du Nord, surnommée « Rats du Désert » pour son écusson.",
    "shortEn": "Legendary British armored division of the North African campaign, nicknamed 'Desert Rats' for its emblem.",
    "shortDe": "Legendäre britische Panzerdivision des Nordafrikafeldzugs, wegen ihres Emblems 'Desert Rats' genannt.",
    "long": [
      "La 7e Division Blindée britannique s'illustra dans le désert de Libye dès 1940, luttant contre les forces italiennes puis contre l'Afrika Korps de Rommel.",
      "Son expérience unique du combat en milieu désertique, combinée à une doctrine de mobilité blindée agressive, en fit l'une des formations britanniques les plus redoutées.",
      "Après l'Afrique du Nord, les Desert Rats combattirent en Italie, en Normandie, puis en Allemagne jusqu'à la fin de la guerre."
    ],
    "longEn": [
      "The British 7th Armoured Division distinguished itself in the Libyan desert from 1940, fighting Italian forces and later Rommel's Afrika Korps.",
      "Its unique experience of desert combat, combined with an aggressive armored mobility doctrine, made it one of the most feared British formations.",
      "After North Africa, the Desert Rats fought in Italy, Normandy, then Germany until the end of the war."
    ],
    "longDe": [
      "Die britische 7. Panzerdivision zeichnete sich ab 1940 in der libyschen Wüste im Kampf gegen italienische Truppen und später Rommels Afrikakorps aus.",
      "Ihre einzigartige Erfahrung im Wüstenkampf, kombiniert mit einer aggressiven Panzermobilitätsdoktrin, machte sie zu einer der gefürchtetsten britischen Formationen.",
      "Nach Nordafrika kämpften die Desert Rats in Italien, in der Normandie und schließlich in Deutschland bis zum Kriegsende."
    ]
  },
  "units": [
    { "kind": "base", "name": "Infanterie motorisée", "nameEn": "Motorized Infantry", "nameDe": "Motorisierte Infanterie", "category": "infantry" },
    { "kind": "base", "name": "Infanterie mécanisée", "nameEn": "Mechanized Infantry", "nameDe": "Mechanisierte Infanterie", "category": "infantry" },
    { "kind": "base", "name": "Char léger", "nameEn": "Light Tank", "nameDe": "Leichter Panzer", "category": "tank" },
    { "kind": "base", "name": "Char moyen", "nameEn": "Medium Tank", "nameDe": "Mittlerer Panzer", "category": "tank" },
    { "kind": "base", "name": "Char lourd", "nameEn": "Heavy Tank", "nameDe": "Schwerer Panzer", "category": "tank" },
    { "kind": "base", "name": "Super char", "nameEn": "Super Tank", "nameDe": "Superpanzer", "category": "tank" },
    { "kind": "base", "name": "Artillerie de campagne", "nameEn": "Field Artillery", "nameDe": "Feldartillerie", "category": "artillery" },
    { "kind": "base", "name": "Obusier", "nameEn": "Howitzer", "nameDe": "Haubitze", "category": "artillery" },
    { "kind": "base", "name": "Artillerie à roquettes", "nameEn": "Rocket Artillery", "nameDe": "Raketenartillerie", "category": "artillery" },
    { "kind": "base", "name": "Super artillerie", "nameEn": "Super Artillery", "nameDe": "Superartillerie", "category": "artillery" }
  ],
  "preliminaryUnits": true,
  "generalBuff": {
    "text": "Pour toutes les unités « Desert Rats » se déplaçant sur des cases de désert, le coût de mobilité est réduit de 1.",
    "textEn": "For all Desert Rats units, when moving on desert tiles, the mobility consumption -1.",
    "textDe": "Für alle Desert-Rats-Einheiten wird der Mobilitätsverbrauch auf Wüstenfeldern um 1 reduziert.",
    "appliesTo": ["all"]
  },
  "tacticalEffects": [
    {
      "name": "Suppression d'artillerie",
      "nameEn": "Artillery Suppression",
      "nameDe": "Artillerieunterdrückung",
      "desc": "Après l'attaque d'une unité d'artillerie, les ennemis dans un rayon de 2 cases reçoivent « Suppression d'artillerie » : ils subissent 10 % de dégâts supplémentaires lorsqu'ils sont attaqués par une unité Desert Rats.",
      "descEn": "After an artillery unit attacks, enemy units within 2 tiles receive Artillery Suppression: 10% additional damage when attacked by a Desert Rats unit.",
      "descDe": "Nach dem Angriff einer Artillerieeinheit erhalten Feinde in 2 Feldern Umkreis 'Artillerieunterdrückung': 10 % Zusatzschaden, wenn sie von einer Desert-Rats-Einheit angegriffen werden.",
      "appliesTo": ["artillery"]
    },
    {
      "name": "Rôdeur blindé",
      "nameEn": "Armored Prowl",
      "nameDe": "Panzer-Pirsch",
      "desc": "Lorsqu'une unité blindée tue un ennemi sous l'effet « Suppression d'artillerie », elle gagne +2 en mobilité au tour suivant. Augmente la mobilité maximale de 20.",
      "descEn": "Whenever an armored unit kills an enemy unit having the Artillery Suppression buff, that armored unit gains +2 mobility on its next turn. Increases maximum Mobility by 20.",
      "descDe": "Wenn eine Panzereinheit einen Gegner mit dem Status 'Artillerieunterdrückung' ausschaltet, erhält sie in der nächsten Runde +2 Mobilität. Erhöht die maximale Mobilität um 20.",
      "appliesTo": ["tank"]
    },
    {
      "name": "Maintenance mécanique",
      "nameEn": "Mechanical Maintenance",
      "nameDe": "Technische Wartung",
      "desc": "À la fin de chaque tour, toute unité d'artillerie ou blindée « Desert Rats » située à une case d'une unité d'infanterie « Desert Rats » regagne 50 PV.",
      "descEn": "At the end of each turn, any Desert Rats Artillery and Armored Units within one tile of a Desert Rats Infantry Unit regain 50 HP.",
      "descDe": "Am Ende jeder Runde regenerieren alle Desert-Rats-Artillerie- und -Panzereinheiten innerhalb eines Feldes um eine Desert-Rats-Infanterieeinheit 50 LP.",
      "appliesTo": ["infantry"]
    }
  ],
  "lockedToCountry": true
}
```

### `leclerc-division.json`

```json
{
  "slug": "leclerc-division",
  "order": 5,
  "name": "Division Leclerc",
  "nameEn": "Leclerc Division",
  "nameDe": "Leclerc-Division",
  "country": "FR",
  "countryName": "France",
  "countryNameEn": "France",
  "countryNameDe": "Frankreich",
  "historicalUnit": "2e Division Blindée",
  "historicalUnitEn": "2nd Armored Division",
  "historicalUnitDe": "2. Französische Panzerdivision",
  "lore": {
    "short": "Division blindée française libre commandée par le général Leclerc, libératrice de Paris en août 1944.",
    "shortEn": "Free French armored division commanded by General Leclerc, liberator of Paris in August 1944.",
    "shortDe": "Panzerdivision der Freien Französischen Streitkräfte unter General Leclerc, Befreier von Paris im August 1944.",
    "long": [
      "Formée en Afrique et équipée par les Américains, la 2e Division Blindée française libre combat sous les ordres du général Philippe Leclerc de Hauteclocque.",
      "Le 25 août 1944, elle entre à Paris et reçoit la reddition du général allemand von Choltitz, libérant la capitale après quatre ans d'occupation.",
      "La division poursuit sa progression à travers la France, l'Alsace et l'Allemagne, culminant par la prise de Berchtesgaden en mai 1945."
    ],
    "longEn": [
      "Formed in Africa and equipped by the Americans, the Free French 2nd Armored Division fought under the command of General Philippe Leclerc de Hauteclocque.",
      "On August 25, 1944, it entered Paris and received the surrender of German General von Choltitz, liberating the capital after four years of occupation.",
      "The division continued its advance across France, Alsace, and Germany, culminating in the capture of Berchtesgaden in May 1945."
    ],
    "longDe": [
      "In Afrika aufgestellt und von den Amerikanern ausgerüstet, kämpfte die 2. Französische Panzerdivision der Freien Französischen Streitkräfte unter dem Kommando von General Philippe Leclerc de Hauteclocque.",
      "Am 25. August 1944 zog sie in Paris ein und nahm die Kapitulation des deutschen Generals von Choltitz entgegen und befreite damit die Hauptstadt nach vier Jahren Besatzung.",
      "Die Division setzte ihren Vormarsch durch Frankreich, das Elsass und Deutschland fort und erreichte im Mai 1945 ihren Höhepunkt mit der Einnahme von Berchtesgaden."
    ]
  },
  "units": [
    { "kind": "base", "name": "Infanterie motorisée", "nameEn": "Motorized Infantry", "nameDe": "Motorisierte Infanterie", "category": "infantry" },
    { "kind": "base", "name": "Infanterie mécanisée", "nameEn": "Mechanized Infantry", "nameDe": "Mechanisierte Infanterie", "category": "infantry" },
    { "kind": "base", "name": "Char léger", "nameEn": "Light Tank", "nameDe": "Leichter Panzer", "category": "tank" },
    { "kind": "base", "name": "Char moyen", "nameEn": "Medium Tank", "nameDe": "Mittlerer Panzer", "category": "tank" },
    { "kind": "base", "name": "Char lourd", "nameEn": "Heavy Tank", "nameDe": "Schwerer Panzer", "category": "tank" },
    { "kind": "base", "name": "Super char", "nameEn": "Super Tank", "nameDe": "Superpanzer", "category": "tank" },
    { "kind": "base", "name": "Artillerie de campagne", "nameEn": "Field Artillery", "nameDe": "Feldartillerie", "category": "artillery" },
    { "kind": "base", "name": "Obusier", "nameEn": "Howitzer", "nameDe": "Haubitze", "category": "artillery" },
    { "kind": "base", "name": "Artillerie à roquettes", "nameEn": "Rocket Artillery", "nameDe": "Raketenartillerie", "category": "artillery" },
    { "kind": "base", "name": "Super artillerie", "nameEn": "Super Artillery", "nameDe": "Superartillerie", "category": "artillery" }
  ],
  "preliminaryUnits": true,
  "generalBuff": {
    "text": "Après chaque attaque d'une unité « Division Leclerc », toutes les unités « Division Leclerc » dans un rayon de 2 cases reçoivent le « Serment de Restauration » pendant un tour. Serment de Restauration : ces unités ne peuvent pas être Confuses.",
    "textEn": "After all Leclerc Division units launch an attack, they grant the Restoration Oath to all Leclerc Division units within a two-tile radius for one turn. Restoration Oath: They cannot be Confused.",
    "textDe": "Nach jedem Angriff einer Leclerc-Division-Einheit erhalten alle Leclerc-Division-Einheiten in 2 Feldern Umkreis für eine Runde den 'Wiederherstellungseid'. Wiederherstellungseid: Diese Einheiten können nicht verwirrt werden.",
    "appliesTo": ["all"]
  },
  "tacticalEffects": [
    {
      "name": "Inspiration au combat",
      "nameEn": "Combat Inspiration",
      "nameDe": "Kampfinspiration",
      "desc": "Lorsqu'une unité blindée « Division Leclerc » détruit un ennemi sous l'effet du « Serment de Restauration », le moral des unités Leclerc dans un rayon de 2 cases augmente d'1 niveau. Peut se déclencher 1 fois par unité par tour.",
      "descEn": "When a Leclerc Division armored unit destroys an enemy unit while under the Restoration Oath effect, the morale of Leclerc Division units in a two-tile radius increases by 1 level. This effect can occur 1 time per unit per turn.",
      "descDe": "Wenn eine Leclerc-Panzereinheit unter dem Effekt des Wiederherstellungseides einen Feind zerstört, steigt die Moral aller Leclerc-Einheiten in 2 Feldern Umkreis um 1 Stufe. Dieser Effekt kann einmal pro Einheit und Runde auftreten.",
      "appliesTo": ["tank"]
    },
    {
      "name": "Soutien coordonné",
      "nameEn": "Coordinated Support",
      "nameDe": "Koordinierte Unterstützung",
      "desc": "Lorsque les unités d'artillerie « Division Leclerc » sous le « Serment de Restauration » attaquent une ville ou une forteresse, si une unité d'infanterie ou blindée Leclerc se trouve à une case de la cible, leurs dégâts sont augmentés de 10 %.",
      "descEn": "When Leclerc Division artillery units are under the Restoration Oath status and attack a city or fortress, if there is a Leclerc infantry or armored unit within one hex of the target, their dealt damage increases by 10%.",
      "descDe": "Wenn Leclerc-Artillerieeinheiten unter dem Wiederherstellungseid-Status eine Stadt oder Festung angreifen und sich eine Leclerc-Infanterie- oder Panzereinheit innerhalb eines Feldes vom Ziel befindet, erhöht sich ihr Schaden um 10 %.",
      "appliesTo": ["artillery"]
    },
    {
      "name": "Poursuite de soutien",
      "nameEn": "Supporting Pursuit",
      "nameDe": "Verfolgung als Unterstützung",
      "desc": "Lorsque les unités d'infanterie « Division Leclerc » attaquent sous le « Serment de Restauration », les unités Leclerc dans un rayon de 2 cases gagnent +5 en mobilité pour ce tour.",
      "descEn": "When Leclerc Division infantry units attack while under the Restoration Oath status, Leclerc Division units within 2 tiles gain +5 mobility for this turn.",
      "descDe": "Wenn Leclerc-Infanterieeinheiten unter dem Wiederherstellungseid-Status angreifen, erhalten Leclerc-Einheiten in 2 Feldern Umkreis +5 Mobilität für diese Runde.",
      "appliesTo": ["infantry"]
    }
  ],
  "lockedToCountry": true
}
```

### `lightning-division.json`

```json
{
  "slug": "lightning-division",
  "order": 6,
  "name": "Division Lightning",
  "nameEn": "Lightning Division",
  "nameDe": "Lightning-Division",
  "country": "IT",
  "countryName": "Italie",
  "countryNameEn": "Italy",
  "countryNameDe": "Italien",
  "historicalUnit": "Division Folgore",
  "historicalUnitEn": "Folgore Division",
  "historicalUnitDe": "Division Folgore",
  "lore": {
    "short": "Unité d'élite italienne renommée pour sa ténacité défensive et ses manœuvres éclairs, inspirée de la division parachutiste Folgore.",
    "shortEn": "Italian elite unit renowned for its defensive tenacity and lightning maneuvers, inspired by the Folgore paratrooper division.",
    "shortDe": "Italienische Elite-Einheit, bekannt für ihre defensive Zähigkeit und Blitzmanöver, inspiriert von der Fallschirmjäger-Division Folgore.",
    "long": [
      "La Division Folgore combattit avec distinction à El Alamein en 1942, où elle tint ses positions face à des forces britanniques largement supérieures.",
      "Surnommée « Lightning » pour la vitesse de ses contre-attaques et sa résistance défensive exceptionnelle, elle allie mobilité rapide et ténacité en retranchement.",
      "Dans le jeu, Lightning Division représente la doctrine italienne combinée : une défense inébranlable couplée à des mouvements anti-char rapides."
    ],
    "longEn": [
      "The Folgore Division fought with distinction at El Alamein in 1942, where it held its positions against overwhelmingly superior British forces.",
      "Nicknamed 'Lightning' for the speed of its counterattacks and exceptional defensive resilience, it combines rapid mobility with entrenchment tenacity.",
      "In the game, Lightning Division represents the Italian combined doctrine: unshakeable defense paired with swift anti-tank maneuvers."
    ],
    "longDe": [
      "Die Division Folgore zeichnete sich 1942 bei El Alamein aus, wo sie ihre Stellungen gegen weit überlegene britische Kräfte hielt.",
      "Wegen der Geschwindigkeit ihrer Gegenangriffe und ihrer außergewöhnlichen Defensivfähigkeit 'Lightning' genannt, verbindet sie schnelle Mobilität mit Verschanzungsbeharrlichkeit.",
      "Im Spiel verkörpert Lightning Division die kombinierte italienische Doktrin: unerschütterliche Verteidigung gepaart mit schnellen Panzerabwehrmanövern."
    ]
  },
  "units": [
    { "kind": "base", "name": "Infanterie motorisée", "nameEn": "Motorized Infantry", "nameDe": "Motorisierte Infanterie", "category": "infantry" },
    { "kind": "base", "name": "Infanterie mécanisée", "nameEn": "Mechanized Infantry", "nameDe": "Mechanisierte Infanterie", "category": "infantry" },
    { "kind": "base", "name": "Char léger", "nameEn": "Light Tank", "nameDe": "Leichter Panzer", "category": "tank" },
    { "kind": "base", "name": "Char moyen", "nameEn": "Medium Tank", "nameDe": "Mittlerer Panzer", "category": "tank" },
    { "kind": "base", "name": "Char lourd", "nameEn": "Heavy Tank", "nameDe": "Schwerer Panzer", "category": "tank" },
    { "kind": "base", "name": "Super char", "nameEn": "Super Tank", "nameDe": "Superpanzer", "category": "tank" },
    { "kind": "base", "name": "Artillerie de campagne", "nameEn": "Field Artillery", "nameDe": "Feldartillerie", "category": "artillery" },
    { "kind": "base", "name": "Obusier", "nameEn": "Howitzer", "nameDe": "Haubitze", "category": "artillery" },
    { "kind": "base", "name": "Artillerie à roquettes", "nameEn": "Rocket Artillery", "nameDe": "Raketenartillerie", "category": "artillery" },
    { "kind": "base", "name": "Super artillerie", "nameEn": "Super Artillery", "nameDe": "Superartillerie", "category": "artillery" }
  ],
  "preliminaryUnits": true,
  "generalBuff": {
    "text": "Toutes les unités « Division Lightning » qui ne se déplacent pas ce tour-ci gagnent le statut « Retranchement » à la fin du tour. (Retranchement : Défense +30 %, retiré automatiquement après un déplacement.)",
    "textEn": "All Lightning Division units that did not move this turn gain the Entrenchment status at the end of the turn. (Entrenchment: Defense +30%, automatically removed after moving.)",
    "textDe": "Alle Lightning-Division-Einheiten, die sich in dieser Runde nicht bewegt haben, erhalten am Ende der Runde den Status 'Verschanzung'. (Verschanzung: Verteidigung +30 %, wird nach einer Bewegung automatisch entfernt.)",
    "appliesTo": ["all"]
  },
  "tacticalEffects": [
    {
      "name": "Foudre céleste",
      "nameEn": "Sky Lightning",
      "nameDe": "Himmelsblitz",
      "desc": "Si un ennemi dans un rayon de 3 cases de la « Division Lightning » est attaqué par une force aérienne, la « Division Lightning » gagne +20 en attaque pour ce tour.",
      "descEn": "If an enemy within 3 tiles of the Lightning Division is attacked by an air force, the Lightning Division gains +20 Attack for this turn.",
      "descDe": "Wenn ein Feind in 3 Feldern Umkreis der Lightning-Division von Luftstreitkräften angegriffen wird, erhält die Lightning-Division für diese Runde +20 Angriff.",
      "appliesTo": ["all"]
    },
    {
      "name": "Manœuvre légère",
      "nameEn": "Light Maneuver",
      "nameDe": "Leichtes Manöver",
      "desc": "Si une unité d'infanterie « Division Lightning » ne se déplace pas ce tour-ci, alors à la fin du tour, toutes les unités « Division Lightning » dans un rayon de 2 cases gagnent +6 en mobilité au tour suivant.",
      "descEn": "If a Lightning Division infantry unit does not move during this turn, at the end of the turn, all Lightning Division units within 2 tiles gain +6 mobility for the next turn.",
      "descDe": "Wenn sich eine Lightning-Infanterieeinheit in dieser Runde nicht bewegt, erhalten am Ende der Runde alle Lightning-Einheiten in 2 Feldern Umkreis +6 Mobilität für die nächste Runde.",
      "appliesTo": ["infantry"]
    },
    {
      "name": "Tactiques anti-char",
      "nameEn": "Anti-Tank Tactics",
      "nameDe": "Panzerabwehrtaktik",
      "desc": "Lorsqu'une unité d'infanterie « Division Lightning » se trouve à moins de 2 cases d'une unité d'artillerie « Division Lightning », les dégâts infligés par l'artillerie aux unités blindées sont augmentés de 30 %.",
      "descEn": "When a Lightning Division infantry unit is within 2 tiles of a Lightning Division artillery unit, the artillery unit's damage dealt to armored units +30%.",
      "descDe": "Wenn sich eine Lightning-Infanterieeinheit in 2 Feldern Umkreis einer Lightning-Artillerieeinheit befindet, erhöht sich der Schaden der Artillerie gegen Panzereinheiten um 30 %.",
      "appliesTo": ["artillery"]
    }
  ],
  "lockedToCountry": true
}
```

### `grossdeutschland-division.json`

```json
{
  "slug": "grossdeutschland-division",
  "order": 7,
  "name": "Division Großdeutschland",
  "nameEn": "Großdeutschland Division",
  "nameDe": "Division Großdeutschland",
  "country": "DE",
  "countryName": "Allemagne",
  "countryNameEn": "Germany",
  "countryNameDe": "Deutschland",
  "operationName": "Opération Mars",
  "operationNameEn": "Operation Mars",
  "operationNameDe": "Unternehmen Mars",
  "historicalUnit": "Division d'infanterie Großdeutschland",
  "historicalUnitEn": "Großdeutschland Infantry Division",
  "historicalUnitDe": "Infanterie-Division Großdeutschland",
  "lore": {
    "short": "Division d'élite de la Wehrmacht déployée lors de l'opération Mars en 1942 contre le saillant de Rjev, réputée pour sa combinaison infanterie-blindés-artillerie.",
    "shortEn": "Wehrmacht elite division deployed during Operation Mars in 1942 against the Rzhev salient, renowned for its combined infantry-armor-artillery doctrine.",
    "shortDe": "Wehrmacht-Elite-Division im Einsatz während Unternehmen Mars 1942 gegen den Rschewer Bogen, bekannt für ihre kombinierte Infanterie-Panzer-Artillerie-Doktrin.",
    "long": [
      "La division Großdeutschland était l'une des unités d'élite les plus prestigieuses de la Heer, composée de volontaires de tout le Reich et équipée du matériel le plus moderne.",
      "Lors de l'opération Mars en novembre-décembre 1942, contre-offensive soviétique visant le saillant de Rjev, Großdeutschland fut l'une des principales formations allemandes à endiguer l'assaut de l'Armée rouge.",
      "Sa doctrine combinée d'infanterie, de blindés et d'artillerie lourde (avec des unités spéciales comme le King Tiger et le Stuka zu Fuss) en faisait une force polyvalente capable de défense féroce et de contre-attaques dévastatrices."
    ],
    "longEn": [
      "The Großdeutschland Division was one of the most prestigious elite units of the Heer, composed of volunteers from across the Reich and equipped with the most modern hardware.",
      "During Operation Mars in November-December 1942, the Soviet counteroffensive aimed at the Rzhev salient, Großdeutschland was one of the principal German formations that stemmed the Red Army's assault.",
      "Its combined infantry-armor-heavy artillery doctrine (including special units like the King Tiger and Stuka zu Fuss) made it a versatile force capable of ferocious defense and devastating counterattacks."
    ],
    "longDe": [
      "Die Division Großdeutschland zählte zu den prestigeträchtigsten Elite-Einheiten des Heeres, zusammengesetzt aus Freiwilligen des gesamten Reiches und mit modernstem Material ausgestattet.",
      "Während des Unternehmens Mars im November/Dezember 1942, der sowjetischen Gegenoffensive gegen den Rschewer Bogen, war Großdeutschland eine der zentralen deutschen Formationen, die den Angriff der Roten Armee aufhielten.",
      "Ihre kombinierte Infanterie-Panzer-Schwerartillerie-Doktrin (einschließlich Spezialeinheiten wie Königstiger und Stuka zu Fuß) machte sie zu einer vielseitigen Streitmacht, fähig zu erbitterter Verteidigung und verheerenden Gegenangriffen."
    ]
  },
  "units": [
    { "kind": "base", "name": "Infanterie motorisée", "nameEn": "Motorized Infantry", "nameDe": "Motorisierte Infanterie", "category": "infantry" },
    { "kind": "base", "name": "Infanterie mécanisée", "nameEn": "Mechanized Infantry", "nameDe": "Mechanisierte Infanterie", "category": "infantry" },
    { "kind": "base", "name": "Char léger", "nameEn": "Light Tank", "nameDe": "Leichter Panzer", "category": "tank" },
    { "kind": "base", "name": "Char moyen", "nameEn": "Medium Tank", "nameDe": "Mittlerer Panzer", "category": "tank" },
    { "kind": "base", "name": "Char lourd", "nameEn": "Heavy Tank", "nameDe": "Schwerer Panzer", "category": "tank" },
    { "kind": "base", "name": "Super char", "nameEn": "Super Tank", "nameDe": "Superpanzer", "category": "tank" },
    { "kind": "base", "name": "Artillerie de campagne", "nameEn": "Field Artillery", "nameDe": "Feldartillerie", "category": "artillery" },
    { "kind": "base", "name": "Obusier", "nameEn": "Howitzer", "nameDe": "Haubitze", "category": "artillery" },
    { "kind": "base", "name": "Artillerie à roquettes", "nameEn": "Rocket Artillery", "nameDe": "Raketenartillerie", "category": "artillery" },
    { "kind": "base", "name": "Super artillerie", "nameEn": "Super Artillery", "nameDe": "Superartillerie", "category": "artillery" },
    { "kind": "elite", "slug": "konigs-tiger" },
    { "kind": "elite", "slug": "stuka-rocket" }
  ],
  "generalBuff": {
    "text": "Toutes les unités « Division Großdeutschland » gagnent +2 en attaque par unité ennemie dans un rayon de 2 cases, jusqu'à un total de +20.",
    "textEn": "All Großdeutschland Division units gain +2 Attack for each enemy unit within 2 tiles, up to a total of +20.",
    "textDe": "Alle Einheiten der Division Großdeutschland erhalten +2 Angriff pro feindlicher Einheit in 2 Feldern Umkreis, bis zu insgesamt +20.",
    "appliesTo": ["all"]
  },
  "tacticalEffects": [
    {
      "name": "Garnison d'élite",
      "nameEn": "Elite Garrison",
      "nameDe": "Elite-Garnison",
      "desc": "Si une unité d'infanterie « Großdeutschland » est à une case d'une unité d'artillerie ou blindée « Großdeutschland », à la fin du tour, toutes les unités Großdeutschland dans un rayon d'une case gagnent le statut « Garnison » pour un tour. (Garnison : pour chaque unité alliée à une case, Défense +3, Dégâts de contre-attaque +3 %.)",
      "descEn": "If a Großdeutschland infantry unit is within 1 tile of a Großdeutschland artillery or armored unit, at the end of the turn, all Großdeutschland units within 1 tile gain a 1-turn Garrison buff. (Garrison: For each friendly unit within 1 tile, Defense +3, Counterattack Damage +3%.)",
      "descDe": "Wenn sich eine Großdeutschland-Infanterieeinheit innerhalb eines Feldes einer Großdeutschland-Artillerie- oder Panzereinheit befindet, erhalten am Ende der Runde alle Großdeutschland-Einheiten innerhalb eines Feldes für eine Runde den 'Garnison'-Bonus. (Garnison: Pro verbündeter Einheit im Feldumkreis Verteidigung +3, Gegenangriffsschaden +3 %.)",
      "appliesTo": ["infantry", "tank", "artillery"]
    },
    {
      "name": "Percée blindée",
      "nameEn": "Armored Breakthrough",
      "nameDe": "Panzerdurchbruch",
      "desc": "Lorsqu'une unité blindée « Großdeutschland » est à une case d'une unité d'infanterie « Großdeutschland » et attaque, s'il ne reste aucun ennemi dans un rayon de 2 cases après l'attaque, toutes les unités « Großdeutschland » dans un rayon de 2 cases gagnent +5 en mobilité pour ce tour. (Non cumulable.)",
      "descEn": "When a Großdeutschland armored unit is within 1 tile of a Großdeutschland infantry unit, if there are no enemy units within 2 tiles after attacking, all Großdeutschland units within 2 tiles gain +5 mobility for this turn. (Cannot stack.)",
      "descDe": "Wenn eine Großdeutschland-Panzereinheit innerhalb eines Feldes einer Großdeutschland-Infanterieeinheit angreift und sich danach keine Feinde in 2 Feldern Umkreis befinden, erhalten alle Großdeutschland-Einheiten in 2 Feldern Umkreis +5 Mobilität für diese Runde. (Nicht stapelbar.)",
      "appliesTo": ["tank"]
    },
    {
      "name": "Étourdissement par la puissance de feu",
      "nameEn": "Firepower Stun",
      "nameDe": "Feuerkraft-Betäubung",
      "desc": "Si une unité d'artillerie « Großdeutschland » est dans un rayon de 2 cases d'une unité blindée « Großdeutschland », toute attaque de cette artillerie applique un étourdissement d'un tour à la cible. (Étourdissement : -3 en mobilité pour le tour en cours, cumulable jusqu'à trois fois.)",
      "descEn": "If a Großdeutschland artillery unit is within 2 tiles of a Großdeutschland armored unit, any attack made by this artillery unit applies a one-turn Stun buff to the target. (Stun: -3 mobility for the current turn, stackable up to three times.)",
      "descDe": "Wenn sich eine Großdeutschland-Artillerieeinheit in 2 Feldern Umkreis einer Großdeutschland-Panzereinheit befindet, wendet jeder Angriff dieser Artillerie einen 1-Runden-'Betäubungs'-Effekt auf das Ziel an. (Betäubung: -3 Mobilität für die aktuelle Runde, bis zu dreimal stapelbar.)",
      "appliesTo": ["artillery"]
    }
  ],
  "lockedToCountry": true
}
```

### `4th-guards-tank-division.json`

```json
{
  "slug": "4th-guards-tank-division",
  "order": 8,
  "name": "4e Division Blindée de la Garde",
  "nameEn": "4th Guards Tank Division",
  "nameDe": "4. Garde-Panzerdivision",
  "country": "SU",
  "countryName": "Union soviétique",
  "countryNameEn": "Soviet Union",
  "countryNameDe": "Sowjetunion",
  "operationName": "Opération Roumiantsev",
  "operationNameEn": "Operation Rumyantsev",
  "operationNameDe": "Unternehmen Rumjanzew",
  "historicalUnit": "4e Corps Blindé de la Garde",
  "historicalUnitEn": "4th Guards Tank Corps",
  "historicalUnitDe": "4. Garde-Panzerkorps",
  "lore": {
    "short": "Formation blindée soviétique d'élite engagée lors de l'opération Roumiantsev en août 1943, qui libéra Belgorod et Kharkov.",
    "shortEn": "Soviet elite armored formation engaged during Operation Rumyantsev in August 1943, which liberated Belgorod and Kharkov.",
    "shortDe": "Sowjetische Elite-Panzerformation, eingesetzt während Unternehmen Rumjanzew im August 1943, die Belgorod und Charkow befreite.",
    "long": [
      "L'opération Roumiantsev (3-23 août 1943) fut la deuxième phase de la grande offensive soviétique de l'été 1943, succédant à la bataille de Koursk.",
      "La 4e Division Blindée de la Garde, unité d'élite de l'Armée rouge, fut l'un des fers de lance de cette offensive qui brisa les défenses allemandes autour de Belgorod et aboutit à la libération de Kharkov le 23 août.",
      "Équipée des nouveaux chars T-44 et IS-3, la division combinait puissance blindée, coordination artillerie-infanterie et capacité de percée stratégique à grande échelle."
    ],
    "longEn": [
      "Operation Rumyantsev (August 3-23, 1943) was the second phase of the great Soviet summer offensive of 1943, following the Battle of Kursk.",
      "The 4th Guards Tank Division, an elite unit of the Red Army, was one of the spearheads of this offensive, which broke through the German defenses around Belgorod and resulted in the liberation of Kharkov on August 23.",
      "Equipped with the new T-44 and IS-3 tanks, the division combined armored power, artillery-infantry coordination, and large-scale strategic breakthrough capability."
    ],
    "longDe": [
      "Unternehmen Rumjanzew (3. bis 23. August 1943) bildete die zweite Phase der großen sowjetischen Sommeroffensive 1943 nach der Schlacht im Kursker Bogen.",
      "Die 4. Garde-Panzerdivision, eine Elite-Einheit der Roten Armee, war eine der Speerspitzen dieser Offensive, die die deutschen Verteidigungslinien um Belgorod durchbrach und am 23. August zur Befreiung Charkows führte.",
      "Ausgerüstet mit den neuen Panzern T-44 und IS-3, kombinierte die Division Panzerkraft, Artillerie-Infanterie-Koordination und großräumige strategische Durchbruchsfähigkeit."
    ]
  },
  "units": [
    { "kind": "base", "name": "Infanterie motorisée", "nameEn": "Motorized Infantry", "nameDe": "Motorisierte Infanterie", "category": "infantry" },
    { "kind": "base", "name": "Infanterie mécanisée", "nameEn": "Mechanized Infantry", "nameDe": "Mechanisierte Infanterie", "category": "infantry" },
    { "kind": "base", "name": "Char léger", "nameEn": "Light Tank", "nameDe": "Leichter Panzer", "category": "tank" },
    { "kind": "base", "name": "Char moyen", "nameEn": "Medium Tank", "nameDe": "Mittlerer Panzer", "category": "tank" },
    { "kind": "base", "name": "Char lourd", "nameEn": "Heavy Tank", "nameDe": "Schwerer Panzer", "category": "tank" },
    { "kind": "base", "name": "Super char", "nameEn": "Super Tank", "nameDe": "Superpanzer", "category": "tank" },
    { "kind": "base", "name": "Artillerie de campagne", "nameEn": "Field Artillery", "nameDe": "Feldartillerie", "category": "artillery" },
    { "kind": "base", "name": "Obusier", "nameEn": "Howitzer", "nameDe": "Haubitze", "category": "artillery" },
    { "kind": "base", "name": "Artillerie à roquettes", "nameEn": "Rocket Artillery", "nameDe": "Raketenartillerie", "category": "artillery" },
    { "kind": "base", "name": "Super roquette", "nameEn": "Super Rocket", "nameDe": "Super-Rakete", "category": "artillery" },
    { "kind": "elite", "slug": "t-44" },
    { "kind": "elite", "slug": "is-3" }
  ],
  "generalBuff": {
    "text": "Au début du tour, chaque unité de la « 4e Division Blindée de la Garde » gagne +2 en mobilité pour ce tour, pour chaque autre unité de la 4e Division Blindée de la Garde dans un rayon d'une case, jusqu'à un maximum de +6.",
    "textEn": "At the start of the turn, each 4th Guards Tank Division unit gains +2 mobility for this turn for each other 4th Guards Tank Division unit within 1 tile, up to a maximum of +6.",
    "textDe": "Zu Beginn der Runde erhält jede Einheit der 4. Garde-Panzerdivision +2 Mobilität für diese Runde pro weiterer Einheit der 4. Garde-Panzerdivision innerhalb eines Feldes, bis zu maximal +6.",
    "appliesTo": ["all"]
  },
  "tacticalEffects": [
    {
      "name": "Reconnaissance de tir",
      "nameEn": "Fire Reconnaissance",
      "nameDe": "Feueraufklärung",
      "desc": "Lorsqu'une unité d'infanterie de la « 4e Division Blindée de la Garde » attaque, toutes les unités blindées de la division dans un rayon de 2 cases gagnent un « Préparation de tir » d'un tour. (Préparation de tir : augmente les dégâts de la prochaine attaque de 40 % et expire immédiatement après.)",
      "descEn": "When an infantry unit of the 4th Guards Tank Division attacks, any armored units of the 4th Guards Tank Division within 2 tiles gain a 1-turn Fire Preparation buff. (Fire Preparation: Increases the damage of the next attack by 40% and expires immediately after.)",
      "descDe": "Wenn eine Infanterieeinheit der 4. Garde-Panzerdivision angreift, erhalten alle Panzereinheiten der 4. Garde-Panzerdivision in 2 Feldern Umkreis für eine Runde 'Feuervorbereitung'. (Feuervorbereitung: Erhöht den Schaden des nächsten Angriffs um 40 % und läuft unmittelbar danach ab.)",
      "appliesTo": ["infantry", "tank"]
    },
    {
      "name": "Ralliement de percée",
      "nameEn": "Breakthrough Rally",
      "nameDe": "Durchbruchs-Sammlung",
      "desc": "Lorsqu'une unité blindée de la « 4e Division Blindée de la Garde » élimine un ennemi, elle accorde un buff « Ralliement » à toutes les unités de la division dans un rayon de 2 cases pendant un tour. (Ralliement : distribue 30 % des dégâts reçus aux unités voisines de la 4e Division Blindée de la Garde. Ne peut pas être ciblé par Déflexion balistique.)",
      "descEn": "Whenever an armored unit of the 4th Guards Tank Division eliminates an enemy, it grants a Rally buff to all 4th Guards Tank Division units within a two-tile radius for one turn. (Rally: Distributes 30% of the damage it receives to surrounding 4th Guards Tank Division units. Cannot be targeted by Ballistic Deflection.)",
      "descDe": "Wenn eine Panzereinheit der 4. Garde-Panzerdivision einen Gegner ausschaltet, erhalten alle Einheiten der Division in 2 Feldern Umkreis für eine Runde den 'Sammlungs'-Effekt. (Sammlung: Verteilt 30 % des erhaltenen Schadens auf umliegende Einheiten der 4. Garde-Panzerdivision. Kann nicht durch ballistische Ablenkung beeinflusst werden.)",
      "appliesTo": ["tank"]
    },
    {
      "name": "Préparation d'artillerie",
      "nameEn": "Artillery Preparation",
      "nameDe": "Artillerievorbereitung",
      "desc": "Après l'attaque d'une unité d'artillerie de la « 4e Division Blindée de la Garde », toute unité ennemie à une case de la cible reçoit un statut « Désorganisé » d'un tour. (Désorganisé : à chaque fois que ces unités sont attaquées par l'infanterie ou les chars de la 4e Division Blindée de la Garde, leur moral diminue d'un niveau. L'effet disparaît alors et ne peut être réappliqué ce tour-ci.)",
      "descEn": "After an artillery unit of the 4th Guards Tank Division attacks, any enemy units within one tile of the target receive a one-turn Disorganized status. (Disorganized: Whenever these units are attacked by infantry or tank units of the 4th Guards Tank Division, their morale is reduced by 1 level. The effect then ends once triggered and cannot be reapplied this turn.)",
      "descDe": "Nach dem Angriff einer Artillerieeinheit der 4. Garde-Panzerdivision erhalten alle feindlichen Einheiten innerhalb eines Feldes um das Ziel für eine Runde den Status 'Desorganisiert'. (Desorganisiert: Jedes Mal, wenn diese Einheiten von Infanterie- oder Panzereinheiten der 4. Garde-Panzerdivision angegriffen werden, sinkt ihre Moral um eine Stufe. Der Effekt endet danach und kann in dieser Runde nicht erneut angewendet werden.)",
      "appliesTo": ["artillery"]
    }
  ],
  "lockedToCountry": true
}
```

---

## Self-Review Summary

**Spec coverage:** All 4 sections of the spec are covered:
- §1 Data model → Tasks 1, 3
- §2 Routes & files → Tasks 8-10, 11
- §3 UI/UX → Tasks 4-10
- §4 SEO → Tasks 9, 10, 13, 14

**Skipped from spec:**
- "Internal linking from general/elite-unit pages" — out of scope for v1 (too many edit points, can be follow-up)
- "WC4 hub page feature card" — minor, can be follow-up (nav link already surfaces it)
- OG images per formation — spec called this out as follow-up

**Placeholder scan:** No TBDs in task steps. Data files use `preliminaryUnits: true` as a legit data-confidence flag, not a placeholder.

**Type consistency:** `Formation`, `FormationEffect`, `FormationUnit`, `AppliesTo` defined in Task 1, used consistently in Tasks 2-10.
