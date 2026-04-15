import fs from "node:fs";
import path from "node:path";
import type { Tech, TechCategory, TechIndex } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "wc4", "technologies");

let _indexCache: TechIndex | null = null;

export function getTechIndex(): TechIndex {
  if (_indexCache) return _indexCache;
  const p = path.join(DATA_DIR, "_index.json");
  if (!fs.existsSync(p)) {
    _indexCache = {
      version: 1,
      totalTechs: 0,
      byCategory: {} as Record<TechCategory, number>,
      techs: [],
    };
    return _indexCache;
  }
  _indexCache = JSON.parse(fs.readFileSync(p, "utf8")) as TechIndex;
  return _indexCache;
}

export function getAllTechSlugs(): string[] {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function getTech(slug: string): Tech | null {
  const p = path.join(DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8")) as Tech;
}

export function getTechsByCategory(category: TechCategory): Tech[] {
  return getAllTechSlugs()
    .map((s) => getTech(s))
    .filter((t): t is Tech => t !== null && t.category === category)
    .sort((a, b) => a.nameEn.localeCompare(b.nameEn));
}

export const TECH_CATEGORIES: {
  id: TechCategory;
  icon: string;
  nameKey: string;
}[] = [
  { id: "infantry", icon: "🪖", nameKey: "techPage.category.infantry" },
  { id: "armor", icon: "🛡", nameKey: "techPage.category.armor" },
  { id: "artillery", icon: "🎯", nameKey: "techPage.category.artillery" },
  { id: "navy", icon: "⚓", nameKey: "techPage.category.navy" },
  { id: "airforce", icon: "✈", nameKey: "techPage.category.airforce" },
  { id: "fortifications", icon: "🏰", nameKey: "techPage.category.fortifications" },
  { id: "antiair", icon: "🛰", nameKey: "techPage.category.antiair" },
  { id: "missile", icon: "🚀", nameKey: "techPage.category.missile" },
];
