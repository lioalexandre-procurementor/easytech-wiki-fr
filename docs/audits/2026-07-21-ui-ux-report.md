# UI/UX and Accessibility Audit

Audit date: 2026-07-21

## Executive assessment

The site has a strong visual foundation, responsive grid usage, useful comparison tools, and generally crawlable server-rendered content. The largest UX risks are accessibility fundamentals: invisible keyboard focus, incomplete dialog focus management, weak form labeling, incorrect search semantics, and unresolved localization behavior. Mobile information hierarchy and light-theme consistency are the next priorities.

## Priority findings

### P0: Establish a visible keyboard focus system

Important controls use `outline-none` or rely on subtle border changes, while `app/globals.css` has no consistent global `:focus-visible` treatment.

Affected examples:

- `components/SearchBar.tsx:184-200`
- `components/GeneralsBrowserClient.tsx:142-148`
- `components/SkillsBrowserClient.tsx:75-81`
- `components/ReportMistakeLink.tsx:328-346`
- `components/BestGeneralVoteModal.tsx:238-244`

Recommendation: add a high-contrast semantic focus ring with offset for links, buttons, inputs, cards, chips, and icon controls. Do not remove outlines without an equivalent replacement. Test in dark, light, and forced-colors modes.

### P0: Replace ad hoc modals with an accessible dialog primitive

Current dialogs often support Escape and scroll locking, but they do not consistently move focus inside, trap Tab, make the background inert, restore trigger focus, or associate the dialog with its title.

Affected examples:

- `components/BestGeneralVoteModal.tsx:138-150,207-229`
- `components/UnitVoteModal.tsx:324-336,398-421`
- `components/ReportMistakeLink.tsx:276-299`
- `components/TrainedSkillVote.tsx:318-340`
- `components/MobileNavDrawer.tsx:58-83`

Recommendation: create one shared dialog/drawer primitive with initial focus, focus trap, Escape, focus restoration, `aria-labelledby`, and inert background behavior.

### P0: Fix form labeling and async announcements

The report form has visible labels without `htmlFor`/ID connections. Search and voting fields frequently rely on placeholders. Errors and success states are not consistently announced.

Affected examples:

- `components/ReportMistakeLink.tsx:317-379`
- `components/BestGeneralVoteModal.tsx:238-310`
- `components/UnitVoteModal.tsx:424-513`
- `components/GeneralsBrowserClient.tsx:142-157`

Recommendation: provide persistent labels, matching IDs, `aria-describedby`, `aria-invalid`, and `role="alert"` or `aria-live` for submission state.

### P0: Implement the ARIA combobox pattern for search

Search supports arrow keys and Enter visually, but assistive technology receives an ordinary input followed by unrelated buttons. It lacks `combobox`, `listbox`, `option`, `aria-expanded`, `aria-controls`, and `aria-activedescendant`. Network failure is presented as “no results.”

Evidence: `components/SearchBar.tsx:52-77,101-132,149-233`.

Recommendation: implement a real combobox/listbox pattern, announce result counts, keep stable option IDs, scroll the active result into view, and distinguish empty results from fetch failure.

### P0: Preserve user state when switching locale

`LocaleSwitcher` uses the pathname without search parameters, so changing language drops comparator selections and leaderboard state.

Evidence:

- `components/LocaleSwitcher.tsx:13-32`
- `components/ComparatorShell.tsx:30-38`
- `app/[locale]/leaderboards/page.tsx:151-158`

Recommendation: preserve `useSearchParams()` during locale changes and test `game`, `tab`, and comparator slot parameters.

### P0: Correct German search behavior

The search model contains only English and French fields. Fuse references German fields that are not in the type, while display logic treats every non-French locale as English.

Evidence: `components/SearchBar.tsx:10-20,38-39,59-67,149-153`.

Recommendation: add `nameDe` and `descDe`, select fields by locale, and make English fallback explicit.

### P1: Add route-level loading, error, and not-found experiences

No localized `loading.tsx`, `error.tsx`, or `not-found.tsx` files exist. Redis-backed pages and large detail routes therefore lack branded recovery states.

Recommendation: add localized boundaries with retry and safe-navigation actions. Keep loading, empty, and error states semantically distinct.

### P1: Make light mode token-driven

Semantic variables are well designed in `app/globals.css:10-69`, but public components frequently use hard-coded dark backgrounds and text colors.

Examples:

- `app/[locale]/world-conqueror-4/generaux/[slug]/page.tsx:214-240,365-373`
- `components/VotePodium.tsx:56`
- `components/ConsentBanner.tsx:114-119`
- `components/ComparatorRadar.tsx:19-38`

Recommendation: use semantic surface/text/border tokens for structural styling. Keep fixed colors only for game identity and data series, with theme-specific contrast checks.

### P1: Improve landmarks and skip navigation

There is no skip link, and primary content is not consistently wrapped in `<main>`. Breadcrumb implementations vary across routes.

Examples:

