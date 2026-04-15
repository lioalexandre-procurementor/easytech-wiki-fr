export type Tier = "S" | "A" | "B" | "C";
export type Category = "tank" | "infantry" | "artillery" | "navy" | "airforce";
export type Faction = "standard" | "scorpion";
export type PerkType = "active-skill" | "passive" | "stat";

export interface Perk {
  lvl: number;
  type: PerkType;
  icon: string;
  name: string;
  desc: string;
  milestone?: boolean;
}

export interface UnitStats {
  atk: number[];       // 12 values, lvl 1..12 — display attack (derived from max)
  def: number[];
  hp: number[];
  mov: number[];
  rng: number[];
  atkMin?: number[];   // lvl 1..12 — real min attack from APK
  atkMax?: number[];   // lvl 1..12 — real max attack from APK
  rngMin?: number[];   // lvl 1..12 — min range from APK
}

export interface UnitTierCost {
  level: number;
  needHQLv: number;
  costGold: number;
  costIndustry: number;
  costEnergy: number;
  costTech: number;
  costItem: number;
  costBadge: number;
}

export interface UnitData {
  slug: string;
  name: string;
  nameEn?: string;
  category: Category;
  faction: Faction;    // standard = real-world roster; scorpion = Mystic Forces / Black Scorpion Empire
  country: string;     // ISO emoji-friendly e.g. "GB", "US", "DE", "FR", "RU", "JP", "IT"; "XX" for Scorpion
  countryName: string; // FR display
  tier: Tier;
  obtainability: "free" | "event" | "shop" | "premium";
  shortDesc: string;
  longDesc: string;
  stats: UnitStats;
  perks: Perk[];
  recommendedGenerals: string[];
  levelingPriority: string[];
  faqs: { q: string; a: string }[];
  sources?: string[];
  /** Base armyId from the APK (lvl-1 entry). Present when data was backfilled. */
  armyId?: number | null;
  /** Per-level unlock costs (HQ level, gold, industry, energy, tech, item). */
  tierCosts?: UnitTierCost[];
  /** Image paths extracted from the APK. */
  image?: {
    sprite?: string | null;   // /img/wc4/elites/<armyId>.webp
    lvl12?: string | null;    // /img/wc4/elites/<armyId_lvl12>.webp if different
  };
}

export interface GameMeta {
  slug: string;
  name: string;
  shortName: string;
  era: string;
  tagline: string;
  available: boolean;
}

// ─── GENERALS ───────────────────────────────────────────────────────────────

export type GeneralCategory =
  | "tank"
  | "infantry"
  | "artillery"
  | "navy"
  | "airforce"
  | "balanced";
export type GeneralRank = "S" | "A" | "B" | "C";

// WC4 lettered skill rating visible in-game (E → S+).
export type SkillRating = "E" | "D" | "C" | "B" | "A" | "S" | "S+";

// Quality tier of the general — drives total skill slot count.
// bronze = 3 skills, silver = 4, gold = 5, marshal (IAP) = 5.
export type GeneralQuality = "bronze" | "silver" | "gold" | "marshal";

// ─── Attributes (6 combat aptitudes) ────────────────────────────────────────
// Every general is rated on 6 aptitudes. Each has a starting star level (filled)
// and a max star level (filled + empty = ceiling reachable via promotions/training).
// The normal scale is 0..5. A 6th "shiny" star exists as a bonus for maxed aptitudes.

export type AttributeKey =
  | "infantry"
  | "artillery"
  | "armor"
  | "navy"
  | "airforce"
  | "marching";

export interface AttributeValue {
  start: number;   // 0..6 — current filled stars (as acquired)
  max: number;     // 0..6 — ceiling reachable via promotion/training
}

export type GeneralAttributes = {
  [K in AttributeKey]?: AttributeValue | null;
};

// ─── Skills ─────────────────────────────────────────────────────────────────
// Each skill slot holds one skill. `replaceable: true` means the player can
// swap this skill for one from the universal learnable-skill catalog via
// medals at the Academy. Those slots are where the community voting feature
// plugs in.

