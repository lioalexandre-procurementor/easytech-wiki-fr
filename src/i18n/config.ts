import type { Pathnames } from "next-intl/routing";

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

/**
 * Localized pathnames: one canonical route → per-locale URL segment.
 *
 * Rule: French keeps existing slugs (zero broken inbound links). English
 * gets clean English equivalents. Each segment is rewritten independently
 * by next-intl middleware.
 */
export const pathnames = {
  "/": "/",
  "/world-conqueror-4": {
    fr: "/world-conqueror-4",
    en: "/world-conqueror-4",
  },
  "/world-conqueror-4/generaux": {
    fr: "/world-conqueror-4/generaux",
    en: "/world-conqueror-4/generals",
  },
  "/world-conqueror-4/generaux/[slug]": {
    fr: "/world-conqueror-4/generaux/[slug]",
    en: "/world-conqueror-4/generals/[slug]",
  },
  "/world-conqueror-4/generaux/[slug]/trained": {
    fr: "/world-conqueror-4/generaux/[slug]/entraine",
    en: "/world-conqueror-4/generals/[slug]/trained",
  },
  "/world-conqueror-4/unites-elite": {
    fr: "/world-conqueror-4/unites-elite",
    en: "/world-conqueror-4/elite-units",
  },
  "/world-conqueror-4/unites-elite/[slug]": {
    fr: "/world-conqueror-4/unites-elite/[slug]",
    en: "/world-conqueror-4/elite-units/[slug]",
  },
  "/world-conqueror-4/empire-du-scorpion": {
    fr: "/world-conqueror-4/empire-du-scorpion",
    en: "/world-conqueror-4/scorpion-empire",
  },
  "/world-conqueror-4/competences": {
    fr: "/world-conqueror-4/competences",
    en: "/world-conqueror-4/skills",
  },
  "/world-conqueror-4/competences/[slug]": {
    fr: "/world-conqueror-4/competences/[slug]",
    en: "/world-conqueror-4/skills/[slug]",
  },
  "/legal/votes": {
    fr: "/legal/votes",
    en: "/legal/votes",
  },
} satisfies Pathnames<typeof locales>;

export const localePrefix = "always" as const;
