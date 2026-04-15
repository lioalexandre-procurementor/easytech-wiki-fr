#!/usr/bin/env python3
"""
Backfill hasTrainingPath + training{} for all wiki generals using the
authoritative GeneralPromotionSettings data from the APK.

- A general is trainable iff its in-game id appears as a BaseID in
  GeneralPromotionSettings.json.
- Promotion rows are chained via Id -> AdvanceID; a "stage" is one step
  from a base row to its advance row.
- Stats and skill IDs come from the row itself (CurrentID -> base or prior
  advance); we compute per-stage deltas between consecutive rows.
"""
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # project root (parent of easytech-wiki)
WIKI = ROOT / "easytech-wiki"
DECRYPTED = ROOT / "wc4_data_decrypted"
EXPORT = ROOT / "wc4_export"

PROMO_FILE = DECRYPTED / "GeneralPromotionSettings.json"
CANONICAL_FILE = EXPORT / "generals_canonical.json"
GENERALS_DIR = WIKI / "data" / "wc4" / "generals"

ATTR_KEYS = [
    ("InfantryMax", "infantry"),
    ("ArtilleryMax", "artillery"),
    ("ArmorMax", "armor"),
    ("NavyMax", "navy"),
    ("AirForceMax", "airforce"),
    ("MarchMax", "marching"),
]


def load(p):
    with open(p) as f:
        return json.load(f)


def build_stage_chains(promos, canonical_by_id):
    """
    For each BaseID, walk Id -> AdvanceID to produce an ordered list of rows.
    Base row comes from canonical data (stats, skillIds at base).
    """
    by_id = {p["Id"]: p for p in promos}
    chains = {}  # BaseID -> [row0_base, row1, row2, ...]
    base_ids = sorted({p["BaseID"] for p in promos})

    for base_id in base_ids:
        base = canonical_by_id.get(base_id)
        if not base:
            continue
        # Seed with a synthetic "base" row from canonical
        base_row = {
            "_isBase": True,
            "BaseID": base_id,
            "Skills": list(base.get("skillIds") or []),
            "SkillsMax": base.get("skillSlots", 0),
            "Photo": base.get("photo"),
            "InfantryMax": base.get("statsMax", {}).get("infantry", 0),
            "ArtilleryMax": base.get("statsMax", {}).get("artillery", 0),
            "ArmorMax": base.get("statsMax", {}).get("armor", 0),
            "NavyMax": base.get("statsMax", {}).get("navy", 0),
            "AirForceMax": base.get("statsMax", {}).get("airforce", 0),
            "MarchMax": base.get("statsMax", {}).get("march", 0),
        }
        ordered = [base_row]
        # Find first promotion row for this base (lowest Id referencing BaseID)
        candidates = [p for p in promos if p["BaseID"] == base_id]
        # Walk by AdvanceID chain starting from the row whose "previous" max stats
        # are closest to base — simplest: sort by Id ascending
        candidates.sort(key=lambda p: p["Id"])
        for row in candidates:
            ordered.append(row)
        chains[base_id] = ordered
    return chains


def stage_label(quality_stages_total, idx):
    """
    idx is 1-based stage number. Return a French label.
    """
    if quality_stages_total == 1:
        return f"Gold → Promotion finale"
    if quality_stages_total == 2:
        return [f"Silver → Gold", f"Gold → Promotion finale"][idx - 1]
    if quality_stages_total == 3:
        return [
            "Bronze → Silver",
            "Silver → Gold",
            "Gold → Promotion finale",
        ][idx - 1]
    return f"Étape {idx}"


