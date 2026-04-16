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

BRANCH_NAME_EN = {
    1: "Infantry",
    2: "Cavalry",
    3: "Archer",
    4: "Navy",
}
BRANCH_NAME_FR = {
    1: "Infanterie",
    2: "Cavalerie",
    3: "Archer",
    4: "Marine",
}

EFFECT_NAME_EN = {
    "AddHP": "Health",
    "AddAttack": "Attack",
    "AddDefense": "Defense",
    "AddMobility": "Mobility",
}
EFFECT_NAME_FR = {
    "AddHP": "PV",
    "AddAttack": "Attaque",
    "AddDefense": "Défense",
    "AddMobility": "Mobilité",
}


def dominant_effect(entry: dict) -> str:
    """Return the first non-zero Add* field — GCR tech lines are
    single-stat (see AddHP/AddAttack/AddDefense/AddMobility exclusivity
    in TechnologySettings)."""
    for k in ("AddHP", "AddAttack", "AddDefense", "AddMobility"):
        if entry.get(k):
            return k
    return "AddHP"


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

    # Group by (BelongType, Type) — each pair is one tech line with L levels.
    # The previous version grouped by Type alone, producing duplicate slugs
    # ("1", "2" …) because `Name` was Chinese and slugify collapsed to the
    # branch index. BelongType (1-4) is the branch (infantry / cavalry /
    # archer / navy), Type is the line id within that branch.
    by_line: dict[tuple[int, int], list[dict]] = {}
    for t in techs:
        by_line.setdefault((t.get("BelongType", 0), t.get("Type", 0)), []).append(t)

    by_category: dict[str, int] = {}
    index: list[dict] = []
    produced: set[str] = set()

    for (branch, tid), entries in sorted(by_line.items()):
        entries.sort(key=lambda e: e.get("Level", 1))
        head = entries[0]
        category = CATEGORY_MAP.get(branch, "infantry")
        effect = dominant_effect(head)

        # Composable, collision-free slug/name: e.g. "infantry-attack",
        # "cavalry-health", "archer-defense", "navy-mobility".
        branch_en = BRANCH_NAME_EN.get(branch, "Unknown")
        branch_fr = BRANCH_NAME_FR.get(branch, "Inconnu")
        effect_en = EFFECT_NAME_EN.get(effect, effect)
        effect_fr = EFFECT_NAME_FR.get(effect, effect)
        name_en = f"{branch_en} Tactics — {effect_en}"
        name_fr = f"Tactiques {branch_fr} — {effect_fr}"
        slug = slugify(f"{branch_en}-{effect_en}")

        levels = []
        for e in entries:
            levels.append({
                "gameId": e.get("Id"),
                "level": e.get("Level", 1),
                "costGold": e.get("CostGold", 0),
                "costIndustry": e.get("CostIndustry", 0),
                "upgradeId": e.get("UpgradeId"),
                "armyType": e.get("ArmyType"),
                "addHP": e.get("AddHP", 0),
                "addAttack": e.get("AddAttack", 0),
                "addDefense": e.get("AddDefense", 0),
                "addMobility": e.get("AddMobility", 0),
                # Chinese-only name from data file; keep for reference until
                # CN→EN/FR translation pass lands.
                "nameCn": e.get("Name"),
            })

        record = {
            "slug": slug,
            "gameBranch": branch,   # 1=infantry,2=cavalry,3=archer,4=navy
            "gameTypeId": tid,
            "nameEn": name_en,
            "nameFr": name_fr,
            "category": category,
            "effect": effect,
            "maxLevel": max(e.get("Level", 1) for e in entries),
            "totalLevels": len(entries),
            "levels": levels,
            "prerequisites": [],
            "affectsArmyIds": [],
        }
        (OUT_DIR / f"{slug}.json").write_text(
            json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        produced.add(slug)
        index.append({
            "slug": slug, "nameEn": name_en, "category": category,
            "maxLevel": record["maxLevel"], "gameTypeId": tid,
            "gameBranch": branch, "effect": effect,
        })
        by_category[category] = by_category.get(category, 0) + 1

    (OUT_DIR / "_index.json").write_text(
        json.dumps({
            "version": 2,
            "totalTechs": len(index),
            "byCategory": by_category,
            "techs": index,
        }, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    # Remove stale dedup slugs from v1 runs (the ones named "1.json",
    # "2.json", etc.).
    removed = 0
    for f in OUT_DIR.glob("*.json"):
        if f.stem == "_index":
            continue
        if f.stem not in produced:
            f.unlink()
            removed += 1
    print(f"Wrote {len(index)} techs to {OUT_DIR}" + (f" (removed {removed} stale)" if removed else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
