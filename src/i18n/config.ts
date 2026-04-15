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
  "/world-conqueror-4/generaux/[slug]/premium-training": {
    fr: "/world-conqueror-4/generaux/[slug]/entrainement-premium",
    en: "/world-conqueror-4/generals/[slug]/premium-training",
  },
  "/world-conqueror-4/comparateur": {
    fr: "/world-conqueror-4/comparateur",
    en: "/world-conqueror-4/comparator",
  },
  "/world-conqueror-4/comparateur/unites": {
    fr: "/world-conqueror-4/comparateur/unites",
    en: "/world-conqueror-4/comparator/units",
  },
  "/world-conqueror-4/comparateur/unites/[matchup]": {
    fr: "/world-conqueror-4/comparateur/unites/[matchup]",
    en: "/world-conqueror-4/comparator/units/[matchup]",
  },
  "/world-conqueror-4/comparateur/generaux": {
    fr: "/world-conqueror-4/comparateur/generaux",
    en: "/world-conqueror-4/comparator/generals",
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
  "/world-conqueror-4/mises-a-jour": {
    fr: "/world-conqueror-4/mises-a-jour",
    en: "/world-conqueror-4/updates",
  },
  "/world-conqueror-4/mises-a-jour/[slug]": {
    fr: "/world-conqueror-4/mises-a-jour/[slug]",
    en: "/world-conqueror-4/updates/[slug]",
  },
  "/world-conqueror-4/technologies": {
    fr: "/world-conqueror-4/technologies",
    en: "/world-conqueror-4/technologies",
  },
  "/world-conqueror-4/technologies/categorie/[category]": {
    fr: "/world-conqueror-4/technologies/categorie/[category]",
    en: "/world-conqueror-4/technologies/category/[category]",
  },
  "/world-conqueror-4/technologies/[slug]": {
    fr: "/world-conqueror-4/technologies/[slug]",
    en: "/world-conqueror-4/technologies/[slug]",
  },
  "/legal/votes": {
    fr: "/legal/votes",
    en: "/legal/votes",
  },
  "/legal/mentions-legales": {
    fr: "/legal/mentions-legales",
    en: "/legal/legal-notice",
  },
  "/legal/confidentialite": {
    fr: "/legal/confidentialite",
    en: "/legal/privacy",
  },
  "/legal/cookies": {
    fr: "/legal/cookies",
    en: "/legal/cookies",
  },
  "/legal/cgu": {
    fr: "/legal/cgu",
    en: "/legal/terms",
  },
  "/legal/a-propos": {
    fr: "/legal/a-propos",
    en: "/legal/about",
  },
  "/legal/contact": {
    fr: "/legal/contact",
    en: "/legal/contact",
  },
} satisfies Pathnames<typeof locales>;

export const localePrefix = "always" as const;
