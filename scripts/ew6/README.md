# EW6 data pipeline

Ports of `scripts/gcr/` for European War 6: 1914.

| Script | Reads | Writes |
| --- | --- | --- |
| `ew6_gen_generals.py` | `ew6_data_decrypted/GeneralSettings.json`, `SkillSettings.json`, stringtable_en.ini | `data/ew6/generals/*.json` |
| `ew6_gen_armies.py` | `ArmySettings.json`, `ArmyLevelSettings.json`, stringtable_en.ini | `data/ew6/elite-units/*.json` |
| `ew6_extract_skills.py` | `SkillSettings.json`, stringtable_en.ini | `data/ew6/skills/*.json` |
| `ew6_build_tech_index.py` | `TechnologySettings.json`, `CountryTechSettings.json`, stringtable_en.ini | `data/ew6/technologies/*.json` |
| `ew6_extract_images.py` | `ew6_extract/unpacked/assets/image/**` | `public/img/ew6/**` |

## Run order

```sh
# From the easytech-wiki root:
pip install Pillow  # one-time, for image extraction

python scripts/ew6/ew6_gen_generals.py
python scripts/ew6/ew6_gen_armies.py
python scripts/ew6/ew6_extract_skills.py
python scripts/ew6/ew6_build_tech_index.py
python scripts/ew6/ew6_extract_images.py

# Verify:
npx tsc --noEmit
```
