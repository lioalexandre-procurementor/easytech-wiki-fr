#!/usr/bin/env python3
"""
Generate a new WC4 elite unit JSON file from structured input.
Usage: python3 generate_unit_json.py --slug delta-force --name "Delta Force" ...

If called with no arguments, prints the template and exits.
"""
import argparse
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "wc4" / "elite-units"
INDEX_FILE = DATA_DIR / "_index.json"

CATEGORIES = ["tank", "infantry", "artillery", "navy", "airforce"]
FACTIONS = ["standard", "scorpion"]
TIERS = ["S", "A", "B", "C"]
OBTAIN = ["free", "event", "shop", "premium"]


def build_template(slug, name, name_en, category, faction, country, country_name,
                   tier, obtainability, short_desc_fr, short_desc_en, short_desc_de,
                   long_desc_fr, long_desc_en, long_desc_de,
                   army_id=None):
    """Build a UnitData-compatible dict with preliminary:true."""
    stats = {
        "atk":  [0]*12, "def": [0]*12, "hp": [0]*12,
        "mov": [2]*12, "rng": [1]*12
    }
    image = {}
    if army_id:
        image["sprite"] = f"/img/wc4/elites/{army_id}.webp"
        image["lvl12"] = None

    return {
        "slug": slug,
        "name": name,
        "nameEn": name_en or name,
        "category": category,
        "faction": faction,
        "country": country,
        "countryName": country_name,
        "tier": tier,
        "obtainability": obtainability,
        "preliminary": True,
        "shortDesc": short_desc_fr,
        "shortDescEn": short_desc_en or short_desc_fr,
        "shortDescDe": short_desc_de or short_desc_fr,
        "longDesc": long_desc_fr,
        "longDescEn": long_desc_en or long_desc_fr,
        "longDescDe": long_desc_de or long_desc_fr,
        "stats": stats,
        "perks": [],
        "image": image if image else None,
        "recommendedGenerals": [],
        "levelingPriority": [
            "Stats et perks à compléter après vérification en jeu.",
            "Priorité de montée en niveau à déterminer."
        ],
        "faqs": [],
        "faqsEn": [],
        "faqsDe": [],
        "sources": []
    }


def add_to_index(entry):
    """Append an entry to _index.json if not already present."""
    existing = []
    if INDEX_FILE.exists():
        existing = json.loads(INDEX_FILE.read_text())
    slugs = {e["slug"] for e in existing}
    if entry["slug"] in slugs:
        print(f"[SKIP] {entry['slug']} already in _index.json")
        return
    existing.append({
        "slug": entry["slug"],
        "name": entry["name"],
        "category": entry["category"],
        "faction": entry["faction"],
        "tier": entry["tier"],
        "country": entry["country"]
    })
    INDEX_FILE.write_text(json.dumps(existing, indent=2, ensure_ascii=False) + "\n")
    print(f"[INDEX] Added {entry['slug']} to _index.json")


def main():
    parser = argparse.ArgumentParser(description="Generate a WC4 elite unit JSON")
    parser.add_argument("--slug", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--name-en")
    parser.add_argument("--category", required=True, choices=CATEGORIES)
    parser.add_argument("--faction", choices=FACTIONS, default="standard")
    parser.add_argument("--country", default="XX")
    parser.add_argument("--country-name", default="Inconnu")
    parser.add_argument("--tier", choices=TIERS, default="B")
    parser.add_argument("--obtainability", choices=OBTAIN, default="event")
    parser.add_argument("--short-desc-fr", default="À compléter.")
    parser.add_argument("--short-desc-en", default="TBD.")
    parser.add_argument("--short-desc-de", default="TBD.")
    parser.add_argument("--long-desc-fr", default="À compléter.")
    parser.add_argument("--long-desc-en", default="TBD.")
    parser.add_argument("--long-desc-de", default="TBD.")
    parser.add_argument("--army-id", type=int)
    parser.add_argument("--no-add-index", action="store_true",
                        help="Skip _index.json update")
    args = parser.parse_args()

    unit = build_template(
        args.slug, args.name, args.name_en or args.name,
        args.category, args.faction, args.country, args.country_name,
        args.tier, args.obtainability,
        args.short_desc_fr, args.short_desc_en, args.short_desc_de,
        args.long_desc_fr, args.long_desc_en, args.long_desc_de,
        army_id=args.army_id
    )

    out_path = DATA_DIR / f"{args.slug}.json"
    out_path.write_text(json.dumps(unit, indent=2, ensure_ascii=False) + "\n")
    print(f"[UNIT] Wrote {out_path}")

    if not args.no_add_index:
        add_to_index(unit)

    print(f"\nNext: fill in stats, perks, faqs. Then run 'npm run build' and push.")


if __name__ == "__main__":
    main()
