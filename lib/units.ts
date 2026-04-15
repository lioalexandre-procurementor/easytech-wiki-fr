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

const DATA_DIR = path.join(process.cwd(), "data", "wc4", "elite-units");
const GENERALS_DIR = path.join(process.cwd(), "data", "wc4", "generals");
const SKILLS_DIR = path.join(process.cwd(), "data", "wc4", "skills");
const LEARNABLE_FILE = path.join(
  process.cwd(),
  "data",
  "wc4",
  "learnable-skills.json"
);

const TIER_ORDER: Record<Tier, number> = { S: 0, A: 1, B: 2, C: 3 };

export function getAllEliteUnits(): UnitData[] {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json") && !f.startsWith("_"));
  const units: UnitData[] = files.map(f => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8")));
  // Game order = game-data `armyId` ascending. Each real elite has a base id in the
  // 301xxx..351xxx range that mirrors the in-game unlock sequence. Units without
  // an armyId (scorpion/mystic variants not yet in canonical data) sink to the
  // bottom, sorted by tier + FR name as the historical fallback.
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
  return getAllEliteUnits().filter(u => u.faction === faction);
}

export function getEliteUnit(slug: string): UnitData | null {
  const file = path.join(DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function getUnitsByCategory(cat: Category, faction?: Faction): UnitData[] {
  return getAllEliteUnits().filter(u => u.category === cat && (!faction || u.faction === faction));
}

export function getAllSlugs(): string[] {
  return fs
    .readdirSync(DATA_DIR)
    .filter(f => f.endsWith(".json") && !f.startsWith("_"))
    .map(f => f.replace(/\.json$/, ""));
}

// ========== Generals ==========

export function getAllGenerals(): GeneralData[] {
  if (!fs.existsSync(GENERALS_DIR)) return [];
  const files = fs.readdirSync(GENERALS_DIR).filter(f => f.endsWith(".json") && !f.startsWith("_"));
  const gens: GeneralData[] = files.map(f => JSON.parse(fs.readFileSync(path.join(GENERALS_DIR, f), "utf8")));
  return gens.sort((a, b) => {
    const t = TIER_ORDER[a.rank] - TIER_ORDER[b.rank];
    if (t !== 0) return t;
    return a.name.localeCompare(b.name, "fr");
  });
}

export function getGeneralsByFaction(faction: Faction): GeneralData[] {
  return getAllGenerals().filter(g => g.faction === faction);
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
    .filter(f => f.endsWith(".json") && !f.startsWith("_"))
    .map(f => f.replace(/\.json$/, ""));
}

// ========== Learnable skills catalog (vote candidates) ==========

let _learnableCache: LearnableSkill[] | null = null;

export function getAllLearnableSkills(): LearnableSkill[] {
  if (_learnableCache) return _learnableCache;
  if (!fs.existsSync(LEARNABLE_FILE)) return [];
  _learnableCache = JSON.parse(fs.readFileSync(LEARNABLE_FILE, "utf8")) as LearnableSkill[];
  return _learnableCache;
}

export function getLearnableSkill(id: string): LearnableSkill | null {
  return getAllLearnableSkills().find(s => s.id === id) ?? null;
}

/**
 * Returns the pool of learnable skills eligible for a given general's replaceable slot.
 * A skill is eligible if it has no `appliesTo` restriction, or includes the general's category.
 */
export function getCandidatesForGeneralSlot(
  general: GeneralData,
  slot: number
): LearnableSkill[] {
  const skill = general.skills.find(s => s.slot === slot);
  if (!skill || !skill.replaceable) return [];
  const all = getAllLearnableSkills();
  return all.filter(ls => {
    if (!ls.appliesTo || ls.appliesTo.length === 0) return true;
    return ls.appliesTo.includes(general.category);
  });
}

/**
 * Build a per-slot editorial recommendation map for a general.
 *
 * A general with N replaceable slots must NOT receive the same "⭐ Meta"
 * recommendation in every slot. We assign distinct meta picks round-robin:
 * category-specific meta skills first (ranked S+ → A), then universal meta
 * skills as fallback. If the meta pool is exhausted we keep cycling to
 * guarantee every slot gets a pick — but the tier ordering ensures the
 * strongest recommendation lands on the lowest-indexed slot.
 *
 * Returns a `Map<slot, skillId>` keyed on slot index. A slot absent from
 * the map means "no recommendation" (the component then falls back to the
 * default highlight behaviour).
 */
const RATING_ORDER: Record<string, number> = {
  "S+": 0,
  S: 1,
  A: 2,
  B: 3,
  C: 4,
  D: 5,
  E: 6,
};

export function buildSlotRecommendationMap(
  general: GeneralData
): Map<number, string> {
  const replaceableSlots = general.skills
    .filter((s) => s.replaceable)
    .map((s) => s.slot)
    .sort((a, b) => a - b);
  if (replaceableSlots.length === 0) return new Map();

  // Pool of distinct meta candidates eligible for at least one of this
  // general's slots. We collect once (all replaceable slots share the same
  // candidate pool under the current `appliesTo` model).
  const firstSlotPool = getCandidatesForGeneralSlot(general, replaceableSlots[0]);
  const metaPool = firstSlotPool
    .filter((c) => c.popularMeta)
    .sort((a, b) => {
      // Category-specific first — they're strictly better picks for this general.
      const aSpec = (a.appliesTo?.length ?? 0) > 0 ? 0 : 1;
      const bSpec = (b.appliesTo?.length ?? 0) > 0 ? 0 : 1;
      if (aSpec !== bSpec) return aSpec - bSpec;
      const ra = a.rating ? RATING_ORDER[a.rating] ?? 99 : 99;
      const rb = b.rating ? RATING_ORDER[b.rating] ?? 99 : 99;
      return ra - rb;
    });

  const map = new Map<number, string>();
  if (metaPool.length === 0) return map;

  // Round-robin distinct picks.
  replaceableSlots.forEach((slot, i) => {
    const pick = metaPool[i % metaPool.length];
    map.set(slot, pick.id);
  });
  return map;
}

// ========== Skill catalog (game-data-extracted) ==========

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

/** Look up a skill by its game-data type id (0..179). */
export function getSkillByType(type: number): SkillCatalogEntry | null {
  const item = getSkillIndex().skills.find((s) => s.type === type);
  if (!item) return null;
  return getSkill(item.slug);
}

/**
 * Build a lookup from every known game id (gameId or generalIdGame) to the
 * corresponding GeneralData. Used to resolve skill usage entries back to
 * pages on the wiki.
 */
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

// ========== Metadata ==========

/**
 * Locale-aware category/faction metadata.
 *
 * The `CATEGORY_META`, `GENERAL_CATEGORY_META` and `FACTION_META` exports
 * below preserve the legacy FR-only shape for any consumer that has not
 * been migrated yet. Newer callsites should prefer the locale-aware
 * helpers `getCategoryMeta(locale)`, `getGeneralCategoryMeta(locale)`,
 * and `getFactionMeta(locale)`, which pull from the `_LOCALIZED` maps
 * and return the right labels for `"fr" | "en" | "de"`.
 */

type L10n = { fr: string; en: string; de: string };
type CategoryEntry = { label: L10n; icon: string; plural: L10n };
type GeneralCategoryEntry = { label: L10n; icon: string };
type FactionEntry = { label: L10n; tagline: L10n; color: string };

const CATEGORY_META_LOCALIZED: Record<Category, CategoryEntry> = {
  tank: {
    label:  { fr: "Char",       en: "Tank",       de: "Panzer" },
    plural: { fr: "Chars",      en: "Tanks",      de: "Panzer" },
    icon: "🛡️",
  },
  infantry: {
    label:  { fr: "Infanterie", en: "Infantry",   de: "Infanterie" },
    plural: { fr: "Infanterie", en: "Infantry",   de: "Infanterie" },
    icon: "🪖",
  },
  artillery: {
    label:  { fr: "Artillerie", en: "Artillery",  de: "Artillerie" },
    plural: { fr: "Artillerie", en: "Artillery",  de: "Artillerie" },
    icon: "🎯",
  },
  navy: {
    label:  { fr: "Marine",     en: "Navy",       de: "Marine" },
    plural: { fr: "Marine",     en: "Navy",       de: "Marine" },
    icon: "⚓",
  },
  airforce: {
    label:  { fr: "Aviation",   en: "Air Force",  de: "Luftwaffe" },
    plural: { fr: "Aviation",   en: "Air Force",  de: "Luftwaffe" },
    icon: "✈️",
  },
};

const GENERAL_CATEGORY_META_LOCALIZED: Record<GeneralCategory, GeneralCategoryEntry> = {
  tank:      { label: { fr: "Blindé",     en: "Armor",     de: "Panzer"     }, icon: "🛡️" },
  infantry:  { label: { fr: "Infanterie", en: "Infantry",  de: "Infanterie" }, icon: "🪖" },
  artillery: { label: { fr: "Artillerie", en: "Artillery", de: "Artillerie" }, icon: "🎯" },
  navy:      { label: { fr: "Marine",     en: "Navy",      de: "Marine"     }, icon: "⚓" },
  airforce:  { label: { fr: "Aviation",   en: "Air Force", de: "Luftwaffe"  }, icon: "✈️" },
  balanced:  { label: { fr: "Polyvalent", en: "Balanced",  de: "Ausgewogen" }, icon: "⭐" },
};

const FACTION_META_LOCALIZED: Record<Faction, FactionEntry> = {
  standard: {
    label:   { fr: "Standard",           en: "Standard",         de: "Standard" },
    tagline: {
      fr: "Unités inspirées du monde réel",
      en: "Real-world inspired units",
      de: "An der realen Welt orientierte Einheiten",
    },
    color: "#d4a44a",
  },
  scorpion: {
    label: {
      fr: "Empire du Scorpion",
      en: "Scorpion Empire",
      de: "Skorpion-Imperium",
    },
    tagline: {
      fr: "Mystic Forces / Black Scorpion Empire",
      en: "Mystic Forces / Black Scorpion Empire",
      de: "Mystic Forces / Black Scorpion Empire",
    },
    color: "#c8372d",
  },
};

type LocaleKey = "fr" | "en" | "de";
function resolveLocale(locale: string | undefined): LocaleKey {
  if (locale === "fr" || locale === "en" || locale === "de") return locale;
  return "fr";
}

export function getCategoryMeta(locale: string | undefined) {
  const loc = resolveLocale(locale);
  return (Object.fromEntries(
    Object.entries(CATEGORY_META_LOCALIZED).map(([k, v]) => [
      k,
      { label: v.label[loc], icon: v.icon, plural: v.plural[loc] },
    ])
  ) as unknown) as Record<Category, { label: string; icon: string; plural: string }>;
}

export function getGeneralCategoryMeta(locale: string | undefined) {
  const loc = resolveLocale(locale);
  return (Object.fromEntries(
    Object.entries(GENERAL_CATEGORY_META_LOCALIZED).map(([k, v]) => [
      k,
      { label: v.label[loc], icon: v.icon },
    ])
  ) as unknown) as Record<GeneralCategory, { label: string; icon: string }>;
}

export function getFactionMeta(locale: string | undefined) {
  const loc = resolveLocale(locale);
  return (Object.fromEntries(
    Object.entries(FACTION_META_LOCALIZED).map(([k, v]) => [
      k,
      { label: v.label[loc], tagline: v.tagline[loc], color: v.color },
    ])
  ) as unknown) as Record<Faction, { label: string; tagline: string; color: string }>;
}

/**
 * @deprecated — prefer `getCategoryMeta(locale)`. Kept for backwards
 * compatibility during the DE rollout; resolves to the French variant.
 */
export const CATEGORY_META: Record<Category, { label: string; icon: string; plural: string }> =
  getCategoryMeta("fr");

/**
 * @deprecated — prefer `getGeneralCategoryMeta(locale)`. FR fallback.
 */
export const GENERAL_CATEGORY_META: Record<GeneralCategory, { label: string; icon: string }> =
  getGeneralCategoryMeta("fr");

/**
 * @deprecated — prefer `getFactionMeta(locale)`. FR fallback.
 */
export const FACTION_META: Record<Faction, { label: string; tagline: string; color: string }> =
  getFactionMeta("fr");

export const COUNTRY_FLAGS: Record<string, string> = {
  GB: "🇬🇧", US: "🇺🇸", DE: "🇩🇪", FR: "🇫🇷", RU: "🇷🇺",
  JP: "🇯🇵", IT: "🇮🇹", CN: "🇨🇳", IL: "🇮🇱", PL: "🇵🇱",
  CA: "🇨🇦", AU: "🇦🇺", FI: "🇫🇮", YU: "🇷🇸", TR: "🇹🇷",
  EG: "🇪🇬", NO: "🇳🇴", SE: "🇸🇪", DK: "🇩🇰", NL: "🇳🇱",
  BE: "🇧🇪", ES: "🇪🇸", PT: "🇵🇹", HU: "🇭🇺", RO: "🇷🇴",
  BG: "🇧🇬", CH: "🇨🇭", GR: "🇬🇷", CZ: "🇨🇿", IN: "🇮🇳",
  TH: "🇹🇭", MX: "🇲🇽", BR: "🇧🇷", AR: "🇦🇷", KR: "🇰🇷",
  XX: "🦂",
};
