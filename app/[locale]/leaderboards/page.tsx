import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { COUNTRY_FLAGS, getCategoryMeta } from "@/lib/units";
import { countryLabel } from "@/lib/countries";
import {
  loadGeneralsLeaderboard,
  loadSkillsLeaderboard,
  loadUnitsLeaderboard,
  UNITS_LEADERBOARD_THRESHOLD,
  type GeneralsRanking,
  type SkillsRanking,
  type UnitsRanking,
} from "@/lib/leaderboards";
import { locales, type Locale } from "@/src/i18n/config";
import { ogLocale } from "@/src/i18n/og-locale";
import type { Metadata } from "next";

export const dynamic = "force-dynamic"; // always fresh — vote totals are live
export const revalidate = 30; // but fronted by a 30s edge cache to smooth bursts

type TabKey = "generals" | "skills" | "units";

function parseTab(raw: unknown): TabKey {
  if (raw === "skills" || raw === "units") return raw;
  return "generals";
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "leaderboardsPage" });
  return {
    title: t("seoTitle"),
    description: t("seoDescription"),
    alternates: {
      canonical: `/${locale}/leaderboards`,
      languages: {
        fr: "/fr/classements",
        en: "/en/leaderboards",
        de: "/de/bestenlisten",
        "x-default": "/fr/classements",
      },
    },
    openGraph: {
      title: t("seoTitle"),
      description: t("seoDescription"),
      type: "website",
      locale: ogLocale(locale),
    },
    robots: { index: true, follow: true },
  };
}

const RANK_COLOR: Record<string, string> = {
  S: "bg-red-500/20 border-red-500/40 text-red-300",
  A: "bg-gold/20 border-gold/40 text-gold2",
  B: "bg-blue-500/15 border-blue-500/40 text-blue-300",
  C: "bg-border text-dim",
};

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
  const tab = parseTab(searchParams.tab);

  // Only fetch the bucket for the selected tab — keeps the request light
  // and dodges N unnecessary Redis round-trips when a visitor only wants
  // one ranking.
  const [generalsRanking, skillsRanking, unitsRanking] = await Promise.all([
    tab === "generals" ? loadGeneralsLeaderboard() : Promise.resolve(null),
    tab === "skills" ? loadSkillsLeaderboard() : Promise.resolve(null),
    tab === "units"
      ? loadUnitsLeaderboard(UNITS_LEADERBOARD_THRESHOLD)
      : Promise.resolve(null),
  ]);

  const CAT = getCategoryMeta(locale);

  return (
    <>
      <TopBar />
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pb-20">
        {/* Breadcrumb + back */}
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

        {/* Tabs — URL-param driven, work without JS */}
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
          />
          <TabLink
            tab="skills"
            active={tab === "skills"}
            label={t("leaderboardsPage.tabSkills")}
            locale={locale}
          />
          <TabLink
            tab="units"
            active={tab === "units"}
            label={t("leaderboardsPage.tabUnits")}
            locale={locale}
          />
        </nav>

        <section className="bg-panel border border-border rounded-lg p-4 md:p-6">
          {tab === "generals" && generalsRanking && (
            <GeneralsTab
              data={generalsRanking}
              locale={loc}
              desc={t("leaderboardsPage.tabGeneralsDesc")}
              empty={t("leaderboardsPage.emptyGenerals")}
              voteCta={t("leaderboardsPage.voteOnHub")}
              labels={{
                rank: t("leaderboardsPage.rank"),
                name: t("leaderboardsPage.name"),
                votes: t("leaderboardsPage.votes"),
                share: t("leaderboardsPage.share"),
                total: t("leaderboardsPage.total"),
              }}
            />
          )}

          {tab === "skills" && skillsRanking && (
            <SkillsTab
              data={skillsRanking}
              locale={loc}
              desc={t("leaderboardsPage.tabSkillsDesc")}
              empty={t("leaderboardsPage.emptySkills")}
              voteCta={t("leaderboardsPage.voteOnGeneralPage")}
              appearsOn={t("leaderboardsPage.appearsOn")}
              labels={{
                rank: t("leaderboardsPage.rank"),
                name: t("leaderboardsPage.name"),
                votes: t("leaderboardsPage.votes"),
                share: t("leaderboardsPage.share"),
                total: t("leaderboardsPage.total"),
              }}
            />
          )}

          {tab === "units" && unitsRanking && (
            <UnitsTab
              data={unitsRanking}
              locale={loc}
              desc={t("leaderboardsPage.tabUnitsDesc", {
                threshold: UNITS_LEADERBOARD_THRESHOLD,
              })}
              empty={t("leaderboardsPage.emptyUnits")}
              voteCta={t("leaderboardsPage.voteOnUnitPage")}
              topPick={t("leaderboardsPage.topPick")}
              labels={{
                rank: t("leaderboardsPage.rank"),
                votes: t("leaderboardsPage.votes"),
                share: t("leaderboardsPage.share"),
              }}
              catLabels={CAT}
            />
          )}
        </section>
      </div>
      <Footer />
    </>
  );
}

