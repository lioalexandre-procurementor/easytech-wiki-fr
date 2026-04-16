#!/usr/bin/env python3
"""
European War 6: 1914 — generals extractor.

Reads:
  - ew6_data_decrypted/GeneralSettings.json      (239 general records)
  - ew6_data_decrypted/SkillSettings.json        (247 skills)
  - ew6_extract/unpacked/assets/stringtable_en.ini
  - ew6_extract/unpacked/assets/stringtable_cn.ini (fallback)

Writes:
  - easytech-wiki/data/ew6/generals/<slug>.json  (one per general)
  - easytech-wiki/data/ew6/generals/_index.json

Mirrors the GCR general-extraction script. Key EW6 differences:
  - 4 attribute axes (infantry / cavalry / artillery / navy) — derived from
    ArmyType since there are no per-attribute star arrays in the source data.
  - `Country` is a single integer (1..41) mapped to country codes via
    country_<N> stringtable keys and a curated COUNTRY_TO_CODE table.
  - `SkillId` is a list of 5 skill Ids resolved against SkillSettings.Type
    via the stringtable `skill_<Type>` / `skill_desc_<Type>` convention.
"""
from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
EW6_DATA = ROOT / "ew6_data_decrypted"
EW6_EXTRACT = ROOT / "ew6_extract" / "unpacked" / "assets"
WIKI = ROOT / "easytech-wiki"
OUT_DIR = WIKI / "data" / "ew6" / "generals"

# EW6 Country id → ISO-ish country code. Country names live in stringtable
# (country_<N>); this table encodes the canonical short code we surface in
# the wiki. Keep in sync with COUNTRY_NAME_FR below.
COUNTRY_TO_CODE = {
    1: "FR",   # France
    2: "GB",   # Great Britain
    3: "HRE",  # Holy Roman Empire
    4: "AT",   # Austrian
    5: "PR",   # Prussia
    6: "DE",   # German Empire
    7: "RU",   # Russian
    8: "US",   # United States
    9: "OT",   # Ottoman
    10: "ES",  # Spanish Empire
    11: "RHI", # Rhine
    12: "HES", # Hesse-Kassel
    13: "DTB", # Deutscher Bund
    14: "SE",  # Sweden
    15: "DK",  # Denmark
    16: "BE",  # Belgium
    17: "WAR", # Warsaw
    18: "PL",  # Poland
    19: "CA",  # Dominion of Canada
    20: "PT",  # Portugal
    21: "NL",  # Netherlands
    22: "CH",  # Switzerland
    23: "SAR", # Sardinia
    24: "IT",  # Italy
    25: "NAP", # Naples
    26: "SIC", # Sicily
    27: "2SI", # Two Sicilies
    28: "DZ",  # Algeria
    29: "EG",  # Egypt
    30: "RS",  # Serbia
    31: "MA",  # Morocco
    32: "SA",  # Saudi Arabia
    33: "MX",  # Mexican Republic
    34: "COL", # Gran Colombia
    35: "BR",  # Empire of Brazil
    36: "GR",  # Greece
    37: "TRB", # Tribal Union
    38: "IRO", # Iroquois
    39: "BAV", # Bavaria
    40: "SAX", # Saxony
    41: "IT2", # Italy (second listing)
    0: "XX",
}

# French display names. English names come from stringtable_en.ini at runtime.
COUNTRY_NAME_FR = {
    "FR": "France", "GB": "Grande-Bretagne", "HRE": "Saint-Empire",
    "AT": "Autriche", "PR": "Prusse", "DE": "Empire allemand",
    "RU": "Russie", "US": "États-Unis", "OT": "Empire ottoman",
    "ES": "Espagne", "RHI": "Rhin", "HES": "Hesse-Cassel",
    "DTB": "Confédération germanique", "SE": "Suède", "DK": "Danemark",
    "BE": "Belgique", "WAR": "Duché de Varsovie", "PL": "Pologne",
    "CA": "Canada", "PT": "Portugal", "NL": "Pays-Bas",
    "CH": "Suisse", "SAR": "Sardaigne", "IT": "Italie",
    "NAP": "Naples", "SIC": "Sicile", "2SI": "Deux-Siciles",
    "DZ": "Algérie", "EG": "Égypte", "RS": "Serbie",
    "MA": "Maroc", "SA": "Arabie", "MX": "Mexique",
    "COL": "Grande Colombie", "BR": "Brésil", "GR": "Grèce",
    "TRB": "Union tribale", "IRO": "Iroquois", "BAV": "Bavière",
    "SAX": "Saxe", "IT2": "Italie",
    "XX": "—",
}

