/* eslint-disable no-console */
/**
 * Build a static search index at public/search-index.json by walking
 * data/wc4/{generals,elite-units,skills,updates}/*.json and emitting a
 * flat array of search items.
 *
 * Each item carries both locales' names so a single index serves FR + EN.
 * The client filters by locale at query time.
 *
 * Run via `npm run build-search` or automatically as a `prebuild` hook.
 */
import fs from "node:fs";
import path from "node:path";

type SearchItemType = "general" | "unit" | "skill" | "update" | "tech" | "guide";

interface SearchItem {
  type: SearchItemType;
  slug: string;
  /** Primary display name (EN). */
  name: string;
  /** French display name. */
  nameFr: string;
  /** Short description / subtitle (EN). */
  desc?: string;
  /** French short description. */
  descFr?: string;
  /** Category / faction / tier string for grouping or display. */
  category?: string;
  /** ISO country code for flag rendering (generals only). */
  country?: string;
  /** Quality tier (generals: bronze/silver/gold/marshal, units: S/A/B/C). */
  tier?: string;
  /** Href path segment suffix (after /{locale}/world-conqueror-4/...). */
  path: { fr: string; en: string };
}

const ROOT = process.cwd();
const DATA = path.join(ROOT, "data", "wc4");
const OUT = path.join(ROOT, "public", "search-index.json");

function readJsonDir(subdir: string): Array<Record<string, unknown>> {
  const dir = path.join(DATA, subdir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as Record<string, unknown>);
}

function buildGenerals(): SearchItem[] {
  return readJsonDir("generals").map((g) => ({
    type: "general",
    slug: g.slug as string,
    name: (g.nameEn as string) || (g.nameCanonical as string) || (g.name as string),
    nameFr: (g.name as string),
    desc: (g.shortDescEn as string) || (g.shortDesc as string) || "",
    descFr: (g.shortDesc as string) || "",
    category: (g.category as string) || "",
    country: (g.country as string) || "",
    tier: (g.quality as string) || (g.rank as string) || "",
    path: {
      fr: `/world-conqueror-4/generaux/${g.slug as string}`,
      en: `/world-conqueror-4/generals/${g.slug as string}`,
    },
  }));
}

function buildUnits(): SearchItem[] {
  return readJsonDir("elite-units").map((u) => ({
    type: "unit",
    slug: u.slug as string,
    name: (u.nameEn as string) || (u.name as string),
    nameFr: (u.name as string),
    desc: (u.shortDescEn as string) || (u.shortDesc as string) || "",
    descFr: (u.shortDesc as string) || "",
    category: (u.category as string) || "",
    country: (u.country as string) || "",
    tier: (u.tier as string) || "",
    path: {
      fr: `/world-conqueror-4/unites-elite/${u.slug as string}`,
      en: `/world-conqueror-4/elite-units/${u.slug as string}`,
    },
  }));
}

function buildSkills(): SearchItem[] {
  return readJsonDir("skills").map((s) => ({
    type: "skill",
    slug: s.slug as string,
    name: (s.name as string) || "",
    nameFr: (s.nameFr as string) || (s.name as string) || "",
    desc: (s.shortDesc as string) || "",
    descFr: (s.shortDescFr as string) || "",
    category: s.series != null ? `Series ${s.series}` : "",
    path: {
      fr: `/world-conqueror-4/competences/${s.slug as string}`,
      en: `/world-conqueror-4/skills/${s.slug as string}`,
    },
  }));
}

function buildUpdates(): SearchItem[] {
  return readJsonDir("updates").map((u) => {
    const title = (u.title as { fr: string; en: string }) || { fr: "", en: "" };
    const summary = (u.summary as { fr: string; en: string }) || { fr: "", en: "" };
    return {
      type: "update" as SearchItemType,
      slug: u.slug as string,
      name: title.en || title.fr || (u.slug as string),
      nameFr: title.fr || title.en || (u.slug as string),
      desc: summary.en,
      descFr: summary.fr,
      category: (u.version as string) || "",
      path: {
        fr: `/world-conqueror-4/mises-a-jour/${u.slug as string}`,
        en: `/world-conqueror-4/updates/${u.slug as string}`,
      },
    };
  });
}

function buildTechs(): SearchItem[] {
  return readJsonDir("technologies").map((t) => ({
    type: "tech" as SearchItemType,
    slug: t.slug as string,
    name: (t.nameEn as string) || "",
    nameFr: (t.nameFr as string) || (t.nameEn as string) || "",
    desc: "",
    descFr: "",
    category: (t.category as string) || "",
    path: {
      fr: `/world-conqueror-4/technologies/${t.slug as string}`,
      en: `/world-conqueror-4/technologies/${t.slug as string}`,
    },
  }));
}

function readGuidesDir(): Array<Record<string, unknown>> {
  const dir = path.join(ROOT, "content", "guides", "wc4");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as Record<string, unknown>);
}

function buildGuides(): SearchItem[] {
  return readGuidesDir().map((g) => {
    const title = (g.title as { fr: string; en: string }) || { fr: "", en: "" };
    const desc = (g.description as { fr: string; en: string }) || { fr: "", en: "" };
    return {
      type: "guide" as SearchItemType,
      slug: g.slug as string,
      name: title.en || title.fr || (g.slug as string),
      nameFr: title.fr || title.en || (g.slug as string),
      desc: desc.en,
      descFr: desc.fr,
      category: (g.category as string) || "",
      path: {
        fr: `/world-conqueror-4/guides/${g.slug as string}`,
        en: `/world-conqueror-4/guides/${g.slug as string}`,
      },
    };
  });
}

const items: SearchItem[] = [
  ...buildGenerals(),
  ...buildUnits(),
  ...buildSkills(),
  ...buildUpdates(),
  ...buildTechs(),
  ...buildGuides(),
];

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ version: 1, builtAt: new Date().toISOString(), items }));
console.log(`✔ Wrote ${items.length} items to ${path.relative(ROOT, OUT)}`);
