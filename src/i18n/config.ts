import type { Pathnames } from "next-intl/routing";

export const locales = ["fr", "en", "de"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

/**
 * Localized pathnames: one canonical route → per-locale URL segment.
 *
 * Rule: French keeps existing slugs (zero broken inbound links). English
 * gets clean English equivalents. German mirrors the English slugs so
 * new /de/* URLs can be added without a second round of URL-segment
 * translation; this is a deliberate v1 trade-off — content is localized,
 * URL structure is shared with /en/.
 */
export const pathnames = {
  "/": "/",
  "/leaderboards": {
    fr: "/classements",
    en: "/leaderboards",
    de: "/bestenlisten",
  },
  "/world-conqueror-4": {
    fr: "/world-conqueror-4",
    en: "/world-conqueror-4",
    de: "/world-conqueror-4",
  },
  "/world-conqueror-4/generaux": {
    fr: "/world-conqueror-4/generaux",
    en: "/world-conqueror-4/generals",
    de: "/world-conqueror-4/generals",
  },
  "/world-conqueror-4/generaux/[slug]": {
    fr: "/world-conqueror-4/generaux/[slug]",
    en: "/world-conqueror-4/generals/[slug]",
    de: "/world-conqueror-4/generals/[slug]",
  },
  "/world-conqueror-4/generaux/[slug]/trained": {
    fr: "/world-conqueror-4/generaux/[slug]/entraine",
    en: "/world-conqueror-4/generals/[slug]/trained",
    de: "/world-conqueror-4/generals/[slug]/trained",
  },
  "/world-conqueror-4/generaux/[slug]/premium-training": {
    fr: "/world-conqueror-4/generaux/[slug]/entrainement-premium",
    en: "/world-conqueror-4/generals/[slug]/premium-training",
    de: "/world-conqueror-4/generals/[slug]/premium-training",
  },
  "/world-conqueror-4/comparateur": {
    fr: "/world-conqueror-4/comparateur",
    en: "/world-conqueror-4/comparator",
    de: "/world-conqueror-4/comparator",
  },
  "/world-conqueror-4/comparateur/unites": {
    fr: "/world-conqueror-4/comparateur/unites",
    en: "/world-conqueror-4/comparator/units",
    de: "/world-conqueror-4/comparator/units",
  },
  "/world-conqueror-4/comparateur/unites/[matchup]": {
    fr: "/world-conqueror-4/comparateur/unites/[matchup]",
    en: "/world-conqueror-4/comparator/units/[matchup]",
    de: "/world-conqueror-4/comparator/units/[matchup]",
  },
  "/world-conqueror-4/comparateur/generaux": {
    fr: "/world-conqueror-4/comparateur/generaux",
    en: "/world-conqueror-4/comparator/generals",
    de: "/world-conqueror-4/comparator/generals",
  },
  "/world-conqueror-4/unites-elite": {
    fr: "/world-conqueror-4/unites-elite",
    en: "/world-conqueror-4/elite-units",
    de: "/world-conqueror-4/elite-units",
  },
  "/world-conqueror-4/unites-elite/[slug]": {
    fr: "/world-conqueror-4/unites-elite/[slug]",
    en: "/world-conqueror-4/elite-units/[slug]",
    de: "/world-conqueror-4/elite-units/[slug]",
  },
  "/world-conqueror-4/empire-du-scorpion": {
    fr: "/world-conqueror-4/empire-du-scorpion",
    en: "/world-conqueror-4/scorpion-empire",
    de: "/world-conqueror-4/scorpion-empire",
  },
  "/world-conqueror-4/formations-legendes": {
    fr: "/world-conqueror-4/formations-legendes",
    en: "/world-conqueror-4/legend-formations",
    de: "/world-conqueror-4/legend-formations",
  },
  "/world-conqueror-4/formations-legendes/[slug]": {
    fr: "/world-conqueror-4/formations-legendes/[slug]",
    en: "/world-conqueror-4/legend-formations/[slug]",
    de: "/world-conqueror-4/legend-formations/[slug]",
  },
  "/world-conqueror-4/competences": {
    fr: "/world-conqueror-4/competences",
    en: "/world-conqueror-4/skills",
    de: "/world-conqueror-4/skills",
  },
  "/world-conqueror-4/competences/[slug]": {
    fr: "/world-conqueror-4/competences/[slug]",
    en: "/world-conqueror-4/skills/[slug]",
    de: "/world-conqueror-4/skills/[slug]",
  },
  "/world-conqueror-4/mises-a-jour": {
    fr: "/world-conqueror-4/mises-a-jour",
    en: "/world-conqueror-4/updates",
    de: "/world-conqueror-4/updates",
  },
  "/world-conqueror-4/mises-a-jour/[slug]": {
    fr: "/world-conqueror-4/mises-a-jour/[slug]",
    en: "/world-conqueror-4/updates/[slug]",
    de: "/world-conqueror-4/updates/[slug]",
  },
  "/world-conqueror-4/technologies": {
    fr: "/world-conqueror-4/technologies",
    en: "/world-conqueror-4/technologies",
    de: "/world-conqueror-4/technologies",
  },
  "/world-conqueror-4/technologies/categorie/[category]": {
    fr: "/world-conqueror-4/technologies/categorie/[category]",
    en: "/world-conqueror-4/technologies/category/[category]",
    de: "/world-conqueror-4/technologies/category/[category]",
  },
  "/world-conqueror-4/technologies/[slug]": {
    fr: "/world-conqueror-4/technologies/[slug]",
    en: "/world-conqueror-4/technologies/[slug]",
    de: "/world-conqueror-4/technologies/[slug]",
  },
  "/legal/votes": {
    fr: "/legal/votes",
    en: "/legal/votes",
    de: "/legal/votes",
  },
  "/legal/mentions-legales": {
    fr: "/legal/mentions-legales",
    en: "/legal/legal-notice",
    de: "/legal/legal-notice",
  },
  "/legal/confidentialite": {
    fr: "/legal/confidentialite",
    en: "/legal/privacy",
    de: "/legal/privacy",
  },
  "/legal/cookies": {
    fr: "/legal/cookies",
    en: "/legal/cookies",
    de: "/legal/cookies",
  },
  "/legal/cgu": {
    fr: "/legal/cgu",
    en: "/legal/terms",
    de: "/legal/terms",
  },
  "/legal/a-propos": {
    fr: "/legal/a-propos",
    en: "/legal/about",
    de: "/legal/about",
  },
  "/legal/contact": {
    fr: "/legal/contact",
    en: "/legal/contact",
    de: "/legal/contact",
  },
  "/world-conqueror-4/guides": {
    fr: "/world-conqueror-4/guides",
    en: "/world-conqueror-4/guides",
    de: "/world-conqueror-4/guides",
  },
  "/world-conqueror-4/guides/[slug]": {
    fr: "/world-conqueror-4/guides/[slug]",
    en: "/world-conqueror-4/guides/[slug]",
    de: "/world-conqueror-4/guides/[slug]",
  },

  // ---------------------------------------------------------------------
  // Great Conqueror: Rome (GCR)
  // URL segments share the WC4 FR convention — French keeps the historical
  // French slugs (generaux / competences / unites-elite / mises-a-jour /
  // comparateur / conquete-romaine = the barbarian faction hub), EN and DE
  // mirror English slugs. Content is localized; URL structure follows the
  // same v1 trade-off as WC4.
  // ---------------------------------------------------------------------
  "/great-conqueror-rome": {
    fr: "/great-conqueror-rome",
    en: "/great-conqueror-rome",
    de: "/great-conqueror-rome",
  },
  "/great-conqueror-rome/generaux": {
    fr: "/great-conqueror-rome/generaux",
    en: "/great-conqueror-rome/generals",
    de: "/great-conqueror-rome/generals",
  },
  "/great-conqueror-rome/generaux/[slug]": {
    fr: "/great-conqueror-rome/generaux/[slug]",
    en: "/great-conqueror-rome/generals/[slug]",
    de: "/great-conqueror-rome/generals/[slug]",
  },
  "/great-conqueror-rome/competences": {
    fr: "/great-conqueror-rome/competences",
    en: "/great-conqueror-rome/skills",
    de: "/great-conqueror-rome/skills",
  },
  "/great-conqueror-rome/competences/[slug]": {
    fr: "/great-conqueror-rome/competences/[slug]",
    en: "/great-conqueror-rome/skills/[slug]",
    de: "/great-conqueror-rome/skills/[slug]",
  },
  "/great-conqueror-rome/unites-elite": {
    fr: "/great-conqueror-rome/unites-elite",
    en: "/great-conqueror-rome/elite-units",
    de: "/great-conqueror-rome/elite-units",
  },
  "/great-conqueror-rome/unites-elite/[slug]": {
    fr: "/great-conqueror-rome/unites-elite/[slug]",
    en: "/great-conqueror-rome/elite-units/[slug]",
    de: "/great-conqueror-rome/elite-units/[slug]",
  },
  "/great-conqueror-rome/technologies": {
    fr: "/great-conqueror-rome/technologies",
    en: "/great-conqueror-rome/technologies",
    de: "/great-conqueror-rome/technologies",
  },
  "/great-conqueror-rome/technologies/[slug]": {
    fr: "/great-conqueror-rome/technologies/[slug]",
    en: "/great-conqueror-rome/technologies/[slug]",
    de: "/great-conqueror-rome/technologies/[slug]",
  },
  "/great-conqueror-rome/conquete-romaine": {
    fr: "/great-conqueror-rome/conquete-romaine",
    en: "/great-conqueror-rome/roman-conquest",
    de: "/great-conqueror-rome/roman-conquest",
  },
  "/great-conqueror-rome/comparateur/generaux": {
    fr: "/great-conqueror-rome/comparateur/generaux",
    en: "/great-conqueror-rome/comparator/generals",
    de: "/great-conqueror-rome/comparator/generals",
  },
  "/great-conqueror-rome/comparateur/unites": {
    fr: "/great-conqueror-rome/comparateur/unites",
    en: "/great-conqueror-rome/comparator/units",
    de: "/great-conqueror-rome/comparator/units",
  },
  "/great-conqueror-rome/comparateur/unites/[matchup]": {
    fr: "/great-conqueror-rome/comparateur/unites/[matchup]",
    en: "/great-conqueror-rome/comparator/units/[matchup]",
    de: "/great-conqueror-rome/comparator/units/[matchup]",
  },
  "/great-conqueror-rome/guides": {
    fr: "/great-conqueror-rome/guides",
    en: "/great-conqueror-rome/guides",
    de: "/great-conqueror-rome/guides",
  },
  "/great-conqueror-rome/guides/[slug]": {
    fr: "/great-conqueror-rome/guides/[slug]",
    en: "/great-conqueror-rome/guides/[slug]",
    de: "/great-conqueror-rome/guides/[slug]",
  },
  "/great-conqueror-rome/mises-a-jour": {
    fr: "/great-conqueror-rome/mises-a-jour",
    en: "/great-conqueror-rome/updates",
    de: "/great-conqueror-rome/updates",
  },
  "/great-conqueror-rome/mises-a-jour/[slug]": {
    fr: "/great-conqueror-rome/mises-a-jour/[slug]",
    en: "/great-conqueror-rome/updates/[slug]",
    de: "/great-conqueror-rome/updates/[slug]",
  },

  // ---------------------------------------------------------------------
  // European War 6: 1914 (EW6)
  // URL segments share the WC4/GCR FR convention — French keeps the
  // historical French slugs, EN and DE mirror English slugs. Content is
  // localized; URL structure follows the same v1 trade-off as WC4/GCR.
  // ---------------------------------------------------------------------
  "/european-war-6": {
    fr: "/european-war-6",
    en: "/european-war-6",
    de: "/european-war-6",
  },
  "/european-war-6/generaux": {
    fr: "/european-war-6/generaux",
    en: "/european-war-6/generals",
    de: "/european-war-6/generals",
  },
  "/european-war-6/generaux/[slug]": {
    fr: "/european-war-6/generaux/[slug]",
    en: "/european-war-6/generals/[slug]",
    de: "/european-war-6/generals/[slug]",
  },
  "/european-war-6/competences": {
    fr: "/european-war-6/competences",
    en: "/european-war-6/skills",
    de: "/european-war-6/skills",
  },
  "/european-war-6/competences/[slug]": {
    fr: "/european-war-6/competences/[slug]",
    en: "/european-war-6/skills/[slug]",
    de: "/european-war-6/skills/[slug]",
  },
  "/european-war-6/unites-elite": {
    fr: "/european-war-6/unites-elite",
    en: "/european-war-6/elite-units",
    de: "/european-war-6/elite-units",
  },
  "/european-war-6/unites-elite/[slug]": {
    fr: "/european-war-6/unites-elite/[slug]",
    en: "/european-war-6/elite-units/[slug]",
    de: "/european-war-6/elite-units/[slug]",
  },
  "/european-war-6/technologies": {
    fr: "/european-war-6/technologies",
    en: "/european-war-6/technologies",
    de: "/european-war-6/technologies",
  },
  "/european-war-6/technologies/[slug]": {
    fr: "/european-war-6/technologies/[slug]",
    en: "/european-war-6/technologies/[slug]",
    de: "/european-war-6/technologies/[slug]",
  },
  "/european-war-6/comparateur/generaux": {
    fr: "/european-war-6/comparateur/generaux",
    en: "/european-war-6/comparator/generals",
    de: "/european-war-6/comparator/generals",
  },
  "/european-war-6/comparateur/unites": {
    fr: "/european-war-6/comparateur/unites",
    en: "/european-war-6/comparator/units",
    de: "/european-war-6/comparator/units",
  },
  "/european-war-6/comparateur/unites/[matchup]": {
    fr: "/european-war-6/comparateur/unites/[matchup]",
    en: "/european-war-6/comparator/units/[matchup]",
    de: "/european-war-6/comparator/units/[matchup]",
  },
  "/european-war-6/guides": {
    fr: "/european-war-6/guides",
    en: "/european-war-6/guides",
    de: "/european-war-6/guides",
  },
  "/european-war-6/guides/[slug]": {
    fr: "/european-war-6/guides/[slug]",
    en: "/european-war-6/guides/[slug]",
    de: "/european-war-6/guides/[slug]",
  },
  "/european-war-6/mises-a-jour": {
    fr: "/european-war-6/mises-a-jour",
    en: "/european-war-6/updates",
    de: "/european-war-6/updates",
  },
  "/european-war-6/mises-a-jour/[slug]": {
    fr: "/european-war-6/mises-a-jour/[slug]",
    en: "/european-war-6/updates/[slug]",
    de: "/european-war-6/updates/[slug]",
  },
} satisfies Pathnames<typeof locales>;

export const localePrefix = "always" as const;
