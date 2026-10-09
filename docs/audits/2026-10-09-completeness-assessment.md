# EasyTech Wiki: completeness assessment, 9 October 2026

Scope: the whole site, with World Conqueror 4 in depth. Baseline: iOS 3.5.5 / Android 1.29.2 (29 September 2026). Coverage is measured against the official EasyTech note of 11 September 2026, NamuWiki's WC4 elite-unit page (last edited 27 September) and the WC4 Fandom wiki (read through its API on 9 October).

## Headline

WC4 has broad coverage: every standard elite unit and every September addition now has a page. The weak point is verification. No WC4 unit is marked verified, the April 2026 game-file stats disagree with Fandom's in-game tables on every unit checked, and the 8 older Scorpion units carry templated data. EW6 and GCR are skeletons with broken images.

Before this release, GitHub `main` was behind the live site: the 1 October refresh was published from a local snapshot, and the two automated pushes of 2 October failed to build. This release puts GitHub, the local copy and production back on the same code.

## World Conqueror 4

| Area | On the site | Reference | Status |
|---|---|---|---|
| Standard elite units | 46 pages | 46 on NamuWiki | Complete roster. 42 detailed, AS-90 partial, Bismarck / Delta Force / Kuznetsov still reference-only |
| Scorpion elite units | 9 pages | Fandom: Divine Wrath, E-775, KS-90 plus a few others | Divine Wrath partial and sourced. The other 8 use one generic perk template and round stats: treat as unsourced |
| Unit stat provenance | 42 from the April 2026 APK | Fandom level tables | Mismatch on every unit checked (HIMARS level 1: 86/17/365 on Fandom vs 75/12/305 here). 0 of 55 units verified |
| Unit sprites | 46 of 55 | | Kuznetsov and 8 Scorpion units have none |
| Generals | 105 pages | 222 on Fandom (includes COs and event variants) | 11 June medal generals reference-only |
| Trained generals | 22 | 25 on Fandom | Missing McCampbell (Ace Hellcat chronicle, September), Wittmann (Ace Tiger), Yamamoto. Vatutin and MacArthur stages and costs pending |
| Skills | 124 | 133 on Fandom | Modernized Air Force: unlock (350 pass points) and level 1 value now sourced |
| Technologies | 58 | | Not re-audited |
| Legend formations | 8 + 2 pending | | Fandom has info images for 1st Marine and 51st Highland Divisions (uploaded 21 and 22 August) |
| Release history | 9 entries | | Current to 3.5.5 / 1.29.2 |
| Guides | 21 | | Pre-September guides carry a "not revalidated" notice |
| Events and campaigns | Summary guides only | 393 event pages on Fandom | Red Embers (7 stages), 1980 Challenge, Rift in the Ice Curtain hard, Bzura, Peleliu, Cape Esperance (11 Oct), Leyte (20 Oct), 5 Glory Chronicles have no dedicated pages |

## New units since September: what went online

| Unit | Before | Now | Sources |
|---|---|---|---|
| AS-90 Howitzer | Reference page, no image, no values | Full page with official render; level 12 stats 131 / 35 / 675 HP, movement 18, range 3; level 1 kit (5 skills) and level 12 Sight Sharing; levels 1 to 11 show "?" | EasyTech note (11 Sept), NamuWiki, Fandom (rewards, Govorov pairing) |
| Hive Tactical Vehicle | Live as "Honeycomb" with thin copy, wrong country; a duplicate page added 2 Oct never deployed | Merged into the existing `honeycomb` URL: correct name, US, level 5 and 9 skill upgrades, drone mechanics, sourced FAQs; duplicate removed | Fandom, NamuWiki, game files |
| Divine Wrath MBT | Added 2 Oct, never deployed; levels 1 to 8 copied from level 5 | Live, marked not recruitable, stats only at levels 5 and 9 | Fandom |
| Vatutin training | Pending reference | Exclusive skill confirmed (Operation Little Saturn, level 5) plus loadout | EasyTech note, Fandom |
| Modernized Air Force | Pending reference | Unlock at 350 pass points, level 1 effect +4% | EasyTech note |

Code changes: a `knownLevels` field so partly sourced units show "?" instead of placeholder numbers and stay out of comparators; preliminary units are never shown with a tier; a "Partial pages" section on the elite list; a "Not recruitable" obtainability label.

## Other games

| | EW6 | GCR |
|---|---|---|
| Elite units | 44, all preliminary, no EN/DE copy, no FAQs | 47, all preliminary, no EN/DE copy, no FAQs |
| Unit images | 0 of 44: `/img/ew6/armies/` missing, 404 live | 0 of 47: `/img/gcr/armies/` missing, 404 live |
| Generals | 230, 7 with EN copy, 0 portraits (`/img/ew6/generals`, `/heads` missing) | 62, portraits present, 7 with EN copy |
| Skills / techs | 36 / 39 | 1 / 14 |
| Guides / updates | 0 / 0 | 0 / 0 |

## Technical issues found

1. Soft 404: unknown slugs return HTTP 200 with a "404" title and `index, follow`. Google treats these as soft 404s.
2. Broken EW6/GCR image paths (above): about 320 pages reference missing files.
3. Next.js 14.2.18 security deprecation, already noted on 1 October.
4. The watch bot guessed army IDs (354001, 354002) and duplicated an existing unit under a new slug. Its notes now tell it to check `nameEn` first and never invent IDs.

## Recommended order

1. Re-verify WC4 unit stats against the current game (emulator or fresh APK extraction): the April values may be stale across the board.
2. Replace or unpublish the 8 templated Scorpion units; settle whether Heavenly Beginning Tank is Divine Wrath MBT.
3. Fix the soft 404 and the EW6/GCR image paths (extract the sprites or drop the image fields).
4. Fill the September gaps: McCampbell / Wittmann / Yamamoto training, the 2 Legend formations, and AS-90 levels 5 and 9 once NamuWiki or Fandom publish them.
5. Event and campaign pages for the September cycle (Red Embers, 1980 Challenge), the main uncovered search demand.
