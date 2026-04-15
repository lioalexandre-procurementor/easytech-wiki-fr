import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import UnitComparatorClient from "@/components/UnitComparatorClient";
import { getAllEliteUnits } from "@/lib/units";
import { locales, type Locale } from "@/src/i18n/config";
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
          ? "/fr/world-conqueror-4/comparateur/unites"
          : "/en/world-conqueror-4/comparator/units",
      languages: {
        fr: "/fr/world-conqueror-4/comparateur/unites",
        en: "/en/world-conqueror-4/comparator/units",
        "x-default": "/fr/world-conqueror-4/comparateur/unites",
      },
    },
    openGraph: {
      title: t("seoTitle"),
      description: t("seoDescription"),
      type: "website",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      alternateLocale: locale === "fr" ? ["en_US"] : ["fr_FR"],
    },
    robots: { index: true, follow: true },
  };
}

function unitToRow(u: UnitData, locale: "fr" | "en"): ComparableRow {
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
      fr: `/world-conqueror-4/unites-elite/${u.slug}`,
      en: `/world-conqueror-4/elite-units/${u.slug}`,
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
  const loc = locale as "fr" | "en";
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
        <span>{t("nav.wc4")}</span>
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
