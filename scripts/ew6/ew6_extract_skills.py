#!/usr/bin/env python3
"""
European War 6: 1914 — skills catalog extractor.

Reads:
  - ew6_data_decrypted/SkillSettings.json
  - ew6_extract/unpacked/assets/stringtable_en.ini

Writes:
  - easytech-wiki/data/ew6/skills/<slug>.json  (one per skill Type)
  - easytech-wiki/data/ew6/skills/_index.json  (summary + series breakdown)

Mirrors scripts/gcr/gcr_extract_skills.py. EW6 skills are grouped by
`Type` (1..~35) which acts as the canonical skill id; each Type has 1..6
levels distinguished by `Lv`. Stringtable keys are `skill_<Type>` and
`skill_desc_<Type>`.
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
EW6_DATA = ROOT / "ew6_data_decrypted"
EW6_EXTRACT = ROOT / "ew6_extract" / "unpacked" / "assets"
WIKI = ROOT / "easytech-wiki"
OUT_DIR = WIKI / "data" / "ew6" / "skills"

SERIES_LABELS = {
    0: ("signature",  "Signature commander skill"),
    1: ("series-1",   "Generic learnable skill (series 1)"),
    2: ("series-2",   "Generic learnable skill (series 2)"),
    3: ("series-3",   "Generic learnable skill (series 3)"),
    4: ("series-4",   "Generic learnable skill (series 4)"),
    5: ("series-5",   "Generic learnable skill (series 5)"),
}


def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s or "skill"


def parse_stringtable(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for raw in path.read_text(encoding="utf-8-sig", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith(";") or line.startswith("#") or line.startswith("["):
            continue
        if "=" not in line:
            continue
        k, _, v = line.partition("=")
        out[k.strip()] = v.strip().strip('"')
    return out


def render_desc(tpl: str, entry: dict) -> str:
    """Substitute {0}/{1}/{2} and strip [#RRGGBB#…] colour markers."""
    effect = entry.get("SkillEffect") or entry.get("ActivatesChance") or 0
    chance = entry.get("ActivatesChance") or 0
    text = tpl
    text = text.replace("{0}", str(effect))
    text = text.replace("{1}", str(chance))
    text = text.replace("{2}", "3")
    text = re.sub(r"\[#([0-9A-Fa-f]{6})#([^\]]*)\]", r"\2", text)
    return text


def main() -> int:
    skills = json.loads((EW6_DATA / "SkillSettings.json").read_text())
    strings_en = parse_stringtable(EW6_EXTRACT / "stringtable_en.ini")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Group by skill Type — progression is the list of levels sharing a Type.
    by_type: dict[int, list[dict]] = {}
    for s in skills:
        by_type.setdefault(s.get("Type", 0), []).append(s)

    series_counts: dict[int, int] = {}
    skills_index: list[dict] = []

    for t, entries in sorted(by_type.items()):
        entries.sort(key=lambda e: e.get("Lv", 1))
        head = entries[0]
        name = strings_en.get(f"skill_{t}") or head.get("Name") or f"Skill_{t}"
        desc_tpl = strings_en.get(f"skill_desc_{t}", "")
        slug = slugify(name)
        # EW6 uses SkillGroup as a loose series marker (1 = standard pool).
        series = head.get("SkillGroup", 0)
        series_slug, series_label = SERIES_LABELS.get(series, (f"series-{series}", f"Series {series}"))

        progression = []
        for e in entries:
            lv = e.get("Lv", 1)
            effect = e.get("SkillEffect", 0)
            chance = e.get("ActivatesChance", 0)
            cost = e.get("CostMedals", 0)
            rendered = render_desc(desc_tpl, e)
            progression.append({
                "level": lv,
                "skillId": e.get("Id"),
                "effect": effect,
                "chance": chance,
                "costMedal": cost,
                "renderedDesc": rendered,
                "renderedDescFr": rendered,
            })

        varying_field = "SkillEffect" if head.get("SkillEffect") else "ActivatesChance"

        record = {
            "slug": slug,
            "type": t,
            "name": name,
            "nameFr": name,
            "series": series,
            "seriesLabel": series_label,
            "descriptionTemplate": re.sub(
                r"\[#[0-9A-Fa-f]{6}#([^\]]*)\]", r"\1",
                desc_tpl.replace("{0}", "X").replace("{1}", "Y").replace("{2}", "Z"),
            ),
            "descriptionTemplateFr": re.sub(
                r"\[#[0-9A-Fa-f]{6}#([^\]]*)\]", r"\1",
                desc_tpl.replace("{0}", "X").replace("{1}", "Y").replace("{2}", "Z"),
            ),
            "icon": f"/img/ew6/skills/skill_{t}.webp",
            "maxLevel": max(e.get("Lv", 1) for e in entries),
            "progression": progression,
            "usage": {"base": [], "promoted": []},
            "varyingField": varying_field,
        }

        (OUT_DIR / f"{slug}.json").write_text(
            json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        skills_index.append({
            "slug": slug,
            "type": t,
            "name": name,
            "nameFr": name,
            "series": series,
            "seriesLabel": series_label,
            "seriesSlug": series_slug,
            "icon": record["icon"],
            "shortDesc": progression[0]["renderedDesc"] if progression else "",
            "shortDescFr": progression[0]["renderedDescFr"] if progression else "",
            "maxLevel": record["maxLevel"],
        })
        series_counts[series] = series_counts.get(series, 0) + 1

    series_meta = []
    for sid, (sslug, slabel) in SERIES_LABELS.items():
        if series_counts.get(sid):
            series_meta.append({
                "series": sid,
                "slug": sslug,
                "label": slabel,
                "summary": slabel,
                "icon": f"/img/ew6/skills/series_{sid}.webp",
                "count": series_counts[sid],
            })

    (OUT_DIR / "_index.json").write_text(
        json.dumps({"series": series_meta, "skills": skills_index}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Wrote {len(skills_index)} skills to {OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
