import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import GeneralComparatorClient from "@/components/GeneralComparatorClient";
import { getAllGenerals } from "@/lib/units";
import {
  buildTrainedView,
  buildPremiumTrainingView,
} from "@/lib/general-trained";
import { locales, type Locale } from "@/src/i18n/config";
import { ogLocale } from "@/src/i18n/og-locale";
import type { Metadata } from "next";
import type {
  ComparableRow,
  GeneralData,
  GeneralAttributes,
  GeneralSkill,
  SkillRating,
} from "@/lib/types";

/**
 * Lightweight per-general metadata shipped to the comparator client so it can
 * render a portrait header and a quick skills comparison alongside the stat
 * table. Kept separate from `ComparableRow` so the existing `lib/types` shape
 * stays stable.
 */
export type CompareMeta = {
  headImage: string | null;
  skills: Array<{
    slot: number;
    name: string;       // EN canonical
    nameFr: string;     // FR native
    rating: SkillRating | null;
    replaceable: boolean;
    icon: string | null;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "comparatorPage" });
  return {
    title: `${t("generalsTitle")} — WC4`,
    description: t("generalsIntro"),
    alternates: {
      canonical:
        locale === "fr"
          ? "/fr/world-conqueror-4/comparateur/generaux"
          : `/${locale}/world-conqueror-4/comparator/generals`,
      languages: {
        fr: "/fr/world-conqueror-4/comparateur/generaux",
        en: "/en/world-conqueror-4/comparator/generals",
        de: "/de/world-conqueror-4/comparator/generals",
        "x-default": "/fr/world-conqueror-4/comparateur/generaux",
      },
    },
    openGraph: {
      title: t("generalsTitle"),
      description: t("generalsIntro"),
      type: "website",
      locale: ogLocale(locale),
    },
    robots: { index: true, follow: true },
  };
}

type CompareMode = "unlock" | "maxed" | "trained";

/**
 * Build a `ComparableRow` for a general in a given projection mode.
 *
 *   - `unlock`  — values the general ships with at purchase (`attributes[*].start`).
 *   - `maxed`   — cat-max projection: every attribute at its ceiling
 *                 (what the /trained page shows; available for every general).
 *   - `trained` — premium training projection (Swords/Sceptres). Only available
 *                 when `g.hasTrainingPath && g.trainedSkills?.length`. For
 *                 ineligible generals the trained mode returns `null` so the
 *                 comparator can render a clean "N/A" state instead of
 *                 silently falling back to the maxed view and misleading the
 *                 reader.
 *
 * `costMedal`, `skillSlots` and `militaryRank` are mode-independent and
 * always attached.
 */
function generalToRow(g: GeneralData, mode: CompareMode): ComparableRow | null {
  let attrs: GeneralAttributes | null | undefined;
  if (mode === "trained") {
    const view = buildPremiumTrainingView(g);
    if (!view) return null;
    attrs = view.attributes;
  } else if (mode === "maxed") {
    const view = buildTrainedView(g);
    attrs = view.attributes;
  } else {
    // unlock: stats at purchase — read `.start` when available.
    attrs = g.attributes ?? {};
  }

  const pick = (key: keyof GeneralAttributes): number | null => {
    const v = attrs?.[key];
    if (!v) return null;
    return mode === "unlock" ? v.start : v.max;
  };

  return {
    id: g.slug,
    name: g.nameEn || g.name,
    nameFr: g.name,
    category: g.category,
    stats: {
      infantry: pick("infantry"),
      artillery: pick("artillery"),
      armor: pick("armor"),
      navy: pick("navy"),
      airforce: pick("airforce"),
      marching: pick("marching"),
      costMedal: g.acquisition.cost ?? null,
      skillSlots: g.skillSlots ?? null,
      militaryRank: g.militaryRank ?? null,
    },
    href: {
      fr: `/world-conqueror-4/generaux/${g.slug}`,
      en: `/world-conqueror-4/generals/${g.slug}`,
      de: `/world-conqueror-4/generals/${g.slug}`,
    },
  };
}

function skillsToMeta(skills: GeneralSkill[] | null | undefined): CompareMeta["skills"] {
  if (!skills) return [];
  return skills.map((s) => ({
    slot: s.slot,
    name: s.nameEn || s.name,
    nameFr: s.name,
    rating: (s.rating ?? null) as SkillRating | null,
    replaceable: !!s.replaceable,
    icon: s.icon ?? null,
  }));
}

function generalToMeta(g: GeneralData, mode: CompareMode): CompareMeta {
  const isTrained = mode === "trained";
  const headImage = isTrained
    ? g.image?.headTrained ?? g.image?.head ?? null
    : g.image?.head ?? null;
  const skills = isTrained && g.trainedSkills?.length
    ? skillsToMeta(g.trainedSkills)
    : skillsToMeta(g.skills);
  return { headImage, skills };
}

