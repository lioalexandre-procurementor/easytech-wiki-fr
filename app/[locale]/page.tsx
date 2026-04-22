import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { VotePodium } from "@/components/VotePodium";
import { GuideCard } from "@/components/GuideCard";
import { UpdateCard } from "@/components/UpdateCard";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { GAMES } from "@/lib/games";
import { getAllGuides } from "@/lib/guides";
import { getAllUpdates } from "@/lib/updates";
import { getAllEliteUnits, getAllGenerals } from "@/lib/units";
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

  const availableGames = GAMES.filter((g) => g.available && g.slug !== "world-conqueror-4");
  const soonGames = GAMES.filter((g) => !g.available);

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
          {(availableGames.length > 0 || soonGames.length > 0) && (
            <div className="border-t border-white/7 pt-4">
              <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-3">
                {t("home.otherGames")}
              </p>
              <div className="flex flex-wrap gap-2">
                {availableGames.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/${g.slug}` as any}
                    className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-md px-3 py-2 no-underline hover:border-gold/30 group"
                  >
                    <div className="text-left">
                      <div className="text-dim text-xs font-semibold group-hover:text-gold2">{g.name}</div>
                      <div className="text-muted text-[10px]">{g.era}</div>
                    </div>
                    <span className="text-muted text-xs ml-1">→</span>
                  </Link>
                ))}
                {soonGames.map((g) => (
                  <div
                    key={g.slug}
                    className="flex items-center gap-2 bg-white/2 border border-white/5 rounded-md px-3 py-2 opacity-40"
                  >
                    <div className="text-left">
                      <div className="text-muted text-xs font-semibold">{g.name}</div>
                      <div className="text-muted text-[10px]">{t("home.soon")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { value: eliteUnits.length, label: t("home.statsEliteUnits") },
            { value: generals.length, label: t("home.statsGenerals") },
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

        <section className="mb-6">
          <h2 className="text-xl mb-4">{t("home.gamesHeading")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {GAMES.map((g) => (
              <div key={g.slug} className="bg-panel border border-border rounded-lg p-4">
                <span
                  className="text-xs uppercase tracking-widest font-bold"
                  style={{ color: g.available ? "#4a9d5f" : "#6b7685" }}
                >
                  {g.available ? t("home.available") : t("home.soon")}
                </span>
                <h3 className="text-gold2 font-bold mb-1 mt-2">{g.name}</h3>
                <p className="text-dim text-sm mb-3">{g.tagline}</p>
                <div className="text-muted text-[11px] uppercase tracking-widest">{g.era}</div>
                {g.available && (
                  <Link href={`/${g.slug}` as any} className="text-gold2 text-sm font-semibold mt-3 inline-block no-underline hover:underline">
                    {t("home.explore")}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        <FaqAccordion items={faqItems} heading={t("home.faqHeading")} />

      </main>
      <Footer />
    </>
  );
}
