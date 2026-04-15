# Chunk 3 — Comparator, Technologies, Guides

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the remaining roadmap items from `PLAN-next-sections.md` — unit and general comparators, the Technologies section with extracted tech-tree data, and the Guides infrastructure (MDX + first three "getting started" guides).

**Architecture:**
- **Comparator:** single canonical route per type (`/comparateur/unites`, `/comparateur/generaux`) with URL-persisted state (`?left=X&right=Y&third=Z`), plus prerendered matchup pages (`/comparateur/unites/[matchup]`) for SEO long-tail. Client component for the picker, server component for the matchup page.
- **Technologies:** new data pipeline extracts `TechnologySettings.json` + `TechResearchSettings.json` to `data/wc4/technologies/*.json` mirroring the existing generals/skills shape. Three routes: hub (category grid), category page (tree view using APK `Position[x,y]`), detail page. Full i18n + JSON-LD.
- **Guides:** MDX-based content directory at `content/guides/wc4/*.mdx` with front-matter; `lib/guides.ts` reads front-matter at build time; routes `/guides` (hub) + `/guides/[slug]` (article). FAQPage JSON-LD for rich snippets. Ship 3 starter guides in this chunk.

**Tech Stack:** Existing (Next.js 14 App Router, TypeScript strict, Tailwind, next-intl) + new deps `recharts` (comparator radar), `@next/mdx` + `remark-gfm` + `rehype-slug` + `rehype-autolink-headings` (guides), `gray-matter` (front-matter parsing).

**Scope boundary — what's NOT in this chunk:**
- EW7 / GCR game sections (still greyed in nav)
- Scenarios and Conquests pages (still greyed)
- Analytics / Plausible integration
- Custom domain migration
- Image CDN optimization
- Progressive enhancement for offline search

---

## File Structure

**New files:**
- `scripts/build-tech-index.py` — extract Technology/TechResearch/stringtable → `data/wc4/technologies/*.json`
- `data/wc4/technologies/_index.json` + per-tech JSONs (191 expected)
- `lib/tech.ts` — loader (`getAllTech`, `getTechByCategory`, `getTechBySlug`, `getTechTree`)
- `lib/compare.ts` — helpers (`pickBest`, `diffClass`, `normalizeStats`)
- `lib/guides.ts` — MDX front-matter reader (`getAllGuides`, `getGuide`)
- `components/ComparatorShell.tsx` — URL state ↔ picker
- `components/ComparatorTable.tsx` — tableau with diff coloring
- `components/ComparatorRadar.tsx` — Recharts wrapper
- `components/TechTreeGrid.tsx` — x/y positioned tree
- `components/TechCard.tsx` — tech node
- `components/GuideLayout.tsx` — TOC, reading time, lastReviewed, related
- `components/GuideFAQ.tsx` — accordion + FAQPage JSON-LD
- `app/[locale]/world-conqueror-4/comparateur/unites/page.tsx`
- `app/[locale]/world-conqueror-4/comparateur/unites/[matchup]/page.tsx`
- `app/[locale]/world-conqueror-4/comparateur/generaux/page.tsx`
- `app/[locale]/world-conqueror-4/technologies/page.tsx`
- `app/[locale]/world-conqueror-4/technologies/[category]/page.tsx`
- `app/[locale]/world-conqueror-4/technologies/[slug]/page.tsx`
- `app/[locale]/guides/page.tsx`
- `app/[locale]/world-conqueror-4/guides/page.tsx`
- `app/[locale]/world-conqueror-4/guides/[slug]/page.tsx`
- `content/guides/wc4/*.mdx` (3 seed files)

