import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { PageHero } from "@/components/PageHero";
import { Footer } from "@/components/Footer";
import { getTechIndex, TECH_CATEGORIES } from "@/lib/tech";
import { locales, type Locale } from "@/src/i18n/config";
import { ogLocale } from "@/src/i18n/og-locale";
import { ogImage } from "@/lib/og";
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
  const ogImages = ogImage({
    title: t("seoTitle"),
    sub: "World Conqueror 4",
  });
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
      images: ogImages,
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
      <div className="max-w-[1320px] mx-auto px-4 md:px-6 pb-20">
        <nav className="mt-4 mb-5">
          <Link
            href={"/world-conqueror-4" as any}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-panel hover:border-gold hover:bg-gold/5 text-dim hover:text-gold2 text-sm font-semibold transition-colors no-underline"
          >
            {t("nav.backToHubWc4")}
          </Link>
        </nav>
        <PageHero
          className="mb-6"
          eyebrow={t("nav.wc4")}
          title={t("techPage.hubTitle")}
          subtitle={t("techPage.hubIntro")}
        >
          <p className="text-muted text-xs uppercase tracking-widest">
            {t("techPage.totalLabel", { count: idx.totalTechs })}
          </p>
        </PageHero>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TECH_CATEGORIES.map((cat) => {
            const count = idx.byCategory[cat.id] ?? 0;
            if (count === 0) return null;
            return (
              <Link
                key={cat.id}
                href={`/world-conqueror-4/technologies/categorie/${cat.id}` as any}
                className="etw-lift block bg-panel border border-border rounded-xl p-6 hover:border-gold no-underline"
              >
                <div className="w-12 h-12 rounded-lg grid place-items-center text-2xl mb-3 border border-gold/30"
                  style={{ background: "linear-gradient(135deg, rgb(var(--c-gold) / 0.15), rgb(var(--c-accent) / 0.08))" }}>
                  {cat.icon}
                </div>
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
