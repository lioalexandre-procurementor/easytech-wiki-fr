#!/usr/bin/env python3
"""
European War 6: 1914 — armies (units) extractor.

Reads:
  - ew6_data_decrypted/ArmySettings.json
  - ew6_data_decrypted/ArmyLevelSettings.json
  - ew6_data_decrypted/ArmyFeatureSettings.json
  - ew6_extract/unpacked/assets/stringtable_en.ini

Writes:
  - easytech-wiki/data/ew6/elite-units/<slug>.json
  - easytech-wiki/data/ew6/elite-units/_index.json

EW6 uses 4 main combat branches: Infantry, Cavalry/Armor, Artillery, Navy
(plus Forts, treated as infantry). The `Type` field in ArmySettings encodes
the branch.
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
OUT_DIR = WIKI / "data" / "ew6" / "elite-units"

# ArmySettings.Type → wiki category.
TYPE_TO_CATEGORY = {
    1: "infantry",
    2: "cavalry",
    3: "artillery",
    4: "navy",
    5: "infantry",   # Fort / garrison — folded into infantry
    6: "infantry",   # Special
    7: "infantry",
}

# Country id → short code (mirrors ew6_gen_generals; kept local so the
# scripts can be run independently).
COUNTRY_TO_CODE = {
    1: "FR", 2: "GB", 3: "HRE", 4: "AT", 5: "PR", 6: "DE", 7: "RU",
    8: "US", 9: "OT", 10: "ES", 11: "RHI", 12: "HES", 13: "DTB",
    14: "SE", 15: "DK", 16: "BE", 17: "WAR", 18: "PL", 19: "CA",
    20: "PT", 21: "NL", 22: "CH", 23: "SAR", 24: "IT", 25: "NAP",
    26: "SIC", 27: "2SI", 28: "DZ", 29: "EG", 30: "RS", 31: "MA",
    32: "SA", 33: "MX", 34: "COL", 35: "BR", 36: "GR", 37: "TRB",
    38: "IRO", 39: "BAV", 40: "SAX", 41: "IT2", 0: "XX",
}


def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s or "unit"


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


def tier_from_quality(quality: int) -> str:
    if quality >= 4:
        return "S"
    if quality == 3:
        return "A"
    if quality == 2:
        return "B"
    return "C"


def main() -> int:
    armies = json.loads((EW6_DATA / "ArmySettings.json").read_text())
    level_path = EW6_DATA / "ArmyLevelSettings.json"
    levels = json.loads(level_path.read_text()) if level_path.exists() else []
    strings_en = parse_stringtable(EW6_EXTRACT / "stringtable_en.ini")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Build level lookup keyed by ArmyId (ArmyLevelSettings schema may vary —
    # best-effort; base stats live on the ArmySettings record itself).
    lvl_by_army: dict[int, dict[int, dict]] = {}
    for lvl in levels:
        aid = lvl.get("ArmyId") or lvl.get("Id")
        lv = lvl.get("Lv") or lvl.get("Level") or 1
        if aid is not None:
            lvl_by_army.setdefault(aid, {})[lv] = lvl

    index: list[dict] = []
    written = 0
    for a in armies:
        aid = a.get("Id")
        ename = strings_en.get(f"unit_name_{aid}") or ""
        if not ename:
            # Skip untranslated records (monster/special that aren't part of
            # the shop-facing elite catalog). Revisit once CN→FR/EN pass lands.
            continue
        ename = ename.strip()
        slug = slugify(ename)
        atype = a.get("Type", 1)
        category = TYPE_TO_CATEGORY.get(atype, "infantry")
        # EW6 uses a list `Country` of nation ids, not a scalar.
        country_list = a.get("Country") or []
        first_country = country_list[0] if isinstance(country_list, list) and country_list else 0
        country_code = COUNTRY_TO_CODE.get(first_country, "XX")
        tier = tier_from_quality(a.get("Quality", 1))
        country_name_en = strings_en.get(f"country_{first_country}", country_code)
        long_desc_en = strings_en.get(f"unit_desc_{aid}", "")

        # EW6 keeps a single base-stat row per unit. Project into a 12-level
        # series with a light growth ramp so the comparator renders cleanly.
        max_lv = 12
        base_atk = a.get("Attack") or 0
        base_def = a.get("Defense") or a.get("Defence") or 0
        base_hp = a.get("HP") or 0
        base_mov = a.get("Mobility") or 0
        base_rng_min = a.get("MinRange") or 1
        base_rng_max = a.get("MaxRange") or base_rng_min

        stats = {"atk": [], "def": [], "hp": [], "mov": [], "rng": []}
        for lv in range(1, max_lv + 1):
            entry = lvl_by_army.get(aid, {}).get(lv, {})
            # Prefer per-level values when ArmyLevelSettings provides them,
            # otherwise fall back to the base row (no ramp).
            stats["atk"].append(entry.get("Attack", base_atk))
            stats["def"].append(entry.get("Defense") or entry.get("Defence") or base_def)
            stats["hp"].append(entry.get("HP", base_hp))
            stats["mov"].append(entry.get("Mobility", base_mov))
            stats["rng"].append(entry.get("MaxRange") or entry.get("Range") or base_rng_max)

        record = {
            "slug": slug,
            "name": ename,
            "nameEn": ename,
            "category": category,
            "faction": "standard",
            "country": country_code,
            "countryName": country_name_en,
            "tier": tier,
            "obtainability": "event" if a.get("NeedTechId") else "free",
            "shortDesc": f"Unité {category} — {country_code}.",
            "longDesc": (
                long_desc_en or
                f"{ename} — unité de European War 6: 1914. "
                "Fiche générée automatiquement ; à enrichir."
            ),
            "stats": stats,
            "perks": [],
            "recommendedGenerals": [],
            "levelingPriority": [],
            "faqs": [],
            "sources": [
                "Données extraites des fichiers de jeu European War 6: 1914",
            ],
            "armyId": aid,
            "image": {
                "sprite": f"/img/ew6/armies/{aid}.webp",
                "lvl12": None,
            },
            "preliminary": True,
        }
        (OUT_DIR / f"{slug}.json").write_text(
            json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        index.append({
            "slug": slug, "name": ename, "category": category,
            "faction": "standard", "country": country_code, "tier": tier,
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
