#!/usr/bin/env python3
"""
Auto-fill training-unlocked skill slots from GeneralPromotionSettings.

Input
-----
- wc4_data_decrypted/GeneralPromotionSettings.json  (19 generals, 1-3 stages each)
- wc4_data_decrypted/SkillSettings.json              (skill-id → type/level lookup)
- easytech-wiki/data/wc4/skills/_index.json          (type → slug/name)
- easytech-wiki/data/wc4/skills/{slug}.json          (per-level rendered text)

For each general in the promotion table we:

1. Walk the chain (BaseID → AdvanceID → … → final stage with AdvanceID == 0)
   and collect total sword / sceptre / medal / merit costs across stages.
2. Decode the FINAL stage's `Skills` list (skill-ids → (type, level)).
3. Compare against the general's current wiki skill slots:
   - skills already present in base slots (by type) → skipped
   - skills not present → filled into the first empty "Emplacement libre"
     slot, marked as NOT replaceable (training-unlocked signature) and
     linked to the skill catalog.
4. Set `hasTrainingPath = true` and populate a minimal `training` object
   with totals, preserving any existing `training.summary` if the JSON
   already had one.

The script is idempotent: it detects whether a slot is already filled with
the correct training skill and skips it.

Run:
  python3 scripts/backfill-training-skills.py
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WIKI = ROOT / "easytech-wiki"
PROMOTION = ROOT / "wc4_data_decrypted" / "GeneralPromotionSettings.json"
SKILL_SETTINGS = ROOT / "wc4_data_decrypted" / "SkillSettings.json"
GENERALS_DIR = WIKI / "data" / "wc4" / "generals"
SKILLS_DIR = WIKI / "data" / "wc4" / "skills"
SKILLS_INDEX = SKILLS_DIR / "_index.json"


def load_skill_catalog():
    idx = json.load(open(SKILLS_INDEX))
    by_type = {}
    for item in idx["skills"]:
        full = json.load(open(SKILLS_DIR / f"{item['slug']}.json"))
        by_type[item["type"]] = full
    return by_type


def resolve_skill(catalog, type_id, level):
    s = catalog.get(type_id)
    if not s:
        return None
    progs = s.get("progression", [])
    entry = next((p for p in progs if p["level"] == level), None)
    if not entry and progs:
        entry = progs[-1]
    return {
        "slug": s["slug"],
        "name": s["name"],
        "icon": s.get("icon"),
        "rendered": entry["renderedDesc"] if entry else s.get("descriptionTemplate", ""),
        "level": level,
        "type": type_id,
    }


def walk_chain(promotion, base_id):
    """Return ordered list of stages for a general (by BaseID)."""
    by_id = {s["Id"]: s for s in promotion}
    by_base = [s for s in promotion if s["BaseID"] == base_id]
    if not by_base:
        return []
    # Start stage = one whose Id is NOT referenced as any AdvanceID within the
    # set of stages with this BaseID.
    advance_targets = {s["AdvanceID"] for s in by_base}
    starts = [s for s in by_base if s["Id"] not in advance_targets]
    if not starts:
        # Fallback: sort by id
        return sorted(by_base, key=lambda x: x["Id"])
    chain = [starts[0]]
    cur = starts[0]
    while cur["AdvanceID"] and cur["AdvanceID"] in by_id:
        nxt = by_id[cur["AdvanceID"]]
        if nxt in chain:
            break
        chain.append(nxt)
        cur = nxt
    return chain


def patch_general(
    wiki_path: Path,
    chain: list,
    sk_by_id: dict,
    catalog: dict,
) -> bool:
    if not chain:
        return False
    data = json.load(open(wiki_path))
    current_slots = data.get("skills", [])

    final_stage = chain[-1]
    final_skill_ids = final_stage.get("Skills", [])

    # Existing skill types on the wiki general (excluding empty placeholders).
    existing_types = {
        s["skillType"]
        for s in current_slots
        if s.get("skillType") is not None
    }

    # Decode final stage skills. Skip any already present by type.
    training_skills = []
    for sid in final_skill_ids:
        ss = sk_by_id.get(sid)
        if not ss:
            continue
        ty = ss["Type"]
        lvl = ss["Level"]
        if ty in existing_types:
            continue
        resolved = resolve_skill(catalog, ty, lvl)
        if resolved:
            training_skills.append(resolved)

    # Fill empty slots with these training skills, in order.
    changed = False
    empty_iter = iter(
        i
        for i, s in enumerate(current_slots)
        if (s.get("name") in ("Emplacement libre", "Empty slot")
            or s.get("name", "").strip() == "")
        and s.get("skillType") is None
    )
    for ts in training_skills:
        try:
            idx = next(empty_iter)
        except StopIteration:
            break
        slot = current_slots[idx]
        slot["name"] = ts["name"]
        slot["nameEn"] = ts["name"]
        slot["desc"] = ts["rendered"]
        slot["icon"] = ts["icon"]
        slot["skillSlug"] = ts["slug"]
        slot["skillType"] = ts["type"]
        slot["skillLevel"] = ts["level"]
        slot["replaceable"] = False
        slot["replaceableReason"] = (
            "Compétence débloquée via l'entraînement (Épées/Sceptres de Domination)."
        )
        changed = True

    # Training path totals.
    total_swords = sum(s.get("CostSword", 0) or 0 for s in chain)
    total_sceptres = sum(s.get("CostSceptre", 0) or 0 for s in chain)

    # Build stage objects, preserving any existing summary.
    existing_training = data.get("training") or {}
    existing_summary = existing_training.get("summary") if isinstance(existing_training, dict) else None

    stages_out = []
    for i, st in enumerate(chain, start=1):
        stages_out.append({
            "stage": i,
            "label": (
                f"Niveau d'entraînement {i}"
                if i < len(chain)
                else "Entraînement final"
            ),
            "swordCost": st.get("CostSword") or 0,
            "sceptreCost": st.get("CostSceptre") or 0,
            "notes": (
                f"Slots max : {st.get('SkillsMax')}. "
                f"Coût additionnel : {st.get('CostMedal', 0)} médailles, "
                f"{st.get('CostMerit', 0)} mérite."
            ),
        })

    new_training = {
        "stages": stages_out,
        "totalSwordCost": total_swords,
        "totalSceptreCost": total_sceptres,
        "summary": existing_summary
        or "Entraînement premium débloquant des compétences signature et augmentant les plafonds d'attributs.",
    }

    if data.get("hasTrainingPath") is not True:
        data["hasTrainingPath"] = True
        changed = True
    if data.get("training") != new_training:
        data["training"] = new_training
        changed = True

    if changed:
        wiki_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return changed


def main():
    promotion = json.load(open(PROMOTION))
    sk = json.load(open(SKILL_SETTINGS))
    sk_by_id = {s["Id"]: s for s in sk}
    catalog = load_skill_catalog()

    # Index wiki generals by apkId.
    wiki_by_apkid = {}
    for f in sorted(GENERALS_DIR.glob("*.json")):
        if f.name.startswith("_"):
            continue
        d = json.load(open(f))
        if d.get("apkId") is not None:
            wiki_by_apkid[d["apkId"]] = f

    base_ids = {s["BaseID"] for s in promotion}
    patched = 0
    skipped_no_wiki = 0
    for base_id in sorted(base_ids):
        wiki_path = wiki_by_apkid.get(base_id)
        if not wiki_path:
            skipped_no_wiki += 1
            continue
        chain = walk_chain(promotion, base_id)
        if patch_general(wiki_path, chain, sk_by_id, catalog):
            patched += 1

    print(f"Patched {patched} / {len(base_ids)} generals with promotion data")
    if skipped_no_wiki:
        print(f"Skipped {skipped_no_wiki} without wiki JSON (apkId mismatch)")


if __name__ == "__main__":
    main()
