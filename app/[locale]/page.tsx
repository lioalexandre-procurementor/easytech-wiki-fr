import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { VotePodium } from "@/components/VotePodium";
import { GuideCard } from "@/components/GuideCard";
import { UpdateCard } from "@/components/UpdateCard";
import { FaqAccordion } from "@/components/FaqAccordion";
import { GameCardsGrid } from "@/components/GameCardsGrid";
import { CountUp } from "@/components/home/CountUp";
import { HeroPortraits, type HeroPortrait } from "@/components/home/HeroPortraits";
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
import { pageAlternates } from "@/lib/seo-alternates";
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
    // Keyword-rich SERP title (game names front-loaded), decoupled from the
    // visible hero h1. `absolute` bypasses the layout's "%s | EasyTech Wiki"
    // template — the brand suffix would push the long title past truncation
    // for no ranking benefit.
    title: { absolute: `${t("metaTitle")} | EasyTech Wiki` },
    description: t("heroSub"),
    alternates: pageAlternates(locale, { fr: "", en: "", de: "" }),
  };
}

// Hex-grid texture for the hero backdrop (same motif as the elite-unit hero).
const HEX_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='46'%3E%3Cpath d='M20 1 38 12 38 34 20 45 2 34 2 12Z' fill='none' stroke='%23d4a44a' stroke-width='0.5'/%3E%3C/svg%3E\")";

