#!/usr/bin/env python3
"""
Build `trainedSkills` override for generals with a premium training path.

Input
-----
- wc4_data_decrypted/GeneralPromotionSettings.json  (19 generals, 1-3 stages each)
- wc4_data_decrypted/SkillSettings.json              (skill-id → type/level lookup)
- easytech-wiki/data/wc4/skills/_index.json          (type → slug/name)
- easytech-wiki/data/wc4/skills/{slug}.json          (per-level rendered text)

Semantics
---------
`skills[]` is the BASE (untrained) loadout. It must NEVER be mutated by this
script. Trained signature skills live in a new top-level `trainedSkills[]`
array that mirrors the final-stage promotion loadout (5 slots, all filled).
Both the base page and the "premium training" view read from their own
field, so we never pollute the base state.

For each general in the promotion table we:

1. Walk the chain (BaseID → AdvanceID → … → final stage with AdvanceID == 0)
   and collect total sword / sceptre / medal / merit costs across stages.
2. Decode the FINAL stage's `Skills` list (skill-ids → (type, level)).
3. For each final-stage skill, resolve it against the catalog (slug, name,
   rendered description at that level, icon).
4. Build a full `trainedSkills` array:
   - slots that MATCH an existing base skill (by `skillType`) reuse the base
     entry's position + metadata and just bump the level/desc
   - slots that DIFFER (new signatures) are emitted as brand-new entries with
     `replaceable: false` and a training-unlock note
   - remaining empty base slots stay as placeholders
5. Populate `training.stages[]` with per-stage sword/sceptre/medal/merit costs
   and aggregate totals (preserving any existing `training.summary`).
6. **Reset** any base skill slot that carries the legacy training signature
   (`replaceableReason == "Compétence débloquée via l'entraînement …"`) back
   to an empty "Emplacement libre" placeholder. This undoes the pollution
   from the previous incarnation of this script.

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

TRAINING_POLLUTION_REASON = (
    "Compétence débloquée via l'entraînement (Épées/Sceptres de Domination)."
)
EMPTY_PLACEHOLDER_NAMES = {"Emplacement libre", "Empty slot", ""}


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


def make_empty_slot(slot_index: int) -> dict:
    """Canonical 'empty slot' placeholder used by the base page."""
    return {
        "slot": slot_index,
        "name": "Emplacement libre",
        "desc": "Emplacement apprenable — à remplir via l'Académie.",
        "rating": None,
        "stars": None,
        "icon": None,
        "replaceable": True,
        "replaceableReason": "Emplacement ouvert",
    }


def reset_polluted_base_slots(skills: list) -> bool:
    """
    Revert the f6ca99e-era pollution where trained signatures were written
    into `skills[]`. Any slot whose `replaceableReason` matches the training
    signature gets reset to an empty placeholder.
    """
    changed = False
    for i, s in enumerate(skills):
        if s.get("replaceableReason") == TRAINING_POLLUTION_REASON:
            slot_idx = s.get("slot", i + 1)
            skills[i] = make_empty_slot(slot_idx)
            changed = True
    return changed


def build_trained_skills(
    base_skills: list,
    final_stage: dict,
    sk_by_id: dict,
    catalog: dict,
) -> list:
    """
    Build the full `trainedSkills` array — the post-training loadout.

    Strategy: start from a deep copy of the base (already reset) skills.
    Then, for every skill-id in the final stage's Skills list, resolve it and
    either update an existing slot that already holds the same skillType, or
    fill the first empty slot with it.
    """
    final_ids = final_stage.get("Skills", []) or []
    trained = [dict(s) for s in base_skills]

    # Pre-compute index maps for quick lookup.
    def find_existing_by_type(ty: int):
        for idx, s in enumerate(trained):
            if s.get("skillType") == ty:
                return idx
        return None

    def find_first_empty():
        for idx, s in enumerate(trained):
            name = (s.get("name") or "").strip()
            if name in EMPTY_PLACEHOLDER_NAMES and s.get("skillType") is None:
                return idx
        return None

    for sid in final_ids:
        ss = sk_by_id.get(sid)
        if not ss:
            continue
        ty = ss["Type"]
        lvl = ss["Level"]
        resolved = resolve_skill(catalog, ty, lvl)
        if not resolved:
            continue

        existing_idx = find_existing_by_type(ty)
        if existing_idx is not None:
            # Bump the level/desc of the matching base skill.
            slot = trained[existing_idx]
            slot["name"] = resolved["name"]
            slot["nameEn"] = resolved["name"]
            slot["desc"] = resolved["rendered"]
            slot["icon"] = resolved["icon"]
            slot["skillSlug"] = resolved["slug"]
            slot["skillType"] = resolved["type"]
            slot["skillLevel"] = resolved["level"]
            slot["replaceable"] = False
            slot["replaceableReason"] = None
            continue

        empty_idx = find_first_empty()
        if empty_idx is None:
            # No room — append at the end so we never drop a training skill.
            slot_idx = len(trained) + 1
            trained.append({
                "slot": slot_idx,
                "name": resolved["name"],
                "nameEn": resolved["name"],
                "desc": resolved["rendered"],
                "rating": None,
                "stars": None,
                "icon": resolved["icon"],
                "replaceable": False,
                "replaceableReason": TRAINING_POLLUTION_REASON,
                "skillSlug": resolved["slug"],
                "skillType": resolved["type"],
                "skillLevel": resolved["level"],
            })
            continue

        slot = trained[empty_idx]
        slot.update({
            "name": resolved["name"],
            "nameEn": resolved["name"],
            "desc": resolved["rendered"],
            "icon": resolved["icon"],
            "replaceable": False,
            "replaceableReason": TRAINING_POLLUTION_REASON,
            "skillSlug": resolved["slug"],
            "skillType": resolved["type"],
            "skillLevel": resolved["level"],
        })

    return trained


def patch_general(
    wiki_path: Path,
    chain: list,
    sk_by_id: dict,
    catalog: dict,
) -> bool:
    if not chain:
        return False
    data = json.load(open(wiki_path))

    # 1. Revert any legacy pollution in base skills[].
    base_changed = reset_polluted_base_slots(data.get("skills", []))

    # 2. Build the full `trainedSkills` override from the final promotion stage.
    final_stage = chain[-1]
    trained_skills = build_trained_skills(
        data.get("skills", []),
        final_stage,
        sk_by_id,
        catalog,
    )

    # 3. Training totals + stage objects.
    total_swords = sum(s.get("CostSword", 0) or 0 for s in chain)
    total_sceptres = sum(s.get("CostSceptre", 0) or 0 for s in chain)
    existing_training = data.get("training") or {}
    existing_summary = (
        existing_training.get("summary") if isinstance(existing_training, dict) else None
    )
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

    changed = base_changed
    if data.get("hasTrainingPath") is not True:
        data["hasTrainingPath"] = True
        changed = True
    if data.get("training") != new_training:
        data["training"] = new_training
        changed = True
    if data.get("trainedSkills") != trained_skills:
        data["trainedSkills"] = trained_skills
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
