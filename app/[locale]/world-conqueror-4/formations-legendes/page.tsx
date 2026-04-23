import type { Metadata } from "next";
import { unstable_setRequestLocale, getTranslations } from "next-intl/server";
import { getAllFormations, resolveFormationUnits } from "@/lib/formations";
import { FormationsHubClient } from "./FormationsHubClient";
import { FormationCard } from "@/components/FormationCard";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { JsonLd } from "@/components/JsonLd";
import { locales } from "@/src/i18n/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://easytech-wiki.fr";

const LOCALE_PATHS = {
  fr: "/world-conqueror-4/formations-legendes",
  en: "/world-conqueror-4/legend-formations",
  de: "/world-conqueror-4/legend-formations",
} as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "formations.hub" });
  const localePath = LOCALE_PATHS[locale as keyof typeof LOCALE_PATHS] ?? LOCALE_PATHS.fr;
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `${BASE_URL}/${locale}${localePath}`,
      languages: {
        fr: `${BASE_URL}/fr${LOCALE_PATHS.fr}`,
        en: `${BASE_URL}/en${LOCALE_PATHS.en}`,
        de: `${BASE_URL}/de${LOCALE_PATHS.de}`,
        "x-default": `${BASE_URL}/fr${LOCALE_PATHS.fr}`,
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `${BASE_URL}/${locale}${localePath}`,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default async function FormationsHubPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "formations.hub" });
  const formations = getAllFormations();
  const resolvedUnits: Record<string, ReturnType<typeof resolveFormationUnits>> = {};
  const detailHrefs: Record<string, string> = {};
  const localeKey = (locale === "en" || locale === "de" ? locale : "fr") as "fr" | "en" | "de";
  for (const f of formations) {
    resolvedUnits[f.slug] = resolveFormationUnits(f.units, locale);
    detailHrefs[f.slug] = `${LOCALE_PATHS[localeKey]}/${f.slug}`;
  }

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("metaTitle"),
    itemListElement: formations.map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: locale === "en" ? f.nameEn : locale === "de" ? f.nameDe : f.name,
      url: `${BASE_URL}/${locale}${LOCALE_PATHS[localeKey]}/${f.slug}`,
    })),
  };

  const breadcrumbs = [
    { label: "World Conqueror 4", href: "/world-conqueror-4" },
    { label: t("breadcrumb") },
  ];

  return (
    <>
      <TopBar />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <BreadcrumbNav items={breadcrumbs} locale={locale} />
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gold2 mb-2">{t("h1")}</h1>
          <p className="text-muted text-base leading-relaxed max-w-3xl">{t("intro")}</p>
        </header>

        <FormationsHubClient
          formations={formations}
          resolvedUnits={resolvedUnits}
          detailHrefs={detailHrefs}
          locale={locale}
          t={{
            selectPrompt: t("selectPrompt"),
            historicalUnit: t("historicalUnit"),
            unitsInFormation: t("unitsInFormation"),
            generalBuff: t("generalBuff"),
            tacticalEffects: t("tacticalEffects"),
            countryLock: t("countryLock"),
            readFullGuide: t("readFullGuide"),
          }}
        />

        <section className="mt-10">
          <h2 className="text-xl font-bold text-gold2 mb-3">{t("browseAll")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {formations.map((f) => (
              <FormationCard key={f.slug} formation={f} locale={locale} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <JsonLd data={itemListLd} />
    </>
  );
}