export interface GeneralSkill {
  slot: number;                   // 1-based slot index (1..5)
  name: string;                   // display name FR
  /** Canonical English skill name from WC4 APK string tables. */
  nameEn?: string;
  desc: string;                   // description FR
  rating?: SkillRating | null;    // in-game letter grade if visible
  stars?: number | null;          // 0..5 visual star count if displayed
  icon?: string | null;
  replaceable?: boolean;          // true → player can swap via medals; vote UI shows here
  replaceableReason?: string;     // optional tooltip, e.g. "Slot laissé ouvert aux choix communautaires"
  /** Skill system link — APK skill type id (0..179). Lets us cross-link to the
   *  skill detail page and pull L1..L5 progression on demand. */
  skillType?: number;
  /** Current level of the skill for this general (1..5). */
  skillLevel?: number;
  /** Slug in data/wc4/skills/{slug}.json */
  skillSlug?: string;
}

// ─── Training (premium tier upgrade via Sword/Sceptre of Dominance) ─────────
// Distinct from replaceable skills. This is the premium mechanic that raises
// a general's tier (bronze→silver→gold). Each stage has a cost in swords +
// sceptres and can unlock new innate skills or bump attribute ceilings.
// Bronze generals need 3 stages, silver 2, gold 1 to reach their final form.

export interface TrainingStageSkillChange {
  slot: number;              // which skill slot is changed
  kind: "unlock" | "upgrade" | "replace";
  newName?: string;          // for unlock/replace: resulting skill name
  newDesc?: string;
  newRating?: SkillRating | null;
  notes?: string;
}

export interface TrainingStageAttributeDelta {
  key: AttributeKey;
  maxDelta?: number | null;  // +1 star on the ceiling, etc.
  startDelta?: number | null;
  notes?: string;
}

export interface TrainingStage {
  stage: number;                                      // 1, 2, 3…
  label?: string;                                     // "Bronze → Silver", etc.
  swordCost: number | null;                           // Swords of Dominance
  sceptreCost: number | null;                         // Sceptres of Dominance
  skillChanges?: TrainingStageSkillChange[];
  attributeDeltas?: TrainingStageAttributeDelta[];
  notes?: string;
}

export interface TrainingPath {
  stages: TrainingStage[];
  totalSwordCost?: number | null;
  totalSceptreCost?: number | null;
  summary?: string;   // short editorial description of why training this general is worth it
}

// ─── Acquisition ────────────────────────────────────────────────────────────

export type AcquisitionType =
  | "starter"
  | "medals"
  | "iron-cross"
  | "coin"
  | "campaign"
  | "event";

export interface Acquisition {
  type: AcquisitionType;
  cost: number | null;
  currency: "medals" | "iron-cross" | "coin" | null;
  notes?: string;
}

// ─── The full general record ────────────────────────────────────────────────

export interface GeneralData {
  slug: string;
  name: string;
  nameEn?: string;
  faction: Faction;
  category: GeneralCategory;
  rank: GeneralRank;
  quality: GeneralQuality;                // drives skill slot count
  country: string;
  countryName: string;
  shortDesc: string;
  longDesc: string;
  skills: GeneralSkill[];                 // length should match quality (3/4/5) — BASE loadout (untrained)
  /**
   * Full skill loadout AFTER premium training (Swords/Sceptres of Dominance).
   * Only present for the 19 generals with `hasTrainingPath=true` whose
   * promotion chain carries a final-stage Skills list. Rendered by the
   * `/premium-training` view. Should NOT pollute the base `skills` array.
   */
  trainedSkills?: GeneralSkill[] | null;
  attributes?: GeneralAttributes | null;
  hasTrainingPath: boolean;               // eligible for Sword/Sceptre premium training
  training?: TrainingPath | null;         // full per-stage data (filled after verification)
  acquisition: Acquisition;
  bonuses: { target: string; value: string }[];
  recommendedUnits: string[];
  sources?: string[];
  // ── Real-data additions (from wc4_export) ──
  /** Canonical English name from game data (EName field in APK). Stable across locales. */
  nameCanonical?: string;
  /** Number of skill slots — authoritative count from APK. */
  skillSlots?: number;
  /** Required HQ level to unlock in shop. */
  unlockHQLv?: number | null;
  /** Military rank enum (1..6) from APK. */
  militaryRank?: number | null;
  /** Raw APK id for traceability. */
  apkId?: number;
  /** In-game promotion BaseID, present when the general has a training path. */
  generalIdGame?: number | null;
  /** Image paths extracted from the APK. */
  image?: {
    photo: string;              // /img/wc4/generals/<Photo>.webp
    head: string;               // /img/wc4/heads/<Photo>.webp
    photoTrained?: string | null;
    headTrained?: string | null;
  };
}

