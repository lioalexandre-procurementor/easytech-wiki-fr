import type { Locale } from "./config";

/**
 * Maps a site locale to the BCP-47-ish `openGraph.locale` value
 * expected by Next.js metadata / Open Graph crawlers.
 */
const OG_LOCALE: Record<Locale, string> = {
  fr: "fr_FR",
  en: "en_US",
  de: "de_DE",
};

export function ogLocale(locale: string): string {
  return OG_LOCALE[locale as Locale] ?? "en_US";
}

/**
 * All other site locales, formatted for `openGraph.alternateLocale`.
 */
export function ogAlternateLocales(locale: string): string[] {
  const current = locale as Locale;
  return (Object.keys(OG_LOCALE) as Locale[])
    .filter((l) => l !== current)
    .map((l) => OG_LOCALE[l]);
}
