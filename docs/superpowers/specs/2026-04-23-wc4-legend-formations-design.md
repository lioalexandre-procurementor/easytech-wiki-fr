# WC4 Legend Formations — Design Spec

**Date:** 2026-04-23
**Status:** Design approved, ready for planning
**Owner:** alex@theprocurementor.com

## Goal

Add a "Legend Formations" section to the World Conqueror 4 wiki. Covers 8 formations (6 existing in the game + 2 new ones from the April 2026 update). Each formation gets a dedicated page plus a hub that lets users toggle instantly between them. Ship in all 3 supported locales (fr, en, de) with SEO parity.

## Why

- Player-facing concept that's currently missing from the wiki
- User-visible surface in the WC4 nav
- Two brand-new formations (Großdeutschland, 4th Guards Tank Division) shipped in the April 2026 update and are not documented anywhere
- Strong SEO opportunity: 27 new indexable URLs (1 hub + 8 detail × 3 locales)

## The 8 formations

| # | Name | Country | Operation (in-game card) |
|---|------|---------|--------------------------|
| 1 | Ghost Division | 🇩🇪 Germany | — (7th Panzer Division) |
| 2 | Spearhead | 🇺🇸 USA | — (3rd Armored Division) |
| 3 | Taman Division | 🇷🇺 Soviet Union | — (Black Sea Fleet Naval Infantry) |
| 4 | Desert Rats | 🇬🇧 UK | — (7th Armoured Division) |
| 5 | Leclerc Division | 🇫🇷 France | — (2nd Armored Division) |
| 6 | Lightning Division | 🇮🇹 Italy | — |
| 7 | Großdeutschland Division | 🇩🇪 Germany | Operation Mars |
| 8 | 4th Guards Tank Division | 🇷🇺 Soviet Union | Operation Rumyantsev |

## User Request Summary

> "Add legend formations to WC4 nav. Toggle easily between each. For each: background story + unit list with icons + general buff + specific effects with unit-type scope icons. 3 languages. SEO-optimized. Tell me if I need to resubmit sitemap."

## Chosen Approach

**Hybrid pattern**: hub page with instant client-side toggle **plus** 8 detail pages for SEO depth and deep-linking.

- Hub = fast browse (no page reload, left rail tabs, mobile tabs)
- Detail pages = indexable SEO content, richer lore, recommended generals, JSON-LD article
- Both rendered from the same canonical data files

## Architecture

### 1. Data model

New directory: `data/wc4/formations/` (mirrors `data/wc4/elite-units/`).

**`_index.json`** — ordered list of slugs.

**Per-formation JSON** — one per formation:
```ts
type Formation = {
  slug: string;                      // "ghost-division"
  order: number;                     // 1..8, controls display order
  name: string;                      // "Ghost Division" (fr default)
  nameEn: string;
  nameDe: string;
  country: string;                   // matches existing country code convention in lib/types.ts — "DE", "US", "SU", "GB", "FR", "IT"
  countryName: string;               // "Allemagne" (fr)
  operationName?: string;            // "Operation Mars" (optional, for GD + 4th Guards)
  operationNameEn?: string;
  historicalUnit: string;            // "7th Panzer Division"
  historicalUnitEn: string;
  lore: {
    short: string;                   // 1-2 sentence summary for hub preview + meta description
    shortEn: string;
    shortDe: string;
    long: string[];                  // 2-3 paragraph array for detail page
    longEn: string[];
    longDe: string[];
  };
  units: Array<
    | { kind: "base"; name: string; nameEn: string; nameDe: string; category: Category }
    | { kind: "elite"; slug: string }   // FK to existing /data/wc4/elite-units/<slug>.json
  >;
  generalBuff: {
    text: string;                    // e.g. "+3 mobility to all Ghost Division units"
    textEn: string;
    textDe: string;
    appliesTo: AppliesTo[];          // see below
  };
  tacticalEffects: Array<{
    name: string;                    // "Joint Offensive"
    nameEn: string;
    nameDe: string;
    desc: string;
    descEn: string;
    descDe: string;
    appliesTo: AppliesTo[];
  }>;
  lockedToCountry: true;             // all 8 are — shown as footnote
};

type AppliesTo = "all" | "infantry" | "tank" | "artillery" | "navy" | "airforce";
type Category = "infantry" | "tank" | "artillery" | "navy" | "airforce";
```

### 2. Routes & files

**i18n pathnames** (add to `src/i18n/config.ts`):

| Canonical | FR | EN | DE |
|---|---|---|---|
| `/world-conqueror-4/formations-legendes` | `formations-legendes` | `legend-formations` | `legend-formations` |
| `/world-conqueror-4/formations-legendes/[slug]` | same | `legend-formations/[slug]` | `legend-formations/[slug]` |

**New app routes:**
```
app/[locale]/world-conqueror-4/formations-legendes/
  page.tsx                   ← hub (Server Component: metadata, JSON-LD, SEO fallback grid; mounts the client toggler)
  [slug]/page.tsx            ← detail page (Server Component: generateStaticParams, generateMetadata, JSON-LD Article)
```

