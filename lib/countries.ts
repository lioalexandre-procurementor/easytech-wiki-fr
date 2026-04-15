/**
 * Locale-aware country labels.
 *
 * The `country` field on generals / elite units is a stable ISO-ish
 * 2-letter code (with `XX` used as the Scorpion-Empire sentinel).
 * This module returns the human-readable name for that code in any
 * supported site locale, so cards render correctly on /fr/, /en/, /de/.
 *
 * The legacy `countryName` field baked into each JSON stays in place
 * as the French canonical source, but pages should prefer
 * `countryLabel(g.country, locale)` from here.
 */

type LocaleKey = "fr" | "en" | "de";

type CountryTriple = { fr: string; en: string; de: string };

const COUNTRY_LABELS: Record<string, CountryTriple> = {
  US: { fr: "États-Unis",                 en: "United States",        de: "Vereinigte Staaten" },
  GB: { fr: "Royaume-Uni",                 en: "United Kingdom",       de: "Vereinigtes Königreich" },
  DE: { fr: "Allemagne",                   en: "Germany",              de: "Deutschland" },
  FR: { fr: "France",                      en: "France",               de: "Frankreich" },
  RU: { fr: "URSS",                        en: "USSR",                 de: "UdSSR" },
  JP: { fr: "Japon",                       en: "Japan",                de: "Japan" },
  IT: { fr: "Italie",                      en: "Italy",                de: "Italien" },
  CN: { fr: "République populaire de Chine", en: "People's Republic of China", de: "Volksrepublik China" },
  PL: { fr: "Pologne",                     en: "Poland",               de: "Polen" },
  CA: { fr: "Canada",                      en: "Canada",               de: "Kanada" },
  AU: { fr: "Australie",                   en: "Australia",            de: "Australien" },
  FI: { fr: "Finlande",                    en: "Finland",              de: "Finnland" },
  YU: { fr: "Yougoslavie",                 en: "Yugoslavia",           de: "Jugoslawien" },
  TR: { fr: "Turquie",                     en: "Turkey",               de: "Türkei" },
  EG: { fr: "Égypte",                      en: "Egypt",                de: "Ägypten" },
  IL: { fr: "Israël",                      en: "Israel",               de: "Israel" },
  NO: { fr: "Norvège",                     en: "Norway",               de: "Norwegen" },
  SE: { fr: "Suède",                       en: "Sweden",               de: "Schweden" },
  DK: { fr: "Danemark",                    en: "Denmark",              de: "Dänemark" },
  NL: { fr: "Pays-Bas",                    en: "Netherlands",          de: "Niederlande" },
  BE: { fr: "Belgique",                    en: "Belgium",              de: "Belgien" },
  ES: { fr: "Espagne",                     en: "Spain",                de: "Spanien" },
  PT: { fr: "Portugal",                    en: "Portugal",             de: "Portugal" },
  HU: { fr: "Hongrie",                     en: "Hungary",              de: "Ungarn" },
  RO: { fr: "Roumanie",                    en: "Romania",              de: "Rumänien" },
  BG: { fr: "Bulgarie",                    en: "Bulgaria",             de: "Bulgarien" },
  CH: { fr: "Suisse",                      en: "Switzerland",          de: "Schweiz" },
  GR: { fr: "Grèce",                       en: "Greece",               de: "Griechenland" },
  CZ: { fr: "Tchécoslovaquie",             en: "Czechoslovakia",       de: "Tschechoslowakei" },
  IN: { fr: "Inde",                        en: "India",                de: "Indien" },
  TH: { fr: "Thaïlande",                   en: "Thailand",             de: "Thailand" },
  MX: { fr: "Mexique",                     en: "Mexico",               de: "Mexiko" },
  BR: { fr: "Brésil",                      en: "Brazil",               de: "Brasilien" },
  AR: { fr: "Argentine",                   en: "Argentina",            de: "Argentinien" },
  KR: { fr: "Corée du Sud",                en: "South Korea",          de: "Südkorea" },
  XX: { fr: "Empire du Scorpion",          en: "Scorpion Empire",      de: "Skorpion-Imperium" },
};

function resolveLocale(locale: string | undefined): LocaleKey {
  if (locale === "fr" || locale === "en" || locale === "de") return locale;
  return "fr";
}

/**
 * Get the localized country name for a given country code.
 * Falls back to the code itself if the country is not catalogued.
 *
 * @param code  ISO-ish 2-letter country code, e.g. `"US"`, `"DE"`, or `"XX"` for Scorpion Empire
 * @param locale site locale (`"fr" | "en" | "de"`)
 */
export function countryLabel(code: string | undefined, locale: string | undefined): string {
  if (!code) return "";
  const entry = COUNTRY_LABELS[code];
  if (!entry) return code;
  return entry[resolveLocale(locale)];
}
