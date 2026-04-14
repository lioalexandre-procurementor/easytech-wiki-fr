#!/usr/bin/env python3
"""Backfill existing wiki generals with real data from wc4_export.

For each JSON in data/wc4/generals/*.json (excluding _index.json), match
to wc4_export/generals_canonical.json by last-name fallback (wiki uses
French display names like "Heinz Guderian", APK uses "Guderian"), then
update:

  - attributes.{infantry,artillery,armor,navy,airforce,marching} = {start, max}
  - acquisition.cost (if currently null)
  - nameCanonical, skillSlots, unlockHQLv, militaryRank, apkId
  - skills[].nameEn (new field, leaves existing FR `name` untouched)

Existing human-curated fields (longDesc, shortDesc, recommendedUnits,
bonuses, training.summary, verified flag) are NEVER overwritten.

Run from easytech-wiki/ root:
    python3 scripts/backfill-generals.py
"""
import json
import re
import sys
from difflib import get_close_matches
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WIKI_DIR = ROOT / "data" / "wc4" / "generals"
EXPORT = ROOT.parent / "wc4_export" / "generals_canonical.json"


def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def last_name(display):
    return display.split()[-1] if display else ""


def build_index(canonical):
    idx = {}
    for g in canonical:
        for key in (g.get("nameEnRaw"), g.get("nameEn")):
            if key:
                idx[norm(key)] = g
                parts = key.split(".")
                if len(parts) > 1:
                    idx[norm(parts[-1])] = g
    return idx


def find_match(wiki, idx):
    candidates = [
        wiki.get("nameEn"),
        last_name(wiki.get("nameEn") or ""),
        last_name(wiki.get("name") or ""),
        wiki.get("slug"),
    ]
    for c in candidates:
        if c and norm(c) in idx:
            return idx[norm(c)]
    for c in candidates:
        if not c:
            continue
        hits = get_close_matches(norm(c), idx.keys(), n=1, cutoff=0.82)
        if hits:
            return idx[hits[0]]
    return None


def merge(wiki, canon):
    changes = []
    out = dict(wiki)

    for wiki_key, canon_key in [
        ("nameCanonical", "nameEn"),
        ("skillSlots", "skillSlots"),
        ("unlockHQLv", "unlockHQLv"),
        ("militaryRank", "militaryRank"),
        ("apkId", "id"),
    ]:
        cval = canon.get(canon_key)
        if cval is not None and out.get(wiki_key) != cval:
            out[wiki_key] = cval
            changes.append(f"  {wiki_key} = {cval}")

    attr_map = [
        ("infantry", "infantry"),
        ("artillery", "artillery"),
        ("armor", "armor"),
        ("navy", "navy"),
        ("airforce", "airforce"),
        ("marching", "march"),
    ]
    attrs = dict(out.get("attributes") or {})
    for wiki_k, canon_k in attr_map:
        base = canon["stats"].get(canon_k)
        top = canon["statsMax"].get(canon_k)
        if base is None or top is None:
            continue
        if attrs.get(wiki_k) is None:
            attrs[wiki_k] = {"start": base, "max": top}
            changes.append(f"  attributes.{wiki_k} = {base}->{top}")
    out["attributes"] = attrs

    acq = dict(out.get("acquisition") or {})
    if acq.get("cost") is None and canon.get("costMedal"):
        acq["cost"] = canon["costMedal"]
        acq["currency"] = "medals"
        changes.append(f"  acquisition.cost = {canon['costMedal']}")
    out["acquisition"] = acq

    canon_skills = [s for s in canon.get("skills", []) if s.get("nameEn")]
    available = list(canon_skills)  # pool shrinks as slots are matched
    wiki_skills = out.get("skills") or []
    wiki_slug = out.get("slug", "?")
    for ws in wiki_skills:
        if ws.get("nameEn"):
            # Already has an English name — try to consume the matching canon entry
            # from the pool so it can't match another slot, but don't overwrite.
            norm_existing = norm(ws["nameEn"])
            for cs in available:
                if norm(cs["nameEn"]) == norm_existing:
                    available.remove(cs)
                    break
            continue

        # Collect candidate names for this wiki skill slot
        candidates = []
        if ws.get("nameEn"):
            candidates.append(ws["nameEn"])
        if ws.get("name"):
            candidates.append(ws["name"])

        norm_candidates = [norm(c) for c in candidates if c]
        norm_pool = {norm(cs["nameEn"]): cs for cs in available}

        matched_cs = None

        # Exact match first
        for nc in norm_candidates:
            if nc in norm_pool:
                matched_cs = norm_pool[nc]
                break

        # Fuzzy fallback
        if matched_cs is None and norm_pool:
            for nc in norm_candidates:
                hits = get_close_matches(nc, norm_pool.keys(), n=1, cutoff=0.72)
                if hits:
                    matched_cs = norm_pool[hits[0]]
                    break

        if matched_cs is not None:
            ws["nameEn"] = matched_cs["nameEn"]
            changes.append(f"  skills[slot{ws.get('slot','?')}].nameEn = {matched_cs['nameEn']}")
            available.remove(matched_cs)
        else:
            canon_list = [cs["nameEn"] for cs in available]
            print(
                f"WARN: {wiki_slug} slot {ws.get('slot','?')} {ws.get('name')!r}"
                f" — no canonical match (candidates: {canon_list})"
            )

    return out, changes


def main():
    if not EXPORT.exists():
        print(f"ERROR: {EXPORT} not found. Run build_wc4_export.py first.", file=sys.stderr)
        return 1
    canonical = json.loads(EXPORT.read_text(encoding="utf-8"))
    idx = build_index(canonical)

    wiki_files = sorted(WIKI_DIR.glob("*.json"))
    wiki_files = [p for p in wiki_files if not p.name.startswith("_")]

    updated = 0
    unmatched = []
    for p in wiki_files:
        wiki = json.loads(p.read_text(encoding="utf-8"))
        canon = find_match(wiki, idx)
        if not canon:
            unmatched.append(p.name)
            continue
        new, changes = merge(wiki, canon)
        if changes:
            p.write_text(
                json.dumps(new, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            updated += 1
            print(f"OK {p.stem}  ({canon['nameEn']})")
            for c in changes:
                print(c)

    print(f"\n{updated}/{len(wiki_files)} updated")
    if unmatched:
        print(f"UNMATCHED: {unmatched}")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
