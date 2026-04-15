#!/usr/bin/env python3
"""
First-pass EN → FR translator for the skill catalog.

Adds `nameFr`, `descriptionTemplateFr`, and per-progression `renderedDescFr`
fields to every `data/wc4/skills/*.json`. Also writes a French `name` and
`seriesLabel` into `_index.json` via a parallel `nameFr` field.

Approach
--------
WC4 skill text is heavily formulaic — the vocabulary is a closed set of
~100 gaming terms and ~30 sentence stems. We define ordered phrase-level
substitutions (longest-first to avoid partial overlaps) and apply them to
every description. Anything not covered by the dictionary falls back to
the English text — the UI can then gracefully degrade.

This produces a usable baseline without an external LLM or API. Manual
refinement can be layered on top by editing the generated `*Fr` fields.

Run:
  python3 scripts/translate-skills-fr.py
"""
from __future__ import annotations
import json
import re
from pathlib import Path

SKILLS_DIR = Path(__file__).resolve().parent.parent / "data" / "wc4" / "skills"

# ─── Skill name dictionary (EN → FR) ────────────────────────────────────────
# Hand-curated for every skill in the catalog. Anything missing falls back
# to the English name.
NAME_FR: dict[str, str] = {
    # Common catalog
    "Accuracy": "Précision",
    "Ace Forces": "Forces d'élite",
    "Ace Pilot": "As du ciel",
    "Ace Sniper": "Tireur d'élite",
    "Ace Submarine": "As des sous-marins",
    "Ace Tank": "As des blindés",
    "Air Raid Cover": "Couverture anti-aérienne",
    "Air Superiority": "Supériorité aérienne",
    "Air Tactics Master": "Maître des tactiques aériennes",
    "Airforce Leader": "Commandant de l'armée de l'air",
    "Amphibious Warfare": "Guerre amphibie",
    "Anticipation": "Anticipation",
    "Architecture": "Architecture",
    "Armed Neutrality": "Neutralité armée",
    "Armored Army Group": "Groupe d'armées blindées",
    "Armored Assault": "Assaut blindé",
    "Armored Tactic Expert": "Expert en tactique blindée",
    "Artillery Armor": "Blindage d'artillerie",
    "Artillery Barrage": "Barrage d'artillerie",
    "Artillery Leader": "Commandant d'artillerie",
    "Artillery Master": "Maître artilleur",
    "Artillery Support": "Soutien d'artillerie",
    "Assault": "Assaut",
    "Aura of Leadership": "Aura de commandement",
    "Barrage": "Barrage",
    "Battle Inspiration": "Inspiration de combat",
    "Battleship Commander": "Commandant de cuirassé",
    "Behemoth": "Béhémoth",
    "Blitz": "Blitz",
    "Blitzkrieg": "Guerre éclair",
    "Blockade": "Blocus",
    "Blood Dance": "Danse du sang",
    "Bombardment": "Bombardement",
    "Bomber Pilot": "Pilote de bombardier",
    "Breach": "Brèche",
    "Burning Hell": "Enfer brûlant",
    "Camouflage": "Camouflage",
    "Carpet Bombing": "Bombardement en tapis",
    "Charge": "Charge",
    "Chariot": "Char",
    "Close Support": "Appui rapproché",
    "Cohesion": "Cohésion",
    "Cold-Blooded": "Sang-froid",
    "Combat Genius": "Génie du combat",
    "Commander": "Commandant",
    "Concentration": "Concentration",
    "Counter-Offensive": "Contre-offensive",
    "Cover Fire": "Tir de couverture",
    "Deep Blue Resolve": "Résolution de l'abysse",
    "Defender": "Défenseur",
    "Demolitionist": "Démolisseur",
    "Determination": "Détermination",
    "Diplomacy": "Diplomatie",
    "Economy": "Économie",
    "Elite Commander": "Commandant d'élite",
    "Energetic": "Énergique",
    "Entrench": "Retranchement",
    "Escape": "Évasion",
    "Exploration": "Exploration",
    "Fearless": "Intrépide",
    "Field Doctor": "Médecin de campagne",
    "First Strike": "Premier coup",
    "Flanking": "Débordement",
    "Fleet Leader": "Commandant de flotte",
    "Fluke": "Coup du sort",
    "Flying Ace": "As de l'aviation",
    "Focus Fire": "Tir concentré",
    "Fortification": "Fortification",
    "Forward": "En avant",
    "Frenzy": "Frénésie",
    "Fury": "Furie",
    "Great Commander": "Grand commandant",
    "Ground Assault": "Assaut terrestre",
    "Ground Fighting": "Combat au sol",
    "Guardian": "Gardien",
    "Heavy Armor": "Blindage lourd",
    "Heroic Charge": "Charge héroïque",
    "Hero": "Héros",
    "Hit and Run": "Attaque-éclair",
    "Hunter": "Chasseur",
    "Industrial Expert": "Expert industriel",
    "Industrial Strength": "Puissance industrielle",
    "Infantry Leader": "Commandant d'infanterie",
    "Inferior Victory": "Victoire du faible",
    "Inspiration": "Inspiration",
    "Iron Wall": "Mur de fer",
    "Knight of the Sea": "Chevalier des mers",
    "Landing Operation": "Opération de débarquement",
    "Leader of Men": "Meneur d'hommes",
    "Logistics": "Logistique",
    "Long Range": "Longue portée",
    "Lurk": "Embuscade",
    "Marching": "Marche forcée",
    "Marine Corps": "Corps des Marines",
    "Marksman": "Tireur d'élite",
    "Mechanized": "Mécanisé",
    "Medical Expert": "Expert médical",
    "Mobility": "Mobilité",
    "Morale": "Morale",
    "Mountain Combat": "Combat en montagne",
    "Naval Expert": "Expert naval",
    "Night Fighter": "Combattant nocturne",
    "Offensive": "Offensive",
    "Outflank": "Encerclement",
    "Paratrooper": "Parachutiste",
    "Panzer Leader": "Commandant Panzer",
    "Patriotism": "Patriotisme",
    "Precision Strike": "Frappe de précision",
    "Raid": "Raid",
    "Rally": "Ralliement",
    "Reaping": "Moisson",
    "Reconnaissance": "Reconnaissance",
    "Reinforcement": "Renfort",
    "Rival Contest": "Duel de rivaux",
    "Rockets": "Roquettes",
    "Rumor": "Rumeur",
    "Sailor": "Marin",
    "Scout": "Éclaireur",
    "Sea Dog": "Loup de mer",
    "Sea Wolf": "Loup de mer",
    "Shelter": "Abri",
    "Shield": "Bouclier",
    "Siege": "Siège",
    "Signal Corps": "Corps des transmissions",
    "Sky Marshal": "Maréchal du ciel",
    "Smoke Screen": "Écran de fumée",
    "Sniper": "Sniper",
    "Spy": "Espion",
    "Steel Wall": "Mur d'acier",
    "Storm Assault": "Assaut tempête",
    "Street Fighting": "Combat urbain",
    "Supply": "Ravitaillement",
    "Support": "Soutien",
    "Swift Attack": "Attaque rapide",
    "Tactic": "Tactique",
    "Tank Buster": "Tueur de chars",
    "Tide of Iron": "Marée de fer",
    "Trench Master": "Maître des tranchées",
    "Unbreakable": "Incassable",
    "Unyielding": "Inflexible",
    "Vanguard": "Avant-garde",
    "Veteran": "Vétéran",
    "Vigilance": "Vigilance",
    "Warlord": "Seigneur de guerre",
    "Warrior": "Guerrier",
    "Wipe Out The North": "Anéantir le Nord",
}

