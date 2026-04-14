#!/usr/bin/env python3
"""Génère les fiches généraux WC4 : top-tier standard + capitaines Scorpion."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "wc4" / "generals"
OUT.mkdir(parents=True, exist_ok=True)

SOURCES = [
    "https://world-conqueror-4.fandom.com/wiki/Generals",
    "https://european-war-4.boards.net/thread/12989/all-generals-ranked-wc4",
]

# Sélection top-tier (pas exhaustif — ~12 généraux mentionnés dans les recherches publiques)
# Chaque entrée : slug, name, faction, category, rank, country, countryName, shortDesc, skills, bonuses
STANDARD_GENERALS = [
    {
        "slug": "guderian", "name": "Heinz Guderian", "faction": "standard",
        "category": "tank", "rank": "S", "country": "DE", "countryName": "Allemagne",
        "obtainability": "shop",
        "shortDesc": "Père de la Blitzkrieg et meilleur général blindé du jeu.",
        "longDesc": "Considéré comme le meilleur commandant de World Conqueror 4. Théoricien de la Blitzkrieg, il possède les trois meilleurs skills blindés du jeu ainsi que les compétences Machiniste et Rumeur. À placer sur un King Tiger, IS-3 ou M1A1 Abrams pour un effet maximal.",
        "skills": [
            {"name": "Blitzkrieg", "desc": "Attaques de char +25%, mouvement amélioré."},
            {"name": "Commandant blindé", "desc": "Bonus d'attaque et de défense sur tous les chars adjacents."},
            {"name": "Machiniste (entraîné)", "desc": "Unité mécanisée : réparation accélérée."},
        ],
        "bonuses": [{"target": "Attaque char", "value": "+30%"}, {"target": "Défense char", "value": "+20%"}],
        "recommendedUnits": ["konigs-tiger", "is-3", "m1a1-abrams", "leopard-2"],
    },
    {
        "slug": "rommel", "name": "Erwin Rommel", "faction": "standard",
        "category": "tank", "rank": "S", "country": "DE", "countryName": "Allemagne",
        "obtainability": "shop",
        "shortDesc": "Le Renard du Désert — général blindé offensif-défensif.",
        "longDesc": "Rommel est un général tank de haute volée. Ses skills Feu Croisé (Crossfire) et Assaut Blindé (Armoured Assault) donnent des dégâts de contre-attaque supplémentaires et des bonus offensifs généraux. Excellent sur Königs Tiger ou M26 Pershing.",
        "skills": [
            {"name": "Feu Croisé", "desc": "Dégâts supplémentaires en contre-attaque quand attaqué."},
            {"name": "Assaut Blindé", "desc": "Dégâts +15% pour toutes les attaques blindées."},
        ],
        "bonuses": [{"target": "Attaque char", "value": "+25%"}, {"target": "Contre-attaque", "value": "+30%"}],
        "recommendedUnits": ["konigs-tiger", "m26-pershing", "centurion"],
    },
    {
        "slug": "patton", "name": "George Patton", "faction": "standard",
        "category": "tank", "rank": "S", "country": "US", "countryName": "États-Unis",
        "obtainability": "shop",
        "shortDesc": "Général blindé américain agressif, tier S avec survivabilité.",
        "longDesc": "Patton est un général blindé top-tier de WC4. Offensive un peu moins pure que Rokossovsky mais bien meilleure survivabilité. Recommandé pour les chars lourds américains (M26 Pershing, M1A1 Abrams).",
        "skills": [
            {"name": "Old Blood and Guts", "desc": "Bonus d'attaque permanent sur chars US."},
            {"name": "Third Army", "desc": "Vitesse de déplacement améliorée."},
        ],
        "bonuses": [{"target": "Attaque char", "value": "+20%"}, {"target": "HP char", "value": "+25%"}],
        "recommendedUnits": ["m26-pershing", "m1a1-abrams"],
    },
    {
        "slug": "rokossovsky", "name": "Konstantin Rokossovsky", "faction": "standard",
        "category": "tank", "rank": "S", "country": "RU", "countryName": "URSS",
        "obtainability": "shop",
        "shortDesc": "Général blindé soviétique — meilleures capacités offensives après entraînement.",
        "longDesc": "Après entraînement, Rokossovsky est l'un des meilleurs généraux blindés du jeu, avec une puissance offensive supérieure à Patton. À prioriser pour les chars soviétiques (IS-3, T-72). À entraîner avant Patton.",
        "skills": [
            {"name": "Opération Bagration", "desc": "Bonus offensif massif sur secteur attaqué."},
            {"name": "Commandement ferme", "desc": "Réduit les pertes alliées adjacentes."},
        ],
        "bonuses": [{"target": "Attaque char", "value": "+30%"}, {"target": "Défense char", "value": "+15%"}],
        "recommendedUnits": ["is-3", "t-72", "t-44"],
    },
    {
        "slug": "konev", "name": "Ivan Konev", "faction": "standard",
        "category": "artillery", "rank": "S", "country": "RU", "countryName": "URSS",
        "obtainability": "shop",
        "shortDesc": "Meilleur général d'artillerie — l'équivalent de Guderian pour l'artillerie.",
        "longDesc": "Konev est pour l'artillerie ce que Guderian est pour les chars : la référence S-tier absolue. À pairer avec Schwerer Gustav, Topol-M ou M142 HIMARS pour optimiser les dégâts de frappe.",
        "skills": [
            {"name": "Maître canonnier", "desc": "+30% dégâts artillerie."},
            {"name": "Tir de barrage", "desc": "+1 portée pour toute artillerie commandée."},
        ],
        "bonuses": [{"target": "Attaque artillerie", "value": "+30%"}, {"target": "Portée", "value": "+1"}],
        "recommendedUnits": ["schwerer-gustav", "topol-m", "m142-himars"],
    },
    {
        "slug": "zhukov", "name": "Gueorgui Joukov", "faction": "standard",
        "category": "balanced", "rank": "S", "country": "RU", "countryName": "URSS",
        "obtainability": "shop",
        "shortDesc": "Général polyvalent au niveau de Konev en artillerie.",
        "longDesc": "Joukov est un général d'artillerie/polyvalent de premier rang, au niveau de Konev en appui-feu. Option alternative pour les joueurs qui veulent flexibilité sur plusieurs types d'unités.",
        "skills": [
            {"name": "Défense de Moscou", "desc": "Bonus défensif global sur secteur."},
            {"name": "Rouleau compresseur", "desc": "Attaques massives coordonnées."},
        ],
        "bonuses": [{"target": "Attaque artillerie", "value": "+25%"}, {"target": "Défense globale", "value": "+15%"}],
        "recommendedUnits": ["bm-21-grad", "b-4-howitzer", "topol-m"],
    },
    {
        "slug": "donitz", "name": "Karl Dönitz", "faction": "standard",
        "category": "navy", "rank": "S", "country": "DE", "countryName": "Allemagne",
        "obtainability": "shop",
        "shortDesc": "Meilleur amiral de WC4 — spécialiste des sous-marins.",
        "longDesc": "Dönitz est « sans aucun doute le meilleur commandant naval » selon les tier lists communautaires. Spécialiste absolu des sous-marins (Type VII, Typhoon), il maximise les dégâts de torpille et la furtivité.",
        "skills": [
            {"name": "Meute de loups", "desc": "Sous-marins : attaque coordonnée +40%."},
            {"name": "Guerre sous-marine", "desc": "Furtivité améliorée."},
        ],
        "bonuses": [{"target": "Attaque sous-marin", "value": "+40%"}, {"target": "Furtivité", "value": "+25%"}],
        "recommendedUnits": ["type-vii-uboat", "typhoon-submarine"],
    },
    {
        "slug": "yamaguchi", "name": "Tamon Yamaguchi", "faction": "standard",
        "category": "navy", "rank": "S", "country": "JP", "countryName": "Japon",
        "obtainability": "shop",
        "shortDesc": "Amiral japonais polyvalent — aussi excellent en aviation.",
        "longDesc": "Yamaguchi est l'un des meilleurs amiraux du jeu et fonctionne également très bien comme général aviation (double usage). Synergie forte avec les porte-avions (Akagi, Enterprise).",
        "skills": [
            {"name": "Tactique navale", "desc": "Bonus d'attaque tous types navals."},
            {"name": "Aviation embarquée", "desc": "Bonus sur avions lancés depuis carriers."},
        ],
        "bonuses": [{"target": "Attaque navale", "value": "+25%"}, {"target": "Avion (depuis carrier)", "value": "+20%"}],
        "recommendedUnits": ["akagi", "enterprise-cv", "yukikaze"],
    },
    {
        "slug": "kuznetsov", "name": "Nikolaï Kouznetsov", "faction": "standard",
        "category": "navy", "rank": "S", "country": "RU", "countryName": "URSS",
        "obtainability": "shop",
        "shortDesc": "Après entraînement, meilleur amiral de la marine soviétique.",
        "longDesc": "Une fois entraîné, Kouznetsov devient le meilleur amiral du jeu pour la marine. Particulièrement efficace avec les navires russes modernes (Arleigh Burke équivalents, Typhoon).",
        "skills": [
            {"name": "Flotte rouge", "desc": "Bonus offensif tous navires soviétiques."},
            {"name": "Doctrine moderne", "desc": "Bonus supplémentaire sur navires modernes."},
        ],
        "bonuses": [{"target": "Attaque navale", "value": "+30%"}, {"target": "HP naval", "value": "+20%"}],
        "recommendedUnits": ["typhoon-submarine", "arleigh-burke"],
    },
    {
        "slug": "montgomery", "name": "Bernard Montgomery", "faction": "standard",
        "category": "infantry", "rank": "A", "country": "GB", "countryName": "Royaume-Uni",
        "obtainability": "shop",
        "shortDesc": "Commandant britannique, spécialiste de la guerre d'infanterie méthodique.",
        "longDesc": "Montgomery est le général britannique qui a mené la Huitième Armée à El Alamein. Dans WC4 c'est un général infanterie/polyvalent A-tier, correct pour les scénarios WWII britanniques.",
        "skills": [
            {"name": "Plan méthodique", "desc": "Bonus défensif en position retranchée."},
            {"name": "Huitième Armée", "desc": "Bonus sur infanterie du Commonwealth."},
        ],
        "bonuses": [{"target": "Défense infanterie", "value": "+20%"}, {"target": "Attaque infanterie", "value": "+15%"}],
        "recommendedUnits": ["brandenburg-infantry", "combat-medic"],
    },
]

SCORPION_GENERALS = [
    {
        "slug": "osborn", "name": "Osborn", "faction": "scorpion",
        "category": "balanced", "rank": "S", "country": "XX", "countryName": "Empire du Scorpion",
        "obtainability": "campaign",
        "shortDesc": "Leader de l'Empire du Scorpion — ancien général britannique Alfred.",
        "longDesc": "Osborn est le chef de l'Empire du Scorpion (New World Order). Son identité originelle était Alfred, un général britannique non-recrutable qui apparaît dans la mission Dunkerque de l'événement Origin of the Scorpion Empire. À partir du scénario Modern War il devient l'antagoniste final du jeu. Disponible dans le pack des trois généraux terroristes (Osborn, Williams, Colson).",
        "skills": [
            {"name": "Commandant suprême", "desc": "Bonus massif sur toutes les unités mystiques."},
            {"name": "Nouveau Monde", "desc": "Activation de capacités spéciales faction Scorpion."},
        ],
        "bonuses": [{"target": "Unités Scorpion", "value": "+30%"}, {"target": "Moral", "value": "+25%"}],
        "recommendedUnits": ["titan-tank", "heavenly-beginning-tank", "mystic-bomber"],
    },
    {
        "slug": "williams", "name": "Williams", "faction": "scorpion",
        "category": "artillery", "rank": "S", "country": "XX", "countryName": "Empire du Scorpion",
        "obtainability": "campaign",
        "shortDesc": "L'un des trois capitaines de l'Empire du Scorpion, concepteur du KS-90.",
        "longDesc": "Williams est l'un des trois capitaines de l'Empire du Scorpion, avec Osborn et Colson. Selon le lore, il a conçu et produit le KS-90, l'artillerie automotrice d'élite mystique. À pairer naturellement avec le KS-90 ou les autres artilleries Scorpion.",
        "skills": [
            {"name": "Ingénieur mystique", "desc": "Bonus spécial sur KS-90 et artilleries Scorpion."},
            {"name": "Nano-technologie", "desc": "Récupération HP 3%/tour pour unités contrôlées."},
        ],
        "bonuses": [{"target": "Attaque KS-90", "value": "+35%"}, {"target": "Récupération HP", "value": "+3%/tour"}],
        "recommendedUnits": ["ks-90", "e-775"],
    },
    {
        "slug": "colson", "name": "Colson", "faction": "scorpion",
        "category": "tank", "rank": "S", "country": "XX", "countryName": "Empire du Scorpion",
        "obtainability": "campaign",
        "shortDesc": "Troisième capitaine de l'Empire du Scorpion — détails in-game à confirmer.",
        "longDesc": "Colson est le troisième capitaine de l'Empire du Scorpion, aux côtés d'Osborn et Williams. Disponible dans le pack des trois généraux terroristes. Rôle exact et skills à confirmer in-game — probablement associé aux unités blindées Scorpion (Titan Tank, Heavenly Beginning Tank).",
        "skills": [
            {"name": "Commandant blindé mystique", "desc": "Bonus sur chars Scorpion."},
            {"name": "Défense du Scorpion", "desc": "Réduction de dégâts sur unités alliées."},
        ],
        "bonuses": [{"target": "Attaque chars Scorpion", "value": "+30%"}, {"target": "Défense chars Scorpion", "value": "+25%"}],
        "recommendedUnits": ["titan-tank", "heavenly-beginning-tank"],
    },
]


def make(g):
    return {
        **{k: g[k] for k in ["slug", "name", "faction", "category", "rank", "country", "countryName", "obtainability", "shortDesc", "longDesc", "skills", "bonuses", "recommendedUnits"]},
        "verified": False,
        "sources": SOURCES,
    }


def main():
    all_gens = []
    for g in STANDARD_GENERALS + SCORPION_GENERALS:
        d = make(g)
        all_gens.append(d)
        (OUT / f"{d['slug']}.json").write_text(json.dumps(d, ensure_ascii=False, indent=2))

    index = [{"slug": g["slug"], "name": g["name"], "faction": g["faction"],
              "category": g["category"], "rank": g["rank"], "country": g["country"]}
             for g in all_gens]
    (OUT / "_index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2))

    std = sum(1 for g in all_gens if g["faction"] == "standard")
    scor = sum(1 for g in all_gens if g["faction"] == "scorpion")
    print(f"✓ Generated {len(all_gens)} generals ({std} standard + {scor} scorpion)")


if __name__ == "__main__":
    main()
