#!/usr/bin/env python3
"""
Génère les fiches généraux WC4 avec le nouveau schéma :
- skills avec slot + rating + stars
- attributes (offense / defense / intelligence / charisma)
- trained variant (optionnel)
- acquisition (type + cost + currency)
Toutes les valeurs "à vérifier" sont laissées à null — seront remplies depuis l'émulateur.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "wc4" / "generals"
OUT.mkdir(parents=True, exist_ok=True)

SOURCES = [
    "https://world-conqueror-4.fandom.com/wiki/Generals",
    "https://european-war-4.boards.net/thread/12989/all-generals-ranked-wc4",
]


def skill(slot, name, desc, rating=None, stars=None):
    return {"slot": slot, "name": name, "desc": desc, "rating": rating, "stars": stars, "icon": None}


def acq(kind, cost=None, currency=None, notes=""):
    return {"type": kind, "cost": cost, "currency": currency, "notes": notes}


def attrs(off=None, dfn=None, intl=None, cha=None):
    return {"offense": off, "defense": dfn, "intelligence": intl, "charisma": cha}


# ==========================================================================
# STANDARD GENERALS (top-tier) — 10 entrées
# ==========================================================================
STANDARD_GENERALS = [
    {
        "slug": "guderian", "name": "Heinz Guderian", "faction": "standard",
        "category": "tank", "rank": "S", "country": "DE", "countryName": "Allemagne",
        "shortDesc": "Père de la Blitzkrieg et meilleur général blindé du jeu.",
        "longDesc": "Considéré comme le meilleur commandant de World Conqueror 4. Théoricien de la Blitzkrieg, il possède les trois meilleurs skills blindés du jeu ainsi que les compétences Machiniste et Rumeur. À placer sur un King Tiger, IS-3 ou M1A1 Abrams pour un effet maximal.",
        "skills": [
            skill(1, "Blitzkrieg", "Attaques de char +25%, mouvement amélioré."),
            skill(2, "Commandant blindé", "Bonus d'attaque et de défense sur tous les chars adjacents."),
            skill(3, "Machiniste (entraîné)", "Unité mécanisée : réparation accélérée."),
        ],
        "trained": {
            "name": "Guderian (entraîné)",
            "skills": [
                skill(1, "Blitzkrieg (S+)", "Version améliorée post-entraînement — à vérifier."),
                skill(2, "Commandant blindé (S+)", "Version améliorée post-entraînement — à vérifier."),
                skill(3, "Rumeur", "Skill de mobilité ajouté à l'entraînement — à confirmer."),
            ],
            "attributes": attrs(),
            "unlockCost": None,
            "unlockCurrency": "medals",
            "notes": "Trained variant confirmé par la communauté — coût et skills exacts à capturer en jeu.",
        },
        "attributes": attrs(),
        "acquisition": acq("medals", None, "medals", "Store — à confirmer en jeu (coût très élevé)"),
        "bonuses": [{"target": "Attaque char", "value": "+30%"}, {"target": "Défense char", "value": "+20%"}],
        "recommendedUnits": ["konigs-tiger", "is-3", "m1a1-abrams", "leopard-2"],
    },
    {
        "slug": "rommel", "name": "Erwin Rommel", "faction": "standard",
        "category": "tank", "rank": "S", "country": "DE", "countryName": "Allemagne",
        "shortDesc": "Le Renard du Désert — général blindé offensif-défensif.",
        "longDesc": "Rommel est un général tank de haute volée. Ses skills Feu Croisé (Crossfire) et Assaut Blindé (Armoured Assault) donnent des dégâts de contre-attaque supplémentaires et des bonus offensifs généraux. Excellent sur Königs Tiger ou M26 Pershing.",
        "skills": [
            skill(1, "Feu Croisé", "Dégâts supplémentaires en contre-attaque quand attaqué."),
            skill(2, "Assaut Blindé", "Dégâts +15% pour toutes les attaques blindées."),
            skill(3, "Commandant du désert", "Bonus supplémentaire en terrain désertique."),
        ],
        "trained": {
            "name": "Rommel (entraîné)",
            "skills": [
                skill(1, "Feu Croisé (amélioré)", "Version post-entraînement — à vérifier."),
                skill(2, "Assaut Blindé (amélioré)", "Version post-entraînement — à vérifier."),
                skill(3, "Renard du désert", "Skill légendaire post-entraînement — à confirmer."),
            ],
            "attributes": attrs(),
            "unlockCost": None,
            "unlockCurrency": "medals",
            "notes": "À confirmer en jeu.",
        },
        "attributes": attrs(),
        "acquisition": acq("medals", None, "medals", "Store — à confirmer"),
        "bonuses": [{"target": "Attaque char", "value": "+25%"}, {"target": "Contre-attaque", "value": "+30%"}],
        "recommendedUnits": ["konigs-tiger", "m26-pershing", "centurion"],
    },
    {
        "slug": "patton", "name": "George Patton", "faction": "standard",
        "category": "tank", "rank": "S", "country": "US", "countryName": "États-Unis",
        "shortDesc": "Général blindé américain agressif, tier S avec survivabilité.",
        "longDesc": "Patton est un général blindé top-tier de WC4. Offensive un peu moins pure que Rokossovsky mais bien meilleure survivabilité. Recommandé pour les chars lourds américains (M26 Pershing, M1A1 Abrams).",
        "skills": [
            skill(1, "Old Blood and Guts", "Bonus d'attaque permanent sur chars US."),
            skill(2, "Third Army", "Vitesse de déplacement améliorée."),
            skill(3, "Commandant vétéran", "HP max augmenté sur l'unité."),
        ],
        "trained": None,
        "attributes": attrs(),
        "acquisition": acq("medals", None, "medals", "Store — à confirmer"),
        "bonuses": [{"target": "Attaque char", "value": "+20%"}, {"target": "HP char", "value": "+25%"}],
        "recommendedUnits": ["m26-pershing", "m1a1-abrams"],
    },
    {
        "slug": "rokossovsky", "name": "Konstantin Rokossovsky", "faction": "standard",
        "category": "tank", "rank": "S", "country": "RU", "countryName": "URSS",
        "shortDesc": "Général blindé soviétique — meilleures capacités offensives après entraînement.",
        "longDesc": "Après entraînement, Rokossovsky est l'un des meilleurs généraux blindés du jeu, avec une puissance offensive supérieure à Patton. À prioriser pour les chars soviétiques (IS-3, T-72). À entraîner avant Patton.",
        "skills": [
            skill(1, "Opération Bagration", "Bonus offensif massif sur secteur attaqué."),
            skill(2, "Commandement ferme", "Réduit les pertes alliées adjacentes."),
            skill(3, "Fer de lance", "Vitesse accrue en attaque."),
        ],
        "trained": {
            "name": "Rokossovsky (entraîné)",
            "skills": [
                skill(1, "Opération Bagration (S+)", "Post-entraînement — à vérifier."),
                skill(2, "Commandement ferme (amélioré)", "Post-entraînement — à vérifier."),
                skill(3, "Percée soviétique", "Skill signature ajouté — à confirmer."),
            ],
            "attributes": attrs(),
            "unlockCost": None,
            "unlockCurrency": "medals",
            "notes": "Entraînement fortement recommandé par la communauté.",
        },
        "attributes": attrs(),
        "acquisition": acq("medals", None, "medals", "Store — à confirmer"),
        "bonuses": [{"target": "Attaque char", "value": "+30%"}, {"target": "Défense char", "value": "+15%"}],
        "recommendedUnits": ["is-3", "t-72", "t-44"],
    },
    {
        "slug": "konev", "name": "Ivan Konev", "faction": "standard",
        "category": "artillery", "rank": "S", "country": "RU", "countryName": "URSS",
        "shortDesc": "Meilleur général d'artillerie — l'équivalent de Guderian pour l'artillerie.",
        "longDesc": "Konev est pour l'artillerie ce que Guderian est pour les chars : la référence S-tier absolue. À pairer avec Schwerer Gustav, Topol-M ou M142 HIMARS pour optimiser les dégâts de frappe.",
        "skills": [
            skill(1, "Maître canonnier", "+30% dégâts artillerie."),
            skill(2, "Tir de barrage", "+1 portée pour toute artillerie commandée."),
            skill(3, "Commandant des canons", "Réduction du cooldown de tir."),
        ],
        "trained": None,
        "attributes": attrs(),
        "acquisition": acq("medals", None, "medals", "Store — à confirmer"),
        "bonuses": [{"target": "Attaque artillerie", "value": "+30%"}, {"target": "Portée", "value": "+1"}],
        "recommendedUnits": ["schwerer-gustav", "topol-m", "m142-himars"],
    },
    {
        "slug": "zhukov", "name": "Gueorgui Joukov", "faction": "standard",
        "category": "balanced", "rank": "S", "country": "RU", "countryName": "URSS",
        "shortDesc": "Général polyvalent au niveau de Konev en artillerie.",
        "longDesc": "Joukov est un général d'artillerie/polyvalent de premier rang, au niveau de Konev en appui-feu. Option alternative pour les joueurs qui veulent flexibilité sur plusieurs types d'unités.",
        "skills": [
            skill(1, "Défense de Moscou", "Bonus défensif global sur secteur."),
            skill(2, "Rouleau compresseur", "Attaques massives coordonnées."),
            skill(3, "Maréchal de l'URSS", "Leadership général — bonus sur toute la faction soviétique."),
        ],
        "trained": None,
        "attributes": attrs(),
        "acquisition": acq("medals", None, "medals", "Store — à confirmer"),
        "bonuses": [{"target": "Attaque artillerie", "value": "+25%"}, {"target": "Défense globale", "value": "+15%"}],
        "recommendedUnits": ["bm-21-grad", "b-4-howitzer", "topol-m"],
    },
    {
        "slug": "donitz", "name": "Karl Dönitz", "faction": "standard",
        "category": "navy", "rank": "S", "country": "DE", "countryName": "Allemagne",
        "shortDesc": "Meilleur amiral de WC4 — spécialiste des sous-marins.",
        "longDesc": "Dönitz est « sans aucun doute le meilleur commandant naval » selon les tier lists communautaires. Spécialiste absolu des sous-marins (Type VII, Typhoon), il maximise les dégâts de torpille et la furtivité.",
        "skills": [
            skill(1, "Meute de loups", "Sous-marins : attaque coordonnée +40%."),
            skill(2, "Guerre sous-marine", "Furtivité améliorée."),
            skill(3, "Amiral de la Kriegsmarine", "Bonus sur tous navires allemands."),
        ],
        "trained": None,
        "attributes": attrs(),
        "acquisition": acq("medals", None, "medals", "Store — à confirmer"),
        "bonuses": [{"target": "Attaque sous-marin", "value": "+40%"}, {"target": "Furtivité", "value": "+25%"}],
        "recommendedUnits": ["type-vii-uboat", "typhoon-submarine"],
    },
    {
        "slug": "yamaguchi", "name": "Tamon Yamaguchi", "faction": "standard",
        "category": "navy", "rank": "S", "country": "JP", "countryName": "Japon",
        "shortDesc": "Amiral japonais polyvalent — aussi excellent en aviation.",
        "longDesc": "Yamaguchi est l'un des meilleurs amiraux du jeu et fonctionne également très bien comme général aviation (double usage). Synergie forte avec les porte-avions (Akagi, Enterprise).",
        "skills": [
            skill(1, "Tactique navale", "Bonus d'attaque tous types navals."),
            skill(2, "Aviation embarquée", "Bonus sur avions lancés depuis carriers."),
            skill(3, "Bushidō naval", "Moral amélioré — réduction des pertes."),
        ],
        "trained": None,
        "attributes": attrs(),
        "acquisition": acq("medals", None, "medals", "Store — à confirmer"),
        "bonuses": [{"target": "Attaque navale", "value": "+25%"}, {"target": "Avion (depuis carrier)", "value": "+20%"}],
        "recommendedUnits": ["akagi", "enterprise-cv", "yukikaze"],
    },
    {
        "slug": "kuznetsov", "name": "Nikolaï Kouznetsov", "faction": "standard",
        "category": "navy", "rank": "S", "country": "RU", "countryName": "URSS",
        "shortDesc": "Après entraînement, meilleur amiral de la marine soviétique.",
        "longDesc": "Une fois entraîné, Kouznetsov devient le meilleur amiral du jeu pour la marine. Particulièrement efficace avec les navires russes modernes (Arleigh Burke équivalents, Typhoon).",
        "skills": [
            skill(1, "Flotte rouge", "Bonus offensif tous navires soviétiques."),
            skill(2, "Doctrine moderne", "Bonus supplémentaire sur navires modernes."),
            skill(3, "Commandant de la Baltique", "Défense navale améliorée."),
        ],
        "trained": {
            "name": "Kouznetsov (entraîné)",
            "skills": [
                skill(1, "Flotte rouge (S+)", "Post-entraînement — à vérifier."),
                skill(2, "Doctrine moderne (amélioré)", "Post-entraînement — à vérifier."),
                skill(3, "Héros de l'Union Soviétique", "Skill signature ajouté — à confirmer."),
            ],
            "attributes": attrs(),
            "unlockCost": None,
            "unlockCurrency": "medals",
            "notes": "Entraînement fortement recommandé.",
        },
        "attributes": attrs(),
        "acquisition": acq("medals", None, "medals", "Store — à confirmer"),
        "bonuses": [{"target": "Attaque navale", "value": "+30%"}, {"target": "HP naval", "value": "+20%"}],
        "recommendedUnits": ["typhoon-submarine", "arleigh-burke"],
    },
    {
        "slug": "montgomery", "name": "Bernard Montgomery", "faction": "standard",
        "category": "infantry", "rank": "A", "country": "GB", "countryName": "Royaume-Uni",
        "shortDesc": "Commandant britannique, spécialiste de la guerre d'infanterie méthodique.",
        "longDesc": "Montgomery est le général britannique qui a mené la Huitième Armée à El Alamein. Dans WC4 c'est un général infanterie/polyvalent A-tier, correct pour les scénarios WWII britanniques.",
        "skills": [
            skill(1, "Plan méthodique", "Bonus défensif en position retranchée."),
            skill(2, "Huitième Armée", "Bonus sur infanterie du Commonwealth."),
            skill(3, "Commandement terrestre", "Leadership général — bonus adjacents."),
        ],
        "trained": None,
        "attributes": attrs(),
        "acquisition": acq("medals", None, "medals", "Store — coût modéré à confirmer"),
        "bonuses": [{"target": "Défense infanterie", "value": "+20%"}, {"target": "Attaque infanterie", "value": "+15%"}],
        "recommendedUnits": ["brandenburg-infantry", "combat-medic"],
    },
]

# ==========================================================================
# SCORPION GENERALS — 3 capitaines
# ==========================================================================
SCORPION_GENERALS = [
    {
        "slug": "osborn", "name": "Osborn", "faction": "scorpion",
        "category": "balanced", "rank": "S", "country": "XX", "countryName": "Empire du Scorpion",
        "shortDesc": "Leader de l'Empire du Scorpion — ancien général britannique Alfred.",
        "longDesc": "Osborn est le chef de l'Empire du Scorpion (New World Order). Son identité originelle était Alfred, un général britannique non-recrutable qui apparaît dans la mission Dunkerque de l'événement Origin of the Scorpion Empire. À partir du scénario Modern War il devient l'antagoniste final du jeu. Disponible dans le pack des trois généraux terroristes (Osborn, Williams, Colson).",
        "skills": [
            skill(1, "Commandant suprême", "Bonus massif sur toutes les unités mystiques."),
            skill(2, "Nouveau Monde", "Activation de capacités spéciales faction Scorpion."),
            skill(3, "Volonté du Scorpion", "Moral + leadership sur unités alliées."),
        ],
        "trained": None,
        "attributes": attrs(),
        "acquisition": acq("campaign", None, None, "Pack des 3 généraux terroristes — campagne Modern War"),
        "bonuses": [{"target": "Unités Scorpion", "value": "+30%"}, {"target": "Moral", "value": "+25%"}],
        "recommendedUnits": ["titan-tank", "heavenly-beginning-tank", "mystic-bomber"],
    },
    {
        "slug": "williams", "name": "Williams", "faction": "scorpion",
        "category": "artillery", "rank": "S", "country": "XX", "countryName": "Empire du Scorpion",
        "shortDesc": "L'un des trois capitaines de l'Empire du Scorpion, concepteur du KS-90.",
        "longDesc": "Williams est l'un des trois capitaines de l'Empire du Scorpion, avec Osborn et Colson. Selon le lore, il a conçu et produit le KS-90, l'artillerie automotrice d'élite mystique. À pairer naturellement avec le KS-90 ou les autres artilleries Scorpion.",
        "skills": [
            skill(1, "Ingénieur mystique", "Bonus spécial sur KS-90 et artilleries Scorpion."),
            skill(2, "Nano-technologie", "Récupération HP 3%/tour pour unités contrôlées."),
            skill(3, "Concepteur d'élite", "Vitesse de production des unités spéciales accrue."),
        ],
        "trained": None,
        "attributes": attrs(),
        "acquisition": acq("campaign", None, None, "Pack des 3 généraux terroristes"),
        "bonuses": [{"target": "Attaque KS-90", "value": "+35%"}, {"target": "Récupération HP", "value": "+3%/tour"}],
        "recommendedUnits": ["ks-90", "e-775"],
    },
    {
        "slug": "colson", "name": "Colson", "faction": "scorpion",
        "category": "tank", "rank": "S", "country": "XX", "countryName": "Empire du Scorpion",
        "shortDesc": "Troisième capitaine de l'Empire du Scorpion — détails in-game à confirmer.",
        "longDesc": "Colson est le troisième capitaine de l'Empire du Scorpion, aux côtés d'Osborn et Williams. Disponible dans le pack des trois généraux terroristes. Rôle exact et skills à confirmer in-game — probablement associé aux unités blindées Scorpion (Titan Tank, Heavenly Beginning Tank).",
        "skills": [
            skill(1, "Commandant blindé mystique", "Bonus sur chars Scorpion."),
            skill(2, "Défense du Scorpion", "Réduction de dégâts sur unités alliées."),
            skill(3, "Assaut mystique", "Vitesse offensive accrue."),
        ],
        "trained": None,
        "attributes": attrs(),
        "acquisition": acq("campaign", None, None, "Pack des 3 généraux terroristes"),
        "bonuses": [{"target": "Attaque chars Scorpion", "value": "+30%"}, {"target": "Défense chars Scorpion", "value": "+25%"}],
        "recommendedUnits": ["titan-tank", "heavenly-beginning-tank"],
    },
]


def build(g):
    return {
        "slug": g["slug"],
        "name": g["name"],
        "nameEn": g.get("nameEn"),
        "faction": g["faction"],
        "category": g["category"],
        "rank": g["rank"],
        "country": g["country"],
        "countryName": g["countryName"],
        "shortDesc": g["shortDesc"],
        "longDesc": g["longDesc"],
        "skills": g["skills"],
        "attributes": g["attributes"],
        "trained": g["trained"],
        "acquisition": g["acquisition"],
        "bonuses": g["bonuses"],
        "recommendedUnits": g["recommendedUnits"],
        "verified": False,
        "sources": SOURCES,
    }


def main():
    # wipe old files (excluding _index)
    for f in OUT.glob("*.json"):
        f.unlink()

    all_gens = []
    for g in STANDARD_GENERALS + SCORPION_GENERALS:
        d = build(g)
        all_gens.append(d)
        (OUT / f"{d['slug']}.json").write_text(json.dumps(d, ensure_ascii=False, indent=2))

    index = [
        {
            "slug": g["slug"],
            "name": g["name"],
            "faction": g["faction"],
            "category": g["category"],
            "rank": g["rank"],
            "country": g["country"],
            "hasTrained": g["trained"] is not None,
            "acquisition": g["acquisition"]["type"],
        }
        for g in all_gens
    ]
    (OUT / "_index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2))

    std = sum(1 for g in all_gens if g["faction"] == "standard")
    scor = sum(1 for g in all_gens if g["faction"] == "scorpion")
    trained_count = sum(1 for g in all_gens if g["trained"] is not None)
    print(f"✓ Generated {len(all_gens)} generals ({std} standard + {scor} scorpion)")
    print(f"  {trained_count} with trained variant")


if __name__ == "__main__":
    main()
