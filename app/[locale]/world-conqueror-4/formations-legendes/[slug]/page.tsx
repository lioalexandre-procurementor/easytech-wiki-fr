import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_setRequestLocale, getTranslations } from "next-intl/server";
import { getAllFormations, getFormation, getAllFormationSlugs, localizedFormationField, resolveFormationUnits } from "@/lib/formations";
import { FormationUnitRow } from "@/components/FormationUnitRow";
import { FormationEffectRow, FormationGeneralBuff } from "@/components/FormationEffectRow";
import { FormationCard } from "@/components/FormationCard";
import { COUNTRY_FLAGS } from "@/lib/units";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { JsonLd } from "@/components/JsonLd";
import { locales } from "@/src/i18n/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://easytech-wiki.com";

const LOCALE_PATHS = {
  fr: "/world-conqueror-4/formations-legendes",
  en: "/world-conqueror-4/legend-formations",
  de: "/world-conqueror-4/legend-formations",
} as const;

export function generateStaticParams() {
  const slugs = getAllFormationSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const formation = getFormation(slug);
  if (!formation) return { title: "404" };
  const localeKey = (locale === "en" || locale === "de" ? locale : "fr") as "fr" | "en" | "de";
  const name = localizedFormationField(formation, "name", locale);
  const short =
    locale === "en"
      ? formation.lore.shortEn
      : locale === "de"
        ? formation.lore.shortDe
        : formation.lore.short;
  const t = await getTranslations({ locale, namespace: "formations.detail" });
  return {
    title: `${name} — ${t("metaTitleSuffix")}`,
    description: short,
    alternates: {
      canonical: `${BASE_URL}/${locale}${LOCALE_PATHS[localeKey]}/${slug}`,
      languages: {
        fr: `${BASE_URL}/fr${LOCALE_PATHS.fr}/${slug}`,
        en: `${BASE_URL}/en${LOCALE_PATHS.en}/${slug}`,
        de: `${BASE_URL}/de${LOCALE_PATHS.de}/${slug}`,
        "x-default": `${BASE_URL}/fr${LOCALE_PATHS.fr}/${slug}`,
      },
    },
    openGraph: {
      title: name,
      description: short,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default async function FormationDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  unstable_setRequestLocale(locale);
  const formation = getFormation(slug);
  if (!formation) notFound();

  const t = await getTranslations({ locale, namespace: "formations.detail" });
  const tHub = await getTranslations({ locale, namespace: "formations.hub" });
  const all = getAllFormations();
  const others = all.filter((f) => f.slug !== slug);

  const name = localizedFormationField(formation, "name", locale);
  const countryName = localizedFormationField(formation, "countryName", locale);
  const historicalUnit = localizedFormationField(formation, "historicalUnit", locale);
  const operationName = formation.operationName
    ? localizedFormationField(formation, "operationName", locale)
    : null;
  const short =
    locale === "en"
      ? formation.lore.shortEn
      : locale === "de"
        ? formation.lore.shortDe
        : formation.lore.short;
  const long =
    locale === "en"
      ? formation.lore.longEn
      : locale === "de"
        ? formation.lore.longDe
        : formation.lore.long;
  const generalText =
    locale === "en"
      ? formation.generalBuff.textEn
      : locale === "de"
        ? formation.generalBuff.textDe
        : formation.generalBuff.text;

  const localeKey = (locale === "en" || locale === "de" ? locale : "fr") as "fr" | "en" | "de";
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: name,
    description: short,
    inLanguage: locale,
    about: {
      "@type": "VideoGame",
      name: "World Conqueror 4",
    },
    url: `${BASE_URL}/${locale}${LOCALE_PATHS[localeKey]}/${slug}`,
    datePublished: "2026-04-23",
  };

  const breadcrumbs = [
    { label: "World Conqueror 4", href: "/world-conqueror-4" },
    { label: tHub("breadcrumb"), href: LOCALE_PATHS[localeKey] },
    { label: name },
  ];

  return (
    <>
      <TopBar />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <BreadcrumbNav items={breadcrumbs} locale={locale} />

        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-3xl">{COUNTRY_FLAGS[formation.country] || "🏳"}</span>
            <h1 className="text-3xl md:text-4xl font-bold text-gold2 m-0">{name}</h1>
            {operationName && (
              <span className="text-xs uppercase tracking-wider bg-bg3 border border-border rounded px-2 py-0.5 text-muted">
                {operationName}
              </span>
            )}
          </div>
          <p className="text-muted text-sm m-0">
            {countryName} · <strong className="text-text">{tHub("historicalUnit")}:</strong> {historicalUnit}
          </p>
        </header>

        <section className="mb-6">
          {long.map((para, i) => (
            <p key={i} className="text-text/90 leading-relaxed mb-3">
              {para}
            </p>
          ))}
        </section>

        <section className="mb-6">
          <h2 className="text-gold2 font-semibold text-lg uppercase tracking-wider mb-3">
            {tHub("unitsInFormation")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {resolveFormationUnits(formation.units, locale).map((u, i) => (
              <FormationUnitRow key={i} unit={u} />
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-gold2 font-semibold text-lg uppercase tracking-wider mb-3">
            {tHub("generalBuff")}
          </h2>
          <FormationGeneralBuff text={generalText} appliesTo={formation.generalBuff.appliesTo} />
        </section>

        <section className="mb-6">
          <h2 className="text-gold2 font-semibold text-lg uppercase tracking-wider mb-3">
            {tHub("tacticalEffects")}
          </h2>
          <div className="grid gap-2">
            {formation.tacticalEffects.map((e, i) => (
              <FormationEffectRow key={i} effect={e} locale={locale} />
            ))}
          </div>
        </section>

        <p className="text-xs text-muted italic mb-8">{tHub("countryLock")}</p>

        <section className="mt-10 border-t border-border pt-6">
          <h2 className="text-xl font-bold text-gold2 mb-3">{t("otherFormations")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {others.map((f) => (
              <FormationCard key={f.slug} formation={f} locale={locale} />
            ))}
          </div>
        </section>

        <div className="mt-6">
          <Link
            href={`/${locale}${LOCALE_PATHS[localeKey]}`}
            className="inline-flex items-center gap-1 text-gold2 font-semibold hover:text-gold no-underline"
          >
            ← {t("backToHub")}
          </Link>
        </div>
      </main>
      <Footer />
      <JsonLd data={articleLd} />
    </>
  );
}
