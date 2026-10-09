# World Conqueror 4: content audit and update plan

Audit date: 29 September 2026. Scope: the live EasyTech Wiki WC4 section, its local content, and official mobile release information. This is a proposed implementation plan; website content and deployment were not changed.

The site needs both a release catch-up and an accuracy pass. Its live hub and update archive stop at June's 3.4.2 baseline. September content is missing, some June additions still lack records, and several strategy guides contradict the corrected release archive. One corrected local guide has also not reached the live site.

## 1. Verified baseline

| Platform | Latest verified version | Release/update date | Evidence |
|---|---|---|---|
| iOS/iPadOS | **3.5.5** | **29 September 2026**, 06:15:23 UTC | [Apple's live lookup record](https://itunes.apple.com/lookup?id=1258468290&country=us): `version` and `currentVersionReleaseDate` |
| Android | **1.29.2** | **29 September 2026** | [Google Play](https://play.google.com/store/apps/details?id=com.easytech.wc4.android&hl=en&gl=US): version in embedded app metadata; date in visible listing |

Apple's cached [store history](https://apps.apple.com/us/app/world-conqueror-4/id1258468290) still showed 3.5.4 during the audit; the directly fetched Apple record is newer. Version 3.5.5 repeats the September feature list. Do not invent a specific gameplay change or bug fix for this version. Desktop/Windows release parity was not established.

Google Play changed during the audit: an earlier direct response showed 1.29.0 dated 16 September; the final direct response shows 1.29.2 dated 29 September. The final response did not expose a separate changelog for 1.29.2. Use the latest platform metadata for the baseline and the established September notes for content coverage. A compact source snapshot is saved in `docs/audits/2026-09-29-wc4-release-evidence.json`.

The archive is missing iOS 3.4.3 (3 August), 3.5.3 (15 September), 3.5.4 (16 September), and today's 3.5.5. Retain separate platform versions and distinguish a content release from subsequent releases that repeat its notes. [Apple version history](https://apps.apple.com/us/app/world-conqueror-4/id1258468290)

### Current site inventory

Counts below come from local JSON records, excluding index files. They describe this site's coverage, not the complete game roster.

| Area | Current coverage | Assessment |
|---|---:|---|
| Generals | 105 | June additions absent; Vatutin still has no training path |
| Elite units | 53: 45 standard + 8 Scorpion | AS-90 absent; three records explicitly preliminary |
| Skills | 124 | Modernized Air Force exists, but its acquisition/classification needs revision |
| Technologies | 58 | Retain; recheck dependencies affected by current mechanics |
| Legend formations | 8 | Two June formations absent |
| Guides | 17, with FR/EN/DE content | Mostly reviewed in April; selected July/September revisions |
| Release records | 4 | 3.3.0, 3.3.1, 3.4.1, 3.4.2 |

Direct live fetches confirm the [English hub](https://easytech-wiki.com/en/world-conqueror-4) still displays 3.4.2 and the same general/unit counts. The [update archive](https://easytech-wiki.com/en/world-conqueror-4/updates) marks its June entry as latest. The French and German hubs also displayed the June baseline in the web review.

The July audit's incorrect release filenames have already been replaced in the local repository. Its old claim about three incorrect version records must not be recycled as a current finding.

## 2. Official changes versus site coverage

The September additions below are confirmed in [Google Play's publisher release notes](https://play.google.com/store/apps/details?id=com.easytech.wc4.android&hl=en), captured before today's listing refresh, and corroborated by [Apple's current release notes](https://itunes.apple.com/lookup?id=1258468290&country=us). Exact stats, training costs, reward thresholds, and optimal strategies require separate evidence.

| Official change | Site status | Required work |
|---|---|---|
| 1980 Challenge Conquest | No dedicated guide found | Add an overview, unlock conditions, objectives and rewards; add tested country strategies afterwards |
| AS-90 Self-Propelled Howitzer | No entity record | Add the unit, sources, image, acquisition and verified level/perk data; include it in browsing, search and comparisons |
| Vatutin training | Existing general explicitly has `hasTrainingPath: false` | Update the existing general, trained form, skills, training index and recommendations |
| Red Embers | No dedicated coverage found | Add an event overview and link it from the Scorpion section |
| Rift in the Ice Curtain: Hard | No dedicated coverage found | Document its difficulty, entry requirements and event availability |
| Five Glory entries | No dedicated Battle of Glory guide found | Cover Power of the Tides, Black Prism, Route 66, Horn of War and Ace Hellcat within a mode guide |
| Four new historical retrospections | No September calendar coverage | Add sourced first-occurrence dates and distinguish them from recurring dates |

Modernized Air Force already has `data/wc4/skills/modernized-air-force.json`. Update that record rather than creating a duplicate. It currently reads as a general-specific skill and is missing from `learnable-skills.json`. The September announcement raises the Challenge Pass cap to **350 points** and adds this skill as a reward; verify its exact unlock threshold and eligible slots in-game rather than assuming the cap equals its unlock threshold. [EasyTech's September announcement](https://note.com/easytech_game/n/n81e3ca31df6b)

### Older gaps still to close

The June release records already mention the following additions, but dedicated records are absent:

- **11 medal generals:** Paulus, Balck, Vasily, Qasim, Pahlavi, Alberto, Lhagvasuren, Kimmel, Luigi, Gariboldi and Percival. Check in-game identities and translated names before choosing slugs; do not merge Vasily with existing similarly named generals.
- **Two Legend formations:** 1st Marine Division and 51st Highland Division.
- **Battle of Glory:** needs a practical explanation of access, progression, rewards, privileges and skins.

These are June additions repeated in later notes, not new September content. August also added hard Iron Curtain Frontline, which needs coverage. [Apple release history](https://apps.apple.com/us/app/world-conqueror-4/id1258468290)

### Calendar treatment as of this audit

| Event | Official first-occurrence date | Wording to use on 29 September |
|---|---|---|
| Red Embers; Rift in the Ice Curtain Hard | 16 September 2026 | First occurrence has passed; check the current rotation before saying “available now” |
| Battle of the Bzura | 22 September 2026 | Past first occurrence; scheduled recurring date changes to 9 September from 2027 |
| Battle of Peleliu | 24 September 2026 | Past first occurrence; scheduled recurring date changes to 15 September from 2027 |
| Battle of Cape Esperance | 11 October 2026 | Announced, upcoming |
| Battle of Leyte | 20 October 2026 | Announced, upcoming |

These dates and the recurrence exceptions come from [EasyTech's official September announcement](https://note.com/easytech_game/n/n81e3ca31df6b). The announcement also establishes iOS 15 as the new minimum and mentions pause-screen improvements. An opening date alone does not establish an event's closing date or continuous availability.

## 3. Accuracy corrections to prioritize

| Priority | Evidence | Correction |
|---|---|---|
| P0 | `content/guides/wc4/competences-vote-wc4.json:54,95,107` describes random skill rolls, probabilities and medal spending without reproducible support | Withdraw the unsupported instructions and rewrite around verified skill acquisition/replacement. Explain site community voting separately. Preserve the URL with a clear correction or a relevant redirect |
| P0 | `training-priority-2026.json:58` mislabels several general roles and excludes four paid generals from training, contradicting the site's own training records | Rebuild the guide from checked base/trained roles and eligibility; label ranking judgments as editorial recommendations |
| P0 | `macarthur-trained-guide.json:58` says April; `summer-2026-cycle.json:58` says July; official release records place MacArthur training in June | Correct release timing across descriptions, bodies, FAQs and all three languages; remove unsupported prerequisite claims implying seven other generals must be trained first |
| P0 | The summer guide retains unsupported May/June event lists and speculative future autumn copy | Reconcile it against official history, then label it as an archived summer guide and link to September coverage |
| P0 | Direct live Kuznetsov guide still shows its 20 July revision and five allegedly confirmed perks; the local file was revised on 6 September | Review and reconcile the local revision, then publish and verify the actual public page; do not assume local changes are live |
| P1 | Local Kuznetsov revision groups official and Fandom evidence under “official sources” | Distinguish publisher confirmation, community recommendations and observed gameplay; attach versioned evidence to Dock/perk claims |
| P1 | Bismarck's current entity has L1 attack/defence/HP 86/0/685, while the summer guide gives 78/24/785 | Verify both against the same platform, version and stat conditions; neither conflicting set becomes authoritative merely by being newer |
| P1 | 21 general files indicate training, but the canonical training list has 20 entries and predates MacArthur | Reconcile the list, then incorporate Vatutin; derive displayed counts from one maintained registry |
| P1 | Hub FAQ promises updates within a week despite missing August/September coverage | Replace the promise with actual release coverage and last-reviewed dates |

The live Kuznetsov evidence is at [its guide URL](https://easytech-wiki.com/en/world-conqueror-4/guides/admiral-kuznetsov-carrier-guide). Its local counterpart is `content/guides/wc4/admiral-kuznetsov-carrier-guide.json`. This is a confirmed local/live difference, not merely a stale search result.

A preliminary banner is not enough when nearby prose calls unsupported mechanics confirmed. Unknown values should remain unknown; do not fill them with zeroes, repeated level values, or interpolated estimates presented as measurements.

## 4. Implementation sequence

Effort ranges are planning estimates for one developer/editor with access to current gameplay evidence. They are not commitments. Full level-by-level verification may take longer if units or training materials are unavailable.

### Phase 1 — Correct the public baseline and misleading guidance

**Priority P0; estimated 2–3 working days.**

1. Add the missing release history, including today's Apple version, with per-platform versions, source URLs and checked dates. Separate patch availability from scheduled event openings.
2. Remove the stale `latest` designation from June's record. Preserve historical “as of July” context as archival context rather than the current site status.
3. Correct the highest-risk guides in section 3. Validate the local Kuznetsov revision before publishing it; its improved wording does not make every remaining claim verified.
4. Add a concise September overview linking known additions and clearly marking details awaiting verification.
5. Update the hub and freshness text in FR/EN/DE. Add a visible Updates link inside the WC4 navigation; it currently exists in default navigation but not the WC4-specific list.

**Main files:** `data/wc4/updates/`, `content/guides/wc4/`, `messages/{fr,en,de}.json`, `lib/hub-faq.ts`, `lib/nav-items.ts`.

**Done when:** all three languages display the current platform baseline; the four missing iOS releases are represented; misleading spending instructions are removed; the public pages match the reviewed revisions after deployment.

### Phase 2 — Complete entity and game-mode coverage

**Priority P1; estimated 4–7 working days after evidence becomes available.**

1. Add AS-90 and Vatutin's trained form; revise Modernized Air Force acquisition and eligible builds.
2. Add the eleven missing June generals and two Legend formations, with evidence-backed identities and abilities.
3. Publish three focused guides: 1980 Challenge Conquest, Battle of Glory, and the current event calendar. Cover Red Embers and hard Army Group modes in the calendar/overview first; create separate walkthroughs when tested.
4. Revisit beginner purchases, medal farming, training priorities, tier lists and unit/general pairings after the underlying records are checked. State test conditions and distinguish paid/free progression.
5. Synchronize indexes, search, comparisons, navigation, localized metadata and related links. Include Legend formations in search, which the current search builder omits.

**Main files:** `data/wc4/{generals,elite-units,skills,formations}/`, `data/wc4/learnable-skills.json`, `data/wc4/trained-generals-canonical.json`, `content/guides/wc4/`, `scripts/build-search-index.ts`, existing detail/guide templates and `src/i18n/config.ts` if new route families are needed.

**Done when:** every named June–September addition has a page or a clear section; no duplicate skills/general identities exist; missing measurements are labelled; all new records are discoverable in FR/EN/DE.

### Phase 3 — Make freshness and evidence maintainable

**Priority P1/P2; estimated 2–3 working days, then continuing editorial verification.**

1. Add structured provenance: platform, game version, source URL/title, source publication date, last verified date, verification status and screenshot/extraction reference. Track evidence at field level where a record mixes confirmed and unknown facts.
2. Keep release metadata centralized so the hub, update archive and guides cannot independently claim different latest versions.
3. Make validation platform-aware. `scripts/check-seo-integrity.ts:37` currently accepts only `3.*` versions, which cannot represent Android's `1.*` version line correctly. A valid URL and version format must not be described as proof that gameplay data is verified.
4. Add integrity checks for training-list drift, missing references, duplicate identities, locale completeness and unsupported numeric placeholders. Repeated stats should trigger review, not automatic replacement: some unchanged values may be legitimate.
5. Revise `CONTENT-WORKFLOW.md`: official notes establish releases; community wikis provide secondary leads; numerical mechanics require reproducible evidence. Remove the instruction to interpolate level stats as an authoritative source and the fixed assumption of two major patches per year.

**Done when:** each changed factual page identifies its version/evidence status, validators catch the defects found here, and an editor has a short repeatable release checklist.

## 5. Verification and publishing checklist

- Capture the game version/platform and stat conditions: level, technology, general, medals, ribbons and other modifiers. Verify perk thresholds and intermediate levels from evidence; checking four milestone levels does not establish every value between them.
- Reconcile each changed entity with guide text, FAQs, comparison tables and metadata. Do not translate an unverified number into three languages and treat that as verification.
- Run the existing production build and SEO checks after implementation. Check localization diagnostics as well as the final exit status. No application build was needed or run for this planning-only audit.
- Spot-check new and corrected pages in FR/EN/DE, including search, trained-form links, indexes, canonical URLs, hreflang, sitemap and redirects. Preserve existing URLs where possible.
- Verify production after publication: latest versions, one new entity, Vatutin training, Modernized Air Force, corrected Kuznetsov guide, and October event statuses. Record the deployed revision and review date.
- Keep a visible distinction between **officially announced**, **verified in-game**, **community-sourced**, **editorial opinion**, and **not yet verified**.

## 6. Ongoing editorial routine

Proposed routine: check official store metadata and EasyTech announcements weekly, and after known releases. Open a content checklist for each changed entity or mechanic; publish a sourced release summary first and detailed advice after verification. Recheck scheduled events near their opening dates. This plan does not create an automated monitor.

Track four practical measures: days behind the latest release summary; proportion of changed entities covered; unresolved high-priority contradictions; and proportion of changed numerical claims with reproducible evidence. A truthful coverage status is more useful than a blanket “updated every patch” claim.

## Evidence limits

This audit inventories local records, examines selected high-impact guides, checks live production pages, and compares official release information. It does not certify every historical statistic or strategy. Publisher notes confirm additions and dates, but usually omit exact numerical mechanics. Those remain an explicit input to implementation, rather than something to infer while writing the missing pages.
