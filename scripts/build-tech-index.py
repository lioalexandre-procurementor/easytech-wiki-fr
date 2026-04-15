#!/usr/bin/env python3
"""
Build the WC4 technology catalog from the decrypted APK data.

Inputs
------
- wc4_data_decrypted/TechnologySettings.json  (191 tech level entries)
- wc4_extract/assets/stringtable_en.ini       (tech_name_{type}, tech_desc_{id})

Outputs
-------
- easytech-wiki/data/wc4/technologies/{slug}.json   (one file per tech chain)
- easytech-wiki/data/wc4/technologies/_index.json   (index grouped by category)

Schema notes (discovered from actual APK data):
- Each row in TechnologySettings is ONE LEVEL of a tech chain.
- A chain is identified by (Type, Categorys): all rows with the same Type share
  the same name and belong to the same category.
- Type field indexes into tech_name_{Type} in the string table (0-indexed, 58 names).
- Level field (1-8) is the progression step within the chain.
- UpgradeID points to the next level row; UpgradeID=0 means max level.
- NeedID is a list of prerequisite tech IDs (can be cross-chain within a category).
- TechDesc is a list of desc-key indices (into tech_desc_{n} in string table).
- TechValue is a list of values to substitute into the %d placeholders.
- Position is [x, y] grid coordinates on the tech tree UI.
- EffectArmy is a unit-category int: 1=infantry, 2=armor, 3=artillery, 4=navy,
  5=airforce, 6=missile, 7=nuclear, 8=fortifications, 0=general/none.
- Categorys maps to readable category: 0=infantry, 1=armor, 2=artillery, 3=navy,
  4=airforce, 5=fortifications, 6=antiair, 7=missile.

Note: Categorys=5 and 6 chains start at Level 2 (no Level-1 entry exists in the
data). This is normal; those techs require certain prerequisites to unlock.
"""

import json
import re
from collections import defaultdict
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[2]
WIKI = ROOT / "easytech-wiki"

TECH_SETTINGS   = ROOT / "wc4_data_decrypted" / "TechnologySettings.json"
STRINGTABLE_EN  = ROOT / "wc4_extract" / "assets" / "stringtable_en.ini"
OUT_DIR         = WIKI / "data" / "wc4" / "technologies"

# ---------------------------------------------------------------------------
# Category mapping (Categorys integer -> readable slug)
# Derived from EffectArmy field and unit type inspection:
#   Categorys=0, EffectArmy=1 -> infantry units (Type 1)
#   Categorys=1, EffectArmy=2 -> armor units (Type 2: tanks / armored vehicles)
#   Categorys=2, EffectArmy=3 -> artillery units (Type 3)
#   Categorys=3, EffectArmy=4 -> navy units (Type 4)
#   Categorys=4, EffectArmy=5 -> airforce units (Type 5)
#   Categorys=5, EffectArmy=8 -> fortification units (Type 8)
#   Categorys=6, EffectArmy=0 -> anti-air (tech names: Anti-air Gun/Artillery/Missile, Radar)
#   Categorys=7, EffectArmy=6+7 -> missiles + nuclear (Types 6, 7)
# ---------------------------------------------------------------------------
CATEGORY_MAP = {
    0: "infantry",
    1: "armor",
    2: "artillery",
    3: "navy",
    4: "airforce",
    5: "fortifications",
    6: "antiair",
    7: "missile",
}


