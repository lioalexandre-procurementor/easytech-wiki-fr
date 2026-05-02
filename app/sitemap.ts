import type { MetadataRoute } from "next";
import fs from "node:fs";
import path from "node:path";
import { getAllGeneralSlugs, getAllSlugs as getAllEliteSlugs } from "@/lib/units";
import { getAllGuideSlugs } from "@/lib/guides";
import { getAllFormationSlugs } from "@/lib/formations";
import {
  getAllGeneralSlugs as getAllGcrGeneralSlugs,
  getAllSlugs as getAllGcrEliteSlugs,
  getAllSkillSlugs as getAllGcrSkillSlugs,
  getAllTechSlugs as getAllGcrTechSlugs,
  getGeneral as getGcrGeneral,
  getEliteUnit as getGcrEliteUnit,
} from "@/lib/gcr";
import {
  getAllGeneralSlugs as getAllEw6GeneralSlugs,
  getAllSlugs as getAllEw6EliteSlugs,
  getAllSkillSlugs as getAllEw6SkillSlugs,
  getAllTechSlugs as getAllEw6TechSlugs,
  getGeneral as getEw6General,
  getEliteUnit as getEw6EliteUnit,
} from "@/lib/ew6";
import { getGame } from "@/lib/games";
import { isPlaceholder } from "@/lib/placeholder";
import { locales } from "@/src/i18n/config";
import {
  BASE_URL,
  urlFor,
  sitemapAlternates,
  type LocalePair,
} from "@/lib/seo-alternates";

/**
 * Sitemap rules enforced here (mirror Google's "Sitemaps general guidelines"):
 *
 *  1. Only canonical URLs that return HTTP 200. We never list redirects
 *     (e.g. `/book` → `/services`) and never list URLs whose canonical
 *     points elsewhere — the `/[slug]/trained` and
 *     `/[slug]/premium-training` "alternate views" are intentionally
 *     omitted because their `<link rel="canonical">` points back to the
 *     base general page (see app/[locale]/world-conqueror-4/generaux/[slug]/
 *     trained/page.tsx and .../premium-training/page.tsx).
 *
 *  2. Only URLs the page itself marks as indexable. EW6/GCR placeholder
 *     general/unit pages set `robots: { index: false }` AND we filter
 *     them out here via `isPlaceholder()` so noindex pages never appear
 *     in the sitemap.
 *
 *  3. `lastModified` reflects real content change time when we have it
 *     (file mtime for JSON-derived routes); falls back to build time for
 *     code-only static routes.
 *
 *  4. Hreflang alternates are emitted in HTML metadata AND here. Both
 *     must use the same path pairs — see lib/seo-alternates.ts.
 */

const BUILD_TIME = new Date();

/** mtime of a file, or BUILD_TIME if it doesn't exist. */
function mtimeOrBuild(filepath: string): Date {
  try {
    return fs.statSync(filepath).mtime;
  } catch {
    return BUILD_TIME;
  }
}

/** Newest mtime across the JSONs in `dir` (excluding `_index.json`). */
function dirNewestMtime(dir: string): Date {
  if (!fs.existsSync(dir)) return BUILD_TIME;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"));
  let newest = 0;
  for (const f of files) {
    const m = fs.statSync(path.join(dir, f)).mtimeMs;
    if (m > newest) newest = m;
  }
  return newest > 0 ? new Date(newest) : BUILD_TIME;
}

const WC4_DATA = path.join(process.cwd(), "data", "wc4");
const GCR_DATA = path.join(process.cwd(), "data", "gcr");
const EW6_DATA = path.join(process.cwd(), "data", "ew6");

// ---------------------------------------------------------------------
// Localized path pairs — must mirror src/i18n/config.ts pathnames.
// ---------------------------------------------------------------------

function generalBase(slug: string): LocalePair {
  return {
    fr: `/world-conqueror-4/generaux/${slug}`,
    en: `/world-conqueror-4/generals/${slug}`,
    de: `/world-conqueror-4/generals/${slug}`,
  };
}

function eliteBase(slug: string): LocalePair {
  return {
    fr: `/world-conqueror-4/unites-elite/${slug}`,
    en: `/world-conqueror-4/elite-units/${slug}`,
    de: `/world-conqueror-4/elite-units/${slug}`,
  };
}

function skillBase(slug: string): LocalePair {
  return {
    fr: `/world-conqueror-4/competences/${slug}`,
    en: `/world-conqueror-4/skills/${slug}`,
    de: `/world-conqueror-4/skills/${slug}`,
  };
}

