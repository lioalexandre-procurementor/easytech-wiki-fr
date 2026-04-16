import type { MetadataRoute } from "next";
import fs from "node:fs";
import path from "node:path";
import { getAllGeneralSlugs, getAllSlugs as getAllEliteSlugs } from "@/lib/units";
import { getAllGuideSlugs } from "@/lib/guides";
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
import { locales } from "@/src/i18n/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://easytech-wiki.com";

/**
 * Placeholder detection — GCR/EW6 entities auto-generated from decrypted
 * game files carry a boilerplate longDesc ending "à enrichir". We do NOT
 * publish those URLs in the sitemap (they're already noindex'd on the
 * page) so Google does not waste crawl budget or surface thin content
 * during the AdSense review window. See
 * EasyTech-Wiki-SEO-Ads-Strategy-Assessment-2026-04-16.md (Plan A).
 */
const PLACEHOLDER_RE = /à enrichir|Fiche générée automatiquement/i;
function isPlaceholder(entity: { longDesc?: string | null } | null): boolean {
  if (!entity) return true; // missing entity → don't emit
  return PLACEHOLDER_RE.test(entity.longDesc ?? "");
}

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

  // ---------------------------------------------------------------------
  // Great Conqueror: Rome — only emitted when the game is marked
  // available in lib/games.ts. Keeps crawlers out of the scaffolded routes
  // until the game launches.
  // ---------------------------------------------------------------------
  const gcrGame = getGame("great-conqueror-rome");
  if (gcrGame?.available) {
    const gcrStaticRoutes: { pair: LocalePair; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
      { pair: { fr: "/great-conqueror-rome", en: "/great-conqueror-rome", de: "/great-conqueror-rome" }, priority: 0.9, changeFrequency: "weekly" },
      { pair: { fr: "/great-conqueror-rome/generaux", en: "/great-conqueror-rome/generals", de: "/great-conqueror-rome/generals" }, priority: 0.9, changeFrequency: "weekly" },
      { pair: { fr: "/great-conqueror-rome/unites-elite", en: "/great-conqueror-rome/elite-units", de: "/great-conqueror-rome/elite-units" }, priority: 0.9, changeFrequency: "weekly" },
      { pair: { fr: "/great-conqueror-rome/competences", en: "/great-conqueror-rome/skills", de: "/great-conqueror-rome/skills" }, priority: 0.8, changeFrequency: "weekly" },
      { pair: { fr: "/great-conqueror-rome/technologies", en: "/great-conqueror-rome/technologies", de: "/great-conqueror-rome/technologies" }, priority: 0.7, changeFrequency: "monthly" },
      { pair: { fr: "/great-conqueror-rome/conquete-romaine", en: "/great-conqueror-rome/roman-conquest", de: "/great-conqueror-rome/roman-conquest" }, priority: 0.6, changeFrequency: "monthly" },
      { pair: { fr: "/great-conqueror-rome/comparateur/generaux", en: "/great-conqueror-rome/comparator/generals", de: "/great-conqueror-rome/comparator/generals" }, priority: 0.7, changeFrequency: "monthly" },
      { pair: { fr: "/great-conqueror-rome/comparateur/unites", en: "/great-conqueror-rome/comparator/units", de: "/great-conqueror-rome/comparator/units" }, priority: 0.7, changeFrequency: "monthly" },
      { pair: { fr: "/great-conqueror-rome/guides", en: "/great-conqueror-rome/guides", de: "/great-conqueror-rome/guides" }, priority: 0.7, changeFrequency: "weekly" },
      { pair: { fr: "/great-conqueror-rome/mises-a-jour", en: "/great-conqueror-rome/updates", de: "/great-conqueror-rome/updates" }, priority: 0.7, changeFrequency: "weekly" },
    ];
    for (const route of gcrStaticRoutes) {
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

    // GCR generals (placeholder pages excluded — they're noindex)
    for (const slug of getAllGcrGeneralSlugs()) {
      if (isPlaceholder(getGcrGeneral(slug))) continue;
      const pair: LocalePair = {
        fr: `/great-conqueror-rome/generaux/${slug}`,
        en: `/great-conqueror-rome/generals/${slug}`,
        de: `/great-conqueror-rome/generals/${slug}`,
      };
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

    // GCR elite units (placeholder pages excluded — they're noindex)
    for (const slug of getAllGcrEliteSlugs()) {
      if (isPlaceholder(getGcrEliteUnit(slug))) continue;
      const pair: LocalePair = {
        fr: `/great-conqueror-rome/unites-elite/${slug}`,
        en: `/great-conqueror-rome/elite-units/${slug}`,
        de: `/great-conqueror-rome/elite-units/${slug}`,
      };
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

    // GCR skills
    for (const slug of getAllGcrSkillSlugs()) {
      const pair: LocalePair = {
        fr: `/great-conqueror-rome/competences/${slug}`,
        en: `/great-conqueror-rome/skills/${slug}`,
        de: `/great-conqueror-rome/skills/${slug}`,
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

    // GCR tech detail pages
    for (const slug of getAllGcrTechSlugs()) {
      const pair: LocalePair = {
        fr: `/great-conqueror-rome/technologies/${slug}`,
        en: `/great-conqueror-rome/technologies/${slug}`,
        de: `/great-conqueror-rome/technologies/${slug}`,
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
  }

  // ---------------------------------------------------------------------
  // European War 6: 1914 — only emitted when the game is marked available
  // in lib/games.ts. Keeps crawlers out of scaffolded routes until launch.
  // ---------------------------------------------------------------------
  const ew6Game = getGame("european-war-6");
  if (ew6Game?.available) {
    const ew6StaticRoutes: { pair: LocalePair; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
      { pair: { fr: "/european-war-6", en: "/european-war-6", de: "/european-war-6" }, priority: 0.9, changeFrequency: "weekly" },
      { pair: { fr: "/european-war-6/generaux", en: "/european-war-6/generals", de: "/european-war-6/generals" }, priority: 0.9, changeFrequency: "weekly" },
      { pair: { fr: "/european-war-6/unites-elite", en: "/european-war-6/elite-units", de: "/european-war-6/elite-units" }, priority: 0.9, changeFrequency: "weekly" },
      { pair: { fr: "/european-war-6/competences", en: "/european-war-6/skills", de: "/european-war-6/skills" }, priority: 0.8, changeFrequency: "weekly" },
      { pair: { fr: "/european-war-6/technologies", en: "/european-war-6/technologies", de: "/european-war-6/technologies" }, priority: 0.7, changeFrequency: "monthly" },
      { pair: { fr: "/european-war-6/comparateur/generaux", en: "/european-war-6/comparator/generals", de: "/european-war-6/comparator/generals" }, priority: 0.7, changeFrequency: "monthly" },
      { pair: { fr: "/european-war-6/comparateur/unites", en: "/european-war-6/comparator/units", de: "/european-war-6/comparator/units" }, priority: 0.7, changeFrequency: "monthly" },
      { pair: { fr: "/european-war-6/guides", en: "/european-war-6/guides", de: "/european-war-6/guides" }, priority: 0.7, changeFrequency: "weekly" },
      { pair: { fr: "/european-war-6/mises-a-jour", en: "/european-war-6/updates", de: "/european-war-6/updates" }, priority: 0.7, changeFrequency: "weekly" },
    ];
    for (const route of ew6StaticRoutes) {
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

    // EW6 generals (placeholder pages excluded — they're noindex)
    for (const slug of getAllEw6GeneralSlugs()) {
      if (isPlaceholder(getEw6General(slug))) continue;
      const pair: LocalePair = {
        fr: `/european-war-6/generaux/${slug}`,
        en: `/european-war-6/generals/${slug}`,
        de: `/european-war-6/generals/${slug}`,
      };
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

    // EW6 elite units (placeholder pages excluded — they're noindex)
    for (const slug of getAllEw6EliteSlugs()) {
      if (isPlaceholder(getEw6EliteUnit(slug))) continue;
      const pair: LocalePair = {
        fr: `/european-war-6/unites-elite/${slug}`,
        en: `/european-war-6/elite-units/${slug}`,
        de: `/european-war-6/elite-units/${slug}`,
      };
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

    for (const slug of getAllEw6SkillSlugs()) {
      const pair: LocalePair = {
        fr: `/european-war-6/competences/${slug}`,
        en: `/european-war-6/skills/${slug}`,
        de: `/european-war-6/skills/${slug}`,
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

    for (const slug of getAllEw6TechSlugs()) {
      const pair: LocalePair = {
        fr: `/european-war-6/technologies/${slug}`,
        en: `/european-war-6/technologies/${slug}`,
        de: `/european-war-6/technologies/${slug}`,
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
  }

  return entries;
}
