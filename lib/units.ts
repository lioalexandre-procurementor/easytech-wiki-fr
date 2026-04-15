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
  return units.sort((a, b) => {
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

// ========== Skill catalog (APK-extracted) ==========

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

/** Look up a skill by its APK type id (0..179). */
export function getSkillByType(type: number): SkillCatalogEntry | null {
  const item = getSkillIndex().skills.find((s) => s.type === type);
  if (!item) return null;
  return getSkill(item.slug);
}

/**
 * Build a lookup from every known APK id (apkId or generalIdGame) to the
 * corresponding GeneralData. Used to resolve skill usage entries back to
 * pages on the wiki.
 */
let _generalByApkIdCache: Map<number, GeneralData> | null = null;

export function getGeneralByApkId(id: number): GeneralData | null {
  if (!_generalByApkIdCache) {
    _generalByApkIdCache = new Map();
    for (const g of getAllGenerals()) {
      if (g.apkId != null) _generalByApkIdCache.set(g.apkId, g);
      if (g.generalIdGame != null) _generalByApkIdCache.set(g.generalIdGame, g);
    }
  }
  return _generalByApkIdCache.get(id) ?? null;
}

// ========== Metadata ==========

export const CATEGORY_META: Record<Category, { label: string; icon: string; plural: string }> = {
  tank:      { label: "Char",       icon: "🛡️", plural: "Chars" },
  infantry:  { label: "Infanterie", icon: "🪖", plural: "Infanterie" },
  artillery: { label: "Artillerie", icon: "🎯", plural: "Artillerie" },
  navy:      { label: "Marine",     icon: "⚓", plural: "Marine" },
  airforce:  { label: "Aviation",   icon: "✈️", plural: "Aviation" },
};

export const GENERAL_CATEGORY_META: Record<GeneralCategory, { label: string; icon: string }> = {
  tank:      { label: "Blindé",      icon: "🛡️" },
  infantry:  { label: "Infanterie",  icon: "🪖" },
  artillery: { label: "Artillerie",  icon: "🎯" },
  navy:      { label: "Marine",      icon: "⚓" },
  airforce:  { label: "Aviation",    icon: "✈️" },
  balanced:  { label: "Polyvalent",  icon: "⭐" },
};

export const FACTION_META: Record<Faction, { label: string; tagline: string; color: string }> = {
  standard: { label: "Standard",              tagline: "Unités inspirées du monde réel", color: "#d4a44a" },
  scorpion: { label: "Empire du Scorpion",    tagline: "Mystic Forces / Black Scorpion Empire", color: "#c8372d" },
};

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