function updateDetail(slug: string): LocalePair {
  return {
    fr: `/world-conqueror-4/mises-a-jour/${slug}`,
    en: `/world-conqueror-4/updates/${slug}`,
    de: `/world-conqueror-4/updates/${slug}`,
  };
}

function getAllUpdateSlugsFromFs(): string[] {
  const dir = path.join(WC4_DATA, "updates");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(/\.json$/, ""));
}

function getAllTechSlugsFromFs(): string[] {
  const dir = path.join(WC4_DATA, "technologies");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(/\.json$/, ""));
}

function getAllSkillSlugs(): string[] {
  const dir = path.join(WC4_DATA, "skills");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(/\.json$/, ""));
}

type StaticRoute = {
  pair: LocalePair;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  lastModified?: Date;
};

function emitLocalized(
  entries: MetadataRoute.Sitemap,
  route: StaticRoute,
): void {
  for (const locale of locales) {
    entries.push({
      url: urlFor(locale, route.pair),
      lastModified: route.lastModified ?? BUILD_TIME,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: sitemapAlternates(route.pair),
    });
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  const wc4GeneralsMtime = dirNewestMtime(path.join(WC4_DATA, "generals"));
  const wc4EliteMtime = dirNewestMtime(path.join(WC4_DATA, "elite-units"));
  const wc4SkillsMtime = dirNewestMtime(path.join(WC4_DATA, "skills"));
  const wc4TechMtime = dirNewestMtime(path.join(WC4_DATA, "technologies"));
  const wc4UpdatesMtime = dirNewestMtime(path.join(WC4_DATA, "updates"));

  // -------------------------------------------------------------------
  // Site-wide / cross-game
  // -------------------------------------------------------------------
  const siteRoutes: StaticRoute[] = [
    { pair: { fr: "", en: "", de: "" }, priority: 1, changeFrequency: "weekly" },
    {
      pair: { fr: "/classements", en: "/leaderboards", de: "/bestenlisten" },
      priority: 0.8,
      changeFrequency: "daily",
    },
  ];
  for (const route of siteRoutes) emitLocalized(entries, route);

  // -------------------------------------------------------------------
  // World Conqueror 4 — static hubs
  // -------------------------------------------------------------------
  const wc4StaticRoutes: StaticRoute[] = [
    {
      pair: { fr: "/world-conqueror-4", en: "/world-conqueror-4", de: "/world-conqueror-4" },
      priority: 0.9,
      changeFrequency: "weekly",
    },
    {
      pair: { fr: "/world-conqueror-4/generaux", en: "/world-conqueror-4/generals", de: "/world-conqueror-4/generals" },
      priority: 0.9,
      changeFrequency: "weekly",
      lastModified: wc4GeneralsMtime,
    },
    {
      pair: { fr: "/world-conqueror-4/unites-elite", en: "/world-conqueror-4/elite-units", de: "/world-conqueror-4/elite-units" },
      priority: 0.9,
      changeFrequency: "weekly",
      lastModified: wc4EliteMtime,
    },
    {
      pair: { fr: "/world-conqueror-4/competences", en: "/world-conqueror-4/skills", de: "/world-conqueror-4/skills" },
      priority: 0.8,
      changeFrequency: "weekly",
      lastModified: wc4SkillsMtime,
    },
    {
      pair: { fr: "/world-conqueror-4/empire-du-scorpion", en: "/world-conqueror-4/scorpion-empire", de: "/world-conqueror-4/scorpion-empire" },
      priority: 0.6,
      changeFrequency: "monthly",
    },
    {
      pair: { fr: "/world-conqueror-4/mises-a-jour", en: "/world-conqueror-4/updates", de: "/world-conqueror-4/updates" },
      priority: 0.8,
      changeFrequency: "weekly",
      lastModified: wc4UpdatesMtime,
    },
    {
      pair: { fr: "/world-conqueror-4/tier-list", en: "/world-conqueror-4/tier-list", de: "/world-conqueror-4/tier-list" },
      priority: 0.8,
      changeFrequency: "monthly",
      lastModified: wc4GeneralsMtime,
    },
    {
      pair: { fr: "/world-conqueror-4/formations-legendes", en: "/world-conqueror-4/legend-formations", de: "/world-conqueror-4/legend-formations" },
      priority: 0.8,
      changeFrequency: "monthly",
    },
    {
      pair: { fr: "/world-conqueror-4/comparateur/generaux", en: "/world-conqueror-4/comparator/generals", de: "/world-conqueror-4/comparator/generals" },
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      pair: { fr: "/world-conqueror-4/comparateur/unites", en: "/world-conqueror-4/comparator/units", de: "/world-conqueror-4/comparator/units" },
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      pair: { fr: "/world-conqueror-4/technologies", en: "/world-conqueror-4/technologies", de: "/world-conqueror-4/technologies" },
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: wc4TechMtime,
    },
    {
      pair: { fr: "/world-conqueror-4/guides", en: "/world-conqueror-4/guides", de: "/world-conqueror-4/guides" },
      priority: 0.8,
      changeFrequency: "weekly",
    },
  ];
  for (const route of wc4StaticRoutes) emitLocalized(entries, route);

  // -------------------------------------------------------------------
  // Legal pages — translated content, real URLs
  // -------------------------------------------------------------------
  const legalRoutes: StaticRoute[] = [
    {
      pair: { fr: "/legal/votes", en: "/legal/votes", de: "/legal/votes" },
      priority: 0.3,
      changeFrequency: "yearly",
    },
    {
      pair: { fr: "/legal/mentions-legales", en: "/legal/legal-notice", de: "/legal/legal-notice" },
      priority: 0.3,
      changeFrequency: "yearly",
    },
    {
      pair: { fr: "/legal/confidentialite", en: "/legal/privacy", de: "/legal/privacy" },
      priority: 0.3,
      changeFrequency: "yearly",
    },
    {
      pair: { fr: "/legal/cookies", en: "/legal/cookies", de: "/legal/cookies" },
      priority: 0.3,
      changeFrequency: "yearly",
    },
    {
      pair: { fr: "/legal/cgu", en: "/legal/terms", de: "/legal/terms" },
      priority: 0.3,
      changeFrequency: "yearly",
    },
    {
      pair: { fr: "/legal/a-propos", en: "/legal/about", de: "/legal/about" },
      priority: 0.4,
      changeFrequency: "monthly",
    },
    {
      pair: { fr: "/legal/contact", en: "/legal/contact", de: "/legal/contact" },
      priority: 0.4,
      changeFrequency: "yearly",
    },
  ];
  for (const route of legalRoutes) emitLocalized(entries, route);

  // -------------------------------------------------------------------
  // WC4 generals — base view ONLY. The /trained ("Maxed out") and
  // /premium-training views canonical back to this base page (see those
  // page.tsx files), so listing them here would create
  // "alternate page with proper canonical tag" GSC entries and waste
  // crawl budget. Additionally, /premium-training only renders for the
  // 20 generals with hasTrainingPath+trainedSkills — emitting it for
  // all 104 generated 252 hard 404s in the previous version of this file.
  // -------------------------------------------------------------------
  for (const slug of getAllGeneralSlugs()) {
    const pair = generalBase(slug);
    const lm = mtimeOrBuild(path.join(WC4_DATA, "generals", `${slug}.json`));
    for (const locale of locales) {
      entries.push({
        url: urlFor(locale, pair),
        lastModified: lm,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: sitemapAlternates(pair),
      });
    }
  }

  // WC4 elite units
  for (const slug of getAllEliteSlugs()) {
    const pair = eliteBase(slug);
    const lm = mtimeOrBuild(path.join(WC4_DATA, "elite-units", `${slug}.json`));
    for (const locale of locales) {
      entries.push({
        url: urlFor(locale, pair),
        lastModified: lm,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: sitemapAlternates(pair),
      });
    }
  }

  // WC4 skill catalog detail pages
  for (const slug of getAllSkillSlugs()) {
    const pair = skillBase(slug);
    const lm = mtimeOrBuild(path.join(WC4_DATA, "skills", `${slug}.json`));
    for (const locale of locales) {
      entries.push({
        url: urlFor(locale, pair),
        lastModified: lm,
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: sitemapAlternates(pair),
      });
    }
  }

  // WC4 tech categories
  const TECH_CATS = [
    "infantry",
    "armor",
    "artillery",
    "navy",
    "airforce",
    "fortifications",
    "antiair",
    "missile",
  ] as const;
  for (const cat of TECH_CATS) {
    const pair: LocalePair = {
      fr: `/world-conqueror-4/technologies/categorie/${cat}`,
      en: `/world-conqueror-4/technologies/category/${cat}`,
      de: `/world-conqueror-4/technologies/category/${cat}`,
    };
    for (const locale of locales) {
      entries.push({
        url: urlFor(locale, pair),
        lastModified: wc4TechMtime,
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: sitemapAlternates(pair),
      });
    }
  }

  // WC4 tech detail pages
  for (const slug of getAllTechSlugsFromFs()) {
    const pair: LocalePair = {
      fr: `/world-conqueror-4/technologies/${slug}`,
      en: `/world-conqueror-4/technologies/${slug}`,
      de: `/world-conqueror-4/technologies/${slug}`,
    };
    const lm = mtimeOrBuild(path.join(WC4_DATA, "technologies", `${slug}.json`));
    for (const locale of locales) {
      entries.push({
        url: urlFor(locale, pair),
        lastModified: lm,
        changeFrequency: "monthly",
        priority: 0.5,
        alternates: sitemapAlternates(pair),
      });
    }
  }

  // WC4 updates detail pages
  for (const slug of getAllUpdateSlugsFromFs()) {
    const pair = updateDetail(slug);
    const lm = mtimeOrBuild(path.join(WC4_DATA, "updates", `${slug}.json`));
    for (const locale of locales) {
      entries.push({
        url: urlFor(locale, pair),
        lastModified: lm,
        changeFrequency: "yearly",
        priority: 0.5,
        alternates: sitemapAlternates(pair),
      });
    }
  }

  // WC4 guide detail pages
  for (const slug of getAllGuideSlugs()) {
    const pair: LocalePair = {
      fr: `/world-conqueror-4/guides/${slug}`,
      en: `/world-conqueror-4/guides/${slug}`,
      de: `/world-conqueror-4/guides/${slug}`,
    };
    for (const locale of locales) {
      entries.push({
        url: urlFor(locale, pair),
        lastModified: BUILD_TIME,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: sitemapAlternates(pair),
      });
    }
  }

  // WC4 legend formations detail pages
  for (const slug of getAllFormationSlugs()) {
    const pair: LocalePair = {
      fr: `/world-conqueror-4/formations-legendes/${slug}`,
      en: `/world-conqueror-4/legend-formations/${slug}`,
      de: `/world-conqueror-4/legend-formations/${slug}`,
    };
    for (const locale of locales) {
      entries.push({
        url: urlFor(locale, pair),
        lastModified: BUILD_TIME,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: sitemapAlternates(pair),
      });
    }
  }

  // -------------------------------------------------------------------
  // Great Conqueror: Rome — gated on game.available so scaffolded
  // routes don't leak into the index pre-launch.
  // -------------------------------------------------------------------
  const gcrGame = getGame("great-conqueror-rome");
  if (gcrGame?.available) {
    const gcrGenMtime = dirNewestMtime(path.join(GCR_DATA, "generals"));
    const gcrEliteMtime = dirNewestMtime(path.join(GCR_DATA, "elite-units"));
    const gcrSkillsMtime = dirNewestMtime(path.join(GCR_DATA, "skills"));
    const gcrTechMtime = dirNewestMtime(path.join(GCR_DATA, "technologies"));

    const gcrStaticRoutes: StaticRoute[] = [
      { pair: { fr: "/great-conqueror-rome", en: "/great-conqueror-rome", de: "/great-conqueror-rome" }, priority: 0.9, changeFrequency: "weekly" },
      { pair: { fr: "/great-conqueror-rome/generaux", en: "/great-conqueror-rome/generals", de: "/great-conqueror-rome/generals" }, priority: 0.9, changeFrequency: "weekly", lastModified: gcrGenMtime },
      { pair: { fr: "/great-conqueror-rome/unites-elite", en: "/great-conqueror-rome/elite-units", de: "/great-conqueror-rome/elite-units" }, priority: 0.9, changeFrequency: "weekly", lastModified: gcrEliteMtime },
      { pair: { fr: "/great-conqueror-rome/competences", en: "/great-conqueror-rome/skills", de: "/great-conqueror-rome/skills" }, priority: 0.8, changeFrequency: "weekly", lastModified: gcrSkillsMtime },
      { pair: { fr: "/great-conqueror-rome/technologies", en: "/great-conqueror-rome/technologies", de: "/great-conqueror-rome/technologies" }, priority: 0.7, changeFrequency: "monthly", lastModified: gcrTechMtime },
      { pair: { fr: "/great-conqueror-rome/conquete-romaine", en: "/great-conqueror-rome/roman-conquest", de: "/great-conqueror-rome/roman-conquest" }, priority: 0.6, changeFrequency: "monthly" },
      { pair: { fr: "/great-conqueror-rome/comparateur/generaux", en: "/great-conqueror-rome/comparator/generals", de: "/great-conqueror-rome/comparator/generals" }, priority: 0.7, changeFrequency: "monthly" },
      { pair: { fr: "/great-conqueror-rome/comparateur/unites", en: "/great-conqueror-rome/comparator/units", de: "/great-conqueror-rome/comparator/units" }, priority: 0.7, changeFrequency: "monthly" },
      { pair: { fr: "/great-conqueror-rome/guides", en: "/great-conqueror-rome/guides", de: "/great-conqueror-rome/guides" }, priority: 0.7, changeFrequency: "weekly" },
      { pair: { fr: "/great-conqueror-rome/mises-a-jour", en: "/great-conqueror-rome/updates", de: "/great-conqueror-rome/updates" }, priority: 0.7, changeFrequency: "weekly" },
    ];
    for (const route of gcrStaticRoutes) emitLocalized(entries, route);

    for (const slug of getAllGcrGeneralSlugs()) {
      const entity = getGcrGeneral(slug);
      if (!entity || isPlaceholder(entity)) continue;
      const pair: LocalePair = {
        fr: `/great-conqueror-rome/generaux/${slug}`,
        en: `/great-conqueror-rome/generals/${slug}`,
        de: `/great-conqueror-rome/generals/${slug}`,
      };
      const lm = mtimeOrBuild(path.join(GCR_DATA, "generals", `${slug}.json`));
      for (const locale of locales) {
        entries.push({
          url: urlFor(locale, pair),
          lastModified: lm,
          changeFrequency: "monthly",
          priority: 0.8,
          alternates: sitemapAlternates(pair),
        });
      }
    }

    for (const slug of getAllGcrEliteSlugs()) {
      const entity = getGcrEliteUnit(slug);
      if (!entity || isPlaceholder(entity)) continue;
      const pair: LocalePair = {
        fr: `/great-conqueror-rome/unites-elite/${slug}`,
        en: `/great-conqueror-rome/elite-units/${slug}`,
        de: `/great-conqueror-rome/elite-units/${slug}`,
      };
      const lm = mtimeOrBuild(path.join(GCR_DATA, "elite-units", `${slug}.json`));
      for (const locale of locales) {
        entries.push({
          url: urlFor(locale, pair),
          lastModified: lm,
          changeFrequency: "monthly",
          priority: 0.8,
          alternates: sitemapAlternates(pair),
        });
      }
    }

    for (const slug of getAllGcrSkillSlugs()) {
      const pair: LocalePair = {
        fr: `/great-conqueror-rome/competences/${slug}`,
        en: `/great-conqueror-rome/skills/${slug}`,
        de: `/great-conqueror-rome/skills/${slug}`,
      };
      const lm = mtimeOrBuild(path.join(GCR_DATA, "skills", `${slug}.json`));
      for (const locale of locales) {
        entries.push({
          url: urlFor(locale, pair),
          lastModified: lm,
          changeFrequency: "monthly",
          priority: 0.6,
          alternates: sitemapAlternates(pair),
        });
      }
    }

    for (const slug of getAllGcrTechSlugs()) {
      const pair: LocalePair = {
        fr: `/great-conqueror-rome/technologies/${slug}`,
        en: `/great-conqueror-rome/technologies/${slug}`,
        de: `/great-conqueror-rome/technologies/${slug}`,
      };
      const lm = mtimeOrBuild(path.join(GCR_DATA, "technologies", `${slug}.json`));
      for (const locale of locales) {
        entries.push({
          url: urlFor(locale, pair),
          lastModified: lm,
          changeFrequency: "monthly",
          priority: 0.5,
          alternates: sitemapAlternates(pair),
        });
      }
    }
  }

  // -------------------------------------------------------------------
  // European War 6: 1914 — gated on game.available
  // -------------------------------------------------------------------
  const ew6Game = getGame("european-war-6");
  if (ew6Game?.available) {
    const ew6GenMtime = dirNewestMtime(path.join(EW6_DATA, "generals"));
    const ew6EliteMtime = dirNewestMtime(path.join(EW6_DATA, "elite-units"));
    const ew6SkillsMtime = dirNewestMtime(path.join(EW6_DATA, "skills"));
    const ew6TechMtime = dirNewestMtime(path.join(EW6_DATA, "technologies"));

    const ew6StaticRoutes: StaticRoute[] = [
      { pair: { fr: "/european-war-6", en: "/european-war-6", de: "/european-war-6" }, priority: 0.9, changeFrequency: "weekly" },
      { pair: { fr: "/european-war-6/generaux", en: "/european-war-6/generals", de: "/european-war-6/generals" }, priority: 0.9, changeFrequency: "weekly", lastModified: ew6GenMtime },
      { pair: { fr: "/european-war-6/unites-elite", en: "/european-war-6/elite-units", de: "/european-war-6/elite-units" }, priority: 0.9, changeFrequency: "weekly", lastModified: ew6EliteMtime },
      { pair: { fr: "/european-war-6/competences", en: "/european-war-6/skills", de: "/european-war-6/skills" }, priority: 0.8, changeFrequency: "weekly", lastModified: ew6SkillsMtime },
      { pair: { fr: "/european-war-6/technologies", en: "/european-war-6/technologies", de: "/european-war-6/technologies" }, priority: 0.7, changeFrequency: "monthly", lastModified: ew6TechMtime },
      { pair: { fr: "/european-war-6/comparateur/generaux", en: "/european-war-6/comparator/generals", de: "/european-war-6/comparator/generals" }, priority: 0.7, changeFrequency: "monthly" },
      { pair: { fr: "/european-war-6/comparateur/unites", en: "/european-war-6/comparator/units", de: "/european-war-6/comparator/units" }, priority: 0.7, changeFrequency: "monthly" },
      { pair: { fr: "/european-war-6/guides", en: "/european-war-6/guides", de: "/european-war-6/guides" }, priority: 0.7, changeFrequency: "weekly" },
      { pair: { fr: "/european-war-6/mises-a-jour", en: "/european-war-6/updates", de: "/european-war-6/updates" }, priority: 0.7, changeFrequency: "weekly" },
    ];
    for (const route of ew6StaticRoutes) emitLocalized(entries, route);

    for (const slug of getAllEw6GeneralSlugs()) {
      const entity = getEw6General(slug);
      if (!entity || isPlaceholder(entity)) continue;
      const pair: LocalePair = {
        fr: `/european-war-6/generaux/${slug}`,
        en: `/european-war-6/generals/${slug}`,
        de: `/european-war-6/generals/${slug}`,
      };
      const lm = mtimeOrBuild(path.join(EW6_DATA, "generals", `${slug}.json`));
      for (const locale of locales) {
        entries.push({
          url: urlFor(locale, pair),
          lastModified: lm,
          changeFrequency: "monthly",
          priority: 0.8,
          alternates: sitemapAlternates(pair),
        });
      }
    }

    for (const slug of getAllEw6EliteSlugs()) {
      const entity = getEw6EliteUnit(slug);
      if (!entity || isPlaceholder(entity)) continue;
      const pair: LocalePair = {
        fr: `/european-war-6/unites-elite/${slug}`,
        en: `/european-war-6/elite-units/${slug}`,
        de: `/european-war-6/elite-units/${slug}`,
      };
      const lm = mtimeOrBuild(path.join(EW6_DATA, "elite-units", `${slug}.json`));
      for (const locale of locales) {
        entries.push({
          url: urlFor(locale, pair),
          lastModified: lm,
          changeFrequency: "monthly",
          priority: 0.8,
          alternates: sitemapAlternates(pair),
        });
      }
    }

    for (const slug of getAllEw6SkillSlugs()) {
      const pair: LocalePair = {
        fr: `/european-war-6/competences/${slug}`,
        en: `/european-war-6/skills/${slug}`,
        de: `/european-war-6/skills/${slug}`,
      };
      const lm = mtimeOrBuild(path.join(EW6_DATA, "skills", `${slug}.json`));
      for (const locale of locales) {
        entries.push({
          url: urlFor(locale, pair),
          lastModified: lm,
          changeFrequency: "monthly",
          priority: 0.6,
          alternates: sitemapAlternates(pair),
        });
      }
    }

    for (const slug of getAllEw6TechSlugs()) {
      const pair: LocalePair = {
        fr: `/european-war-6/technologies/${slug}`,
        en: `/european-war-6/technologies/${slug}`,
        de: `/european-war-6/technologies/${slug}`,
      };
      const lm = mtimeOrBuild(path.join(EW6_DATA, "technologies", `${slug}.json`));
      for (const locale of locales) {
        entries.push({
          url: urlFor(locale, pair),
          lastModified: lm,
          changeFrequency: "monthly",
          priority: 0.5,
          alternates: sitemapAlternates(pair),
        });
      }
    }
  }

  return entries;
}

// Suppress unused-import warning when BASE_URL is not referenced directly here
// (we use it indirectly via urlFor / sitemapAlternates).
void BASE_URL;
