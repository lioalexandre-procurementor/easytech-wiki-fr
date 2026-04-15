#!/usr/bin/env python3
"""
Backfill real stats, per-level costs, and image paths for elite units
using APK canonical data + stringtable + elite sprite assets.

Scope: 40 standard elite units mapped explicitly below. Mystic/Scorpion
units without canonical entries (Titan Tank, Mystic Bomber, etc.) are
skipped — their wiki JSONs are left untouched.
"""
import json
import re
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WIKI = ROOT / "easytech-wiki"
APK = ROOT / "wc4_extract" / "com.easytech.wc4.android.apk"
STRINGTABLE = ROOT / "wc4_extract" / "assets" / "stringtable_en.ini"
ELITE_JSON = ROOT / "wc4_export" / "elite_units.json"
WIKI_DIR = WIKI / "data" / "wc4" / "elite-units"
OUT_IMG = WIKI / "public" / "img" / "wc4" / "elites"

# Hand-verified wiki slug → APK base armyId (L1 entry).
# 42 standard elites exist in canonical data; 40 have wiki pages.
SLUG_TO_ARMY_ID = {
    "ah-64-apache":         338001,
    "akagi":                321001,
    "alpini":               316001,
    "arleigh-burke":        340001,
    "auf1-spg":             332001,
    "b-4-howitzer":         317001,
    "b-52-stratofortress":  337001,
    "bm-21-grad":           306001,
    "brandenburg-infantry": 301001,
    "c-47-skytrain":        312001,
    "centurion":            327001,
    "combat-medic":         303001,
    "engineer-unit":        331001,
    "enterprise-cv":        323001,
    "flak-88":              346001,
    "ghost-troop":          335001,   # Phantom Force
    "harrier":              350001,
    "hawkeye":              302001,   # Hawkeye Force
    "hms-prince-of-wales":  314001,
    "honeycomb":            347001,   # Hive Tactical Vehicle
    "is-3":                 318001,
    "ju-87-stuka":          311001,   # Stuka dive bomber
    "konigs-tiger":         308001,   # King Tiger
    "leopard-2":            349001,
    "m142-himars":          344001,
    "m1a1-abrams":          336001,
    "m26-pershing":         309001,
    "m7-priest":            304001,
    "mi-24-hind":           329001,
    "p-40-warhawk":         325001,   # P-40 Fighter
    "richelieu":            320001,
    "rpg-rocket-soldier":   326001,   # RPG Rocketeer
    "schwerer-gustav":      305001,   # Heavy Gustav
    "stuka-rocket":         319001,   # Stuka zu Fuss (rocket artillery)
    "su-30":                351001,   # Sukhoi Su-30V
    "supermarine-spitfire": 310001,   # Spitfire
    "t-44":                 307001,
    "t-72":                 333001,
    "topol-m":              339001,   # RT-2PM2 Topol-M
    "type-vii-uboat":       313001,   # Type VII Submarine
    "typhoon-submarine":    328001,   # Typhoon-class
    "yukikaze":             334001,
}

# Scorpion/Mystic — no canonical mapping, skip stats refresh but still
# listed here so we can extend later if their assets live in a separate
# range that we find.
SKIP_SCORPION = {
    "e-775",
    "heavenly-beginning-tank",
    "ks-90",
    "mystery-paratrooper",
    "mystic-bomber",
    "mystic-strategic-bomber",
    "sva-23",
    "titan-tank",
}


