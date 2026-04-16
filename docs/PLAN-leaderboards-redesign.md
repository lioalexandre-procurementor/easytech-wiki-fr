# Leaderboards redesign — implementation plan

**Author:** Alex
**Date:** 2026-04-16
**Target page:** `app/[locale]/leaderboards/page.tsx`
**Scope:** rework the `Classements` page to match the spec given in chat, and fix the cross-game bleed that made OPUS47's pass feel wrong (Manstein appearing when the Rome game is active, etc.).

---

## 1. What's wrong with the current page

### 1.1 Visible defects
- **Units tab is a flat grid with chip filters.** The user wants clear category sections (🛡 Tank, ⚔️ Infantry, …) with the units listed underneath each heading, not a chip that swaps the grid.
- **Unit rows have no portraits.** Slot #1/#2/#3 are text-only, and the TOP-1 doesn't look like a "general box". The generals tab renders proper tiles with portraits; the units tab must match.
- **General-box click on the units tab does nothing.** Spec: clicking a general tile on a unit row should open the unit-vote modal pre-filled with that general.
- **No inline vote CTA on the units tab.** Current CTA is a link to the unit detail page (`…/unites-elite/<slug>#best-general-vote`). Spec: a "Vote for best general" button per row, opening the modal right from the leaderboard.
- **Skills tab is gone, but some i18n keys, helper types, and leftovers still mention it.** Clean up.
- **Editorial picks are single-slot.** `UNIT_EDITORIAL_PICKS[game][unitSlug]` returns one string. User wants only slot #1 pre-filled and slots #2/#3 as dashed "vote to reveal" placeholders, which is the current default — but the data model is brittle and the wording/UX in `UnitsTab` is inconsistent (slot #1 shows editorial as "Our pick", slots #2/#3 show dashed, but the row doesn't say *why*).

### 1.2 Cross-game bleed (the "Manstein in Rome" bug)

The Redis keys, API routes, cookies, and the `BEST_GENERAL_PLACEHOLDER` map **are** already parameterized per game. The actual bug lives in a different place:

- **`components/UnitBestGeneralVote.tsx:401`** hard-codes `/${locale}/world-conqueror-4/generaux/${c.slug}` regardless of the `game` prop. So when the GCR or EW6 unit pages render the vote widget, the general link sends users to a 404 under `/world-conqueror-4/generaux/<gcr-slug>`. That's the same defect pattern that made OPUS47's output feel cross-contaminated — wrong game context leaking through.
- **Landing teaser copy** (`bestGeneralVote.landingTeaser.body` in `messages/*.json`) lists Manstein/Guderian/etc. as examples. That string is shared across all three games. Either move the example names into per-game keys or remove the list.

### 1.3 Issues specific to OPUS47's last pass (commits `a24f03d`, `fcaace9`, `171b3a9`, `e5856a7`, `7177e9b`, `00528ad`, `03767b1`)
- `BestGeneralsGrid` has a placeholder-list bug when counts exist but total < threshold: it runs the `below` branch which re-picks 10 placeholders and discards any real votes that have already come in. Spec: 8 real + 2 placeholders *always* when the user has started voting; fall back to 10 placeholders only when *zero* votes exist.
- `UnitsTab` recomputes `editorialSlug` but ignores it for slot #2 and #3 — the dashed placeholders show "vote to reveal" even when there is a second editorial pick available. With the new schema (2 editorial slots) this dead code must go.
- The `filterChips.label` i18n key is defined but the `CategoryChips` component uses `aria-label="Filter units"` in English hard-code. Minor, but kill it while we're in there.
- `generateMetadata` rebuilds the canonical URL as `/…/leaderboards?game=…&tab=…` but the FR route is `/fr/classements?…`. The canonical should be built from the locale's actual route slug.

---

## 2. Target UX (what we're building)

### 2.1 Page skeleton
- TopBar, breadcrumb, `h1` unchanged.
- **Game switcher** (WC4 / GCR / EW6 chips) — unchanged.
- **Two tabs**: *Général* and *Général par force d'élite*. These must be styled and behave like clickable tabs (current `role="tablist"` link pattern is fine; just tighten focus/hover states). **Skills tab stays removed.** All `skills` i18n keys and code paths get purged.

