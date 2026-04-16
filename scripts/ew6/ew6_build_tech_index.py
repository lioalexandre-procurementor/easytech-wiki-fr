#!/usr/bin/env python3
"""
European War 6: 1914 — technology tree extractor.

Reads:
  - ew6_data_decrypted/TechnologySettings.json
  - ew6_data_decrypted/CountryTechSettings.json
  - ew6_extract/unpacked/assets/stringtable_en.ini

Writes:
  - easytech-wiki/data/ew6/technologies/<slug>.json   (one per tech line)
  - easytech-wiki/data/ew6/technologies/_index.json   (summary)

Mirrors scripts/gcr/gcr_build_tech_index.py. EW6 tech lines are grouped by
`Type` (0..38) in TechnologySettings; each Type has 1..N levels. Stringtable
keys are `techname_<Type>` and `tech_des_<Type>`.
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
EW6_DATA = ROOT / "ew6_data_decrypted"
EW6_EXTRACT = ROOT / "ew6_extract" / "unpacked" / "assets"
WIKI = ROOT / "easytech-wiki"
OUT_DIR = WIKI / "data" / "ew6" / "technologies"

# EW6 TechnologySettings.Categorys → wiki category.
# Category 0..8 in-game maps to the 4 combat branches + economy/fortifications.
CATEGORY_MAP = {
    0: "infantry",       # Category 0/1/2 = infantry attack/defense/HP lines
    1: "infantry",
    2: "infantry",
    3: "cavalry",        # Category 3..5 = cavalry lines
    4: "cavalry",
    5: "cavalry",
    6: "artillery",      # Category 6..8 = artillery lines
    7: "artillery",
    8: "artillery",
    9: "navy",
    10: "fortifications",
}


def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s or "tech"


def parse_stringtable(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for raw in path.read_text(encoding="utf-8-sig", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith(";") or line.startswith("#") or line.startswith("["):
            continue
        if "=" not in line:
            continue
        k, _, v = line.partition("=")
        out[k.strip()] = v.strip().strip('"')
    return out


def main() -> int:
    techs = json.loads((EW6_DATA / "TechnologySettings.json").read_text())
    strings_en = parse_stringtable(EW6_EXTRACT / "stringtable_en.ini")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Group by Type — each Type is a tech line with MaxLv levels.
    by_type: dict[int, list[dict]] = {}
    for t in techs:
        by_type.setdefault(t.get("Type", 0), []).append(t)

    by_category: dict[str, int] = {}
    index: list[dict] = []

    for tid, entries in sorted(by_type.items()):
        entries.sort(key=lambda e: e.get("Level", 1))
        head = entries[0]
        name = strings_en.get(f"techname_{tid}") or head.get("Name") or f"Tech_{tid}"
        # Deduplicate multiple tech lines sharing the same English name
        # (EW6 has 3 "Attack" lines, for infantry/cavalry/artillery) by
        # appending the Type id as a slug suffix.
        base_slug = slugify(name)
        slug = f"{base_slug}-{tid}"
        category_id = head.get("Categorys", 0)
        category = CATEGORY_MAP.get(category_id, "infantry")

        levels = []
        for e in entries:
            levels.append({
                "gameId": e.get("Id"),
                "level": e.get("Level", 1),
                "x": 0,
                "y": 0,
                "costGold": e.get("CostGold", 0),
                "costIndustry": 0,
                "costEnergy": 0,
                "costTech": 0,
                "needHQLv": None,
                "needScenarioId": e.get("NeedScenarioId"),
                "descEn": strings_en.get(f"tech_des_{tid}", ""),
                "descTemplate": strings_en.get(f"tech_des_{tid}", ""),
                "techValues": e.get("TechValue", []),
                "techDescKeys": e.get("TechDesc", []),
                "prerequisiteIds": [],
                "upgradeToId": e.get("UpgradeID"),
            })

        record = {
            "slug": slug,
            "gameTypeId": tid,
            "gameCategoryId": category_id,
            "nameEn": name,
            "nameFr": name,
            "category": category,
            "effectArmy": head.get("EffectArmy"),
            "maxLevel": max(e.get("Level", 1) for e in entries),
            "needHQLv": 1,
            "needScenarioId": head.get("NeedScenarioId", 0),
            "levels": levels,
            "prerequisites": [],
            "affectsArmyIds": head.get("EffectArmy", []) or [],
        }
        (OUT_DIR / f"{slug}.json").write_text(
            json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        index.append({
            "slug": slug, "nameEn": name, "category": category,
            "maxLevel": record["maxLevel"], "gameTypeId": tid,
        })
        by_category[category] = by_category.get(category, 0) + 1

    (OUT_DIR / "_index.json").write_text(
        json.dumps({
            "version": 1,
            "totalTechs": len(index),
            "byCategory": by_category,
            "techs": index,
        }, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Wrote {len(index)} techs to {OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
