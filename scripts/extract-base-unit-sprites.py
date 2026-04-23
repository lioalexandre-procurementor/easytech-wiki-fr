#!/usr/bin/env python3
"""
Extract WC4 base (legion) unit icons from the APK and write them to
public/img/wc4/units/<code>.webp (plus a friendly-named alias).

Source: the in-game UI atlas `image/image_legion_icon_hd` contains exactly
19 colored round icons (legion_icon_1 … legion_icon_19), one per base
unit type. These are the icons the game shows in the Army Group / Legend
Formation info panels.

Legion code → unit type:
  1 Light Infantry       2 Assault Infantry      3 Motorized Infantry
  4 Mechanized Infantry  5 Special Forces        6 Armored Car
  7 Light Tank           8 Medium Tank           9 Heavy Tank
  10 Super Tank          11 Field Artillery      12 Howitzer
  13 Rocket Artillery    14 Super Artillery      15 Submarine
  16 Destroyer           17 Cruiser              18 Carrier
  19 Super Ship
"""
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image
import io

ROOT = Path(__file__).resolve().parents[2]
WIKI = ROOT / "easytech-wiki"
APK = ROOT / "wc4_extract" / "com.easytech.wc4.android.apk"
OUT_IMG = WIKI / "public" / "img" / "wc4" / "units"

ATLAS_BASE = "assets/image/image_legion_icon_hd"

ALIASES = {
    1: "light-infantry",
    2: "assault-infantry",
    3: "motorized-infantry",
    4: "mechanized-infantry",
    5: "special-forces",
    6: "armored-car",
    7: "light-tank",
    8: "medium-tank",
    9: "heavy-tank",
    10: "super-tank",
    11: "field-artillery",
    12: "howitzer",
    13: "rocket-artillery",
    14: "super-artillery",
    15: "submarine",
    16: "destroyer",
    17: "cruiser",
    18: "carrier",
    19: "super-ship",
}


def parse_xml(xml_bytes):
    raw = xml_bytes.decode("utf-8", "replace")
    if "<" in raw:
        raw = raw[raw.index("<"):]
    return ET.fromstring("<root>" + raw + "</root>")


def main():
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    # Clear any previous (wrong) extracts so naming stays clean
    for old in OUT_IMG.glob("*.webp"):
        old.unlink()

    with zipfile.ZipFile(APK) as zf:
        all_names = set(zf.namelist())
        xml_name = ATLAS_BASE + ".xml"
        img_name = None
        for ext in (".webp", ".png"):
            cand = ATLAS_BASE + ext
            if cand in all_names:
                img_name = cand
                break
        if img_name is None:
            raise SystemExit(f"No atlas image for {ATLAS_BASE}")

        atlas_img = Image.open(io.BytesIO(zf.read(img_name))).convert("RGBA")
        root = parse_xml(zf.read(xml_name))

        saved = 0
        for img in root.iter("Image"):
            name = img.attrib["name"].replace(".webp", "").replace(".png", "")
            if not name.startswith("legion_icon_"):
                continue
            try:
                code = int(name.replace("legion_icon_", ""))
            except ValueError:
                continue
            x = int(img.attrib["x"]); y = int(img.attrib["y"])
            w = int(img.attrib["w"]); h = int(img.attrib["h"])
            crop = atlas_img.crop((x, y, x + w, y + h))
            numeric = OUT_IMG / f"{code}.webp"
            crop.save(numeric, "webp", quality=92, method=6)
            alias = ALIASES.get(code)
            if alias:
                (OUT_IMG / f"{alias}.webp").write_bytes(numeric.read_bytes())
            saved += 1

    print(f"Saved {saved} legion icons to {OUT_IMG}")


if __name__ == "__main__":
    main()