**New components:**
```
components/
  FormationsHubClient.tsx    ← "use client" — sticky rail + swap panel + URL hash sync
  FormationCard.tsx          ← grid card (used in SEO fallback + on detail page "other formations" nav)
  FormationUnitRow.tsx       ← one row: base-unit UnitIcon OR elite-unit sprite + name
  FormationEffectRow.tsx     ← one row: appliesTo scope-icons chip + effect name + description
  FormationScopeIcon.tsx     ← small SVG (reuses UnitIcon) showing which unit types an effect applies to
```

**New loader:** `lib/formations.ts` (mirrors `lib/units.ts`):
- `getAllFormations(locale)` — loads _index + all JSONs, returns in order
- `getFormation(slug, locale)` — loads one
- `getFormationSlugs()` — for generateStaticParams

**New type** in `lib/types.ts`: `Formation`, `AppliesTo`.

**Nav integration** — add one line to `lib/nav-items.ts` WC4 case:
```ts
{ href: "/world-conqueror-4/formations-legendes", label: t("nav.formations"), icon: "🎖" }
```

Also add to `MobileNavDrawer` if it has a hardcoded WC4 game section list.

### 3. UI/UX

**Hub page layout:**
```
┌─ BreadcrumbNav: WC4 > Legend Formations
├─ Page header (H1 + 1-paragraph intro)
├─ FormationsHubClient:
│   ┌─ Left rail (desktop ≥md) / horizontal scroll tabs (mobile)
│   │    [🇩🇪 Ghost Division]   ← active
│   │    [🇺🇸 Spearhead]
│   │    [🇷🇺 Taman Division]
│   │    [🇬🇧 Desert Rats]
│   │    [🇫🇷 Leclerc Division]
│   │    [🇮🇹 Lightning Division]
│   │    [🇩🇪 Großdeutschland]
│   │    [🇷🇺 4th Guards Tank]
│   └─ Right panel (URL hash `#ghost-division` for deep-linking):
│       • Formation name + country flag + operation badge
│       • Historical unit subtitle
│       • Short lore (2-3 sentences)
│       • [Units in formation] grid (12-13 items typical):
│           base units → UnitIcon category SVG (24px) + name
│           elite units → /img/wc4/elites/<id>.webp (32px) + name, link to unit page
│       • [General buff] card: scope-icon + text
│       • [Tactical effects] 3 rows: scope-icon(s) + name + description
│       • Country-lock note
│       • "Read full guide →" CTA → detail page
└─ "Browse all formations" section:
   <FormationCard> grid — 8 static cards linking to detail pages.
   Always visible (useful UX AND guarantees every formation is in server-rendered HTML for SEO).
```

**Detail page layout:**
```
┌─ BreadcrumbNav: WC4 > Legend Formations > Ghost Division
├─ Header (name, flag, operation badge, country)
├─ Full lore (2-3 paragraphs)
├─ Units in formation (full table/grid)
├─ Formation buffs & effects (same components as hub panel)
├─ Recommended generals (query generals filtered by formation.country, reuse existing GeneralCard)
├─ "Other legend formations" — prev/next + 8-card grid
└─ JSON-LD Article + BreadcrumbList
```

**Icon conventions:**
- **Base unit row** → `<UnitIcon category="infantry|tank|artillery|navy|airforce" size={24} />` SVG silhouette
- **Elite unit row** → `<Image src={elite.image.sprite} width={32} height={32} />` webp thumbnail + link to elite unit detail page
- **Effect scope chip** → small `FormationScopeIcon` (reuses `UnitIcon` at 16px) — one per category the effect applies to. `"all"` renders a grouped-chip with a "units" label.
- **Country flag** → reuses `COUNTRY_FLAGS` from `lib/units.ts` (already client-safe inlined)

### 4. Content sources

- **Names, buffs, effects (English)**: extracted from `wc4_extract/assets/stringtable_en.ini` — keys `legend_army_N`, `synergy_tactics_N_{1,2,3,4}`. Already confirmed present for formations 1-6.
- **Lore (English)**: keys `legend_intro_N0NON` (multiple paragraphs per formation).
- **Großdeutschland + 4th Guards** (#7, #8): sourced from attached screenshots + `WC4_April_2026_Cards_Deployment_Brief.md` + `legend_chapter_7/8` or `legend_army_7/8` if present in the decrypted stringtable (verify during implementation).
- **Unit lists**:
  - Formations 7-8: from screenshots (explicit "Units Available" list).
  - Formations 1-6: parse from `wc4_extract/assets/data/ArmyGroupSettings.json` if structured; if noisy, compile from community references (e.g., the WC4 wiki community) + cross-check with the game. Document source confidence per formation.
- **French translations**: prefer pulling from a French `stringtable_fr.ini` if it exists in the decrypted dump; otherwise translate from English, keeping historical proper names untranslated ("Großdeutschland", "4th Guards Tank Division", "Operation Mars").
- **German translations**: same rule — pull if available, translate otherwise.

### 5. SEO

**Per-page metadata (via `generateMetadata`):**

| Field | Hub page | Detail page |
|---|---|---|
| `title` | `Legend Formations — World Conqueror 4 Guide` + locale name | `<Formation Name> — WC4 Legend Formation Guide` |
| `description` | "Full guide to all 8 WC4 legend formations: Ghost, Spearhead, Desert Rats…" (~155 chars) | Short lore + country + key buff (~155 chars) |
| `openGraph.image` | `/img/wc4/formations/og-hub.webp` (if present, else existing default) | `/img/wc4/formations/<slug>.webp` if present, else default |
| `alternates.canonical` | yes | yes |
| `alternates.languages` | fr/en/de URLs | fr/en/de URLs |

**JSON-LD:**
- Hub → `ItemList` of 8 formations
- Detail → `Article` (`headline`, `datePublished`, `inLanguage`, `about` → WC4 game) + `BreadcrumbList`

**Sitemap (`app/sitemap.ts`):**
- 1 hub URL × 3 locales (priority 0.8, changefreq monthly)
- 8 detail URLs × 3 locales (priority 0.7, changefreq monthly)
- Total: **27 new URLs** with hreflang alternates

**Internal linking:**
- WC4 hub page gets a "Formations Légendaires" feature card linking to the hub
- Each general's detail page: if `country` matches a formation, show a "Used in: X formation" link
- Each elite unit's detail page: if the unit appears in any formation's units[], show "Part of: X formation" link
- Footer nav: already inherits from `getNavItemsForGame("world-conqueror-4")`

### 6. Post-deploy SEO actions (answer to user's question)

**Do you need to resubmit the sitemap to Google?**

**Not strictly required**, but strongly recommended for faster discovery:

1. **Automatic path** (slow): Google re-crawls `sitemap.xml` on its own schedule (typically every few days for active sites). New URLs will surface naturally within 3-14 days.
2. **Fast path** (5 seconds in Google Search Console):
   - Sitemaps → resubmit `https://<domain>/sitemap.xml`
   - URL Inspection → Request Indexing on: hub page + Großdeutschland detail + 4th Guards detail (the 2 highest-priority new pieces of content).