def load_stringtable(path: Path) -> dict[str, str]:
    """Parse a .ini string table into a {key: value} dict."""
    result = {}
    with open(path, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            line = line.rstrip("\n\r")
            if "=" in line and not line.startswith(";"):
                key, _, val = line.partition("=")
                result[key.strip()] = val
    return result


def slugify(name: str) -> str:
    """Convert a display name to a URL-safe slug."""
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def format_desc(template: str, value: int) -> str:
    """Substitute %d / %d%% placeholders in a description template."""
    # The template may have %d%% (renders as "N%") or %d (renders as "N")
    # We substitute left-to-right with the single value (all placeholders use
    # the same value per level in this dataset).
    return template.replace("%d%%", f"{value}%").replace("%d", str(value))


def build_level_desc(tech_desc_keys: list, tech_values: list, descs: dict[str, str]) -> str:
    """Build a comma-joined description for a tech level."""
    parts = []
    for desc_key, val in zip(tech_desc_keys, tech_values):
        template = descs.get(f"tech_desc_{desc_key}", "")
        if template:
            parts.append(format_desc(template, val))
    return "; ".join(parts)


def main() -> None:
    # -----------------------------------------------------------------------
    # Load raw data
    # -----------------------------------------------------------------------
    tech_data: list[dict] = json.loads(TECH_SETTINGS.read_text(encoding="utf-8"))
    strings = load_stringtable(STRINGTABLE_EN)

    # Build quick lookups
    id_to_row: dict[int, dict] = {t["Id"]: t for t in tech_data}

    # -----------------------------------------------------------------------
    # Group rows into chains keyed by (Type, Categorys)
    # -----------------------------------------------------------------------
    chains: dict[tuple[int, int], list[dict]] = defaultdict(list)
    for row in tech_data:
        key = (row["Type"], row["Categorys"])
        chains[key].append(row)

    # Sort each chain by Level
    for key in chains:
        chains[key].sort(key=lambda r: r["Level"])

    print(f"Total tech rows: {len(tech_data)}")
    print(f"Distinct chains: {len(chains)}")

    # -----------------------------------------------------------------------
    # Ensure output directory exists
    # -----------------------------------------------------------------------
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # -----------------------------------------------------------------------
    # Build per-chain JSON files
    # -----------------------------------------------------------------------
    slug_counts: dict[str, int] = {}
    index_techs: list[dict] = []
    by_category: dict[str, int] = defaultdict(int)

    written = 0
    for (type_id, cat_id), rows in sorted(chains.items()):
        # Name from string table
        name_en = strings.get(f"tech_name_{type_id}", f"tech_{type_id}").strip()
        category = CATEGORY_MAP.get(cat_id, f"cat_{cat_id}")

        # Slug (disambiguated if needed)
        base_slug = slugify(name_en)
        if base_slug not in slug_counts:
            slug_counts[base_slug] = 1
            slug = base_slug
        else:
            slug_counts[base_slug] += 1
            slug = f"{base_slug}-{slug_counts[base_slug]}"

        # Use the first (lowest-level) row for top-level metadata
        first = rows[0]
        max_level = max(r["Level"] for r in rows)
        need_hq_lv = first.get("NeedHQLv", 0)
        need_scenario = first.get("NeedScenarioId", 0)

        # Prerequisites for the first level (cross-chain deps)
        # These are the IDs from the lowest-level row's NeedID that point to a
        # different chain (same-chain sequential deps are omitted — they are
        # implicit in the levels array).
        first_level_need_ids: list[int] = first.get("NeedID", [])
        # We store raw prerequisite APK IDs; let the UI resolve to slugs later.
        # TODO: resolve prereq IDs to slugs in a later pass when all chains are known.
        prerequisites: list[int] = first_level_need_ids

        # Collect all prerequisite IDs across ALL levels (for full dep graph)
        all_prereq_ids: set[int] = set()
        for r in rows:
            all_prereq_ids.update(r.get("NeedID", []))

        # EffectArmy: which unit category this tech buffs
        effect_army = first.get("EffectArmy", 0)

        # Build levels array
        levels = []
        for r in rows:
            pos = r.get("Position", [0, 0])
            x = pos[0] if isinstance(pos, list) and len(pos) > 0 else 0
            y = pos[1] if isinstance(pos, list) and len(pos) > 1 else 0

            tech_desc_keys: list[int] = r.get("TechDesc", [])
            tech_values: list[int] = r.get("TechValue", [])

            # Build human-readable description
            desc_en = build_level_desc(tech_desc_keys, tech_values, strings)

            level_obj = {
                "level": r["Level"],
                "apkId": r["Id"],
                "x": x,
                "y": y,
                "costGold": r.get("CostGold", 0),
                "costIndustry": r.get("CostIndustry", 0),
                "costEnergy": r.get("CostEnergy", 0),
                "costTech": r.get("CostTech", 0),
                "needHQLv": r.get("NeedHQLv", 0),
                "needScenarioId": r.get("NeedScenarioId", 0),
                "prerequisiteIds": r.get("NeedID", []),
                "upgradeToId": r.get("UpgradeID", 0),
                "descEn": desc_en,
                "descTemplate": "; ".join(
                    strings.get(f"tech_desc_{k}", "") for k in tech_desc_keys
                ),
                "techDescKeys": tech_desc_keys,
                "techValues": tech_values,
            }
            levels.append(level_obj)

        # First-level prereq IDs that are from a different chain
        # (same-chain sequential prereqs are implicit in the levels list)
        same_chain_ids = {r["Id"] for r in rows}
        cross_chain_prereqs = [
            pid for pid in all_prereq_ids if pid not in same_chain_ids
        ]

        tech_doc = {
            "slug": slug,
            "apkTypeId": type_id,
            "apkCategoryId": cat_id,
            "nameEn": name_en,
            "nameFr": name_en,  # FR translation deferred to a later pass
            "category": category,
            "effectArmy": effect_army,
            "maxLevel": max_level,
            "needHQLv": need_hq_lv,
            "needScenarioId": need_scenario,
            "levels": levels,
            "prerequisites": cross_chain_prereqs,
        }

        out_path = OUT_DIR / f"{slug}.json"
        out_path.write_text(json.dumps(tech_doc, indent=2, ensure_ascii=False))
        written += 1

        # Index entry
        index_techs.append({
            "slug": slug,
            "nameEn": name_en,
            "category": category,
            "maxLevel": max_level,
            "apkTypeId": type_id,
        })
        by_category[category] += 1

    # -----------------------------------------------------------------------
    # Write _index.json
    # -----------------------------------------------------------------------
    index = {
        "version": 1,
        "totalTechs": written,
        "byCategory": dict(sorted(by_category.items())),
        "techs": sorted(index_techs, key=lambda t: (t["category"], t["nameEn"])),
    }
    (OUT_DIR / "_index.json").write_text(
        json.dumps(index, indent=2, ensure_ascii=False)
    )

    # -----------------------------------------------------------------------
    # Summary
    # -----------------------------------------------------------------------
    print(f"\nWrote {written} tech chain files + _index.json to {OUT_DIR}")
    print("\nCategory breakdown:")
    for cat, count in sorted(by_category.items()):
        print(f"  {cat}: {count} chains")

    total_rows_covered = sum(len(rows) for rows in chains.values())
    print(f"\nTotal level rows covered: {total_rows_covered} / {len(tech_data)}")


if __name__ == "__main__":
    main()
