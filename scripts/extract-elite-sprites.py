#!/usr/bin/env python3
"""
Crop per-unit elite sprites out of the APK unit_* texture atlases and
write them to public/img/wc4/elites/<armyId>.webp.

Mapping chain:
  wiki slug → armyId (in elite JSON after refresh-elite-units.py ran)
              ↓
              ArmySettings.Army (integer sprite key)
              ↓
              unit_<atlas>.xml/.webp (TexturePacker atlas)
              ↓
              crop rectangle → save per-unit webp
"""
import json
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image
import io

ROOT = Path(__file__).resolve().parents[2]
WIKI = ROOT / "easytech-wiki"
APK = ROOT / "wc4_extract" / "com.easytech.wc4.android.apk"
WIKI_DIR = WIKI / "data" / "wc4" / "elite-units"
OUT_IMG = WIKI / "public" / "img" / "wc4" / "elites"
ARMY_SETTINGS = ROOT / "wc4_data_decrypted" / "ArmySettings.json"


def parse_xml(xml_bytes):
    raw = xml_bytes.decode("utf-8", "replace")
    if "<" in raw:
        raw = raw[raw.index("<"):]
    return ET.fromstring("<root>" + raw + "</root>")


def build_atlas_index(zf):
    """sprite_id (int) → (atlas_img_path, x, y, w, h)."""
    index = {}
    for name in zf.namelist():
        if not (name.startswith("assets/unit_") and name.endswith(".xml")):
            continue
        root = parse_xml(zf.read(name))
        # Texture element tells us the image filename
        tex_name = None
        for tex in root.iter("Texture"):
            tex_name = tex.attrib.get("name", "").replace(".png", "").replace(".webp", "")
            break
        # Find image sibling: try .webp first, then .png
        img_base = name.replace(".xml", "")
        img_candidates = [img_base + ".webp", img_base + ".png"]
        img_path = None
        all_names = set(zf.namelist())
        for c in img_candidates:
            if c in all_names:
                img_path = c
                break
        if not img_path:
            continue
        for img in root.iter("Image"):
            sid_raw = img.attrib["name"].replace(".png", "").replace(".webp", "")
            if not sid_raw.isdigit():
                continue
            sid = int(sid_raw)
            x = int(img.attrib["x"])
            y = int(img.attrib["y"])
            w = int(img.attrib["w"])
            h = int(img.attrib["h"])
            # First match wins (avoid overwriting with duplicate sprites in other atlases)
            index.setdefault(sid, (img_path, x, y, w, h))
    return index


def main():
    OUT_IMG.mkdir(parents=True, exist_ok=True)

    army_settings = json.load(open(ARMY_SETTINGS))
    # armyId (L1 entry) → 'Army' sprite code
    army_to_sprite = {
        a["Id"]: a["Army"]
        for a in army_settings
        if a.get("Elite") == 1 and a.get("Id", 0) % 100 == 1
    }

    with zipfile.ZipFile(APK) as zf:
        atlas_index = build_atlas_index(zf)
        print(f"Indexed {len(atlas_index)} sprites across atlases")

        # Cache loaded atlas images so we don't re-decode them for every unit
        atlas_cache = {}

        def load_atlas(path):
            if path not in atlas_cache:
                with zf.open(path) as f:
                    atlas_cache[path] = Image.open(io.BytesIO(f.read())).convert("RGBA")
            return atlas_cache[path]

        updated = 0
        missing = []
        for fp in sorted(WIKI_DIR.glob("*.json")):
            if fp.name.startswith("_"):
                continue
            d = json.load(open(fp))
            army_id = d.get("armyId")
            if not army_id:
                continue
            sprite_code = army_to_sprite.get(army_id)
            if sprite_code is None:
                missing.append((fp.stem, f"no army for id {army_id}"))
                continue
            rect = atlas_index.get(sprite_code)
            if rect is None:
                missing.append((fp.stem, f"no sprite {sprite_code}"))
                continue
            atlas_path, x, y, w, h = rect
            atlas = load_atlas(atlas_path)
            sprite = atlas.crop((x, y, x + w, y + h))
            out_path = OUT_IMG / f"{army_id}.webp"
            sprite.save(out_path, "webp", quality=90, method=6)
            d.setdefault("image", {})["sprite"] = f"/img/wc4/elites/{army_id}.webp"
            with open(fp, "w") as f:
                json.dump(d, f, indent=2, ensure_ascii=False)
                f.write("\n")
            updated += 1

    print(f"Cropped and saved {updated} sprites")
    if missing:
        print("Missing:")
        for slug, reason in missing:
            print(f"  {slug}: {reason}")


if __name__ == "__main__":
    main()