# EW6 ArmyType 1..7 encodes the commander's specialty.
# 1=Infantry, 2=Cavalry/Armor, 3=Artillery, 4=Navy, 5=Fort, 6/7=Special.
ARMY_TYPE_TO_CATEGORY = {
    0: "balanced",
    1: "infantry",
    2: "cavalry",
    3: "artillery",
    4: "navy",
    5: "infantry",      # Fort → fold into infantry
    6: "balanced",
    7: "balanced",
}

# EW6 in-shop Quality → wiki quality label (bronze/silver/gold/marshal).
# Same convention as GCR/WC4.
QUALITY_MAP = {
    0: "bronze",
    1: "bronze",
    2: "silver",
    3: "gold",
    4: "marshal",
}

# InitTitleLv (military rank 1..10) collapses to 4-tier S/A/B/C. The top of
# the table (Marshal rank 10) is S; field officers (rank 5..7) are A; company
# grade (rank 3..4) is B; the rest is C.
def rank_to_tier(rank: int) -> str:
    if rank >= 10:
        return "S"
    if rank >= 8:
        return "A"
    if rank >= 5:
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
    for raw in path.read_text(encoding="utf-8-sig", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith(";") or line.startswith("#") or line.startswith("["):
            continue
        if "=" not in line:
            continue
        k, _, v = line.partition("=")
        out[k.strip()] = v.strip().strip('"')
    return out


def render_desc(tpl: str, entry: dict) -> str:
    """Substitute {0}/{1}/{2} placeholders with SkillEffect / ActivatesChance /
    AOE values. EW6 skills expose numbers through BuffId lookups; this pass
    does a best-effort fill with the primary numeric field on the record."""
    effect = entry.get("SkillEffect") or entry.get("ActivatesChance") or 0
    chance = entry.get("ActivatesChance") or 0
    text = tpl
    text = text.replace("{0}", str(effect))
    text = text.replace("{1}", str(chance))
    text = text.replace("{2}", "3")  # fallback for grid range
    # Strip colour markup [#RRGGBB#…]
    text = re.sub(r"\[#([0-9A-Fa-f]{6})#([^\]]*)\]", r"\2", text)
    return text


def resolve_skill(
    skill_id: int, skill_settings: list[dict], strings_en: dict
) -> dict | None:
    """Return a GCR-shaped skill dict (slot set by caller)."""
    entry = next((s for s in skill_settings if s.get("Id") == skill_id), None)
    if not entry:
        return None
    stype = entry.get("Type", 0)
    name_key = f"skill_{stype}"
    desc_key = f"skill_desc_{stype}"
    name = strings_en.get(name_key) or entry.get("Name") or f"Skill #{skill_id}"
    desc_tpl = strings_en.get(desc_key, "")
    desc = render_desc(desc_tpl, entry)
    return {
        "name": name,
        "nameEn": name,
        "desc": desc,
        "rating": None,
        "stars": None,
        "icon": f"/img/ew6/skills/skill_{stype}.webp",
        "replaceable": False,
        "replaceableReason": None,
        "skillType": stype,
        "skillLevel": entry.get("Lv", 1),
        "skillSlug": slugify(name),
    }


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--all", action="store_true", help="emit every record")
    p.add_argument("--limit", type=int, default=None)
    args = p.parse_args()

    generals = json.loads((EW6_DATA / "GeneralSettings.json").read_text())
    skills = json.loads((EW6_DATA / "SkillSettings.json").read_text())
    strings_en = parse_stringtable(EW6_EXTRACT / "stringtable_en.ini")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    index: list[dict] = []
    written = 0
    for g in generals:
        in_shop = g.get("InShop", 0)
        # Accept every record by default — EW6 has 239 shop-facing officers,
        # and filtering on InShop would drop most of the named historical
        # commanders (Napoleon, Wellington, …). Use --limit to cap emission.
        ename = (g.get("EName") or "").strip()
        if not ename:
            continue
        slug = slugify(ename)
        country_id = g.get("Country", 0)
        country_code = COUNTRY_TO_CODE.get(country_id, "XX")
        army_type = g.get("ArmyType", 0)
        category = ARMY_TYPE_TO_CATEGORY.get(army_type, "balanced")
        quality = QUALITY_MAP.get(g.get("Quality", 1), "bronze")
        tier = rank_to_tier(g.get("InitTitleLv", 1))

        skill_objs: list[dict] = []
        for slot, sid in enumerate(g.get("SkillId", []) or [], start=1):
            s = resolve_skill(sid, skills, strings_en)
            if not s:
                continue
            s["slot"] = slot
            skill_objs.append(s)

        photo = g.get("Photo") or ename
        cost_medals = g.get("CostMedals") or 0
        cost_rose = g.get("CostRose") or 0
        acquisition = {
            "type": "medals" if cost_medals > 0 else ("event" if cost_rose else "coin"),
            "cost": cost_medals or cost_rose or None,
            "currency": "medals" if cost_medals > 0 else ("coin" if not cost_rose else None),
            "notes": "Donnée extraite de GeneralSettings — à vérifier",
        }

        # EW6 has no per-axis attribute arrays — surface BattleAbility as a
        # single axis-spread. The wiki comparator reads these as 0..6 stars;
        # we divide by 20 to land in range and take the BattleAbility as the
        # general attribute and ExtendBattleAbility as the ceiling.
        ba = g.get("BattleAbility", 0) or 0
        ebr = g.get("ExtendBattleAbility", 0) or ba

        def band(v: int) -> int:
            # 0..100 → 0..6 stars (integer division with clamp)
            return max(0, min(6, v // 17))

        # Put the general's BattleAbility on their primary specialty axis and
        # leave the others neutral. This keeps the comparator honest about
        # the fact EW6 doesn't ship 4-axis data out of the box.
        attrs: dict[str, dict | None] = {
            "infantry": None, "cavalry": None, "artillery": None, "navy": None,
        }
        if category in attrs:
            attrs[category] = {"start": band(ba), "max": band(ebr)}

        country_name_en = strings_en.get(f"country_{country_id}", country_code)

        record = {
            "slug": slug,
            "name": ename,
            "nameEn": ename,
            "nameCanonical": ename,
            "faction": "standard",
            "category": category,
            "rank": tier,
            "quality": quality,
            "country": country_code,
            "countryName": COUNTRY_NAME_FR.get(country_code, country_name_en),
            "shortDesc": f"Général {category} — {COUNTRY_NAME_FR.get(country_code, country_name_en)}.",
            "longDesc": (
                f"{ename} — commandant de l'ère 1800-1914 dans European War 6. "
                "Fiche générée automatiquement depuis les fichiers de jeu ; à enrichir."
            ),
            "skills": skill_objs,
            "attributes": attrs,
            "hasTrainingPath": False,
            "training": None,
            "acquisition": acquisition,
            "bonuses": [],
            "recommendedUnits": [],
            "sources": [
                "Données extraites des fichiers de jeu European War 6: 1914",
            ],
            "skillSlots": len(skill_objs),
            "unlockHQLv": g.get("InitTitleLv", 1),
            "militaryRank": g.get("InitTitleLv"),
            "gameId": g.get("Id"),
            "image": {
                "photo": f"/img/ew6/generals/{photo}.webp",
                "head":  f"/img/ew6/heads/{photo}.webp",
                "photoTrained": None,
                "headTrained": None,
            },
            "trainedSkills": None,
        }

        (OUT_DIR / f"{slug}.json").write_text(
            json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        index.append({
            "slug": slug,
            "name": ename,
            "faction": record["faction"],
            "category": category,
            "rank": tier,
            "quality": quality,
            "country": country_code,
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
    print(f"Wrote {written} generals to {OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
