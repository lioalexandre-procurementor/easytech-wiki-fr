#!/usr/bin/env python3
"""
Generate wiki JSONs for every canonical general not already present.

Reads:
  - wc4_export/generals_canonical.json (104 generals)
  - wc4_data_decrypted/GeneralNameSettings.json (country mapping)
  - wc4_extract/assets/stringtable_en.ini (skill names + descriptions)

Writes one easytech-wiki/data/wc4/generals/<slug>.json per missing general,
preserving the 13 existing hand-curated entries untouched.

Image paths are NOT set here — run extract-game-images.py afterwards to pull
portraits/heads from the game data and backfill the `image` block.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WIKI = ROOT / "easytech-wiki"
CANONICAL = ROOT / "wc4_export" / "generals_canonical.json"
GNS = ROOT / "wc4_data_decrypted" / "GeneralNameSettings.json"
STRINGTABLE = ROOT / "wc4_extract" / "assets" / "stringtable_en.ini"
OUT_DIR = WIKI / "data" / "wc4" / "generals"

# CountryId -> ISO-ish 2-letter code used in the wiki
COUNTRY_ID_TO_CODE = {
    1: "GB", 2: "FR", 3: "DE", 4: "DE", 5: "RU", 6: "US", 7: "IT",
    8: "CN", 9: "CN", 10: "JP", 11: "FI", 12: "PL", 13: "YU",
    14: "CA", 15: "AU", 16: "NO", 17: "SE", 18: "DK", 19: "NL",
    20: "BE", 21: "ES", 22: "PT", 23: "HU", 24: "RO", 25: "BG",
    26: "CH", 27: "GR", 28: "TR", 29: "SA", 30: "IQ", 31: "IR",
    32: "IN", 33: "TH", 34: "MN", 35: "KP", 36: "KR", 37: "MX",
    38: "CU", 39: "CO", 40: "BR", 41: "BO", 42: "VE", 43: "PE",
    44: "CL", 45: "AR", 46: "EG", 47: "LR", 48: "XX", 49: "DE",
    50: "XX", 51: "XX", 52: "XX", 53: "XX", 54: "XX", 55: "XX",
    56: "FR", 57: "CZ", 58: "XX", 59: "XX", 60: "XX",
}

# CountryId -> French country name
COUNTRY_ID_TO_NAME_FR = {
    1: "Royaume-Uni", 2: "France", 3: "Allemagne", 4: "RFA",
    5: "URSS", 6: "États-Unis", 7: "Italie", 8: "République de Chine",
    9: "République populaire de Chine", 10: "Japon", 11: "Finlande",
    12: "Pologne", 13: "Yougoslavie", 14: "Canada", 15: "Australie",
    16: "Norvège", 17: "Suède", 18: "Danemark", 19: "Pays-Bas",
    20: "Belgique", 21: "Espagne", 22: "Portugal", 23: "Hongrie",
    24: "Roumanie", 25: "Bulgarie", 26: "Suisse", 27: "Grèce",
    28: "Turquie", 29: "Arabie Saoudite", 30: "Irak", 31: "Iran",
    32: "Inde", 33: "Thaïlande", 34: "Mongolie", 35: "Corée du Nord",
    36: "Corée du Sud", 37: "Mexique", 38: "Cuba", 39: "Colombie",
    40: "Brésil", 41: "Bolivie", 42: "Venezuela", 43: "Pérou",
    44: "Chili", 45: "Argentine", 46: "Égypte", 47: "Liberia",
    48: "Forces Mystiques", 49: "RDA", 56: "France de Vichy",
    57: "Tchécoslovaquie",
}

# Names absent from GeneralNameSettings (premium/legend generals).
# Maps canonical EName -> CountryId (or "scorpion" for the three captains).
MANUAL_COUNTRY = {
    "Abrams": 6, "Anders": 12, "Bastico": 7, "Bitrich": 3,
    "Alan Brooke": 1, "Chernyakhovsky": 5, "Coulson": "scorpion",
    "Eichelberger": 6, "Falkenhorst": 3, "Hartmann": 3,
    "Hermann Hoth": 3, "Higuchi": 10, "Juliusz": 12, "Katukov": 5,
    "Kretschmer": 3, "Koenig": 2, "Leslie": 6, "Marshall": 6,
    "McCampbell": 6, "Mikawa": 10, "Nenonen": 11, "Emperor": 10,
    "Richthofen": 3, "Sikorski": 12, "Simo Hayha": 11, "Spaatz": 6,
    "Tolbukhin": 5, "Weidling": 3, "Weygand": 2, "Williams": "scorpion",
    "Wittmann": 3, "Wu": 9, "Yeryomenko": 5,
}

# Canonical EName -> French display name + slug (overrides default slugifier
# when we want a specific spelling that the wiki already uses elsewhere).
NAME_OVERRIDES = {
    "Donitz": ("Karl Dönitz", "donitz"),
    "Yamaguchi": ("Tamon Yamaguchi", "yamaguchi"),
    "Kuznetsov": ("Nikolaï Kouznetsov", "kuznetsov"),
    "Konev": ("Ivan Konev", "konev"),
    "Zhukov": ("Gueorgui Joukov", "zhukov"),
    "Rokossovsky": ("Konstantin Rokossovsky", "rokossovsky"),
    "Rommel": ("Erwin Rommel", "rommel"),
    "Patton": ("George Patton", "patton"),
    "Guderian": ("Heinz Guderian", "guderian"),
    "Montgomery": ("Bernard Montgomery", "montgomery"),
    "Eisenhower": ("Dwight Eisenhower", "eisenhower"),
    "Manstein": ("Erich von Manstein", "manstein"),
    "Marshall": ("George Marshall", "marshall"),
    "MacArthur": ("Douglas MacArthur", "macarthur"),
    "Nimitz": ("Chester Nimitz", "nimitz"),
    "Yamamoto": ("Isoroku Yamamoto", "yamamoto"),
    "Yamashita": ("Tomoyuki Yamashita", "yamashita"),
    "Bradley": ("Omar Bradley", "bradley"),
    "Halsey": ("William Halsey", "halsey"),
    "Spruance": ("Raymond Spruance", "spruance"),
    "Mountbatten": ("Louis Mountbatten", "mountbatten"),
    "Alexander": ("Harold Alexander", "alexander"),
    "Slim": ("William Slim", "slim"),
    "Wavell": ("Archibald Wavell", "wavell"),
    "Cunningham": ("Andrew Cunningham", "cunningham"),
    "Dowding": ("Hugh Dowding", "dowding"),
    "Auchinleck": ("Claude Auchinleck", "auchinleck"),
    "Bock": ("Fedor von Bock", "bock"),
    "Brauchitsch": ("Walther von Brauchitsch", "brauchitsch"),
    "Kesselring": ("Albert Kesselring", "kesselring"),
    "Kluge": ("Günther von Kluge", "kluge"),
    "Leeb": ("Wilhelm von Leeb", "leeb"),
    "List": ("Wilhelm List", "list"),
    "Model": ("Walter Model", "model"),
    "Heinrici": ("Gotthard Heinrici", "heinrici"),
    "Raeder": ("Erich Raeder", "raeder"),
    "Rundstedt": ("Gerd von Rundstedt", "rundstedt"),
    "Hartmann": ("Erich Hartmann", "hartmann"),
    "Hermann Hoth": ("Hermann Hoth", "hoth"),
    "Bitrich": ("Wilhelm Bittrich", "bittrich"),
    "Wittmann": ("Michael Wittmann", "wittmann"),
    "Kretschmer": ("Otto Kretschmer", "kretschmer"),
    "Falkenhorst": ("Nikolaus von Falkenhorst", "falkenhorst"),
    "Weidling": ("Helmuth Weidling", "weidling"),
    "Richthofen": ("Wolfram von Richthofen", "richthofen"),
    "Vasilevsky": ("Aleksandr Vassilievski", "vasilevsky"),
    "Vatutin": ("Nikolaï Vatoutine", "vatutin"),
    "Voronov": ("Nikolaï Voronov", "voronov"),
    "Voroshilov": ("Kliment Vorochilov", "voroshilov"),
    "Bagramyan": ("Ivan Bagramyan", "bagramyan"),
    "Chuikov": ("Vassili Tchouïkov", "chuikov"),
    "Govorov": ("Leonid Govorov", "govorov"),
    "Timoshenko": ("Semion Timochenko", "timoshenko"),
    "Meretskov": ("Kirill Meretskov", "meretskov"),
    "Sokolovsky": ("Vassili Sokolovski", "sokolovsky"),
    "Tolbukhin": ("Fiodor Tolboukhine", "tolbukhin"),
    "Yeryomenko": ("Andreï Eremenko", "yeryomenko"),
    "Chernyakhovsky": ("Ivan Tchernyakhovski", "chernyakhovsky"),
    "Katukov": ("Mikhaïl Katoukov", "katukov"),
    "Nagumo": ("Chūichi Nagumo", "nagumo"),
    "Mikawa": ("Gunichi Mikawa", "mikawa"),
    "Higuchi": ("Kiichirō Higuchi", "higuchi"),
    "Ozawa": ("Jisaburō Ozawa", "ozawa"),
    "Kuribayashi": ("Tadamichi Kuribayashi", "kuribayashi"),
    "Terauchi": ("Hisaichi Terauchi", "terauchi"),
    "Emperor": ("Empereur Hirohito", "hirohito"),
    "Leclerc": ("Philippe Leclerc", "leclerc"),
    "Tassigny": ("Jean de Lattre de Tassigny", "tassigny"),
    "de Gaulle": ("Charles de Gaulle", "de-gaulle"),
    "Koenig": ("Pierre Kœnig", "koenig"),
    "Weygand": ("Maxime Weygand", "weygand"),
    "Mannerheim": ("Carl Gustaf Mannerheim", "mannerheim"),
    "Nenonen": ("Vilho Nenonen", "nenonen"),
    "Simo Hayha": ("Simo Häyhä", "simo-hayha"),
    "Sikorski": ("Władysław Sikorski", "sikorski"),
    "Anders": ("Władysław Anders", "anders"),
    "Smigly": ("Edward Rydz-Śmigły", "smigly"),
    "Juliusz": ("Juliusz Rómmel", "juliusz"),
    "Tito": ("Josip Broz Tito", "tito"),
    "Inonu": ("İsmet İnönü", "inonu"),
    "Nasser": ("Gamal Abdel Nasser", "nasser"),
    "Mahdi": ("Le Mahdi", "mahdi"),
    "Muhammad": ("Muhammad Ali", "muhammad"),
    "Badoglio": ("Pietro Badoglio", "badoglio"),
    "Graziani": ("Rodolfo Graziani", "graziani"),
    "Messe": ("Giovanni Messe", "messe"),
    "Bastico": ("Ettore Bastico", "bastico"),
    "Crerar": ("Henry Crerar", "crerar"),
    "Simonds": ("Guy Simonds", "simonds"),
    "Blamey": ("Thomas Blamey", "blamey"),
    "Arnold": ("Henry Arnold", "arnold"),
    "Clark": ("Mark Clark", "clark"),
    "Doolittle": ("James Doolittle", "doolittle"),
    "Eichelberger": ("Robert Eichelberger", "eichelberger"),
    "Fletcher": ("Frank Fletcher", "fletcher"),
    "McCampbell": ("David McCampbell", "mccampbell"),
    "Spaatz": ("Carl Spaatz", "spaatz"),
    "Leslie": ("Lesley McNair", "leslie"),
    "Abrams": ("Creighton Abrams", "abrams"),
    "Alan Brooke": ("Alan Brooke", "alan-brooke"),
    "Wu": ("Wu Peifu", "wu"),
    "Bai.C.X": ("Bai Chongxi", "bai-chongxi"),
    "Chen.S.K": ("Chen Shengkai", "chen-shengkai"),
    "Du.Y.M": ("Du Yuming", "du-yuming"),
    "Li.Z.R": ("Li Zongren", "li-zongren"),
    "Liang.X.C": ("Liang Xichang", "liang-xichang"),
    "Lin.B": ("Lin Biao", "lin-biao"),
    "Liu.B.C": ("Liu Bocheng", "liu-bocheng"),
    "Peng.D.H": ("Peng Dehuai", "peng-dehuai"),
    "Sun.L.R": ("Sun Liren", "sun-liren"),
    "Xu.S.Y": ("Xu Shiyou", "xu-shiyou"),
    "Xu.X.Q": ("Xu Xiangqian", "xu-xiangqian"),
    "Xue.Y": ("Xue Yue", "xue-yue"),
    "Zhang.L.F": ("Zhang Lingfu", "zhang-lingfu"),
    "Zhang.Z.Z": ("Zhang Zizhong", "zhang-zizhong"),
    "Zhu.D": ("Zhu De", "zhu-de"),
    "Inoue": ("Shigeyoshi Inoue", "inoue"),
    "Itagaki": ("Seishirō Itagaki", "itagaki"),
    "Koga": ("Mineichi Koga", "koga"),
    "Koiso": ("Kuniaki Koiso", "koiso"),
    "Kondo": ("Nobutake Kondō", "kondo"),
    "Hata": ("Shunroku Hata", "hata"),
    "Toyoda": ("Soemu Toyoda", "toyoda"),
    "Umezu": ("Yoshijirō Umezu", "umezu"),
    "Ushijima": ("Mitsuru Ushijima", "ushijima"),
    "Nagano": ("Osami Nagano", "nagano"),
    "Okamura": ("Yasuji Okamura", "okamura"),
}

CATEGORY_FR = {
    "tank": "blindée",
    "infantry": "infanterie",
    "artillery": "artillerie",
    "navy": "navale",
    "airforce": "aérienne",
    "balanced": "polyvalente",
}

QUALITY_FR = {
    "bronze": "Bronze",
    "silver": "Argent",
    "gold": "Or",
    "marshal": "Maréchal",
}


def slugify(name: str) -> str:
    s = name.lower()
    s = s.replace(".", "-").replace(" ", "-")
    s = re.sub(r"[^a-z0-9-]", "", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


def parse_stringtable(path: Path) -> tuple[dict, dict]:
    text = path.read_text(encoding="utf-8", errors="replace")
    names = {}
    infos = {}
    for k, v in re.findall(r"^skill_name_(\d+)=(.+)$", text, re.M):
        names[int(k)] = v.strip()
    for k, v in re.findall(r"^skill_info_(\d+)=(.+)$", text, re.M):
        infos[int(k)] = v.strip()
    return names, infos


COLOR_RE = re.compile(r"\[#[0-9A-Fa-f]{6}#([^\]]*)\]")


def clean_skill_info(s: str) -> str:
    s = COLOR_RE.sub(r"\1", s)
    s = s.replace("%d%%", "X%").replace("%d", "X")
    s = s.replace("%%", "%")
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def derive_category(stats_max: dict) -> str:
    keys = ("infantry", "armor", "artillery", "navy", "airforce")
    pairs = [(k, stats_max.get(k, 0)) for k in keys]
    top = max(p[1] for p in pairs)
    if top == 0:
        return "balanced"
    leaders = [k for k, v in pairs if v == top]
    if len(leaders) > 1:
        return "balanced"
    mapping = {
        "infantry": "infantry",
        "armor": "tank",
        "artillery": "artillery",
        "navy": "navy",
        "airforce": "airforce",
    }
    return mapping[leaders[0]]


def derive_quality(evaluate: int, military_rank: int) -> str:
    if evaluate == 3 and military_rank == 11:
        return "marshal"
    if evaluate == 3:
        return "gold"
    if evaluate == 2:
        return "silver"
    return "bronze"


def derive_rank(quality: str) -> str:
    return {"marshal": "S", "gold": "S", "silver": "A", "bronze": "B"}[quality]


def resolve_country(name_en: str, gns_lookup: dict):
    if name_en in MANUAL_COUNTRY:
        v = MANUAL_COUNTRY[name_en]
        return ("scorpion", None) if v == "scorpion" else (v, None)
    if name_en in gns_lookup:
        return gns_lookup[name_en], None
    last = name_en.split()[-1]
    if last in gns_lookup:
        return gns_lookup[last], None
    return None, name_en


def make_skills(canon_skills: list, slot_count: int, names: dict, infos: dict):
    skills = []
    for i, s in enumerate(canon_skills):
        type_id = s["type"]
        skills.append({
            "slot": i + 1,
            "name": names.get(type_id, s.get("nameEn") or f"Skill {type_id}"),
            "desc": clean_skill_info(infos.get(type_id, "")),
            "rating": None,
            "stars": None,
            "icon": f"/img/wc4/skills/general_skill_{type_id}.webp",
            "replaceable": False,
            "replaceableReason": None,
        })
    while len(skills) < slot_count:
        skills.append({
            "slot": len(skills) + 1,
            "name": "Emplacement libre",
            "desc": "Compétence apprenable — à remplir via l'Académie.",
            "rating": None,
            "stars": None,
            "icon": None,
            "replaceable": True,
            "replaceableReason": "Emplacement ouvert",
        })
    return skills


def make_attributes(stats: dict, stats_max: dict) -> dict:
    return {
        "infantry": {"start": stats.get("infantry", 0), "max": stats_max.get("infantry", 0)},
        "artillery": {"start": stats.get("artillery", 0), "max": stats_max.get("artillery", 0)},
        "armor": {"start": stats.get("armor", 0), "max": stats_max.get("armor", 0)},
        "navy": {"start": stats.get("navy", 0), "max": stats_max.get("navy", 0)},
        "airforce": {"start": stats.get("airforce", 0), "max": stats_max.get("airforce", 0)},
        "marching": {"start": stats.get("march", 0), "max": stats_max.get("march", 0)},
    }


def make_descriptions(name_fr, category, quality, country_name):
    cat_fr = CATEGORY_FR[category]
    qual_fr = QUALITY_FR[quality]
    where = f" — {country_name}" if country_name else ""
    short = f"Général {cat_fr} {qual_fr.lower()}{where}."
    long = (
        f"{name_fr} est un général {cat_fr} de qualité {qual_fr.lower()}"
        f"{where}. Données extraites du jeu — descriptions et conseils tactiques à confirmer."
    )
    return short, long


PRESERVED_SLUGS = {
    "guderian", "rommel", "patton", "rokossovsky", "konev", "zhukov",
    "donitz", "yamaguchi", "kuznetsov", "montgomery", "osborn", "williams",
    "colson",
}


def main():
    canonical = json.load(open(CANONICAL))
    gns = json.load(open(GNS))
    gns_lookup = {g["EName"]: g["CountryId"] for g in gns}
    skill_names, skill_infos = parse_stringtable(STRINGTABLE)

    existing_slugs = {p.stem for p in OUT_DIR.glob("*.json") if not p.stem.startswith("_")}
    existing_canon = set()
    for slug in PRESERVED_SLUGS:
        p = OUT_DIR / f"{slug}.json"
        if p.exists():
            d = json.load(open(p))
            nm = d.get("nameCanonical")
            if nm:
                existing_canon.add(nm)

    written = 0
    skipped = 0
    used_slugs = set(existing_slugs)
    for c in canonical:
        name_en = c["nameEnRaw"]
        override = NAME_OVERRIDES.get(name_en)
        if override:
            display_name, slug = override
        else:
            display_name = name_en
            slug = slugify(name_en)

        if slug in PRESERVED_SLUGS or name_en in existing_canon:
            skipped += 1
            continue

        if slug in used_slugs:
            slug = f"{slug}-{c['id']}"
        used_slugs.add(slug)

        country_id, _ = resolve_country(name_en, gns_lookup)
        is_scorpion = country_id == "scorpion"
        if is_scorpion:
            country_code = "XX"
            country_name_fr = "Empire du Scorpion"
            faction = "scorpion"
        elif country_id:
            country_code = COUNTRY_ID_TO_CODE.get(country_id, "XX")
            country_name_fr = COUNTRY_ID_TO_NAME_FR.get(country_id)
            faction = "standard"
        else:
            country_code = "XX"
            country_name_fr = None
            faction = "standard"

        category = derive_category(c["statsMax"])
        quality = derive_quality(c["evaluate"], c["militaryRank"])
        rank = derive_rank(quality)
        skills = make_skills(c["skills"], c["skillSlots"], skill_names, skill_infos)
        attributes = make_attributes(c["stats"], c["statsMax"])
        short_desc, long_desc = make_descriptions(display_name, category, quality, country_name_fr)

        has_training = quality != "marshal" and (c["stats"] != c["statsMax"])
        if quality == "marshal":
            acquisition_type = "iron-cross"
        elif is_scorpion:
            acquisition_type = "campaign"
        else:
            acquisition_type = "medals"

        data = {
            "slug": slug,
            "name": display_name,
            "nameEn": name_en,
            "faction": faction,
            "category": category,
            "rank": rank,
            "quality": quality,
            "country": country_code,
            "countryName": country_name_fr,
            "shortDesc": short_desc,
            "longDesc": long_desc,
            "skills": skills,
            "attributes": attributes,
            "hasTrainingPath": has_training,
            "training": None,
            "acquisition": {
                "type": acquisition_type,
                "cost": c["costMedal"] if c["costMedal"] > 0 else None,
                "currency": "medals" if c["costMedal"] > 0 else None,
                "notes": "Données APK — à vérifier",
            },
            "bonuses": [],
            "recommendedUnits": [],
            "verified": False,
            "sources": [
                "https://world-conqueror-4.fandom.com/wiki/Generals",
                "Données extraites de l'APK World Conqueror 4",
            ],
            "nameCanonical": name_en,
            "skillSlots": c["skillSlots"],
            "unlockHQLv": c["unlockHQLv"],
            "militaryRank": c["militaryRank"],
            "apkId": c["id"],
            "image": {
                "photo": None,
                "head": None,
                "photoTrained": None,
                "headTrained": None,
            },
        }

        out_path = OUT_DIR / f"{slug}.json"
        with open(out_path, "w") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        written += 1

    print(f"Wrote {written} new general JSONs (skipped {skipped} existing)")


if __name__ == "__main__":
    main()