def load_stringtable():
    names = {}
    with open(STRINGTABLE, encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith(";"):
                k, v = line.split("=", 1)
                names[k] = v
    return names


def clean_name(raw):
    return re.sub(r"\s*Lv\s*\d+\s*$", "", raw).strip()


def main():
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    names = load_stringtable()

    # Group canonical by armyId
    canonical = json.load(open(ELITE_JSON))
    canon_by_id = {e["armyId"]: e for e in canonical}

    updated = 0
    skipped = []
    missing_img = []

    with zipfile.ZipFile(APK) as zf:
        zf_names = set(zf.namelist())

        for fp in sorted(WIKI_DIR.glob("*.json")):
            if fp.name.startswith("_"):
                continue
            slug = fp.stem
            base_id = SLUG_TO_ARMY_ID.get(slug)
            if base_id is None:
                if slug not in SKIP_SCORPION:
                    skipped.append(slug)
                continue

            # Collect L1..L12 entries
            tiers = []
            for lvl in range(1, 13):
                entry = canon_by_id.get(base_id + lvl - 1)
                # L10..L12 encoded as +9..+11 (matches canonical: 346001 + 9 = 346010)
                if entry is None:
                    # Some games encode L10 as armyId % 100 == 10 etc.
                    entry = canon_by_id.get(base_id + lvl - 1)
                tiers.append(entry)
            if not all(tiers):
                skipped.append(f"{slug} (incomplete tiers)")
                continue

            atk_min = [t["baseStats"]["minAttack"] for t in tiers]
            atk_max = [t["baseStats"]["maxAttack"] for t in tiers]
            defe = [t["baseStats"]["defence"] for t in tiers]
            hp = [t["baseStats"]["hp"] for t in tiers]
            mov = [t["baseStats"]["mobility"] for t in tiers]
            rng_min = [t["baseStats"]["range"][0] for t in tiers]
            rng_max = [t["baseStats"]["range"][1] for t in tiers]

            tier_costs = []
            for t in tiers:
                tt = (t.get("tiers") or [{}])[0]
                tier_costs.append(
                    {
                        "level": tt.get("level", 0),
                        "needHQLv": tt.get("needHQLv", 0),
                        "costGold": tt.get("costGold", 0),
                        "costIndustry": tt.get("costIndustry", 0),
                        "costEnergy": tt.get("costEnergy", 0),
                        "costTech": tt.get("costTech", 0),
                        "costItem": tt.get("costItem", 0),
                        "costBadge": tt.get("costBadge", 0),
                    }
                )

            # Pull English name from stringtable for nameEn
            en_raw = names.get(f"unit_name_{base_id}", "")
            en_clean = clean_name(en_raw)

            # Extract sprite(s)
            sprite_out = OUT_IMG / f"{base_id}.webp"
            sprite_apk = f"assets/image/elite/{base_id}.webp"
            sprite_path = None
            if sprite_apk in zf_names:
                with zf.open(sprite_apk) as src, open(sprite_out, "wb") as dst:
                    shutil.copyfileobj(src, dst)
                sprite_path = f"/img/wc4/elites/{base_id}.webp"
            else:
                # try .png
                sprite_png = f"assets/image/elite/{base_id}.png"
                if sprite_png in zf_names:
                    out_png = OUT_IMG / f"{base_id}.png"
                    with zf.open(sprite_png) as src, open(out_png, "wb") as dst:
                        shutil.copyfileobj(src, dst)
                    sprite_path = f"/img/wc4/elites/{base_id}.png"
                else:
                    missing_img.append(slug)

            # Update wiki JSON
            d = json.load(open(fp))
            d["armyId"] = base_id
            if not d.get("nameEn"):
                d["nameEn"] = en_clean or None
            d["stats"] = {
                "atk": atk_max,
                "def": defe,
                "hp": hp,
                "mov": mov,
                "rng": rng_max,
                "atkMin": atk_min,
                "atkMax": atk_max,
                "rngMin": rng_min,
            }
            d["tierCosts"] = tier_costs
            d["image"] = {"sprite": sprite_path, "lvl12": None}
            d["verified"] = True

            with open(fp, "w") as f:
                json.dump(d, f, indent=2, ensure_ascii=False)
                f.write("\n")
            updated += 1

    print(f"Updated {updated} elite units")
    if skipped:
        print("Skipped (scorpion/mystic/no canonical):")
        for s in skipped:
            print(" ", s)
    if missing_img:
        print("Missing sprite:")
        for s in missing_img:
            print(" ", s)


if __name__ == "__main__":
    main()
