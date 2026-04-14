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

export interface GeneralData {
  slug: string;
  name: string;
  nameEn?: string;
  faction: Faction;     // standard ou scorpion
  category: GeneralCategory;
  rank: GeneralRank;
  country: string;
  countryName: string;
  shortDesc: string;
  longDesc: string;
  skills: { name: string; desc: string }[];
  bonuses: { target: string; value: string }[];    // ex: { target: "Tank attack", value: "+30%" }
  obtainability: "free" | "event" | "shop" | "premium" | "campaign";
  recommendedUnits: string[];   // slugs des unités que ce général boost
  verified: boolean;
  sources?: string[];
}