- `app/[locale]/layout.tsx:193-198`
- `app/[locale]/leaderboards/page.tsx:167-185`
- `app/[locale]/world-conqueror-4/comparateur/unites/page.tsx:109-130`
- `components/BreadcrumbNav.tsx:29-50`

Recommendation: add a localized skip link to a stable main landmark and standardize all breadcrumbs on one component.

### P1: Put primary mobile content before sidebars

Many two-column pages collapse to one column with the sidebar first. Mobile users must traverse navigation and category blocks before the H1.

Representative evidence: `app/[locale]/world-conqueror-4/generaux/page.tsx:110-145`. The same pattern appears across WC4, GCR, and EW6 list pages.

Recommendation: make main content first in DOM order and move the sidebar visually on desktop, or convert mobile sidebars to a compact disclosure after the H1.

### P1: Correct tabs and comparator semantics

Leaderboards use links with `role="tab"` but do not implement a complete tab pattern. Comparator controls lack labels; add/remove controls have ambiguous accessible names; tables and radar charts need better non-visual equivalents.

Evidence:

- `app/[locale]/leaderboards/page.tsx:187-236,279-336`
- `components/GeneralComparatorClient.tsx:93-120`
- `components/ComparatorShell.tsx:61-95`
- `components/ComparatorTable.tsx:20-55`
- `components/ComparatorRadar.tsx:32-51`

Recommendation: use normal navigation links with `aria-current` when URL navigation is intended. Add labels, captions, scoped row headers, text indicators for best/worst, and a chart summary.

### P1: Complete localization of visible and accessible copy

Hard-coded strings remain in the mobile drawer, tier list, comparator warning, breadcrumbs, TOC labels, and accessible names.

Examples:

- `components/MobileNavDrawer.tsx:85-123`
- `components/TierList.tsx:138-145`
- `components/GeneralComparatorClient.tsx:96-134`
- `components/BreadcrumbNav.tsx:32-34`

Recommendation: translate visible strings and `aria-label`, `title`, tooltip, empty-state, and error copy together.

### P2: Increase small text and target sizes

Important metadata and interactive labels frequently use 8-11px text, and some chips/vote controls are below a comfortable 44x44 target.

Examples:

- `components/GeneralsBrowserClient.tsx:254-274`
- `components/leaderboards/UnitLeaderboardRow.tsx:88-98,140-142,211-214`
- `components/GameCardsGrid.tsx:69-99`

Recommendation: use 12px as a practical minimum for secondary metadata, 14px for interactive text, and 44x44 targets or sufficient spacing.

### P2: Normalize image semantics and fallback behavior

Card portraits often repeat adjacent names through alt text. Most images lack a failure fallback, and tier-list portraits use raw `<img>`.

Evidence:

- `components/UnitCard.tsx:22-43`
- `components/GeneralsBrowserClient.tsx:302-368`
- `components/TierList.tsx:83-100,154-169`

Recommendation: use empty alt text for decorative duplicate portraits, meaningful alt text only when the image adds information, and a shared initials/icon fallback.

### P2: Prevent sticky headers from hiding anchor targets

Detail-page section IDs generally have no scroll margin despite the sticky top bar and elite-unit level controller.

Evidence:

- `components/elite/StickyLevelBar.tsx:45-52`
- `app/[locale]/world-conqueror-4/generaux/[slug]/page.tsx:191-200,331-335,406-427`

Recommendation: apply a shared `scroll-margin-top` sized for the maximum sticky-header stack.

## Strengths to preserve

- Strong semantic color-token foundation: `app/globals.css:10-69`.
- `prefers-reduced-motion` support in global styles and count-up animation.
- Responsive technology trees switch to a simpler linear layout on small screens.
- Server-rendered page content avoids client-only blank states.
- Comparison, voting, and leaderboard tools create useful repeat-visit value.
- Viewport settings permit user zoom.

## Suggested delivery plan

### Sprint 1: accessibility foundation

1. Global focus styles.
2. Shared dialog/drawer primitive.
3. Form labels and live announcements.
4. Search combobox semantics.
5. Skip link and main landmarks.

### Sprint 2: state and responsive behavior

1. Locale switch query preservation.
2. German search fields.
3. Mobile sidebar reorder/disclosure.
4. Route loading/error/not-found boundaries.
5. Comparator and leaderboard semantics.

### Sprint 3: consistency and polish

1. Replace structural hard-coded colors with tokens.
2. Complete UI and ARIA localization.
3. Normalize image fallbacks and alt text.
4. Increase minimum text and target sizes.
5. Add anchor scroll margins.

## Verification plan

No automated UI or accessibility test framework is configured in `package.json`. Add Playwright plus Axe checks for:

- keyboard-only navigation and visible focus;
- focus entry, trapping, Escape, and restoration in every dialog;
- 320, 375, 768, and 1280px layouts;
- 200% and 400% zoom;
- FR/EN/DE state-preserving locale changes;
- dark, light, and forced-colors modes;
- broken images and failed search/vote APIs;
- empty Redis-backed leaderboards;
- accessible names, labels, live regions, and heading order.
