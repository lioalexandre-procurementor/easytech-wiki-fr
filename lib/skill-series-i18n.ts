import type { SkillSeriesMeta } from "@/lib/types";

/**
 * Per-locale translations of WC4 skill series labels and summaries.
 * The canonical data file `data/wc4/skills/_index.json` stores the FR
 * labels (legacy; the file was produced by the FR-first toolkit). We
 * apply this map server-side so `/en/` and `/de/` get proper labels in
 * the sidebar and section headings instead of leaking French strings.
 *
 * Keyed by series number (1..5 = learnable, 0 = signature) — stable
 * across the WC4 skill catalog.
 */
const WC4_SERIES_I18N: Record<
  number,
  { label: { fr: string; en: string; de: string }; summary: { fr: string; en: string; de: string } }
> = {
  1: {
    label:   { fr: "Tactiques de terrain", en: "Field Tactics", de: "Feldtaktik" },
    summary: {
      fr: "Maîtrise des terrains, barrages et assauts coordonnés.",
      en: "Terrain mastery, barrages and coordinated assaults.",
      de: "Geländebeherrschung, Sperrfeuer und koordinierte Angriffe.",
    },
  },
  2: {
    label:   { fr: "Commandement", en: "Command", de: "Kommando" },
    summary: {
      fr: "Leaders d'armée et doctrines de commandement.",
      en: "Army leaders and command doctrines.",
      de: "Heerführer und Kommandodoktrinen.",
    },
  },
  3: {
    label:   { fr: "Logistique", en: "Logistics", de: "Logistik" },
    summary: {
      fr: "Production, réparation et soutien des troupes.",
      en: "Production, repair and troop support.",
      de: "Produktion, Reparatur und Truppenversorgung.",
    },
  },
  4: {
    label:   { fr: "Défense et camouflage", en: "Defense & Camouflage", de: "Verteidigung & Tarnung" },
    summary: {
      fr: "Fortifications, couverture et guerre psychologique.",
      en: "Fortifications, cover and psychological warfare.",
      de: "Befestigungen, Deckung und psychologische Kriegsführung.",
    },
  },
  5: {
    label:   { fr: "Offensive", en: "Offensive", de: "Offensive" },
    summary: {
      fr: "Frappes critiques et multiplicateurs de dégâts.",
      en: "Critical strikes and damage multipliers.",
      de: "Kritische Treffer und Schadensmultiplikatoren.",
    },
  },
  0: {
    label: {
      fr: "Compétences spécifiques aux généraux",
      en: "General-specific skills",
      de: "Generalspezifische Fähigkeiten",
    },
    summary: {
      fr: "Compétences uniques liées à un général (base ou entraînement).",
      en: "Unique skills tied to a single general (base or trained).",
      de: "Einzigartige Fähigkeiten eines bestimmten Generals (Basis oder Training).",
    },
  },
};

type Locale = "fr" | "en" | "de";

/** Replace `label` and `summary` on a series meta with locale-aware copy. */
export function localizeSeries(
  s: SkillSeriesMeta,
  locale: string,
): SkillSeriesMeta {
  const loc: Locale = locale === "en" ? "en" : locale === "de" ? "de" : "fr";
  const t = WC4_SERIES_I18N[s.series];
  if (!t) return s;
  return { ...s, label: t.label[loc], summary: t.summary[loc] };
}

/** Map an entire array of series metas to the requested locale. */
export function localizeSeriesList(
  series: SkillSeriesMeta[],
  locale: string,
): SkillSeriesMeta[] {
  return series.map((s) => localizeSeries(s, locale));
}

/** Get just the label for a series number in a given locale. */
export function getSeriesLabel(seriesNumber: number, locale: string): string | null {
  const loc: Locale = locale === "en" ? "en" : locale === "de" ? "de" : "fr";
  const t = WC4_SERIES_I18N[seriesNumber];
  return t ? t.label[loc] : null;
}
