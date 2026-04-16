#!/usr/bin/env python3
"""
Great Conqueror: Rome — generals extractor.

Reads:
  - gcr_data_decrypted/GeneralSettings.json      (381 general records)
  - gcr_data_decrypted/SkillSettings.json        (skill id -> name/desc)
  - gcr_data_decrypted/stringtable_en.ini        (English game strings)
  - gcr_data_decrypted/stringtable_cn.ini        (fallback for zh originals)
  - gcr_data_decrypted/CountrySettings.json      (Race id -> country code)

Writes:
  - easytech-wiki/data/gcr/generals/<slug>.json  (one per general)
  - easytech-wiki/data/gcr/generals/_index.json  (summary list)

Mirrors the WC4 general-extraction script (scripts/gen_generals_from_game.py)
but produces GCR-shaped records: 4 attributes (infantry / cavalry / archer /
navy) instead of WC4's 6, and GCR-specific `faction` values.

Filter: only "shop-facing" generals (Type == 1, ArenaCommander not the only
role) by default. Use `--all` to emit every record including the 300+ arena
and barbarian npcs.
"""
from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
GCR_DATA = ROOT / "gcr_data_decrypted"
WIKI = ROOT / "easytech-wiki"
OUT_DIR = WIKI / "data" / "gcr" / "generals"

# GCR Race id → country code (mirrors lib/gcr.ts::COUNTRY_FLAGS)
# Numbers below are best-guess from ArmyId ranges; verify against
# CountrySettings.json when running for real.
RACE_TO_CODE = {
    1: "ROM",  # Roman Republic / Empire
    2: "GRE",  # Greek states / Macedon
    3: "CAR",  # Carthage
    4: "EGY",  # Ptolemaic Egypt
    5: "GAU",  # Gauls
    6: "GER",  # Germanic tribes
    7: "BRI",  # Britons / Celts
    8: "PAR",  # Parthia
    9: "DAC",  # Dacia
    10: "HUN", # Huns
    11: "SEL", # Seleucids
    12: "MAC", # Macedon
    13: "ARM", # Armenia
    14: "PON", # Pontus
    15: "NUM", # Numidia
    16: "PER", # Persia
    0: "XX",
}

COUNTRY_NAME_FR = {
    "ROM": "Rome", "GRE": "Grèce", "CAR": "Carthage", "EGY": "Égypte",
    "GAU": "Gaule", "GER": "Germanie", "BRI": "Bretagne", "PAR": "Parthie",
    "DAC": "Dacie", "HUN": "Huns", "SEL": "Séleucides", "MAC": "Macédoine",
    "ARM": "Arménie", "PON": "Pont", "NUM": "Numidie", "PER": "Perse",
    "XX": "—",
}

# Races we classify as "barbarian" on the wiki side — these are the
# non-Mediterranean / tribal civs opposing Rome. Everything else stays
# in the "standard" faction.
BARBARIAN_RACES = {5, 6, 7, 9, 10}  # GAU, GER, BRI, DAC, HUN

# GCR in-shop Quality → wiki quality label.
# 1 = bronze, 2 = silver, 3 = gold in GCR's 3-tier system. Nothing outside
# that set exists in GeneralSettings; unknowns fall to bronze so the UI
# always has a badge to render.
QUALITY_MAP = {
    1: "bronze",
    2: "silver",
    3: "gold",
}


def classify_category(g: dict) -> str:
    """Pick category from the highest of the four Max attributes.

    Talent is a 2-26 enum pointing into GeneralTalentSettings, not the
    4-slot category signal the WC4 schema uses, so we derive the category
    from attribute dominance instead. Ties across three or more stats
    fall back to "balanced" — that's actually the right label there.
    """
    maxes = {
        "infantry": g.get("InfantryMax", 0) or 0,
        "cavalry":  g.get("CavalryMax", 0)  or 0,
        "archer":   g.get("ArcherMax", 0)   or 0,
        "navy":     g.get("NavyMax", 0)     or 0,
    }
    top = max(maxes.values())
    if top == 0:
        return "balanced"
    winners = [k for k, v in maxes.items() if v == top]
    if len(winners) >= 2:
        return "balanced"
    return winners[0]

# Rank 1..8 collapses to 4-letter tier. Rank 8 is the top-of-shop premium.
def rank_to_tier(rank: int) -> str:
    if rank >= 8:
        return "S"
    if rank >= 6:
        return "A"
    if rank >= 4:
        return "B"
    return "C"


def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s or "general"


def parse_stringtable(path: Path) -> dict[str, str]:
    """Parse an INI-ish key=value stringtable into a dict."""
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


