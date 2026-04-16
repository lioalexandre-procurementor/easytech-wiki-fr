#!/usr/bin/env python3
"""
European War 6: 1914 — image extractor.

EW6's APK packs general portraits as ETC1 .pkm textures inside
`assets/image/generalphoto/` — the browser can't render these, so until
the wiki ships a PKM decoder step the general cards fall back to
placeholders. What IS decodable here:

  - image_skill_hd.png  + .xml   → per-skill icons (36 skills)
  - image_flags_hd.png  + .xml   → per-country flag sprites (41 flags)
  - image_tech_hd.png   + .xml   → per-tech icons
  - image_upgraderank_hd.png + .xml → rank insignia
  - illustrations/*.webp, illustrations/*.png → conquest/campaign banners
  - bg/campaignN.webp, bg/conquestN.webp → campaign background art

Writes to:
  - easytech-wiki/public/img/ew6/skills/skill_<n>.webp
  - easytech-wiki/public/img/ew6/flags/flag_<code>.webp
  - easytech-wiki/public/img/ew6/techs/tech_<n>.webp
  - easytech-wiki/public/img/ew6/ranks/rank_<n>.webp
  - easytech-wiki/public/img/ew6/illustrations/*.webp
  - easytech-wiki/public/img/ew6/campaign/*.webp
"""
from __future__ import annotations

import re
import shutil
import xml.etree.ElementTree as ET
from pathlib import Path

try:
    from PIL import Image  # type: ignore
    _HAS_PIL = True
except ImportError:
    _HAS_PIL = False

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "ew6_extract" / "unpacked" / "assets" / "image"
WIKI = ROOT / "easytech-wiki"
OUT = WIKI / "public" / "img" / "ew6"


def copy_glob(src_dir: Path, dest_dir: Path, suffixes=(".webp", ".png")) -> int:
    if not src_dir.exists():
        return 0
    dest_dir.mkdir(parents=True, exist_ok=True)
    n = 0
    for f in src_dir.iterdir():
        if f.is_file() and f.suffix.lower() in suffixes:
            shutil.copy2(f, dest_dir / f.name)
            n += 1
    return n


def unpack_atlas(
    atlas_img: Path,
    atlas_xml: Path,
    dest_dir: Path,
    name_prefix: str,
    output_prefix: str = "",
) -> int:
    """Slice a texture atlas into per-sprite webp files using XML coords.

    `name_prefix` is the sprite name filter (e.g. `skill_`, `flag_`).
    `output_prefix` is prepended to the output filename (defaults to name_prefix).
    """
    if not atlas_img.exists() or not atlas_xml.exists():
        return 0
    if not _HAS_PIL:
        print(f"  (skipped {atlas_img.name}: Pillow not installed — pip install Pillow)")
        return 0
    dest_dir.mkdir(parents=True, exist_ok=True)
    atlas = Image.open(atlas_img).convert("RGBA")
    raw_xml = atlas_xml.read_text(encoding="utf-8", errors="replace").strip()
    if not raw_xml.startswith("<?xml") and not raw_xml.startswith("<root>"):
        raw_xml = f"<root>{raw_xml}</root>"
    try:
        root = ET.fromstring(raw_xml)
    except ET.ParseError as exc:
        print(f"  (atlas parse failed for {atlas_xml.name}: {exc})")
        return 0
    filter_re = re.compile(rf"^{re.escape(name_prefix)}", re.IGNORECASE)
    out_prefix = output_prefix or name_prefix
    n = 0
    for img in root.iter("Image"):
        name = img.get("name", "")
        if not filter_re.search(name):
            continue
        try:
            x = int(img.get("x", "0")); y = int(img.get("y", "0"))
            w = int(img.get("w", "0")); h = int(img.get("h", "0"))
        except ValueError:
            continue
        if w <= 0 or h <= 0:
            continue
        # Normalise the stem — e.g. "Skill_11.png" → "skill_11.webp"
        stem = Path(name).stem.lower()
        if not stem.startswith(out_prefix.lower()):
            # Rewrite prefix when atlas uses a different case than target dir
            stem = out_prefix.lower() + stem[len(name_prefix.rstrip("_")):].lstrip("_")
        crop = atlas.crop((x, y, x + w, y + h))
        crop.save(dest_dir / f"{stem}.webp", "WEBP", quality=90, method=6)
        n += 1
    return n


def main() -> int:
    total = 0

    # 1. Loose illustration / campaign art. Copy raw webp/png.
    pairs = [
        (SRC / "illustrations", OUT / "illustrations"),
        (SRC / "bg",            OUT / "campaign"),
    ]
    for s, d in pairs:
        n = copy_glob(s, d)
        print(f"{s.name}: copied {n} → {d}")
        total += n

    # 2. Atlas unpacks. Each atlas is a png + xml pair in assets/image/.
    atlases = [
        (SRC / "image_skill_hd.png",       SRC / "image_skill_hd.xml",       OUT / "skills",  "skill_",       "skill_"),
        (SRC / "image_flags_hd.png",       SRC / "image_flags_hd.xml",       OUT / "flags",   "flag_",        "flag_"),
        (SRC / "image_tech_hd.png",        SRC / "image_tech_hd.xml",        OUT / "techs",   "tech_",        "tech_"),
        (SRC / "image_upgraderank_hd.png", SRC / "image_upgraderank_hd.xml", OUT / "ranks",   "rank_",        "rank_"),
    ]
    for img, xml, dest, filt, out_prefix in atlases:
        n = unpack_atlas(img, xml, dest, filt, out_prefix)
        print(f"{img.name}: unpacked {n} → {dest}")
        total += n

    # 3. Note on general portraits: the 161 .pkm files in generalphoto/
    #    need an ETC1 decoder (out of scope for this pass). The wiki falls
    #    back to placeholder icons for generals until a PKM→WebP converter
    #    is wired in.
    gp_dir = SRC / "generalphoto"
    if gp_dir.exists():
        pkm_count = sum(1 for f in gp_dir.iterdir() if f.suffix == ".pkm")
        print(f"generalphoto: {pkm_count} .pkm files (ETC1, not decoded — placeholder fallback)")

    print(f"Total: {total} images")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
