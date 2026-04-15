#!/usr/bin/env python3
"""
Backfill every general JSON with the full skill catalog cross-links.

For each general in wc4_export/generals_canonical.json we:
- find the matching wiki JSON (by apkId or slug)
- walk the canonical.skills array (one entry per base skill slot)
- look up the skill catalog (easytech-wiki/data/wc4/skills/_index.json +
  per-slug JSONs) to resolve: slug, maxLevel, per-level rendered description,
  canonical English name
- patch the matching wiki skill slot with:
    name (English canonical), nameEn, desc (rendered per-level), icon (resolved
    to .webp or .png depending on which file exists), skillType, skillLevel,
    skillSlug
- preserve existing `rating`, `stars`, `replaceable`, `replaceableReason`
- leave empty slots (where canonical.skills has fewer entries than skillSlots)
  as-is so the hand-curated "Emplacement libre" entries stay

Run:
  python3 scripts/backfill-general-skills.py
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WIKI = ROOT / "easytech-wiki"
CANONICAL = ROOT / "wc4_export" / "generals_canonical.json"
GENERALS_DIR = WIKI / "data" / "wc4" / "generals"
SKILLS_DIR = WIKI / "data" / "wc4" / "skills"
SKILLS_INDEX = SKILLS_DIR / "_index.json"


def load_skill_catalog():
    """Return a dict: type_id -> {slug, name, progression[{level, renderedDesc,...}], icon, maxLevel}"""
    idx = json.load(open(SKILLS_INDEX))
    by_type = {}
    for item in idx["skills"]:
        slug = item["slug"]
        full = json.load(open(SKILLS_DIR / f"{slug}.json"))
        by_type[item["type"]] = full
    return by_type


def resolve_skill(
    catalog: dict,
    type_id: int,
    level: int,
) -> dict | None:
    s = catalog.get(type_id)
    if not s:
        return None
    # Find the progression entry for this level (fallback to last).
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
        "maxLevel": s.get("maxLevel", 5),
    }


def patch_general(wiki_path: Path, canon: dict, catalog: dict) -> bool:
    data = json.load(open(wiki_path))
    current_skills = data.get("skills", [])
    canon_skills = canon.get("skills", [])

    # Build a type→level lookup for canonical skills.
    canon_by_type = {s["type"]: s for s in canon_skills}

    # Strategy: iterate slots. For each slot, see if canonical has a skill for
    # that index; if yes, patch. Otherwise leave untouched.
    changed = False
    for i, slot in enumerate(current_skills):
        if i >= len(canon_skills):
            continue
        cs = canon_skills[i]
        resolved = resolve_skill(catalog, cs["type"], cs["level"])
        if not resolved:
            continue
        new_name = resolved["name"]
        new_desc = resolved["rendered"]
        new_icon = resolved["icon"] or slot.get("icon")
        new_slug = resolved["slug"]
        new_type = resolved["type"]
        new_level = resolved["level"]

        before = (
            slot.get("name"),
            slot.get("desc"),
            slot.get("icon"),
            slot.get("skillSlug"),
            slot.get("skillType"),
            slot.get("skillLevel"),
        )
        slot["name"] = new_name
        slot["nameEn"] = new_name
        slot["desc"] = new_desc
        slot["icon"] = new_icon
        slot["skillSlug"] = new_slug
        slot["skillType"] = new_type
        slot["skillLevel"] = new_level
        after = (
            slot["name"],
            slot["desc"],
            slot["icon"],
            slot["skillSlug"],
            slot["skillType"],
            slot["skillLevel"],
        )
        if before != after:
            changed = True

    if changed:
        wiki_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return changed


def main():
    catalog = load_skill_catalog()
    canonical = json.load(open(CANONICAL))

    # Index wiki generals by apkId (preferred) and slug.
    wiki_by_apkid = {}
    wiki_by_slug = {}
    for f in sorted(GENERALS_DIR.glob("*.json")):
        if f.name.startswith("_"):
            continue
        d = json.load(open(f))
        slug = d.get("slug") or f.stem
        wiki_by_slug[slug] = f
        if d.get("apkId") is not None:
            wiki_by_apkid[d["apkId"]] = f

    patched = 0
    missing = []
    for canon in canonical:
        cid = canon.get("id")
        wiki_path = wiki_by_apkid.get(cid)
        if not wiki_path:
            # try by slug derived from photo or nameEn
            name_en = canon.get("nameEn", "")
            slug_guess = name_en.lower().replace(" ", "-")
            wiki_path = wiki_by_slug.get(slug_guess)
        if not wiki_path:
            missing.append((cid, canon.get("nameEn")))
            continue
        if patch_general(wiki_path, canon, catalog):
            patched += 1

    print(f"Patched {patched} general JSONs")
    if missing:
        print(f"{len(missing)} canonical entries had no matching wiki file:")
        for cid, name in missing[:10]:
            print(f"  - {cid} {name}")
        if len(missing) > 10:
            print(f"  ... +{len(missing) - 10} more")


if __name__ == "__main__":
    main()
