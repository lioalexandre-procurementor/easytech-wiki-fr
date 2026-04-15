#!/usr/bin/env python3
"""
Backfill per-perk `nameEn` / `nameDe` / `descEn` / `descDe` on every
elite unit. Uses translation tables produced by the parallel subagents
in /tmp/perk-names-translations.py and /tmp/perk-descs-translations.py.

The translation tables are loaded dynamically so this script can be
re-run after the tables are updated without rewriting this file.
"""

from __future__ import annotations
import json
import sys
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UNIT_DIR = ROOT / "data" / "wc4" / "elite-units"

# The translation tables live outside the repo (in /tmp) so they're
# not committed. Load them via importlib for a quick one-shot run.
NAMES_PATH = Path("/tmp/perk-names-translations.py")
DESCS_PATH = Path("/tmp/perk-descs-translations.py")


def load_module(path: Path, module_name: str):
    spec = importlib.util.spec_from_file_location(module_name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    return mod


def main() -> int:
    if not NAMES_PATH.exists():
        print(f"Missing: {NAMES_PATH}", file=sys.stderr)
        return 2
    if not DESCS_PATH.exists():
        print(f"Missing: {DESCS_PATH}", file=sys.stderr)
        return 2

    names_mod = load_module(NAMES_PATH, "_perk_names")
    descs_mod = load_module(DESCS_PATH, "_perk_descs")
    perk_names: dict[str, tuple[str, str]] = names_mod.PERK_NAMES
    perk_descs: dict[str, tuple[str, str]] = descs_mod.PERK_DESCS

    files = sorted(UNIT_DIR.glob("*.json"))
    files = [f for f in files if not f.name.startswith("_")]
    updated_files = 0
    updated_perks = 0
    skipped_perks = 0
    missing_names: set[str] = set()
    missing_descs: set[str] = set()

    for fp in files:
        with fp.open("r", encoding="utf-8") as f:
            data = json.load(f)
        perks = data.get("perks") or []
        if not perks:
            continue
        file_dirty = False
        for perk in perks:
            perk_dirty = False
            name = perk.get("name")
            desc = perk.get("desc")

            # name
            if name and not (perk.get("nameEn") and perk.get("nameDe")):
                tr = perk_names.get(name)
                if tr is None:
                    missing_names.add(name)
                else:
                    en, de = tr
                    perk["nameEn"] = en
                    perk["nameDe"] = de
                    perk_dirty = True

            # desc
            if desc and not (perk.get("descEn") and perk.get("descDe")):
                tr = perk_descs.get(desc)
                if tr is None:
                    missing_descs.add(desc)
                else:
                    en, de = tr
                    perk["descEn"] = en
                    perk["descDe"] = de
                    perk_dirty = True

            if perk_dirty:
                updated_perks += 1
                file_dirty = True
            else:
                skipped_perks += 1

        if file_dirty:
            with fp.open("w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write("\n")
            updated_files += 1

    print(f"Files updated: {updated_files}")
    print(f"Perks updated: {updated_perks} · skipped: {skipped_perks}")
    if missing_names:
        print(f"\nMISSING NAME translations ({len(missing_names)}):")
        for n in sorted(missing_names)[:20]:
            print(f"  {n}")
    if missing_descs:
        print(f"\nMISSING DESC translations ({len(missing_descs)}):")
        for d in sorted(missing_descs)[:20]:
            print(f"  {d[:100]}")
    if missing_names or missing_descs:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
