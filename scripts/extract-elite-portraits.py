#!/usr/bin/env python3
"""
Extract elite unit portraits from assets/image/elite/{prefix}{idx}.webp.

The APK groups elite portraits by category prefix, then orders them by armyId:
  prefix 1 = infantry  (ArmySettings Type 1)
  prefix 2 = artillery (Type 3)
  prefix 3 = armor     (Type 2)
  prefix 4 = air       (Type 5 + Type 13 helicopter)
  prefix 5 = navy      (Type 4)

Within each bucket, sort all elite L1 entries by armyId ascending. The Nth
entry maps to file `{prefix}{10+N}.webp` (so first = 110, second = 111, ...).

Output: public/img/wc4/elites/{armyId}.webp + updates `image.sprite` in each
wiki JSON.
"""
import json
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WIKI = ROOT / "easytech-wiki"
APK = ROOT / "wc4_extract" / "com.easytech.wc4.android.apk"
ARMY_SETTINGS = ROOT / "wc4_data_decrypted" / "ArmySettings.json"
ELITE_CANON = ROOT / "wc4_export" / "elite_units.json"
WIKI_DIR = WIKI / "data" / "wc4" / "elite-units"
OUT_IMG = WIKI / "public" / "img" / "wc4" / "elites"

TYPE_TO_PREFIX = {
    1: 1,   # infantry
    3: 2,   # artillery
    2: 3,   # armor
    5: 4,   # airforce (planes)
    13: 4,  # helicopter -> air bucket
    4: 5,   # navy
}


def main():
    OUT_IMG.mkdir(parents=True, exist_ok=True)

    army_settings = json.load(open(ARMY_SETTINGS))
    canon = json.load(open(ELITE_CANON))
    canon_l1_ids = {e["armyId"] for e in canon if e["armyId"] % 1000 == 1}
    # Mystic / scorpion elites are absent from canonical export and don't
    # ship portrait files in /image/elite/ — exclude them so the file-index
    # math stays aligned.
    elite_l1 = sorted(
        [
            a for a in army_settings
            if a.get("Elite") == 1 and a.get("Id", 0) % 1000 == 1
            and a["Id"] in canon_l1_ids
        ],
        key=lambda a: a["Id"],
    )

    # Bucket by prefix, preserve armyId-ascending order
    buckets: dict[int, list[int]] = {p: [] for p in set(TYPE_TO_PREFIX.values())}
    for a in elite_l1:
        prefix = TYPE_TO_PREFIX.get(a.get("Type"))
        if prefix is None:
            print(f"  skip: armyId={a['Id']} Type={a.get('Type')} (unknown)")
            continue
        buckets[prefix].append(a["Id"])

    # Build armyId -> portrait file name
    armyid_to_portrait: dict[int, str] = {}
    for prefix, ids in sorted(buckets.items()):
        for idx, army_id in enumerate(ids):
            file_id = prefix * 100 + 10 + idx  # 110, 111, ..., 510, 511, ...
            armyid_to_portrait[army_id] = str(file_id)

    print(f"Mapped {len(armyid_to_portrait)} elites to portrait files")

    # Wipe existing sprites so we start clean
    for f in OUT_IMG.glob("*.webp"):
        f.unlink()
    for f in OUT_IMG.glob("*.png"):
        f.unlink()

    extracted = 0
    missing = []
    with zipfile.ZipFile(APK) as zf:
        zf_names = set(zf.namelist())
        for army_id, file_id in sorted(armyid_to_portrait.items()):
            for ext in (".webp", ".png"):
                src = f"assets/image/elite/{file_id}{ext}"
                if src in zf_names:
                    out = OUT_IMG / f"{army_id}{ext}"
                    with zf.open(src) as sfp, open(out, "wb") as dfp:
                        shutil.copyfileobj(sfp, dfp)
                    extracted += 1
                    break
            else:
                missing.append((army_id, file_id))

    print(f"Extracted {extracted} portrait files")
    if missing:
        print("Missing portraits:")
        for army_id, fid in missing:
            print(f"  armyId={army_id} expected file={fid}")

    # Update wiki JSONs: image.sprite path
    updated = 0
    for fp in sorted(WIKI_DIR.glob("*.json")):
        if fp.name.startswith("_"):
            continue
        d = json.load(open(fp))
        army_id = d.get("armyId")
        if not army_id or army_id not in armyid_to_portrait:
            continue
        # Pick whichever extension exists
        sprite_path = None
        for ext in (".webp", ".png"):
            if (OUT_IMG / f"{army_id}{ext}").exists():
                sprite_path = f"/img/wc4/elites/{army_id}{ext}"
                break
        d.setdefault("image", {})["sprite"] = sprite_path
        with open(fp, "w") as f:
            json.dump(d, f, indent=2, ensure_ascii=False)
            f.write("\n")
        updated += 1

    print(f"Updated {updated} wiki JSONs")


if __name__ == "__main__":
    main()