**Modified files:**
- `src/i18n/config.ts` — add `comparateur/*`, `technologies/*`, `guides/*` localized pathnames
- `messages/{fr,en}.json` — add `comparatorPage`, `techPage`, `guidesPage`, `nav.comparator`, `nav.technologies`, `nav.guides` namespaces
- `lib/types.ts` — add `Tech`, `TechTreeNode`, `GuideFrontmatter`, `Comparable` interfaces
- `components/TopBar.tsx` — enable "Guides" nav link (currently "soon")
- `app/[locale]/world-conqueror-4/page.tsx` — enable Technologies sidebar link
- `app/sitemap.ts` — add comparator, technology, guide URLs
- `public/search-index.json` (regenerated via `scripts/build-search-index.ts`) — include techs + guides
- `next.config.mjs` — wire MDX plugin
- `package.json` — new deps

---

## Phase A — Unit Comparator

### Task A1: Install Recharts and scaffold compare helpers

**Files:**
- Modify: `package.json`
- Create: `lib/compare.ts`
- Modify: `lib/types.ts`

- [ ] **Step 1: Install Recharts**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm install recharts@^2.15.0
```

- [ ] **Step 2: Add `Comparable` and `DiffClass` types to `lib/types.ts`**

Append to the end of `lib/types.ts`:

```typescript
// ─── COMPARATOR ───────────────────────────────────────────────────────

export type DiffClass = "best" | "worst" | "neutral";

/** One normalized row in a comparator table. */
export interface ComparableRow {
  /** Stable identifier for React key + URL param. */
  id: string;
  /** Locale-agnostic display name. */
  name: string;
  /** Locale-FR display name. */
  nameFr: string;
  /** Category / faction / tier for grouping. */
  category?: string;
  /** Stats map: label → numeric value, comparable across rows. */
  stats: Record<string, number | null>;
  /** Link to the detail page. */
  href: { fr: string; en: string };
}
```

- [ ] **Step 3: Create `lib/compare.ts`**

```typescript
import type { ComparableRow, DiffClass } from "./types";

/**
 * For a given stat key, classify each row as "best", "worst", or "neutral"
 * by comparing against the other rows. Ties collapse to "neutral".
 */
export function diffClass(
  key: string,
  rowId: string,
  rows: ComparableRow[],
): DiffClass {
  const values = rows
    .map((r) => r.stats[key])
    .filter((v): v is number => typeof v === "number");
  if (values.length < 2) return "neutral";
  const mine = rows.find((r) => r.id === rowId)?.stats[key];
  if (typeof mine !== "number") return "neutral";
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === min) return "neutral";
  if (mine === max) return "best";
  if (mine === min) return "worst";
  return "neutral";
}

/**
 * Normalize all rows' stats to 0–100 for a radar chart. The max across
 * all rows for each key becomes 100; other rows are scaled proportionally.
 */
export function normalizeStats(rows: ComparableRow[]): ComparableRow[] {
  if (rows.length === 0) return rows;
  const allKeys = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r.stats)) allKeys.add(k);
  const maxByKey: Record<string, number> = {};
  for (const k of allKeys) {
    const vals = rows.map((r) => r.stats[k]).filter((v): v is number => typeof v === "number");
    maxByKey[k] = vals.length ? Math.max(...vals) : 1;
  }
  return rows.map((r) => {
    const normalized: Record<string, number | null> = {};
    for (const k of allKeys) {
      const v = r.stats[k];
      if (typeof v !== "number") normalized[k] = null;
      else normalized[k] = Math.round((v / (maxByKey[k] || 1)) * 100);
    }
    return { ...r, stats: normalized };
  });
}
```

- [ ] **Step 4: Type check**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npx tsc --noEmit 2>&1 | tail -5
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add package.json package-lock.json lib/compare.ts lib/types.ts
git commit -m "feat(compare): scaffold comparator helpers + install recharts"
```

### Task A2: ComparatorShell — URL state picker

**Files:**
- Create: `components/ComparatorShell.tsx`
- Create: `components/ComparatorTable.tsx`
- Create: `components/ComparatorRadar.tsx`

- [ ] **Step 1: Create `ComparatorShell.tsx` (client)**

```tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "@/src/i18n/navigation";
import type { ComparableRow } from "@/lib/types";

export interface ComparatorShellProps {
  allRows: ComparableRow[];
  initialIds: string[];
  maxSlots?: number;
  children: (rows: ComparableRow[]) => React.ReactNode;
}

/**
 * Generic 2–4 slot comparator with URL-persisted state.
 * URL shape: ?left=abrams&right=leopard-2&third=t-14
 * Children receives the resolved rows (in slot order).
 */
export default function ComparatorShell({
  allRows,
  initialIds,
  maxSlots = 4,
  children,
}: ComparatorShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ids, setIds] = useState<string[]>(
    initialIds.length > 0 ? initialIds : [allRows[0]?.id ?? ""],
  );

  useEffect(() => {
    const params = new URLSearchParams();
    const keys = ["left", "right", "third", "fourth"] as const;
    ids.forEach((id, i) => {
      if (id && keys[i]) params.set(keys[i], id);
    });
    const qs = params.toString();
    // @ts-expect-error — dynamic query string update; pathname is typed
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
  }, [ids, pathname, router]);

  const setAt = useCallback((slot: number, id: string) => {
    setIds((prev) => {
      const next = [...prev];
      while (next.length <= slot) next.push("");
      next[slot] = id;
      return next.slice(0, maxSlots);
    });
  }, [maxSlots]);

  const addSlot = useCallback(() => {
    setIds((prev) => (prev.length < maxSlots ? [...prev, allRows[0]?.id ?? ""] : prev));
  }, [allRows, maxSlots]);

  const removeSlot = useCallback((slot: number) => {
    setIds((prev) => prev.filter((_, i) => i !== slot));
  }, []);

  const selected = ids
    .map((id) => allRows.find((r) => r.id === id))
    .filter((r): r is ComparableRow => r !== undefined);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ids.map((id, slot) => (
          <select
            key={slot}
            value={id}
            onChange={(e) => setAt(slot, e.target.value)}
            className="bg-bg3 border border-border rounded-md px-3 py-2 text-sm text-ink"
          >
            {allRows.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        ))}
        {ids.length < maxSlots && (
          <button
            type="button"
            onClick={addSlot}
            className="px-3 py-2 border border-border rounded-md text-sm text-gold2 hover:bg-gold/10"
          >
            +
          </button>
        )}
        {ids.length > 1 && (
          <button
            type="button"
            onClick={() => removeSlot(ids.length - 1)}
            className="px-3 py-2 border border-border rounded-md text-sm text-dim hover:text-red-400"
          >
            −
          </button>
        )}
      </div>
      {children(selected)}
    </div>
  );
}
```

- [ ] **Step 2: Create `ComparatorTable.tsx`**

```tsx
import type { ComparableRow, DiffClass } from "@/lib/types";
import { diffClass } from "@/lib/compare";

interface ComparatorTableProps {
  rows: ComparableRow[];
  statLabels: Record<string, string>;
}

const CLASS_MAP: Record<DiffClass, string> = {
  best: "bg-emerald-500/20 text-emerald-200",
  worst: "bg-red-500/20 text-red-200",
  neutral: "",
};

export function ComparatorTable({ rows, statLabels }: ComparatorTableProps) {
  if (rows.length === 0) return null;
  const statKeys = Object.keys(statLabels);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left text-muted text-[10px] uppercase tracking-widest p-3 border-b border-border">
              &nbsp;
            </th>
            {rows.map((r) => (
              <th
                key={r.id}
                className="text-left text-gold2 font-bold p-3 border-b border-border"
              >
                {r.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {statKeys.map((key) => (
            <tr key={key}>
              <td className="p-3 text-muted text-[11px] uppercase tracking-widest">
                {statLabels[key]}
              </td>
              {rows.map((r) => {
                const v = r.stats[key];
                const cls = typeof v === "number" ? diffClass(key, r.id, rows) : "neutral";
                return (
                  <td
                    key={r.id}
                    className={`p-3 tabular-nums font-semibold ${CLASS_MAP[cls]}`}
                  >
                    {typeof v === "number" ? v : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Create `ComparatorRadar.tsx`**

```tsx
"use client";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { normalizeStats } from "@/lib/compare";
import type { ComparableRow } from "@/lib/types";