/** ─── Components ─────────────────────────────────────────────────── */

function TabLink({
  tab,
  active,
  label,
  locale,
}: {
  tab: TabKey;
  active: boolean;
  label: string;
  locale: string;
}) {
  // Using a plain <a> so the query string is preserved as-is and the
  // tab selection survives browser back/forward without next-intl
  // pathname rewriting.
  return (
    <a
      href={`/${locale}/leaderboards?tab=${tab}`}
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
  data,
  locale,
  desc,
  empty,
  voteCta,
  labels,
}: {
  data: GeneralsRanking;
  locale: Locale;
  desc: string;
  empty: string;
  voteCta: string;
  labels: Record<"rank" | "name" | "votes" | "share" | "total", string>;
}) {
  if (data.rows.length === 0) {
    return (
      <EmptyState text={empty} cta={voteCta} href={`/${locale}/world-conqueror-4`} />
    );
  }
  return (
    <>
      <p className="text-dim text-sm mb-4">{desc}</p>
      <div className="text-muted text-xs uppercase tracking-widest mb-2">
        {labels.total}: {data.total.toLocaleString(locale)}
      </div>
      <div className="overflow-x-auto -mx-2 md:mx-0 rounded-lg border border-border">
        <table className="w-full text-sm border-collapse min-w-[520px]">
          <thead>
            <tr className="bg-gradient-to-r from-gold/15 to-gold/5">
              <th className="text-left text-gold2 text-[10px] md:text-xs uppercase tracking-widest font-bold p-2.5 md:p-3 border-b-2 border-gold/30 w-14">
                {labels.rank}
              </th>
              <th className="text-left text-gold2 text-[10px] md:text-xs uppercase tracking-widest font-bold p-2.5 md:p-3 border-b-2 border-gold/30">
                {labels.name}
              </th>
              <th className="text-right text-gold2 text-[10px] md:text-xs uppercase tracking-widest font-bold p-2.5 md:p-3 border-b-2 border-gold/30 w-20">
                {labels.votes}
              </th>
              <th className="text-right text-gold2 text-[10px] md:text-xs uppercase tracking-widest font-bold p-2.5 md:p-3 border-b-2 border-gold/30 w-20">
                {labels.share}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => (
              <tr
                key={r.slug}
                className={`border-b border-border/30 ${i % 2 === 1 ? "bg-bg3/40" : ""} hover:bg-gold/5 transition-colors`}
              >
                <td className="p-2.5 md:p-3 font-bold text-gold2 tabular-nums">
                  {medalFor(i) ?? `#${i + 1}`}
                </td>
                <td className="p-2.5 md:p-3">
                  <Link
                    href={`/world-conqueror-4/generaux/${r.slug}` as any}
                    className="text-gold2 hover:underline no-underline inline-flex items-center gap-2"
                  >
                    {r.country && (
                      <span aria-hidden="true" className="text-base">
                        {COUNTRY_FLAGS[r.country] ?? "🏳"}
                      </span>
                    )}
                    <span>
                      {locale === "fr" ? r.name : r.nameEn || r.name}
                    </span>
                    {r.country && (
                      <span className="text-muted text-xs font-normal">
                        · {countryLabel(r.country, locale)}
                      </span>
                    )}
                    {r.rank && (
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${RANK_COLOR[r.rank] ?? RANK_COLOR.C}`}
                      >
                        {r.rank}
                      </span>
                    )}
                  </Link>
                </td>
                <td className="p-2.5 md:p-3 text-right font-bold text-gold2 tabular-nums">
                  {r.votes.toLocaleString(locale)}
                </td>
                <td className="p-2.5 md:p-3 text-right text-dim tabular-nums">
                  {r.share}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SkillsTab({
  data,
  locale,
  desc,
  empty,
  voteCta,
  appearsOn,
  labels,
}: {
  data: SkillsRanking;
  locale: Locale;
  desc: string;
  empty: string;
  voteCta: string;
  appearsOn: string;
  labels: Record<"rank" | "name" | "votes" | "share" | "total", string>;
}) {
  if (data.rows.length === 0) {
    return (
      <EmptyState
        text={empty}
        cta={voteCta}
        href={`/${locale}/world-conqueror-4/generaux`}
      />
    );
  }
  return (
    <>
      <p className="text-dim text-sm mb-4">{desc}</p>
      <div className="text-muted text-xs uppercase tracking-widest mb-2">
        {labels.total}: {data.total.toLocaleString(locale)}
      </div>
      <div className="overflow-x-auto -mx-2 md:mx-0 rounded-lg border border-border">
        <table className="w-full text-sm border-collapse min-w-[520px]">
          <thead>
            <tr className="bg-gradient-to-r from-gold/15 to-gold/5">
              <th className="text-left text-gold2 text-[10px] md:text-xs uppercase tracking-widest font-bold p-2.5 md:p-3 border-b-2 border-gold/30 w-14">
                {labels.rank}
              </th>
              <th className="text-left text-gold2 text-[10px] md:text-xs uppercase tracking-widest font-bold p-2.5 md:p-3 border-b-2 border-gold/30">
                {labels.name}
              </th>
              <th className="text-right text-gold2 text-[10px] md:text-xs uppercase tracking-widest font-bold p-2.5 md:p-3 border-b-2 border-gold/30 w-24 hidden md:table-cell">
                {appearsOn}
              </th>
              <th className="text-right text-gold2 text-[10px] md:text-xs uppercase tracking-widest font-bold p-2.5 md:p-3 border-b-2 border-gold/30 w-20">
                {labels.votes}
              </th>
              <th className="text-right text-gold2 text-[10px] md:text-xs uppercase tracking-widest font-bold p-2.5 md:p-3 border-b-2 border-gold/30 w-20">
                {labels.share}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => (
              <tr
                key={r.id}
                className={`border-b border-border/30 ${i % 2 === 1 ? "bg-bg3/40" : ""} hover:bg-gold/5 transition-colors`}
              >
                <td className="p-2.5 md:p-3 font-bold text-gold2 tabular-nums">
                  {medalFor(i) ?? `#${i + 1}`}
                </td>
                <td className="p-2.5 md:p-3">
                  <Link
                    href={`/world-conqueror-4/competences/${r.id}` as any}
                    className="text-gold2 hover:underline no-underline"
                  >
                    {locale === "fr" ? r.nameFr || r.name : r.name}
                  </Link>
                </td>
                <td className="p-2.5 md:p-3 text-right text-dim tabular-nums hidden md:table-cell">
                  {r.appearsIn}
                </td>
                <td className="p-2.5 md:p-3 text-right font-bold text-gold2 tabular-nums">
                  {r.votes.toLocaleString(locale)}
                </td>
                <td className="p-2.5 md:p-3 text-right text-dim tabular-nums">
                  {r.share}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function UnitsTab({
  data,
  locale,
  desc,
  empty,
  voteCta,
  topPick,
  labels,
  catLabels,
}: {
  data: UnitsRanking;
  locale: Locale;
  desc: string;
  empty: string;
  voteCta: string;
  topPick: string;
  labels: Record<"rank" | "votes" | "share", string>;
  catLabels: Record<string, { label: string; icon: string; plural: string }>;
}) {
  if (data.rows.length === 0) {
    return (
      <EmptyState
        text={empty}
        cta={voteCta}
        href={`/${locale}/world-conqueror-4/unites-elite`}
      />
    );
  }
  return (
    <>
      <p className="text-dim text-sm mb-4">{desc}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {data.rows.map((r, i) => {
          const cat = catLabels[r.unitCategory as keyof typeof catLabels];
          return (
            <article
              key={r.unitSlug}
              className="bg-bg3 border border-border rounded-lg p-3.5 hover:border-gold/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-gold2 font-bold tabular-nums text-sm">
                  {medalFor(i) ?? `#${i + 1}`}
                </span>
                {cat && (
                  <span className="text-muted text-[10px] uppercase tracking-widest flex items-center gap-1">
                    <span aria-hidden="true">{cat.icon}</span>
                    {cat.label}
                  </span>
                )}
              </div>
              <Link
                href={`/world-conqueror-4/unites-elite/${r.unitSlug}` as any}
                className="block text-gold2 font-bold text-base md:text-lg hover:underline no-underline mb-1"
              >
                {COUNTRY_FLAGS[r.unitCountry ?? ""] ?? ""}{" "}
                {locale === "fr" ? r.unitName : r.unitNameEn || r.unitName}
              </Link>
              {r.topGeneralSlug && (
                <div className="flex items-baseline justify-between gap-2 mt-2">
                  <div className="min-w-0">
                    <div className="text-muted text-[10px] uppercase tracking-widest">
                      {topPick}
                    </div>
                    <Link
                      href={`/world-conqueror-4/generaux/${r.topGeneralSlug}` as any}
                      className="text-gold2 font-semibold hover:underline no-underline truncate block"
                    >
                      {locale === "fr"
                        ? r.topGeneralName
                        : r.topGeneralNameEn || r.topGeneralName}
                    </Link>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-gold2 font-bold tabular-nums">
                      {r.topGeneralVotes}/{r.totalVotes}
                    </div>
                    <div className="text-muted text-[10px] tabular-nums">
                      {r.topGeneralShare}%
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <p className="text-muted text-xs mt-4 italic">
        {data.thresholdReached} / {data.threshold}+ votes · Seuil : {data.threshold}
      </p>
    </>
  );
}

function EmptyState({
  text,
  cta,
  href,
}: {
  text: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="text-center py-10">
      <p className="text-dim text-sm mb-4">{text}</p>
      <a
        href={href}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold bg-gold/15 text-gold2 font-bold text-sm uppercase tracking-widest hover:bg-gold/25 transition-colors no-underline"
      >
        {cta}
      </a>
    </div>
  );
}

function medalFor(index: number): string | null {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return null;
}