export default async function GeneralComparatorPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  const t = await getTranslations();
  const generals = getAllGenerals();

  // Pre-compute all three row sets server-side so the client can switch
  // modes without an extra round-trip. Ids that have no trained-mode
  // variant are filtered out up front.
  const buildRowsAndMeta = (mode: CompareMode) => {
    const rows: ComparableRow[] = [];
    const meta: Record<string, CompareMeta> = {};
    for (const g of generals) {
      const row = generalToRow(g, mode);
      if (!row) continue;
      rows.push(row);
      meta[g.slug] = generalToMeta(g, mode);
    }
    return { rows, meta };
  };

  const unlock = buildRowsAndMeta("unlock");
  const maxed = buildRowsAndMeta("maxed");
  const trained = buildRowsAndMeta("trained");
  const unlockRows = unlock.rows;
  const maxedRows = maxed.rows;
  const trainedRows = trained.rows;

  const trainedEligible = new Set(trainedRows.map((r) => r.id));

  const picks: string[] = [];
  for (const k of ["left", "right", "third", "fourth"] as const) {
    const v = searchParams[k];
    if (typeof v === "string") picks.push(v);
  }
  if (picks.length === 0) picks.push(maxedRows[0]?.id ?? "", maxedRows[1]?.id ?? "");

  const initialMode = (
    searchParams.mode === "unlock" || searchParams.mode === "trained"
      ? searchParams.mode
      : "maxed"
  ) as CompareMode;

  const radarLabels = {
    infantry: t("comparatorPage.stat.infantry"),
    artillery: t("comparatorPage.stat.artillery"),
    armor: t("comparatorPage.stat.armor"),
    navy: t("comparatorPage.stat.navy"),
    airforce: t("comparatorPage.stat.airforce"),
    marching: t("comparatorPage.stat.marching"),
  };
  const tableLabels = {
    ...radarLabels,
    costMedal: t("comparatorPage.stat.costMedal"),
    skillSlots: t("comparatorPage.stat.skillSlots"),
    militaryRank: t("comparatorPage.stat.militaryRank"),
  };

  // Mode labels for the tab UI. Kept local to this route for simplicity
  // — the strings don't appear elsewhere on the site.
  const modeLabels: Record<string, Record<CompareMode, string>> = {
    fr: {
      unlock:  "🔓 Version déblocage",
      maxed:   "⭐ Plafonné",
      trained: "⚔️ Entraînement premium",
    },
    en: {
      unlock:  "🔓 At unlock",
      maxed:   "⭐ Maxed out",
      trained: "⚔️ Premium training",
    },
    de: {
      unlock:  "🔓 Bei Freischaltung",
      maxed:   "⭐ Voll ausgebaut",
      trained: "⚔️ Premium-Training",
    },
  };
  const modeHints: Record<string, Record<CompareMode, string>> = {
    fr: {
      unlock:  "Statistiques à l'achat, avant tout entraînement.",
      maxed:   "Chaque attribut projeté à son plafond catalogue.",
      trained: "Projection après Épées/Sceptres de Domination (19 généraux concernés).",
    },
    en: {
      unlock:  "Stats at purchase, before any training.",
      maxed:   "Every attribute projected to its catalog ceiling.",
      trained: "Projection after Swords/Sceptres of Dominance (19 eligible generals).",
    },
    de: {
      unlock:  "Werte beim Kauf, vor jedem Training.",
      maxed:   "Jedes Attribut auf seinem Katalog-Maximum.",
      trained: "Projektion nach Schwertern/Zeptern der Vorherrschaft (19 Generäle).",
    },
  };
  const L = modeLabels[locale] ?? modeLabels.en;
  const H = modeHints[locale] ?? modeHints.en;

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-4 md:px-6 pb-20">
        <header className="mb-4 md:mb-6 mt-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gold2 mb-2">
            {t("comparatorPage.generalsTitle")}
          </h1>
          <p className="text-dim text-sm md:text-base max-w-3xl leading-relaxed">
            {t("comparatorPage.generalsIntro")}
          </p>
        </header>
        <GeneralComparatorClient
          rowsByMode={{
            unlock: unlockRows,
            maxed: maxedRows,
            trained: trainedRows,
          }}
          metaByMode={{
            unlock: unlock.meta,
            maxed: maxed.meta,
            trained: trained.meta,
          }}
          locale={locale}
          trainedEligibleIds={Array.from(trainedEligible)}
          initialIds={picks}
          initialMode={initialMode}
          tableLabels={tableLabels}
          radarLabels={radarLabels}
          statsHeading={t("comparatorPage.statsHeading")}
          radarHeading={t("comparatorPage.radarHeading")}
          skillsHeading={t("comparatorPage.skillsHeading")}
          slotLabel={t("comparatorPage.slotLabel")}
          noSkillLabel={t("comparatorPage.noSkill")}
          modeLabels={L}
          modeHints={H}
        />
      </div>
      <Footer />
    </>
  );
}
