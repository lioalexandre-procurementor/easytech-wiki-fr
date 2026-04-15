#!/usr/bin/env python3
"""
Extract the complete skill catalog from the APK and build a wiki dataset.

Inputs
------
- wc4_data_decrypted/SkillSettings.json   (830 level entries, 166 types)
- wc4_extract/assets/stringtable_en.ini    (skill_name_{type}, skill_info_{type})
- wc4_data_decrypted/GeneralPromotionSettings.json  (maps trained skills to generals)
- wc4_data_decrypted/GeneralSettings.json  (maps current skill-ids to generals)
- APK assets/image/general_skill/general_skill_{type}.{webp|png}

Outputs
-------
- easytech-wiki/public/img/wc4/skills/general_skill_{type}.{webp|png}
- easytech-wiki/data/wc4/skills/{slug}.json                 (one file per skill type)
- easytech-wiki/data/wc4/skills/_index.json                 (browser index)

Skill-info templates use [#color#%d%%] / [#color#%d] placeholders; we substitute
per level by picking the field that actually varies across L1..L5 (SkillEffect
for effect-based skills, ActivatesChance for chance-based skills).
"""
import json
import re
import shutil
import zipfile
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WIKI = ROOT / "easytech-wiki"
APK = ROOT / "wc4_extract" / "com.easytech.wc4.android.apk"
SKILL_SETTINGS = ROOT / "wc4_data_decrypted" / "SkillSettings.json"
PROMOTION_SETTINGS = ROOT / "wc4_data_decrypted" / "GeneralPromotionSettings.json"
GENERAL_SETTINGS = ROOT / "wc4_data_decrypted" / "GeneralSettings.json"
STRINGTABLE = ROOT / "wc4_extract" / "assets" / "stringtable_en.ini"

OUT_DATA = WIKI / "data" / "wc4" / "skills"
OUT_IMG = WIKI / "public" / "img" / "wc4" / "skills"

# Series 0 holds both attribute-stat stubs (types 0-5) and signature-general
# skills (types 100+). Series 1-5 are the real learnable skill pools.
SERIES_META = {
    1: {
        "slug": "tactiques-de-terrain",
        "label": "Tactiques de terrain",
        "summary": "Maîtrise des terrains, barrages et assauts coordonnés.",
        "icon": "🗺",
    },
    2: {
        "slug": "commandement",
        "label": "Commandement",
        "summary": "Leaders d'armée et doctrines de commandement.",
        "icon": "🎖",
    },
    3: {
        "slug": "logistique",
        "label": "Logistique",
        "summary": "Production, réparation et soutien des troupes.",
        "icon": "🏭",
    },
    4: {
        "slug": "defense-et-camouflage",
        "label": "Défense et camouflage",
        "summary": "Fortifications, couverture et guerre psychologique.",
        "icon": "🛡",
    },
    5: {
        "slug": "offensive",
        "label": "Offensive",
        "summary": "Frappes critiques et multiplicateurs de dégâts.",
        "icon": "⚔",
    },
    0: {  # signature bucket (filtered to types >= 100 and named)
        "slug": "signature",
        "label": "Compétences spécifiques aux généraux",
        "summary": "Compétences uniques liées à un général (base ou entraînement).",
        "icon": "👑",
    },
}

# Skill types that are attribute stats, not real skills (Marching, Infantry
# stat…). Exclude these from the dataset and from any general's skill list.
ATTRIBUTE_TYPES = {0, 1, 2, 3, 4, 5}

# Color-code tags inside skill_info templates.
COLOR_RE = re.compile(r"\[#[0-9A-Fa-f]{6}#([^\]]*)\]")


def load_stringtable(path: Path) -> tuple[dict, dict]:
    text = path.read_text(encoding="utf-8", errors="replace")
    names, infos = {}, {}
    for k, v in re.findall(r"^skill_name_(\d+)=(.+)$", text, re.M):
        names[int(k)] = v.strip()
    for k, v in re.findall(r"^skill_info_(\d+)=(.+)$", text, re.M):
        infos[int(k)] = v.strip()
    return names, infos


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def pick_varying_field(levels: list[dict]) -> str:
    """Return 'SkillEffect' or 'ActivatesChance' — whichever varies across levels."""
    effects = {l["SkillEffect"] for l in levels}
    chances = {l["ActivatesChance"] for l in levels}
    if len(effects) > 1 and len(chances) > 1:
        # Rare: both vary. Prefer SkillEffect (it's the primary number).
        return "SkillEffect"
    if len(chances) > 1:
        return "ActivatesChance"
    return "SkillEffect"


def render_template(template: str, value: int) -> str:
    """Replace [#color#%d] / [#color#%d%%] placeholders with the actual value
    and strip any remaining color tags. %% is kept as literal %."""
    text = COLOR_RE.sub(r"\1", template)
    text = text.replace("%d%%", f"{value}%")
    text = text.replace("%d", str(value))
    text = text.replace("%%", "%")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def render_generic(template: str) -> str:
    """Readable description template (placeholder kept as `X`)."""
    text = COLOR_RE.sub(r"\1", template)
    text = text.replace("%d%%", "X%").replace("%d", "X")
    text = text.replace("%%", "%")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def collect_skill_by_type(skill_settings: list[dict]) -> dict[int, list[dict]]:
    buckets: dict[int, list[dict]] = defaultdict(list)
    for s in skill_settings:
        buckets[s["Type"]].append(s)
    for t, arr in buckets.items():
        arr.sort(key=lambda x: x["Level"])
    return buckets


