#!/usr/bin/env python3
"""
Great Conqueror: Rome — armies (units) extractor.

Reads:
  - gcr_data_decrypted/ArmySettings.json
  - gcr_data_decrypted/ArmyLevelSettings.json
  - gcr_data_decrypted/ArmyFeatureSettings.json
  - gcr_data_decrypted/stringtable_en.ini

Writes:
  - easytech-wiki/data/gcr/elite-units/<slug>.json
  - easytech-wiki/data/gcr/elite-units/_index.json

GCR uses 4 combat branches: Infantry, Cavalry, Archer, Navy. The `Type`
field in ArmySettings encodes the branch. Each record also carries
ArmyId, MaxLv, CostGold, CostMedal, etc. — mirrors WC4 extraction.
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
GCR_DATA = ROOT / "gcr_data_decrypted"
WIKI = ROOT / "easytech-wiki"
OUT_DIR = WIKI / "data" / "gcr" / "elite-units"

# ArmySettings.Type → wiki category.
TYPE_TO_CATEGORY = {
    1: "infantry",
    2: "cavalry",
    3: "archer",
    4: "navy",
    5: "infantry",  # Elephants / specials fold into infantry for now
}

# Race → country code. Same table as gcr_gen_generals but kept local so this
# script can run independently. Keep the two in sync.
RACE_TO_CODE = {
    1: "ROM", 2: "GRE", 3: "CAR", 4: "EGY", 5: "GAU", 6: "GER",
    7: "BRI", 8: "PAR", 9: "DAC", 10: "HUN", 11: "SEL", 12: "MAC",
    13: "ARM", 14: "PON", 15: "NUM", 16: "PER", 0: "XX",
}


def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s or "unit"


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


def tier_from_quality(quality: int) -> str:
    if quality >= 4:
        return "S"
    if quality == 3:
        return "A"
    if quality == 2:
        return "B"
    return "C"


def main() -> int:
    armies = json.loads((GCR_DATA / "ArmySettings.json").read_text())
    levels = json.loads((GCR_DATA / "ArmyLevelSettings.json").read_text())
    strings_en = parse_stringtable(GCR_DATA / "stringtable_en.ini")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Build level → {atk, def, hp, mov, rng} stat lookup keyed by ArmyId.
    lvl_by_army: dict[int, dict[int, dict]] = {}
    for lvl in levels:
        aid = lvl.get("ArmyId")
        lv = lvl.get("Lv", 1)
        lvl_by_army.setdefault(aid, {})[lv] = lvl

    index: list[dict] = []
    written = 0
    for a in armies:
        aid = a.get("Id")
        # GCR ArmySettings has no Ename field — resolve English name from
        # stringtable_en.ini via the `unit_name_<Id>` convention. Fall back
        # to the CN `Name` as last resort so barbarian/mercenary units that
        # lack a translation still slug deterministically.
        ename = (
            a.get("Ename")
            or strings_en.get(f"unit_name_{aid}")
            or ""
        ).strip()
        if not ename:
            # Skip untranslated records (mercenary/barbarian roster not shown
            # in the main elite catalog). Can be revisited once CN → FR/EN
            # translation pass lands.
            continue
        slug = slugify(ename)
        atype = a.get("Type", 1)
        category = TYPE_TO_CATEGORY.get(atype, "infantry")
        # GCR uses a list `Country` of nation ids, not a Race scalar. Take
        # the first country id if present, otherwise fall back to XX.
        country_list = a.get("Country") or []
        first_country = country_list[0] if isinstance(country_list, list) and country_list else a.get("Race", 0)
        race_code = RACE_TO_CODE.get(first_country, "XX")
        tier = tier_from_quality(a.get("Quality", 1))

        # Base stats live on the ArmySettings record itself for GCR
        # (MinAttack/MaxAttack/Defense/HP/Range/Mobility). ArmyLevelSettings
        # indexes per-level growth if available; otherwise the base row
        # becomes a single-element series.
        stats = {"atk": [], "def": [], "hp": [], "mov": [], "rng": []}
        max_lv = a.get("MaxLv", 12)
        base_atk = a.get("MaxAttack") or a.get("MinAttack") or 0
        base_def = a.get("Defense") or a.get("Defence") or 0
        base_hp = a.get("HP") or 0
        base_mov = a.get("Mobility") or 0
        base_rng = a.get("Range") or a.get("AttackRange") or 0
        for lv in range(1, max_lv + 1):
            entry = lvl_by_army.get(aid, {}).get(lv, {})
            stats["atk"].append(entry.get("AttackMax") or entry.get("Attack") or base_atk)
            stats["def"].append(entry.get("Defence") or entry.get("Defense") or base_def)
            stats["hp"].append(entry.get("HP") or base_hp)
            stats["mov"].append(entry.get("Mobility") or base_mov)
            stats["rng"].append(entry.get("AttackRange") or entry.get("Range") or base_rng)

        record = {
            "slug": slug,
            "name": ename,
            "nameEn": ename,
            "category": category,
            "faction": "standard",
            "country": race_code,
            "countryName": race_code,
            "tier": tier,
            "obtainability": "event" if a.get("CostMedal") else "free",
            "shortDesc": f"Unité {category} — {race_code}.",
            "longDesc": (
                f"{ename} — unité antique de Great Conqueror: Rome. "
                "Fiche générée automatiquement ; à enrichir."
            ),
            "stats": stats,
            "perks": [],
            "recommendedGenerals": [],
            "levelingPriority": [],
            "faqs": [],
            "sources": [
                "Données extraites des fichiers de jeu Great Conqueror: Rome",
            ],
            "armyId": aid,
            "image": {
                "sprite": f"/img/gcr/armies/{aid}.webp",
                "lvl12": None,
            },
            "preliminary": True,
        }
        (OUT_DIR / f"{slug}.json").write_text(
            json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        index.append({
            "slug": slug, "name": ename, "category": category,
            "faction": "standard", "country": race_code, "tier": tier,
            "armyId": aid,
        })
        written += 1

    index.sort(key=lambda r: (r["tier"], r["name"]))
    (OUT_DIR / "_index.json").write_text(
        json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"Wrote {written} armies to {OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
