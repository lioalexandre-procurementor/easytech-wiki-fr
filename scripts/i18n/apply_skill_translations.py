#!/usr/bin/env python3
"""Apply proper FR + new DE translations to skill JSON data.

Context (Tier 1 SEO, 2026-06): the FR skill text was word-swap franglais
("Lorsque utilisant aérien et missile attaque...") and DE had no fields at
all — the /de/ skills hub openly stated descriptions were English. This
script bakes curated translations (skill-translations-2026-06.json, written
by Claude and reviewable/re-runnable) into:

  data/{wc4,ew6,gcr}/skills/<slug>.json
    nameFr (EW6 only — WC4 FR names were already curated), nameDe,
    descriptionTemplateFr, descriptionTemplateDe,
    progression[].renderedDescFr / renderedDescDe
  data/{game}/skills/_index.json
    nameFr/nameDe, shortDescFr/shortDescDe

Per-level rendering: the EN template differs from each renderedDesc only by
X/Y/Z placeholder substitution (verified: 805/805 rows align). We extract
the per-level values by regexing the EN template against renderedDesc, then
substitute the same letter->value mapping into the FR/DE templates.

longDesc embedded quotes are patched only when the old renderedDescFr
matches verbatim (best effort — the generator paraphrased some quotes).
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HERE = os.path.dirname(os.path.abspath(__file__))


def load(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def save(p, d):
    with open(p, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
        f.write("\n")


def letter_values(template_en, rendered_en):
    """Extract X/Y/Z -> value mapping by aligning template with rendered."""
    letters = []

    def repl(m):
        letters.append(m.group(1))
        return r"(-?\d+(?:\.\d+)?)"

    rx = re.sub(r"\\\b([XYZ])\\\b|\b([XYZ])\b", lambda m: m.group(0), template_en)
    rx = re.escape(template_en)
    rx = re.sub(r"(?<![A-Za-z])([XYZ])(?![A-Za-z])", repl, rx)
    m = re.match("^" + rx + "$", rendered_en)
    if not m:
        return None
    out = {}
    for letter, val in zip(letters, m.groups()):
        out.setdefault(letter, val)
    return out


def render(template_loc, mapping):
    return re.sub(
        r"(?<![A-Za-z])([XYZ])(?![A-Za-z])",
        lambda m: mapping.get(m.group(1), m.group(1)),
        template_loc,
    )


def main():
    tr = load(os.path.join(HERE, "skill-translations-2026-06.json"))
    stats = {"files": 0, "levels": 0, "align_fail": 0, "longdesc_patched": 0}

    for game, entries in tr["templates"].items():
        d = os.path.join(ROOT, "data", game, "skills")
        for slug, t in entries.items():
            p = os.path.join(d, slug + ".json")
            if not os.path.exists(p):
                print(f"WARN missing file {game}/{slug}", file=sys.stderr)
                continue
            s = load(p)
            old_rendered_fr = [
                pr.get("renderedDescFr", "") for pr in s.get("progression", [])
            ]

            if t.get("nameFr"):
                s["nameFr"] = t["nameFr"]
            if t.get("nameDe"):
                s["nameDe"] = t["nameDe"]
            if t.get("fr"):
                s["descriptionTemplateFr"] = t["fr"]
            if t.get("de"):
                s["descriptionTemplateDe"] = t["de"]

            tpl_en = s.get("descriptionTemplate", "")
            for i, pr in enumerate(s.get("progression", [])):
                stats["levels"] += 1
                mapping = (
                    letter_values(tpl_en, pr.get("renderedDesc", ""))
                    if tpl_en
                    else None
                )
                if mapping is None:
                    stats["align_fail"] += 1
                    continue
                if t.get("fr"):
                    pr["renderedDescFr"] = render(t["fr"], mapping)
                if t.get("de"):
                    pr["renderedDescDe"] = render(t["de"], mapping)

            # Best-effort: swap stale franglais quotes inside the FR longDesc.
            if s.get("longDesc") and t.get("fr"):
                ld = s["longDesc"]
                for old, pr in zip(old_rendered_fr, s.get("progression", [])):
                    new = pr.get("renderedDescFr", "")
                    if old and new and old != new and old in ld:
                        ld = ld.replace(old, new)
                        stats["longdesc_patched"] += 1
                s["longDesc"] = ld

            save(p, s)
            stats["files"] += 1

        # _index.json: names + short descs (shortDesc mirrors the template).
        idx_path = os.path.join(d, "_index.json")
        idx = load(idx_path)
        for sk in idx.get("skills", []):
            t = entries.get(sk["slug"])
            if not t:
                continue
            if t.get("nameFr"):
                sk["nameFr"] = t["nameFr"]
            if t.get("nameDe"):
                sk["nameDe"] = t["nameDe"]
            if t.get("fr"):
                sk["shortDescFr"] = t["fr"]
            if t.get("de"):
                sk["shortDescDe"] = t["de"]
        save(idx_path, idx)

    print(stats)


if __name__ == "__main__":
    main()
