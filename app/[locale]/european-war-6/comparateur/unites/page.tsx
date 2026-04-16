import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import UnitComparatorClient from "@/components/UnitComparatorClient";
import { getAllEliteUnits } from "@/lib/ew6";
import { locales, type Locale } from "@/src/i18n/config";
import { ogLocale, ogAlternateLocales } from "@/src/i18n/og-locale";
import type { Metadata } from "next";
import type { ComparableRow, UnitData } from "@/lib/types";

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
    title: t("seoTitle"),
    description: t("seoDescription"),
    alternates: {
      canonical:
        locale === "fr"
          ? "/fr/european-war-6/comparateur/unites"
          : `/${locale}/european-war-6/comparator/units`,
      languages: {
        fr: "/fr/european-war-6/comparateur/unites",
        en: "/en/european-war-6/comparator/units",
        de: "/de/european-war-6/comparator/units",
        "x-default": "/fr/european-war-6/comparateur/unites",
      },
    },
    openGraph: {
      title: t("seoTitle"),
      description: t("seoDescription"),
      type: "website",
      locale: ogLocale(locale),
      alternateLocale: ogAlternateLocales(locale),
    },
    robots: { index: true, follow: true },
  };
}

function unitToRow(u: UnitData, _locale: Locale): ComparableRow {
  const lastIdx = Math.max(0, u.stats.atk.length - 1);
  return {
    id: u.slug,
    name: u.nameEn || u.name,
    nameFr: u.name,
    category: u.category,
    stats: {
      atk: u.stats.atk[lastIdx] ?? null,
      def: u.stats.def[lastIdx] ?? null,
      hp: u.stats.hp[lastIdx] ?? null,
      mov: u.stats.mov[lastIdx] ?? null,
      rng: u.stats.rng[lastIdx] ?? null,
    },
    href: {
      fr: `/european-war-6/unites-elite/${u.slug}`,
      en: `/european-war-6/elite-units/${u.slug}`,
      de: `/european-war-6/elite-units/${u.slug}`,
    },
  };
}

export default async function UnitComparatorPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  const t = await getTranslations();
  const loc = locale as Locale;
  const units = getAllEliteUnits();
  const allRows = units.map((u) => unitToRow(u, loc));

  const picks: string[] = [];
  for (const k of ["left", "right", "third", "fourth"] as const) {
    const v = searchParams[k];
    if (typeof v === "string") picks.push(v);
  }
  // Default picks: first 2 units if none specified.
  if (picks.length === 0) picks.push(allRows[0]?.id ?? "", allRows[1]?.id ?? "");

  const statLabels = {
    atk: t("comparatorPage.stat.atk"),
    def: t("comparatorPage.stat.def"),
    hp: t("comparatorPage.stat.hp"),
    mov: t("comparatorPage.stat.mov"),
    rng: t("comparatorPage.stat.rng"),
  };

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <span>{t("nav.ew6")}</span>
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <span>{t("comparatorPage.unitsTitle")}</span>
      </div>
      <div className="max-w-[1320px] mx-auto px-6 pb-20">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gold2 mb-2">
            {t("comparatorPage.unitsTitle")}
          </h1>
          <p className="text-dim text-base max-w-3xl leading-relaxed">
            {t("comparatorPage.unitsIntro")}
          </p>
        </header>
        <UnitComparatorClient
          allRows={allRows}
          initialIds={picks}
          statLabels={statLabels}
          statsHeading={t("comparatorPage.statsHeading")}
          radarHeading={t("comparatorPage.radarHeading")}
        />
      </div>
      <Footer />
    </>
  );
}
