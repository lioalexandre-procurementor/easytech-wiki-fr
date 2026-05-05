#!/usr/bin/env python3
"""
Second-pass FR cleanup for the WC4 skill catalog.

The first translator (`translate-skills-fr.py`) leaves residual English
tokens in many descriptions — words like "when commanding", "with",
"by", "to ignore", "gained", "combat", and so on — producing the
franglais flagged in the 2026-05-06 language audit (Issue B).

This script:
  1. Loads each `data/wc4/skills/*.json`
  2. Re-runs the FR translation against the *English* descriptionTemplate
     using an enriched phrase table (longest-first ordering).
  3. Applies a residual-cleanup pass over both descriptionTemplateFr and
     each progression row's renderedDescFr to mop up tokens the main
     pipeline missed.
  4. Writes back the cleaned strings.

Re-running is idempotent: each pass converges to the same output.
"""
from __future__ import annotations
import json
import re
from pathlib import Path

SKILLS_DIR = Path(__file__).resolve().parent.parent / "data" / "wc4" / "skills"

# ─── PHRASE-LEVEL SUBSTITUTIONS (longest first) ──────────────────────────
# Apply against English source. Patterns are ordered so that longer phrases
# match before shorter generic ones swallow the words.
PHRASES = [
    # ── Long-form skill effect templates ───────────────────────────────
    (r"experience gained by the army in combat increases? by (\d+)%",
     r"l'expérience gagnée par l'armée au combat augmente de \1%"),
    (r"experience gained by the army in combat",
     "l'expérience gagnée par l'armée au combat"),
    (r"when commanding an? aviation units? to attack, there is (?:a )?(\d+)% rate that our inactive units? that are 1 grid around the units? will start an attack",
     r"lorsque vous commandez une unité d'aviation à attaquer, il y a \1% de chance que nos unités inactives à 1 case de l'unité lancent une attaque"),
    (r"when commanding an? aviation units? to attack, there is (?:a )?(\d+)% rate that",
     r"lorsque vous commandez une unité d'aviation à attaquer, il y a \1% de chance que"),
    (r"when commanding an? infantry units? to attack, there is (?:a )?(\d+)% rate that our inactive units? that are 1 grid around the units? will start an attack",
     r"lorsque vous commandez une unité d'infanterie à attaquer, il y a \1% de chance que nos unités inactives à 1 case de l'unité lancent une attaque"),
    (r"there is (?:a )?(\d+)% rate that our inactive units? that are 1 grid around the units? will start an attack",
     r"il y a \1% de chance que nos unités inactives à 1 case de l'unité lancent une attaque"),
    (r"there is (?:a )?(\d+)% rate that",
     r"il y a \1% de chance que"),
    (r"(\d+)% chance to ignore anti-?air weapons? when commanding air force",
     r"\1% de chance d'ignorer les armes anti-aériennes lorsque vous commandez l'aviation"),
    (r"chance to ignore anti-?air weapons?",
     "chance d'ignorer les armes anti-aériennes"),
    (r"deal \+(\d+)% damage to the enemy when commanding artillery units",
     r"inflige +\1% de dégâts à l'ennemi lorsque vous commandez des unités d'artillerie"),
    (r"deal \+(\d+)% damage to the enemy when commanding aviation units",
     r"inflige +\1% de dégâts à l'ennemi lorsque vous commandez des unités d'aviation"),
    (r"deal \+(\d+)% damage to the enemy when commanding infantry units",
     r"inflige +\1% de dégâts à l'ennemi lorsque vous commandez des unités d'infanterie"),
    (r"deal \+(\d+)% damage to the enemy when commanding navy units",
     r"inflige +\1% de dégâts à l'ennemi lorsque vous commandez des unités navales"),
    (r"deal \+(\d+)% damage to the enemy when commanding armored units",
     r"inflige +\1% de dégâts à l'ennemi lorsque vous commandez des unités blindées"),
    (r"deal \+(\d+)% damage to the enemy when commanding tank units",
     r"inflige +\1% de dégâts à l'ennemi lorsque vous commandez des chars"),
    (r"deal \+?(\d+)% damage to the enemy",
     r"inflige +\1% de dégâts à l'ennemi"),
    (r"deal \+?(\d+)% damage",
     r"inflige +\1% de dégâts"),
    (r"\bdamage \+(\d+)% with (\d+)% chance to ignore anti-?air weapons? when commanding air force",
     r"dégâts +\1% avec \2% de chance d'ignorer les armes anti-aériennes lorsque vous commandez l'aviation"),
    (r"\bdamage \+(\d+)%",
     r"dégâts +\1%"),

    # ── Common stems with placeholders ─────────────────────────────────
    (r"when commanding artillery units?", "lorsque vous commandez des unités d'artillerie"),
    (r"when commanding aviation units?", "lorsque vous commandez des unités d'aviation"),
    (r"when commanding infantry units?", "lorsque vous commandez des unités d'infanterie"),
    (r"when commanding navy units?", "lorsque vous commandez des unités navales"),
    (r"when commanding armored units?", "lorsque vous commandez des unités blindées"),
    (r"when commanding tank units?", "lorsque vous commandez des chars"),
    (r"when commanding air force units?", "lorsque vous commandez l'aviation"),
    (r"when commanding airforce units?", "lorsque vous commandez l'aviation"),
    (r"when commanding air units?", "lorsque vous commandez des unités aériennes"),
    (r"when commanding submarine units?", "lorsque vous commandez des sous-marins"),
    (r"when commanding battleship units?", "lorsque vous commandez des cuirassés"),
    (r"when commanding ships?", "lorsque vous commandez des navires"),
    (r"when commanding missiles?", "lorsque vous commandez des missiles"),
    (r"when commanding the (.+?)$", r"lorsque vous commandez \1"),
    (r"when commanding (.+?)$", r"lorsque vous commandez \1"),

    # ── Generic action verbs + objects ─────────────────────────────────
    (r"(\d+)% chance to give the enemy a critical attack",
     r"\1% de chance d'infliger une attaque critique à l'ennemi"),
    (r"(\d+)% chance to give a critical attack to the enemy",
     r"\1% de chance d'infliger une attaque critique à l'ennemi"),
    (r"(\d+)% chance of critical attack",
     r"\1% de chance d'attaque critique"),
    (r"chance to give the enemy a critical attack",
     "chance d'infliger une attaque critique à l'ennemi"),
    (r"\battack range \+(\d+)\b", r"portée d'attaque +\1"),
    (r"\battack range\b", "portée d'attaque"),
    (r"\bare? increased by (\d+)%", r"est augmenté de \1%"),
    (r"\bis increased by (\d+)%", r"est augmenté de \1%"),
    (r"\bincreases? by (\d+)%", r"augmente de \1%"),
    (r"\baugmente by (\d+)%", r"augmente de \1%"),
    (r"\baugmente by\b", "augmente de"),
    (r"\bgained by\b", "gagnée par"),
    (r"\bin combat\b", "au combat"),
    (r"\bafter eliminating (.+?)\b", r"après avoir éliminé \1"),
    (r"\beliminating\b", "éliminer"),

    # ── Connectors and short tokens (run after long phrases) ───────────
    (r"\bwith (\d+)% chance\b", r"avec \1% de chance"),
    (r"\bwith stealth aircraft\b", "avec les avions furtifs"),
    (r"\bstealth aircraft\b", "avions furtifs"),
    (r"\b\(?excluding nuclear submarines\)?", "(hors sous-marins nucléaires)"),
    (r"\bnuclear submarines?\b", "sous-marins nucléaires"),
    (r"\bif the general has this skill, the effects?",
     "si le général possède cette compétence, les effets"),
    (r"\bif the general has this skill\b",
     "si le général possède cette compétence"),

    # ── Bare connectors (always last) ──────────────────────────────────
    (r"\band\b", "et"),
    (r"\bwith\b", "avec"),
    (r"\bto\b", "à"),
    (r"\bby\b", "de"),
    (r"\bof\b", "de"),
    (r"\bin\b", "dans"),
    (r"\bon\b", "sur"),
    (r"\bfor\b", "pour"),
    (r"\bwhen\b", "lorsque"),
    (r"\bwhile\b", "tant que"),
    (r"\bafter\b", "après"),
    (r"\bbefore\b", "avant"),
    (r"\bfrom\b", "de"),
    (r"\beach\b", "chaque"),
    (r"\bevery\b", "chaque"),
    (r"\bonly\b", "seulement"),
    (r"\bnot\b", "pas"),
    (r"\bgain\b", "gagne"),
    (r"\bgains\b", "gagne"),
    (r"\bgained\b", "gagné"),

    # ── Singletons that appear in the franglais corpus ────────────────
    (r"\bcombat\b", "combat"),
    (r"\binactive\b", "inactives"),
    (r"\brate\b", "taux"),
    (r"\bgrid\b", "case"),
    (r"\baround\b", "autour"),
    (r"\bstart\b", "lancer"),
    (r"\bweapons?\b", "armes"),
    (r"\banti-?air\b", "anti-aérien"),
    (r"\bsubmarines?\b", "sous-marins"),
    (r"\bbattleships?\b", "cuirassés"),
    (r"\baircrafts?\b", "avions"),
    (r"\bships?\b", "navires"),

    # ── Verb forms that the first-pass missed ─────────────────────────
    (r"\bcommanding\b", "commandant"),
    (r"\battacking\b", "attaquant"),
    (r"\bdealing\b", "infligeant"),
    (r"\beliminating\b", "éliminant"),
    (r"\bincreasing\b", "augmentant"),
    (r"\breducing\b", "réduisant"),
    (r"\bignoring\b", "ignorant"),
    (r"\battacks?\b", "attaque"),
    (r"\bdeals?\b", "inflige"),
    (r"\bdeal\b", "inflige"),
    (r"\bignores?\b", "ignore"),
    (r"\bincrease(?:s|d)?\b", "augmente"),
    (r"\breduce(?:s|d)?\b", "réduit"),
    (r"\busing\b", "utilisant"),

    # ── Domain word-level (post-phrase) ───────────────────────────────
    (r"\bunder command\b", "sous votre commandement"),
    (r"\bunder attack\b", "attaqué"),
    (r"\bdamage\b", "dégâts"),
    (r"\bdefense\b", "défense"),
    (r"\bdefences?\b", "défense"),
    (r"\bunits?\b", "unités"),
    (r"\benemy\b", "ennemi"),
    (r"\benemies\b", "ennemis"),
    (r"\bthe enemy\b", "l'ennemi"),
    (r"\bour\b", "nos"),
    (r"\barmy\b", "armée"),
    (r"\barmies\b", "armées"),
    (r"\bair force\b", "l'aviation"),
    (r"\bairforce\b", "l'aviation"),
    (r"\bairforces?\b", "l'aviation"),
    (r"\bair\b", "aérien"),
    (r"\bnavy\b", "marine"),
    (r"\binfantry\b", "infanterie"),
    (r"\bartillery\b", "artillerie"),
    (r"\barmored?\b", "blindé"),
    (r"\btanks?\b", "char"),
    (r"\bmissiles?\b", "missile"),
    (r"\bairborne\b", "aéroportées"),
    (r"\btroops?\b", "troupes"),
    (r"\bexcept\b", "sauf"),
    (r"\bconsumption\b", "consommation"),
    (r"\bechelon(ed)?\b", "en échelon"),
    (r"\boffensive\b", "offensive"),
    (r"\baircraft carriers?\b", "porte-avions"),
    (r"\bcarriers?\b", "porte-avions"),
    (r"\bbattleships?\b", "cuirassés"),
    (r"\bsubmarines?\b", "sous-marins"),
    (r"\bnuclear\b", "nucléaire"),
    (r"\beffective\b", "effectif"),
    (r"\beffects?\b", "effets"),
    (r"\bskill\b", "compétence"),
    (r"\bskills\b", "compétences"),
    (r"\bgeneral\b", "général"),
    (r"\bgenerals\b", "généraux"),
    (r"\blevel\b", "niveau"),
    (r"\blevels\b", "niveaux"),
    (r"\bturn\b", "tour"),
    (r"\bturns\b", "tours"),
    (r"\brange\b", "portée"),
    (r"\bspeed\b", "vitesse"),
    (r"\bdodge\b", "esquive"),
    (r"\bcritical\b", "critique"),
    (r"\bchance\b", "chance"),
    (r"\bchances?\b", "chances"),
    (r"\bcommand\b", "commandement"),
    (r"\battack\b", "attaque"),
    (r"\battacks\b", "attaques"),
    (r"\bcombat\b", "combat"),
    (r"\bweapons?\b", "armes"),

    # ── Articles, prepositions, connectors (last) ─────────────────────
    (r"\bthere is\b", "il y a"),
    (r"\bthere are\b", "il y a"),
    (r"\ba (\d+)% rate\b", r"\1% de chance"),
    (r"\ba rate\b", "un taux"),
    (r"\bthat are\b", "qui sont"),
    (r"\bthat will\b", "qui"),
    (r"\bthat\b", "que"),
    (r"\bwill start an attack\b", "déclenchent une attaque"),
    (r"\bstart an attack\b", "déclenchent une attaque"),
    (r"\bwill\b", ""),
    (r"\baround the enemy unit\b", "autour de l'unité ennemie"),
    (r"\baround the unit\b", "autour de l'unité"),
    (r"\baround\b", "autour"),
    (r"\bgrid\b", "case"),
    (r"\bstart\b", "déclencher"),
    (r"\binactives?\b", "inactives"),
    (r"\b(?:to|à)\s+the\s+enemy\b", "à l'ennemi"),
    (r"\bthe\s+enemy\b", "l'ennemi"),
    (r"\btheir\b", "leur"),
    (r"\bbe\b", "être"),
    (r"\bis\b", "est"),
    (r"\bare\b", "sont"),
    (r"\bunder\b", "sous"),
    (r"\b\(\(", "("),
    (r"^\s*\(", "("),

    # Articles — keep these conservative, only when followed by lower-case
    # English noun fragments still present (they then map cleanly).
    (r"\bthe (\d+)\b", r"les \1"),
    (r"\b\(an?\) ", "une "),
    (r"\ban (\w)", r"une \1"),
    (r"\ba +", "un "),
    (r"\bof a\b", "d'une"),
    (r"\bof an?\b", "d'une"),
    (r"\bof the\b", "de la"),
    (r"\bin the\b", "dans la"),
    (r"\bon the\b", "sur la"),
    (r"\bfor the\b", "pour la"),
    (r"\bto the\b", "à la"),
    (r"\bat the\b", "à la"),
    (r"\bthe\b", "la"),

    # Final residual cleanups — common English connectors that survived
    (r"\bil y un (\d+)\b", r"il y a \1"),
    (r"\bil y un\b", "il y a"),
    (r"\bil y a un un\b", "il y a un"),
    (r"\bil y a (\d+)% chances?\b", r"il y a \1% de chance"),
    (r"\bla l'aviation\b", "l'aviation"),
    (r"\bune l'aviation\b", "l'aviation"),
    (r"\bla ennemi\b", "l'ennemi"),
    (r"\bla unité\b", "l'unité"),
    (r"\bla unités\b", "les unités"),
    (r"\bla armée\b", "l'armée"),
    (r"\bla aviation\b", "l'aviation"),
    (r"\bà la attaque\b", "à l'attaque"),
    (r"\bla attaque\b", "l'attaque"),
    (r"\ble ennemi\b", "l'ennemi"),
    (r"\ble unité\b", "l'unité"),
    (r"\bune ennemi\b", "un ennemi"),
    (r"\bdes la\b", "de la"),
    (r"\bup to (\d+)\b", r"jusqu'à \1"),
    (r"\bup to\b", "jusqu'à"),
    (r"\bsimultaneously\b", "simultanément"),
    (r"\busing\b", "utilisant"),
    (r"\bbe\b", "être"),
    (r"\band\b", "et"),
    (r"\bup to\b", "jusqu'à"),
    (r"\bjoin\b", "rejoindre"),
    (r"\bparticipate\b", "participer"),
    (r"\bparticipating\b", "participant"),
    (r"\bcan\b", "peut"),
    (r"\bmay\b", "peut"),
    (r"\bbut\b", "mais"),
    (r"\bif\b", "si"),
    (r"\bnot\b", "pas"),
    (r"\bnone\b", "aucun"),
    (r"\ball\b", "tous"),
    (r"\bevery\b", "chaque"),
    (r"\bonly\b", "seulement"),
    (r"\bagain\b", "à nouveau"),
    (r"\bduring\b", "pendant"),
    (r"\b\(\(", "("),
    (r" {2,}", " "),
]


