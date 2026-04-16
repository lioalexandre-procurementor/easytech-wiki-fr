#!/usr/bin/env python3
"""
Great Conqueror: Rome — technology tree extractor.

Reads:
  - gcr_data_decrypted/TechnologySettings.json
  - gcr_data_decrypted/CountryTechLevelSettings.json
  - gcr_data_decrypted/stringtable_en.ini

Writes:
  - easytech-wiki/data/gcr/technologies/<slug>.json   (one per tech)
  - easytech-wiki/data/gcr/technologies/_index.json   (summary)

Mirrors scripts/build-tech-index.py but narrows the category set to GCR-era
branches (infantry / cavalry / archer / navy / siege / fortifications / wargear).
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
GCR_DATA = ROOT / "gcr_data_decrypted"
WIKI = ROOT / "easytech-wiki"
OUT_DIR = WIKI / "data" / "gcr" / "technologies"

CATEGORY_MAP = {
    1: "infantry",
    2: "cavalry",
    3: "archer",
    4: "navy",
    5: "siege",
    6: "fortifications",
    7: "wargear",
}


def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s or "tech"


def parse_stringtable(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or line.startswith("["):
            continue
        if "=" not in line:
            continue
        k, _, v = line.partition("=")
        out[k.strip()] = v.strip().strip('"')
    return out


def main() -> int:
    techs = json.loads((GCR_DATA / "TechnologySettings.json").read_text())
    strings_en = parse_stringtable(GCR_DATA / "stringtable_en.ini")

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
        name = strings_en.get(f"TechName_{tid}") or head.get("Name") or f"Tech_{tid}"
        slug = slugify(name)
        category_id = head.get("Category", 0)
        category = CATEGORY_MAP.get(category_id, "infantry")

        levels = []
        for e in entries:
            levels.append({
                "gameId": e.get("Id"),
                "level": e.get("Level", 1),
                "x": e.get("X", 0),
                "y": e.get("Y", 0),
                "costGold": e.get("CostGold", 0),
                "costIndustry": e.get("CostIndustry", 0),
                "costEnergy": e.get("CostEnergy", 0),
                "costTech": e.get("CostTech", 0),
                "needHQLv": e.get("NeedHQLv"),
                "needScenarioId": e.get("NeedScenarioId"),
                "descEn": strings_en.get(f"TechDesc_{tid}_{e.get('Level',1)}", ""),
                "descTemplate": strings_en.get(f"TechDesc_{tid}", ""),
                "techValues": e.get("TechValues", []),
                "techDescKeys": e.get("TechDescKeys", []),
                "prerequisiteIds": e.get("PrerequisiteIds", []),
                "upgradeToId": e.get("UpgradeToId"),
            })

        record = {
            "slug": slug,
            "gameTypeId": tid,
            "gameCategoryId": category_id,
            "nameEn": name,
            "nameFr": name,  # TODO: localize
            "category": category,
            "effectArmy": head.get("EffectArmy"),
            "maxLevel": max(e.get("Level", 1) for e in entries),
            "needHQLv": head.get("NeedHQLv", 1),
            "needScenarioId": head.get("NeedScenarioId", 0),
            "levels": levels,
            "prerequisites": [],
            "affectsArmyIds": [],
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
