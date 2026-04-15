#!/usr/bin/env python3
"""Fix data/wc4/generals/*.json where attribute max < start.

APK raw values use max=0 to mean 'training doesn't upgrade this stat',
which the backfill wrote literally. The semantic intent is max=start
(i.e., no training bonus). This script clamps max to at least start.
"""
import json
from pathlib import Path

WIKI = Path(__file__).resolve().parent.parent / "data" / "wc4" / "generals"
ATTR_KEYS = ["infantry", "artillery", "armor", "navy", "airforce", "marching"]


def main():
    fixed_files = 0
    fixed_fields = 0
    for p in sorted(WIKI.glob("*.json")):
        if p.name.startswith("_"):
            continue
        g = json.loads(p.read_text(encoding="utf-8"))
        attrs = g.get("attributes") or {}
        changed = False
        for k in ATTR_KEYS:
            v = attrs.get(k)
            if not v:
                continue
            start = v.get("start")
            mx = v.get("max")
            if isinstance(start, int) and isinstance(mx, int) and mx < start:
                attrs[k] = {"start": start, "max": start}
                print(f"  {p.stem}.{k}: {start}/{mx} -> {start}/{start}")
                fixed_fields += 1
                changed = True
        if changed:
            p.write_text(
                json.dumps(g, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            fixed_files += 1
    print(f"\nFixed {fixed_fields} fields across {fixed_files} files.")


if __name__ == "__main__":
    main()