// ─── Universal learnable-skill catalog (vote feature) ───────────────────────
// A separate file (lib/data/learnable-skills.json) holds the universal list.
// When a general has a skill with replaceable=true, the vote dialog pulls
// candidates from this catalog, optionally filtered by `appliesTo`.

export interface LearnableSkill {
  id: string;                            // slug, e.g. "panzer-leader"
  name: string;                          // FR display name
  desc: string;
  rating?: SkillRating | null;
  appliesTo?: GeneralCategory[];         // empty/undefined = all categories
  popularMeta?: boolean;                 // editorial "best practice" flag
  editorialNote?: string;                // short justification for the meta pick
}

// ─── Skill catalog (full APK dataset) ───────────────────────────────────────
// Built by scripts/extract-skills.py from SkillSettings.json + stringtable.
// One JSON file per skill type in data/wc4/skills/{slug}.json plus an index.

export interface SkillProgression {
  level: number;
  skillId: number;       // APK SkillSettings.Id
  effect: number;        // SkillEffect at this level
  chance: number;        // ActivatesChance at this level
  costMedal: number;
  /** Template with %d substituted — the in-game player-facing text. */
  renderedDesc: string;
  /** First-pass FR translation of renderedDesc. May partially contain English
   *  for phrases not yet covered by the phrase-level translator. */
  renderedDescFr?: string;
}

export interface SkillUsageEntry {
  generalId: number;     // APK GeneralSettings.Id
  level: number;         // Level of the skill for that general
  promotionId?: number;  // Present when the skill is unlocked via promotion
}

export interface SkillCatalogEntry {
  slug: string;
  type: number;               // APK skill type id
  name: string;               // English canonical name
  /** Hand-curated FR display name (falls back to `name` when absent). */
  nameFr?: string;
  series: number;             // 0 = signature, 1..5 = learnable series
  seriesLabel: string;
  /** Template with placeholder rendered as `X` — the generic description. */
  descriptionTemplate: string;
  /** First-pass FR translation of descriptionTemplate. */
  descriptionTemplateFr?: string;
  icon: string | null;
  maxLevel: number;
  progression: SkillProgression[];
  usage: {
    base: SkillUsageEntry[];        // generals who carry it by default
    promoted: SkillUsageEntry[];    // generals who unlock it via training
  };
  varyingField: "SkillEffect" | "ActivatesChance";
}

export interface SkillIndexItem {
  slug: string;
  type: number;
  name: string;
  /** Hand-curated FR display name. */
  nameFr?: string;
  series: number;
  seriesLabel: string;
  seriesSlug: string;
  icon: string | null;
  shortDesc: string;
  /** First-pass FR translation of shortDesc. */
  shortDescFr?: string;
  maxLevel: number;
}

export interface SkillSeriesMeta {
  series: number;
  slug: string;
  label: string;
  summary: string;
  icon: string;
  count: number;
}

export interface SkillIndex {
  series: SkillSeriesMeta[];
  skills: SkillIndexItem[];
}

// ─── UPDATES / CHANGELOG ──────────────────────────────────────────────

/**
 * One EasyTech update entry. Stored as a single JSON file at
 * data/wc4/updates/{slug}.json with both locales in the same file so
 * a new update = one file, not two.
 */
