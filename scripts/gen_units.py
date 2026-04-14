#!/usr/bin/env python3
"""
Génère les fiches JSON des unités d'élite WC4 + unités Scorpion Empire.

IMPORTANT — toutes les données sont marquées `verified: false` :
les noms d'unités et leur catégorie sont issus de la recherche publique
(NamuWiki, Fandom WC4, forums Easytech), mais les stats exactes par niveau
et les perks précis nécessitent une validation in-game.

Usage :
    python3 scripts/gen_units.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "wc4" / "elite-units"
OUT.mkdir(parents=True, exist_ok=True)

SOURCES_DEFAULT = [
    "https://world-conqueror-4.fandom.com/wiki/Elite_Force",
    "https://en.namu.wiki/w/%EC%84%B8%EA%B3%84%20%EC%A0%95%EB%B3%B5%EC%9E%90%204/%EC%97%98%EB%A6%AC%ED%8A%B8%20%EB%B6%80%EB%8C%80",
]


def grow(base: int, end: int) -> list:
    step = (end - base) / 11
    return [round(base + step * i) for i in range(12)]


def stats(atk_range, def_range, hp_range, mov, rng):
    return {
        "atk": grow(*atk_range),
        "def": grow(*def_range),
        "hp": grow(*hp_range),
        "mov": [mov] * 12,
        "rng": [rng] * 12,
    }


def perk(lvl, ptype, name, desc, icon="⚙", milestone=False):
    return {
        "lvl": lvl,
        "type": ptype,
        "icon": icon,
        "name": name,
        "desc": desc,
        "milestone": milestone,
    }


def generic_perks(cat: str) -> list:
    common = [
        perk(1, "stat", "Stats de base", "Statistiques de départ de l'unité d'élite."),
        perk(3, "passive", "Bonus moral", "+5% moral aux unités alliées adjacentes.", "🎖"),
    ]
    by_cat = {
        "tank": [
            perk(5, "active-skill", "Blindage renforcé", "Réduit de 30% les dégâts reçus pendant 1 tour.", "🛡", True),
            perk(7, "passive", "Cible prioritaire", "+15% dégâts contre les unités d'infanterie."),
            perk(9, "active-skill", "Charge blindée", "Attaque supplémentaire après avoir éliminé une unité.", "⚔", True),
            perk(12, "active-skill", "Perk ultime", "Skill final à valider in-game (capacité signature).", "⭐", True),
        ],
        "infantry": [
            perk(5, "passive", "Embuscade", "+20% dégâts en terrain forestier ou urbain.", "🌲", True),
            perk(7, "active-skill", "Capacité signature", "Skill propre à l'infanterie d'élite (voir jeu).", "🎯"),
            perk(9, "passive", "Vétérance", "+10% esquive permanent.", "🛡", True),
            perk(12, "active-skill", "Perk ultime", "Skill final à valider in-game.", "⭐", True),
        ],
        "artillery": [
            perk(5, "passive", "Portée étendue", "+1 portée de tir.", "🎯", True),
            perk(7, "active-skill", "Tir précis", "Ignore 50% de la défense ennemie pendant 1 tour.", "💥"),
            perk(9, "passive", "Saturation", "Dégâts de zone sur tuile adjacente.", "🔥", True),
            perk(12, "active-skill", "Perk ultime", "Skill final à valider in-game.", "⭐", True),
        ],
        "navy": [
            perk(5, "active-skill", "Tir de barrage", "Attaque multi-cibles sur les navires adjacents.", "⚓", True),
            perk(7, "passive", "Coque renforcée", "+20% HP en mer profonde."),
            perk(9, "active-skill", "Défense AA", "Réduit les dégâts aériens de 40% pendant 1 tour.", "✈", True),
            perk(12, "active-skill", "Perk ultime", "Skill final à valider in-game.", "⭐", True),
        ],
        "airforce": [
            perk(5, "passive", "Supériorité aérienne", "+15% dégâts contre autres unités aériennes.", "✈", True),
            perk(7, "active-skill", "Frappe surprise", "Première attaque non subie.", "💥"),
            perk(9, "passive", "Vol stationnaire", "Aucun coût de mouvement pour rester en place.", "🪂", True),
            perk(12, "active-skill", "Perk ultime", "Skill final à valider in-game.", "⭐", True),
        ],
    }
    return common + by_cat[cat]


# ============================================================
# STANDARD ELITE UNITS — real-world inspired
# ============================================================

STANDARD_UNITS = [
    # TANKS (9)
    {"name": "T-44", "slug": "t-44", "category": "tank", "country": "RU", "countryName": "URSS", "tier": "A", "obtainability": "shop",
     "shortDesc": "Char moyen soviétique de fin de guerre, précurseur du T-54.",
     "longDesc": "Développé en 1944 pour remplacer le T-34, le T-44 est une unité d'élite WC4 classée char médian avancé. Combine mobilité et blindage.",
     "baseStats": ((60, 130), (50, 120), (120, 240), 3, 1)},
    {"name": "Königs Tiger", "slug": "konigs-tiger", "nameEn": "King Tiger", "category": "tank", "country": "DE", "countryName": "Allemagne", "tier": "S", "obtainability": "shop",
     "shortDesc": "Super char lourd allemand, une des plus puissantes unités blindées du jeu.",
     "longDesc": "Le Königs Tiger (Tiger II) est une Elite Force recrutable une fois par bataille. Au même niveau que l'IS-3, blindage et canon 88mm L/71 redoutables.",
     "baseStats": ((80, 180), (80, 180), (150, 320), 2, 1)},
    {"name": "M26 Pershing", "slug": "m26-pershing", "category": "tank", "country": "US", "countryName": "États-Unis", "tier": "A", "obtainability": "shop",
     "shortDesc": "Char lourd américain de fin de WWII, équilibré attaque/défense.",
     "longDesc": "Entre en service début 1945 pour contrer les Tiger et Panther. Unité d'élite polyvalente, bon compromis entre offensive et durabilité.",
     "baseStats": ((70, 160), (70, 160), (140, 290), 3, 1)},
    {"name": "IS-3 Heavy Tank", "slug": "is-3", "category": "tank", "country": "RU", "countryName": "URSS", "tier": "S", "obtainability": "shop",
     "shortDesc": "Char lourd soviétique à tourelle ogivale — une des meilleures unités blindées.",
     "longDesc": "L'IS-3 est apparu fin 1945. Équivalent du King Tiger, qu'il surpasse parfois en pool de PV. Canon 122mm redoutable.",
     "baseStats": ((80, 180), (80, 185), (160, 340), 2, 1)},
    {"name": "Centurion", "slug": "centurion", "category": "tank", "country": "GB", "countryName": "Royaume-Uni", "tier": "A", "obtainability": "shop",
     "shortDesc": "Premier MBT britannique, pont entre WWII et ère moderne.",
     "longDesc": "Le Centurion (A41) est le premier char de combat principal au monde. Unité d'élite polyvalente : mobilité, blindage, canon 20-pdr/105mm.",
     "baseStats": ((70, 160), (70, 165), (140, 290), 3, 1)},
    {"name": "T-72", "slug": "t-72", "category": "tank", "country": "RU", "countryName": "URSS", "tier": "A", "obtainability": "shop",
     "shortDesc": "MBT soviétique emblématique de la guerre froide, produit en masse.",
     "longDesc": "Canon 125mm lisse, chargeur automatique. Unité d'élite moderne accessible dans Cold War et Modern War.",
     "baseStats": ((90, 200), (80, 190), (160, 320), 3, 1)},
    {"name": "M1A1 Abrams", "slug": "m1a1-abrams", "category": "tank", "country": "US", "countryName": "États-Unis", "tier": "S", "obtainability": "shop",
     "shortDesc": "MBT américain — référence des chars modernes.",
     "longDesc": "Turbine à gaz, canon 120mm lisse, blindage composite Chobham. Unité d'élite de référence dans les scénarios modernes.",
     "baseStats": ((100, 220), (90, 200), (170, 350), 3, 1)},
    {"name": "Honeycomb", "slug": "honeycomb", "category": "tank", "country": "XX", "countryName": "Inconnu", "tier": "A", "obtainability": "event",
     "shortDesc": "Char d'élite secondaire accessible via événement — détails à vérifier in-game.",
     "longDesc": "Mentionné dans la liste NamuWiki des tanks d'élite WC4. Origines et stats exactes à confirmer in-game.",
     "baseStats": ((70, 160), (70, 170), (140, 300), 3, 1)},
    {"name": "Leopard 2", "slug": "leopard-2", "category": "tank", "country": "DE", "countryName": "Allemagne", "tier": "S", "obtainability": "shop",
     "shortDesc": "MBT allemand moderne, canon 120mm lisse Rheinmetall.",
     "longDesc": "Entre en service en 1979 et reste l'un des meilleurs MBT au monde. S-tier pour les scénarios modernes.",
     "baseStats": ((100, 220), (95, 210), (170, 350), 3, 1)},

    # INFANTRY (7)
    {"name": "Combat Medic", "slug": "combat-medic", "category": "infantry", "country": "XX", "countryName": "Universel", "tier": "S", "obtainability": "event",
     "shortDesc": "Infirmier de combat — unique source de soin en jeu, indispensable tôt.",
     "longDesc": "Fortement recommandé dès que possible. Seule unité qui active véritablement le mécanisme de guérison. À maxer en priorité.",
     "baseStats": ((30, 70), (40, 90), (100, 200), 3, 1)},
    {"name": "Hawkeye", "slug": "hawkeye", "category": "infantry", "country": "US", "countryName": "États-Unis", "tier": "A", "obtainability": "event",
     "shortDesc": "Reconnaissance d'élite avec bonus de vision et d'esquive.",
     "longDesc": "Spécialisée dans la reconnaissance : portée de vision étendue et bonus d'esquive, utile en terrain inconnu.",
     "baseStats": ((40, 90), (40, 90), (100, 210), 3, 1)},
    {"name": "Brandenburg Infantry", "slug": "brandenburg-infantry", "category": "infantry", "country": "DE", "countryName": "Allemagne", "tier": "A", "obtainability": "shop",
     "shortDesc": "Forces spéciales allemandes WWII — sabotage et infiltration.",
     "longDesc": "Représente la Division Brandenburg, forces spéciales allemandes WWII spécialisées dans l'infiltration. Bonus en terrain varié.",
     "baseStats": ((50, 110), (45, 95), (110, 220), 3, 1)},
    {"name": "Alpini", "slug": "alpini", "category": "infantry", "country": "IT", "countryName": "Italie", "tier": "A", "obtainability": "shop",
     "shortDesc": "Chasseurs alpins italiens, experts du terrain montagneux.",
     "longDesc": "Troupes de montagne italiennes. Bonus significatifs en terrain montagneux et mobilité améliorée sur collines.",
     "baseStats": ((45, 100), (45, 100), (105, 210), 4, 1)},
    {"name": "RPG Rocket Soldier", "slug": "rpg-rocket-soldier", "category": "infantry", "country": "RU", "countryName": "URSS", "tier": "A", "obtainability": "shop",
     "shortDesc": "Infanterie anti-char équipée de lance-roquettes RPG.",
     "longDesc": "Soldat d'élite spécialisé anti-blindé. Équipé de lance-roquettes RPG-7. Rôle escorte urbaine contre mécanisés.",
     "baseStats": ((60, 130), (40, 85), (100, 200), 3, 1)},
    {"name": "Engineer Unit", "slug": "engineer-unit", "category": "infantry", "country": "XX", "countryName": "Universel", "tier": "B", "obtainability": "event",
     "shortDesc": "Unité du génie — construction, réparation, déminage.",
     "longDesc": "Construit des fortifications, répare les unités amies, franchit les zones minées. Indispensable en siège.",
     "baseStats": ((30, 65), (45, 95), (110, 220), 3, 1)},
    {"name": "Ghost Troop", "slug": "ghost-troop", "category": "infantry", "country": "XX", "countryName": "Universel", "tier": "S", "obtainability": "event",
     "shortDesc": "Force fantôme — unité d'élite furtive à haute létalité.",
     "longDesc": "Parmi les meilleures unités d'infanterie du jeu. Haute attaque, esquive importante, capacité d'infiltration.",
     "baseStats": ((65, 140), (50, 105), (110, 220), 4, 1)},

    # ARTILLERY (9)
    {"name": "M7 Priest", "slug": "m7-priest", "category": "artillery", "country": "US", "countryName": "États-Unis", "tier": "A", "obtainability": "shop",
     "shortDesc": "Obusier automoteur américain 105mm sur châssis M3 Lee.",
     "longDesc": "Obusier automoteur WWII. Artillerie d'élite à mobilité élevée, bonne pour l'appui-feu dans les premiers scénarios WW2.",
     "baseStats": ((80, 180), (30, 70), (90, 190), 3, 3)},
    {"name": "Schwerer Gustav", "slug": "schwerer-gustav", "category": "artillery", "country": "DE", "countryName": "Allemagne", "tier": "S", "obtainability": "shop",
     "shortDesc": "Plus gros canon sur rails jamais construit — artillerie ultime de siège.",
     "longDesc": "Canon ferroviaire de 800mm. Dégâts dévastateurs mais mobilité quasi-nulle. Usage siège uniquement.",
     "baseStats": ((150, 350), (20, 50), (100, 220), 1, 4)},
    {"name": "BM-21 Grad", "slug": "bm-21-grad", "category": "artillery", "country": "RU", "countryName": "URSS", "tier": "A", "obtainability": "shop",
     "shortDesc": "Lance-roquettes multiples soviétique 122mm, 40 tubes.",
     "longDesc": "Lance-roquettes multiples 122mm monté sur camion Ural-375D. Cadence de tir dévastatrice, dégâts de zone.",
     "baseStats": ((100, 220), (30, 60), (100, 200), 3, 3)},
    {"name": "B-4 Howitzer", "slug": "b-4-howitzer", "category": "artillery", "country": "RU", "countryName": "URSS", "tier": "A", "obtainability": "shop",
     "shortDesc": "Obusier soviétique 203mm — l'un des plus gros calibres WWII.",
     "longDesc": "Obusier 203mm de l'Armée Rouge dès 1934. Utilisé contre fortifications et positions enterrées.",
     "baseStats": ((120, 270), (25, 55), (95, 200), 2, 3)},
    {"name": "Stuka Rocket Artillery", "slug": "stuka-rocket", "category": "artillery", "country": "DE", "countryName": "Allemagne", "tier": "A", "obtainability": "shop",
     "shortDesc": "Stuka zu Fuss — lance-roquettes allemand 280/320mm, ne pas confondre avec l'avion.",
     "longDesc": "Lance-roquettes WWII monté sur demi-chenille Sd.Kfz.251. Artillerie d'élite à dégâts explosifs.",
     "baseStats": ((100, 220), (30, 60), (100, 210), 3, 3)},
    {"name": "AuF1 SPG", "slug": "auf1-spg", "category": "artillery", "country": "FR", "countryName": "France", "tier": "A", "obtainability": "shop",
     "shortDesc": "Canon automoteur français 155mm sur châssis AMX-30.",
     "longDesc": "GCT AuF1 : obusier automoteur 155mm développé dans les années 1970. Bonne mobilité et portée.",
     "baseStats": ((100, 220), (35, 75), (100, 210), 3, 3)},
    {"name": "RT-2PM2 Topol-M", "slug": "topol-m", "category": "artillery", "country": "RU", "countryName": "Russie", "tier": "S", "obtainability": "shop",
     "shortDesc": "Missile balistique intercontinental russe — unité d'élite ultime.",
     "longDesc": "ICBM russe à tête nucléaire, service 1997. Portée maximale, dégâts dévastateurs, usage très limité.",
     "baseStats": ((200, 450), (20, 40), (80, 180), 2, 5)},
    {"name": "M142 HIMARS", "slug": "m142-himars", "category": "artillery", "country": "US", "countryName": "États-Unis", "tier": "S", "obtainability": "shop",
     "shortDesc": "Lance-roquettes américain guidé GPS, mobilité shoot-and-scoot.",
     "longDesc": "Lance-roquettes moderne haute précision (GMLRS GPS, ATACMS). S-tier incontournable fin de campagne.",
     "baseStats": ((130, 290), (30, 60), (100, 220), 4, 4)},
    {"name": "8.8 cm Flak", "slug": "flak-88", "category": "artillery", "country": "DE", "countryName": "Allemagne", "tier": "A", "obtainability": "shop",
     "shortDesc": "Canon anti-aérien allemand 88mm, redoutable anti-char également.",
     "longDesc": "L'un des canons les plus polyvalents de la WWII. Double usage AA / anti-blindé.",
     "baseStats": ((90, 200), (40, 85), (95, 200), 2, 3)},

    # NAVY (8)
    {"name": "Type VII U-Boat", "slug": "type-vii-uboat", "category": "navy", "country": "DE", "countryName": "Allemagne", "tier": "A", "obtainability": "shop",
     "shortDesc": "Sous-marin d'attaque allemand WWII, ossature de la Kriegsmarine.",
     "longDesc": "Sous-marin le plus produit de l'histoire (~700 unités). Colonne vertébrale de la Bataille de l'Atlantique. Furtivité et dégâts de torpille élevés.",
     "baseStats": ((90, 200), (40, 80), (120, 250), 3, 2)},
    {"name": "Typhoon Submarine", "slug": "typhoon-submarine", "category": "navy", "country": "RU", "countryName": "URSS / Russie", "tier": "S", "obtainability": "shop",
     "shortDesc": "SNLE soviétique classe Typhoon — plus grand sous-marin jamais construit.",
     "longDesc": "Projekt 941 Akula (code OTAN Typhoon). Sous-marin nucléaire lanceur d'engins soviétique. Capacité de frappe stratégique.",
     "baseStats": ((140, 310), (50, 110), (150, 320), 3, 3)},
    {"name": "Richelieu", "slug": "richelieu", "category": "navy", "country": "FR", "countryName": "France", "tier": "A", "obtainability": "shop",
     "shortDesc": "Cuirassé français de la classe Richelieu, huit canons 380mm.",
     "longDesc": "Navire de tête de la dernière classe de cuirassés français. Huit canons 380mm en deux tourelles quadruples avant.",
     "baseStats": ((110, 240), (60, 130), (160, 340), 2, 3)},
    {"name": "HMS Prince of Wales", "slug": "hms-prince-of-wales", "category": "navy", "country": "GB", "countryName": "Royaume-Uni", "tier": "A", "obtainability": "shop",
     "shortDesc": "Cuirassé britannique classe King George V, canons 356mm.",
     "longDesc": "A participé à la chasse au Bismarck avant d'être coulé par l'aviation japonaise en 1941. Canons 14 pouces.",
     "baseStats": ((105, 230), (60, 125), (155, 330), 2, 3)},
    {"name": "Yukikaze", "slug": "yukikaze", "category": "navy", "country": "JP", "countryName": "Japon", "tier": "A", "obtainability": "shop",
     "shortDesc": "Destroyer japonais classe Kagero — « le destroyer chanceux ».",
     "longDesc": "Célèbre pour avoir survécu à presque toutes les batailles majeures du Pacifique. Très forte esquive et vitesse.",
     "baseStats": ((85, 190), (45, 95), (110, 230), 4, 2)},
    {"name": "Arleigh Burke", "slug": "arleigh-burke", "category": "navy", "country": "US", "countryName": "États-Unis", "tier": "S", "obtainability": "shop",
     "shortDesc": "Destroyer lance-missiles américain — standard OTAN moderne.",
     "longDesc": "Classe de destroyers lance-missiles de l'US Navy depuis 1991. Système Aegis, Tomahawk et Standard.",
     "baseStats": ((130, 290), (55, 120), (150, 320), 4, 3)},
    {"name": "Akagi", "slug": "akagi", "category": "navy", "country": "JP", "countryName": "Japon", "tier": "S", "obtainability": "shop",
     "shortDesc": "Porte-avions japonais, navire amiral de l'attaque sur Pearl Harbor.",
     "longDesc": "Porte-avions lourd japonais, navire amiral de la Kido Butai à Pearl Harbor en 1941. Capacité de lancer des raids aériens.",
     "baseStats": ((130, 280), (50, 110), (170, 360), 3, 4)},
    {"name": "USS Enterprise (CV-6)", "slug": "enterprise-cv", "category": "navy", "country": "US", "countryName": "États-Unis", "tier": "S", "obtainability": "shop",
     "shortDesc": "Porte-avions américain le plus décoré de la WWII.",
     "longDesc": "Porte-avions classe Yorktown, « The Big E ». Navire le plus décoré de l'US Navy pendant la WWII (20 Battle Stars).",
     "baseStats": ((130, 290), (55, 115), (170, 360), 3, 4)},

    # AIRFORCE (9)
    {"name": "Supermarine Spitfire", "slug": "supermarine-spitfire", "category": "airforce", "country": "GB", "countryName": "Royaume-Uni", "tier": "A", "obtainability": "shop",
     "shortDesc": "Chasseur britannique légendaire de la Bataille d'Angleterre.",
     "longDesc": "Chasseur britannique emblématique de la WWII. Plus de 20 000 unités produites.",
     "baseStats": ((80, 180), (40, 85), (95, 200), 6, 1)},
    {"name": "Ju 87 Stuka", "slug": "ju-87-stuka", "category": "airforce", "country": "DE", "countryName": "Allemagne", "tier": "A", "obtainability": "shop",
     "shortDesc": "Bombardier en piqué allemand — la sirène qui terrorisait l'Europe.",
     "longDesc": "Bombardier en piqué allemand reconnaissable à ses ailes inversées et à sa sirène Jericho. Dégâts bonus contre unités au sol. À ne pas confondre avec l'artillerie Stuka zu Fuss.",
     "baseStats": ((90, 200), (35, 75), (95, 200), 5, 1)},
    {"name": "C-47 Skytrain", "slug": "c-47-skytrain", "category": "airforce", "country": "US", "countryName": "États-Unis", "tier": "B", "obtainability": "event",
     "shortDesc": "Avion de transport américain, largage de parachutistes.",
     "longDesc": "Avion de transport allié emblématique. Unité support : permet de larguer des parachutistes derrière les lignes.",
     "baseStats": ((40, 90), (40, 85), (110, 230), 5, 1)},
    {"name": "P-40 Warhawk", "slug": "p-40-warhawk", "category": "airforce", "country": "US", "countryName": "États-Unis", "tier": "A", "obtainability": "shop",
     "shortDesc": "Chasseur américain célèbre avec les Flying Tigers en Chine.",
     "longDesc": "Chasseur américain début WWII. Célèbre pour ses décorations de gueule de requin chez les Flying Tigers (AVG).",
     "baseStats": ((75, 170), (40, 80), (95, 200), 6, 1)},
    {"name": "Mi-24 Hind", "slug": "mi-24-hind", "category": "airforce", "country": "RU", "countryName": "URSS / Russie", "tier": "S", "obtainability": "shop",
     "shortDesc": "Hélicoptère d'attaque soviétique — « le char volant ».",
     "longDesc": "Hélicoptère d'assaut soviétique, surnommé « char volant ». Unique dans sa catégorie : attaque + transport léger.",
     "baseStats": ((110, 240), (50, 110), (130, 280), 5, 1)},
    {"name": "B-52 Stratofortress", "slug": "b-52-stratofortress", "category": "airforce", "country": "US", "countryName": "États-Unis", "tier": "S", "obtainability": "shop",
     "shortDesc": "Bombardier lourd stratégique américain — service depuis 1955.",
     "longDesc": "Bombardier lourd à 8 réacteurs, USAF depuis 1955. Capacité d'emport 31 tonnes. Frappe longue portée stratégique.",
     "baseStats": ((150, 330), (35, 75), (140, 300), 5, 2)},
    {"name": "AH-64 Apache", "slug": "ah-64-apache", "category": "airforce", "country": "US", "countryName": "États-Unis", "tier": "S", "obtainability": "shop",
     "shortDesc": "Hélicoptère d'attaque américain moderne — précision anti-char.",
     "longDesc": "Hélicoptère d'attaque principal US Army depuis 1986. Missiles Hellfire, canon 30mm, systèmes de visée avancés.",
     "baseStats": ((120, 260), (50, 110), (130, 280), 5, 1)},
    {"name": "Harrier", "slug": "harrier", "category": "airforce", "country": "GB", "countryName": "Royaume-Uni", "tier": "A", "obtainability": "shop",
     "shortDesc": "Avion de combat britannique à décollage vertical (VTOL).",
     "longDesc": "Premier avion de combat opérationnel à décollage vertical. Célèbre pour son rôle aux Malouines.",
     "baseStats": ((95, 210), (45, 95), (110, 240), 5, 1)},
    {"name": "Sukhoi Su-30", "slug": "su-30", "category": "airforce", "country": "RU", "countryName": "Russie", "tier": "S", "obtainability": "shop",
     "shortDesc": "Chasseur multirôle russe Flanker — supériorité aérienne 4.5G.",
     "longDesc": "Chasseur multirôle génération 4.5 dérivé du Su-27 Flanker. Poussée vectorielle, radar puissant, missiles R-77.",
     "baseStats": ((115, 255), (50, 105), (120, 260), 6, 2)},
]


# ============================================================
# SCORPION EMPIRE / MYSTIC FORCES — fictional faction
# ============================================================

SCORPION_UNITS = [
    {"name": "Titan Tank", "slug": "titan-tank", "category": "tank", "country": "XX", "countryName": "Empire du Scorpion", "tier": "S", "obtainability": "campaign",
     "shortDesc": "Super char terroriste — seul super tank empilable du jeu.",
     "longDesc": "Unité blindée introduite dans le scénario Modern War, exclusive aux forces terroristes. Seul super tank empilable du jeu, particulièrement durable. Puissant mais inférieur aux blindés Elite Forces les plus avancés.",
     "baseStats": ((110, 230), (100, 220), (200, 420), 2, 1)},
    {"name": "Heavenly Beginning Tank", "slug": "heavenly-beginning-tank", "category": "tank", "country": "XX", "countryName": "Empire du Scorpion", "tier": "S", "obtainability": "campaign",
     "shortDesc": "Super char mystique — unité blindée fin-jeu des Mystic Forces.",
     "longDesc": "Super char des Mystic Forces (Empire du Scorpion). Apparaît en fin de challenge 1960 Conquest et certains événements.",
     "baseStats": ((120, 260), (110, 240), (220, 460), 2, 1)},
    {"name": "E-775 Armored Vehicle", "slug": "e-775", "category": "tank", "country": "XX", "countryName": "Empire du Scorpion", "tier": "A", "obtainability": "campaign",
     "shortDesc": "Véhicule blindé scorpion — identifié par 4 roues et marque sur la coque.",
     "longDesc": "Véhicule blindé des Mystic Forces. Configuration 4 roues, scorpion noir sur le corps uniquement (pas sur les canons, contrairement au KS-90).",
     "baseStats": ((90, 200), (70, 150), (150, 310), 4, 1)},
    {"name": "KS-90 Self-Propelled Artillery", "slug": "ks-90", "category": "artillery", "country": "XX", "countryName": "Empire du Scorpion", "tier": "S", "obtainability": "campaign",
     "shortDesc": "Artillerie automotrice scorpion conçue par Williams — 8 roues.",
     "longDesc": "Artillerie automotrice d'élite mystique, conçue et produite par Williams, l'un des trois capitaines de l'Empire du Scorpion. 8 roues, scorpion noir sur les canons et la coque. Capacités : nano-récupération (3% HP/tour), coup critique, assault.",
     "baseStats": ((130, 290), (35, 75), (110, 230), 3, 4)},
    {"name": "SVA-23 Aircraft", "slug": "sva-23", "category": "airforce", "country": "XX", "countryName": "Empire du Scorpion", "tier": "S", "obtainability": "campaign",
     "shortDesc": "Aéronef à lévitation scorpion — mitrailleuses + supériorité aérienne.",
     "longDesc": "Unité d'élite mystique. Caractéristiques : Nano-récupération, Suppression (–30% moral ennemi après élimination), mitrailleuses, supériorité aérienne, évasion. Unité à lévitation, portée 2.",
     "baseStats": ((120, 260), (50, 105), (130, 280), 5, 2)},
    {"name": "Mystic Bomber", "slug": "mystic-bomber", "category": "airforce", "country": "XX", "countryName": "Empire du Scorpion", "tier": "S", "obtainability": "campaign",
     "shortDesc": "Bombardier mystique scorpion — unité aérienne fin de campagne.",
     "longDesc": "Bombardier d'élite des Mystic Forces. Disponible dans la mission finale du challenge 1960 Mysterious Forces of Challenge Conquest. Haute puissance de frappe air-sol.",
     "baseStats": ((140, 310), (40, 85), (140, 300), 4, 2)},
    {"name": "Mystic Strategic Bomber", "slug": "mystic-strategic-bomber", "category": "airforce", "country": "XX", "countryName": "Empire du Scorpion", "tier": "S", "obtainability": "campaign",
     "shortDesc": "Bombardier stratégique mystique — version longue portée du Mystic Bomber.",
     "longDesc": "Version stratégique longue portée du Mystic Bomber. Frappe de zone, portée maximale, usage très limité par partie.",
     "baseStats": ((160, 350), (35, 75), (145, 310), 4, 3)},
    {"name": "Mystery Paratrooper", "slug": "mystery-paratrooper", "category": "infantry", "country": "XX", "countryName": "Empire du Scorpion", "tier": "A", "obtainability": "campaign",
     "shortDesc": "Parachutiste mystique — infiltration derrière les lignes ennemies.",
     "longDesc": "Unité d'infanterie d'élite des Mystic Forces. Déployable en parachute derrière les lignes. Capacités signature liées à l'infiltration.",
     "baseStats": ((65, 140), (50, 105), (115, 230), 4, 1)},
]


def make_unit(s: dict, faction: str) -> dict:
    cat = s["category"]
    obt = s["obtainability"]
    obt_phrase = "campagne ou événements" if obt == "campaign" else "la boutique d'élite (électricité) ou événements"
    return {
        "slug": s["slug"],
        "name": s["name"],
        "nameEn": s.get("nameEn"),
        "category": cat,
        "faction": faction,
        "country": s["country"],
        "countryName": s["countryName"],
        "tier": s["tier"],
        "obtainability": s["obtainability"],
        "shortDesc": s["shortDesc"],
        "longDesc": s["longDesc"],
        "stats": stats(*s["baseStats"]),
        "perks": generic_perks(cat),
        "recommendedGenerals": [],
        "levelingPriority": [
            "Débloquer les perks milestones (5, 9, 12) en priorité",
            "Les perks stat sont moins prioritaires que les active-skills",
            "À partir du niveau 9, spécialiser selon votre style : offensif ou défensif",
        ],
        "faqs": [
            {"q": f"Comment obtenir {s['name']} dans World Conqueror 4 ?",
             "a": f"L'unité s'obtient via {obt_phrase}. Voir la section obtenabilité pour plus de détails."},
            {"q": f"Quelles sont les stats maximum au niveau 12 ?",
             "a": "Utilisez le curseur interactif ci-dessus. Les valeurs affichées sont extrapolées et à valider in-game — le wiki passera en 'verified' après vérification émulateur."},
            {"q": f"Quels généraux associer à {s['name']} ?",
             "a": "Voir la section Généraux recommandés. La synergie optimale dépend du scénario joué."},
        ],
        "verified": False,
        "sources": SOURCES_DEFAULT,
    }


def main():
    all_units = []
    for u in STANDARD_UNITS:
        d = make_unit(u, "standard")
        all_units.append(d)
        (OUT / f"{d['slug']}.json").write_text(json.dumps(d, ensure_ascii=False, indent=2))
    for u in SCORPION_UNITS:
        d = make_unit(u, "scorpion")
        all_units.append(d)
        (OUT / f"{d['slug']}.json").write_text(json.dumps(d, ensure_ascii=False, indent=2))

    index = [{"slug": u["slug"], "name": u["name"], "category": u["category"],
              "faction": u["faction"], "tier": u["tier"], "country": u["country"]}
             for u in all_units]
    (OUT / "_index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2))

    std = sum(1 for u in all_units if u["faction"] == "standard")
    scor = sum(1 for u in all_units if u["faction"] == "scorpion")
    print(f"✓ Generated {len(all_units)} unit files ({std} standard + {scor} scorpion)")


if __name__ == "__main__":
    main()
