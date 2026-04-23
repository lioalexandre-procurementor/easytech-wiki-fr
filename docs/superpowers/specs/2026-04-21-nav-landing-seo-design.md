# EasyTech Wiki — Nav / Landing / SEO Implementation Design
**Date:** 2026-04-21  
**Scope:** Sprints 1–3 + Generals Tier List (Sprint 4 content pages deferred)  
**Stack:** Next.js App Router, next-intl (fr/en/de), Tailwind, Redis (votes)

---

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| TopBar game detection | Server component + `activeGameSlug` prop from per-game layouts | Keeps SSR intact, App Router best practice |
| WC4 sidebar fate | Remove everywhere | Detail pages have no structured sections yet; TOC can be added later |
| Sprint order | Sequential: 1 → 2 → 3 + tier list | Each sprint ships independently; least risk |
| Sprint 4 content | Deferred (About, Methodology, See Also) | Separate spec |

---

## Sprint 1 — Landing Page Enrichment

### 1.1 New landing page section order

1. **Hero** — keep existing gradient + H1 + lede, **add secondary game links** (GCR, EW6 as muted cards, EW7 as "coming soon") below the WC4 CTA
2. **Community stats band** — 4 numbers in a row: Elite Units (`getAllEliteUnits().length`) · Generals (`getAllGenerals().length`) · Total votes (Redis `HGETALL wc4:best-general` sum) · Technologies (tech loader count). All server-computed, no client fetch.
3. **Live vote podium** — Top 3 WC4 generals by vote count, server-rendered from Redis. Replaces the static vote banner. Each general links to their detail page. Falls back to placeholder names when total votes < threshold (reuses `BEST_GENERAL_PLACEHOLDER` logic)
4. **Latest 3 WC4 guides** — horizontal row of 3 cards (category badge, title, date, read time). Source: `getAllGuides().slice(0, 3)`
5. **Latest 2 WC4 updates** — 2 side-by-side cards (version, date, short excerpt). Source: `getAllUpdates().slice(0, 2)`
6. **Games grid** — unchanged (4 cards)
7. **FAQ** — collapsible accordion, 4–5 questions per locale, with `FAQPage` JSON-LD emitted inline

### 1.2 Translation migration

All inline locale dicts removed from components, moved to `messages/*.json`:

| Current | New key |
|---|---|
| `BRAND_TAGLINE` in TopBar | `site.tagline` |
| `LEADERBOARDS_LABEL` in TopBar | already `nav.leaderboards` ✓ |
| `DRAWER_LABELS` in MobileNavDrawer | `nav.drawer.open/close/nav/menu/language` |
| `COPY` dict in `app/[locale]/page.tsx` | `home.h1`, `home.lede`, `home.cta`, `home.gamesHeading`, `home.available`, `home.soon`, `home.explore`, `home.voteHeading`, `home.voteBody`, `home.voteCta` |

### 1.3 New files

- `components/VotePodium.tsx` — server component, calls `lib/redis.ts` directly (not the API route) to fetch top 3 vote counts for `game=wc4`, joins with `getAllGenerals()` to get names + image paths, renders podium. Falls back to `BEST_GENERAL_PLACEHOLDER` when total votes < threshold.
- `components/GuideCard.tsx` — compact guide card (category badge, title, date, read time)
- `components/UpdateCard.tsx` — compact update card (version, date, excerpt)
- `components/FaqAccordion.tsx` — client component for collapse/expand, receives FAQ items as props
- `components/JsonLd.tsx` — generic `<script type="application/ld+json">` injector (used across sprints)

### 1.4 Modified files

- `app/[locale]/page.tsx` — full rewrite with new section order; becomes async server component
- `components/TopBar.tsx` — remove `BRAND_TAGLINE` + `LEADERBOARDS_LABEL` inline dicts; read from next-intl
- `components/MobileNavDrawer.tsx` — remove `DRAWER_LABELS` inline dict; receive labels as props from TopBar (server renders labels, passes down)
- `messages/en.json`, `messages/fr.json`, `messages/de.json` — add all new keys above

