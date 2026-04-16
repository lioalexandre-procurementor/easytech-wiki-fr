/**
 * European War 6: 1914 data-access layer.
 *
 * Mirror of lib/gcr.ts but targeting data/ew6/* instead of data/gcr/*.
 * Kept as a separate module (rather than a generic game-scoped layer) so
 * the WC4/GCR modules can keep their specialised helpers untouched.
 *
 * When the three modules drift, prefer promoting a shared helper into a
 * generic lib/game-data.ts rather than bloating any of them.
 */
import fs from "node:fs";
import path from "node:path";
import type {
  UnitData,
  Category,
  Tier,
  Faction,
  GeneralData,
  GeneralCategory,
  LearnableSkill,
  SkillCatalogEntry,
  SkillIndex,
  SkillIndexItem,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "ew6", "elite-units");
const GENERALS_DIR = path.join(process.cwd(), "data", "ew6", "generals");
const SKILLS_DIR = path.join(process.cwd(), "data", "ew6", "skills");
const LEARNABLE_FILE = path.join(
  process.cwd(),
  "data",
  "ew6",
  "learnable-skills.json"
);

const TIER_ORDER: Record<Tier, number> = { S: 0, A: 1, B: 2, C: 3 };

// ========== Elite units ==========

export function getAllEliteUnits(): UnitData[] {
  if (!fs.existsSync(DATA_DIR)) return [];
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"));
  const units: UnitData[] = files.map((f) =>
    JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8"))
  );
  return units.sort((a, b) => {
    const aId = a.armyId ?? Number.POSITIVE_INFINITY;
    const bId = b.armyId ?? Number.POSITIVE_INFINITY;
    if (aId !== bId) return aId - bId;
    const t = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    if (t !== 0) return t;
    return a.name.localeCompare(b.name, "fr");
  });
}

export function getUnitsByFaction(faction: Faction): UnitData[] {
  return getAllEliteUnits().filter((u) => u.faction === faction);
}