def build_training_path(chain, skill_name_by_id):
    """chain[0] is base, chain[1..] are promotion rows."""
    stages = []
    total_sword = 0
    total_sceptre = 0
    promo_rows = chain[1:]
    n = len(promo_rows)
    for i, row in enumerate(promo_rows, start=1):
        prev = chain[i - 1]
        sword = row.get("CostSword", 0) or 0
        sceptre = row.get("CostSceptre", 0) or 0
        total_sword += sword
        total_sceptre += sceptre

        # Attribute deltas
        attr_deltas = []
        for apk_key, wiki_key in ATTR_KEYS:
            prev_v = prev.get(apk_key, 0) or 0
            new_v = row.get(apk_key, 0) or 0
            delta = new_v - prev_v
            if delta != 0:
                attr_deltas.append(
                    {
                        "key": wiki_key,
                        "maxDelta": delta,
                    }
                )

        # Skill changes: diff SkillIds
        prev_skills = list(prev.get("Skills") or [])
        new_skills = list(row.get("Skills") or [])
        prev_max = prev.get("SkillsMax", 0) or 0
        new_max = row.get("SkillsMax", 0) or 0

        skill_changes = []
        # New slot unlocked
        if new_max > prev_max:
            for slot_idx in range(prev_max, new_max):
                if slot_idx < len(new_skills):
                    sid = new_skills[slot_idx]
                    skill_changes.append(
                        {
                            "slot": slot_idx + 1,
                            "kind": "unlock",
                            "newName": skill_name_by_id.get(sid, f"Skill #{sid}"),
                        }
                    )
        # Replaced existing slots
        for slot_idx in range(min(prev_max, len(prev_skills), new_max, len(new_skills))):
            prev_sid = prev_skills[slot_idx]
            new_sid = new_skills[slot_idx]
            if prev_sid != new_sid:
                skill_changes.append(
                    {
                        "slot": slot_idx + 1,
                        "kind": "replace",
                        "newName": skill_name_by_id.get(new_sid, f"Skill #{new_sid}"),
                    }
                )

        stages.append(
            {
                "stage": i,
                "label": stage_label(n, i),
                "swordCost": sword if sword > 0 else None,
                "sceptreCost": sceptre if sceptre > 0 else None,
                "skillChanges": skill_changes,
                "attributeDeltas": attr_deltas,
            }
        )

    return {
        "stages": stages,
        "totalSwordCost": total_sword if total_sword > 0 else None,
        "totalSceptreCost": total_sceptre if total_sceptre > 0 else None,
    }


def main():
    promos = load(PROMO_FILE)
    canonical = load(CANONICAL_FILE)
    canonical_by_id = {g["id"]: g for g in canonical}
    canonical_by_name = {g["nameEn"]: g for g in canonical}

    # Skill-id → name map, authoritative from skills.json (all 841 skills)
    skills_all = load(EXPORT / "skills.json")
    skill_name_by_id = {}
    for s in skills_all:
        sid = s.get("id")
        name = s.get("nameEn")
        if sid and name:
            skill_name_by_id[sid] = name
    # Fallback from canonical per-general skills
    for g in canonical:
        for s in g.get("skills", []):
            sid = s.get("id")
            name = s.get("nameEn")
            if sid and name and sid not in skill_name_by_id:
                skill_name_by_id[sid] = name

    trainable_ids = {p["BaseID"] for p in promos}
    chains = build_stage_chains(promos, canonical_by_id)

    # Build a canonical-name → base_id map for wiki lookup
    trainable_names = {}
    for bid in trainable_ids:
        g = canonical_by_id.get(bid)
        if g:
            trainable_names[g["nameEn"]] = bid

    updated = []
    for fp in sorted(GENERALS_DIR.glob("*.json")):
        if fp.name.startswith("_"):
            continue
        gen = load(fp)
        name_canon = gen.get("nameCanonical")
        # Match: exact canonical name, or substring (for Coulson/Colson)
        base_id = trainable_names.get(name_canon)
        if base_id is None and name_canon:
            for nm, bid in trainable_names.items():
                if name_canon.lower() == nm.lower() or name_canon.lower() in nm.lower():
                    base_id = bid
                    break

        if base_id is not None:
            chain = chains.get(base_id)
            training = build_training_path(chain, skill_name_by_id) if chain else None
            gen["hasTrainingPath"] = True
            gen["training"] = training
            gen["generalIdGame"] = base_id
        else:
            gen["hasTrainingPath"] = False
            gen["training"] = None

        with open(fp, "w") as f:
            json.dump(gen, f, indent=2, ensure_ascii=False)
            f.write("\n")
        updated.append((fp.name, gen["hasTrainingPath"], base_id))

    for name, flag, bid in updated:
        mark = "TRAIN" if flag else "-----"
        print(f"  [{mark}] {name:25} id={bid}")


if __name__ == "__main__":
    main()