# ─── Phrase-level EN → FR substitutions (ordered, longest first) ────────────
# These are applied IN ORDER so that longer phrases win over shorter ones
# contained within them. Every entry is a (en_regex, fr_replacement) pair.
# Uses case-insensitive matching but preserves the original casing of the
# replacement text (always lowercase except where marked).
PHRASE_SUBSTITUTIONS: list[tuple[str, str]] = [
    # ── Ultra-long stems (must win over every partial below) ───────────────
    (r"increasing the chance of critical attack by (\d+)% for 1 turn",
     r"augmentant la chance d'attaque critique de \1% pendant 1 tour"),
    (r"increasing the chance of critical attack by (\d+)%",
     r"augmentant la chance d'attaque critique de \1%"),
    (r"morale of armored units under command will not diminish",
     "la morale des unités blindées sous votre commandement ne diminue pas"),
    (r"morale of infantry units under command will not diminish",
     "la morale des unités d'infanterie sous votre commandement ne diminue pas"),
    (r"morale of artillery units under command will not diminish",
     "la morale des unités d'artillerie sous votre commandement ne diminue pas"),
    (r"morale of air force units under command will not diminish",
     "la morale des unités aériennes sous votre commandement ne diminue pas"),
    (r"morale of naval units under command will not diminish",
     "la morale des unités navales sous votre commandement ne diminue pas"),
    (r"after commanding an armored unit to annihilate an enemy",
     "après avoir ordonné à une unité blindée d'anéantir un ennemi"),
    (r"after commanding an infantry unit to annihilate an enemy",
     "après avoir ordonné à une unité d'infanterie d'anéantir un ennemi"),
    (r"after commanding an artillery unit to annihilate an enemy",
     "après avoir ordonné à une unité d'artillerie d'anéantir un ennemi"),
    (r"after commanding a naval unit to annihilate an enemy",
     "après avoir ordonné à une unité navale d'anéantir un ennemi"),
    (r"after commanding an air force unit to annihilate an enemy",
     "après avoir ordonné à une unité aérienne d'anéantir un ennemi"),

    # Long sentence stems — must come first so we don't fragment them.
    (r"when commanding armored units", "lorsque vous commandez des unités blindées"),
    (r"when commanding ship units", "lorsque vous commandez des unités navales"),
    (r"when commanding naval units", "lorsque vous commandez des unités navales"),
    (r"when commanding artillery units", "lorsque vous commandez des unités d'artillerie"),
    (r"when commanding air force units", "lorsque vous commandez des unités aériennes"),
    (r"when commanding airforce units", "lorsque vous commandez des unités aériennes"),
    (r"when commanding infantry units", "lorsque vous commandez des unités d'infanterie"),
    (r"when commanding missile units", "lorsque vous commandez des unités de missiles"),

    (r"chance to give the enemy a critical attack", "chance d'infliger une attaque critique à l'ennemi"),
    (r"chance of critical attack", "chance d'attaque critique"),
    (r"critical attack chance", "chance d'attaque critique"),
    (r"critical hit chance", "chance de coup critique"),
    (r"able to dodge (\d+)% damage from the enemy's missile units", r"peut esquiver \1% des dégâts des unités missiles ennemies"),
    (r"able to dodge (\d+)% damage", r"peut esquiver \1% des dégâts"),
    (r"damage to the enemy \+(\d+)", r"dégâts infligés +\1"),
    (r"damage to enemy \+(\d+)", r"dégâts infligés à l'ennemi +\1"),
    (r"damage dealt \+(\d+)%?", r"dégâts infligés +\1%"),
    (r"deal \+(\d+)% damage", r"inflige +\1% de dégâts"),
    (r"deals? \+(\d+)% damage", r"inflige +\1% de dégâts"),
    (r"dealt damage \+(\d+)%?", r"dégâts infligés +\1%"),
    (r"increase damage by (\d+)%", r"augmente les dégâts de \1%"),
    (r"increases? damage dealt by (\d+)%", r"augmente les dégâts infligés de \1%"),
    (r"increases? damage by (\d+)%", r"augmente les dégâts de \1%"),
    (r"reduce damage taken by (\d+)%", r"réduit les dégâts subis de \1%"),
    (r"lower damage received by (\d+)%", r"réduit les dégâts reçus de \1%"),
    (r"reduce the damage received by (\d+)%", r"réduit les dégâts reçus de \1%"),

    (r"morale will not diminish", "la morale ne diminue pas"),
    (r"morale of .* will not diminish", "la morale ne diminue pas"),
    (r"its morale cannot diminish", "sa morale ne peut pas diminuer"),

    (r"more than half damaged", "endommagée à plus de moitié"),
    (r"are more than half damaged", "sont endommagées à plus de moitié"),

    (r"non-building units other than city garrisons", "unités non-bâtiment hors garnisons de ville"),
    (r"for 1 turn", "pendant 1 tour"),
    (r"for (\d+) turns?", r"pendant \1 tours"),
    (r"per turn", "par tour"),
    (r"each turn", "chaque tour"),
    (r"once per turn", "une fois par tour"),
    (r"this turn", "ce tour-ci"),

    (r"when attacking", "lors d'une attaque"),
    (r"when attacked", "lorsqu'elle est attaquée"),
    (r"after attacking", "après avoir attaqué"),
    (r"after each attack", "après chaque attaque"),
    (r"after an attack", "après une attaque"),
    (r"after eliminating an enemy", "après avoir éliminé un ennemi"),
    (r"after annihilating an enemy", "après avoir anéanti un ennemi"),
    (r"when .* annihilate an enemy", "après avoir anéanti un ennemi"),
    (r"after commanding .*? to annihilate an enemy", "après avoir anéanti un ennemi sous son commandement"),
    (r"to boost morale after attacking", "d'augmenter le moral après une attaque"),
    (r"to boost morale", "d'augmenter le moral"),
    (r"when morale is high", "lorsque le moral est élevé"),
    (r"if you are unable to attack or move after attacking", "si vous ne pouvez ni attaquer ni bouger après avoir attaqué"),
    (r"you have a (\d+)% chance to attack again", r"vous avez \1% de chance d'attaquer à nouveau"),
    (r"only once per turn", "seulement une fois par tour"),
    (r"each kill this turn", "chaque élimination ce tour-ci"),
    (r"upgrading the effect to an extra action", "améliorant l'effet en action supplémentaire"),
    (r"upgrading the effect", "améliorant l'effet"),
    (r"effect to an extra action", "effet en action supplémentaire"),
    (r"this chance by (\d+)%", r"cette chance de \1%"),
    (r"increasing the chance of critical attack by (\d+)%", r"augmentant la chance d'attaque critique de \1%"),
    (r"increasing the chance of .* by (\d+)%", r"augmentant la chance de \1%"),
    (r"gain the \"([^\"]+)\" status", r"gagne le statut « \1 »"),
    (r"gain \"([^\"]+)\" status", r"gagne le statut « \1 »"),
    (r"gains? the \"([^\"]+)\" effect", r"gagne l'effet « \1 »"),

    # Extra stems seen in the corpus.
    (r"damage is increased by (\d+)%", r"les dégâts sont augmentés de \1%"),
    (r"damage is reduced by (\d+)%", r"les dégâts sont réduits de \1%"),
    (r"damage by (\d+)%", r"les dégâts de \1%"),
    (r"restores? hp equal to (\d+)% of the damage dealt", r"restaure des PV équivalents à \1% des dégâts infligés"),
    (r"restores hp", "restaure des PV"),
    (r"while any buff is active", "tant qu'un bonus est actif"),
    (r"while.* buff.* active", "tant qu'un bonus est actif"),
    (r"ignores enemy (\d+)% defense", r"ignore \1% de la défense ennemie"),
    (r"ignores (\d+)% of the enemy's defense", r"ignore \1% de la défense de l'ennemi"),
    (r"ignores (\d+)% defense", r"ignore \1% de défense"),
    (r"move unimpeded by enemy blocking", "se déplacer sans être bloqué par l'ennemi"),
    (r"if a target survives an attack", "si une cible survit à une attaque"),
    (r"the unit may make one additional attack", "l'unité peut effectuer une attaque supplémentaire"),
    (r"deal.* damage to.* within (\d+) hexes?", r"inflige des dégâts aux ennemis dans un rayon de \1 hex"),
    (r"for every (\d+) attack", r"tous les \1 points d'attaque"),
    (r"within (\d+) hexes?", r"dans un rayon de \1 hex"),
    (r"at the end of the turn", "à la fin du tour"),
    (r"start of the turn", "au début du tour"),
    (r"on any enemy with less than (\d+) final defense", r"sur tout ennemi ayant moins de \1 en défense finale"),
    (r"nukes are ineffective", "les bombes nucléaires sont inefficaces"),
    (r"except airborne troops", "sauf les troupes aéroportées"),
    (r"missile consumption", "consommation de missiles"),
    (r"reduces air force command", "réduit le coût de commandement aérien"),
    (r"echeloned offensive", "offensive en échelon"),
    (r"after commanding air force and missile attacks", "après avoir ordonné des attaques aériennes et missiles"),
    (r"friendly aircraft carrier", "porte-avions allié"),
    (r"friendly carriers?", "porte-avions allié"),
    (r"if you are unable to attack", "si vous ne pouvez pas attaquer"),
    (r"move after attacking", "bouger après avoir attaqué"),

    # More phrase stems (second pass — common leftovers).
    (r"when the (.+?) are", r"lorsque \1 sont"),
    (r"when using air and missile attacks", "lors d'attaques aériennes ou de missiles"),
    (r"when using (.+?) attacks", r"lors d'attaques \1"),
    (r"will not fight back", "ne ripostera pas"),
    (r"will not counter-?attack", "ne contre-attaquera pas"),
    (r"chance that the enemy", "chance que l'ennemi"),
    (r"chance that an enemy", "chance qu'un ennemi"),
    (r"chance that the (.+?) will", r"chance que \1"),
    (r"each kill (this turn|ce tour-ci)", "chaque élimination ce tour-ci"),
    (r"only once per turn", "seulement une fois par tour"),
    (r"\bor move\b", "ou de bouger"),
    (r"\bor attack\b", "ou d'attaquer"),
    (r"attack or move", "attaquer ou bouger"),
    (r"\bto non-building units\b", "aux unités non-bâtiment"),
    (r"\bto non-building\b", "aux non-bâtiments"),

    # Common prepositions/connectors with clear domain context.
    (r"\bby (\d+)%", r"de \1%"),
    (r"\bby (\d+) ", r"de \1 "),
    (r"\bunder command\b", "sous votre commandement"),
    (r"\bunder your command\b", "sous votre commandement"),
    (r"\bunder his command\b", "sous son commandement"),
    (r"\bunder their command\b", "sous leur commandement"),
    (r"\bunder the command of\b", "sous le commandement de"),
    (r"\bto the enemy\b", "à l'ennemi"),
    (r"\bto enemies\b", "aux ennemis"),
    (r"\bfrom the enemy\b", "de l'ennemi"),
    (r"\bfrom enemies\b", "des ennemis"),
    (r"\bfor all allies\b", "pour tous les alliés"),
    (r"\bfor allies\b", "pour les alliés"),
    (r"\bagainst enemies\b", "contre les ennemis"),
    (r"\bagainst the enemy\b", "contre l'ennemi"),

    (r"\bheroic\b", "héroïque"),
    (r"\bhigh morale\b", "moral élevé"),
    (r"\blow morale\b", "moral bas"),
    (r"\bbuffs?\b", "bonus"),
    (r"\btarget\b", "cible"),

    (r"extra action", "action supplémentaire"),
    (r"additional attack", "attaque supplémentaire"),
    (r"extra attack", "attaque supplémentaire"),

    (r"critical attacks?", "attaques critiques"),
    (r"critical strike", "frappe critique"),

    # Shorter common phrases.
    (r"armored units", "unités blindées"),
    (r"infantry units", "unités d'infanterie"),
    (r"ship units", "unités navales"),
    (r"naval units", "unités navales"),
    (r"artillery units", "unités d'artillerie"),
    (r"air force units", "unités aériennes"),
    (r"airforce units", "unités aériennes"),
    (r"missile units", "unités de missiles"),
    (r"friendly units?", "unités alliées"),
    (r"enemy units?", "unités ennemies"),
    (r"elite forces?", "unités d'élite"),
    (r"enemy elite force", "unité d'élite ennemie"),

    (r"hp ?", "PV "),
    (r"attack range", "portée d'attaque"),
    (r"gain the .*? status", "gagne l'état correspondant"),
    (r"increases? the chance of", "augmente la chance de"),

    # Word-level (applied last as single-word boundaries).
    (r"\bcommand\b", "commandement"),
    (r"\bdamage\b", "dégâts"),
    (r"\battack\b", "attaque"),
    (r"\bdefense\b", "défense"),
    (r"\benemy\b", "ennemi"),
    (r"\benemies\b", "ennemis"),
    (r"\bunit\b", "unité"),
    (r"\bunits\b", "unités"),
    (r"\bchance\b", "chance"),
    (r"\bcritical\b", "critique"),
    (r"\bhit\b", "coup"),
    (r"\barmor\b", "blindage"),
    (r"\bmorale\b", "moral"),
    (r"\bturn\b", "tour"),
    (r"\binfantry\b", "infanterie"),
    (r"\bartillery\b", "artillerie"),
    (r"\bnaval\b", "naval"),
    (r"\bnavy\b", "marine"),
    (r"\bairforce\b", "aviation"),
    (r"\bfriendly\b", "allié"),
    (r"\brange\b", "portée"),
    (r"\bspeed\b", "vitesse"),
    (r"\bdodge\b", "esquive"),
    (r"\bheal\b", "soin"),
    (r"\bhealing\b", "soin"),
    (r"\blevel\b", "niveau"),
    (r"\battacks\b", "attaques"),
    (r"\bincrease\b", "augmenter"),
    (r"\bincreased\b", "augmenté"),
    (r"\bincreases\b", "augmente"),
    (r"\breduce\b", "réduire"),
    (r"\breduced\b", "réduit"),
    (r"\breduces\b", "réduit"),
    (r"\blower\b", "abaisser"),
    (r"\bbuff\b", "bonus"),
    (r"\bdebuff\b", "malus"),
    (r"\bhexes?\b", "hex"),
    (r"\bignore\b", "ignore"),
    (r"\bignores\b", "ignore"),
    (r"\brestore\b", "restaurer"),
    (r"\brestores\b", "restaure"),
]