def series_for(skill_type: int, series_field: int) -> int:
    """Decide which bucket this skill belongs in for the wiki browser."""
    if series_field in (1, 2, 3, 4, 5):
        return series_field
    if skill_type in ATTRIBUTE_TYPES:
        return -1  # excluded
    # Everything else in Series 0 (Ace Sniper, Hold Fast, Hero, etc.) is
    # routed to the signature bucket.
    return 0


def main():
    OUT_DATA.mkdir(parents=True, exist_ok=True)
    OUT_IMG.mkdir(parents=True, exist_ok=True)

    names, infos = load_stringtable(STRINGTABLE)
    skill_settings = json.load(open(SKILL_SETTINGS))
    promotion = json.load(open(PROMOTION_SETTINGS))
    general_settings = json.load(open(GENERAL_SETTINGS))

    by_type = collect_skill_by_type(skill_settings)
    # Skill-id -> (type, level) lookup for cross-referencing from generals.
    id_to_meta = {s["Id"]: (s["Type"], s["Level"]) for s in skill_settings}

    # Which generals carry each skill type (base + promoted)?
    # Values: {"base": [{"generalId": N, "level": L}], "promoted": [...]}
    usage: dict[int, dict] = defaultdict(lambda: {"base": [], "promoted": []})
    for gen in general_settings:
        gid = gen["Id"]
        for skid in gen.get("Skills", []):
            meta = id_to_meta.get(skid)
            if meta:
                ty, lvl = meta
                if ty in ATTRIBUTE_TYPES:
                    continue
                usage[ty]["base"].append({"generalId": gid, "level": lvl})
    for p in promotion:
        gid = p["BaseID"]
        for skid in p.get("Skills", []):
            meta = id_to_meta.get(skid)
            if meta:
                ty, lvl = meta
                if ty in ATTRIBUTE_TYPES:
                    continue
                usage[ty]["promoted"].append({
                    "generalId": gid,
                    "level": lvl,
                    "promotionId": p["Id"],
                })

    # Extract skill icons from the APK.
    icon_map: dict[int, str] = {}
    with zipfile.ZipFile(APK) as zf:
        zf_names = set(zf.namelist())
        # Wipe existing icons so we re-extract fresh.
        for f in list(OUT_IMG.glob("general_skill_*")):
            f.unlink()
        for ty in by_type.keys():
            for ext in (".webp", ".png"):
                src = f"assets/image/general_skill/general_skill_{ty}{ext}"
                if src in zf_names:
                    out = OUT_IMG / f"general_skill_{ty}{ext}"
                    with zf.open(src) as sfp, open(out, "wb") as dfp:
                        shutil.copyfileobj(sfp, dfp)
                    icon_map[ty] = f"/img/wc4/skills/general_skill_{ty}{ext}"
                    break

    # Build one JSON per skill type.
    skills_out = []
    used_slugs: set[str] = set()

    for ty in sorted(by_type.keys()):
        name = names.get(ty)
        if not name or name == "None":
            continue
        levels = by_type[ty]
        series_field = levels[0].get("Series", 0)
        series = series_for(ty, series_field)
        if series < 0:
            continue  # attribute stubs excluded
        template = infos.get(ty, "")
        varying = pick_varying_field(levels)
        progression = []
        for l in levels:
            value = l[varying]
            progression.append({
                "level": l["Level"],
                "skillId": l["Id"],
                "effect": l["SkillEffect"],
                "chance": l["ActivatesChance"],
                "costMedal": l["CostMedal"],
                "renderedDesc": render_template(template, value) if template else "",
            })

        base_slug = slugify(name)
        slug = base_slug
        n = 2
        while slug in used_slugs:
            slug = f"{base_slug}-{n}"
            n += 1
        used_slugs.add(slug)

        skill_data = {
            "slug": slug,
            "type": ty,
            "name": name,
            "series": series,
            "seriesLabel": SERIES_META[series]["label"],
            "descriptionTemplate": render_generic(template) if template else "",
            "icon": icon_map.get(ty),
            "maxLevel": max(l["Level"] for l in levels),
            "progression": progression,
            "usage": usage.get(ty, {"base": [], "promoted": []}),
            "varyingField": varying,
        }
        (OUT_DATA / f"{slug}.json").write_text(
            json.dumps(skill_data, indent=2, ensure_ascii=False) + "\n"
        )
        skills_out.append({
            "slug": slug,
            "type": ty,
            "name": name,
            "series": series,
            "seriesLabel": SERIES_META[series]["label"],
            "seriesSlug": SERIES_META[series]["slug"],
            "icon": icon_map.get(ty),
            "shortDesc": render_generic(template)[:140] if template else "",
            "maxLevel": max(l["Level"] for l in levels),
        })

    skills_out.sort(key=lambda s: (s["series"], s["name"]))
    index_data = {
        "series": [
            {
                "series": k,
                "slug": v["slug"],
                "label": v["label"],
                "summary": v["summary"],
                "icon": v["icon"],
                "count": sum(1 for s in skills_out if s["series"] == k),
            }
            for k, v in sorted(SERIES_META.items(), key=lambda kv: (0 if kv[0] > 0 else 1, kv[0]))
        ],
        "skills": skills_out,
    }
    (OUT_DATA / "_index.json").write_text(
        json.dumps(index_data, indent=2, ensure_ascii=False) + "\n"
    )

    print(f"Wrote {len(skills_out)} skill JSONs + {len(icon_map)} icons")
    by_ser: dict[int, int] = defaultdict(int)
    for s in skills_out:
        by_ser[s["series"]] += 1
    for ser, count in sorted(by_ser.items()):
        print(f"  series {ser} ({SERIES_META[ser]['label']}): {count}")


if __name__ == "__main__":
    main()