3. **Bing Webmaster Tools** — same thing: resubmit sitemap.
4. **No IndexNow / no special headers needed** — the site's existing sitemap config handles the rest.

## Components to modify (vs new)

**Modify:**
- `lib/nav-items.ts` — add WC4 formations link
- `lib/types.ts` — add `Formation`, `AppliesTo` types
- `src/i18n/config.ts` — add 2 new pathname entries
- `app/sitemap.ts` — add formation URLs
- `messages/{fr,en,de}.json` — add `nav.formations`, `formations.hub.*`, `formations.detail.*` keys
- `app/[locale]/world-conqueror-4/page.tsx` (WC4 hub) — add a feature card/section for formations

**Create:**
- `data/wc4/formations/{_index.json + 8 formation files}`
- `app/[locale]/world-conqueror-4/formations-legendes/page.tsx`
- `app/[locale]/world-conqueror-4/formations-legendes/FormationsHubClient.tsx`
- `app/[locale]/world-conqueror-4/formations-legendes/[slug]/page.tsx`
- `components/FormationCard.tsx`
- `components/FormationUnitRow.tsx`
- `components/FormationEffectRow.tsx`
- `components/FormationScopeIcon.tsx`
- `lib/formations.ts`

## Out of scope (v1)

- Formation search/filter UI — only 8 items, not needed
- Formation tier list / cross-ranking
- Formation comparator
- Per-stat numerical breakdown (just textual buffs/effects)
- OG images per formation — ship with default OG, add per-formation images in a later PR

## Testing plan (for implementation)

- [ ] 8 JSON files validate against the `Formation` type
- [ ] Hub page renders in all 3 locales
- [ ] Toggle works, URL hash updates, deep-linking to `#spearhead` scrolls + activates Spearhead
- [ ] All 8 detail pages build statically (`next build`) with correct metadata + JSON-LD
- [ ] Hreflang alternates correct on every page
- [ ] Sitemap includes all 27 new URLs
- [ ] Nav link appears only in WC4 context (not on GCR or EW6 pages)
- [ ] Mobile tabs scroll horizontally without overflow issues
- [ ] Elite unit thumbnails load (webp paths valid)
- [ ] Base unit silhouettes render (UnitIcon categories match)
- [ ] Sticky rail on desktop doesn't overlap footer

## Risks / open items

- **Unit lists for formations 1-6** — if `ArmyGroupSettings.json` isn't parseable for per-formation membership, fall back to manually compiling from game screenshots + community wiki. Document sources in each JSON.
- **French + German translations** — if stringtable_fr/de.ini aren't in the decrypted dump, I'll translate; flag as "machine-translated, human review recommended" in the spec.
- **Großdeutschland stringtable keys** — need to verify `legend_army_7/8` exists in the current decrypted dump. If not present, rely on screenshots + April 2026 brief.
