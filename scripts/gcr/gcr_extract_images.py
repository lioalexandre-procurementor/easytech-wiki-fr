#!/usr/bin/env python3
"""
Great Conqueror: Rome — image extractor.

Copies portraits and unpacks sprite atlases from the unpacked APK into
the wiki's public/img/gcr tree, mirroring WC4's extract-game-images.py
+ extract-elite-sprites.py in a single pass.

Reads from:
  - gcr_extract/unpacked/assets/image/generalphotos/*.(webp|png)  (full portrait)
  - gcr_extract/unpacked/assets/image/bg_generalphotos/*           (portrait bg)
  - gcr_extract/unpacked/assets/image/mediumheads/*                (200×200 head)
  - gcr_extract/unpacked/assets/image/smallheads/*                 (68×68 thumb)
  - gcr_extract/unpacked/assets/image/countrytech/*
  - gcr_extract/unpacked/assets/image/expedition_chapter/*
  - gcr_extract/unpacked/assets/image/image_skill_hd.webp + .xml   (120×120 icons)

Writes to:
  - easytech-wiki/public/img/gcr/generals/<Photo>.webp   (full portrait)
  - easytech-wiki/public/img/gcr/bg_generals/<Photo>.*
  - easytech-wiki/public/img/gcr/heads/<Photo>.webp      (200×200 head crop)
  - easytech-wiki/public/img/gcr/smallheads/<Photo>.webp (68×68 list thumb)
  - easytech-wiki/public/img/gcr/countrytech/*
  - easytech-wiki/public/img/gcr/expedition/*
  - easytech-wiki/public/img/gcr/skills/skill_<n>.webp   (unpacked from atlas)

Army sprites (data references /img/gcr/armies/<ArmyId>.webp) still fall
back to placeholders — GCR packs its unit graphics in non-atlas .pkm
ETC1 textures the wiki doesn't decode yet. General/head/skill coverage
is the win this extractor ships.
"""
from __future__ import annotations

import shutil
import xml.etree.ElementTree as ET
from pathlib import Path

try:
    from PIL import Image  # type: ignore
    _HAS_PIL = True
except ImportError:
    _HAS_PIL = False

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


def unpack_skill_atlas(atlas_webp: Path, atlas_xml: Path, dest_dir: Path) -> int:
    """Slice image_skill_hd.webp into per-skill webp files using XML coords.

    Each <Image name="Skill_<N>.png" x y w h /> maps to dest_dir/skill_<N>.webp
    so references like `/img/gcr/skills/skill_11.webp` from the generals/skills
    data resolve 1:1.
    """
    if not atlas_webp.exists() or not atlas_xml.exists():
        return 0
    if not _HAS_PIL:
        print("  (skipped skill atlas: Pillow not installed — pip install Pillow)")
        return 0
    dest_dir.mkdir(parents=True, exist_ok=True)
    atlas = Image.open(atlas_webp).convert("RGBA")
    raw_xml = atlas_xml.read_text(encoding="utf-8", errors="replace").strip()
    # The game's atlas files are fragments (no root element) — wrap so lxml
    # parses them cleanly.
    if not raw_xml.startswith("<?xml") and not raw_xml.startswith("<root>"):
        raw_xml = f"<root>{raw_xml}</root>"
    root = ET.fromstring(raw_xml)
    n = 0
    for img in root.iter("Image"):
        name = img.get("name", "")
        if not name.lower().startswith("skill_"):
            continue
        try:
            x = int(img.get("x", "0")); y = int(img.get("y", "0"))
            w = int(img.get("w", "0")); h = int(img.get("h", "0"))
        except ValueError:
            continue
        if w <= 0 or h <= 0:
            continue
        # Skill_42.png → skill_42.webp (lowercase, webp)
        stem = Path(name).stem.lower()
        crop = atlas.crop((x, y, x + w, y + h))
        crop.save(dest_dir / f"{stem}.webp", "WEBP", quality=90, method=6)
        n += 1
    return n


def main() -> int:
    pairs = [
        (SRC / "generalphotos", OUT / "generals"),
        (SRC / "bg_generalphotos", OUT / "bg_generals"),
        # FIX: general list thumbnails reference /img/gcr/heads/<Name>.webp —
        # copy mediumheads (200×200) so they resolve. Smallheads (68×68) go
        # to a parallel dir for future small-icon use.
        (SRC / "mediumheads", OUT / "heads"),
        (SRC / "smallheads", OUT / "smallheads"),
        (SRC / "countrytech", OUT / "countrytech"),
        (SRC / "expedition_chapter", OUT / "expedition"),
    ]
    total = 0
    for s, d in pairs:
        n = copy_glob(s, d)
        print(f"{s.name}: copied {n} → {d}")
        total += n

    # Skill atlas → per-skill webp
    n_skills = unpack_skill_atlas(
        SRC / "image_skill_hd.webp",
        SRC / "image_skill_hd.xml",
        OUT / "skills",
    )
    print(f"image_skill_hd: unpacked {n_skills} → {OUT / 'skills'}")
    total += n_skills

    print(f"Total: {total} images")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
