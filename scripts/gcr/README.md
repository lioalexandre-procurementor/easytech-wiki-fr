# GCR extraction pipeline

Scripts in this folder parallel the WC4 extraction scripts at `scripts/`
(e.g. `gen_generals_from_game.py`, `extract-skills.py`, `build-tech-index.py`)
but target the Great Conqueror: Rome dataset under `gcr_data_decrypted/` and
produce JSON under `easytech-wiki/data/gcr/`.

## Prerequisites

Run `decrypt_easytech.py` against the GCR APK first so that
`SEO site project/gcr_data_decrypted/` exists and contains the JSON + INI
settings files. (The decrypt was already done and the files are in-tree.)

## Scripts

| Script | What it does | Output |
|---|---|---|
| `gcr_gen_generals.py`   | Reads GeneralSettings.json + stringtable_en.ini + image/generalphotos to emit one JSON per general. | `data/gcr/generals/<slug>.json` + `_index.json` |
| `gcr_gen_armies.py`     | Reads ArmySettings.json + ArmyLevelSettings + stringtable to emit one JSON per unit. | `data/gcr/elite-units/<slug>.json` + `_index.json` |
| `gcr_extract_skills.py` | Reads SkillSettings.json + stringtable to emit one JSON per skill type. | `data/gcr/skills/<slug>.json` + `_index.json` |
| `gcr_build_tech_index.py` | Reads TechnologySettings.json + CountryTechLevelSettings + stringtable. | `data/gcr/technologies/<slug>.json` + `_index.json` |
| `gcr_extract_images.py` | Copies PNG/WEBP portraits and sprites from `gcr_extract/unpacked/assets/image/` into `easytech-wiki/public/img/gcr/`. | `public/img/gcr/{generals,heads,elites,skills,armies}/*` |

## Run order

```bash
cd "SEO site project/easytech-wiki"
python3 scripts/gcr/gcr_extract_images.py
python3 scripts/gcr/gcr_gen_generals.py
python3 scripts/gcr/gcr_gen_armies.py
python3 scripts/gcr/gcr_extract_skills.py
python3 scripts/gcr/gcr_build_tech_index.py
```

## Key differences vs. WC4 extraction

- **Attributes**: GCR generals have 4 axes (Infantry, Cavalry, Archer, Navy)
  instead of WC4's 6. `gcr_gen_generals.py` writes `attributes.infantry`,
  `attributes.cavalry`, `attributes.archer`, `attributes.navy` and omits
  WC4's `artillery / armor / airforce / marching`.
- **No Iron Cross currency** — GCR uses Gold + Medal only for shop
  acquisition, plus the `Mark` field for the premium "laurel" currency.
- **ArmyColor / Race**: GCR adds faction-team colouring and a numeric
  race id — `gcr_gen_armies.py` maps this to the ROM/GRE/CAR/... country
  code set from `lib/gcr.ts::COUNTRY_FLAGS`.
- **Country roster**: `CountrySettings.json` in GCR enumerates the ancient
  civilizations (ROM, GRE, CAR, EGY, GAU, GER, …). The mapping from a
  game-internal numeric `Race` id to the ISO-like code is documented in
  `gcr_country_map.json` (produced by `gcr_gen_armies.py`).
