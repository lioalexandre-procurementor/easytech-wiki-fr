import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import BestGeneralsGrid from "@/components/BestGeneralsGrid";
import UnitsByCategory, {
  type GeneralDir,
  type UnitsByCategoryLabels,
  type CategoryMetaItem,
} from "@/components/leaderboards/UnitsByCategory";
import type { UnitVoteCandidate } from "@/components/UnitVoteModal";
import {
  getAllGenerals as getAllGeneralsWc4,
  getCategoryMeta as getCategoryMetaWc4,
  getAllEliteUnits as getAllEliteUnitsWc4,
  COUNTRY_FLAGS,
} from "@/lib/units";
import {
  getAllGenerals as getAllGeneralsGcr,
  getCategoryMeta as getCategoryMetaGcr,
  getAllEliteUnits as getAllEliteUnitsGcr,
} from "@/lib/gcr";
import {
  getAllGenerals as getAllGeneralsEw6,
  getCategoryMeta as getCategoryMetaEw6,
  getAllEliteUnits as getAllEliteUnitsEw6,
} from "@/lib/ew6";
import {
  loadGeneralsLeaderboard,
  loadUnitsLeaderboard,
  UNITS_LEADERBOARD_THRESHOLD,
  type GeneralsRanking,
  type UnitsRanking,
} from "@/lib/leaderboards";
import { getEditorialPick } from "@/lib/editorial-picks";
import { GAMES } from "@/lib/games";
import { getEligibleGeneralsForUnit } from "@/lib/unit-general-vote";
import { parseGame, type Game, type Category, type UnitData } from "@/lib/types";
import { locales, type Locale } from "@/src/i18n/config";
import { ogLocale } from "@/src/i18n/og-locale";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 30;

const BEST_GENERAL_THRESHOLD = 100;

type TabKey = "generals" | "units";

function parseTab(raw: unknown): TabKey {
  if (raw === "units") return "units";
  return "generals";
}

function parseGameParam(raw: unknown): Game {
  return parseGame(raw) ?? "wc4";
}

function getCategoryMetaForGame(game: Game, locale: string) {
  if (game === "wc4") return getCategoryMetaWc4(locale);
  if (game === "gcr") return getCategoryMetaGcr(locale);
  return getCategoryMetaEw6(locale);
}

function getAllGeneralsForGame(game: Game) {
  if (game === "wc4") return getAllGeneralsWc4();
  if (game === "gcr") return getAllGeneralsGcr();
  return getAllGeneralsEw6();
}

function getAllEliteUnitsForGame(game: Game): UnitData[] {
  if (game === "wc4") return getAllEliteUnitsWc4();
  if (game === "gcr") return getAllEliteUnitsGcr();
  return getAllEliteUnitsEw6();
}

function getUnitCategoryOrder(game: Game): Category[] {
  const slug =
    game === "wc4"
      ? "world-conqueror-4"
      : game === "gcr"
      ? "great-conqueror-rome"
      : "european-war-6";
  const meta = GAMES.find((g) => g.slug === slug);
  return meta?.unitCategories ?? [];
}

/** Canonical URL segment for the leaderboards page per locale. The page
 *  is accessible under three different slugs — keeping the canonical in
 *  sync with the real URL structure is a ranking-hygiene issue. */
function leaderboardsRouteSlug(locale: string): string {
  if (locale === "fr") return "classements";
  if (locale === "de") return "bestenlisten";
  return "leaderboards";
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "leaderboardsPage" });
  const game = parseGameParam(searchParams.game);
  const tab = parseTab(searchParams.tab);
  const suffix =
    game === "gcr" ? " · GCR" : game === "ew6" ? " · EW6" : " · WC4";
  const slug = leaderboardsRouteSlug(locale);
  return {
    title: t("seoTitle") + suffix,
    description: t("seoDescription"),
    alternates: {
      canonical: `/${locale}/${slug}?game=${game}&tab=${tab}`,
      languages: {
        fr: `/fr/classements?game=${game}&tab=${tab}`,
        en: `/en/leaderboards?game=${game}&tab=${tab}`,
        de: `/de/bestenlisten?game=${game}&tab=${tab}`,
        "x-default": `/fr/classements?game=${game}&tab=${tab}`,
      },
    },
    openGraph: {
      title: t("seoTitle") + suffix,
      description: t("seoDescription"),
      type: "website",
      locale: ogLocale(locale),
    },
    robots: { index: true, follow: true },
  };
}

