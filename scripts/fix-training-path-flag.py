#!/usr/bin/env python3
"""
Fix hasTrainingPath overflagging in WC4 general data.

Background
----------
The fandom canon for WC4 lists exactly 20 generals with a real "trained"
(orange-tier) form unlocked via Swords + Sceptres of Dominance.
Source: https://world-conqueror-4.fandom.com/wiki/Training

The repo previously flagged hasTrainingPath: true on ~95 generals,
conflating the orange-tier trained form with the purple-nameplate promotion
(a separate mechanic that most gold generals can do via medals only).

This script:
  1. Reads data/wc4/trained-generals-canonical.json for the source-of-truth list.
  2. Sets hasTrainingPath: true on the 20 canonical generals (idempotent).
  3. Sets hasTrainingPath: false on every other general (non-trainable per fandom).
  4. Rebuilds data/wc4/generals/_index.json from per-file JSON so the index
     is consistent with the per-file truth.

Out of scope
------------
- Does NOT remove `training` or `trainedSkills` blocks. (Audit confirmed no
  non-canonical general has these populated, so no data loss.)
- Does NOT touch hasReplaceableSkills — that's a separate mechanic.
- Does NOT add missing trained portraits or Yamamoto's TBD trained skills.

Note on Yamamoto
----------------
Yamamoto won the player vote and is on EasyTech's training roadmap, but his
trained skills have not been finalized in-game. He is excluded from the
canonical 20 until training ships. When it does, add him to
trained-generals-canonical.json and re-run.

Usage
-----
    python3 scripts/fix-training-path-flag.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
GENERALS_DIR = REPO_ROOT / "data" / "wc4" / "generals"
INDEX_PATH = GENERALS_DIR / "_index.json"
CANONICAL_PATH = REPO_ROOT / "data" / "wc4" / "trained-generals-canonical.json"


def load_canonical() -> set[str]:
    payload = json.loads(CANONICAL_PATH.read_text(encoding="utf-8"))
    f2p = {g["slug"] for g in payload.get("f2pTrainable", [])}
    iap = {g["slug"] for g in payload.get("goldIapTrainable", [])}
    return f2p | iap


def patch_per_file(canonical: set[str], dry_run: bool) -> tuple[int, int]:
    flipped_true = 0
    flipped_false = 0
    for fp in sorted(GENERALS_DIR.glob("*.json")):
        if fp.name == "_index.json":
            continue
        d = json.loads(fp.read_text(encoding="utf-8"))
        slug = d.get("slug")
        is_canonical = slug in canonical
        current = d.get("hasTrainingPath")
        target = bool(is_canonical)
        if current != target:
            d["hasTrainingPath"] = target
            if target:
                flipped_true += 1
            else:
                flipped_false += 1
            if not dry_run:
                fp.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return flipped_true, flipped_false


def rebuild_index(dry_run: bool) -> int:
    index: list[dict] = []
    for fp in sorted(GENERALS_DIR.glob("*.json")):
        if fp.name == "_index.json":
            continue
        d = json.loads(fp.read_text(encoding="utf-8"))
        acquisition = d.get("acquisition")
        if isinstance(acquisition, dict):
            acquisition_value = acquisition.get("type")
        else:
            acquisition_value = acquisition
        index.append({
            "slug": d.get("slug"),
            "name": d.get("name"),
            "faction": d.get("faction"),
            "category": d.get("category"),
            "rank": d.get("rank"),
            "quality": d.get("quality"),
            "country": d.get("country"),
            "hasTrainingPath": bool(d.get("hasTrainingPath")),
            "hasReplaceableSkills": bool(d.get("hasReplaceableSkills") or any(
                (s.get("replaceable") for s in (d.get("skills") or []))
            )),
            "acquisition": acquisition_value,
        })
    if not dry_run:
        INDEX_PATH.write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return len(index)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="Report changes without writing")
    args = parser.parse_args()

    canonical = load_canonical()
    if len(canonical) != 20:
        print(f"WARN: canonical set has {len(canonical)} entries, expected 20.", file=sys.stderr)

    print(f"Canonical trainable generals: {len(canonical)}")
    print(f"  {sorted(canonical)}")
    print()

    flipped_true, flipped_false = patch_per_file(canonical, args.dry_run)
    print(f"Per-file hasTrainingPath flipped -> true:  {flipped_true}")
    print(f"Per-file hasTrainingPath flipped -> false: {flipped_false}")

    n = rebuild_index(args.dry_run)
    print(f"Index rebuilt with {n} entries -> {INDEX_PATH.relative_to(REPO_ROOT)}")

    if args.dry_run:
        print("\nDRY RUN — no files written.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