---

## Sprint 2 — Navigation Refactor

### 2.1 TopBar architecture

TopBar remains a **server component**. It receives `activeGameSlug?: string` as a prop.

- When `activeGameSlug` is set → calls `getNavItemsForGame(slug, locale, t)` → renders contextual game nav
- When `activeGameSlug` is `undefined` → renders generic home nav (Classements · Guides récents · Mises à jour)
- The `[🎮 WC4 ▾]` / `[🎮 Choisir un jeu ▾]` button renders `<GameSwitcher>` client component inline

### 2.2 Per-game layouts

Three new layout files, each extracting the game slug from their path and passing it to TopBar:

```
app/[locale]/world-conqueror-4/layout.tsx   → activeGameSlug="world-conqueror-4"
app/[locale]/great-conqueror-rome/layout.tsx → activeGameSlug="great-conqueror-rome"
app/[locale]/european-war-6/layout.tsx      → activeGameSlug="european-war-6"
```

Each layout wraps children with TopBar (passing slug) + Footer. The `[locale]/layout.tsx` keeps TopBar without a slug for home/leaderboards/legal pages.

### 2.3 New files

- `lib/nav-items.ts` — exports `getNavItemsForGame(slug: string, locale: string, t: Translations): NavItem[]`. Returns the ordered list of contextual nav items per game. WC4 items: Home · Guides · Elite Units · Scorpion Empire · Generals · Skills · Technologies · Leaderboards. GCR: Home · Guides · Elite Units · Roman Conquest · Generals · Skills · Technologies · Leaderboards. EW6: same pattern.
- `components/GameSwitcher.tsx` — **client component**. Renders the `[🎮 GameName ▾]` pill; on click opens a dropdown listing all GAMES (available ones as links, unavailable ones dimmed). Includes "← Accueil multi-jeux" link at bottom. Consumes `GAMES` from `lib/games.ts`.

### 2.4 Modified files

- `components/TopBar.tsx` — add `activeGameSlug?: string` prop; import `getNavItemsForGame`; render `<GameSwitcher activeGameSlug={activeGameSlug} />` + contextual nav items
- `components/MobileNavDrawer.tsx` — add `activeGameSlug?: string` + `gameNavItems: NavItem[]` props; render game context row at top (tappable, opens GameSwitcher inline); structured nav sections below; Classements + Comparateur as transversal section
- `app/[locale]/world-conqueror-4/page.tsx` — remove `<aside>` block + inline `SidebarSection`/`SidebarLink` helpers; change grid `lg:grid-cols-[240px_1fr]` to full-width; breadcrumb row stays

### 2.5 Sidebar removal scope

The `<aside>` + inline sidebar helpers are removed from:
- `app/[locale]/world-conqueror-4/page.tsx`

GCR and EW6 hub pages do not have sidebar components (confirmed in codebase), so no changes needed there for sidebar removal.

---

## Sprint 3 — SEO Tech + Generic GameHub

### 3.1 Generic `<GameHub>` component

Extracts the current WC4 hub page structure into a parameterized server component:

```typescript
// components/GameHub.tsx
interface GameHubProps {
  game: GameMeta;
  locale: string;
  unitCounts: Record<string, number>;
  generalCount: number;
  topUnits: EliteUnit[];
}
```

The component renders: hero banner (gradient, H1 from translations, tagline, CTAs), stats row, vote CTA section, category grid (from `getCategoryMeta`), most-viewed units strip.

WC4, GCR, EW6 hub pages each become thin wrappers that load their data and pass it to `<GameHub>`.

### 3.2 Breadcrumb component

`components/BreadcrumbNav.tsx` — server component that:
- Renders the visual breadcrumb trail (already inline in WC4 hub)
- Accepts `items: { label: string; href?: string }[]`
- Emits a `BreadcrumbList` JSON-LD `<script>` via `<JsonLd>`