### 2.2 Generals tab — mostly already right
- Top of panel: text intro + a prominent **"Voter pour un général"** primary button. Opens `BestGeneralVoteModal` with no preselection. (Rename today's `voteForAnother` key since it's the default action now.)
- 10-tile grid (2/4/5 columns responsive), ranks 1–3 with medal + glow ring, portrait on top, name + ordinal + vote count below.
- **Click a tile → opens the modal with that general pre-selected.** Already implemented via `openFor(slug)` — keep, but:
  - Fix the fallback logic so *real* votes always fill ranks 1–N even below threshold, with placeholders padding the remainder up to 10.
  - Show a subtle "position provisoire" badge on placeholder tiles (already wired via `placeholderBadge`; keep the copy gentle so it doesn't feel punitive).
- After voting, tiles are disabled with the "merci" pill visible (already done).

### 2.3 Units tab — full rebuild
Layout goes from "flat grid + chips" → **grouped sections by category**, one category per section.

```
┌── 🛡 Chars (Tank) — 13 unités ───────────────────────────────┐
│                                                              │
│   ┌ Leopard 2 🇩🇪 ───────────────────────────────────┐       │
│   │ [#1 Manstein▦]  [#2 ░░░]  [#3 ░░░]   [🗳 Voter] │       │
│   │ 12 / 50 votes — notre choix affiché jusqu'au seuil │       │
│   └─────────────────────────────────────────────────┘       │
│                                                              │
│   ┌ M1 Abrams 🇺🇸 ──────────────────────────────────┐        │
│   │ [#1 Abrams▦]  [#2 ░░░]  [#3 ░░░]    [🗳 Voter]  │       │
│   └─────────────────────────────────────────────────┘       │
│   …                                                          │
└──────────────────────────────────────────────────────────────┘

┌── ⚔ Infanterie — 12 unités ───────────────────────────────┐
   …
```

Behaviour per row:
- **General box #1** — editorial pick until the row reaches 50 votes; after, community top-1. Clicking the box opens `UnitBestGeneralVote`'s modal pre-filled with that general for that unit. Portrait ~56 px.
- **General box #2 & #3** — dashed placeholders with "vote to reveal" copy until the row reaches 50 votes; after, community #2 and #3 respectively.
- **"Vote" CTA** — opens the same modal with no preselection. Same POST endpoint, same threshold logic, same cookie.
- **Progress row** — small text under the boxes: `12 / 50 votes — notre choix affiché jusqu'au seuil`. When `reachedThreshold`, it reads `112 votes — classement communauté`.
- **Unit name** stays a link to the detail page (for people who want deeper context), but the vote flow no longer requires leaving the page.

### 2.4 Modal tweaks (shared)
The modal (`BestGeneralVoteModal` for generals, `UnitBestGeneralVote`'s embedded modal for units) is right in principle but needs:
- **Miniature portraits in the search list.** Already 32 px in `BestGeneralVoteModal`; confirm the unit modal matches (it currently shows text only — add the portrait column to match the spec "This popup should have miniature image of the general").
- **Preselection state shows the selected general as a pinned row at the top** of the list when the modal opens with a `prefillSlug`. Makes the "general pre-entered" affordance obvious.
- **"Look for another general" affordance** — the search field is already the mechanism. Add a small "Changer de général" hint caption above the search field when a preselection is active.

---

## 3. Implementation plan — file by file

### 3.1 Data model

**`lib/editorial-picks.ts`** — extend to allow up to 2 picks per unit (for future expansion) while keeping backwards compat. Answer 1.2 was "1 editorial + 2 empty", so for now we keep slot #2 empty, but shape the API to accept two slugs so we don't repeat this refactor later.

```ts
export type EditorialPick = { primary: string; secondary?: string };
export const UNIT_EDITORIAL_PICKS: Record<Game, Record<string, EditorialPick>>;
export function getEditorialPick(game: Game, unit: string): EditorialPick | null;
```

Migrate existing single-string picks to `{ primary: "manstein" }` via a one-line shape change. Leaderboard render will use `primary` only until we ship the 2-editorial variant.

### 3.2 Server data loader

**`lib/leaderboards.ts`** — no schema change. `UnitsRanking` already carries `top1/2/3GeneralSlug`. Keep threshold at 50 (shared constant). Verify `loadUnitsLeaderboard` keeps zero-vote rows so the new layout can still render a unit's editorial row before anyone votes.

### 3.3 Leaderboard page (`app/[locale]/leaderboards/page.tsx`)

- Drop `CategoryChips` (replaced by inline group headings).
- Drop the `cat` query param (no more filter; all categories visible at once).
- Keep `game` and `tab` query params.
- Fix `generateMetadata` to build the canonical from the locale's real slug (`classements` / `leaderboards` / `bestenlisten`).
- Replace `UnitsTab` body with a new `UnitsByCategory` component (section per category).

### 3.4 New component: `components/leaderboards/UnitsByCategory.tsx` (client)

Props:
```ts
{
  game: Game;
  locale: Locale;
  rows: UnitsRanking["rows"];         // from server loader
  threshold: number;
  categoryMeta: Record<Category, { label; icon; plural }>;
  generals: GeneralOption[];          // full list for the vote modal
  labels: { … };                      // pre-resolved i18n strings
}
```

Behaviour:
1. Group `rows` by `unitCategory`, preserving the per-game category order from `GameMeta.unitCategories`.
2. Render one `<section>` per category with heading `{icon} {plural} — {count} unités`.
3. For each row inside the category, render a `<UnitLeaderboardRow>` (next file).
4. Own modal state at this component level (one shared modal instance), so we don't pay for N `<UnitBestGeneralVote>` mounts. Pass `{ unitSlug, prefillGeneralSlug }` into the modal when any child triggers a vote.

### 3.5 New component: `components/leaderboards/UnitLeaderboardRow.tsx` (client)

Renders one unit row:
- Unit header: country flag + name (links to detail page).
- Three general boxes side-by-side, 56 px portraits, rank ribbon (#1 / #2 / #3), "editorial" vs "community" badge on #1 based on `reachedThreshold`.
  - Below threshold → slot #1 = editorial pick from `getEditorialPick(game, unit).primary`, slots #2/#3 = dashed "vote to reveal".
  - At/above threshold → slots filled from `top1/2/3GeneralSlug`.
- Vote CTA: pill button `🗳 Voter` → bubbles up `onVote(unitSlug, null)`.
- Clicking a general box → bubbles up `onVote(unitSlug, generalSlug)`.
- Progress line: `{n} / {threshold} votes` or `{n} votes — classement communauté`.

### 3.6 New component: `components/leaderboards/LeaderboardUnitVoteModal.tsx` (client)

This is the shared modal triggered from any row in `UnitsByCategory`. It's a minor extraction of the modal currently embedded in `UnitBestGeneralVote`, so we can open it from outside the per-unit widget. Props:

```ts
{
  game: Game;
  unitSlug: string | null;         // null = closed
  unitDisplayName: string | null;
  candidates: Candidate[];         // eligible generals for this unit
  prefillGeneralSlug?: string | null;
  onClose();
  onVoted(result);                 // parent updates its counts state
}
```

Fetches candidates via `getEligibleGeneralsForUnit(game, unitSlug)` on open (small, pure function — no network). Posts to `/api/vote/unit-general`. Matches the existing UX (search bar, radio list, Turnstile, confirm).

**Important:** this modal is a refactor of the UX already in `UnitBestGeneralVote.tsx` — don't duplicate code. Extract the modal inner JSX into a shared component that both `UnitBestGeneralVote` (unit detail page) and `LeaderboardUnitVoteModal` (leaderboards) render.

### 3.7 Generals tab fixes

**`components/BestGeneralsGrid.tsx`**

- Fix `buildTiles`: when `total > 0 && total < threshold`, still fill ranks from real votes first, then pad with placeholders up to 10 (currently discards real votes below threshold).
- Rename `voteForAnother` to a more accurate `primaryVoteCta` i18n key — after all, the user may not have voted yet; "voter pour un autre général" is misleading. Keep a second key for the post-vote thank-you.
- Add a "Changer de général" hint in the modal footer when `prefillSlug` is set (handled in modal, see 3.8).

### 3.8 Shared modal polish — `components/BestGeneralVoteModal.tsx`

- When opened with `prefillSlug`, pin that general as a highlighted row at the top of the list regardless of the search query.
- Add a small caption above the search: `t('modal.searchHint')` — "Envie d'un autre ? Recherchez-le ci-dessous."
- Confirm portrait column is present (already 32 px — no change).

### 3.9 Cross-game link bug — `components/UnitBestGeneralVote.tsx`

Line 401 hardcodes `/world-conqueror-4/generaux/`. Replace with a per-game path helper:

```ts
const generalsHubPath = game === "wc4" ? "world-conqueror-4/generaux"
                     : game === "gcr" ? "great-conqueror-rome/generaux"
                     :                   "european-war-6/generaux";
```

Same helper should live in `lib/games.ts` (or similar) so the leaderboard page and this widget share one source. Add a `verify` test/script to guard against future regressions.

### 3.10 i18n (`messages/{fr,en,de}.json`)

Add/rename:
- `leaderboardsPage.primaryVoteCta` — "Voter pour un général"
- `leaderboardsPage.voteForAnother` — keep, copy softens: "Voter pour quelqu'un d'autre"
- `leaderboardsPage.sectionHeading` — `"{icon} {plural} — {count} {suffix}"`
- `leaderboardsPage.unitsCountSuffix` — "unités" / "units" / "Einheiten"
- `leaderboardsPage.progressBelow` — "{count} / {threshold} votes · notre choix affiché jusqu'au seuil"
- `leaderboardsPage.progressAbove` — "{count} votes · classement communauté"
- `leaderboardsPage.voteForThisUnit` — "🗳 Voter pour cette unité"
- `bestGeneralVote.modal.searchHint` — "Envie d'un autre ? Recherchez-le ci-dessous."

Remove any lingering `skills.*` keys still present from the old tab.

Fix shared-across-games copy: scrub Manstein/Guderian from `bestGeneralVote.landingTeaser.body`, replace with either per-game copy or neutral copy ("Qui mérite la première place ? Participez au classement.").

### 3.11 Clean-up
- Delete `CategoryChips` helper from `app/[locale]/leaderboards/page.tsx`.
- Drop the `cat` URL param from the page and the `parseCat` helper.
- Remove Skills-leaderboards remnants: check `lib/leaderboards.ts` header comment (already notes skills removal) and any dead imports in `admin-votes.ts`.
- Drop the unused `generalsHubPath`/`unitHubPath` helpers on the page once `UnitsByCategory` owns them.

---

## 4. Acceptance criteria

1. Navigating to `/fr/classements?game=gcr&tab=generals` shows only Roman generals (Caesar, Hannibal, Scipio…). No Manstein, no WC4 placeholder bleed. Same check for `tab=units`.
2. Generals tab, below threshold with 5 real votes cast: ranks 1–5 show real portraits with live counts, ranks 6–10 are dashed placeholders.
3. Clicking general tile "Manstein" on WC4 generals tab opens the modal with Manstein highlighted at the top of the list; search bar is present and functional.
4. Units tab on WC4: one section per unit category (`Chars / Infanterie / Artillerie / Marine / Aviation`) with its units listed underneath; flag, name, three general boxes with portraits, vote CTA on every row.
5. Clicking general box "#1" on the `Leopard 2` row opens the unit-vote modal with Manstein pre-selected; confirm button posts to `/api/vote/unit-general` with `unit=leopard-2`, `general=manstein`, `game=wc4`; after success the row updates in-place.
6. The `Leopard 2` row shows `0 / 50 votes · notre choix affiché jusqu'au seuil` when no community votes exist; flips to `112 votes · classement communauté` once threshold is reached.
7. No 404 when clicking a general portrait from any GCR or EW6 unit detail page (cross-game link bug is fixed).
8. No Skills tab anywhere. No `skills.*` i18n keys remain.
9. Leaderboard canonical URLs match the locale's real slug (`classements` in FR, `leaderboards` in EN, `bestenlisten` in DE).
10. Build is green (`npm run build`) and no TS errors. Verify with `scripts/verify-game-type.ts`.

---

## 5. Implementation order (PR-sized chunks)

1. **Chunk 1 — Cross-game hygiene.** Fix the hardcoded `/world-conqueror-4/generaux/` link in `UnitBestGeneralVote.tsx`; add a shared `generalsHubPath(game)` helper; scrub Manstein/Guderian mentions from the shared landing teaser copy. Tiny, ship first. Unblocks the "Manstein in Rome" confusion immediately.
2. **Chunk 2 — Generals tab fixes.** Fix `buildTiles` placeholder logic; rename `voteForAnother` CTA; add preselection pin + search hint in `BestGeneralVoteModal`.
3. **Chunk 3 — Editorial picks schema.** Extend `EditorialPick` to `{ primary, secondary? }`; migrate existing single-string picks. No UI change yet — purely a data-model refactor.
4. **Chunk 4 — Units tab rebuild.** Build `UnitsByCategory` + `UnitLeaderboardRow` + `LeaderboardUnitVoteModal`. Wire into `page.tsx`. Drop the chips/filter. This is the meat of the work.
5. **Chunk 5 — Modal refactor.** Extract the unit-vote modal body so both the unit detail page and the leaderboards share one component.
6. **Chunk 6 — i18n pass + canonical fix + cleanup.** Finalise FR/EN/DE strings, remove skills leftovers, fix canonical URL construction.
7. **Chunk 7 — QA.** Run through acceptance checks 1–10 on each game (WC4, GCR, EW6) in all three locales. Screenshot-diff the before/after.

Each chunk is independently shippable. Chunks 1 and 2 can go to prod the same day; chunks 3–6 should land together in a single leaderboard-redesign PR.

---

## 6. Out of scope (explicitly)
- Per-general skill-slot voting leaderboard — user said Skills tab stays removed. The underlying Redis keys are still written by the WC4 general pages; do **not** touch that data path.
- Admin overrides — the override system is orthogonal to this work.
- Any visual change on the unit *detail* page's `UnitBestGeneralVote` widget (other than fixing the hardcoded `/world-conqueror-4/` link and extracting its modal body for reuse).
- GCR/EW6 hub pages adding a `BestGeneralVote` section — separate decision, not required by this spec.
