# Content Accuracy and Release Freshness Audit

Audit date: 2026-07-21

## Executive assessment

The site should not currently describe all of its information as verified or updated every patch. The WC4 release archive uses an incorrect version series, WC4 content is published under EW6 and GCR routes, and much of the EW6/GCR data is visibly incomplete extraction output. Several recent WC4 entities are real, but their detailed stats and mechanics are not supported by the official sources cited by the site.

Overall confidence by section:

| Area | Confidence | Reason |
|---|---|---|
| WC4 release names and headline additions | Medium | Latest additions are confirmed by Apple and Google, but the site's versions, dates, and detailed mechanics are wrong or unsupported |
| WC4 entity stats and guides | Low to medium | Numerous internal contradictions and weak provenance |
| EW6 generals, skills, units | Low | Zero-valued skills, preliminary units, and missing current-release content |
| GCR generals, skills, units | Low | Unresolved skill IDs, preliminary units, and major current-release omissions |
| Build/runtime content integrity | Medium | Production build completes, but prerendering emits repeated localization formatting errors |

## Release accuracy

### World Conqueror 4

Official store status on 2026-07-21:

- Apple App Store: version `3.4.2`, released 2026-06-26.
- Google Play: updated 2026-06-26.
- Confirmed headline additions: Final Countdown Hard, 1st Marine Division, 51st Highland Division, Battle of Glory, Aircraft Carrier Kuznetsov, MacArthur training, and new medal generals.
- The Apple notes also schedule retrospections for 2026-07-24, 2026-08-11, and 2026-08-24. These are announced future events, not released content as of the audit date.

Repository status:

- The latest stored entry is labeled `1.25.0` and dated 2026-06-15: `data/wc4/updates/1-25-0-june-2026.json:3-4`.
- The other entries are `1.24.2` on 2026-04-15 and `1.24.3` on 2026-05-15.
- Official Apple history instead shows `3.3.0` on 2026-04-14, `3.3.1` on 2026-05-19, `3.4.1` on 2026-06-23, and `3.4.2` on 2026-06-26.
- Therefore all three repository release versions are wrong, and two of the three dates are wrong.

The April entry partially resembles the official `3.3.0` notes because both mention Delta Force, Bismarck, Dowding, Grossdeutschland, 4th Guards Tank Division, Berlin Campaign, and Nightmare operations. However, the repository adds detailed stats, fragment counts, skills, costs, balance values, and scheduling that the cited official homepage does not establish.

The May and June entries contain major unsupported claims:

- The May file invents a Kursk/Burma release set and detailed Delta Force/Bismarck balance changes: `data/wc4/updates/1-24-3-may-2026.json:18-20`.
- Official `3.3.1` notes repeat the April content and do not confirm those values.
- The June file invents Stalingrad, Philippines, and Barbarossa retrospections plus exact HP, area, reward, and production changes: `data/wc4/updates/1-25-0-june-2026.json:18-20`.
- Official `3.4.1`/`3.4.2` notes instead announce the Kuznetsov/MacArthur/Battle of Glory cycle.

Conclusion: replace the three release records with store-aligned `3.3.0`, `3.3.1`, `3.4.1`, and `3.4.2` entries. Keep only claims explicitly present in official notes unless an in-game artifact is attached.

### European War 6 identity problem

The public route and metadata call the game `European War 6: 1914`: `lib/games.ts:41-52` and `app/[locale]/european-war-6/page.tsx:26-34`.

The content mixes that title with Napoleonic framing:

- The game era is `Napoleonien & WW1`: `lib/games.ts:44`.
- The hub promises Napoleonic and Great War campaigns: `app/[locale]/european-war-6/page.tsx:31-34`.
- Napoleon's copy refers to an impossible combined `1800-1914 campaign`: `data/ew6/generals/napoleon.json:13-15`.

These are two separate EasyTech apps:

- European War 6: 1804 latest official iOS release: `1.9.0`, 2026-07-13. New generals Engels and Platov; new units Royal Scots Greys, Bashkir Pioneer Regiment, Liechtenstein 12-pounder, and Krakus Regiment.
- European War 6: 1914 latest iOS release: `1.3.10`, 2024-05-22. Google Play was updated 2025-07-29.

The repository does not contain Engels, Platov, or the newly listed 1804 units. It also claims its extraction source is 1914 while using mixed-period editorial copy. Decide which game this section covers; do not merge the two products under one entity.

### Great Conqueror: Rome

Official store status on 2026-07-21:

- Apple App Store: version `3.8.2`, released approximately 2026-07-16, with bug fixes and Ads SDK updates.
- Latest content release: `3.8.0`, 2026-05-11, adding Diocletian, Rise of Monarchs stages for Diocletian and Belisarius, promotions, and new gems.
- Google Play listing: updated 2026-07-03.

The repository has no Diocletian, Aurelian, Zenobia, Trajan, or Vespasian general records. It also has no genuine GCR update archive. The GCR section is materially behind the official release line.

## Critical factual defects

### P0: WC4 content is published as EW6 and GCR content

`lib/guides.ts:5` hard-codes `content/guides/wc4`, while EW6 and GCR guide pages call the same loader. `lib/updates.ts:5` similarly hard-codes `data/wc4/updates` while all three games use it.

The production build confirms the effect:

- WC4 guide slugs such as `admiral-kuznetsov-carrier-guide` are generated under EW6 and GCR.
- WC4 versions `1.24.2`, `1.24.3`, and `1.25.0` are generated as EW6 and GCR updates.

This is direct misinformation. Make both loaders game-scoped and remove unsupported game routes until genuine content exists.

### P0: Current WC4 values contradict release copy

Bismarck has incompatible values:

- April release copy: attack 78, defense 24, HP 785.
- June release copy: HP 845.
- Current entity: attack 86, defense 0, HP 685: `data/wc4/elite-units/bismarck.json:18-23`.
- May copy says Broadside Volley changed to a three-turn cooldown, while the entity remains at two turns.

Delta Force is also stale relative to the site's own release notes:

- May copy claims Camouflage Cover changed to 35%/20%.
- Current entity remains 30%/15%: `data/wc4/elite-units/delta-force.json:31-35`.
- June copy claims airborne area increased from 9 to 12 tiles.
- Current entity remains 9: `data/wc4/elite-units/delta-force.json:54-59`.

These values require in-game screenshots from a named game version. Until then, label them unverified and remove claims of exact official confirmation.

### P0: Kuznetsov and MacArthur mix confirmed existence with speculative detail

Official stores confirm Aircraft Carrier Kuznetsov and MacArthur training in WC4 `3.4.x`. They do not confirm the site's exact stats, fragment cost, perks, training cost, or skill behavior.

Kuznetsov contradictions:

- Entity says 40 fragments and estimated `85/28/845/4/3`.
- Guide says 30 fragments and estimates `85/~35/~620`.
- The guide calls five perks confirmed while also calling the data preliminary.

MacArthur contradictions:

- Canonical entity classifies him as infantry: `data/wc4/generals/macarthur.json:6,11-12`.
- Training guide repeatedly calls him a panzer general.
- One guide says training arrived in April; another says July. Official notes place it in the June 23/26 release cycle.
- Skill behavior differs between the entity and the guide.

Correct the release timing now. Keep detailed values explicitly provisional until verified in-game.

## Systematic data quality findings

### EW6

- All 44 elite-unit records are marked preliminary, have flat repeated level stats, and lack perks, FAQs, and recommendations.
- All 36 skill records use zero effect/chance values.
- Example: Napoleon visibly receives descriptions such as `0 additional damage`: `data/ew6/generals/napoleon.json:16-85`.
- All 230 generals use a generic extraction statement rather than reproducible provenance.
- The current 1804 additions are missing if this section is intended to cover 1804.

