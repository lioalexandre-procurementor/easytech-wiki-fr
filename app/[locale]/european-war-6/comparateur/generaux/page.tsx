import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import GeneralComparatorClient from "@/components/GeneralComparatorClient";
import { getAllGenerals } from "@/lib/ew6";
import {
  buildTrainedView,
  buildPremiumTrainingView,
} from "@/lib/general-trained";
import { locales, type Locale } from "@/src/i18n/config";
import { ogLocale } from "@/src/i18n/og-locale";
import type { Metadata } from "next";
import type { ComparableRow, GeneralData, GeneralAttributes } from "@/lib/types";

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
    title: `${t("generalsTitle")} — GCR`,
    description: t("generalsIntro"),
    alternates: {
      canonical:
        locale === "fr"
          ? "/fr/european-war-6/comparateur/generaux"
          : `/${locale}/european-war-6/comparator/generals`,
      languages: {
        fr: "/fr/european-war-6/comparateur/generaux",
        en: "/en/european-war-6/comparator/generals",
        de: "/de/european-war-6/comparator/generals",
        "x-default": "/fr/european-war-6/comparateur/generaux",
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
      fr: `/european-war-6/generaux/${g.slug}`,
      en: `/european-war-6/generals/${g.slug}`,
      de: `/european-war-6/generals/${g.slug}`,
    },
  };
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
  const unlockRows = generals
    .map((g) => generalToRow(g, "unlock"))
    .filter((r): r is ComparableRow => r !== null);
  const maxedRows = generals
    .map((g) => generalToRow(g, "maxed"))
    .filter((r): r is ComparableRow => r !== null);
  const trainedRows = generals
    .map((g) => generalToRow(g, "trained"))
    .filter((r): r is ComparableRow => r !== null);

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
          trainedEligibleIds={Array.from(trainedEligible)}
          initialIds={picks}
          initialMode={initialMode}
          tableLabels={tableLabels}
          radarLabels={radarLabels}
          statsHeading={t("comparatorPage.statsHeading")}
          radarHeading={t("comparatorPage.radarHeading")}
          modeLabels={L}
          modeHints={H}
        />
      </div>
      <Footer />
    </>
  );
}