def translate_en_to_fr(text: str) -> str:
    if not text:
        return text
    out = text
    for pat, rep in PHRASES:
        out = re.sub(pat, rep, out, flags=re.IGNORECASE)
    # Sentence-initial uppercase
    parts = re.split(r"(?<=[.!?])\s+", out)
    parts = [p[:1].upper() + p[1:] if p else p for p in parts]
    return " ".join(parts).strip()


def patch_skill(path: Path) -> bool:
    data = json.load(open(path))
    changed = False

    en_tpl = data.get("descriptionTemplate", "")
    if en_tpl:
        new_fr = translate_en_to_fr(en_tpl)
        if data.get("descriptionTemplateFr") != new_fr:
            data["descriptionTemplateFr"] = new_fr
            changed = True

    for entry in data.get("progression", []):
        en = entry.get("renderedDesc", "")
        if not en:
            continue
        new_fr = translate_en_to_fr(en)
        if entry.get("renderedDescFr") != new_fr:
            entry["renderedDescFr"] = new_fr
            changed = True

    if changed:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return changed


def patch_index() -> bool:
    idx_path = SKILLS_DIR / "_index.json"
    idx = json.load(open(idx_path))
    changed = False
    for item in idx.get("skills", []):
        short = item.get("shortDesc", "")
        if not short:
            continue
        new_fr = translate_en_to_fr(short)
        if item.get("shortDescFr") != new_fr:
            item["shortDescFr"] = new_fr
            changed = True
    if changed:
        idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=2) + "\n")
    return changed


def main():
    files = sorted(SKILLS_DIR.glob("*.json"))
    patched = 0
    for f in files:
        if f.name.startswith("_"):
            continue
        if patch_skill(f):
            patched += 1
    idx_changed = patch_index()
    print(f"Patched {patched} / {len(files) - 1} skills")
    if idx_changed:
        print("Index (_index.json) updated")


if __name__ == "__main__":
    main()