export default async function LeaderboardsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  const t = await getTranslations();
  const loc = locale as Locale;
  const game = parseGameParam(searchParams.game);
  const tab = parseTab(searchParams.tab);

  const [generalsRanking, unitsRanking] = await Promise.all([
    tab === "generals" ? loadGeneralsLeaderboard(game) : Promise.resolve(null),
    tab === "units"
      ? loadUnitsLeaderboard(game, UNITS_LEADERBOARD_THRESHOLD)
      : Promise.resolve(null),
  ]);

  const allGenerals = getAllGeneralsForGame(game);
  const CAT = getCategoryMetaForGame(game, locale);

  return (
    <>
      <TopBar />
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pb-20">
        {/* Breadcrumb */}
        <nav className="mt-4 mb-5">
          <Link
            href={"/" as any}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-panel hover:border-gold hover:bg-gold/5 text-dim hover:text-gold2 text-sm font-semibold transition-colors no-underline"
          >
            ← {t("nav.home")}
          </Link>
        </nav>

        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gold2 mb-2 leading-tight">
            🏆 {t("leaderboardsPage.h1")}
          </h1>
          <p className="text-dim text-sm md:text-base max-w-3xl leading-relaxed">
            {t("leaderboardsPage.intro")}
          </p>
        </header>

        {/* Game switcher */}
        <nav
          role="tablist"
          aria-label={t("leaderboardsPage.gameSwitcher.label")}
          className="flex flex-wrap gap-2 mb-4"
        >
          <GameChip
            game="wc4"
            active={game === "wc4"}
            label={t("leaderboardsPage.gameSwitcher.wc4")}
            locale={locale}
            tab={tab}
          />
          <GameChip
            game="gcr"
            active={game === "gcr"}
            label={t("leaderboardsPage.gameSwitcher.gcr")}
            locale={locale}
            tab={tab}
          />
          <GameChip
            game="ew6"
            active={game === "ew6"}
            label={t("leaderboardsPage.gameSwitcher.ew6")}
            locale={locale}
            tab={tab}
          />
        </nav>

        {/* Tabs */}
        <nav
          role="tablist"
          aria-label="Leaderboards"
          className="flex flex-wrap gap-1.5 md:gap-2 mb-6 border-b border-border pb-2"
        >
          <TabLink
            tab="generals"
            active={tab === "generals"}
            label={t("leaderboardsPage.tabGenerals")}
            locale={locale}
            game={game}
          />
          <TabLink
            tab="units"
            active={tab === "units"}
            label={t("leaderboardsPage.tabUnits")}
            locale={locale}
            game={game}
          />
        </nav>

        <section className="bg-panel border border-border rounded-lg p-4 md:p-6">
          {tab === "generals" && generalsRanking && (
            <GeneralsTab
              game={game}
              ranking={generalsRanking}
              allGenerals={allGenerals}
              threshold={BEST_GENERAL_THRESHOLD}
              desc={t("leaderboardsPage.tabGeneralsDesc")}
            />
          )}
          {tab === "units" && unitsRanking && (
            <UnitsTabServer
              game={game}
              locale={loc}
              data={unitsRanking}
              threshold={UNITS_LEADERBOARD_THRESHOLD}
              categoryMeta={CAT}
              desc={t("leaderboardsPage.tabUnitsDesc", {
                threshold: UNITS_LEADERBOARD_THRESHOLD,
              })}
              empty={t("leaderboardsPage.emptyUnits")}
              labels={{
                voteCta: t("leaderboardsPage.voteForThisUnitShort"),
                ourPick: t("leaderboardsPage.ourPick"),
                communityPick: t("leaderboardsPage.communityPick"),
                voteToReveal: t("leaderboardsPage.voteToReveal"),
                thanksVoted: t("leaderboardsPage.rowThanksVoted"),
                progressBelow: (count, threshold) =>
                  t("leaderboardsPage.progressBelow", { count, threshold }),
                progressAbove: (count) =>
                  t("leaderboardsPage.progressAbove", { count }),
                boxAria: (name) =>
                  t("leaderboardsPage.boxAria", { name }),
                emptyBoxAria: t("leaderboardsPage.emptyBoxAria"),
                emptyCategory: t("leaderboardsPage.emptyUnits"),
                sectionHeading: (icon, plural, count) =>
                  t("leaderboardsPage.sectionHeading", {
                    icon,
                    plural,
                    count,
                    suffix: t("leaderboardsPage.unitsCountSuffix"),
                  }),
              }}
            />
          )}
        </section>
      </div>
      <Footer />
    </>
  );
}

/** ─── Helpers ─────────────────────────────────────────────────────── */

function GameChip({
  game,
  active,
  label,
  locale,
  tab,
}: {
  game: Game;
  active: boolean;
  label: string;
  locale: string;
  tab: TabKey;
}) {
  const slug = leaderboardsRouteSlug(locale);
  return (
    <a
      href={`/${locale}/${slug}?game=${game}&tab=${tab}`}
      role="tab"
      aria-selected={active}
      className={
        active
          ? "inline-flex items-center px-3 py-1.5 rounded-full border border-gold bg-gold/20 text-gold2 font-bold text-xs uppercase tracking-widest no-underline"
          : "inline-flex items-center px-3 py-1.5 rounded-full border border-border text-dim hover:text-gold2 hover:border-gold/40 text-xs font-semibold uppercase tracking-widest no-underline"
      }
    >
      {label}
    </a>
  );
}