export interface UpdateEntry {
  /** URL slug, e.g. "1-24-2-april-2026". */
  slug: string;
  /** Semantic version string as printed in-game, e.g. "1.24.2". */
  version: string;
  /** ISO date (YYYY-MM-DD) when EasyTech shipped the update. */
  date: string;
  /** Optional tags for filtering/categorization. */
  tags?: string[];
  /** Optional source URL (EasyTech announcement, patch notes, etc.). */
  sourceUrl?: string;
  /** Per-locale content. */
  title: { fr: string; en: string; de: string };
  /** One-line teaser shown on the list page. */
  summary: { fr: string; en: string; de: string };
  /** Full markdown body (or plain text with \n\n paragraphs). */
  body: { fr: string; en: string; de: string };
}

/**
 * "Trained" projection of a general: everything promoted to its ceiling.
 * Used by the `/trained` route variant. A GeneralData may carry a partial
 * override here if the training unlocks skills/attributes that differ from
 * simply maxing the base values.
 */
export interface TrainedGeneralView {
  /** Attributes at their ceiling (i.e. every key set so `start === max`). */
  attributes: GeneralAttributes;
  /** Skills after all promotions applied (replace/unlock resolved). */
  skills: GeneralSkill[];
  /** Total training cost in swords. */
  totalSwordCost: number | null;
  /** Total training cost in sceptres. */
  totalSceptreCost: number | null;
  /** Human-readable summary of how the trained build differs from base. */
  summary: string;
}

// ─── COMPARATOR ───────────────────────────────────────────────────────

export type DiffClass = "best" | "worst" | "neutral";

// ─── TECHNOLOGIES ───────────────────────────────────────────────────────

export type TechCategory =
  | "infantry"
  | "armor"
  | "artillery"
  | "navy"
  | "airforce"
  | "fortifications"
  | "antiair"
  | "missile";

/** One row in a tech chain's progression. */
export interface TechLevel {
  apkId: number;
  level: number;
  x: number;
  y: number;
  costGold: number;
  costIndustry: number;
  costEnergy: number;
  costTech: number;
  needHQLv?: number;
  needScenarioId?: number;
  descEn?: string;
  descTemplate?: string;
  techValues?: number[];
  techDescKeys?: number[];
  prerequisiteIds?: number[];
  upgradeToId?: number;
}

export interface Tech {
  slug: string;
  apkTypeId: number;
  apkCategoryId: number;
  nameEn: string;
  nameFr: string;
  category: TechCategory;
  effectArmy?: number;
  maxLevel: number;
  needHQLv: number;
  needScenarioId: number;
  levels: TechLevel[];
  prerequisites: Array<{ slug: string; level: number }>;
  affectsArmyIds: number[];
}

export interface TechIndexEntry {
  slug: string;
  nameEn: string;
  category: TechCategory;
  maxLevel: number;
  apkTypeId?: number;
}

export interface TechIndex {
  version: number;
  totalTechs: number;
  byCategory: Record<TechCategory, number>;
  techs: TechIndexEntry[];
}

// ─── GUIDES ────────────────────────────────────────────────────────────

export type GuideCategory = "starter" | "systems" | "strategy" | "meta";

export interface GuideFAQ {
  q: string;
  a: string;
}

export interface Guide {
  slug: string;
  category: GuideCategory;
  publishedAt: string;
  lastReviewed: string;
  readingTimeMinutes: number;
  tags: string[];
  related: string[];
  /** Per-locale content — all supported site locales. */
  title: { fr: string; en: string; de: string };
  description: { fr: string; en: string; de: string };
  /** TL;DR bullets — 3-5. */
  tldr: { fr: string[]; en: string[]; de: string[] };
  /** Body in minimal markdown (## headings, - lists, > blockquotes, paragraphs). */
  body: { fr: string; en: string; de: string };
  /** FAQ entries for FAQPage JSON-LD rich snippets. */
  faqs: { fr: GuideFAQ[]; en: GuideFAQ[]; de: GuideFAQ[] };
}

/** One normalized row in a comparator table. */
export interface ComparableRow {
  /** Stable identifier for React key + URL param. */
  id: string;
  /** Locale-agnostic display name. */
  name: string;
  /** Locale-FR display name. */
  nameFr: string;
  /** Category / faction / tier for grouping. */
  category?: string;
  /** Stats map: label → numeric value, comparable across rows. */
  stats: Record<string, number | null>;
  /** Link to the detail page. */
  href: { fr: string; en: string; de: string };
}
