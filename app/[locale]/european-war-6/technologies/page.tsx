import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { locales, type Locale } from "@/src/i18n/config";
import { ogLocale } from "@/src/i18n/og-locale";
import type { Metadata } from "next";

// GCR tech categories placeholder structure
// This mirrors the WC4 tech categories but for GCR game data
const GCR_TECH_CATEGORIES = [
  {
    id: "military",
    icon: "⚔️",
    nameKey: "techPage.categoryMilitary",
  },
  {
    id: "economy",
    icon: "💰",
    nameKey: "techPage.categoryEconomy",
  },
  {
    id: "defense",
    icon: "🛡️",
    nameKey: "techPage.categoryDefense",
  },
  {
    id: "naval",
    icon: "⛵",
    nameKey: "techPage.categoryNaval",
  },
];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "techPage" });
  return {
    title: t("seoTitle"),
    description: t("seoDescription"),
    alternates: {
      canonical: `/${locale}/european-war-6/technologies`,
      languages: {
        fr: "/fr/european-war-6/technologies",
        en: "/en/european-war-6/technologies",
        de: "/de/european-war-6/technologies",
        "x-default": "/fr/european-war-6/technologies",
      },
    },
    openGraph: {
      title: t("seoTitle"),
      description: t("seoDescription"),
      type: "website",
      locale: ogLocale(locale),
    },
    robots: { index: true, follow: true },
  };
}

export default async function TechHubPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  const t = await getTranslations();

  // Placeholder for total tech count from GCR data
  const totalTechs = 0;

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-4 md:px-6 pb-20">
        <nav className="mt-4 mb-5">
          <Link
            href={"/european-war-6" as any}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-panel hover:border-gold hover:bg-gold/5 text-dim hover:text-gold2 text-sm font-semibold transition-colors no-underline"
          >
            {t("nav.backToHubGcr")}
          </Link>
        </nav>
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gold2 mb-2">
            {t("techPage.hubTitle")}
          </h1>
          <p className="text-dim text-base max-w-3xl leading-relaxed">
            {t("techPage.hubIntro")}
          </p>
          <p className="text-muted text-xs uppercase tracking-widest mt-3">
            {t("techPage.totalLabel", { count: totalTechs })}
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GCR_TECH_CATEGORIES.map((cat) => {
            return (
              <div
                key={cat.id}
                className="block bg-panel border border-border rounded-lg p-6"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <h2 className="text-gold2 font-bold text-lg mb-1">
                  {t(cat.nameKey as any)}
                </h2>
                <p className="text-muted text-xs uppercase tracking-widest">
                  {t("ew6Hub.underConstruction")}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-6 bg-panel border border-border rounded-lg">
          <p className="text-dim text-sm">
            {t("ew6Hub.underConstructionNote")}
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
