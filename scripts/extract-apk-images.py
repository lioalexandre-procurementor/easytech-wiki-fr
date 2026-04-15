#!/usr/bin/env python3
"""
Extract only the APK image files the wiki actually needs:

- For each wiki general: base portrait + circle head (+ promoted *2 variant
  when trainable).
- (Elite units handled in a later pass once slug → armyId mapping exists.)

Also writes a mapping back into each general's JSON so components can render
/img/wc4/generals/<photo>.webp without re-deriving the filename.
"""
import json
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WIKI = ROOT / "easytech-wiki"
APK = ROOT / "wc4_extract" / "com.easytech.wc4.android.apk"
CANONICAL = ROOT / "wc4_export" / "generals_canonical.json"
GENERALS_DIR = WIKI / "data" / "wc4" / "generals"
PUBLIC_IMG = WIKI / "public" / "img" / "wc4"
OUT_GENERALS = PUBLIC_IMG / "generals"
OUT_HEADS = PUBLIC_IMG / "heads"


def main():
    OUT_GENERALS.mkdir(parents=True, exist_ok=True)
    OUT_HEADS.mkdir(parents=True, exist_ok=True)

    canonical = json.load(open(CANONICAL))
    by_name_lc = {g["nameEn"].lower().replace(" ", ""): g for g in canonical}

    wanted = []  # (apk_path, out_path)
    updates = []  # (json_path, photo, trainable)

    for fp in sorted(GENERALS_DIR.glob("*.json")):
        if fp.name.startswith("_"):
            continue
        gen = json.load(open(fp))
        name_canon = (gen.get("nameCanonical") or "").lower().replace(" ", "")
        match = by_name_lc.get(name_canon)
        if not match:
            for nm, g in by_name_lc.items():
                if name_canon and (name_canon == nm or name_canon in nm):
                    match = g
                    break
        if not match:
            print(f"  [skip] {fp.name} — no canonical match")
            continue

        photo = match["photo"]
        trainable = bool(gen.get("hasTrainingPath"))

        base_list = [
            (
                f"assets/image/generalphoto/general_{photo}.webp",
                OUT_GENERALS / f"{photo}.webp",
            ),
            (
                f"assets/image/heads/general_circle_{photo}.webp",
                OUT_HEADS / f"{photo}.webp",
            ),
        ]
        if trainable:
            base_list += [
                (
                    f"assets/image/generalphoto/general_{photo}2.webp",
                    OUT_GENERALS / f"{photo}2.webp",
                ),
                (
                    f"assets/image/heads/general_circle_{photo}2.webp",
                    OUT_HEADS / f"{photo}2.webp",
                ),
            ]
        wanted.extend(base_list)
        updates.append((fp, photo, trainable))

    # Extract from APK
    with zipfile.ZipFile(APK) as zf:
        names = set(zf.namelist())
        extracted = 0
        missing = []
        for apk_path, out_path in wanted:
            if apk_path not in names:
                missing.append(apk_path)
                continue
            with zf.open(apk_path) as src, open(out_path, "wb") as dst:
                shutil.copyfileobj(src, dst)
            extracted += 1

    print(f"Extracted {extracted}/{len(wanted)} files")
    if missing:
        print("Missing:")
        for m in missing:
            print(" ", m)

    # Backfill JSON with image paths
    for fp, photo, trainable in updates:
        gen = json.load(open(fp))
        gen["image"] = {
            "photo": f"/img/wc4/generals/{photo}.webp",
            "head": f"/img/wc4/heads/{photo}.webp",
            "photoTrained": (
                f"/img/wc4/generals/{photo}2.webp" if trainable else None
            ),
            "headTrained": (
                f"/img/wc4/heads/{photo}2.webp" if trainable else None
            ),
        }
        with open(fp, "w") as f:
            json.dump(gen, f, indent=2, ensure_ascii=False)
            f.write("\n")
    print(f"Updated {len(updates)} general JSONs")


if __name__ == "__main__":
    main()
