import fs from "node:fs";
import path from "node:path";
import type { UnitData, Category, Tier } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "wc4", "elite-units");

export function getAllEliteUnits(): UnitData[] {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json") && !f.startsWith("_"));
  const units: UnitData[] = files.map(f => {
    const raw = fs.readFileSync(path.join(DATA_DIR, f), "utf8");
    return JSON.parse(raw);
  });
  // Sort: tier S > A > B > C, then by name
  const tierOrder: Record<Tier, number> = { S: 0, A: 1, B: 2, C: 3 };
  return units.sort((a, b) => {
    const t = tierOrder[a.tier] - tierOrder[b.tier];
    if (t !== 0) return t;
    return a.name.localeCompare(b.name, "fr");
  });
}

export function getEliteUnit(slug: string): UnitData | null {
  const file = path.join(DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function getUnitsByCategory(cat: Category): UnitData[] {
  return getAllEliteUnits().filter(u => u.category === cat);
}

export function getAllSlugs(): string[] {
  return fs
    .readdirSync(DATA_DIR)
    .filter(f => f.endsWith(".json") && !f.startsWith("_"))
    .map(f => f.replace(/\.json$/, ""));
}

export const CATEGORY_META: Record<Category, { label: string; icon: string; plural: string }> = {
  tank:      { label: "Char",       icon: "🛡️", plural: "Chars" },
  infantry:  { label: "Infanterie", icon: "🪖", plural: "Infanterie" },
  artillery: { label: "Artillerie", icon: "🎯", plural: "Artillerie" },
  navy:      { label: "Marine",     icon: "⚓", plural: "Marine" },
  airforce:  { label: "Aviation",   icon: "✈️", plural: "Aviation" },
};

export const COUNTRY_FLAGS: Record<string, string> = {
  GB: "🇬🇧", US: "🇺🇸", DE: "🇩🇪", FR: "🇫🇷", RU: "🇷🇺",
  JP: "🇯🇵", IT: "🇮🇹", CN: "🇨🇳", IL: "🇮🇱", PL: "🇵🇱",
};