export function getEliteUnit(slug: string): UnitData | null {
  const file = path.join(DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function getUnitsByCategory(cat: Category, faction?: Faction): UnitData[] {
  return getAllEliteUnits().filter(
    (u) => u.category === cat && (!faction || u.faction === faction)
  );
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(/\.json$/, ""));
}

// ========== Generals ==========

export function getAllGenerals(): GeneralData[] {
  if (!fs.existsSync(GENERALS_DIR)) return [];
  const files = fs
    .readdirSync(GENERALS_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"));
  const gens: GeneralData[] = files.map((f) =>
    JSON.parse(fs.readFileSync(path.join(GENERALS_DIR, f), "utf8"))
  );
  return gens.sort((a, b) => {
    const t = TIER_ORDER[a.rank] - TIER_ORDER[b.rank];
    if (t !== 0) return t;
    return a.name.localeCompare(b.name, "fr");
  });
}

export function getGeneralsByFaction(faction: Faction): GeneralData[] {
  return getAllGenerals().filter((g) => g.faction === faction);
}

export function getGeneral(slug: string): GeneralData | null {
  const file = path.join(GENERALS_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function getAllGeneralSlugs(): string[] {
  if (!fs.existsSync(GENERALS_DIR)) return [];
  return fs
    .readdirSync(GENERALS_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(/\.json$/, ""));
}

// ========== Learnable skills catalog ==========

let _learnableCache: LearnableSkill[] | null = null;

export function getAllLearnableSkills(): LearnableSkill[] {
  if (_learnableCache) return _learnableCache;
  if (!fs.existsSync(LEARNABLE_FILE)) return [];
  _learnableCache = JSON.parse(
    fs.readFileSync(LEARNABLE_FILE, "utf8")
  ) as LearnableSkill[];
  return _learnableCache;
}

export function getLearnableSkill(id: string): LearnableSkill | null {
  return getAllLearnableSkills().find((s) => s.id === id) ?? null;
}

// ========== Skill catalog ==========

let _skillIndexCache: SkillIndex | null = null;

export function getSkillIndex(): SkillIndex {
  if (_skillIndexCache) return _skillIndexCache;
  const file = path.join(SKILLS_DIR, "_index.json");
  if (!fs.existsSync(file)) return { series: [], skills: [] };
  _skillIndexCache = JSON.parse(fs.readFileSync(file, "utf8")) as SkillIndex;
  return _skillIndexCache;
}

export function getAllSkillIndexItems(): SkillIndexItem[] {
  return getSkillIndex().skills;
}

export function getSkillsBySeries(series: number): SkillIndexItem[] {
  return getSkillIndex().skills.filter((s) => s.series === series);
}

export function getSkill(slug: string): SkillCatalogEntry | null {
  const file = path.join(SKILLS_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as SkillCatalogEntry;
}

export function getAllSkillSlugs(): string[] {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs
    .readdirSync(SKILLS_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function getSkillByType(type: number): SkillCatalogEntry | null {
  const item = getSkillIndex().skills.find((s) => s.type === type);
  if (!item) return null;
  return getSkill(item.slug);
}

let _generalByApkIdCache: Map<number, GeneralData> | null = null;

export function getGeneralByApkId(id: number): GeneralData | null {
  if (!_generalByApkIdCache) {
    _generalByApkIdCache = new Map();
    for (const g of getAllGenerals()) {
      if (g.gameId != null) _generalByApkIdCache.set(g.gameId, g);
      if (g.generalIdGame != null) _generalByApkIdCache.set(g.generalIdGame, g);
    }
  }
  return _generalByApkIdCache.get(id) ?? null;
}

// ========== Technologies ==========

const TECH_DIR = path.join(process.cwd(), "data", "ew6", "technologies");

export function getAllTechSlugs(): string[] {
  if (!fs.existsSync(TECH_DIR)) return [];
  return fs
    .readdirSync(TECH_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function getTech(slug: string): Record<string, unknown> | null {
  const file = path.join(TECH_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

// ========== Skill slot candidates (stub) ==========

export function getCandidatesForGeneralSlot(
  _generalSlug: string,
  _slotIndex: number
): SkillCatalogEntry[] {
  return [];
}

export function buildSlotRecommendationMap(
  _generalSlug: string
): Record<number, SkillCatalogEntry[]> {
  return {};
}

// ========== Metadata (locale-aware) ==========

type L10n = { fr: string; en: string; de: string };
type CategoryEntry = { label: L10n; icon: string; plural: L10n };
type GeneralCategoryEntry = { label: L10n; icon: string };
type FactionEntry = { label: L10n; tagline: L10n; color: string };

// EW6 unit categories are the 4 WW1/Napoleonic-era branches.
const CATEGORY_META_LOCALIZED: Partial<Record<Category, CategoryEntry>> = {
  infantry: {
    label: { fr: "Infanterie", en: "Infantry", de: "Infanterie" },
    plural: { fr: "Infanterie", en: "Infantry", de: "Infanterie" },
    icon: "🪖",
  },
  cavalry: {
    label: { fr: "Cavalerie", en: "Cavalry", de: "Kavallerie" },
    plural: { fr: "Cavalerie", en: "Cavalry", de: "Kavallerie" },
    icon: "🐎",
  },
  artillery: {
    label: { fr: "Artillerie", en: "Artillery", de: "Artillerie" },
    plural: { fr: "Artillerie", en: "Artillery", de: "Artillerie" },
    icon: "💥",
  },
  navy: {
    label: { fr: "Marine", en: "Navy", de: "Marine" },
    plural: { fr: "Marine", en: "Navy", de: "Marine" },
    icon: "⚓",
  },
};

const GENERAL_CATEGORY_META_LOCALIZED: Partial<
  Record<GeneralCategory, GeneralCategoryEntry>
> = {
  infantry: {
    label: { fr: "Infanterie", en: "Infantry", de: "Infanterie" },
    icon: "🪖",
  },
  cavalry: {
    label: { fr: "Cavalerie", en: "Cavalry", de: "Kavallerie" },
    icon: "🐎",
  },
  artillery: {
    label: { fr: "Artillerie", en: "Artillery", de: "Artillerie" },
    icon: "💥",
  },
  navy: {
    label: { fr: "Marine", en: "Navy", de: "Marine" },
    icon: "⚓",
  },
  balanced: {
    label: { fr: "Polyvalent", en: "Balanced", de: "Ausgewogen" },
    icon: "⭐",
  },
};

// EW6 spans the 1800–1914 era. Unlike WC4 (WW2 Axis/Allies) or GCR
// (Rome/Barbarians), EW6 doesn't have a single binary faction split in the
// source data — 41 nations coexist across Napoleonic wars, coalition wars,
// and the buildup to 1914. We model a single `standard` faction for now
// and let the generals/units pages filter by country instead.
const FACTION_META_LOCALIZED: Partial<Record<Faction, FactionEntry>> = {
  standard: {
    label: { fr: "Nations", en: "Nations", de: "Nationen" },
    tagline: {
      fr: "Les 41 puissances de l'ère 1800–1914",
      en: "The 41 powers of the 1800–1914 era",
      de: "Die 41 Mächte der Epoche 1800–1914",
    },
    color: "#6b8bb0",
  },
};

type LocaleKey = "fr" | "en" | "de";
function resolveLocale(locale: string | undefined): LocaleKey {
  if (locale === "fr" || locale === "en" || locale === "de") return locale;
  return "fr";
}

export function getCategoryMeta(locale: string | undefined) {
  const loc = resolveLocale(locale);
  return Object.fromEntries(
    Object.entries(CATEGORY_META_LOCALIZED).map(([k, v]) => [
      k,
      { label: v!.label[loc], icon: v!.icon, plural: v!.plural[loc] },
    ])
  ) as Record<Category, { label: string; icon: string; plural: string }>;
}

export function getGeneralCategoryMeta(locale: string | undefined) {
  const loc = resolveLocale(locale);
  return Object.fromEntries(
    Object.entries(GENERAL_CATEGORY_META_LOCALIZED).map(([k, v]) => [
      k,
      { label: v!.label[loc], icon: v!.icon },
    ])
  ) as Record<GeneralCategory, { label: string; icon: string }>;
}

export function getFactionMeta(locale: string | undefined) {
  const loc = resolveLocale(locale);
  return Object.fromEntries(
    Object.entries(FACTION_META_LOCALIZED).map(([k, v]) => [
      k,
      { label: v!.label[loc], tagline: v!.tagline[loc], color: v!.color },
    ])
  ) as Record<Faction, { label: string; tagline: string; color: string }>;
}

// Country flag map for EW6. Each slug is the short code emitted by the
// extraction script; the emoji is a best-fit modern flag (or a historical
// placeholder when the country no longer exists — HRE, Two Sicilies, …).
export const COUNTRY_FLAGS: Record<string, string> = {
  FR: "🇫🇷",
  GB: "🇬🇧",
  HRE: "🦅", // Holy Roman Empire (double-headed eagle)
  AT: "🇦🇹",
  PR: "🦅", // Prussia (Prussian eagle)
  DE: "🇩🇪",
  RU: "🇷🇺",
  US: "🇺🇸",
  OT: "☪",  // Ottoman Empire
  ES: "🇪🇸",
  RHI: "🏰", // Confederation of the Rhine
  HES: "🦁", // Hesse-Kassel
  DTB: "🏛", // Deutscher Bund
  SE: "🇸🇪",
  DK: "🇩🇰",
  BE: "🇧🇪",
  WAR: "🛡", // Duchy of Warsaw
  PL: "🇵🇱",
  CA: "🇨🇦",
  PT: "🇵🇹",
  NL: "🇳🇱",
  CH: "🇨🇭",
  SAR: "🏝", // Sardinia
  IT: "🇮🇹",
  NAP: "🌋", // Naples (Vesuvius)
  SIC: "🏝", // Sicily
  "2SI": "👑", // Two Sicilies
  DZ: "🇩🇿",
  EG: "🇪🇬",
  RS: "🇷🇸",
  MA: "🇲🇦",
  SA: "🇸🇦",
  MX: "🇲🇽",
  COL: "🇨🇴",
  BR: "🇧🇷",
  GR: "🇬🇷",
  TRB: "🏕", // Tribal Union
  IRO: "🪶", // Iroquois
  BAV: "🦁", // Bavaria
  SAX: "👑", // Saxony
  IT2: "🇮🇹",
  XX: "🌍",
};
