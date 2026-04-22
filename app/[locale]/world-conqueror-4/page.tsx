import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { UnitCard } from "@/components/UnitCard";
import { AdSlot } from "@/components/AdSlot";
import BestGeneralVote from "@/components/BestGeneralVote";
import { getAllEliteUnits, getUnitsByFaction, getAllGenerals, getCategoryMeta } from "@/lib/units";
import { BEST_GENERAL_PLACEHOLDER } from "@/lib/editorial-picks";
import type { Category } from "@/lib/types";
import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { locales } from "@/src/i18n/config";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const titleByLocale: Record<string, string> = {
    fr: "World Conqueror 4 — Wiki FR | EasyTech Wiki",
    en: "World Conqueror 4 — Wiki | EasyTech Wiki",
    de: "World Conqueror 4 — Wiki DE | EasyTech Wiki",
  };
  const descByLocale: Record<string, string> = {
    fr: "Le guide francophone le plus complet de World Conqueror 4 : unités d'élite, faction Empire du Scorpion, généraux, technologies, scénarios et stratégies.",
    en: "The most complete English-language guide to World Conqueror 4: elite units, Scorpion Empire faction, generals, technologies, scenarios and strategies.",
    de: "Der umfassendste deutschsprachige Guide zu World Conqueror 4: Elite-Einheiten, Skorpion-Imperium, Generäle, Technologien, Szenarien und Strategien.",
  };
  return {
    title: titleByLocale[locale] ?? titleByLocale.en,
    description: descByLocale[locale] ?? descByLocale.en,
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function WC4Hub({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations();
  void getAllEliteUnits();
  const standardUnits = getUnitsByFaction("standard");
  const scorpionUnits = getUnitsByFaction("scorpion");
  const generals = getAllGenerals();
  const top = standardUnits.slice(0, 6);
  const CAT = getCategoryMeta(params.locale);
  const counts = (Object.keys(CAT) as Category[])
    .map(k => ({ key: k, count: standardUnits.filter(u => u.category === k).length, ...CAT[k] }));

  return (
    <>
      <TopBar/>
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">{t("nav.home")}</Link>{" "}
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <span>{t("nav.wc4")}</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20">
        <main>
          <section className="hero-surface border border-border rounded-lg p-9 mb-6 relative overflow-hidden shadow-panel">
            <h1 className="text-4xl text-gold2 font-extrabold mb-2">{t("wc4Hub.h1")}</h1>
            <p className="text-dim text-base max-w-3xl mb-5">
              {t("wc4Hub.tagline")}
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/world-conqueror-4/unites-elite"
                className="inline-block bg-gold text-bg px-5 py-2.5 rounded-md font-bold text-sm no-underline">
                {t("wc4Hub.ctaExplore")}
              </Link>
              <Link href="/world-conqueror-4/guides"
                className="inline-block bg-transparent text-gold2 px-5 py-2.5 rounded-md font-bold text-sm no-underline border border-gold">
                {t("wc4Hub.ctaBeginner")}
              </Link>
            </div>
            <div className="flex flex-wrap gap-7 mt-5">
              <Stat n={standardUnits.length} l={t("wc4Hub.statEliteUnits")}/>
              <Stat n={scorpionUnits.length} l={t("wc4Hub.statScorpionUnits")}/>
              <Stat n={generals.length} l={t("wc4Hub.statGenerals")}/>
              <Stat n={t("wc4Hub.statMaxLevelsValue")} l={t("wc4Hub.statMaxLevels")}/>
            </div>
            <div className="mt-5 p-3 bg-amber-500/10 border border-amber-500/30 rounded text-amber-200 text-xs">
              ⚠️ <strong>{t("wc4Hub.underConstruction")}</strong> — {t("wc4Hub.underConstructionNote")}
            </div>
          </section>

          <section
            aria-label={t("wc4Hub.voteBoxTitle")}
            className="bg-panel border border-gold/40 rounded-lg px-4 py-3 md:px-5 md:py-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            style={{ background: "linear-gradient(135deg, rgba(212,164,74,0.08) 0%, rgba(200,55,45,0.05) 100%), #1a2230" }}
          >
            <div className="min-w-0">
              <h2 className="text-gold2 font-bold text-base md:text-lg leading-tight">
                {t("wc4Hub.voteBoxTitle")}
              </h2>
              <p className="text-dim text-xs md:text-sm mt-0.5">
                {t("wc4Hub.voteBoxDesc")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link
                href={"/leaderboards?game=wc4&tab=generals" as any}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-gold text-bg text-xs md:text-sm font-bold no-underline hover:bg-gold2 transition-colors"
              >
                👨‍✈️ {t("wc4Hub.voteBoxGeneral")}
              </Link>
              <Link
                href={"/leaderboards?game=wc4&tab=units" as any}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-gold text-gold2 text-xs md:text-sm font-bold no-underline hover:bg-gold/10 transition-colors"
              >
                🏅 {t("wc4Hub.voteBoxUnit")}
              </Link>
            </div>
          </section>

          <h2 className="text-xl mb-4 mt-8">{t("wc4Hub.exploreByCategory")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {counts.map(c => (
              <Link key={c.key} href={`/world-conqueror-4/unites-elite#${c.key}` as any}
                className="bg-panel border border-border rounded-lg p-4 hover:border-gold transition-colors no-underline block">
                <div className="text-2xl mb-2">{c.icon}</div>
                <h3 className="text-gold2 font-bold text-base mb-1">{c.plural}</h3>
                <div className="text-muted text-[11px] uppercase tracking-widest">{c.count} {t("wc4Hub.unitsCountSuffix")}</div>
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <BestGeneralVote
              game="wc4"
              generals={generals.map((g) => ({
                slug: g.slug,
                name: g.name,
                nameEn: g.nameEn,
                rank: g.rank ?? null,
                country: g.country ?? null,
                portrait: g.image?.head ?? null,
              }))}
              placeholderTop5={BEST_GENERAL_PLACEHOLDER.wc4}
              placeholderThreshold={100}
            />
          </div>

          <AdSlot name="listingBottom" label={t("ui.adSlot")} className="my-6" />

          <h2 className="text-xl mb-4 mt-8">{t("wc4Hub.mostViewed")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {top.map(u => <UnitCard key={u.slug} unit={u} locale={params.locale}/>)}
          </div>
        </main>
      </div>

      <Footer/>
    </>
  );
}

function Stat({ n, l }: { n: number | string; l: string }) {
  return (
    <div className="border-l-4 border-gold pl-3">
      <div className="text-2xl text-gold2 font-extrabold">{n}</div>
      <div className="text-[11px] text-muted uppercase tracking-widest">{l}</div>
    </div>
  );
}
