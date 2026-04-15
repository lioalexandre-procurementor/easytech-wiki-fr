#!/usr/bin/env python3
"""
Backfill locale-specific `shortDescEn` / `shortDescDe` fields on every
general JSON in data/wc4/generals/*.json.

Strategy:
  1. Parse the French `shortDesc` against a small set of templates,
     using glossary maps for category / quality / country.
  2. If the template matches, write the EN and DE variant using the
     glossary, substituting the matched slots.
  3. If the template does NOT match (~8 freeform entries), look up a
     hand-curated override table by slug.
  4. Preserve the original FR `shortDesc` as-is. Add siblings only.
  5. If `shortDescEn` / `shortDescDe` already exist, skip (idempotent).
"""

from __future__ import annotations
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GEN_DIR = ROOT / "data" / "wc4" / "generals"

# ─── glossaries ─────────────────────────────────────────────────────────────

CATEGORY_FR_TO = {
    "artillerie":  {"en": "artillery",  "de": "Artillerie"},
    "blindé":      {"en": "armor",      "de": "Panzer"},
    "blindée":     {"en": "armor",      "de": "Panzer"},  # FR typo variant used in data
    "infanterie":  {"en": "infantry",   "de": "Infanterie"},
    "navale":      {"en": "naval",      "de": "Marine"},
    "aérienne":    {"en": "air force",  "de": "Luftwaffen"},
    "polyvalente": {"en": "balanced",   "de": "ausgewogene"},
    "polyvalent":  {"en": "balanced",   "de": "ausgewogene"},
}

QUALITY_FR_TO = {
    "bronze":   {"en": "bronze",   "de": "Bronze"},
    "argent":   {"en": "silver",   "de": "Silber"},
    "or":       {"en": "gold",     "de": "Gold"},
    "maréchal": {"en": "marshal",  "de": "Marschall"},
}

COUNTRY_FR_TO = {
    "États-Unis":                 {"en": "United States",            "de": "Vereinigte Staaten"},
    "Royaume-Uni":                {"en": "United Kingdom",           "de": "Vereinigtes Königreich"},
    "Allemagne":                  {"en": "Germany",                  "de": "Deutschland"},
    "France":                     {"en": "France",                   "de": "Frankreich"},
    "URSS":                       {"en": "USSR",                     "de": "UdSSR"},
    "Japon":                      {"en": "Japan",                    "de": "Japan"},
    "Italie":                     {"en": "Italy",                    "de": "Italien"},
    "République populaire de Chine": {"en": "People's Republic of China", "de": "Volksrepublik China"},
    "Pologne":                    {"en": "Poland",                   "de": "Polen"},
    "Canada":                     {"en": "Canada",                   "de": "Kanada"},
    "Australie":                  {"en": "Australia",                "de": "Australien"},
    "Finlande":                   {"en": "Finland",                  "de": "Finnland"},
    "Yougoslavie":                {"en": "Yugoslavia",               "de": "Jugoslawien"},
    "Turquie":                    {"en": "Turkey",                   "de": "Türkei"},
    "Égypte":                     {"en": "Egypt",                    "de": "Ägypten"},
}

# ─── templates ──────────────────────────────────────────────────────────────

# "Général artillerie or — États-Unis."
TEMPLATE_RE = re.compile(
    r"^Général\s+"
    r"(?P<cat>artillerie|blindé|blindée|infanterie|navale|aérienne|polyvalente|polyvalent)\s+"
    r"(?P<quality>bronze|argent|or|maréchal)\s+—\s+"
    r"(?P<country>[^.]+?)\s*\.$"
)

def render_templated(match: re.Match) -> tuple[str, str]:
    cat = match.group("cat")
    quality = match.group("quality")
    country = match.group("country")
    cat_en = CATEGORY_FR_TO[cat]["en"]
    cat_de = CATEGORY_FR_TO[cat]["de"]
    q_en = QUALITY_FR_TO[quality]["en"]
    q_de = QUALITY_FR_TO[quality]["de"]
    c_en = COUNTRY_FR_TO[country]["en"]
    c_de = COUNTRY_FR_TO[country]["de"]
    en = f"{q_en.capitalize()} {cat_en} general — {c_en}."
    de = f"{q_de} {cat_de}-General — {c_de}."
    return en, de


# ─── freeform overrides (keyed by FR text so hits dedupe) ───────────────────

