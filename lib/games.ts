import type { GameMeta } from "./types";

export const GAMES: GameMeta[] = [
  { slug: "world-conqueror-4", name: "World Conqueror 4",     shortName: "WC4", era: "WW2 + Guerre Froide + Moderne", tagline: "Conquérez le XXe siècle", available: true },
  { slug: "european-war-7",    name: "European War 7: Medieval", shortName: "EW7", era: "Médiéval",                       tagline: "Royaumes & dynasties",      available: false },
  { slug: "european-war-6",    name: "European War 6: 1914",  shortName: "EW6", era: "WW1",                           tagline: "La Grande Guerre",          available: false },
  { slug: "great-conqueror-rome", name: "Great Conqueror: Rome", shortName: "GCR", era: "Antiquité",                    tagline: "Légions de Rome",           available: false },
];

export function getGame(slug: string): GameMeta | null {
  return GAMES.find(g => g.slug === slug) ?? null;
}
