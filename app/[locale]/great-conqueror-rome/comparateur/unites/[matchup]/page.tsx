import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { ComparatorTable } from "@/components/ComparatorTable";
import { ComparatorRadar } from "@/components/ComparatorRadar";
import { getAllEliteUnits, getEliteUnit } from "@/lib/gcr";
import { locales, type Locale } from "@/src/i18n/config";
import { ogLocale, ogAlternateLocales } from "@/src/i18n/og-locale";
import type { Metadata } from "next";
import type { ComparableRow, UnitData } from "@/lib/types";

function unitToRow(u: UnitData): ComparableRow {
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
      fr: `/great-conqueror-rome/unites-elite/${u.slug}`,
      en: `/great-conqueror-rome/elite-units/${u.slug}`,
      de: `/great-conqueror-rome/elite-units/${u.slug}`,
    },
  };
}

function parseMatchup(matchup: string): [string, string] | null {
  const parts = matchup.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}

export function generateStaticParams() {
  const units = getAllEliteUnits().filter((u) => u.tier === "S");
  const slugs = units.map((u) => u.slug).sort();
  const matchups: { locale: string; matchup: string }[] = [];
  for (const locale of locales) {
    for (let i = 0; i < slugs.length; i++) {
      for (let j = i + 1; j < slugs.length; j++) {
        matchups.push({ locale, matchup: `${slugs[i]}-vs-${slugs[j]}` });
      }
    }
  }
  return matchups;
}

export async function generateMetadata({
  params: { locale, matchup },
}: {
  params: { locale: string; matchup: string };
}): Promise<Metadata> {
  const parsed = parseMatchup(matchup);
  if (!parsed) return { title: "404" };
  const [slugA, slugB] = parsed;
  const a = getEliteUnit(slugA);
  const b = getEliteUnit(slugB);
  if (!a || !b) return { title: "404" };
  const t = await getTranslations({ locale, namespace: "comparatorPage" });
  const loc = locale as Locale;
  const aName = loc === "fr" ? a.name : a.nameEn || a.name;
  const bName = loc === "fr" ? b.name : b.nameEn || b.name;
  return {
    title: t("matchupTitle", { a: aName, b: bName }),
    description: t("matchupDescription", { a: aName, b: bName }),
    alternates: {
      canonical: `/${locale}/great-conqueror-rome/comparateur/unites/${matchup}`,
      languages: {
        fr: `/fr/great-conqueror-rome/comparateur/unites/${matchup}`,
        en: `/en/great-conqueror-rome/comparator/units/${matchup}`,
        de: `/de/great-conqueror-rome/comparator/units/${matchup}`,
        "x-default": `/fr/great-conqueror-rome/comparateur/unites/${matchup}`,
      },
    },
    openGraph: {
      title: t("matchupTitle", { a: aName, b: bName }),
      description: t("matchupDescription", { a: aName, b: bName }),
      type: "article",
      locale: ogLocale(locale),
      alternateLocale: ogAlternateLocales(locale),
    },
    robots: { index: true, follow: true },
  };
}

export default async function UnitMatchupPage({
  params: { locale, matchup },
}: {
  params: { locale: string; matchup: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  const parsed = parseMatchup(matchup);
  if (!parsed) notFound();
  const [slugA, slugB] = parsed;
  const a = getEliteUnit(slugA);
  const b = getEliteUnit(slugB);
  if (!a || !b) notFound();

  const t = await getTranslations();
  const loc = locale as Locale;
  const aName = loc === "fr" ? a.name : a.nameEn || a.name;
  const bName = loc === "fr" ? b.name : b.nameEn || b.name;

  const rows: ComparableRow[] = [unitToRow(a), unitToRow(b)];

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
      <article className="max-w-[1320px] mx-auto px-6 pb-20">
        <header className="mb-6 mt-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gold2 mb-2">
            {aName} <span className="text-muted mx-2">vs</span> {bName}
          </h1>
          <p className="text-dim text-base max-w-3xl leading-relaxed">
            {t("comparatorPage.matchupDescription", { a: aName, b: bName })}
          </p>
        </header>

        <section className="bg-panel border border-border rounded-lg p-6 mb-6">
          <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
            {t("comparatorPage.statsHeading")}
          </h2>
          <ComparatorTable rows={rows} statLabels={statLabels} />
        </section>

        <section className="bg-panel border border-border rounded-lg p-6 mb-6">
          <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
            {t("comparatorPage.radarHeading")}
          </h2>
          <ComparatorRadar rows={rows} statLabels={statLabels} />
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: `${aName} vs ${bName} — Great Conqueror Rome`,
              about: {
                "@type": "VideoGame",
                name: "Great Conqueror Rome",
                gamePlatform: ["Android", "iOS"],
                publisher: { "@type": "Organization", name: "EasyTech" },
              },
              author: { "@type": "Organization", name: "EasyTech Wiki" },
              inLanguage: locale,
            }),
          }}
        />
      </article>
      <Footer />
    </>
  );
}
