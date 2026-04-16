import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { getAllGuides } from "@/lib/guides";
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
  const t = await getTranslations({ locale, namespace: "guidesPage" });
  return {
    title: t("seoTitle"),
    description: t("seoDescription"),
    alternates: {
      canonical: `/${locale}/european-war-6/guides`,
      languages: {
        fr: "/fr/european-war-6/guides",
        en: "/en/european-war-6/guides",
        de: "/de/european-war-6/guides",
        "x-default": "/fr/european-war-6/guides",
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

/** Per-category tint used behind the card thumbnail. Mirrors the detail-page palette. */
const CATEGORY_TINT: Record<string, { from: string; to: string; border: string }> = {
  starter:  { from: "rgba(74,157,95,0.40)",  to: "rgba(74,157,95,0.05)",  border: "rgba(74,157,95,0.40)" },
  systems:  { from: "rgba(74,144,226,0.40)", to: "rgba(74,144,226,0.05)", border: "rgba(74,144,226,0.40)" },
  strategy: { from: "rgba(212,164,74,0.40)", to: "rgba(212,164,74,0.05)", border: "rgba(212,164,74,0.40)" },
  meta:     { from: "rgba(200,55,45,0.40)",  to: "rgba(200,55,45,0.05)",  border: "rgba(200,55,45,0.40)" },
};

export default async function GuidesHubPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  const t = await getTranslations();
  const loc = locale as Locale;
  const guides = getAllGuides();

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-4 md:px-6 pb-20">
        <header className="mb-6 mt-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gold2 mb-2">
            {t("guidesPage.hubTitle")}
          </h1>
          <p className="text-dim text-base max-w-3xl leading-relaxed">
            {t("guidesPage.hubIntro")}
          </p>
        </header>

        <div className="grid gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => {
            const tint = CATEGORY_TINT[g.category] ?? CATEGORY_TINT.strategy;
            return (
              <Link
                key={g.slug}
                href={`/european-war-6/guides/${g.slug}` as any}
                className="group block bg-panel border border-border rounded-lg overflow-hidden hover:border-gold hover:-translate-y-0.5 transition-all no-underline shadow-[0_1px_3px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
              >
                {/* Card image header */}
                <div
                  className="relative w-full aspect-[5/3] overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${tint.from}, ${tint.to}), #111820`,
                  }}
                >
                  {g.heroImage ? (
                    <Image
                      src={g.heroImage}
                      alt={g.heroAlt ?? ""}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-contain object-center p-4 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="text-5xl opacity-30 select-none">📘</span>
                    </div>
                  )}
                  <span
                    className="absolute top-2.5 left-2.5 bg-[#0a0e13]/85 backdrop-blur-sm text-gold2 font-black uppercase tracking-widest text-[9px] md:text-[10px] px-2 py-0.5 rounded border"
                    style={{ borderColor: tint.border }}
                  >
                    {t(`guidesPage.category.${g.category}`)}
                  </span>
                  <span className="absolute bottom-2.5 right-2.5 bg-[#0a0e13]/85 backdrop-blur-sm text-muted text-[9px] md:text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded border border-border">
                    {t("guidesPage.readingTime", { minutes: g.readingTimeMinutes })}
                  </span>
                </div>
                {/* Card body */}
                <div className="p-4 md:p-5">
                  <h2 className="text-gold2 text-lg md:text-xl font-bold mb-1.5 leading-tight line-clamp-2 group-hover:text-gold transition-colors">
                    {g.title[loc]}
                  </h2>
                  <p className="text-dim text-sm leading-relaxed line-clamp-3">
                    {g.description[loc]}
                  </p>
                  {g.byline && (
                    <div className="text-muted text-[10px] uppercase tracking-widest mt-3 truncate">
                      {g.byline}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <Footer />
    </>
  );
}
