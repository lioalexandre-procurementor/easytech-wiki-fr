import type { MetadataRoute } from "next";
import fs from "node:fs";
import path from "node:path";
import { getAllGeneralSlugs, getAllSlugs as getAllEliteSlugs } from "@/lib/units";
import { getAllGuideSlugs } from "@/lib/guides";
import { locales } from "@/src/i18n/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://easytech-wiki.com";

/**
 * Localized path pair for a given canonical route suffix.
 * The keys mirror the locale → external URL rewrites defined in
 * src/i18n/config.ts. If a route is added there, mirror it here.
 *
 * German routes mirror English slugs — we localize content, not URL
 * segments, as a deliberate v1 trade-off.
 */
type LocalePair = { fr: string; en: string; de: string };

function alternates(pair: LocalePair) {
  return {
    languages: {
      fr: `${BASE_URL}/fr${pair.fr}`,
      en: `${BASE_URL}/en${pair.en}`,
      de: `${BASE_URL}/de${pair.de}`,
      "x-default": `${BASE_URL}/fr${pair.fr}`,
    },
  };
}

function pathFor(locale: "fr" | "en" | "de", pair: LocalePair): string {
  return `${BASE_URL}/${locale}${pair[locale]}`;
}

function generalBase(slug: string): LocalePair {
  return {
    fr: `/world-conqueror-4/generaux/${slug}`,
    en: `/world-conqueror-4/generals/${slug}`,
    de: `/world-conqueror-4/generals/${slug}`,
  };
}

function generalTrained(slug: string): LocalePair {
  return {
    fr: `/world-conqueror-4/generaux/${slug}/entraine`,
    en: `/world-conqueror-4/generals/${slug}/trained`,
    de: `/world-conqueror-4/generals/${slug}/trained`,
  };
}

function generalPremiumTraining(slug: string): LocalePair {
  return {
    fr: `/world-conqueror-4/generaux/${slug}/entrainement-premium`,
    en: `/world-conqueror-4/generals/${slug}/premium-training`,
    de: `/world-conqueror-4/generals/${slug}/premium-training`,
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
  const dir = path.join(process.cwd(), "data", "wc4", "updates");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(/\.json$/, ""));
}

/** Read all tech slugs from data/wc4/technologies/*.json (excluding _index.json). */
function getAllTechSlugsFromFs(): string[] {
  const dir = path.join(process.cwd(), "data", "wc4", "technologies");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(/\.json$/, ""));
}