### GCR

- All 47 elite-unit records are preliminary and placeholder-grade.
- GCR skill data resolves to numeric names and empty descriptions. Caesar's skills are named `4`, `4`, `3`, and `3`: `data/gcr/generals/caesar.json:16-72`.
- Current official content additions are absent.
- The unit index contains extensive duplicates; `anubis` appears repeatedly near the start of `data/gcr/elite-units/_index.json`.

### Index integrity

- WC4 elite-unit files: 53; index entries: 51. Bismarck and Delta Force are missing from the index.
- WC4 general files: 105; index entries: 104. Chennault is missing.
- EW6 general index contains duplicate slugs.
- GCR elite-unit index contains many duplicate rows.

The current loaders often enumerate files, so these defects may not suppress pages, but they make the indexes unsafe as a source of truth.

### Verification model

The README documents a `verified` boolean that current entities do not use: `README.md:86-100`. The actual unit model only offers a coarse optional `preliminary` flag. General, skill, technology, guide, and field-level verification is not modeled.

Minimum provenance fields should be:

- `gameVersion`
- `platform`
- `sourceUrl`
- `sourceTitle`
- `sourcePublishedAt`
- `lastVerifiedAt`
- `verificationStatus`: `official`, `in-game`, `community`, `estimated`, or `unknown`
- `evidence`: screenshot or extraction artifact reference
- claim-level notes for values that differ by level or platform

## Build verification

Command: `npm run build`

Result: build completed and generated 4,828 static pages, but emitted repeated `FORMATTING_ERROR` messages while prerendering German WC4 general pages. The message contains `<b>Medaillen</b>` but the rendering call does not provide the rich-text variable `b`.

This should not be treated as a clean build. Add a CI check that fails on `next-intl` formatting errors rather than allowing them to scroll past during static generation.

## Recommended remediation

### Immediate, before further publishing

1. Remove WC4 guide/update generation from EW6 and GCR routes.
2. Replace WC4 release records with the official `3.3.0`, `3.3.1`, `3.4.1`, and `3.4.2` history.
3. Mark unsupported exact stats and mechanics as unverified; remove invented patch-change language.
4. Resolve whether `/european-war-6` covers 1804 or 1914 and align all metadata/data accordingly.
5. Apply `noindex` to unresolved EW6/GCR records until they meet a completeness threshold.
6. Fix the German rich-text formatting error and fail CI on localization errors.

### Next 30 days

1. Re-extract EW6/GCR from named current app versions.
2. Add schema validation for zero-valued skills, numeric-only names, duplicate slugs, flat level curves, and missing sources.
3. Add a release-ingestion workflow based on Apple/Google notes with editorial review.
4. Publish visible version, source, and last-verified information on every factual page.
5. Update the obsolete README and remove claims such as “updated every patch” until measurable coverage supports them.

## Primary sources checked

- WC4 Apple App Store: https://apps.apple.com/us/app/world-conqueror-4/id1258468290
- WC4 Google Play: https://play.google.com/store/apps/details?id=com.easytech.wc4.android
- EW6: 1804 Apple App Store: https://apps.apple.com/us/app/european-war-6-1804/id1367386970
- EW6: 1804 Google Play: https://play.google.com/store/apps/details?id=com.easytech.android.ew6
- EW6: 1914 Apple App Store: https://apps.apple.com/us/app/european-war-6-1914/id1489276662
- EW6: 1914 Google Play: https://play.google.com/store/apps/details?id=com.easytech.android.ew6w
- GCR Apple App Store: https://apps.apple.com/us/app/great-conqueror-rome/id1462722690
- GCR Google Play: https://play.google.com/store/apps/details?id=com.easytech.rome.android
- EasyTech game catalog: https://www.ieasytech.com/en/Phone/

Store pages establish versions, dates, and publisher-provided release notes. They do not validate the site's detailed game stats; those require reproducible in-game or extraction evidence.