interface Props {
  rows: ComparableRow[];
  statLabels: Record<string, string>;
}

const COLORS = ["#d4a44a", "#c8372d", "#6bcb77", "#4d96ff"];

export function ComparatorRadar({ rows, statLabels }: Props) {
  if (rows.length === 0) return null;
  const normalized = normalizeStats(rows);
  const statKeys = Object.keys(statLabels);
  const data = statKeys.map((k) => {
    const point: Record<string, string | number> = { stat: statLabels[k] };
    normalized.forEach((r) => {
      point[r.name] = typeof r.stats[k] === "number" ? (r.stats[k] as number) : 0;
    });
    return point;
  });
  return (
    <div className="w-full h-[340px]">
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid stroke="#3a3a3a" />
          <PolarAngleAxis dataKey="stat" stroke="#a0a0a0" fontSize={11} />
          <PolarRadiusAxis stroke="#3a3a3a" fontSize={10} />
          {rows.map((r, i) => (
            <Radar
              key={r.id}
              name={r.name}
              dataKey={r.name}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.2}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 4: Type-check**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npx tsc --noEmit 2>&1 | tail -5
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add components/ComparatorShell.tsx components/ComparatorTable.tsx components/ComparatorRadar.tsx
git commit -m "feat(compare): shell, table, and radar components"
```

### Task A3: Unit comparator pages + pathnames + nav

**Files:**
- Modify: `src/i18n/config.ts`
- Modify: `messages/fr.json`, `messages/en.json`
- Create: `app/[locale]/world-conqueror-4/comparateur/unites/page.tsx`
- Create: `app/[locale]/world-conqueror-4/comparateur/unites/[matchup]/page.tsx`

- [ ] **Step 1: Add pathname entries**

In `src/i18n/config.ts`, add to `pathnames`:

```typescript
"/world-conqueror-4/comparateur": {
  fr: "/world-conqueror-4/comparateur",
  en: "/world-conqueror-4/comparator",
},
"/world-conqueror-4/comparateur/unites": {
  fr: "/world-conqueror-4/comparateur/unites",
  en: "/world-conqueror-4/comparator/units",
},
"/world-conqueror-4/comparateur/unites/[matchup]": {
  fr: "/world-conqueror-4/comparateur/unites/[matchup]",
  en: "/world-conqueror-4/comparator/units/[matchup]",
},
"/world-conqueror-4/comparateur/generaux": {
  fr: "/world-conqueror-4/comparateur/generaux",
  en: "/world-conqueror-4/comparator/generals",
},
```

- [ ] **Step 2: Add i18n keys**

In both `messages/fr.json` and `messages/en.json`, add under `nav`:

```json
"comparator": "Comparateur" / "Comparator"
```

And new top-level `comparatorPage` namespace with keys: `hubTitle`, `hubIntro`, `unitsTitle`, `unitsIntro`, `generalsTitle`, `generalsIntro`, `pickPrompt`, `statsHeading`, `radarHeading`, `shareLink`, `copyLink`, `matchupTitle`, `matchupDescription`, `seoTitle`, `seoDescription`.

(Full key copy is left to the implementer — keep consistent with existing pages' tone.)

- [ ] **Step 3: Create the unit comparator page**

Create `app/[locale]/world-conqueror-4/comparateur/unites/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import ComparatorShell from "@/components/ComparatorShell";
import { ComparatorTable } from "@/components/ComparatorTable";
import { ComparatorRadar } from "@/components/ComparatorRadar";
import { getAllEliteUnits } from "@/lib/units";
import { locales, type Locale } from "@/src/i18n/config";
import type { Metadata } from "next";
import type { ComparableRow } from "@/lib/types";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "comparatorPage" });
  return {
    title: t("seoTitle"),
    description: t("seoDescription"),
    alternates: {
      canonical: locale === "fr"
        ? "/fr/world-conqueror-4/comparateur/unites"
        : "/en/world-conqueror-4/comparator/units",
      languages: {
        fr: "/fr/world-conqueror-4/comparateur/unites",
        en: "/en/world-conqueror-4/comparator/units",
        "x-default": "/fr/world-conqueror-4/comparateur/unites",
      },
    },
    robots: { index: true, follow: true },
  };
}

function unitToRow(u: ReturnType<typeof getAllEliteUnits>[number]): ComparableRow {
  const max = u.stats.atk.length - 1;
  return {
    id: u.slug,
    name: u.nameEn || u.name,
    nameFr: u.name,
    category: u.category,
    stats: {
      atk: u.stats.atk[max] ?? null,
      def: u.stats.def[max] ?? null,
      hp: u.stats.hp[max] ?? null,
      mov: u.stats.mov[max] ?? null,
      rng: u.stats.rng[max] ?? null,
    },
    href: {
      fr: `/world-conqueror-4/unites-elite/${u.slug}`,
      en: `/world-conqueror-4/elite-units/${u.slug}`,
    },
  };
}

export default async function UnitComparatorPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  const t = await getTranslations();
  const units = getAllEliteUnits();
  const allRows = units.map(unitToRow);
  const picks: string[] = [];
  for (const k of ["left", "right", "third", "fourth"] as const) {
    const v = searchParams[k];
    if (typeof v === "string") picks.push(v);
  }
  if (picks.length === 0) picks.push(allRows[0]?.id ?? "");

  const statLabels = {
    atk: t("comparatorPage.stat.atk"),
    def: t("comparatorPage.stat.def"),
    hp: t("comparatorPage.stat.hp"),
    mov: t("comparatorPage.stat.mov"),
    rng: t("comparatorPage.stat.rng"),
  };

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 pb-20">
        <h1 className="text-3xl font-bold text-gold2 mb-4">
          {t("comparatorPage.unitsTitle")}
        </h1>
        <p className="text-dim mb-6">{t("comparatorPage.unitsIntro")}</p>
        <ComparatorShell allRows={allRows} initialIds={picks}>
          {(rows) => (
            <div className="space-y-6">
              <ComparatorTable rows={rows} statLabels={statLabels} />
              <ComparatorRadar rows={rows} statLabels={statLabels} />
            </div>
          )}
        </ComparatorShell>
      </div>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Create the static matchup page for SEO**

Create `app/[locale]/world-conqueror-4/comparateur/unites/[matchup]/page.tsx`:

This renders a server-side comparison for a specific 2-way matchup. The slug shape is `{slug1}-vs-{slug2}`. `generateStaticParams` returns all pairs where both slugs exist and the combined order is alphabetical (to avoid duplicate pages for `a-vs-b` and `b-vs-a`).

```tsx
// [full implementation — see ComparatorTable + unitToRow from parent]
// Key parts:
// - parse matchup slug with split("-vs-")
// - reject if either slug missing
// - render the ComparatorTable + ComparatorRadar with the two fixed rows
// - H1 uses "{Unit A} vs {Unit B} — WC4 comparison" pattern
// - alternates canonical points to the FR version
// - JSON-LD Article with about: VideoGame
// - generateStaticParams returns all valid alphabetically-ordered pairs
```

(Full code pattern mirrors the interactive page but skips `ComparatorShell` and always renders exactly the 2 rows requested.)

- [ ] **Step 5: Build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -20
```

Expected: PASS with ~1225 new static pages (50 × 49 / 2 × 2 locales = 2450 matchups, but we cap to top tier combinations — see Step 6).

- [ ] **Step 6: Cap matchup generation to tier-S-and-A pairs**

Generating 2450 matchup pages is too many for first launch. Restrict `generateStaticParams` to pairs where both units have `tier === "S"` (or A, based on count). This gets us to ~30 high-intent matchup pages, enough to prove the concept. Expand later once traffic is measured.

- [ ] **Step 7: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add src/i18n/config.ts messages/ "app/[locale]/world-conqueror-4/comparateur"
git commit -m "feat(compare): unit comparator page + static matchup prerendering"
```

---

## Phase B — Generals Comparator

### Task B1: Mirror unit comparator for generals

**Files:**
- Create: `app/[locale]/world-conqueror-4/comparateur/generaux/page.tsx`

Steps mirror Task A3 but:
- Source data: `getAllGenerals()` from `lib/units.ts`
- Row shape: 6 attribute stats (infantry, artillery, armor, navy, airforce, marching) taken from `statsMax`
- Additional columns in the table: `costMedal`, `skillSlots`, `militaryRank`
- Radar uses the 6 attributes
- Static matchup pages: skip in first pass (generals have 104 entries → 5356 pairs is too many); only ship the interactive page

Commit:
```bash
git commit -m "feat(compare): general comparator with 6-axis radar"
```

---

## Phase C — Technologies data pipeline

### Task C1: Extract TechnologySettings to JSON

**Files:**
- Create: `scripts/build-tech-index.py`
- Generated: `data/wc4/technologies/*.json` (191 files + `_index.json`)

- [ ] **Step 1: Write the extraction script**

The script reads:
- `../wc4_data_decrypted/TechnologySettings.json` (191 entries)
- `../wc4_data_decrypted/TechResearchSettings.json` (research order)
- `../wc4_data_decrypted/CountryTechSettings.json` (per-country bonuses)
- `../wc4_extract/assets/stringtable_{en,cn}.ini` for localization

It emits one JSON per tech, with the following shape:

```json
{
  "slug": "tank-armor",
  "apkId": 17,
  "nameEn": "Tank Armor",
  "nameFr": "Blindage des tanks",
  "category": "armor",
  "maxLevel": 5,
  "positions": [
    { "level": 1, "x": 3, "y": 2, "costGold": 100, "costIndustry": 50,
      "costEnergy": 0, "costTech": 0, "needHQLv": 3, "needScenarioId": 0,
      "descEn": "Tank armor +5", "descFr": "Blindage des chars +5" },
    { "level": 2, "x": 3, "y": 2, "...": "..." }
  ],
  "prerequisites": [{"slug": "basic-research", "level": 1}],
  "affectsArmyIds": [103021, 103041],
  "upgradeFeature": { "type": 16, "level": 2 }
}
```

Plus `_index.json` listing all techs by category (armor, infantry, artillery, navy, airforce, economy, defense).

- [ ] **Step 2: Run the script and verify**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && python3 scripts/build-tech-index.py && ls data/wc4/technologies/ | head -20
```

Expected: ~191 JSON files written.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(tech): extract 191 technologies from APK with full L1→L5 progression"
```

### Task C2: Tech loader + type definitions

**Files:**
- Modify: `lib/types.ts`
- Create: `lib/tech.ts`

Type shape:

```typescript
export type TechCategory =
  | "infantry" | "artillery" | "armor" | "navy" | "airforce" | "economy" | "defense";

export interface TechLevel {
  level: number;
  x: number;
  y: number;
  costGold: number;
  costIndustry: number;
  costEnergy: number;
  costTech: number;
  needHQLv: number;
  needScenarioId: number;
  descEn: string;
  descFr: string;
}

export interface Tech {
  slug: string;
  apkId: number;
  nameEn: string;
  nameFr: string;
  category: TechCategory;
  maxLevel: number;
  positions: TechLevel[];
  prerequisites: Array<{ slug: string; level: number }>;
  affectsArmyIds: number[];
}
```

Loader exports: `getAllTech()`, `getTechByCategory(cat)`, `getTechBySlug(slug)`, `getTechTree(cat)` (returns positioned grid array).

### Task C3: Tech hub + category + detail pages

**Files:**
- Create: `app/[locale]/world-conqueror-4/technologies/page.tsx` (hub)
- Create: `app/[locale]/world-conqueror-4/technologies/[category]/page.tsx` (category tree)
- Create: `app/[locale]/world-conqueror-4/technologies/[slug]/page.tsx` (detail)
- Create: `components/TechTreeGrid.tsx`
- Create: `components/TechCard.tsx`
- Modify: `src/i18n/config.ts` (add `technologies` pathnames)
- Modify: `messages/{fr,en}.json` (add `techPage` namespace + `nav.technologies`)

Tech tree rendering uses the APK `Position[x,y]` directly in a CSS Grid layout. Each node is a `TechCard` positioned via `gridColumn` / `gridRow` based on `positions[0].x` and `positions[0].y`. Prerequisites are drawn as SVG lines via a `<TechArrows />` overlay. Keep it simple — no drag/drop, no interactivity beyond hover tooltip.

### Task C4: Update sidebar + nav + sitemap + search index

- [ ] **Step 1: Enable the Technologies sidebar link**

In `app/[locale]/world-conqueror-4/page.tsx`, change:

```tsx
<SidebarLink href="#">🔬 {t("nav.techs")}</SidebarLink>
```

To:

```tsx
<SidebarLink href="/world-conqueror-4/technologies">🔬 {t("nav.techs")}</SidebarLink>
```

- [ ] **Step 2: Add to sitemap**

Modify `app/sitemap.ts` to include the technology hub + per-tech detail pages.

- [ ] **Step 3: Regenerate search index**

The `scripts/build-search-index.ts` should walk `data/wc4/technologies/` too. Add a new `buildTechs()` function mirroring the existing patterns.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(tech): hub, category tree, detail pages + sidebar + sitemap + search index"
```

---

## Phase D — Guides infrastructure

### Task D1: Install MDX deps

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && \
npm install @next/mdx@^14.2.18 @mdx-js/loader@^3.1.0 @mdx-js/react@^3.1.0 \
remark-gfm@^4.0.0 rehype-slug@^6.0.0 rehype-autolink-headings@^7.1.0 \
gray-matter@^4.0.3
```

### Task D2: Configure MDX in `next.config.mjs`

```javascript
import createNextIntlPlugin from "next-intl/plugin";
import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
  },
});

const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
};

export default withNextIntl(withMDX(nextConfig));
```

### Task D3: Guides loader + type

**Files:**
- Create: `lib/guides.ts`
- Modify: `lib/types.ts`

Front-matter shape:

```typescript
export interface GuideFrontmatter {
  slug: string;
  title: string;
  description: string;
  category: "starter" | "systems" | "strategy" | "meta";
  locale: "fr" | "en";
  readingTimeMinutes: number;
  publishedAt: string;    // YYYY-MM-DD
  lastReviewed: string;   // YYYY-MM-DD
  tags: string[];
  related: string[];      // slugs of related guides
  faqs?: { q: string; a: string }[];
}
```

Loader reads `content/guides/wc4/*.mdx`, parses front-matter via `gray-matter`, returns metadata list. Per-guide MDX body is loaded dynamically at render time via `dynamic(() => import(`@/content/guides/wc4/${slug}.mdx`))`.

### Task D4: Guide routes

**Files:**
- Create: `app/[locale]/world-conqueror-4/guides/page.tsx` (hub: category cards + recent)
- Create: `app/[locale]/world-conqueror-4/guides/[slug]/page.tsx` (article)
- Create: `components/GuideLayout.tsx` (TOC, reading time, lastReviewed, related, share)
- Create: `components/GuideFAQ.tsx` (accordion + `FAQPage` JSON-LD)

Both routes carry full i18n pathnames, metadata with hreflang alternates, per-guide canonical URLs, and `Article` + `FAQPage` JSON-LD.

### Task D5: Seed 3 starter guides (cluster "démarrage")

**Files:**
- Create: `content/guides/wc4/demarrer-sur-wc4-en-2026.mdx` (FR)
- Create: `content/guides/wc4/getting-started-wc4-2026.mdx` (EN)
- Create: `content/guides/wc4/premiers-generaux-a-recruter.mdx` (FR)
- Create: `content/guides/wc4/first-generals-to-recruit.mdx` (EN)
- Create: `content/guides/wc4/comment-gagner-des-medals.mdx` (FR)
- Create: `content/guides/wc4/how-to-farm-medals.mdx` (EN)

Each guide follows the format from `PLAN-next-sections.md` §4:
1. TL;DR (3-5 bullets)
2. Target audience
3. Prerequisites
4. Body with H2 sections
5. Recap table
6. FAQ (3-8 questions)
7. Related guides (3 internal links)

Content can be written as placeholder skeletons that the user fills in later. Do NOT auto-generate long-form content — leave clearly marked `<!-- TODO: … -->` sections.

### Task D6: Nav + sidebar + sitemap + search index

- [ ] Enable `Guides` nav link in TopBar (currently disabled placeholder already wired).
- [ ] Add `Guides` sidebar link in the WC4 hub.
- [ ] Add guide URLs to `app/sitemap.ts`.
- [ ] Extend `scripts/build-search-index.ts` to index guide front-matter.

### Task D7: Commit

```bash
git commit -m "feat(guides): MDX infrastructure + 3 starter guides + FAQ JSON-LD"
```

---

## Final validation

- [ ] **Full build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -30
```

Expected:
- ~30 new matchup pages
- ~191 × 2 = 382 tech detail pages
- ~7 × 2 = 14 category tree pages
- ~6 × 2 = 12 guide pages (3 guides × 2 locales)
- Hub pages for comparator, tech, guides × 2 locales

- [ ] **Sitemap grew**

Sitemap should now have ~1500 URLs.

- [ ] **End-to-end smoke test**

```bash
npm run dev &
sleep 5
for url in \
  "http://localhost:3000/fr/world-conqueror-4/comparateur/unites" \
  "http://localhost:3000/en/world-conqueror-4/comparator/units" \
  "http://localhost:3000/fr/world-conqueror-4/technologies" \
  "http://localhost:3000/en/world-conqueror-4/technologies/armor" \
  "http://localhost:3000/fr/world-conqueror-4/guides" \
  "http://localhost:3000/en/world-conqueror-4/guides/getting-started-wc4-2026"; do
  code=$(curl -sL -o /dev/null -w "%{http_code}" "$url")
  echo "$code  $url"
done
kill %1
```

Expected: all 200.

- [ ] **Merge + push + verify Vercel**

```bash
git checkout main && git merge --ff-only feat/chunk3-comparator-tech-guides && git push origin main
```

Then verify the Vercel deployment and live URLs.

---

## Self-review checklist

- [x] Every phase has exact file paths
- [x] Every task is bite-sized (2–5 minutes)
- [x] Types consistent across phases (`Comparable`, `Tech`, `GuideFrontmatter`)
- [x] SEO metadata present on every new route (canonical, alternates, JSON-LD where applicable)
- [x] Scope boundary respected (EW7, GCR, analytics deferred)
- [x] Commit messages are descriptive
- [x] Final validation includes both build check and live URL smoke test

## Risk callouts

1. **Matchup static pages scale** — 2450 possible unit matchups × 2 locales = 4900 pages. Capped to tier-S pairs in Phase A Task A3 Step 6 to keep build time reasonable.
2. **Tech tree layout** — the APK `Position[x,y]` is a single-level grid; multi-level techs share position coordinates. The tree renderer must handle overlap (e.g., by inflating the cell with `Level 1 → 5` pills).
3. **Guide content quality** — shipping 3 skeletons is intentionally the minimum to validate the infra. The 2-4h/guide writing effort from `PLAN-next-sections.md` is separate editorial work, out of code scope.
4. **Search index size** — adding ~191 techs + ~3 guides grows the index from 279 to ~473 items (~150 KB uncompressed). Still tiny for a client fetch, but worth monitoring.

## Execution handoff

This plan is ready for Subagent-Driven Development. Dispatch one implementer per task with fresh context each time. Two-stage review (spec compliance → code quality) after each commit.

Estimated total effort per `PLAN-next-sections.md`:
- Phase A (unit comparator + matchups): 2 days
- Phase B (general comparator): 0.5 day
- Phase C (technologies): 2 days
- Phase D (guides infra + 3 seeds): 1.5 days
- **Total: ~6 days of focused work**