// Iconic WC4 generals for the hero deck — order = visual prominence.
const HERO_PICKS = ["guderian", "patton", "manstein", "nimitz", "rokossovsky"];

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

  // Build the hero portrait deck from real generals that have head art.
  const bySlug = new Map(generals.map((g) => [g.slug, g]));
  const heroPortraits: HeroPortrait[] = HERO_PICKS.map((slug) => {
    const g = bySlug.get(slug);
    const head = g?.image?.head;
    if (!g || !head) return null;
    return { slug, name: g.nameEn ?? g.name, head };
  }).filter((p): p is HeroPortrait => p !== null);

  const totalUnits =
    eliteUnits.length + eliteUnitsGcr.length + eliteUnitsEw6.length;
  const totalGenerals =
    generals.length + generalsGcr.length + generalsEw6.length;

  const stats: { value: number; label: string }[] = [
    { value: totalGenerals, label: t("home.statsGenerals") },
    { value: totalUnits, label: t("home.statsEliteUnits") },
    { value: techCount, label: t("home.statsTechs") },
    { value: voteTotal, label: t("home.statsVotes") },
  ];

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
      era:
        locale === "de" ? "Antike" : locale === "en" ? "Antiquity" : "Antiquité",
      sub: `${eliteUnitsGcr.length} ${t("home.statsEliteUnits")} · ${generalsGcr.length} ${t("home.statsGenerals")}`,
      status: "live" as const,
    },
    {
      key: "ew7",
      slug: "european-war-7",
      name: "European War 7",
      era:
        locale === "de"
          ? "Mittelalter"
          : locale === "en"
          ? "Medieval"
          : "Médiéval",
      sub:
        locale === "de"
          ? "Demnächst"
          : locale === "en"
          ? "Coming soon"
          : "Fiche à venir",
      status: "soon" as const,
    },
  ];

  const features = [
    { icon: "🎯", title: t("home.feature1Title"), desc: t("home.feature1Desc") },
    { icon: "♟", title: t("home.feature2Title"), desc: t("home.feature2Desc") },
    { icon: "⚡", title: t("home.feature3Title"), desc: t("home.feature3Desc") },
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

      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden border-b border-border">
        {/* layered backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "var(--grad-hero)" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.18]"
          style={{ backgroundImage: HEX_BG }}
          aria-hidden="true"
        />
        <div
          className="etw-glow absolute -top-32 -right-24 w-[520px] h-[520px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgb(var(--c-gold) / 0.22) 0%, transparent 65%)",
          }}
          aria-hidden="true"
        />
        {/* fade into page bg at the bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent, rgb(var(--c-bg)))",
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-[1320px] mx-auto px-6 py-14 md:py-20 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div>
            <span className="etw-rise inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold2 border border-gold/30 bg-gold/5 rounded-full px-3 py-1.5">
              {t("home.eyebrow")}
            </span>
            <h1
              className="etw-rise mt-5 text-[2.1rem] leading-[1.08] sm:text-5xl sm:leading-[1.05] font-black tracking-tight text-ink"
              style={{ animationDelay: "0.08s" }}
            >
              {t("home.heroTitleA")}{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--grad-logo)" }}
              >
                {t("home.heroTitleHi")}
              </span>{" "}
              {t("home.heroTitleB")}
            </h1>
            <p
              className="etw-rise mt-5 text-dim text-base sm:text-lg max-w-xl leading-relaxed"
              style={{ animationDelay: "0.16s" }}
            >
              {t("home.heroSub")}
            </p>
            <div
              className="etw-rise mt-7 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "0.24s" }}
            >
              <Link
                href="/world-conqueror-4"
                className="etw-cta inline-flex items-center gap-2 bg-gold text-bg px-6 py-3 rounded-lg font-bold text-sm no-underline"
              >
                {t("home.cta")}
              </Link>
              <Link
                href="/world-conqueror-4/tier-list"
                className="inline-flex items-center gap-2 border border-border hover:border-gold text-ink hover:text-gold2 px-6 py-3 rounded-lg font-semibold text-sm no-underline transition-colors"
              >
                {t("home.heroCtaSecondary")} →
              </Link>
            </div>
            <p
              className="etw-rise mt-6 text-muted text-xs font-medium tracking-wide flex items-center gap-2"
              style={{ animationDelay: "0.32s" }}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-ok" />
              {t("home.trustLine")}
            </p>
          </div>

          {/* portrait deck — desktop only */}
          <div
            className="etw-rise hidden lg:block"
            style={{ animationDelay: "0.2s" }}
          >
            <HeroPortraits portraits={heroPortraits} />
          </div>
        </div>
      </section>

      <main className="max-w-[1320px] mx-auto px-6">
        {/* ===================== STAT BAND ===================== */}
        <section
          className="etw-rise relative z-10 -mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 mb-14"
          aria-label={t("home.whyHeading")}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-panel border border-border rounded-xl p-5 stat-block shadow-panel"
            >
              <div className="text-gold2 font-black text-3xl leading-none tabular-nums">
                <CountUp value={s.value} />
                {s.value > 0 && s.label === t("home.statsGenerals") ? "+" : ""}
              </div>
              <div className="text-muted text-[11px] font-semibold uppercase tracking-widest mt-2.5">
                {s.label}
              </div>
            </div>
          ))}
        </section>

        {/* ===================== GAMES ===================== */}
        <section className="mb-16">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-extrabold text-ink">
                {t("home.gamesPickHeading")}
              </h2>
              <p className="text-dim text-sm mt-1">{t("home.gamesPickSub")}</p>
            </div>
          </div>
          <GameCardsGrid
            games={gameCardsData}
            enterLabel={t("home.enterCta")}
            soonLabel={t("home.soon")}
          />
        </section>

        {/* ===================== WHY / FEATURES ===================== */}
        <section className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-extrabold text-ink">
              {t("home.whyHeading")}
            </h2>
            <p className="text-dim text-sm mt-2">{t("home.whySub")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="etw-lift bg-panel border border-border rounded-xl p-6"
              >
                <div
                  className="w-12 h-12 rounded-xl grid place-items-center text-2xl mb-4 border border-gold/30"
                  style={{
                    background:
                      "linear-gradient(135deg, rgb(var(--c-gold) / 0.15), rgb(var(--c-accent) / 0.08))",
                  }}
                  aria-hidden="true"
                >
                  {f.icon}
                </div>
                <h3 className="text-gold2 font-bold text-base mb-1.5">
                  {f.title}
                </h3>
                <p className="text-dim text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <hr className="etw-rule mb-16" />

        {/* ===================== COMMUNITY VOTE ===================== */}
        <VotePodium
          counts={voteCounts}
          total={voteTotal}
          generals={generals}
          locale={locale}
          heading={t("home.podiumHeading")}
          voteCta={t("home.podiumVoteCta")}
        />

        {/* ===================== GUIDES ===================== */}
        {guides.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-extrabold text-ink">
                {t("home.guidesHeading")}
              </h2>
              <Link
                href="/world-conqueror-4/guides"
                className="text-gold2 text-sm font-semibold no-underline hover:underline"
              >
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

        {/* ===================== UPDATES ===================== */}
        {updates.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-extrabold text-ink">
                {t("home.updatesHeading")}
              </h2>
              <Link
                href="/world-conqueror-4/mises-a-jour"
                className="text-gold2 text-sm font-semibold no-underline hover:underline"
              >
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

        {/* ===================== FAQ ===================== */}
        <FaqAccordion items={faqItems} heading={t("home.faqHeading")} />

        {/* ===================== CTA BAND ===================== */}
        <section className="my-16">
          <div
            className="relative overflow-hidden rounded-2xl border border-gold/30 px-8 py-12 text-center"
            style={{
              background:
                "linear-gradient(135deg, rgb(var(--c-gold) / 0.14) 0%, rgb(var(--c-accent) / 0.10) 100%), rgb(var(--c-panel))",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.15]"
              style={{ backgroundImage: HEX_BG }}
              aria-hidden="true"
            />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-black text-ink max-w-2xl mx-auto">
                {t("home.ctaBandTitle")}
              </h2>
              <p className="text-dim text-sm sm:text-base mt-3 max-w-xl mx-auto">
                {t("home.ctaBandText")}
              </p>
              <Link
                href="/world-conqueror-4/generaux"
                className="etw-cta inline-flex items-center gap-2 mt-7 bg-gold text-bg px-7 py-3.5 rounded-lg font-bold text-sm no-underline"
              >
                {t("home.ctaBandButton")} →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
