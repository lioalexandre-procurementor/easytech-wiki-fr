#!/usr/bin/env python3
"""
Backfill locale-specific `longDescEn` / `longDescDe` on every general.
91/104 entries match the "placeholder stub" template and get
regenerated deterministically; 13 freeform descriptions are covered
by a hand-curated FREEFORM table.
"""

from __future__ import annotations
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GEN_DIR = ROOT / "data" / "wc4" / "generals"

CATEGORY_FR_TO = {
    "artillerie":  {"en": "artillery",  "de": "Artillerie"},
    "blindée":     {"en": "armor",      "de": "Panzer"},
    "blindé":      {"en": "armor",      "de": "Panzer"},
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

TEMPLATE_RE = re.compile(
    r"^(?P<name>.+?)\s+est\s+un\s+général\s+"
    r"(?P<cat>artillerie|blindée|blindé|infanterie|navale|aérienne|polyvalente|polyvalent)\s+"
    r"de\s+qualité\s+"
    r"(?P<quality>bronze|argent|or|maréchal)\s+—\s+"
    r"(?P<country>[^.]+?)\s*\.\s+"
    r"Données extraites du jeu — descriptions et conseils tactiques à confirmer\.\s*$"
)

TAIL_EN = "Data extracted from the game — descriptions and tactical notes to be confirmed."
TAIL_DE = "Daten aus dem Spiel extrahiert — Beschreibungen und taktische Hinweise noch zu bestätigen."


def render_templated(m: re.Match) -> tuple[str, str]:
    name = m.group("name").strip()
    cat = m.group("cat")
    quality = m.group("quality")
    country = m.group("country")
    cat_en = CATEGORY_FR_TO[cat]["en"]
    cat_de = CATEGORY_FR_TO[cat]["de"]
    q_en = QUALITY_FR_TO[quality]["en"]
    q_de = QUALITY_FR_TO[quality]["de"]
    c_en = COUNTRY_FR_TO[country]["en"]
    c_de = COUNTRY_FR_TO[country]["de"]
    en = f"{name} is a {q_en}-quality {cat_en} general — {c_en}. {TAIL_EN}"
    de = f"{name} ist ein {q_de}-{cat_de}-General — {c_de}. {TAIL_DE}"
    return en, de


FREEFORM: dict[str, tuple[str, str]] = {
    "Après entraînement, Rokossovsky est l'un des meilleurs généraux blindés F2P du jeu : la communauté le considère comme le meilleur choix free-to-play, avec la Médaille d'Excellence et la compétence « Anéantir le Nord » après entraînement. Argent (4 emplacements).": (
        "Once trained, Rokossovsky is one of the best F2P armor generals in the game: the community widely considers him the top free-to-play pick, with the Medal of Excellence and the \"Wipe Out The North\" skill unlocked after training. Silver (4 slots).",
        "Nach dem Training ist Rokossowski einer der besten F2P-Panzergeneräle des Spiels: Die Community hält ihn für die beste Free-to-Play-Wahl, mit der Medaille der Exzellenz und der Fähigkeit „Wipe Out The North“ nach Abschluss des Trainings. Silber (4 Slots).",
    ),
    "Colson est le troisième capitaine de l'Empire du Scorpion, aux côtés d'Osborn et Williams. Rôle exact et skills à confirmer in-game — probablement associé aux unités blindées Scorpion. Or (5 emplacements).": (
        "Colson is the third captain of the Scorpion Empire alongside Osborn and Williams. Exact role and skills to be confirmed in-game — likely tied to Scorpion armor units. Gold (5 slots).",
        "Colson ist der dritte Hauptmann des Skorpion-Imperiums neben Osborn und Williams. Genaue Rolle und Fähigkeiten sind im Spiel noch zu bestätigen — vermutlich mit den Skorpion-Panzereinheiten verbunden. Gold (5 Slots).",
    ),
    "Considéré comme le meilleur commandant de World Conqueror 4. Théoricien de la Blitzkrieg, il possède les trois meilleures compétences blindés du jeu. En tant que général Or, il dispose de 5 slots de compétences. À placer sur un King Tiger, IS-3 ou M1A1 Abrams pour un effet maximal.": (
        "Widely regarded as the best commander in World Conqueror 4. The theorist of the Blitzkrieg, he carries the three strongest armor skills in the game. As a Gold general he has 5 skill slots. Put him on a King Tiger, IS-3 or M1A1 Abrams for maximum impact.",
        "Gilt als der beste Kommandant in World Conqueror 4. Als Theoretiker des Blitzkriegs trägt er die drei besten Panzerfähigkeiten des Spiels. Als Gold-General verfügt er über 5 Fähigkeits-Slots. Setze ihn auf einen King Tiger, IS-3 oder M1A1 Abrams für maximale Wirkung.",
    ),
    "Dönitz est « sans aucun doute le meilleur commandant naval » selon les tier lists communautaires. Spécialiste absolu des sous-marins (Type VII, Typhoon). Or (5 emplacements).": (
        "Dönitz is \"without a doubt the best naval commander\" according to community tier lists. An absolute submarine specialist (Type VII, Typhoon). Gold (5 slots).",
        "Dönitz gilt laut Community-Tier-Listen als „zweifellos der beste Marinekommandant“. Absoluter U-Boot-Spezialist (Typ VII, Typhoon). Gold (5 Slots).",
    ),
    "Joukov est un maréchal (IAP, achat réel uniquement) polyvalent de premier rang, au niveau de Konev en appui-feu. Maréchal (5 emplacements).": (
        "Zhukov is a top-tier balanced marshal (IAP, real-money only), on par with Konev for fire support. Marshal (5 slots).",
        "Schukow ist ein erstklassiger ausgewogener Marschall (IAP, nur Echtgeld), auf Augenhöhe mit Konew bei der Feuerunterstützung. Marschall (5 Slots).",
    ),
    "Konev est pour l'artillerie ce que Guderian est pour les chars : la référence S-tier absolue. À pairer avec Schwerer Gustav, Topol-M ou M142 HIMARS pour optimiser les dégâts de frappe. Or (5 emplacements).": (
        "Konev is to artillery what Guderian is to armor: the absolute S-tier benchmark. Pair him with Schwerer Gustav, Topol-M or M142 HIMARS to maximize strike damage. Gold (5 slots).",
        "Konew ist für die Artillerie, was Guderian für Panzer ist: der absolute S-Tier-Maßstab. Kombiniere ihn mit Schwerer Gustav, Topol-M oder M142 HIMARS, um den Schlagschaden zu maximieren. Gold (5 Slots).",
    ),
    "Montgomery est le général britannique qui a mené la Huitième Armée à El Alamein. Dans WC4 c'est un général infanterie/polyvalent A-tier. Argent (4 emplacements, 2 étapes d'entraînement).": (
        "Montgomery is the British general who led the Eighth Army at El Alamein. In WC4 he is an A-tier infantry/balanced general. Silver (4 slots, 2 training stages).",
        "Montgomery ist der britische General, der die Achte Armee bei El Alamein führte. In WC4 ist er ein A-Tier-Infanterie-/Allrounder-General. Silber (4 Slots, 2 Trainingsstufen).",
    ),
    "Osborn est le chef de l'Empire du Scorpion (New World Order). Son identité originelle était Alfred, un général britannique non-recrutable qui apparaît dans la mission Dunkerque de l'événement Origin of the Scorpion Empire. Disponible dans le pack des trois généraux terroristes. Or (5 emplacements).": (
        "Osborn is the leader of the Scorpion Empire (New World Order). His original identity was Alfred, a non-recruitable British general who appears in the Dunkirk mission of the Origin of the Scorpion Empire event. Available in the three-terrorist-generals pack. Gold (5 slots).",
        "Osborn ist der Anführer des Skorpion-Imperiums (New World Order). Seine ursprüngliche Identität war Alfred, ein nicht rekrutierbarer britischer General, der in der Dünkirchen-Mission des Events „Origin of the Scorpion Empire“ auftritt. Erhältlich im Dreier-Pack der Terror-Generäle. Gold (5 Slots).",
    ),
    "Patton est un général blindé top-tier de WC4. Offensive un peu moins pure que Rokossovsky mais bien meilleure survivabilité. Recommandé pour les chars lourds américains (M26 Pershing, M1A1 Abrams). Or, 5 emplacements.": (
        "Patton is a top-tier armor general in WC4. Slightly less pure offensive output than Rokossovsky but much better survivability. Recommended for American heavy tanks (M26 Pershing, M1A1 Abrams). Gold, 5 slots.",
        "Patton ist ein erstklassiger Panzergeneral in WC4. Etwas geringere reine Offensivleistung als Rokossowski, aber deutlich bessere Überlebensfähigkeit. Empfohlen für amerikanische schwere Panzer (M26 Pershing, M1A1 Abrams). Gold, 5 Slots.",
    ),
    "Rommel est un général tank de haute volée. Ses compétences Feu Croisé et Assaut Blindé donnent des dégâts de contre-attaque supplémentaires et des bonus offensifs. Excellent sur Königs Tiger ou M26 Pershing. 5 emplacements de compétences (Or).": (
        "Rommel is a top-flight armor general. His Crossfire and Armored Assault skills grant extra counter-attack damage and offensive bonuses. Excellent on a King Tiger or M26 Pershing. 5 skill slots (Gold).",
        "Rommel ist ein erstklassiger Panzergeneral. Seine Fähigkeiten Kreuzfeuer und Panzerangriff verleihen zusätzlichen Konterschaden und Offensivboni. Hervorragend auf einem Königstiger oder M26 Pershing. 5 Fähigkeits-Slots (Gold).",
    ),
    "Une fois entièrement entraîné, Kouznetsov devient l'un des meilleurs amiraux F2P du jeu, au niveau de Cunningham et meilleur que Yamaguchi/Darlan. Argent (4 emplacements, 2 étapes d'entraînement).": (
        "Once fully trained, Kuznetsov becomes one of the best F2P admirals in the game, on par with Cunningham and better than Yamaguchi/Darlan. Silver (4 slots, 2 training stages).",
        "Voll trainiert wird Kusnezow zu einem der besten F2P-Admirale des Spiels, auf Augenhöhe mit Cunningham und besser als Yamaguchi/Darlan. Silber (4 Slots, 2 Trainingsstufen).",
    ),
    "Williams est l'un des trois capitaines de l'Empire du Scorpion, avec Osborn et Colson. Selon le lore, il a conçu et produit le KS-90, l'artillerie automotrice d'élite mystique. Or (5 emplacements).": (
        "Williams is one of the three captains of the Scorpion Empire, alongside Osborn and Colson. According to the lore, he designed and built the KS-90, the mystic elite self-propelled artillery. Gold (5 slots).",
        "Williams ist einer der drei Hauptmänner des Skorpion-Imperiums, neben Osborn und Colson. Der Lore zufolge entwarf und produzierte er den KS-90, die mystische Elite-Selbstfahrlafette. Gold (5 Slots).",
    ),
    "Yamaguchi est l'un des meilleurs amiraux du jeu et fonctionne également très bien comme général aviation (double usage). Or (5 emplacements).": (
        "Yamaguchi is one of the best admirals in the game and also works very well as an air force general (dual-purpose). Gold (5 slots).",
        "Yamaguchi ist einer der besten Admirale des Spiels und funktioniert auch als Luftwaffengeneral sehr gut (Doppelrolle). Gold (5 Slots).",
    ),
}


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
        fr = data.get("longDesc")
        if not fr:
            continue
        if data.get("longDescEn") and data.get("longDescDe"):
            skipped += 1
            continue
        result = translate(fr)
        if result is None:
            missing.append(f"{fp.name}: {fr[:80]}...")
            continue
        en, de = result
        data["longDescEn"] = en
        data["longDescDe"] = de
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