Applied to: all game hub pages, all list pages (guides, updates, generals, units, skills, technologies), all detail pages that already have inline breadcrumb markup.

### 3.3 JSON-LD schemas

| Schema | Location | Component |
|---|---|---|
| `FAQPage` | Landing page FAQ section | Inline in `FaqAccordion.tsx` (Sprint 1) |
| `BreadcrumbList` | All hub + list + detail pages | `<BreadcrumbNav>` |
| `Organization` | `app/[locale]/layout.tsx` | `<JsonLd>` |
| `WebSite` + `SearchAction` | `app/[locale]/layout.tsx` | `<JsonLd>` |

### 3.4 Hreflang audit

Verify every page in `app/sitemap.ts` produces correct `alternates.languages` with fr/en/de keys + `x-default`. Fix any pages missing alternates. Confirm the landing page and leaderboards page are included.

### 3.5 New files

- `components/GameHub.tsx`
- `components/BreadcrumbNav.tsx`
- `components/JsonLd.tsx` (created in Sprint 1, reused here)

### 3.6 Modified files

- `app/[locale]/world-conqueror-4/page.tsx` — delegates to `<GameHub>`
- `app/[locale]/great-conqueror-rome/page.tsx` — delegates to `<GameHub>`
- `app/[locale]/european-war-6/page.tsx` — delegates to `<GameHub>`
- `app/[locale]/layout.tsx` — add Organization + WebSite JSON-LD
- All pages with existing inline breadcrumbs — replace inline markup with `<BreadcrumbNav>`
- `app/sitemap.ts` — add tier list route, audit alternates

---

## Generals Tier List (Sprint 4 — partial)

### Page

Route: `/[locale]/world-conqueror-4/tier-list`  
File: `app/[locale]/world-conqueror-4/tier-list/page.tsx`

Displays WC4 generals ranked by tier (S / A / B / C). Each tier is a labeled section with general cards showing: portrait, name, categories, and tier badge.

### Data

`content/tier-list/wc4-generals.json` — a simple mapping `{ generalSlug: "S" | "A" | "B" | "C" }`. Editorial content, manually maintained.

### Integration

- Added to `lib/nav-items.ts` WC4 nav items: `🏆 Tier List` between Generals and Skills
- Added to TopBar contextual nav for WC4
- Added to mobile drawer WC4 section
- Linked from WC4 hub page hero CTAs area
- Added to `app/sitemap.ts`

### New files

- `app/[locale]/world-conqueror-4/tier-list/page.tsx`
- `content/tier-list/wc4-generals.json`
- `components/TierList.tsx` — renders tier sections with general cards

---

## File Change Summary

### New files
```
lib/nav-items.ts
components/GameSwitcher.tsx
components/VotePodium.tsx
components/GuideCard.tsx
components/UpdateCard.tsx
components/FaqAccordion.tsx
components/JsonLd.tsx
components/GameHub.tsx
components/BreadcrumbNav.tsx
components/TierList.tsx
app/[locale]/world-conqueror-4/layout.tsx
app/[locale]/great-conqueror-rome/layout.tsx
app/[locale]/european-war-6/layout.tsx
app/[locale]/world-conqueror-4/tier-list/page.tsx
content/tier-list/wc4-generals.json
```

### Modified files
```
components/TopBar.tsx
components/MobileNavDrawer.tsx
app/[locale]/page.tsx
app/[locale]/layout.tsx
app/[locale]/world-conqueror-4/page.tsx
app/[locale]/great-conqueror-rome/page.tsx
app/[locale]/european-war-6/page.tsx
app/sitemap.ts
messages/en.json
messages/fr.json
messages/de.json
```

---

## Out of Scope (deferred to separate spec)

- About page (`/legal/a-propos` enhancement)
- Sources & methodology page
- "See also" automatic block on article detail pages
- WC4 tier list for units (generals only in scope here)
