import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { TechTreeGrid } from "@/components/tech/TechTreeGrid";
import { getTechsByCategory, TECH_CATEGORIES } from "@/lib/tech";
import { locales, type Locale } from "@/src/i18n/config";
import type { TechCategory } from "@/lib/types";
import type { Metadata } from "next";

const VALID_CATS: Set<TechCategory> = new Set([
  "infantry",
  "armor",
  "artillery",
  "navy",
  "airforce",
  "fortifications",
  "antiair",
  "missile",
]);

export function generateStaticParams() {
  const params: { locale: string; category: string }[] = [];
  for (const locale of locales) {
    for (const cat of TECH_CATEGORIES) {
      params.push({ locale, category: cat.id });
    }
  }
  return params;
}

export async function generateMetadata({
  params: { locale, category },
}: {
  params: { locale: string; category: string };
}): Promise<Metadata> {
  if (!VALID_CATS.has(category as TechCategory)) return { title: "404" };
  const t = await getTranslations({ locale });
  const catName = t(`techPage.category.${category}` as any);
  return {
    title: t("techPage.categoryHeading" as any, { name: catName }),
    description: t("techPage.hubIntro" as any),
    alternates: {
      canonical: `/${locale}/world-conqueror-4/technologies/categorie/${category}`,
      languages: {
        fr: `/fr/world-conqueror-4/technologies/categorie/${category}`,
        en: `/en/world-conqueror-4/technologies/category/${category}`,
        "x-default": `/fr/world-conqueror-4/technologies/categorie/${category}`,
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function TechCategoryPage({
  params: { locale, category },
}: {
  params: { locale: string; category: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  if (!VALID_CATS.has(category as TechCategory)) notFound();
  unstable_setRequestLocale(locale);
  const t = await getTranslations();
  const techs = getTechsByCategory(category as TechCategory);
  const catName = t(`techPage.category.${category}` as any);

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 pb-20">
        <div className="text-xs text-muted mb-3 mt-3">
          <Link href={"/world-conqueror-4/technologies" as any}>
            {t("techPage.backToHub" as any)}
          </Link>
        </div>
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gold2 mb-2">
            {catName}
          </h1>
          <p className="text-dim text-base max-w-3xl leading-relaxed">
            {t("techPage.categoryHeading" as any, { name: catName })}
          </p>
        </header>
        <TechTreeGrid techs={techs} locale={locale as "fr" | "en"} />
      </div>
      <Footer />
    </>
  );
}
