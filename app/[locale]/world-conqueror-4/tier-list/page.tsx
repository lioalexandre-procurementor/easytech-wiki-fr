import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { TierList, type TierEntry } from "@/components/TierList";
import { getAllGenerals } from "@/lib/units";
import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { locales } from "@/src/i18n/config";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const byLocale: Record<string, { t: string; d: string }> = {
    fr: {
      t: "Tier List Généraux World Conqueror 4 (S/A/B/C) | EasyTech Wiki",
      d: "Classement S/A/B/C des généraux de World Conqueror 4 — tous les généraux notés selon leur puissance réelle en campagne et conquête.",
    },
    en: {
      t: "World Conqueror 4 Generals Tier List (S/A/B/C) | EasyTech Wiki",
      d: "S/A/B/C tier ranking of every World Conqueror 4 general — sorted by real performance in campaign and conquest modes.",
    },
    de: {
      t: "World Conqueror 4 Generäle Tier List (S/A/B/C) | EasyTech Wiki",
      d: "S/A/B/C-Rangliste aller World Conqueror 4 Generäle — bewertet nach realer Kampagnen- und Eroberungsleistung.",
    },
  };
  const m = byLocale[locale] ?? byLocale.en;
  return { title: m.t, description: m.d };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function TierListPage({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations();
  const generals = getAllGenerals();
  const entries: TierEntry[] = generals.map((g) => ({
    slug: g.slug,
    name: g.name,
    rank: (g.rank as string) ?? "C",
    country: g.country ?? null,
    portrait: g.image?.head ?? null,
  }));

  const titleByLocale: Record<string, string> = {
    fr: "Tier List — Généraux WC4",
    en: "Tier List — WC4 Generals",
    de: "Tier List — WC4 Generäle",
  };
  const leadByLocale: Record<string, string> = {
    fr: "Classement S/A/B/C de tous les généraux. Basé sur leur puissance réelle, rareté et polyvalence.",
    en: "S/A/B/C ranking of every general. Based on real power, rarity and versatility.",
    de: "S/A/B/C-Rangliste aller Generäle. Basierend auf realer Stärke, Seltenheit und Vielseitigkeit.",
  };

  const breadcrumbs = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.wc4"), href: "/world-conqueror-4" },
    { label: titleByLocale[params.locale] ?? titleByLocale.en },
  ];

  return (
    <>
      <TopBar />
      <BreadcrumbNav items={breadcrumbs} locale={params.locale} />
      <div className="max-w-[1320px] mx-auto px-6 pb-20">
        <main>
          <section className="hero-surface border border-border rounded-lg p-9 mb-6 shadow-panel">
            <h1 className="text-4xl text-gold2 font-extrabold mb-2">
              {titleByLocale[params.locale] ?? titleByLocale.en}
            </h1>
            <p className="text-dim text-base max-w-3xl">
              {leadByLocale[params.locale] ?? leadByLocale.en}
            </p>
          </section>

          <TierList
            entries={entries}
            hrefFor={(slug) => `/world-conqueror-4/generaux/${slug}`}
          />
        </main>
      </div>
      <Footer />
    </>
  );
}
