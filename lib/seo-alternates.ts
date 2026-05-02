/**
 * SEO alternates: shared helper for HTML <link rel="canonical"> and hreflang
 * generation, plus the matching sitemap entries. Keeping page metadata and
 * sitemap output in sync is what prevents the "alternate page with proper
 * canonical" / "duplicate canonical" classes of GSC indexing issues.
 *
 * Source of truth for localized URL segments: src/i18n/config.ts pathnames.
 * Mirror new routes there AND in app/sitemap.ts.
 */

export const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://easytech-wiki.com";

export type LocalePair = { fr: string; en: string; de: string };

type SupportedLocale = "fr" | "en" | "de";

function asLocale(locale: string): SupportedLocale {
  return locale === "en" || locale === "de" ? locale : "fr";
}

/** Absolute URL for a given locale + path pair. */
export function urlFor(locale: string, pair: LocalePair): string {
  return `${BASE_URL}/${asLocale(locale)}${pair[asLocale(locale)]}`;
}

/**
 * Metadata.alternates block for a translated page. Self-canonical (NOT
 * pointing to base/parent), with hreflang for all 3 supported locales and
 * x-default → French (defaultLocale in src/i18n/config.ts).
 */
export function pageAlternates(locale: string, pair: LocalePair) {
  return {
    canonical: urlFor(locale, pair),
    languages: {
      fr: `${BASE_URL}/fr${pair.fr}`,
      en: `${BASE_URL}/en${pair.en}`,
      de: `${BASE_URL}/de${pair.de}`,
      "x-default": `${BASE_URL}/fr${pair.fr}`,
    },
  };
}

/** Sitemap-level hreflang alternates (same shape, used by app/sitemap.ts). */
export function sitemapAlternates(pair: LocalePair) {
  return {
    languages: {
      fr: `${BASE_URL}/fr${pair.fr}`,
      en: `${BASE_URL}/en${pair.en}`,
      de: `${BASE_URL}/de${pair.de}`,
      "x-default": `${BASE_URL}/fr${pair.fr}`,
    },
  };
}
