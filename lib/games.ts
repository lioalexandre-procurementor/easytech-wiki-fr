import type { Game, GameMeta } from "./types";

export const GAMES: GameMeta[] = [
  {
    slug: "world-conqueror-4",
    name: "World Conqueror 4",
    shortName: "WC4",
    era: "WW2 + Guerre Froide + Moderne",
    tagline: "Conquérez le XXe siècle",
    available: true,
    attributeKeys: ["infantry", "artillery", "armor", "navy", "airforce", "marching"],
    generalCategories: ["tank", "artillery", "infantry", "navy", "airforce", "balanced"],
    unitCategories: ["tank", "infantry", "artillery", "navy", "airforce"],
    factions: ["standard", "scorpion"],
    dataDir: "wc4",
    imageDir: "wc4",
  },
  {
    slug: "great-conqueror-rome",
    name: "Great Conqueror: Rome",
    shortName: "GCR",
    era: "Antiquité",
    tagline: "Légions de Rome",
    available: true,
    attributeKeys: ["infantry", "cavalry", "archer", "navy"],
    generalCategories: ["infantry", "cavalry", "archer", "navy", "balanced"],
    unitCategories: ["infantry", "cavalry", "archer", "navy"],
    factions: ["standard", "barbarian"],
    dataDir: "gcr",
    imageDir: "gcr",
  },
  {
    slug: "european-war-7",
    name: "European War 7: Medieval",
    shortName: "EW7",
    era: "Médiéval",
    tagline: "Royaumes & dynasties",
    available: false,
  },
  {
    slug: "european-war-6",
    name: "European War 6: 1914",
    shortName: "EW6",
    era: "Napoléonien & WW1",
    tagline: "De Napoléon à la Grande Guerre",
    available: true,
    attributeKeys: ["infantry", "cavalry", "artillery", "navy"],
    generalCategories: ["infantry", "cavalry", "artillery", "navy", "balanced"],
    unitCategories: ["infantry", "cavalry", "artillery", "navy"],
    factions: ["standard"],
    dataDir: "ew6",
    imageDir: "ew6",
  },
];

export function getGame(slug: string): GameMeta | null {
  return GAMES.find((g) => g.slug === slug) ?? null;
}

/**
 * Per-game URL segment for the "generals" hub (locale-prefix free).
 * Single source of truth; used by the leaderboards page, unit-detail
 * best-general widget, and any other surface that deep-links into a
 * game's generals. Regressions here produce cross-game 404s (e.g. a
 * WC4 general slug resolving under /great-conqueror-rome/generaux).
 */
export function generalsHubPath(game: Game): string {
  if (game === "wc4") return "/world-conqueror-4/generaux";
  if (game === "gcr") return "/great-conqueror-rome/generaux";
  return "/european-war-6/generaux";
}

export function unitHubPath(game: Game): string {
  if (game === "wc4") return "/world-conqueror-4/unites-elite";
  if (game === "gcr") return "/great-conqueror-rome/unites-elite";
  return "/european-war-6/unites-elite";
}
