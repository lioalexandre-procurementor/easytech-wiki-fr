import fs from "node:fs";
import path from "node:path";
import type { Formation, FormationUnit, Category } from "./types";
import { getEliteUnit } from "./units";

const DATA_DIR = path.join(process.cwd(), "data", "wc4", "formations");

/** Render-ready unit row — pre-resolved server-side so client components don't import node:fs. */
export type ResolvedFormationUnit =
  | { kind: "base"; name: string; category: Category }
  | {
      kind: "elite";
      slug: string;
      name: string;
      category: Category;
      sprite: string | null;
      href: string; // locale-aware detail URL
    };

/** Read the ordered slug list from _index.json. Falls back to filesystem scan if absent. */
export function getAllFormationSlugs(): string[] {
  if (!fs.existsSync(DATA_DIR)) return [];
  const indexPath = path.join(DATA_DIR, "_index.json");
  if (fs.existsSync(indexPath)) {
    const idx = JSON.parse(fs.readFileSync(indexPath, "utf8")) as { slugs: string[] };
    return idx.slugs;
  }
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(/\.json$/, ""));
}

/** Load one formation by slug, or null if missing. */
export function getFormation(slug: string): Formation | null {
  const file = path.join(DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as Formation;
}

/** Load all formations in their canonical display order. */
export function getAllFormations(): Formation[] {
  const slugs = getAllFormationSlugs();
  return slugs
    .map((s) => getFormation(s))
    .filter((f): f is Formation => f !== null)
    .sort((a, b) => a.order - b.order);
}

/** Pre-resolve a formation's unit list into render-ready rows (server-side). */
export function resolveFormationUnits(units: FormationUnit[], locale?: string): ResolvedFormationUnit[] {
  return units.map((u): ResolvedFormationUnit => {
    if (u.kind === "base") {
      const name = locale === "en" ? u.nameEn : locale === "de" ? u.nameDe : u.name;
      return { kind: "base", name, category: u.category };
    }
    const elite = getEliteUnit(u.slug);
    if (!elite) {
      return { kind: "elite", slug: u.slug, name: u.slug, category: "infantry", sprite: null, href: "" };
    }
    const name = locale === "en" ? elite.nameEn ?? elite.name : elite.name;
    const href =
      locale === "fr"
        ? `/world-conqueror-4/unites-elite/${elite.slug}`
        : `/world-conqueror-4/elite-units/${elite.slug}`;
    return {
      kind: "elite",
      slug: elite.slug,
      name,
      category: elite.category,
      sprite: elite.image?.sprite ?? null,
      href,
    };
  });
}

/** Resolve localized fields for a formation given a locale. */
export function localizedFormationField(
  formation: Formation,
  field: "name" | "historicalUnit" | "countryName" | "operationName",
  locale?: string,
): string {
  if (locale === "en") {
    const en = (formation as unknown as Record<string, string>)[`${field}En`];
    if (en) return en;
  }
  if (locale === "de") {
    const de = (formation as unknown as Record<string, string>)[`${field}De`];
    if (de) return de;
  }
  return ((formation as unknown as Record<string, string>)[field]) ?? "";
}