def resolve_skill(
    skill_id: int, skill_settings: list[dict], strings_en: dict
) -> dict | None:
    """Return a GCR-shaped skill dict (slot set by caller)."""
    entry = next((s for s in skill_settings if s.get("Id") == skill_id), None)
    if not entry:
        return None
    name_key = f"SkillName_{entry.get('Type', 0)}"
    desc_key = f"SkillDesc_{entry.get('Type', 0)}"
    name = strings_en.get(name_key) or entry.get("Name") or f"Skill #{skill_id}"
    desc_tpl = strings_en.get(desc_key, "")
    # Render numeric placeholders. GCR stores SkillEffect / ActivatesChance.
    desc = desc_tpl.replace(
        "%d",
        str(entry.get("SkillEffect") or entry.get("ActivatesChance") or 0),
        1,
    )
    icon_type = entry.get("Type", 0)
    return {
        "name": name,
        "nameEn": name,
        "desc": desc,
        "rating": None,
        "stars": None,
        "icon": f"/img/gcr/skills/skill_{icon_type}.webp",
        "replaceable": False,
        "replaceableReason": None,
        "skillType": icon_type,
        "skillLevel": entry.get("SkillLevel", 1),
        "skillSlug": slugify(name),
    }


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--all", action="store_true", help="emit every record")
    p.add_argument("--limit", type=int, default=None)
    args = p.parse_args()

    generals = json.loads((GCR_DATA / "GeneralSettings.json").read_text())
    skills = json.loads((GCR_DATA / "SkillSettings.json").read_text())
    strings_en = parse_stringtable(GCR_DATA / "stringtable_en.ini")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Stale-file cleanup: any .json in the output dir that isn't _index.json
    # and isn't produced by this run is removed at the end so quality /
    # faction reclassifications don't leave zombie records (e.g. the
    # pre-existing "aetius.json" with quality: marshal from an older
    # extraction that doesn't match the current schema).
    produced_slugs: set[str] = set()

    index: list[dict] = []
    written = 0
    for g in generals:
        in_shop = g.get("InShop", 0)
        gtype = g.get("Type", 0)
        if not args.all and not (in_shop == 1 or gtype == 1):
            continue
        ename = (g.get("Ename") or "").strip()
        name_cn = g.get("Name", "")
        if not ename:
            continue
        slug = slugify(ename)
        race_id = g.get("Race", 0)
        race_code = RACE_TO_CODE.get(race_id, "XX")
        # Category = dominant max attribute (Talent is a 2-26 id that
        # points into GeneralTalentSettings, not a 4-slot enum — see
        # classify_category docstring).
        category = classify_category(g)
        # Barbarian civs (Gauls, Germans, Britons, Dacians, Huns) go to
        # the barbarian faction; everyone else is standard.
        faction = "barbarian" if race_id in BARBARIAN_RACES else "standard"
        quality = QUALITY_MAP.get(g.get("Quality", 1), "bronze")
        tier = rank_to_tier(g.get("Rank", 1))

        skill_objs: list[dict] = []
        for slot, sid in enumerate(g.get("Skills", []) or [], start=1):
            s = resolve_skill(sid, skills, strings_en)
            if not s:
                continue
            s["slot"] = slot
            skill_objs.append(s)

        photo = g.get("Photo") or ename
        acquisition = {
            "type": "medals" if g.get("CostMedal", 0) > 0 else "coin",
            "cost": g.get("CostMedal") or g.get("CostGold") or None,
            "currency": "medals" if g.get("CostMedal", 0) > 0 else "coin",
            "notes": "Donnée extraite de GeneralSettings — à vérifier",
        }

        record = {
            "slug": slug,
            "name": ename,
            "nameEn": ename,
            "nameCanonical": ename,
            "faction": faction,
            "category": category,
            "rank": tier,
            "quality": quality,
            "country": race_code,
            "countryName": COUNTRY_NAME_FR.get(race_code, race_code),
            "shortDesc": f"Général {category} — {COUNTRY_NAME_FR.get(race_code, race_code)}.",
            "longDesc": (
                f"{ename} — commandant antique de Great Conqueror: Rome. "
                "Fiche générée automatiquement depuis les fichiers de jeu ; à enrichir."
            ),
            "skills": skill_objs,
            "attributes": {
                "infantry": {"start": g.get("Infantry", 0), "max": g.get("InfantryMax", 0)},
                "cavalry":  {"start": g.get("Cavalry", 0),  "max": g.get("CavalryMax", 0)},
                "archer":   {"start": g.get("Archer", 0),   "max": g.get("ArcherMax", 0)},
                "navy":     {"start": g.get("Navy", 0),     "max": g.get("NavyMax", 0)},
            },
            "hasTrainingPath": False,
            "training": None,
            "acquisition": acquisition,
            "bonuses": [],
            "recommendedUnits": [],
            "sources": [
                "Données extraites des fichiers de jeu Great Conqueror: Rome",
            ],
            "skillSlots": len(skill_objs),
            "unlockHQLv": g.get("DefaultLv", 1),
            "militaryRank": g.get("Rank"),
            "gameId": g.get("Id"),
            "image": {
                "photo": f"/img/gcr/generals/{photo}.webp",
                "head":  f"/img/gcr/heads/{photo}.webp",
                "photoTrained": None,
                "headTrained": None,
            },
            "trainedSkills": None,
        }

        (OUT_DIR / f"{slug}.json").write_text(
            json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        produced_slugs.add(slug)
        index.append({
            "slug": slug,
            "name": ename,
            "faction": record["faction"],
            "category": category,
            "rank": tier,
            "quality": quality,
            "country": race_code,
            "hasTrainingPath": False,
            "hasReplaceableSkills": False,
            "acquisition": acquisition["type"],
        })
        written += 1
        if args.limit and written >= args.limit:
            break

    index.sort(key=lambda r: (r["rank"], r["name"]))
    (OUT_DIR / "_index.json").write_text(
        json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Remove any stale records from previous extractor runs that no longer
    # match a current roster entry.
    removed = 0
    for f in OUT_DIR.glob("*.json"):
        if f.stem == "_index":
            continue
        if f.stem not in produced_slugs:
            f.unlink()
            removed += 1

    print(f"Wrote {written} generals to {OUT_DIR}" + (f" (removed {removed} stale)" if removed else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
