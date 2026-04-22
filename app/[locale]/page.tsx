import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { VotePodium } from "@/components/VotePodium";
import { GuideCard } from "@/components/GuideCard";
import { UpdateCard } from "@/components/UpdateCard";
import { FaqAccordion } from "@/components/FaqAccordion";
import { GameCardsGrid } from "@/components/GameCardsGrid";
import { JsonLd } from "@/components/JsonLd";
import { getAllGuides } from "@/lib/guides";
import { getAllUpdates } from "@/lib/updates";
import { getAllEliteUnits, getAllGenerals } from "@/lib/units";
import {
  getAllEliteUnits as getAllEliteUnitsGcr,
  getAllGenerals as getAllGeneralsGcr,
} from "@/lib/gcr";
import {
  getAllEliteUnits as getAllEliteUnitsEw6,
  getAllGenerals as getAllGeneralsEw6,
} from "@/lib/ew6";
import { getAllTechSlugs } from "@/lib/tech";
import { getRedis, bestGeneralVoteKey } from "@/lib/redis";
import { locales } from "@/src/i18n/config";
import type { Metadata } from "next";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: t("h1"),
    description: t("lede"),
  };
}

export default async function Home({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations();
  const locale = params.locale;

  const guides = getAllGuides().slice(0, 3);
  const updates = getAllUpdates().slice(0, 2);
  const eliteUnits = getAllEliteUnits();
  const generals = getAllGenerals();
  const techCount = getAllTechSlugs().length;

  const eliteUnitsGcr = getAllEliteUnitsGcr();
  const generalsGcr = getAllGeneralsGcr();
  const eliteUnitsEw6 = getAllEliteUnitsEw6();
  const generalsEw6 = getAllGeneralsEw6();

  const redis = getRedis();
  const voteCounts: Record<string, number> = {};
  let voteTotal = 0;
  if (redis) {
    const raw = await redis.hgetall(bestGeneralVoteKey("wc4"));
    if (raw) {
      for (const [k, v] of Object.entries(raw)) {
        const n = Number(v);
        voteCounts[k] = n;
        voteTotal += n;
      }
    }
  }

  const gameCardsData = [
    {
      key: "wc4",
      slug: "world-conqueror-4",
      name: "World Conqueror 4",
      era: "1939 · 1945",
      sub: `${eliteUnits.length} ${t("home.statsEliteUnits")} · ${generals.length} ${t("home.statsGenerals")}`,
      status: "live" as const,
    },
    {
      key: "ew6",
      slug: "european-war-6",
      name: "European War 6",
      era: "1914",
      sub: `${eliteUnitsEw6.length} ${t("home.statsEliteUnits")} · ${generalsEw6.length} ${t("home.statsGenerals")}`,
      status: "live" as const,
    },
    {
      key: "gcr",
      slug: "great-conqueror-rome",
      name: "Great Conqueror: Rome",
      era: locale === "de" ? "Antike" : locale === "en" ? "Antiquity" : "Antiquité",
      sub: `${eliteUnitsGcr.length} ${t("home.statsEliteUnits")} · ${generalsGcr.length} ${t("home.statsGenerals")}`,
      status: "live" as const,
    },
    {
      key: "ew7",
      slug: "european-war-7",
      name: "European War 7",
      era: locale === "de" ? "Mittelalter" : locale === "en" ? "Medieval" : "Médiéval",
      sub: locale === "de" ? "Demnächst" : locale === "en" ? "Coming soon" : "Fiche à venir",
      status: "soon" as const,
    },
  ];

  type FaqItem = { q: string; a: string };
  const faqItems = t.raw("home.faq") as FaqItem[];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <TopBar />
      <JsonLd data={faqSchema} />
      <main className="max-w-[1320px] mx-auto px-6 py-10">

        <section className="hero-surface border border-border rounded-lg p-9 mb-6 relative overflow-hidden shadow-panel">
          <h1 className="text-4xl text-gold2 font-extrabold mb-2">{t("home.h1")}</h1>
          <p className="text-dim text-base max-w-3xl mb-5">{t("home.lede")}</p>
          <Link
            href="/world-conqueror-4"
            className="inline-block bg-gold text-bg px-5 py-2.5 rounded-md font-bold text-sm no-underline mb-4"
          >
            {t("home.cta")}
          </Link>
        </section>

        <GameCardsGrid
          games={gameCardsData}
          enterLabel={t("home.enterCta")}
          soonLabel={t("home.soon")}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { value: eliteUnits.length + eliteUnitsGcr.length + eliteUnitsEw6.length, label: t("home.statsEliteUnits") },
            { value: generals.length + generalsGcr.length + generalsEw6.length, label: t("home.statsGenerals") },
            { value: voteTotal.toLocaleString(), label: t("home.statsVotes") },
            { value: techCount, label: t("home.statsTechs") },
          ].map(({ value, label }) => (
            <div key={label} className="bg-panel border border-border rounded-lg p-4 stat-block">
              <div className="text-gold2 font-extrabold text-2xl leading-none">{value}</div>
              <div className="text-muted text-[11px] font-semibold uppercase tracking-widest mt-2">{label}</div>
            </div>
          ))}
        </div>

        <VotePodium
          counts={voteCounts}
          total={voteTotal}
          generals={generals}
          locale={locale}
          heading={t("home.podiumHeading")}
          voteCta={t("home.podiumVoteCta")}
        />

        {guides.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-dim">{t("home.guidesHeading")}</h2>
              <Link href="/world-conqueror-4/guides" className="text-gold2 text-sm font-semibold no-underline hover:underline">
                {t("home.guidesViewAll")}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {guides.map((guide) => (
                <GuideCard key={guide.slug} guide={guide} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {updates.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-dim">{t("home.updatesHeading")}</h2>
              <Link href="/world-conqueror-4/mises-a-jour" className="text-gold2 text-sm font-semibold no-underline hover:underline">
                {t("home.updatesViewAll")}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {updates.map((update) => (
                <UpdateCard key={update.slug} update={update} locale={locale} />
              ))}
            </div>
          </section>
        )}

        <FaqAccordion items={faqItems} heading={t("home.faqHeading")} />

      </main>
      <Footer />
    </>
  );
}
