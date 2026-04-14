#!/usr/bin/env python3
"""
Génère les fiches généraux WC4 avec le schéma corrigé (avril 2026) :
- attributes : 6 aptitudes (infantry/artillery/armor/navy/airforce/marching),
  chacune avec {start, max} sur 0..6 étoiles (5 normal + 6e "shiny bonus").
- skills : 3/4/5 slots selon quality (bronze/silver/gold/marshal), chaque skill
  peut avoir `replaceable: true` — c'est là que la feature de vote plug in.
- hasTrainingPath : éligibilité au training premium Sword/Sceptre of Dominance.
- training : TrainingPath optionnel avec stages complets (rempli après verif émulateur).
- acquisition : type + coût + currency.

Toutes les valeurs non confirmées = null. `verified: False` tant que non validé en jeu.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "wc4" / "generals"
OUT.mkdir(parents=True, exist_ok=True)

SOURCES = [
    "https://world-conqueror-4.fandom.com/wiki/Generals",
    "https://world-conqueror-4.fandom.com/wiki/Skills",
    "https://world-conqueror-4.fandom.com/wiki/Training",
    "https://european-war-4.boards.net/thread/19837/generals-training-guide-created-september",
]


# ─── builders ─────────────────────────────────────────────────────────────
def skill(slot, name, desc, rating=None, stars=None, replaceable=False, reason=""):
    return {
        "slot": slot,
        "name": name,
        "desc": desc,
        "rating": rating,
        "stars": stars,
        "icon": None,
        "replaceable": replaceable,
        "replaceableReason": reason or None,
    }


def acq(kind, cost=None, currency=None, notes=""):
    return {"type": kind, "cost": cost, "currency": currency, "notes": notes}


def av(start=None, mx=None):
    """Single attribute value — null-safe."""
    if start is None and mx is None:
        return None
    return {"start": start, "max": mx}


def attrs(inf=None, art=None, arm=None, nav=None, air=None, mar=None):
    """Six-attribute record. Pass tuples (start, max) or None."""
    def norm(x):
        if x is None:
            return None
        if isinstance(x, tuple):
            return av(x[0], x[1])
        return x
    return {
        "infantry": norm(inf),
        "artillery": norm(art),
        "armor": norm(arm),
        "navy": norm(nav),
        "airforce": norm(air),
        "marching": norm(mar),
    }


def training_stage(n, swords=None, sceptres=None, label="", notes=""):
    """One stage of premium training."""
    return {
        "stage": n,
        "label": label or None,
        "swordCost": swords,
        "sceptreCost": sceptres,
        "skillChanges": [],
        "attributeDeltas": [],
        "notes": notes or None,
    }


def training_path(stages, total_swords=None, total_sceptres=None, summary=""):
    return {
        "stages": stages,
        "totalSwordCost": total_swords,
        "totalSceptreCost": total_sceptres,
        "summary": summary or None,
    }


# ==========================================================================
# STANDARD GENERALS — 10 entrées
# ==========================================================================
# Quality tiers: bronze (3 skills), silver (4), gold (5), marshal (5, IAP only)
# hasTrainingPath = éligible au premium training Sword/Sceptre of Dominance

STANDARD_GENERALS = [
    {
        "slug": "guderian", "name": "Heinz Guderian", "nameEn": "Heinz Guderian",
        "faction": "standard", "category": "tank", "rank": "S", "quality": "gold",
        "country": "DE", "countryName": "Allemagne",
        "shortDesc": "Père de la Blitzkrieg et meilleur général blindé du jeu.",
        "longDesc": "Considéré comme le meilleur commandant de World Conqueror 4. Théoricien de la Blitzkrieg, il possède les trois meilleurs skills blindés du jeu. En tant que général Gold, il dispose de 5 slots de compétences. À placer sur un King Tiger, IS-3 ou M1A1 Abrams pour un effet maximal.",
        "skills": [
            skill(1, "Blitzkrieg", "Attaques de char +25%, mouvement amélioré."),
            skill(2, "Commandant blindé", "Bonus d'attaque et de défense sur tous les chars adjacents."),
            skill(3, "Percée mécanisée", "Unité mécanisée : bonus de pénétration — à vérifier."),
            skill(4, "Slot libre", "Compétence apprenable — fille l'emplacement avec la skill de ton choix (Machiniste, Rumeur, etc.).",
                  replaceable=True, reason="Slot ouvert — pool de skills apprenables via médailles à l'Académie"),
            skill(5, "Slot libre", "Deuxième emplacement apprenable — à confirmer in-game (5 slots pour Gold).",
                  replaceable=True, reason="Slot ouvert — à confirmer in-game si 4 ou 5 slots au total"),
        ],
        "attributes": attrs(),  # tous null tant que pas vérifié in-game
        "hasTrainingPath": True,
        "training": training_path(
            stages=[training_stage(1, label="Étape 1/1 — Gold unique")],
            summary="Guderian est Gold : une seule étape de training, coût à confirmer (élevé, ~10 sceptres + 200 épées selon communauté).",
        ),
        "acquisition": acq("medals", None, "medals", "Store — à confirmer en jeu (coût très élevé)"),
        "bonuses": [{"target": "Attaque char", "value": "+30%"}, {"target": "Défense char", "value": "+20%"}],
        "recommendedUnits": ["konigs-tiger", "is-3", "m1a1-abrams", "leopard-2"],
    },
    {
        "slug": "rommel", "name": "Erwin Rommel", "nameEn": "Erwin Rommel",
        "faction": "standard", "category": "tank", "rank": "S", "quality": "gold",
        "country": "DE", "countryName": "Allemagne",
        "shortDesc": "Le Renard du Désert — général blindé offensif-défensif.",
        "longDesc": "Rommel est un général tank de haute volée. Ses skills Feu Croisé et Assaut Blindé donnent des dégâts de contre-attaque supplémentaires et des bonus offensifs. Excellent sur Königs Tiger ou M26 Pershing. 5 slots de compétences (Gold).",
        "skills": [
            skill(1, "Feu Croisé", "Dégâts supplémentaires en contre-attaque quand attaqué."),
            skill(2, "Assaut Blindé", "Dégâts +15% pour toutes les attaques blindées."),
            skill(3, "Commandant du désert", "Bonus supplémentaire en terrain désertique."),
            skill(4, "Slot libre", "Emplacement apprenable — à remplir via l'Académie.",
                  replaceable=True, reason="Slot ouvert, pool learnable-skills"),
            skill(5, "Slot libre", "Deuxième emplacement apprenable — à confirmer.",
                  replaceable=True, reason="À confirmer : 4 ou 5 slots au total"),
        ],
        "attributes": attrs(),
        "hasTrainingPath": True,
        "training": training_path(
            stages=[training_stage(1, label="Étape 1/1 — Gold unique")],
            summary="Coût training à confirmer.",
        ),
        "acquisition": acq("medals", None, "medals", "Store — à confirmer"),
        "bonuses": [{"target": "Attaque char", "value": "+25%"}, {"target": "Contre-attaque", "value": "+30%"}],
        "recommendedUnits": ["konigs-tiger", "m26-pershing", "centurion"],
    },
    {
        "slug": "patton", "name": "George Patton", "nameEn": "George S. Patton",
        "faction": "standard", "category": "tank", "rank": "S", "quality": "gold",
        "country": "US", "countryName": "États-Unis",
        "shortDesc": "Général blindé américain agressif — tier S avec survivabilité.",
        "longDesc": "Patton est un général blindé top-tier de WC4. Offensive un peu moins pure que Rokossovsky mais bien meilleure survivabilité. Recommandé pour les chars lourds américains (M26 Pershing, M1A1 Abrams). Gold, 5 slots.",
        "skills": [
            skill(1, "Old Blood and Guts", "Bonus d'attaque permanent sur chars US."),
            skill(2, "Third Army", "Vitesse de déplacement améliorée."),
            skill(3, "Commandant vétéran", "HP max augmenté sur l'unité."),
            skill(4, "Slot libre", "Emplacement apprenable — à remplir via l'Académie.",
                  replaceable=True, reason="Slot ouvert"),
            skill(5, "Slot libre", "Deuxième emplacement apprenable — à confirmer.",
                  replaceable=True, reason="À confirmer"),
        ],
        "attributes": attrs(),
        "hasTrainingPath": True,
        "training": training_path(
            stages=[training_stage(1, swords=200, sceptres=10, label="Étape 1/1 — Gold")],
            total_swords=200, total_sceptres=10,
            summary="Patton : ~200 épées + 10 sceptres selon la communauté (à vérifier in-game).",
        ),
        "acquisition": acq("medals", None, "medals", "Store — à confirmer"),
        "bonuses": [{"target": "Attaque char", "value": "+20%"}, {"target": "HP char", "value": "+25%"}],
        "recommendedUnits": ["m26-pershing", "m1a1-abrams"],
    },
    {
        "slug": "rokossovsky", "name": "Konstantin Rokossovsky", "nameEn": "Konstantin Rokossovsky",
        "faction": "standard", "category": "tank", "rank": "S", "quality": "silver",
        "country": "RU", "countryName": "URSS",
        "shortDesc": "Meilleur général F2P après entraînement — débloque « Wipe Out the North ».",
        "longDesc": "Après entraînement, Rokossovsky est l'un des meilleurs généraux blindés F2P du jeu : la communauté le considère comme le meilleur choix free-to-play, avec Excellency Medal et le skill « Wipe Out the North » post-training. Silver (4 slots).",
        "skills": [
            skill(1, "Opération Bagration", "Bonus offensif massif sur secteur attaqué."),
            skill(2, "Commandement ferme", "Réduit les pertes alliées adjacentes."),
            skill(3, "Fer de lance", "Vitesse accrue en attaque."),
            skill(4, "Slot libre", "Emplacement apprenable — à remplir via l'Académie.",
                  replaceable=True, reason="Slot ouvert"),
        ],
        "attributes": attrs(),
        "hasTrainingPath": True,
        "training": training_path(
            stages=[
                training_stage(1, label="Silver → 1er palier", notes="Skills initiaux renforcés"),
                training_stage(2, label="2e palier", notes="Débloque « Wipe Out the North » (à vérifier au bon palier)"),
            ],
            total_swords=200, total_sceptres=10,
            summary="Silver = 2 étapes de training. Une fois Rokossovsky entièrement entraîné, il devient le meilleur général F2P du jeu d'après la communauté.",
        ),
        "acquisition": acq("medals", None, "medals", "Store — à confirmer"),
        "bonuses": [{"target": "Attaque char", "value": "+30%"}, {"target": "Défense char", "value": "+15%"}],
        "recommendedUnits": ["is-3", "t-72", "t-44"],
    },
    {
        "slug": "konev", "name": "Ivan Konev", "nameEn": "Ivan Konev",
        "faction": "standard", "category": "artillery", "rank": "S", "quality": "gold",
        "country": "RU", "countryName": "URSS",
        "shortDesc": "Meilleur général d'artillerie — l'équivalent de Guderian pour l'artillerie.",
        "longDesc": "Konev est pour l'artillerie ce que Guderian est pour les chars : la référence S-tier absolue. À pairer avec Schwerer Gustav, Topol-M ou M142 HIMARS pour optimiser les dégâts de frappe. Gold (5 slots).",
        "skills": [
            skill(1, "Maître canonnier", "+30% dégâts artillerie."),
            skill(2, "Tir de barrage", "+1 portée pour toute artillerie commandée."),
            skill(3, "Commandant des canons", "Réduction du cooldown de tir."),
            skill(4, "Slot libre", "Emplacement apprenable.",
                  replaceable=True, reason="Slot ouvert"),
            skill(5, "Slot libre", "Deuxième emplacement apprenable — à confirmer.",
                  replaceable=True, reason="À confirmer"),
        ],
        "attributes": attrs(),
        "hasTrainingPath": True,
        "training": training_path(
            stages=[training_stage(1, label="Étape 1/1 — Gold")],
            summary="Coût à confirmer.",
        ),
        "acquisition": acq("medals", None, "medals", "Store — à confirmer"),
        "bonuses": [{"target": "Attaque artillerie", "value": "+30%"}, {"target": "Portée", "value": "+1"}],
        "recommendedUnits": ["schwerer-gustav", "topol-m", "m142-himars"],
    },
    {
        "slug": "zhukov", "name": "Gueorgui Joukov", "nameEn": "Georgy Zhukov",
        "faction": "standard", "category": "balanced", "rank": "S", "quality": "marshal",
        "country": "RU", "countryName": "URSS",
        "shortDesc": "Maréchal IAP polyvalent — au niveau de Konev en appui-feu.",
        "longDesc": "Joukov est un maréchal (IAP, achat réel uniquement) polyvalent de premier rang, au niveau de Konev en appui-feu. Marshal (5 slots).",
        "skills": [
            skill(1, "Défense de Moscou", "Bonus défensif global sur secteur."),
            skill(2, "Rouleau compresseur", "Attaques massives coordonnées."),
            skill(3, "Maréchal de l'URSS", "Leadership général — bonus sur toute la faction soviétique."),
            skill(4, "Signature IAP", "Compétence premium supplémentaire — à vérifier.", replaceable=False),
            skill(5, "Slot libre", "Emplacement apprenable — à confirmer si Marshal a un slot libre.",
                  replaceable=True, reason="À confirmer : les Marshals IAP ont-ils un slot libre ?"),
        ],
        "attributes": attrs(),
        "hasTrainingPath": False,
        "training": None,
        "acquisition": acq("iron-cross", None, "iron-cross", "Marshal IAP — achat réel uniquement"),
        "bonuses": [{"target": "Attaque artillerie", "value": "+25%"}, {"target": "Défense globale", "value": "+15%"}],
        "recommendedUnits": ["bm-21-grad", "b-4-howitzer", "topol-m"],
    },
    {
        "slug": "donitz", "name": "Karl Dönitz", "nameEn": "Karl Dönitz",
        "faction": "standard", "category": "navy", "rank": "S", "quality": "gold",
        "country": "DE", "countryName": "Allemagne",
        "shortDesc": "Meilleur amiral de WC4 — spécialiste des sous-marins.",
        "longDesc": "Dönitz est « sans aucun doute le meilleur commandant naval » selon les tier lists communautaires. Spécialiste absolu des sous-marins (Type VII, Typhoon). Gold (5 slots).",
        "skills": [
            skill(1, "Meute de loups", "Sous-marins : attaque coordonnée +40%."),
            skill(2, "Guerre sous-marine", "Furtivité améliorée."),
            skill(3, "Amiral de la Kriegsmarine", "Bonus sur tous navires allemands."),
            skill(4, "Slot libre", "Emplacement apprenable.", replaceable=True, reason="Slot ouvert"),
            skill(5, "Slot libre", "Deuxième emplacement apprenable — à confirmer.",
                  replaceable=True, reason="À confirmer"),
        ],
        "attributes": attrs(),
        "hasTrainingPath": True,
        "training": training_path(
            stages=[training_stage(1, label="Étape 1/1 — Gold")],
            summary="Coût à confirmer.",
        ),
        "acquisition": acq("medals", None, "medals", "Store — à confirmer"),
        "bonuses": [{"target": "Attaque sous-marin", "value": "+40%"}, {"target": "Furtivité", "value": "+25%"}],
        "recommendedUnits": ["type-vii-uboat", "typhoon-submarine"],
    },
    {
        "slug": "yamaguchi", "name": "Tamon Yamaguchi", "nameEn": "Tamon Yamaguchi",
        "faction": "standard", "category": "navy", "rank": "S", "quality": "gold",
        "country": "JP", "countryName": "Japon",
        "shortDesc": "Amiral japonais polyvalent — aussi excellent en aviation.",
        "longDesc": "Yamaguchi est l'un des meilleurs amiraux du jeu et fonctionne également très bien comme général aviation (double usage). Gold (5 slots).",
        "skills": [
            skill(1, "Tactique navale", "Bonus d'attaque tous types navals."),
            skill(2, "Aviation embarquée", "Bonus sur avions lancés depuis carriers."),
            skill(3, "Bushidō naval", "Moral amélioré — réduction des pertes."),
            skill(4, "Slot libre", "Emplacement apprenable.", replaceable=True, reason="Slot ouvert"),
            skill(5, "Slot libre", "Deuxième emplacement apprenable — à confirmer.",
                  replaceable=True, reason="À confirmer"),
        ],
        "attributes": attrs(),
        "hasTrainingPath": True,
        "training": training_path(
            stages=[training_stage(1, label="Étape 1/1 — Gold")],
            summary="Coût à confirmer.",
        ),
        "acquisition": acq("medals", None, "medals", "Store — à confirmer"),
        "bonuses": [{"target": "Attaque navale", "value": "+25%"}, {"target": "Avion (depuis carrier)", "value": "+20%"}],
        "recommendedUnits": ["akagi", "enterprise-cv", "yukikaze"],
    },
    {
        "slug": "kuznetsov", "name": "Nikolaï Kouznetsov", "nameEn": "Nikolai Kuznetsov",
        "faction": "standard", "category": "navy", "rank": "S", "quality": "silver",
        "country": "RU", "countryName": "URSS",
        "shortDesc": "Après entraînement, meilleur amiral F2P de la marine soviétique.",
        "longDesc": "Une fois entièrement entraîné, Kouznetsov devient l'un des meilleurs amiraux F2P du jeu, au niveau de Cunningham et meilleur que Yamaguchi/Darlan. Silver (4 slots, 2 étapes de training).",
        "skills": [
            skill(1, "Flotte rouge", "Bonus offensif tous navires soviétiques."),
            skill(2, "Doctrine moderne", "Bonus supplémentaire sur navires modernes."),
            skill(3, "Commandant de la Baltique", "Défense navale améliorée."),
            skill(4, "Slot libre", "Emplacement apprenable.", replaceable=True, reason="Slot ouvert"),
        ],
        "attributes": attrs(),
        "hasTrainingPath": True,
        "training": training_path(
            stages=[
                training_stage(1, label="Silver → 1er palier"),
                training_stage(2, label="2e palier (forme finale)"),
            ],
            summary="2 étapes (silver). Training fortement recommandé par la communauté.",
        ),
        "acquisition": acq("medals", None, "medals", "Store — à confirmer"),
        "bonuses": [{"target": "Attaque navale", "value": "+30%"}, {"target": "HP naval", "value": "+20%"}],
        "recommendedUnits": ["typhoon-submarine", "arleigh-burke"],
    },
    {
        "slug": "montgomery", "name": "Bernard Montgomery", "nameEn": "Bernard Montgomery",
        "faction": "standard", "category": "infantry", "rank": "A", "quality": "silver",
        "country": "GB", "countryName": "Royaume-Uni",
        "shortDesc": "Commandant britannique, guerre d'infanterie méthodique.",
        "longDesc": "Montgomery est le général britannique qui a mené la Huitième Armée à El Alamein. Dans WC4 c'est un général infanterie/polyvalent A-tier. Silver (4 slots, 2 étapes de training).",
        "skills": [
            skill(1, "Plan méthodique", "Bonus défensif en position retranchée."),
            skill(2, "Huitième Armée", "Bonus sur infanterie du Commonwealth."),
            skill(3, "Commandement terrestre", "Leadership général — bonus adjacents."),
            skill(4, "Slot libre", "Emplacement apprenable.", replaceable=True, reason="Slot ouvert"),
        ],
        "attributes": attrs(),
        "hasTrainingPath": True,
        "training": training_path(
            stages=[
                training_stage(1, label="Silver → 1er palier"),
                training_stage(2, label="2e palier (forme finale)"),
            ],
            summary="2 étapes (silver).",
        ),
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
        "slug": "osborn", "name": "Osborn", "nameEn": "Osborn",
        "faction": "scorpion", "category": "balanced", "rank": "S", "quality": "gold",
        "country": "XX", "countryName": "Empire du Scorpion",
        "shortDesc": "Leader de l'Empire du Scorpion — ancien général britannique Alfred.",
        "longDesc": "Osborn est le chef de l'Empire du Scorpion (New World Order). Son identité originelle était Alfred, un général britannique non-recrutable qui apparaît dans la mission Dunkerque de l'événement Origin of the Scorpion Empire. Disponible dans le pack des trois généraux terroristes. Gold (5 slots).",
        "skills": [
            skill(1, "Commandant suprême", "Bonus massif sur toutes les unités mystiques."),
            skill(2, "Nouveau Monde", "Activation de capacités spéciales faction Scorpion."),
            skill(3, "Volonté du Scorpion", "Moral + leadership sur unités alliées."),
            skill(4, "Slot libre", "Emplacement apprenable — à confirmer si les capitaines Scorpion ont un slot libre.",
                  replaceable=True, reason="À confirmer — Scorpion gold slots"),
            skill(5, "Slot libre", "Deuxième emplacement apprenable — à confirmer.",
                  replaceable=True, reason="À confirmer"),
        ],
        "attributes": attrs(),
        "hasTrainingPath": False,
        "training": None,
        "acquisition": acq("campaign", None, None, "Pack des 3 généraux terroristes — campagne Modern War"),
        "bonuses": [{"target": "Unités Scorpion", "value": "+30%"}, {"target": "Moral", "value": "+25%"}],
        "recommendedUnits": ["titan-tank", "heavenly-beginning-tank", "mystic-bomber"],
    },
    {
        "slug": "williams", "name": "Williams", "nameEn": "Williams",
        "faction": "scorpion", "category": "artillery", "rank": "S", "quality": "gold",
        "country": "XX", "countryName": "Empire du Scorpion",
        "shortDesc": "Capitaine de l'Empire du Scorpion, concepteur du KS-90.",
        "longDesc": "Williams est l'un des trois capitaines de l'Empire du Scorpion, avec Osborn et Colson. Selon le lore, il a conçu et produit le KS-90, l'artillerie automotrice d'élite mystique. Gold (5 slots).",
        "skills": [
            skill(1, "Ingénieur mystique", "Bonus spécial sur KS-90 et artilleries Scorpion."),
            skill(2, "Nano-technologie", "Récupération HP 3%/tour pour unités contrôlées."),
            skill(3, "Concepteur d'élite", "Vitesse de production des unités spéciales accrue."),
            skill(4, "Slot libre", "Emplacement apprenable — à confirmer.",
                  replaceable=True, reason="À confirmer"),
            skill(5, "Slot libre", "Deuxième emplacement apprenable — à confirmer.",
                  replaceable=True, reason="À confirmer"),
        ],
        "attributes": attrs(),
        "hasTrainingPath": False,
        "training": None,
        "acquisition": acq("campaign", None, None, "Pack des 3 généraux terroristes"),
        "bonuses": [{"target": "Attaque KS-90", "value": "+35%"}, {"target": "Récupération HP", "value": "+3%/tour"}],
        "recommendedUnits": ["ks-90", "e-775"],
    },
    {
        "slug": "colson", "name": "Colson", "nameEn": "Colson",
        "faction": "scorpion", "category": "tank", "rank": "S", "quality": "gold",
        "country": "XX", "countryName": "Empire du Scorpion",
        "shortDesc": "Troisième capitaine de l'Empire du Scorpion.",
        "longDesc": "Colson est le troisième capitaine de l'Empire du Scorpion, aux côtés d'Osborn et Williams. Rôle exact et skills à confirmer in-game — probablement associé aux unités blindées Scorpion. Gold (5 slots).",
        "skills": [
            skill(1, "Commandant blindé mystique", "Bonus sur chars Scorpion."),
            skill(2, "Défense du Scorpion", "Réduction de dégâts sur unités alliées."),
            skill(3, "Assaut mystique", "Vitesse offensive accrue."),
            skill(4, "Slot libre", "Emplacement apprenable — à confirmer.",
                  replaceable=True, reason="À confirmer"),
            skill(5, "Slot libre", "Deuxième emplacement apprenable — à confirmer.",
                  replaceable=True, reason="À confirmer"),
        ],
        "attributes": attrs(),
        "hasTrainingPath": False,
        "training": None,
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
        "quality": g["quality"],
        "country": g["country"],
        "countryName": g["countryName"],
        "shortDesc": g["shortDesc"],
        "longDesc": g["longDesc"],
        "skills": g["skills"],
        "attributes": g["attributes"],
        "hasTrainingPath": g["hasTrainingPath"],
        "training": g["training"],
        "acquisition": g["acquisition"],
        "bonuses": g["bonuses"],
        "recommendedUnits": g["recommendedUnits"],
        "verified": False,
        "sources": SOURCES,
    }


def main():
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
            "quality": g["quality"],
            "country": g["country"],
            "hasTrainingPath": g["hasTrainingPath"],
            "hasReplaceableSkills": any(s.get("replaceable") for s in g["skills"]),
            "acquisition": g["acquisition"]["type"],
        }
        for g in all_gens
    ]
    (OUT / "_index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2))

    std = sum(1 for g in all_gens if g["faction"] == "standard")
    scor = sum(1 for g in all_gens if g["faction"] == "scorpion")
    train_count = sum(1 for g in all_gens if g["hasTrainingPath"])
    repl_count = sum(1 for g in all_gens if any(s.get("replaceable") for s in g["skills"]))
    print(f"✓ Generated {len(all_gens)} generals ({std} standard + {scor} scorpion)")
    print(f"  {train_count} with premium training path (sword/sceptre)")
    print(f"  {repl_count} with at least one replaceable (vote-eligible) skill slot")


if __name__ == "__main__":
    main()
