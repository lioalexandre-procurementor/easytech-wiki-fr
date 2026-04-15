import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { getTechIndex, TECH_CATEGORIES } from "@/lib/tech";
import { locales, type Locale } from "@/src/i18n/config";
import { ogLocale } from "@/src/i18n/og-locale";
import type { Metadata } from "next";

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
      canonical: `/${locale}/world-conqueror-4/technologies`,
      languages: {
        fr: "/fr/world-conqueror-4/technologies",
        en: "/en/world-conqueror-4/technologies",
        de: "/de/world-conqueror-4/technologies",
        "x-default": "/fr/world-conqueror-4/technologies",
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
  const idx = getTechIndex();

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 pb-20">
        <header className="mb-6 mt-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gold2 mb-2">
            {t("techPage.hubTitle")}
          </h1>
          <p className="text-dim text-base max-w-3xl leading-relaxed">
            {t("techPage.hubIntro")}
          </p>
          <p className="text-muted text-xs uppercase tracking-widest mt-3">
            {t("techPage.totalLabel", { count: idx.totalTechs })}
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TECH_CATEGORIES.map((cat) => {
            const count = idx.byCategory[cat.id] ?? 0;
            if (count === 0) return null;
            return (
              <Link
                key={cat.id}
                href={`/world-conqueror-4/technologies/categorie/${cat.id}` as any}
                className="block bg-panel border border-border rounded-lg p-6 hover:border-gold transition-colors no-underline"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <h2 className="text-gold2 font-bold text-lg mb-1">
                  {t(cat.nameKey as any)}
                </h2>
                <p className="text-muted text-xs uppercase tracking-widest">
                  {count}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
      <Footer />
    </>
  );
}
