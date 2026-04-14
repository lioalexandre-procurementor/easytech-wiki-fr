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
  atk: number[];   // 12 values, lvl 1..12
  def: number[];
  hp: number[];
  mov: number[];
  rng: number[];
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
  verified: boolean;   // true = sourced from NamuWiki/Fandom; false = extrapolated
  sources?: string[];
}

export interface GameMeta {
  slug: string;
  name: string;
  shortName: string;
  era: string;
  tagline: string;
  available: boolean;
}

export type GeneralCategory = "tank" | "infantry" | "artillery" | "navy" | "airforce" | "balanced";
export type GeneralRank = "S" | "A" | "B" | "C";
export type SkillRating = "E" | "D" | "C" | "B" | "A" | "S" | "S+";

export interface GeneralSkill {
  slot: 1 | 2 | 3;
  name: string;
  desc: string;
  rating?: SkillRating | null;  // WC4 letter grade E → S+
  stars?: number | null;        // 0..5 visual star count
  icon?: string | null;
}

export interface GeneralAttributes {
  offense?: number | null;      // 0..5 stars
  defense?: number | null;
  intelligence?: number | null;
  charisma?: number | null;
}

export interface TrainedSkillCandidate {
  id: string;                          // unique slug, e.g. "blitzkrieg-mastery"
  name: string;                        // "Maîtrise Blitzkrieg"
  desc: string;                        // description FR
  rating?: SkillRating | null;
  stars?: number | null;
  icon?: string | null;
  popularMeta?: boolean;               // reserved for future tagging
}

export interface TrainedSkillSlot {
  slot: 1 | 2;
  candidates: TrainedSkillCandidate[]; // all possible choices at this slot
  recommended?: string;                // id of our editorial pick
  recommendationReason?: string;       // why we recommend it
}

export interface TrainedForm {
  name?: string;                       // e.g. "Guderian (entraîné)"
  skills: GeneralSkill[];              // post-training skills (legacy display)
  attributes?: GeneralAttributes | null;
  unlockCost?: number | null;
  unlockCurrency?: "medals" | "iron-cross" | "coin" | null;
  notes?: string;
  trainedSlots?: TrainedSkillSlot[];   // trainable slots with candidates for voting
}

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

export interface GeneralData {
  slug: string;
  name: string;
  nameEn?: string;
  faction: Faction;
  category: GeneralCategory;
  rank: GeneralRank;
  country: string;
  countryName: string;
  shortDesc: string;
  longDesc: string;
  skills: GeneralSkill[];                  // base skills (1..3)
  attributes?: GeneralAttributes | null;   // offense / def / int / charisma stars
  trained?: TrainedForm | null;            // optional trained variant
  acquisition: Acquisition;                // how to get + cost
  bonuses: { target: string; value: string }[];  // summary numeric bonuses
  recommendedUnits: string[];
  verified: boolean;
  sources?: string[];
}
