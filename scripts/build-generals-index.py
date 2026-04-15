#!/usr/bin/env python3
"""Rebuild data/wc4/generals/_index.json from all general JSON files."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GENERALS_DIR = ROOT / "data" / "wc4" / "generals"


QUALITY_RANK = {"marshal": 0, "gold": 1, "silver": 2, "bronze": 3}


def main():
    items = []
    for fp in sorted(GENERALS_DIR.glob("*.json")):
        if fp.name.startswith("_"):
            continue
        d = json.load(open(fp))
        items.append({
            "slug": d["slug"],
            "name": d["name"],
            "faction": d.get("faction", "standard"),
            "category": d.get("category", "balanced"),
            "rank": d.get("rank", "B"),
            "quality": d.get("quality", "bronze"),
            "country": d.get("country", "XX"),
            "hasTrainingPath": bool(d.get("hasTrainingPath")),
            "hasReplaceableSkills": any(s.get("replaceable") for s in d.get("skills", [])),
            "acquisition": (d.get("acquisition") or {}).get("type", "medals"),
        })

    items.sort(key=lambda g: (QUALITY_RANK.get(g["quality"], 9), g["name"]))

    out = GENERALS_DIR / "_index.json"
    out.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {len(items)} entries to {out}")


if __name__ == "__main__":
    main()
