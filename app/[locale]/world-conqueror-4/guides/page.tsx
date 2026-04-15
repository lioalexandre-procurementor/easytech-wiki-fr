import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { getAllGuides } from "@/lib/guides";
import { locales, type Locale } from "@/src/i18n/config";
import type { Metadata } from "next";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "guidesPage" });
  return {
    title: t("seoTitle"),
    description: t("seoDescription"),
    alternates: {
      canonical: `/${locale}/world-conqueror-4/guides`,
      languages: {
        fr: "/fr/world-conqueror-4/guides",
        en: "/en/world-conqueror-4/guides",
        "x-default": "/fr/world-conqueror-4/guides",
      },
    },
    openGraph: {
      title: t("seoTitle"),
      description: t("seoDescription"),
      type: "website",
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
    robots: { index: true, follow: true },
  };
}

export default async function GuidesHubPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  const t = await getTranslations();
  const loc = locale as "fr" | "en";
  const guides = getAllGuides();

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 pb-20">
        <header className="mb-6 mt-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gold2 mb-2">
            {t("guidesPage.hubTitle")}
          </h1>
          <p className="text-dim text-base max-w-3xl leading-relaxed">
            {t("guidesPage.hubIntro")}
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {guides.map((g) => (
            <Link
              key={g.slug}
              href={`/world-conqueror-4/guides/${g.slug}` as any}
              className="block bg-panel border border-border rounded-lg p-6 hover:border-gold transition-colors no-underline"
            >
              <div className="flex flex-wrap items-baseline gap-2 mb-2">
                <span className="text-gold2 font-black uppercase tracking-widest text-xs">
                  {t(`guidesPage.category.${g.category}`)}
                </span>
                <span className="text-muted text-xs">
                  {t("guidesPage.readingTime", { minutes: g.readingTimeMinutes })}
                </span>
              </div>
              <h2 className="text-gold2 text-xl font-bold mb-1">{g.title[loc]}</h2>
              <p className="text-dim text-sm leading-relaxed">{g.description[loc]}</p>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
