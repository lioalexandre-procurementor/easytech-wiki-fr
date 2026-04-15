import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import GeneralComparatorClient from "@/components/GeneralComparatorClient";
import { getAllGenerals } from "@/lib/units";
import { locales, type Locale } from "@/src/i18n/config";
import { ogLocale } from "@/src/i18n/og-locale";
import type { Metadata } from "next";
import type { ComparableRow, GeneralData } from "@/lib/types";

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

function generalToRow(g: GeneralData): ComparableRow {
  const attrs = g.attributes ?? {};
  return {
    id: g.slug,
    name: g.nameEn || g.name,
    nameFr: g.name,
    category: g.category,
    stats: {
      infantry: attrs.infantry?.max ?? null,
      artillery: attrs.artillery?.max ?? null,
      armor: attrs.armor?.max ?? null,
      navy: attrs.navy?.max ?? null,
      airforce: attrs.airforce?.max ?? null,
      marching: attrs.marching?.max ?? null,
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
  const allRows = generals.map(generalToRow);

  const picks: string[] = [];
  for (const k of ["left", "right", "third", "fourth"] as const) {
    const v = searchParams[k];
    if (typeof v === "string") picks.push(v);
  }
  if (picks.length === 0) picks.push(allRows[0]?.id ?? "", allRows[1]?.id ?? "");

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

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 pb-20">
        <header className="mb-6 mt-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gold2 mb-2">
            {t("comparatorPage.generalsTitle")}
          </h1>
          <p className="text-dim text-base max-w-3xl leading-relaxed">
            {t("comparatorPage.generalsIntro")}
          </p>
        </header>
        <GeneralComparatorClient
          allRows={allRows}
          initialIds={picks}
          tableLabels={tableLabels}
          radarLabels={radarLabels}
          statsHeading={t("comparatorPage.statsHeading")}
          radarHeading={t("comparatorPage.radarHeading")}
        />
      </div>
      <Footer />
    </>
  );
}
