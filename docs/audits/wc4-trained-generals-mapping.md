# WC4 — Trained Generals Mapping (audit)

**Date:** 2026-05-08 (revised after fix)
**Scope:** Canonical list of WC4 generals with a "trained" (orange-tier) form, mapped against `data/wc4/generals/*.json` and `content/guides/wc4/generaux-premium-wc4.json`.
**Canonical source:** [WC4 Fandom — Training](https://world-conqueror-4.fandom.com/wiki/Training)
**Canonical JSON written to:** `data/wc4/trained-generals-canonical.json`

## TL;DR

The fandom canon is **20 currently-trainable generals** (16 F2P + 4 Gold IAP, plus Katukov explicitly excluded and Yamamoto on the roadmap but not yet shipped). Post-fix repo state:

- Has every one of the 20 as a JSON file in `data/wc4/generals/` — no missing entries.
- **All 20** have `trainedSkills` populated.
- **14 of 20** have a `photoTrained` portrait. **6 are missing**: Dowding, Eisenhower, Manstein, Marshall, Messe, Zhukov.
- `hasTrainingPath` was **previously over-applied** (~95 generals true) — now corrected to exactly the 20 canonical (`scripts/fix-training-path-flag.py`).
- `_index.json` now consistent with per-file JSON (Eisenhower / Manstein / Marshall correctly flipped to `true`, Yamamoto / MacArthur / Richthofen correctly `false`).
- The wiki guide `generaux-premium-wc4` still lists **MacArthur, Richthofen, and Yamamoto** as premium trained generals — none are actually trainable per fandom. **Content fix still pending.**

## Canonical 20 trainable generals

### F2P (16, in fandom release order)

| # | Slug | Name | Class | Repo file | trainedSkills | photoTrained |
|---|------|------|-------|-----------|---------------|--------------|
| 1 | `de-gaulle` | Charles de Gaulle | airforce / artillery (trained) | yes | yes | yes |
| 2 | `rundstedt` | Gerd von Rundstedt | infantry | yes | yes | yes |
| 3 | `halsey` | William Halsey | navy | yes | yes | yes |
| 4 | `bock` | Fedor von Bock | tank | yes | yes | yes |
| 5 | `kuznetsov` | Nikolai Kuznetsov | navy | yes | yes | yes |
| 6 | `model` | Walter Model | balanced (tank) | yes | yes | yes |
| 7 | `patton` | George S. Patton | tank | yes | yes | yes |
| 8 | `govorov` | Leonid Govorov | artillery | yes | yes | yes |
| 9 | `tito` | Josip Broz Tito | infantry / econ | yes | yes | yes |
| 10 | `auchinleck` | Claude Auchinleck | tank / support | yes | yes | yes |
| 11 | `rokossovsky` | Konstantin Rokossovsky | tank | yes | yes | yes |
| 12 | `bradley` | Omar Bradley | balanced / artillery (trained) | yes | yes | yes |
| 13 | `nimitz` | Chester Nimitz | navy / airforce hybrid | yes | yes | yes |
| 14 | `vasilevsky` | Aleksandr Vasilevsky | infantry | yes | yes | yes |
| 15 | `messe` | Giovanni Messe | tank | yes | yes | **MISSING** |
| 16 | `dowding` | Hugh Dowding | airforce / econ | yes | yes | **MISSING** |

### Scheduled but not yet trainable

- `yamamoto` — won the player vote (#1, 4039 votes), training on EasyTech's roadmap, trained skills not yet finalized in-game. Currently flagged `hasTrainingPath: false` until the patch lands. Re-add to the canonical list when EasyTech ships Yamamoto's training.

### Gold IAP (4)

| Train order | Slug | Name | Class | trainedSkills | photoTrained |
|-------------|------|------|-------|---------------|--------------|
| 1st | `manstein` | Erich von Manstein | tank | yes | **MISSING** |
| 2nd | `eisenhower` | Dwight Eisenhower | balanced | yes | **MISSING** |
| 3rd | `zhukov` | Georgy Zhukov | balanced (artillery trained) | yes | **MISSING** |
| 4th | `marshall` | George C. Marshall | infantry | yes | **MISSING** |

Katukov is the lone Gold IAP general explicitly excluded from training.

## Discrepancies & action items

### 1. `_index.json` inconsistency — RESOLVED 2026-05-08

Previously: `data/wc4/generals/_index.json` flagged `hasTrainingPath: false` on Eisenhower, Manstein, Marshall while their per-file JSON had full `trainedSkills`. Resolved by `scripts/fix-training-path-flag.py`, which rebuilds the index from per-file truth.

### 2. Yamamoto trained skills missing — DEFERRED

`data/wc4/generals/yamamoto.json` has open `Emplacement libre` slots in 4–5 and no `trainedSkills`. Per fandom, Yamamoto is the #1 player-vote winner; trained skills not yet finalized in-game. Now flagged `hasTrainingPath: false` per the fix above. Re-add to the canonical list and re-run the fix script when EasyTech ships Yamamoto's training.

### 3. Six missing trained portrait images

No `image.photoTrained` set for: Dowding, Eisenhower, Manstein, Marshall, Messe, Zhukov.

Trained portraits exist in the game files (Dowding's training rolled out April 2026; Manstein/Eisenhower/Marshall/Zhukov have shipped trained art for a while). Run `scripts/extract-game-images.py` after dropping the latest extracted assets, or manually source from the fandom infobox.

Expected paths (following the existing `de_Gaulle2.webp` convention):

- `/img/wc4/generals/Dowding2.webp`, `/img/wc4/heads/Dowding2.webp`
- `/img/wc4/generals/Eisenhower2.webp`, `/img/wc4/heads/Eisenhower2.webp`
- `/img/wc4/generals/Manstein2.webp`, `/img/wc4/heads/Manstein2.webp`
- `/img/wc4/generals/Marshall2.webp`, `/img/wc4/heads/Marshall2.webp`
- `/img/wc4/generals/Messe2.webp`, `/img/wc4/heads/Messe2.webp`
- `/img/wc4/generals/Zhukov2.webp`, `/img/wc4/heads/Zhukov2.webp`

### 4. `hasTrainingPath` overflagging — RESOLVED 2026-05-08

Previously, ~75 non-trainable generals had `hasTrainingPath: true` (Abrams, MacArthur, Richthofen, Heinrici, etc.). The codebase conflated the orange-tier trained form with the purple-nameplate promotion (a separate mechanic). Resolved by `scripts/fix-training-path-flag.py` which now sets the flag strictly to the 20 canonical generals and `false` everywhere else.

Open recommendation: introduce a second boolean if/when we need to model the purple-nameplate promotion as its own UI affordance:

- `hasTrainingPath` — orange-tier trained form (the 20 canonical) — DONE
- `hasPurplePromotion` — purple-nameplate promotion (most gold generals) — TODO if needed

The **purple IAP "advanced training"** (replace 1 common skill — Colson, Wittmann, Simo Hayha, Kluge, Williams, Sokolovsky, Eichelberger, Abrams, Chernyakhovsky, Tolbukhin, Yeryomenko, Spaatz, McCampbell, Voronov, Spruance, Cunningham, Osborn, Hartmann, Kretschmer, Wu, Richthofen, Wavell) belongs on the existing `hasReplaceableSkills` flag — already populated in the index.

### 5. `generaux-premium-wc4` guide content correctness — STILL PENDING

The guide ranks "premium" generals as: 1 Manstein, 2 Eisenhower, 3 Zhukov, 4 Marshall, 5 Patton, 6 MacArthur, 7 Yamamoto, 8 Richthofen, 9 Nimitz, 10 Rundstedt.

**MacArthur, Yamamoto, and Richthofen do not have a trained form** per fandom canon (Yamamoto is on the roadmap but trained skills not yet shipped; MacArthur and Richthofen are S-gold maxable via medals only). The guide's intro line "general whose training path can be completed with sword and sceptre items" is contradicted by all three.

Two options:

1. **Restrict the guide** to true trainable generals only — drop MacArthur and Richthofen, replace with two from the canonical 17 F2P (e.g., Rokossovsky, Vasilevsky, or de Gaulle which are all higher-priority trainables per fandom recommendations).
2. **Reframe the guide title** to "Top S-gold + marshal generals" rather than "Top Premium Trained Generals," accept the broader scope, and add a sidebar explicitly noting which ones have a trained form vs. which are just expensive-to-max.

I'd lean toward option 1 because the guide URL slug (`generaux-premium-wc4`) and the EN search snippet pitches the swords/sceptres angle. The current top-10 rendering is also slightly misleading vs. the fandom-canonical priority order, which is roughly: Manstein → Eisenhower → Zhukov → Marshall (the 4 marshals first), then Rokossovsky → Patton → de Gaulle → Vasilevsky → Nimitz → Auchinleck for F2P.

## Cross-reference: fandom recommendation order vs. wiki guide order

| Fandom rank | General | In wiki top 10? |
|-------------|---------|-----------------|
| 0a | Manstein | yes (#1) |
| 0b | Eisenhower | yes (#2) |
| 0c | Zhukov | yes (#3) |
| 0d | Marshall | yes (#4) |
| 1 | Rokossovsky | **no** |
| 2 | Patton | yes (#5) |
| 3 | de Gaulle | **no** |
| 4 | Vasilevsky | **no** |
| 5 | Nimitz | yes (#9) |
| 6 | Auchinleck | **no** |
| 7 | Tito | **no** |
| 8 | Govorov | **no** |
| 9 | Bradley | **no** |
| 10 | Kuznetsov | **no** |
| 11 | Dowding | **no** |
| 12 | Bock | **no** |
| 13 | Halsey | **no** |
| 14 | Rundstedt | yes (#10) |
| 15 | Model | **no** |
| 16 | Messe | **no** |

## Suggested next actions

1. ~~Rebuild `_index.json`~~ — DONE 2026-05-08.
2. ~~Reset `hasTrainingPath` on over-flagged generals~~ — DONE 2026-05-08 via `scripts/fix-training-path-flag.py`.
3. **Drop trained portraits** for the 6 missing generals into `public/img/wc4/generals/*2.webp` and `public/img/wc4/heads/*2.webp` then patch the per-file JSON `image.photoTrained` / `image.headTrained`.
4. **Rewrite `generaux-premium-wc4`** to reflect the canonical 20 — drop MacArthur, Yamamoto, Richthofen; add Rokossovsky (fandom #1 F2P priority) plus 2 more from the canonical 16 F2P (de Gaulle / Vasilevsky / Auchinleck are strong picks).
5. Consider adding individual deep-dive pages for the highest-priority canonical trainables that don't yet have them (Rokossovsky in particular).

## Data outputs

- `data/wc4/trained-generals-canonical.json` — the 21 canonical generals with sword/sceptre costs and notes (use as a build-time reference).
- `outputs/wc4-trainable-generals.json` (Cowork session output) — full audit dump showing every general with any training-related field set.