FREEFORM = {
    "Amiral japonais polyvalent — aussi excellent en aviation.": (
        "Versatile Japanese admiral — also excellent in air warfare.",
        "Vielseitiger japanischer Admiral — auch stark in der Luftkriegsführung.",
    ),
    "Après entraînement, meilleur amiral F2P de la marine soviétique.": (
        "After training, the best F2P admiral in the Soviet navy.",
        "Nach dem Training der beste F2P-Admiral der sowjetischen Marine.",
    ),
    "Capitaine de l'Empire du Scorpion, concepteur du KS-90.": (
        "Captain of the Scorpion Empire, designer of the KS-90.",
        "Hauptmann des Skorpion-Imperiums, Konstrukteur des KS-90.",
    ),
    "Commandant britannique, guerre d'infanterie méthodique.": (
        "British commander, methodical infantry warfare.",
        "Britischer Kommandant, methodische Infanteriekriegsführung.",
    ),
    "Général blindé américain agressif — tier S avec survivabilité.": (
        "Aggressive American armor general — Tier S with strong survivability.",
        "Aggressiver US-Panzer-General — Tier S mit hoher Überlebensfähigkeit.",
    ),
    "Le Renard du Désert — général blindé offensif-défensif.": (
        "The Desert Fox — balanced offensive/defensive armor general.",
        "Der Wüstenfuchs — ausgewogener Offensiv-/Defensiv-Panzergeneral.",
    ),
    "Leader de l'Empire du Scorpion — ancien général britannique Alfred.": (
        "Leader of the Scorpion Empire — formerly the British general Alfred.",
        "Anführer des Skorpion-Imperiums — ursprünglich der britische General Alfred.",
    ),
    "Maréchal IAP polyvalent — au niveau de Konev en appui-feu.": (
        "Premium (IAP) balanced marshal — on par with Konev for fire support.",
        "Premium (IAP) ausgewogener Marschall — auf Augenhöhe mit Konew bei der Feuerunterstützung.",
    ),
    "Meilleur amiral de WC4 — spécialiste des sous-marins.": (
        "The best admiral in WC4 — submarine specialist.",
        "Der beste Admiral in WC4 — Spezialist für U-Boot-Kriegsführung.",
    ),
    "Meilleur général F2P après entraînement — débloque « Anéantir le Nord ».": (
        "Best F2P general after training — unlocks \"Wipe Out The North\".",
        "Bester F2P-General nach dem Training — schaltet „Wipe Out The North“ frei.",
    ),
    "Meilleur général d'artillerie — l'équivalent de Guderian pour l'artillerie.": (
        "The best artillery general — the artillery equivalent of Guderian.",
        "Der beste Artillerie-General — das Artillerie-Pendant zu Guderian.",
    ),
    "Père de la Blitzkrieg et meilleur général blindé du jeu.": (
        "Father of the Blitzkrieg and the best armor general in the game.",
        "Vater des Blitzkriegs und bester Panzergeneral des Spiels.",
    ),
    "Troisième capitaine de l'Empire du Scorpion.": (
        "Third captain of the Scorpion Empire.",
        "Dritter Hauptmann des Skorpion-Imperiums.",
    ),
}

# ─── runner ─────────────────────────────────────────────────────────────────

def translate(fr: str) -> tuple[str, str] | None:
    m = TEMPLATE_RE.match(fr)
    if m:
        return render_templated(m)
    if fr in FREEFORM:
        return FREEFORM[fr]
    return None

def main() -> int:
    files = sorted(GEN_DIR.glob("*.json"))
    files = [f for f in files if not f.name.startswith("_")]
    updated = 0
    skipped = 0
    missing: list[str] = []
    for fp in files:
        with fp.open("r", encoding="utf-8") as f:
            data = json.load(f)
        fr = data.get("shortDesc")
        if not fr:
            continue
        if data.get("shortDescEn") and data.get("shortDescDe"):
            skipped += 1
            continue
        result = translate(fr)
        if result is None:
            missing.append(f"{fp.name}: {fr}")
            continue
        en, de = result
        data["shortDescEn"] = en
        data["shortDescDe"] = de
        with fp.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        updated += 1
    print(f"Updated {updated} · skipped {skipped} · unmatched {len(missing)}")
    if missing:
        print("\nUNMATCHED:")
        for m in missing:
            print(f"  {m}")
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