/** Read all skill slugs from data/wc4/skills/*.json (excluding _index.json). */
function getAllSkillSlugs(): string[] {
  const dir = path.join(process.cwd(), "data", "wc4", "skills");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(/\.json$/, ""));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Static roots
  const staticRoutes: { pair: LocalePair; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { pair: { fr: "", en: "", de: "" }, priority: 1, changeFrequency: "weekly" },
    { pair: { fr: "/world-conqueror-4", en: "/world-conqueror-4", de: "/world-conqueror-4" }, priority: 0.9, changeFrequency: "weekly" },
    { pair: { fr: "/world-conqueror-4/generaux", en: "/world-conqueror-4/generals", de: "/world-conqueror-4/generals" }, priority: 0.9, changeFrequency: "weekly" },
    { pair: { fr: "/world-conqueror-4/unites-elite", en: "/world-conqueror-4/elite-units", de: "/world-conqueror-4/elite-units" }, priority: 0.9, changeFrequency: "weekly" },
    { pair: { fr: "/world-conqueror-4/competences", en: "/world-conqueror-4/skills", de: "/world-conqueror-4/skills" }, priority: 0.8, changeFrequency: "weekly" },
    { pair: { fr: "/world-conqueror-4/empire-du-scorpion", en: "/world-conqueror-4/scorpion-empire", de: "/world-conqueror-4/scorpion-empire" }, priority: 0.6, changeFrequency: "monthly" },
    { pair: { fr: "/world-conqueror-4/mises-a-jour", en: "/world-conqueror-4/updates", de: "/world-conqueror-4/updates" }, priority: 0.8, changeFrequency: "weekly" },
    { pair: { fr: "/legal/votes", en: "/legal/votes", de: "/legal/votes" }, priority: 0.3, changeFrequency: "yearly" },
    { pair: { fr: "/legal/mentions-legales", en: "/legal/legal-notice", de: "/legal/legal-notice" }, priority: 0.3, changeFrequency: "yearly" },
    { pair: { fr: "/legal/confidentialite", en: "/legal/privacy", de: "/legal/privacy" }, priority: 0.3, changeFrequency: "yearly" },
    { pair: { fr: "/legal/cookies", en: "/legal/cookies", de: "/legal/cookies" }, priority: 0.3, changeFrequency: "yearly" },
    { pair: { fr: "/legal/cgu", en: "/legal/terms", de: "/legal/terms" }, priority: 0.3, changeFrequency: "yearly" },
    { pair: { fr: "/legal/a-propos", en: "/legal/about", de: "/legal/about" }, priority: 0.4, changeFrequency: "monthly" },
    { pair: { fr: "/legal/contact", en: "/legal/contact", de: "/legal/contact" }, priority: 0.4, changeFrequency: "yearly" },
  ];

  for (const route of staticRoutes) {
    for (const locale of locales) {
      entries.push({
        url: pathFor(locale, route.pair),
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: alternates(route.pair),
      });
    }
  }

  // Generals: base + trained + premium-training variants per locale
  for (const slug of getAllGeneralSlugs()) {
    const variants: { pair: LocalePair; priority: number }[] = [
      { pair: generalBase(slug), priority: 0.8 },
      { pair: generalTrained(slug), priority: 0.7 },
      { pair: generalPremiumTraining(slug), priority: 0.7 },
    ];
    for (const v of variants) {
      for (const locale of locales) {
        entries.push({
          url: pathFor(locale, v.pair),
          lastModified: now,
          changeFrequency: "monthly",
          priority: v.priority,
          alternates: alternates(v.pair),
        });
      }
    }
  }

  // Elite units
  for (const slug of getAllEliteSlugs()) {
    const pair = eliteBase(slug);
    for (const locale of locales) {
      entries.push({
        url: pathFor(locale, pair),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: alternates(pair),
      });
    }
  }

  // Skill catalog detail pages
  for (const slug of getAllSkillSlugs()) {
    const pair = skillBase(slug);
    for (const locale of locales) {
      entries.push({
        url: pathFor(locale, pair),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: alternates(pair),
      });
    }
  }

  // Tech hub
  const techHubPair: LocalePair = {
    fr: "/world-conqueror-4/technologies",
    en: "/world-conqueror-4/technologies",
    de: "/world-conqueror-4/technologies",
  };
  for (const locale of locales) {
    entries.push({
      url: pathFor(locale, techHubPair),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: alternates(techHubPair),
    });
  }

  // Tech categories
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
        url: pathFor(locale, pair),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: alternates(pair),
      });
    }
  }

  // Tech detail pages
  for (const slug of getAllTechSlugsFromFs()) {
    const pair: LocalePair = {
      fr: `/world-conqueror-4/technologies/${slug}`,
      en: `/world-conqueror-4/technologies/${slug}`,
      de: `/world-conqueror-4/technologies/${slug}`,
    };
    for (const locale of locales) {
      entries.push({
        url: pathFor(locale, pair),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5,
        alternates: alternates(pair),
      });
    }
  }

  // Updates detail pages
  for (const slug of getAllUpdateSlugsFromFs()) {
    const pair = updateDetail(slug);
    for (const locale of locales) {
      entries.push({
        url: pathFor(locale, pair),
        lastModified: now,
        changeFrequency: "yearly",
        priority: 0.5,
        alternates: alternates(pair),
      });
    }
  }

  // Guides hub
  const guidesHubPair: LocalePair = {
    fr: "/world-conqueror-4/guides",
    en: "/world-conqueror-4/guides",
    de: "/world-conqueror-4/guides",
  };
  for (const locale of locales) {
    entries.push({
      url: pathFor(locale, guidesHubPair),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: alternates(guidesHubPair),
    });
  }

  // Guide detail pages
  for (const slug of getAllGuideSlugs()) {
    const pair: LocalePair = {
      fr: `/world-conqueror-4/guides/${slug}`,
      en: `/world-conqueror-4/guides/${slug}`,
      de: `/world-conqueror-4/guides/${slug}`,
    };
    for (const locale of locales) {
      entries.push({
        url: pathFor(locale, pair),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: alternates(pair),
      });
    }
  }

  return entries;
}
