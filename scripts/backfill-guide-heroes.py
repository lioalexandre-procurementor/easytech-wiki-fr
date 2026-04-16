#!/usr/bin/env python3
"""
Attach a hero image + alt text to every WC4 guide JSON so the guide
cards + detail headers render a WC4-themed visual instead of the
current plain gradient.

Images are pulled from the local /public/img/wc4 tree (general
portraits and elite unit sprites already extracted from the game
files). This keeps rendering offline and CDN-friendly — no external
wiki hotlinks to break.

Idempotent: if `heroImage` is already set, the entry is skipped.
"""

from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUIDES_DIR = ROOT / "content" / "guides" / "wc4"

# slug → (heroImage path, heroAlt)
# Paths are relative to /public, rendered as <Image src="/img/wc4/..." />.
MAPPING: dict[str, tuple[str, str]] = {
    "getting-started-2026": (
        "/img/wc4/generals/Eisenhower.webp",
        "Dwight Eisenhower — Supreme Allied Commander",
    ),
    "first-generals": (
        "/img/wc4/generals/Auchinleck.webp",
        "Claude Auchinleck — bronze starter general",
    ),
    "farm-medals": (
        "/img/wc4/generals/Patton.webp",
        "George Patton — medal-earning campaign icon",
    ),
    "tier-list-generaux-wc4": (
        "/img/wc4/generals/Guderian.webp",
        "Heinz Guderian — S-tier armor general",
    ),
    "competences-vote-wc4": (
        "/img/wc4/generals/Rokossovsky.webp",
        "Rokossovsky — signature trainable skill archetype",
    ),
    "unites-elite-wc4": (
        "/img/wc4/elites/318001.webp",
        "IS-3 — Soviet heavy tank elite unit",
    ),
    "conquete-mondiale-allies-wc4": (
        "/img/wc4/generals/Montgomery.webp",
        "Bernard Montgomery — Allied field commander",
    ),
    "conquete-mondiale-axe-wc4": (
        "/img/wc4/generals/Manstein.webp",
        "Erich von Manstein — Axis field commander",
    ),
    "defense-ville-wc4": (
        "/img/wc4/generals/Heinrici.webp",
        "Gotthard Heinrici — top bronze defender",
    ),
    "super-armes-wc4": (
        "/img/wc4/elites/305001.webp",
        "Schwerer Gustav — super-weapon railway gun",
    ),
    "generaux-premium-wc4": (
        "/img/wc4/generals/Rommel.webp",
        "Erwin Rommel — premium-tier armor general",
    ),
    "april-2026-update": (
        "/img/wc4/generals/Dowding.webp",
        "Hugh Dowding — spotlight of the April 2026 patch",
    ),
}


def main() -> int:
    updated = 0
    skipped = 0
    missing: list[str] = []
    for slug, (img, alt) in MAPPING.items():
        fp = GUIDES_DIR / f"{slug}.json"
        if not fp.exists():
            missing.append(slug)
            continue
        # Verify image actually exists on disk so we don't ship broken src.
        img_path = ROOT / "public" / img.lstrip("/")
        if not img_path.exists():
            missing.append(f"{slug} — image missing at {img_path}")
            continue
        with fp.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if data.get("heroImage") == img and data.get("heroAlt") == alt:
            skipped += 1
            continue
        data["heroImage"] = img
        data["heroAlt"] = alt
        with fp.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        updated += 1
    print(f"Updated: {updated} · skipped: {skipped} · missing: {len(missing)}")
    if missing:
        print("\nMissing:")
        for m in missing:
            print(f"  {m}")
        return 1
    return 0


if __name__ == "__main__":
    import sys

    sys.exit(main())