def translate(text: str) -> str:
    """Apply the ordered phrase substitutions. Case-insensitive input; the
    first letter of the sentence is re-capitalised at the end."""
    if not text:
        return text
    out = text
    for pattern, replacement in PHRASE_SUBSTITUTIONS:
        out = re.sub(pattern, replacement, out, flags=re.IGNORECASE)
    # Light post-processing: keep the `X%` placeholder as-is, and ensure
    # the first character of each sentence is uppercase.
    parts = re.split(r"(?<=[.!?])\s+", out)
    parts = [p[:1].upper() + p[1:] if p else p for p in parts]
    return " ".join(parts).strip()


def translate_name(name: str) -> str:
    """Look up a skill name in the hand-curated dictionary; fall back to
    the phrase translator, then to the English original."""
    if name in NAME_FR:
        return NAME_FR[name]
    # Try title-casing tweaks: "Heroic Charge" → "Heroic Charge" hit by exact.
    return translate(name) if name else name


def patch_skill(path: Path) -> bool:
    data = json.load(open(path))
    changed = False

    name_fr = translate_name(data.get("name", ""))
    if data.get("nameFr") != name_fr:
        data["nameFr"] = name_fr
        changed = True

    tpl_fr = translate(data.get("descriptionTemplate", ""))
    if data.get("descriptionTemplateFr") != tpl_fr:
        data["descriptionTemplateFr"] = tpl_fr
        changed = True

    for entry in data.get("progression", []):
        en = entry.get("renderedDesc", "")
        fr = translate(en)
        if entry.get("renderedDescFr") != fr:
            entry["renderedDescFr"] = fr
            changed = True

    if changed:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return changed


def patch_index() -> bool:
    idx_path = SKILLS_DIR / "_index.json"
    idx = json.load(open(idx_path))
    changed = False
    for item in idx.get("skills", []):
        name_fr = translate_name(item.get("name", ""))
        if item.get("nameFr") != name_fr:
            item["nameFr"] = name_fr
            changed = True
        short = item.get("shortDesc", "")
        short_fr = translate(short)
        if item.get("shortDescFr") != short_fr:
            item["shortDescFr"] = short_fr
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
