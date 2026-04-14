import fs from "node:fs";
import path from "node:path";
import type { UnitData, Category, Tier, Faction, GeneralData, GeneralCategory } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "wc4", "elite-units");
const GENERALS_DIR = path.join(process.cwd(), "data", "wc4", "generals");

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
  XX: "🦂",
};
