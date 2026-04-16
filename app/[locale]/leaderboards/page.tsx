import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import BestGeneralsGrid from "@/components/BestGeneralsGrid";
import { getAllGenerals as getAllGeneralsWc4, getCategoryMeta as getCategoryMetaWc4, COUNTRY_FLAGS } from "@/lib/units";
import { getAllGenerals as getAllGeneralsGcr, getCategoryMeta as getCategoryMetaGcr } from "@/lib/gcr";
import { getAllGenerals as getAllGeneralsEw6, getCategoryMeta as getCategoryMetaEw6 } from "@/lib/ew6";
import {
  loadGeneralsLeaderboard,
  loadUnitsLeaderboard,
  UNITS_LEADERBOARD_THRESHOLD,
  type GeneralsRanking,
  type UnitsRanking,
} from "@/lib/leaderboards";
import { getEditorialPick } from "@/lib/editorial-picks";
import { parseGame, type Game } from "@/lib/types";
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

function parseCat(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw) return null;
  return raw;
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

function generalsHubPath(game: Game) {
  if (game === "wc4") return "/world-conqueror-4/generaux";
  if (game === "gcr") return "/great-conqueror-rome/generaux";
  return "/european-war-6/generaux";
}

function unitHubPath(game: Game) {
  if (game === "wc4") return "/world-conqueror-4/unites-elite";
  if (game === "gcr") return "/great-conqueror-rome/unites-elite";
  return "/european-war-6/unites-elite";
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
  return {
    title: t("seoTitle") + suffix,
    description: t("seoDescription"),
    alternates: {
      canonical: `/${locale}/leaderboards?game=${game}&tab=${tab}`,
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
  const cat = parseCat(searchParams.cat);

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
            <UnitsTab
              game={game}
              data={unitsRanking}
              locale={loc}
              cat={cat}
              desc={t("leaderboardsPage.tabUnitsDesc", {
                threshold: UNITS_LEADERBOARD_THRESHOLD,
              })}
              empty={t("leaderboardsPage.emptyUnits")}
              voteCta={t("leaderboardsPage.voteOnUnitPage")}
              ourPick={t("leaderboardsPage.ourPick")}
              communityPick={t("leaderboardsPage.communityPick")}
              voteToReveal={t("leaderboardsPage.voteToReveal")}
              filterAll={t("leaderboardsPage.filterChips.all")}
              catLabels={CAT}
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
  return (
    <a
      href={`/${locale}/leaderboards?game=${game}&tab=${tab}`}
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
  return (
    <a
      href={`/${locale}/leaderboards?game=${game}&tab=${tab}`}
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

function CategoryChips({
  categories,
  active,
  locale,
  game,
  filterAll,
}: {
  categories: Array<{ slug: string; label: string; icon: string }>;
  active: string | null;
  locale: string;
  game: Game;
  filterAll: string;
}) {
  return (
    <nav aria-label="Filter units" className="flex flex-wrap gap-1.5 mb-4">
      <a
        href={`/${locale}/leaderboards?game=${game}&tab=units`}
        aria-current={active === null ? "page" : undefined}
        className={
          active === null
            ? "inline-flex items-center px-3 py-1.5 rounded-full border border-gold bg-gold/20 text-gold2 font-bold text-xs uppercase tracking-widest no-underline"
            : "inline-flex items-center px-3 py-1.5 rounded-full border border-border text-dim hover:text-gold2 hover:border-gold/40 text-xs font-semibold uppercase tracking-widest no-underline"
        }
      >
        {filterAll}
      </a>
      {categories.map((c) => (
        <a
          key={c.slug}
          href={`/${locale}/leaderboards?game=${game}&tab=units&cat=${c.slug}`}
          aria-current={active === c.slug ? "page" : undefined}
          className={
            active === c.slug
              ? "inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gold bg-gold/20 text-gold2 font-bold text-xs uppercase tracking-widest no-underline"
              : "inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-dim hover:text-gold2 hover:border-gold/40 text-xs font-semibold uppercase tracking-widest no-underline"
          }
        >
          <span aria-hidden="true">{c.icon}</span>
          {c.label}
        </a>
      ))}
    </nav>
  );
}

function UnitsTab({
  game,
  data,
  locale,
  cat,
  desc,
  empty,
  voteCta,
  ourPick,
  communityPick,
  voteToReveal,
  filterAll,
  catLabels,
}: {
  game: Game;
  data: UnitsRanking;
  locale: Locale;
  cat: string | null;
  desc: string;
  empty: string;
  voteCta: string;
  ourPick: string;
  communityPick: string;
  voteToReveal: string;
  filterAll: string;
  catLabels: Record<string, { label: string; icon: string; plural: string }>;
}) {
  const categories = Object.entries(catLabels).map(([slug, meta]) => ({
    slug,
    label: meta.plural,
    icon: meta.icon,
  }));
  const rows = cat ? data.rows.filter((r) => r.unitCategory === cat) : data.rows;

  if (rows.length === 0) {
    return (
      <>
        <p className="text-dim text-sm mb-4">{desc}</p>
        <CategoryChips
          categories={categories}
          active={cat}
          locale={locale}
          game={game}
          filterAll={filterAll}
        />
        <p className="text-muted text-sm italic text-center py-10">{empty}</p>
      </>
    );
  }

  const unitHrefBase = unitHubPath(game);
  const generalHrefBase = generalsHubPath(game);

  return (
    <>
      <p className="text-dim text-sm mb-4">{desc}</p>
      <CategoryChips
        categories={categories}
        active={cat}
        locale={locale}
        game={game}
        filterAll={filterAll}
      />

      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((r, i) => {
          const catMeta = catLabels[r.unitCategory as keyof typeof catLabels];
          const editorialSlug = r.reachedThreshold
            ? null
            : getEditorialPick(game, r.unitSlug);

          const unitHref = `${unitHrefBase}/${r.unitSlug}#best-general-vote`;
          const generalHref = (slug: string) => `${generalHrefBase}/${slug}`;

          const slot1Slug = r.reachedThreshold ? r.topGeneralSlug : editorialSlug;
          const slot1Name = r.reachedThreshold
            ? locale === "fr"
              ? r.topGeneralName
              : r.topGeneralNameEn || r.topGeneralName
            : slot1Slug;
          const slot2Slug = r.reachedThreshold ? r.top2GeneralSlug : null;
          const slot3Slug = r.reachedThreshold ? r.top3GeneralSlug : null;
          const slot1Label = r.reachedThreshold ? communityPick : ourPick;

          const unitCountryFlag =
            r.unitCountry && COUNTRY_FLAGS[r.unitCountry]
              ? COUNTRY_FLAGS[r.unitCountry]
              : "";

          return (
            <article
              key={r.unitSlug}
              className="bg-bg3 border border-border rounded-lg p-3.5 hover:border-gold/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-gold2 font-bold tabular-nums text-sm">
                  #{i + 1}
                </span>
                {catMeta && (
                  <span className="text-muted text-[10px] uppercase tracking-widest flex items-center gap-1">
                    <span aria-hidden="true">{catMeta.icon}</span>
                    {catMeta.label}
                  </span>
                )}
              </div>
              <Link
                href={unitHref as any}
                className="block text-gold2 font-bold text-base md:text-lg hover:underline no-underline mb-2"
              >
                {unitCountryFlag && <span className="mr-1">{unitCountryFlag}</span>}
                {locale === "fr" ? r.unitName : r.unitNameEn || r.unitName}
              </Link>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="border border-gold/30 rounded p-2 bg-gold/5">
                  <div className="text-[9px] uppercase tracking-widest text-muted mb-1">
                    {slot1Label}
                  </div>
                  {slot1Slug ? (
                    <Link
                      href={generalHref(slot1Slug) as any}
                      className="text-gold2 font-bold hover:underline no-underline text-[11px]"
                    >
                      {slot1Name || slot1Slug}
                    </Link>
                  ) : (
                    <span className="text-muted italic">—</span>
                  )}
                </div>
                <div className="border border-dashed border-border rounded p-2">
                  <div className="text-[9px] uppercase tracking-widest text-muted mb-1">
                    #2
                  </div>
                  {slot2Slug ? (
                    <Link
                      href={generalHref(slot2Slug) as any}
                      className="text-gold2 font-bold hover:underline no-underline text-[11px]"
                    >
                      {r.top2GeneralName}
                    </Link>
                  ) : (
                    <span className="text-muted italic text-[10px]">
                      {voteToReveal}
                    </span>
                  )}
                </div>
                <div className="border border-dashed border-border rounded p-2">
                  <div className="text-[9px] uppercase tracking-widest text-muted mb-1">
                    #3
                  </div>
                  {slot3Slug ? (
                    <Link
                      href={generalHref(slot3Slug) as any}
                      className="text-gold2 font-bold hover:underline no-underline text-[11px]"
                    >
                      {r.top3GeneralName}
                    </Link>
                  ) : (
                    <span className="text-muted italic text-[10px]">
                      {voteToReveal}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2 text-muted text-[10px] flex items-center justify-between">
                <span className="tabular-nums">
                  {r.totalVotes} / {data.threshold}
                </span>
                <Link
                  href={unitHref as any}
                  className="text-gold2 hover:underline no-underline uppercase tracking-widest text-[10px]"
                >
                  {voteCta} →
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
