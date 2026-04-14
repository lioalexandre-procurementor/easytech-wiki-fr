import type { MetadataRoute } from "next";
import { getAllGeneralSlugs, getAllSlugs as getAllEliteSlugs } from "@/lib/units";
import { locales } from "@/src/i18n/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://easytech-wiki.example";

function alternates(pathFr: string, pathEn: string) {
  return {
    languages: {
      fr: `${BASE_URL}/fr${pathFr}`,
      en: `${BASE_URL}/en${pathEn}`,
      "x-default": `${BASE_URL}/fr${pathFr}`,
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Static roots: home + WC4 hub per locale
  for (const locale of locales) {
    entries.push({
      url: `${BASE_URL}/${locale}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: alternates("", ""),
    });
    entries.push({
      url: `${BASE_URL}/${locale}/world-conqueror-4`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: alternates("/world-conqueror-4", "/world-conqueror-4"),
    });
  }

  // Generals: base + trained variants per locale
  for (const slug of getAllGeneralSlugs()) {
    for (const locale of locales) {
      const basePath =
        locale === "fr"
          ? `/world-conqueror-4/generaux/${slug}`
          : `/world-conqueror-4/generals/${slug}`;
      const trainedPath =
        locale === "fr"
          ? `/world-conqueror-4/generaux/${slug}/entraine`
          : `/world-conqueror-4/generals/${slug}/trained`;
      entries.push({
        url: `${BASE_URL}/${locale}${basePath}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: alternates(
          `/world-conqueror-4/generaux/${slug}`,
          `/world-conqueror-4/generals/${slug}`,
        ),
      });
      entries.push({
        url: `${BASE_URL}/${locale}${trainedPath}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: alternates(
          `/world-conqueror-4/generaux/${slug}/entraine`,
          `/world-conqueror-4/generals/${slug}/trained`,
        ),
      });
    }
  }

  // Elite units (base only — trained variant is out of scope for Chunk 1)
  for (const slug of getAllEliteSlugs()) {
    for (const locale of locales) {
      const path =
        locale === "fr"
          ? `/world-conqueror-4/unites-elite/${slug}`
          : `/world-conqueror-4/elite-units/${slug}`;
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: alternates(
          `/world-conqueror-4/unites-elite/${slug}`,
          `/world-conqueror-4/elite-units/${slug}`,
        ),
      });
    }
  }

  return entries;
}
