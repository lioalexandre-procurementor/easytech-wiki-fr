#!/usr/bin/env python3
"""Backfill `longDescEn` / `longDescDe` sibling fields on elite units."""

from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UNIT_DIR = ROOT / "data" / "wc4" / "elite-units"

FREEFORM: dict[str, tuple[str, str]] = {
    "A participé à la chasse au Bismarck avant d'être coulé par l'aviation japonaise en 1941. Canons 14 pouces.": (
        "Took part in the hunt for the Bismarck before being sunk by Japanese aircraft in 1941. 14-inch guns.",
        "Nahm an der Jagd auf die Bismarck teil, bevor sie 1941 von japanischen Flugzeugen versenkt wurde. 14-Zoll-Geschütze.",
    ),
    "Artillerie automotrice d'élite mystique, conçue et produite par Williams, l'un des trois capitaines de l'Empire du Scorpion. 8 roues, scorpion noir sur les canons et la coque. Capacités : nano-récupération (3% HP/tour), coup critique, assault.": (
        "Mystic elite self-propelled artillery, designed and built by Williams, one of the three captains of the Scorpion Empire. 8 wheels, black scorpion marking on the guns and hull. Abilities: nano-recovery (3% HP/turn), critical hit, assault.",
        "Mystische Elite-Selbstfahrlafette, entworfen und produziert von Williams, einem der drei Hauptmänner des Skorpion-Imperiums. 8 Räder, schwarzes Skorpion-Emblem auf Geschützen und Rumpf. Fähigkeiten: Nano-Erholung (3% HP/Zug), kritischer Treffer, Angriff.",
    ),
    "Avion de transport allié emblématique. Unité support : permet de larguer des parachutistes derrière les lignes.": (
        "Iconic Allied transport aircraft. Support unit: allows paratrooper drops behind enemy lines.",
        "Ikonisches alliiertes Transportflugzeug. Unterstützungseinheit: ermöglicht den Absprung von Fallschirmjägern hinter den feindlichen Linien.",
    ),
    "Bombardier d'élite des Mystic Forces. Disponible dans la mission finale du challenge 1960 Mysterious Forces of Challenge Conquest. Haute puissance de frappe air-sol.": (
        "Mystic Forces elite bomber. Available in the final mission of the 1960 Mysterious Forces of Challenge Conquest challenge. High air-to-ground strike power.",
        "Elite-Bomber der Mystic Forces. Verfügbar in der Abschlussmission des 1960 Mysterious Forces of Challenge Conquest-Challenges. Hohe Luft-Boden-Schlagkraft.",
    ),
    "Bombardier en piqué allemand reconnaissable à ses ailes inversées et à sa sirène Jericho. Dégâts bonus contre unités au sol. À ne pas confondre avec l'artillerie Stuka zu Fuss.": (
        "German dive bomber recognizable by its inverted gull wings and Jericho siren. Bonus damage against ground units. Not to be confused with the Stuka zu Fuß rocket artillery.",
        "Deutscher Sturzkampfbomber, erkennbar an seinen Knickflügeln und der Jericho-Sirene. Bonus-Schaden gegen Bodeneinheiten. Nicht zu verwechseln mit der Raketenartillerie Stuka zu Fuß.",
    ),
    "Bombardier lourd à 8 réacteurs, USAF depuis 1955. Capacité d'emport 31 tonnes. Frappe longue portée stratégique.": (
        "Eight-engine heavy bomber, in USAF service since 1955. 31-ton payload capacity. Long-range strategic strike.",
        "Achtstrahliger schwerer Bomber, seit 1955 bei der USAF im Einsatz. 31 Tonnen Zuladung. Strategischer Langstreckeneinsatz.",
    ),
    "Canon 125mm lisse, chargeur automatique. Unité d'élite moderne accessible dans Cold War et Modern War.": (
        "125mm smoothbore gun with autoloader. Modern elite unit available in Cold War and Modern War scenarios.",
        "125-mm-Glattrohrkanone mit Ladeautomat. Moderne Elite-Einheit, verfügbar in Cold War- und Modern War-Szenarien.",
    ),
    "Canon ferroviaire de 800mm. Dégâts dévastateurs mais mobilité quasi-nulle. Usage siège uniquement.": (
        "800mm railway gun. Devastating damage but near-zero mobility. Siege use only.",
        "800-mm-Eisenbahngeschütz. Verheerender Schaden, aber kaum Mobilität. Nur im Belagerungseinsatz.",
    ),
    "Chasseur américain début WWII. Célèbre pour ses décorations de gueule de requin chez les Flying Tigers (AVG).": (
        "Early-WWII American fighter. Famous for the shark-mouth nose art of the Flying Tigers (AVG).",
        "Amerikanisches Jagdflugzeug des frühen Zweiten Weltkriegs. Berühmt für das Haifischmaul-Nose-Art der Flying Tigers (AVG).",
    ),
    "Chasseur britannique emblématique de la WWII. Plus de 20 000 unités produites.": (
        "Iconic British WWII fighter. More than 20,000 units produced.",
        "Ikonisches britisches Jagdflugzeug des Zweiten Weltkriegs. Mehr als 20 000 Einheiten produziert.",
    ),
    "Chasseur multirôle génération 4.5 dérivé du Su-27 Flanker. Poussée vectorielle, radar puissant, missiles R-77.": (
        "4.5-generation multirole fighter derived from the Su-27 Flanker. Thrust vectoring, powerful radar, R-77 missiles.",
        "Mehrzweck-Kampfflugzeug der 4,5. Generation, vom Su-27 Flanker abgeleitet. Schubvektorsteuerung, leistungsstarkes Radar, R-77-Raketen.",
    ),
    "Classe de destroyers lance-missiles de l'US Navy depuis 1991. Système Aegis, Tomahawk et Standard.": (
        "US Navy guided-missile destroyer class in service since 1991. Aegis system, Tomahawk and Standard missiles.",
        "Lenkwaffenzerstörer-Klasse der US Navy seit 1991. Aegis-System, Tomahawk- und Standard-Raketen.",
    ),
    "Construit des fortifications, répare les unités amies, franchit les zones minées. Indispensable en siège.": (
        "Builds fortifications, repairs friendly units, crosses minefields. Indispensable in siege operations.",
        "Errichtet Befestigungen, repariert befreundete Einheiten, überquert Minenfelder. Unverzichtbar bei Belagerungen.",
    ),
    "Célèbre pour avoir survécu à presque toutes les batailles majeures du Pacifique. Très forte esquive et vitesse.": (
        "Famous for surviving almost every major Pacific battle. Very high evasion and speed.",
        "Berühmt dafür, fast jede größere Pazifikschlacht überlebt zu haben. Sehr hohe Ausweichrate und Geschwindigkeit.",
    ),
    "Développé en 1944 pour remplacer le T-34, le T-44 est une unité d'élite WC4 classée char médian avancé. Combine mobilité et blindage.": (
        "Developed in 1944 to replace the T-34, the T-44 is a WC4 elite unit classified as an advanced medium tank. Combines mobility and armor.",
        "1944 als Ersatz für den T-34 entwickelt, ist der T-44 eine WC4-Elite-Einheit, eingestuft als fortgeschrittener mittlerer Panzer. Kombiniert Mobilität und Panzerung.",
    ),
    "Entre en service début 1945 pour contrer les Tiger et Panther. Unité d'élite polyvalente, bon compromis entre offensive et durabilité.": (
        "Entered service in early 1945 to counter the Tiger and Panther. Balanced elite unit, a good compromise between offense and durability.",
        "Anfang 1945 in Dienst gestellt, um Tiger und Panther zu begegnen. Ausgewogene Elite-Einheit, guter Kompromiss zwischen Offensive und Haltbarkeit.",
    ),
    "Entre en service en 1979 et reste l'un des meilleurs MBT au monde. S-tier pour les scénarios modernes.": (
        "Entered service in 1979 and remains one of the best MBTs in the world. S-tier for modern scenarios.",
        "1979 in Dienst gestellt und nach wie vor einer der besten Kampfpanzer der Welt. S-Tier für moderne Szenarien.",
    ),
    "Fortement recommandé dès que possible. Seule unité qui active véritablement le mécanisme de guérison. À maxer en priorité.": (
        "Strongly recommended as early as possible. The only unit that truly activates the healing mechanic. Prioritize maxing it.",
        "Wird so früh wie möglich dringend empfohlen. Die einzige Einheit, die den Heilungsmechanismus wirklich aktiviert. Sollte mit Priorität maximiert werden.",
    ),
    "GCT AuF1 : obusier automoteur 155mm développé dans les années 1970. Bonne mobilité et portée.": (
        "GCT AuF1: 155mm self-propelled howitzer developed in the 1970s. Good mobility and range.",
        "GCT AuF1: 155-mm-Selbstfahrhaubitze, entwickelt in den 1970er Jahren. Gute Mobilität und Reichweite.",
    ),
    "Hélicoptère d'assaut soviétique, surnommé « char volant ». Unique dans sa catégorie : attaque + transport léger.": (
        "Soviet assault helicopter, nicknamed \"the flying tank\". Unique in its category: attack + light transport.",
        "Sowjetischer Angriffshubschrauber, Spitzname „fliegender Panzer“. Einzigartig in seiner Kategorie: Angriff + leichter Transport.",
    ),
    "Hélicoptère d'attaque principal US Army depuis 1986. Missiles Hellfire, canon 30mm, systèmes de visée avancés.": (
        "Primary US Army attack helicopter since 1986. Hellfire missiles, 30mm cannon, advanced targeting systems.",
        "Haupt-Kampfhubschrauber der US Army seit 1986. Hellfire-Raketen, 30-mm-Kanone, moderne Zielerfassung.",
    ),
    "ICBM russe à tête nucléaire, service 1997. Portée maximale, dégâts dévastateurs, usage très limité.": (
        "Russian nuclear-tipped ICBM, in service since 1997. Maximum range, devastating damage, very limited usage.",
        "Russische interkontinentale Atomrakete, seit 1997 im Dienst. Maximale Reichweite, verheerender Schaden, sehr begrenzter Einsatz.",
    ),
    "L'IS-3 est apparu fin 1945. Équivalent du King Tiger, qu'il surpasse parfois en pool de PV. Canon 122mm redoutable.": (
        "The IS-3 appeared in late 1945. Roughly the equivalent of the King Tiger, which it sometimes surpasses in HP pool. Formidable 122mm gun.",
        "Der IS-3 kam Ende 1945 in den Einsatz. Etwa gleichwertig zum Königstiger, den er im HP-Pool teilweise übertrifft. Beeindruckende 122-mm-Kanone.",
    ),
    "L'un des canons les plus polyvalents de la WWII. Double usage AA / anti-blindé.": (
        "One of the most versatile guns of WWII. Dual-role anti-aircraft / anti-armor.",
        "Eine der vielseitigsten Kanonen des Zweiten Weltkriegs. Doppelrolle als Flak und Panzerabwehr.",
    ),
    "Lance-roquettes WWII monté sur demi-chenille Sd.Kfz.251. Artillerie d'élite à dégâts explosifs.": (
        "WWII rocket launcher mounted on an Sd.Kfz.251 half-track. Elite artillery with explosive damage.",
        "Raketenwerfer des Zweiten Weltkriegs auf einem Sd.Kfz.251-Halbkettenfahrzeug. Elite-Artillerie mit Explosivschaden.",
    ),
    "Lance-roquettes moderne haute précision (GMLRS GPS, ATACMS). S-tier incontournable fin de campagne.": (
        "Modern high-precision rocket launcher (GMLRS GPS, ATACMS). Unmissable S-tier for late campaign.",
        "Moderner hochpräziser Raketenwerfer (GMLRS GPS, ATACMS). Unverzichtbarer S-Tier für die späte Kampagne.",
    ),
    "Lance-roquettes multiples 122mm monté sur camion Ural-375D. Cadence de tir dévastatrice, dégâts de zone.": (
        "122mm multiple rocket launcher mounted on a Ural-375D truck. Devastating rate of fire and area damage.",
        "122-mm-Mehrfachraketenwerfer auf einem Ural-375D-Lkw. Verheerende Feuerrate, Flächenschaden.",
    ),
    "Le Centurion (A41) est le premier char de combat principal au monde. Unité d'élite polyvalente : mobilité, blindage, canon 20-pdr/105mm.": (
        "The Centurion (A41) is the world's first main battle tank. Balanced elite unit: mobility, armor, 20-pdr/105mm gun.",
        "Der Centurion (A41) ist der erste Kampfpanzer der Welt. Ausgewogene Elite-Einheit: Mobilität, Panzerung, 20-Pfünder-/105-mm-Kanone.",
    ),
    "Le Königs Tiger (Tiger II) est une Elite Force recrutable une fois par bataille. Au même niveau que l'IS-3, blindage et canon 88mm L/71 redoutables.": (
        "The King Tiger (Tiger II) is an Elite Force recruitable once per battle. On par with the IS-3, with formidable armor and an 88mm L/71 gun.",
        "Der Königstiger (Tiger II) ist eine Elite-Einheit, die einmal pro Schlacht rekrutiert werden kann. Auf Augenhöhe mit dem IS-3, mit beeindruckender Panzerung und 88-mm-L/71-Kanone.",
    ),
    "Mentionné dans la liste NamuWiki des tanks d'élite WC4. Origines et stats exactes à confirmer in-game.": (
        "Listed on NamuWiki's WC4 elite tanks. Exact origin and stats to be confirmed in-game.",
        "Auf NamuWikis Liste der WC4-Elite-Panzer aufgeführt. Genaue Herkunft und Werte im Spiel noch zu bestätigen.",
    ),
    "Navire de tête de la dernière classe de cuirassés français. Huit canons 380mm en deux tourelles quadruples avant.": (
        "Lead ship of the last class of French battleships. Eight 380mm guns in two forward quadruple turrets.",
        "Typschiff der letzten Klasse französischer Schlachtschiffe. Acht 380-mm-Geschütze in zwei vorderen Vierlingstürmen.",
    ),
    "Obusier 203mm de l'Armée Rouge dès 1934. Utilisé contre fortifications et positions enterrées.": (
        "203mm Red Army howitzer in service from 1934. Used against fortifications and entrenched positions.",
        "203-mm-Haubitze der Roten Armee ab 1934. Eingesetzt gegen Befestigungen und eingegrabene Stellungen.",
    ),
    "Obusier automoteur WWII. Artillerie d'élite à mobilité élevée, bonne pour l'appui-feu dans les premiers scénarios WW2.": (
        "WWII self-propelled howitzer. Elite artillery with high mobility, good for fire support in early WW2 scenarios.",
        "Selbstfahrhaubitze aus dem Zweiten Weltkrieg. Elite-Artillerie mit hoher Mobilität, geeignet für Feuerunterstützung in frühen WW2-Szenarien.",
    ),
    "Parmi les meilleures unités d'infanterie du jeu. Haute attaque, esquive importante, capacité d'infiltration.": (
        "Among the best infantry units in the game. High attack, strong evasion, infiltration ability.",
        "Zählt zu den besten Infanterieeinheiten des Spiels. Hoher Angriff, starke Ausweichrate, Infiltrationsfähigkeit.",
    ),
    "Porte-avions classe Yorktown, « The Big E ». Navire le plus décoré de l'US Navy pendant la WWII (20 Battle Stars).": (
        "Yorktown-class aircraft carrier, \"The Big E\". Most decorated US Navy ship of WWII (20 Battle Stars).",
        "Flugzeugträger der Yorktown-Klasse, „The Big E“. Am höchsten dekoriertes US-Navy-Schiff des Zweiten Weltkriegs (20 Battle Stars).",
    ),
    "Porte-avions lourd japonais, navire amiral de la Kido Butai à Pearl Harbor en 1941. Capacité de lancer des raids aériens.": (
        "Heavy Japanese aircraft carrier, flagship of the Kido Butai at Pearl Harbor in 1941. Capable of launching air raids.",
        "Schwerer japanischer Flugzeugträger, Flaggschiff der Kido Butai bei Pearl Harbor 1941. Kann Luftangriffe starten.",
    ),
    "Premier avion de combat opérationnel à décollage vertical. Célèbre pour son rôle aux Malouines.": (
        "The first operational VTOL combat aircraft. Famous for its role in the Falklands War.",
        "Das erste einsatzfähige VTOL-Kampfflugzeug. Berühmt für seine Rolle im Falklandkrieg.",
    ),
    "Projekt 941 Akula (code OTAN Typhoon). Sous-marin nucléaire lanceur d'engins soviétique. Capacité de frappe stratégique.": (
        "Project 941 Akula (NATO reporting name Typhoon). Soviet nuclear ballistic-missile submarine. Strategic strike capability.",
        "Projekt 941 Akula (NATO-Codename Typhoon). Sowjetisches atomgetriebenes Raketen-U-Boot. Strategische Schlagkraft.",
    ),
    "Représente la Division Brandenburg, forces spéciales allemandes WWII spécialisées dans l'infiltration. Bonus en terrain varié.": (
        "Represents the Brandenburg Division, German WWII special forces specialized in infiltration. Bonuses on varied terrain.",
        "Vertritt die Division Brandenburg, eine auf Infiltration spezialisierte deutsche Spezialeinheit des Zweiten Weltkriegs. Boni in wechselndem Gelände.",
    ),
    "Soldat d'élite spécialisé anti-blindé. Équipé de lance-roquettes RPG-7. Rôle escorte urbaine contre mécanisés.": (
        "Elite anti-armor specialist soldier. Equipped with RPG-7 rocket launchers. Urban escort role against mechanized forces.",
        "Anti-Panzer-Spezialist der Elite. Ausgerüstet mit RPG-7-Raketenwerfern. Rolle als städtische Eskorte gegen mechanisierte Kräfte.",
    ),
    "Sous-marin le plus produit de l'histoire (~700 unités). Colonne vertébrale de la Bataille de l'Atlantique. Furtivité et dégâts de torpille élevés.": (
        "The most-produced submarine in history (~700 built). Backbone of the Battle of the Atlantic. High stealth and torpedo damage.",
        "Das meistgebaute U-Boot der Geschichte (~700 Einheiten). Rückgrat der Atlantikschlacht. Hohe Tarnung und hoher Torpedoschaden.",
    ),
    "Spécialisée dans la reconnaissance : portée de vision étendue et bonus d'esquive, utile en terrain inconnu.": (
        "Specialized in reconnaissance: extended vision range and evasion bonus, useful in unknown terrain.",
        "Auf Aufklärung spezialisiert: erweiterte Sichtweite und Ausweich-Bonus, nützlich in unbekanntem Gelände.",
    ),
    "Super char des Mystic Forces (Empire du Scorpion). Apparaît en fin de challenge 1960 Conquest et certains événements.": (
        "Mystic Forces (Scorpion Empire) super tank. Appears at the end of the 1960 Conquest challenge and in select events.",
        "Superpanzer der Mystic Forces (Skorpion-Imperium). Erscheint am Ende der 1960 Conquest-Challenge und in ausgewählten Events.",
    ),
    "Troupes de montagne italiennes. Bonus significatifs en terrain montagneux et mobilité améliorée sur collines.": (
        "Italian mountain troops. Significant bonuses on mountainous terrain and improved mobility on hills.",
        "Italienische Gebirgstruppen. Erhebliche Boni in Gebirgsgelände und verbesserte Mobilität auf Hügeln.",
    ),
    "Turbine à gaz, canon 120mm lisse, blindage composite Chobham. Unité d'élite de référence dans les scénarios modernes.": (
        "Gas turbine, 120mm smoothbore gun, Chobham composite armor. Benchmark elite unit for modern scenarios.",
        "Gasturbine, 120-mm-Glattrohrkanone, Chobham-Verbundpanzerung. Maßstäbe setzende Elite-Einheit in modernen Szenarien.",
    ),
    "Unité blindée introduite dans le scénario Modern War, exclusive aux forces terroristes. Seul super tank empilable du jeu, particulièrement durable. Puissant mais inférieur aux blindés Elite Forces les plus avancés.": (
        "Armor unit introduced in the Modern War scenario, exclusive to the terrorist forces. The only stackable super tank in the game and especially durable. Powerful but weaker than the most advanced Elite Forces armor.",
        "Im Modern-War-Szenario eingeführte Panzereinheit, exklusiv für die Terror-Kräfte. Der einzige stapelbare Superpanzer des Spiels und besonders widerstandsfähig. Mächtig, aber schwächer als die fortschrittlichsten Panzer der Elite Forces.",
    ),
    "Unité d'infanterie d'élite des Mystic Forces. Déployable en parachute derrière les lignes. Capacités signature liées à l'infiltration.": (
        "Mystic Forces elite infantry unit. Can be paratroop-dropped behind enemy lines. Signature abilities tied to infiltration.",
        "Elite-Infanterie der Mystic Forces. Kann per Fallschirm hinter den feindlichen Linien abgesetzt werden. Signature-Fähigkeiten rund um Infiltration.",
    ),
    "Unité d'élite mystique. Caractéristiques : Nano-récupération, Suppression (–30% moral ennemi après élimination), mitrailleuses, supériorité aérienne, évasion. Unité à lévitation, portée 2.": (
        "Mystic elite unit. Features: Nano-recovery, Suppression (–30% enemy morale after kill), machine guns, air superiority, evasion. Levitating unit, range 2.",
        "Mystische Elite-Einheit. Merkmale: Nano-Erholung, Unterdrückung (–30 % gegnerische Moral nach Ausschaltung), Maschinengewehre, Luftüberlegenheit, Ausweichen. Schwebende Einheit, Reichweite 2.",
    ),
    "Version stratégique longue portée du Mystic Bomber. Frappe de zone, portée maximale, usage très limité par partie.": (
        "Long-range strategic variant of the Mystic Bomber. Area strike, maximum range, very limited usage per match.",
        "Strategische Langstreckenvariante des Mystic Bomber. Flächenschlag, maximale Reichweite, sehr begrenzte Einsätze pro Partie.",
    ),
    "Véhicule blindé des Mystic Forces. Configuration 4 roues, scorpion noir sur le corps uniquement (pas sur les canons, contrairement au KS-90).": (
        "Mystic Forces armored vehicle. 4-wheel configuration, black scorpion marking on the body only (not on the guns, unlike the KS-90).",
        "Gepanzertes Fahrzeug der Mystic Forces. 4-Rad-Konfiguration, schwarzes Skorpion-Emblem nur am Rumpf (nicht an den Geschützen, anders als beim KS-90).",
    ),
}


def main() -> int:
    files = sorted(UNIT_DIR.glob("*.json"))
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
        if fr not in FREEFORM:
            missing.append(f"{fp.name}: {fr[:80]}")
            continue
        en, de = FREEFORM[fr]
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