function TabLink({
  tab,
  active,
  label,
  locale,
  game,
}: {
  tab: TabKey;
  active: boolean;
  label: string;
  locale: string;
  game: Game;
}) {
  const slug = leaderboardsRouteSlug(locale);
  return (
    <a
      href={`/${locale}/${slug}?game=${game}&tab=${tab}`}
      role="tab"
      aria-selected={active}
      className={
        active
          ? "inline-flex items-center gap-1 px-3.5 py-2 rounded-md bg-gold/20 border border-gold text-gold2 font-bold text-xs md:text-sm uppercase tracking-widest no-underline"
          : "inline-flex items-center gap-1 px-3.5 py-2 rounded-md border border-border text-dim hover:text-gold2 hover:border-gold/40 hover:bg-gold/5 text-xs md:text-sm font-semibold uppercase tracking-widest no-underline transition-colors"
      }
    >
      {label}
    </a>
  );
}

function GeneralsTab({
  game,
  ranking,
  allGenerals,
  threshold,
  desc,
}: {
  game: Game;
  ranking: GeneralsRanking;
  allGenerals: ReturnType<typeof getAllGeneralsWc4>;
  threshold: number;
  desc: string;
}) {
  const initialCounts: Record<string, number> = {};
  for (const r of ranking.rows) initialCounts[r.slug] = r.votes;
  const generalOptions = allGenerals.map((g) => ({
    slug: g.slug,
    name: g.name,
    nameEn: g.nameEn,
    portrait: g.image?.head ?? null,
    rank: g.rank ?? null,
    country: g.country ?? null,
  }));
  return (
    <>
      <p className="text-dim text-sm mb-4">{desc}</p>
      <BestGeneralsGrid
        game={game}
        generals={generalOptions}
        threshold={threshold}
        initialCounts={initialCounts}
        initialTotal={ranking.total}
      />
    </>
  );
}

/**
 * Server-side assembly for the units tab. We do the heavy lifting
 * (eligibility lookup per unit, editorial pick resolution, flag lookup)
 * once on the server and hand the client component plain data structures.
 */
function UnitsTabServer({
  game,
  locale,
  data,
  threshold,
  categoryMeta,
  desc,
  empty,
  labels,
}: {
  game: Game;
  locale: Locale;
  data: UnitsRanking;
  threshold: number;
  categoryMeta: Record<string, CategoryMetaItem>;
  desc: string;
  empty: string;
  labels: UnitsByCategoryLabels;
}) {
  if (data.rows.length === 0) {
    return (
      <>
        <p className="text-dim text-sm mb-4">{desc}</p>
        <p className="text-muted text-sm italic text-center py-10">{empty}</p>
      </>
    );
  }

  const allGenerals = getAllGeneralsForGame(game);
  const generalsDir: Record<string, GeneralDir> = {};
  for (const g of allGenerals) {
    generalsDir[g.slug] = {
      slug: g.slug,
      name: g.name,
      nameEn: g.nameEn,
      portrait: g.image?.head ?? null,
      rank: g.rank ?? null,
      country: g.country ?? null,
      category: g.category,
    };
  }

  // Elegibility + editorial + flag lookups, computed once per unit.
  const eligibleByUnit: Record<string, UnitVoteCandidate[]> = {};
  const editorialBySlug: Record<string, string | null> = {};
  const flagBySlug: Record<string, string> = {};

  const allUnits = getAllEliteUnitsForGame(game);
  const unitBySlug = new Map(allUnits.map((u) => [u.slug, u]));

  for (const r of data.rows) {
    // Eligibility → UnitVoteCandidate[]. Ordered by tier already.
    eligibleByUnit[r.unitSlug] = getEligibleGeneralsForUnit(game, r.unitSlug).map(
      (g) => ({
        slug: g.slug,
        name: g.name,
        nameEn: g.nameEn,
        rank: g.rank ?? null,
        country: g.country ?? null,
        portrait: g.image?.head ?? null,
      })
    );
    editorialBySlug[r.unitSlug] = getEditorialPick(game, r.unitSlug)?.primary ?? null;
    const u = unitBySlug.get(r.unitSlug);
    const cc = u?.country ?? r.unitCountry ?? "";
    flagBySlug[r.unitSlug] = cc && COUNTRY_FLAGS[cc] ? COUNTRY_FLAGS[cc] : "";
  }

  return (
    <>
      <p className="text-dim text-sm mb-4">{desc}</p>
      <UnitsByCategory
        game={game}
        locale={locale}
        data={data}
        threshold={threshold}
        categoryOrder={getUnitCategoryOrder(game)}
        categoryMeta={categoryMeta}
        generalsDir={generalsDir}
        eligibleByUnit={eligibleByUnit}
        editorialBySlug={editorialBySlug}
        flagBySlug={flagBySlug}
        labels={labels}
      />
    </>
  );
}
