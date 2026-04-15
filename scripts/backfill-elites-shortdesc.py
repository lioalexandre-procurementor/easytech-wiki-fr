#!/usr/bin/env python3
"""
Backfill locale-specific `shortDescEn` / `shortDescDe` fields on every
elite unit JSON. Uses a hand-curated FR → (EN, DE) translation table
since elite shortDesc are mostly bespoke freeform strings.
"""

from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UNIT_DIR = ROOT / "data" / "wc4" / "elite-units"

FREEFORM: dict[str, tuple[str, str]] = {
    "Artillerie automotrice scorpion conçue par Williams — 8 roues.": (
        "Scorpion self-propelled artillery designed by Williams — 8-wheeled.",
        "Scorpion-Selbstfahrlafette, entworfen von Williams — 8-rädrig.",
    ),
    "Avion de combat britannique à décollage vertical (VTOL).": (
        "British VTOL combat aircraft (vertical take-off and landing).",
        "Britisches VTOL-Kampfflugzeug (Senkrechtstarter).",
    ),
    "Avion de transport américain, largage de parachutistes.": (
        "American transport aircraft, paratrooper drops.",
        "US-Transportflugzeug, Fallschirmjäger-Absetzung.",
    ),
    "Aéronef à lévitation scorpion — mitrailleuses + supériorité aérienne.": (
        "Scorpion levitating aircraft — machine guns + air superiority.",
        "Schwebendes Skorpion-Fluggerät — Maschinengewehre + Luftüberlegenheit.",
    ),
    "Bombardier en piqué allemand — la sirène qui terrorisait l'Europe.": (
        "German dive bomber — the siren that terrorized Europe.",
        "Deutscher Sturzkampfbomber — die Sirene, die Europa in Angst versetzte.",
    ),
    "Bombardier lourd stratégique américain — service depuis 1955.": (
        "American strategic heavy bomber — in service since 1955.",
        "Amerikanischer strategischer Schwerbomber — im Dienst seit 1955.",
    ),
    "Bombardier mystique scorpion — unité aérienne fin de campagne.": (
        "Scorpion mystic bomber — late-campaign air unit.",
        "Mystischer Skorpion-Bomber — späte Kampagnenluft-Einheit.",
    ),
    "Bombardier stratégique mystique — version longue portée du Mystic Bomber.": (
        "Mystic strategic bomber — long-range variant of the Mystic Bomber.",
        "Mystischer strategischer Bomber — Langstrecken-Variante des Mystic Bomber.",
    ),
    "Canon anti-aérien allemand 88mm, redoutable anti-char également.": (
        "German 88mm anti-aircraft gun, also a formidable anti-tank weapon.",
        "Deutsche 88-mm-Flak, zugleich eine gefürchtete Panzerabwehrwaffe.",
    ),
    "Canon automoteur français 155mm sur châssis AMX-30.": (
        "French 155mm self-propelled gun on an AMX-30 chassis.",
        "Französische 155-mm-Selbstfahrlafette auf AMX-30-Fahrgestell.",
    ),
    "Char d'élite secondaire accessible via événement — détails à vérifier in-game.": (
        "Secondary elite tank unlocked through an event — details to verify in-game.",
        "Sekundärer Elite-Panzer, per Event freigeschaltet — Details im Spiel zu prüfen.",
    ),
    "Char lourd américain de fin de WWII, équilibré attaque/défense.": (
        "Late-WWII American heavy tank, balanced attack/defense.",
        "US-Schwerpanzer aus dem späten Zweiten Weltkrieg, ausgewogen in Angriff/Verteidigung.",
    ),
    "Char lourd soviétique à tourelle ogivale — une des meilleures unités blindées.": (
        "Soviet heavy tank with an ogival turret — one of the best armor units.",
        "Sowjetischer schwerer Panzer mit ogivalem Turm — eine der besten Panzereinheiten.",
    ),
    "Char moyen soviétique de fin de guerre, précurseur du T-54.": (
        "Late-war Soviet medium tank, forerunner of the T-54.",
        "Sowjetischer mittlerer Panzer der späten Kriegsjahre, Vorläufer des T-54.",
    ),
    "Chasseur américain célèbre avec les Flying Tigers en Chine.": (
        "American fighter made famous by the Flying Tigers in China.",
        "Amerikanisches Jagdflugzeug, berühmt durch die Flying Tigers in China.",
    ),
    "Chasseur britannique légendaire de la Bataille d'Angleterre.": (
        "Legendary British fighter of the Battle of Britain.",
        "Legendäres britisches Jagdflugzeug der Luftschlacht um England.",
    ),
    "Chasseur multirôle russe Flanker — supériorité aérienne 4.5G.": (
        "Russian Flanker multirole fighter — 4.5G air superiority.",
        "Russischer Flanker-Mehrzweckjäger — Luftüberlegenheit der 4,5. Generation.",
    ),
    "Chasseurs alpins italiens, experts du terrain montagneux.": (
        "Italian alpine troops, experts on mountainous terrain.",
        "Italienische Alpini, Experten für Gebirgsgelände.",
    ),
    "Cuirassé britannique classe King George V, canons 356mm.": (
        "British King George V-class battleship, 356mm guns.",
        "Britisches Schlachtschiff der King-George-V-Klasse, 356-mm-Geschütze.",
    ),
    "Cuirassé français de la classe Richelieu, huit canons 380mm.": (
        "French Richelieu-class battleship, eight 380mm guns.",
        "Französisches Schlachtschiff der Richelieu-Klasse, acht 380-mm-Geschütze.",
    ),
    "Destroyer japonais classe Kagero — « le destroyer chanceux ».": (
        "Japanese Kagero-class destroyer — \"the lucky destroyer\".",
        "Japanischer Zerstörer der Kagero-Klasse — „der glückliche Zerstörer“.",
    ),
    "Destroyer lance-missiles américain — standard OTAN moderne.": (
        "American guided-missile destroyer — modern NATO standard.",
        "Amerikanischer Lenkwaffenzerstörer — moderner NATO-Standard.",
    ),
    "Force fantôme — unité d'élite furtive à haute létalité.": (
        "Ghost force — stealthy elite unit with high lethality.",
        "Geistertruppe — getarnte Elite-Einheit mit hoher Letalität.",
    ),
    "Forces spéciales allemandes WWII — sabotage et infiltration.": (
        "German WWII special forces — sabotage and infiltration.",
        "Deutsche Spezialkräfte des Zweiten Weltkriegs — Sabotage und Infiltration.",
    ),
    "Hélicoptère d'attaque américain moderne — précision anti-char.": (
        "Modern American attack helicopter — precision anti-tank.",
        "Moderner amerikanischer Kampfhubschrauber — Präzisions-Panzerabwehr.",
    ),
    "Hélicoptère d'attaque soviétique — « le char volant ».": (
        "Soviet attack helicopter — \"the flying tank\".",
        "Sowjetischer Kampfhubschrauber — „der fliegende Panzer“.",
    ),
    "Infanterie anti-char équipée de lance-roquettes RPG.": (
        "Anti-tank infantry equipped with RPG rocket launchers.",
        "Panzerabwehr-Infanterie mit RPG-Raketenwerfern.",
    ),
    "Infirmier de combat — unique source de soin en jeu, indispensable tôt.": (
        "Combat medic — the only in-game healing source, essential early on.",
        "Sanitätssoldat — einzige Heilquelle im Spiel, früh unverzichtbar.",
    ),
    "Lance-roquettes américain guidé GPS, mobilité shoot-and-scoot.": (
        "GPS-guided American rocket launcher, shoot-and-scoot mobility.",
        "GPS-gesteuerter amerikanischer Raketenwerfer, Shoot-and-Scoot-Mobilität.",
    ),
    "Lance-roquettes multiples soviétique 122mm, 40 tubes.": (
        "Soviet 122mm multiple rocket launcher, 40 tubes.",
        "Sowjetischer 122-mm-Mehrfachraketenwerfer, 40 Rohre.",
    ),
    "MBT allemand moderne, canon 120mm lisse Rheinmetall.": (
        "Modern German MBT, Rheinmetall 120mm smoothbore gun.",
        "Moderner deutscher Kampfpanzer, Rheinmetall-120-mm-Glattrohrkanone.",
    ),
    "MBT américain — référence des chars modernes.": (
        "American MBT — the benchmark for modern tanks.",
        "Amerikanischer Kampfpanzer — Maßstab moderner Panzer.",
    ),
    "MBT soviétique emblématique de la guerre froide, produit en masse.": (
        "Iconic Soviet Cold War MBT, mass-produced.",
        "Ikonischer sowjetischer Kampfpanzer des Kalten Krieges, in Serie gefertigt.",
    ),
    "Missile balistique intercontinental russe — unité d'élite ultime.": (
        "Russian intercontinental ballistic missile — the ultimate elite unit.",
        "Russische interkontinentale Ballistische Rakete — die ultimative Elite-Einheit.",
    ),
    "Obusier automoteur américain 105mm sur châssis M3 Lee.": (
        "American 105mm self-propelled howitzer on an M3 Lee chassis.",
        "Amerikanische 105-mm-Selbstfahrlafette auf M3-Lee-Fahrgestell.",
    ),
    "Obusier soviétique 203mm — l'un des plus gros calibres WWII.": (
        "Soviet 203mm howitzer — one of the largest WWII calibers.",
        "Sowjetische 203-mm-Haubitze — eines der größten Kaliber des Zweiten Weltkriegs.",
    ),
    "Parachutiste mystique — infiltration derrière les lignes ennemies.": (
        "Mystic paratrooper — infiltration behind enemy lines.",
        "Mystischer Fallschirmjäger — Infiltration hinter den feindlichen Linien.",
    ),
    "Plus gros canon sur rails jamais construit — artillerie ultime de siège.": (
        "The largest railway gun ever built — the ultimate siege artillery.",
        "Das größte jemals gebaute Eisenbahngeschütz — die ultimative Belagerungsartillerie.",
    ),
    "Porte-avions américain le plus décoré de la WWII.": (
        "The most decorated American aircraft carrier of WWII.",
        "Der am höchsten dekorierte amerikanische Flugzeugträger des Zweiten Weltkriegs.",
    ),
    "Porte-avions japonais, navire amiral de l'attaque sur Pearl Harbor.": (
        "Japanese aircraft carrier, flagship of the attack on Pearl Harbor.",
        "Japanischer Flugzeugträger, Flaggschiff des Angriffs auf Pearl Harbor.",
    ),
    "Premier MBT britannique, pont entre WWII et ère moderne.": (
        "The first British MBT, bridging WWII and the modern era.",
        "Der erste britische Kampfpanzer, Brücke zwischen Zweitem Weltkrieg und Moderne.",
    ),
    "Reconnaissance d'élite avec bonus de vision et d'esquive.": (
        "Elite reconnaissance with vision and evasion bonuses.",
        "Elite-Aufklärung mit Sicht- und Ausweich-Boni.",
    ),
    "SNLE soviétique classe Typhoon — plus grand sous-marin jamais construit.": (
        "Soviet Typhoon-class ballistic-missile submarine — the largest submarine ever built.",
        "Sowjetisches Atom-U-Boot der Typhoon-Klasse — das größte je gebaute U-Boot.",
    ),
    "Sous-marin d'attaque allemand WWII, ossature de la Kriegsmarine.": (
        "German WWII attack submarine, backbone of the Kriegsmarine.",
        "Deutsches Angriffs-U-Boot des Zweiten Weltkriegs, Rückgrat der Kriegsmarine.",
    ),
    "Stuka zu Fuss — lance-roquettes allemand 280/320mm, ne pas confondre avec l'avion.": (
        "Stuka zu Fuß — German 280/320mm rocket launcher, not to be confused with the aircraft.",
        "Stuka zu Fuß — deutscher 280/320-mm-Raketenwerfer, nicht mit dem Flugzeug zu verwechseln.",
    ),
    "Super char lourd allemand, une des plus puissantes unités blindées du jeu.": (
        "German super heavy tank, one of the most powerful armor units in the game.",
        "Deutscher Superschwerpanzer, eine der stärksten Panzereinheiten des Spiels.",
    ),
    "Super char mystique — unité blindée fin-jeu des Mystic Forces.": (
        "Mystic super tank — late-game armor unit of the Mystic Forces.",
        "Mystischer Superpanzer — Late-Game-Panzereinheit der Mystic Forces.",
    ),
    "Super char terroriste — seul super tank empilable du jeu.": (
        "Terror super tank — the only stackable super tank in the game.",
        "Terror-Superpanzer — der einzige stapelbare Superpanzer des Spiels.",
    ),
    "Unité du génie — construction, réparation, déminage.": (
        "Engineer unit — construction, repair, and mine clearing.",
        "Pioniereinheit — Bau, Reparatur und Minenräumung.",
    ),
    "Véhicule blindé scorpion — identifié par 4 roues et marque sur la coque.": (
        "Scorpion armored vehicle — identified by 4 wheels and a marking on the hull.",
        "Gepanzertes Skorpion-Fahrzeug — erkennbar an 4 Rädern und Rumpfzeichen.",
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
        fr = data.get("shortDesc")
        if not fr:
            continue
        if data.get("shortDescEn") and data.get("shortDescDe"):
            skipped += 1
            continue
        if fr not in FREEFORM:
            missing.append(f"{fp.name}: {fr}")
            continue
        en, de = FREEFORM[fr]
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
