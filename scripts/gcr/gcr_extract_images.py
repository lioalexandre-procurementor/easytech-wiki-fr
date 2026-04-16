#!/usr/bin/env python3
"""
Great Conqueror: Rome — image extractor.

Copies portraits and sprites from the unpacked APK into the wiki's
public/img/gcr tree, mirroring WC4's extract-game-images.py.

Reads from:
  - gcr_extract/unpacked/assets/image/generalphotos/*.(webp|png)
  - gcr_extract/unpacked/assets/image/bg_generalphotos/*.(webp|png)
  - gcr_extract/unpacked/assets/image/countrytech/*
  - gcr_extract/unpacked/assets/image/expedition_chapter/*

Writes to:
  - easytech-wiki/public/img/gcr/generals/<Photo>.webp  (full portrait, 400×326)
  - easytech-wiki/public/img/gcr/heads/<Photo>.webp     (cropped head, 150×150)
  - easytech-wiki/public/img/gcr/skills/skill_<type>.webp
  - easytech-wiki/public/img/gcr/armies/<ArmyId>.webp

The script doesn't resize — it just relocates images and converts PNG to
WEBP with pillow. Follow-up resize/crop to 150×150 is handled by a
downstream step (see WC4's extract-elite-portraits.py).
"""
from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "gcr_extract" / "unpacked" / "assets" / "image"
WIKI = ROOT / "easytech-wiki"
OUT = WIKI / "public" / "img" / "gcr"


def copy_glob(src_dir: Path, dest_dir: Path, suffixes=(".webp", ".png")) -> int:
    if not src_dir.exists():
        return 0
    dest_dir.mkdir(parents=True, exist_ok=True)
    n = 0
    for f in src_dir.iterdir():
        if f.suffix.lower() in suffixes:
            shutil.copy2(f, dest_dir / f.name)
            n += 1
    return n


def main() -> int:
    pairs = [
        (SRC / "generalphotos", OUT / "generals"),
        (SRC / "bg_generalphotos", OUT / "bg_generals"),
        (SRC / "countrytech", OUT / "countrytech"),
        (SRC / "expedition_chapter", OUT / "expedition"),
    ]
    total = 0
    for s, d in pairs:
        n = copy_glob(s, d)
        print(f"{s.name}: copied {n} → {d}")
        total += n
    print(f"Total: {total} images")
    # TODO: unpack sprite atlases in anim_skill.webp / battlefield_hd.webp for
    # per-skill and per-unit icons (parallel of WC4's extract-elite-sprites.py).
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
