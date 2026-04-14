export type Tier = "S" | "A" | "B" | "C";
export type Category = "tank" | "infantry" | "artillery" | "navy" | "airforce";
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
  country: string;     // ISO emoji-friendly e.g. "GB", "US", "DE", "FR", "RU", "JP", "IT"
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
