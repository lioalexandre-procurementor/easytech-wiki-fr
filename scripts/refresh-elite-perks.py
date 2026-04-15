#!/usr/bin/env python3
"""
Rebuild elite-unit `perks[]` arrays from real APK feature data.

Pipeline:
  ArmySettings[L1..L12].Feature + FeatureLevel
    → ArmyFeatureSettings[(Type, Level)] (FeatureEffect, SecondEffect, …)
    → stringtable_en feat_name_<type> / feat_desc_<type>
    → placeholder substitution ({0}=chance, {1}=effect, {2}=second)
    → diff between consecutive levels → unlock / upgrade perks

Only the 42 standard elites listed in SLUG_TO_ARMY_ID get refreshed.
Scorpion / mystic units keep their existing placeholder perks.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from elite_features_fr import FEATURE_FR

ROOT = Path(__file__).resolve().parents[2]
WIKI = ROOT / "easytech-wiki"
APK_DATA = ROOT / "wc4_data_decrypted"
STRINGTABLE = ROOT / "wc4_extract" / "assets" / "stringtable_en.ini"
WIKI_DIR = WIKI / "data" / "wc4" / "elite-units"

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
    "ghost-troop":          335001,
    "harrier":              350001,
    "hawkeye":              302001,
    "hms-prince-of-wales":  314001,
    "honeycomb":            347001,
    "is-3":                 318001,
    "ju-87-stuka":          311001,
    "konigs-tiger":         308001,
    "leopard-2":            349001,
    "m142-himars":          344001,
    "m1a1-abrams":          336001,
    "m26-pershing":         309001,
    "m7-priest":            304001,
    "mi-24-hind":           329001,
    "p-40-warhawk":         325001,
    "richelieu":            320001,
    "rpg-rocket-soldier":   326001,
    "schwerer-gustav":      305001,
    "stuka-rocket":         319001,
    "su-30":                351001,
    "supermarine-spitfire": 310001,
    "t-44":                 307001,
    "t-72":                 333001,
    "topol-m":              339001,
    "type-vii-uboat":       313001,
    "typhoon-submarine":    328001,
    "yukikaze":             334001,
}


def load_stringtable():
    keys = {}
    with open(STRINGTABLE, encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith(";"):
                k, v = line.split("=", 1)
                keys[k] = v
    return keys


def fill_template(tmpl, entry):
    """Substitute {0}..{5} placeholders with feature values."""
    subs = {
        "0": entry.get("ActivatesChance", 0),
        "1": entry.get("FeatureEffect", 0),
        "2": entry.get("SecondEffect", 0),
        "3": entry.get("Range", 0),
        "4": entry.get("CD", 0),
        "5": entry.get("Round", 0),
    }
    def repl(m):
        key = m.group(1)
        return str(subs.get(key, m.group(0)))
    return re.sub(r"\{(\d+)\}", repl, tmpl).strip()


# Heuristic icon per feature name (matches FR glossary)
ICON_MAP = {
    "mitrailleuse": "🔫",
    "assaut": "⚔️",
    "défense aérienne": "🛡️",
    "uranium appauvri": "☢️",
    "blindage": "🛡️",
    "frappe au dépourvu": "🎯",
    "grenade": "💥",
    "sapeur": "⛏️",
    "marche": "🏃",
    "anti-char": "🚫",
    "torpille": "🌊",
    "radar": "📡",
    "fantôme": "👻",
    "missile": "🚀",
    "nucléaire": "☢️",
    "atomique": "☢️",
    "frappe aérienne": "✈️",
    "supériorité aérienne": "🦅",
    "bombardement": "💣",
    "canon": "🎯",
    "artillerie": "💥",
    "tireur d'élite": "🎯",
    "porte-avions": "⚓",
    "drone": "🛸",
    "camouflage": "🫥",
    "fumigène": "💨",
    "mine": "💥",
    "chasseur de chars": "🎯",
    "tueur": "⚔️",
    "assassinat": "🗡️",
    "pansement": "💉",
    "secours": "💉",
    "transport": "🚁",
    "saut aérien": "🪂",
    "assaut aéroporté": "🪂",
    "samouraï": "🗡️",
}


def pick_icon(name):
    low = name.lower()
    for k, v in ICON_MAP.items():
        if k in low:
            return v
    return "⭐"


def build_feat_index(features, names):
    """(type, level) → {name, desc, raw}. Prefers FR glossary, falls back to stringtable EN."""
    idx = {}
    for f in features:
        t = f["Type"]
        lvl = f["Level"]
        fr = FEATURE_FR.get(t)
        if fr is not None:
            name_tmpl, desc_tmpl = fr
        else:
            name_tmpl = names.get(f"feat_name_{t}", f"Feature {t}")
            desc_tmpl = names.get(f"feat_desc_{t}", "")
        desc = fill_template(desc_tmpl, f) if desc_tmpl else ""
        idx[(t, lvl)] = {"name": name_tmpl, "desc": desc, "raw": f}
    return idx


def classify(feat_type):
    # Types 80+ tend to be active abilities / auras; keep simple
    if feat_type >= 100:
        return "active-skill"
    return "passive"


def build_perks_for_unit(base_id, army_by_id, feat_idx):
    """Return list of Perk dicts derived from diff across levels.

    Invariant: we NEVER emit two consecutive perks for the same feature type
    with identical rendered descriptions. Many WC4 features have static
    template text ("Capable of attacking multiple enemies...") with hidden
    numeric upgrades that don't surface in the template — without this guard
    the wiki ends up showing the same sentence twice under Niv.1/Niv.2/Niv.3.
    """
    perks = []
    prev_levels = {}       # feature type → level at previous unit level
    last_rendered = {}     # feature type → last description actually emitted

    for unit_lvl in range(1, 13):
        entry = army_by_id.get(base_id + unit_lvl - 1)
        if not entry:
            continue
        feats = entry.get("Feature") or []
        levels = entry.get("FeatureLevel") or []
        current = dict(zip(feats, levels))

        for ftype, flevel in current.items():
            meta = feat_idx.get((ftype, flevel))
            if meta is None:
                continue
            rendered = (meta.get("desc") or "").strip()
            prev = prev_levels.get(ftype)
            is_first = prev is None
            is_upgrade = (prev is not None) and (flevel > prev)
            if not (is_first or is_upgrade):
                continue
            # Skip if the rendered text is identical to the last emitted
            # entry for this feature (static template, hidden upgrade).
            if last_rendered.get(ftype) == rendered and rendered:
                continue
            perks.append({
                "lvl": unit_lvl,
                "type": classify(ftype),
                "icon": pick_icon(meta["name"]),
                "name": meta["name"] if is_first else f"{meta['name']} Niv.{flevel}",
                "desc": meta["desc"],
                "milestone": unit_lvl in (1, 5, 9, 12) if is_first else False,
            })
            last_rendered[ftype] = rendered
        prev_levels = current

    return perks


def main():
    names = load_stringtable()
    army = json.load(open(APK_DATA / "ArmySettings.json"))
    army_by_id = {a["Id"]: a for a in army}
    feats = json.load(open(APK_DATA / "ArmyFeatureSettings.json"))
    feat_idx = build_feat_index(feats, names)

    updated = 0
    skipped = []
    for slug, base_id in sorted(SLUG_TO_ARMY_ID.items()):
        fp = WIKI_DIR / f"{slug}.json"
        if not fp.exists():
            skipped.append(f"{slug} (no wiki file)")
            continue
        perks = build_perks_for_unit(base_id, army_by_id, feat_idx)
        if not perks:
            skipped.append(f"{slug} (no perks resolved)")
            continue
        d = json.load(open(fp))
        d["perks"] = perks
        with open(fp, "w") as f:
            json.dump(d, f, indent=2, ensure_ascii=False)
            f.write("\n")
        updated += 1

    print(f"Refreshed perks on {updated} units")
    if skipped:
        print("Skipped:")
        for s in skipped:
            print(" ", s)


if __name__ == "__main__":
    main()
