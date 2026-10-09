# WC4 refresh — 30 September 2026

Published on 1 October 2026: centralized iOS 3.5.5 / Android 1.29.2 release metadata; nine release records; twenty sourced reference entries; four new trilingual guides; corrections to training, skill voting, MacArthur, Kuznetsov and spring/summer history; localized search, navigation, sitemap and integrity checks.

## Evidence still needed

Reference pages contain no estimated statistics, prices, tiers or skill loadouts. Capture these in a named game version before promoting them to detailed records:

- AS-90, Bismarck, Delta Force and Kuznetsov: level data, perks, recruitment requirements and modifiers.
- MacArthur and Vatutin training: stages, costs, attributes, skill changes and eligible slots.
- Modernized Air Force: exact Challenge Pass threshold, compatible slots and progression. It is excluded from skill-vote candidates until compatibility is verified.
- Eleven June medal generals: identities, prices, attributes and skills.
- Two June Legend formations: units, effects, restrictions and requirements.
- New modes: access conditions, numerical rewards and tested walkthroughs.

These are explicit verification gaps, not completed gameplay research. Pending data must not be presented as zero, ranked, or plotted as measured values.

## Maintenance

`data/wc4/release-status.json` supplies the mobile baseline. `data/wc4/reference-entries.json` supplies pending pages and source metadata. Existing provisional entity files remain research material; reference pages take precedence for listed units, skills and training.

To promote an entry, verify its detailed record, remove its reference, update indexes and regenerate search. Preserve the slug. Training also requires a verified loadout and removal of `trainingDetailsPending`.

`npm run build` runs search generation, SEO checks, WC4 content integrity, type checking and production generation. These validate consistency, not numerical accuracy.

## Validation — 1 October 2026

- Production build passed: 3,134 generated pages, including all three locales.
- Search generation and SEO/content checks passed: 394 search records, nine releases, twenty references and twenty-two training identities.
- Ninety local page URLs returned HTTP 200. Reference titles, verification notices, canonical URLs, platform banners and sitemap inclusion passed.
- Browser checks confirmed AS-90 appears in search and opens its reference page. The AS-90 layout and September guide navigation were inspected in the local preview.

These checks validate the implementation; the outstanding in-game details above remain unverified.

## Publication

Prepared on 1 October: the existing Vercel account and `easytech-wiki` project were verified, the current live deployment was recorded, and a clean release package was checked. Fifteen affected admin override keys were checked; no overrides were found. Unrelated working folders and environment files are excluded from the package.

The user explicitly approved publication. Vercel built and published deployment `dpl_9Z8AmFVQxRDPrV5D3txHs6sf7UPb` to https://easytech-wiki.com. All 135 live localized page checks passed, including reviewed guide copy, release entries, reference titles and pending labels, canonical URLs, version banners, sitemap inclusion and the 394-record search index. The published September guide was verified in the browser.

Publication used the reviewed local snapshot through Vercel CLI; GitHub was not changed. See `docs/deployments/2026-10-01-wc4-refresh.json` for the source fingerprint, deployment links and previous deployment reference. Saved admin edits were not deleted.

The build also reported a pre-existing security deprecation for Next.js 14.2.18. Updating the framework remains a separate maintenance item.

## Update, 9 October 2026

GitHub `main` had fallen behind production (the 1 October release was published from a local snapshot, and the 2 October automated pushes failed to build). This release merges that snapshot into `main` and adds:

- AS-90: promoted from reference to a partial unit page (`knownLevels: [12]`), with an official render cropped from EasyTech's 11 September note, level 12 values from that preview and the level 1 kit from NamuWiki. Levels 1 to 11 show "?".
- Hive Tactical Vehicle: the 2 October `hive-tactical-vehicle` record duplicated the existing `honeycomb` unit (armyId 347001). The duplicate and its guessed sprite id were removed; `honeycomb` was renamed, set to US and enriched with sourced level 5 and 9 upgrades.
- Divine Wrath MBT: marked not recruitable, stats limited to the two levels Fandom documents (5 and 9).
- Vatutin training and Modernized Air Force references: confirmed values added (Operation Little Saturn; 350-point unlock, +4% at level 1). Stages, costs and compatible slots remain pending.
- `knownLevels` on `UnitData`: unsourced levels render "?" and are excluded from comparators. Preliminary units no longer display a tier.

Still unverified: AS-90 levels 1 to 11 and its level 5 and 9 upgrades; Bismarck, Delta Force and Kuznetsov details; the site-wide gap between April 2026 game-file stats and Fandom's in-game tables. See `docs/audits/2026-10-09-completeness-assessment.md`.
