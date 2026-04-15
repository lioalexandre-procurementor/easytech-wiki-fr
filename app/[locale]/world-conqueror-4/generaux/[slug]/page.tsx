import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import TrainedSkillVote from "@/components/TrainedSkillVote";
import {
  getAllGeneralSlugs,
  getGeneral,
  getAllGenerals,
  getEliteUnit,
  getCandidatesForGeneralSlot,
  buildSlotRecommendationMap,
  getSkill,
  GENERAL_CATEGORY_META,
  COUNTRY_FLAGS,
  FACTION_META,
} from "@/lib/units";
import type {
  Metadata,
} from "next";
import type {
  GeneralQuality,
  GeneralSkill,
  TrainingStage,
} from "@/lib/types";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { StatsGrid } from "@/components/general/StatsGrid";
import { locales } from "@/src/i18n/config";
import { splitGeneralName } from "@/lib/general-name";

export function generateStaticParams() {
  const slugs = getAllGeneralSlugs();
  return locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const g = getGeneral(slug);
  if (!g) return { title: "404" };
  const name = g.nameEn || g.name;
  const title =
    locale === "fr"
      ? `${name} (WC4) — Compétences, attributs & guide`
      : `${name} (WC4) — Skills, attributes & guide`;
  const description =
    locale === "fr"
      ? `Fiche complète du général ${name} dans World Conqueror 4 : ${g.shortDesc} Attributs, skills, training, unités recommandées.`
      : `Complete profile of general ${name} in World Conqueror 4: ${g.shortDesc} Attributes, skills, training, recommended units.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/world-conqueror-4/${locale === "fr" ? "generaux" : "generals"}/${slug}`,
      languages: {
        fr: `/fr/world-conqueror-4/generaux/${slug}`,
        en: `/en/world-conqueror-4/generals/${slug}`,
        "x-default": `/fr/world-conqueror-4/generaux/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "article",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      alternateLocale: locale === "fr" ? ["en_US"] : ["fr_FR"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

const QUALITY_META: Record<
  GeneralQuality,
  { icon: string; color: string; slots: number }
> = {
  bronze:  { icon: "🥉", color: "#cd7f32", slots: 3 },
  silver:  { icon: "🥈", color: "#c0c0c0", slots: 4 },
  gold:    { icon: "🥇", color: "#d4a44a", slots: 5 },
  marshal: { icon: "⭐", color: "#ff6b6b", slots: 5 },
};


export default async function GeneralPage({ params }: { params: { locale: string; slug: string } }) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations();
  const g = getGeneral(params.slug);
  if (!g) notFound();

  const m = GENERAL_CATEGORY_META[g.category];
  const scorpion = g.faction === "scorpion";
  const faction = FACTION_META[g.faction];
  const quality = QUALITY_META[g.quality];
  const qualityLabel = t(`general.quality.${g.quality}`);

  const related = getAllGenerals()
    .filter((x) => x.slug !== g.slug && x.category === g.category)
    .slice(0, 3);

  const recommended = g.recommendedUnits
    .map((slug) => getEliteUnit(slug))
    .filter((u): u is NonNullable<typeof u> => u !== null);

  const ACQUISITION_ICON: Record<string, string> = {
    starter: "🥇",
    medals: "🎖",
    "iron-cross": "✠",
    coin: "🪙",
    campaign: "🎬",
    event: "📅",
  };
  const acqIcon = ACQUISITION_ICON[g.acquisition.type] || "🎁";
  const ACQ_KEYS = ["starter", "medals", "iron-cross", "coin", "campaign", "event"] as const;
  type AcqKey = typeof ACQ_KEYS[number];
  const acqLabel = (ACQ_KEYS as readonly string[]).includes(g.acquisition.type)
    ? t(`acquisitionTypes.${g.acquisition.type as AcqKey}`)
    : g.acquisition.type;
  const acqMeta = { icon: acqIcon, label: acqLabel };
  const acqPillText =
    g.acquisition.cost != null
      ? `${acqMeta.icon} ${g.acquisition.cost} ${acqMeta.label.toLowerCase()}`
      : `${acqMeta.icon} ${acqMeta.label}`;

  const replaceableCount = g.skills.filter((s) => s.replaceable).length;
  const slotRecommendations = buildSlotRecommendationMap(g);
  const { family, given } = splitGeneralName(g.name);

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">{t("nav.home")}</Link>{" "}
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link href="/world-conqueror-4" className="text-dim">{t("nav.wc4")}</Link>{" "}
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link href="/world-conqueror-4/generaux" className="text-dim">{t("nav.generals")}</Link>{" "}
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <span>{g.name}</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20 grid lg:grid-cols-[240px_1fr] gap-7">
        <aside className="bg-panel border border-border rounded-lg p-4 h-fit lg:sticky lg:top-20">
          <h4 className="text-gold2 text-xs uppercase tracking-widest mb-1.5 border-b border-border pb-1.5">
            {t("general.onThisPage")}
          </h4>
          <ul className="list-none text-sm">
            <li><a href="#attributes" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("general.attributesNav")}</a></li>
            <li><a href="#skills" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("general.skillsNav")}</a></li>
            {g.hasTrainingPath && (
              <li><a href="#training" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("general.trainingNav")}</a></li>
            )}
            <li><a href="#bonuses" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("general.bonusesNav")}</a></li>
            <li><a href="#acquisition" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("general.acquisitionNav")}</a></li>
            <li><a href="#units" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("general.unitsNav")}</a></li>
          </ul>
          <h4 className="text-gold2 text-xs uppercase tracking-widest mt-4 mb-1.5 border-b border-border pb-1.5">
            {t("nav.navigationHeading")}
          </h4>
          <ul className="list-none text-sm">
            <li><Link href="/world-conqueror-4/generaux" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("nav.allGenerals")}</Link></li>
            {scorpion && (
              <li><Link href="/world-conqueror-4/empire-du-scorpion" className="block px-2 py-1 text-dim no-underline hover:text-gold2">🦂 {t("nav.scorpion")}</Link></li>
            )}
          </ul>
        </aside>

        <main>
          {/* HEADER */}
          <div className="grid md:grid-cols-[220px_1fr] gap-7 bg-panel border border-border rounded-lg p-6 mb-6">
            <div
              className="rounded-lg border-2 h-[220px] grid place-items-center relative overflow-hidden"
              style={{
                borderColor: scorpion ? "#c8372d" : quality.color,
                background: scorpion
                  ? "linear-gradient(135deg, #2a0f12, #1a1418)"
                  : "linear-gradient(135deg, #1a2230, #12161e)",
              }}
            >
              {g.image?.photo ? (
                <Image
                  src={g.image.photo}
                  alt={g.name}
                  fill
                  sizes="220px"
                  className="object-contain p-2"
                  priority
                />
              ) : (
                <div
                  className="w-28 h-28 rounded-full grid place-items-center text-4xl font-extrabold"
                  style={{
                    background: scorpion
                      ? "linear-gradient(135deg, #4a0f12, #c8372d)"
                      : `linear-gradient(135deg, #8b7d4a, ${quality.color})`,
                    color: scorpion ? "#fff" : "#0f1419",
                  }}
                >
                  {scorpion ? "🦂" : g.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                </div>
              )}
              <div className="absolute top-2.5 right-2.5">
                <span
                  className={`text-xs font-extrabold uppercase tracking-widest px-2.5 py-1 rounded ${
                    g.rank === "S"
                      ? "bg-red-500/20 border border-red-500/40 text-red-300"
                      : "bg-gold/20 border border-gold/40 text-gold2"
                  }`}
                >
                  Tier {g.rank}
                </span>
              </div>
              <div className="absolute bottom-2.5 left-2.5">
                <span
                  className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border"
                  style={{
                    borderColor: quality.color,
                    background: `${quality.color}22`,
                    color: quality.color,
                  }}
                >
                  {quality.icon} {qualityLabel}
                </span>
              </div>
            </div>
            <div>
              <h1 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                <span className="text-4xl md:text-5xl font-black uppercase tracking-wide text-gold2">
                  {family}
                </span>
                {given && (
                  <span className="text-lg md:text-xl font-semibold text-dim tracking-wide">
                    {given}
                  </span>
                )}
              </h1>
              <div className="text-dim text-sm mb-4">{g.shortDesc}</div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Tag accent>{m.icon} {t("general.generalCategoryTag", { label: m.label })}</Tag>
                <Tag>{COUNTRY_FLAGS[g.country] || "🏳"} {g.countryName}</Tag>
                <Tag>🎖 Tier {g.rank}</Tag>
                <Tag accent>{quality.icon} {qualityLabel} · {quality.slots} {t("general.slotsSuffix")}</Tag>
                <Tag accent>{acqPillText}</Tag>
                {g.hasTrainingPath && <Tag accent>{t("general.trainingTag")}</Tag>}
                {replaceableCount > 0 && (
                  <Tag accent>{replaceableCount > 1
                    ? t("general.freeSlotsPlural", { count: replaceableCount })
                    : t("general.freeSlotsSingular", { count: replaceableCount })}</Tag>
                )}
                <Tag scorpion={scorpion}>
                  {scorpion ? "🦂" : "🌍"} {faction.label}
                </Tag>
              </div>
              <p className="text-ink text-sm leading-relaxed">{g.longDesc}</p>
            </div>
          </div>

          {/* CROSS-LINK: maxed-out variant (all generals) + premium training (19 only) */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Link
              href={
                params.locale === "fr"
                  ? `/world-conqueror-4/generaux/${g.slug}/entraine`
                  : `/world-conqueror-4/generals/${g.slug}/trained`
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-gold/10 border border-gold/30 text-gold2 hover:bg-gold/20 transition-colors"
            >
              ★ {t("general.viewMaxed")}
            </Link>
            {g.hasTrainingPath && g.trainedSkills && g.trainedSkills.length > 0 && (
              <Link
                href={
                  params.locale === "fr"
                    ? `/world-conqueror-4/generaux/${g.slug}/entrainement-premium`
                    : `/world-conqueror-4/generals/${g.slug}/premium-training`
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-red-500/10 border border-red-500/40 text-red-300 hover:bg-red-500/20 transition-colors"
              >
                ⚔ {t("general.viewPremiumTraining")}
              </Link>
            )}
          </div>

          {/* ATTRIBUTES (6 aptitudes) */}
          <StatsGrid attributes={g.attributes} mode="base" />

          {/* SKILLS — inline vote widget for replaceable slots */}
          <div id="skills" className="bg-panel border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg">
                {t("general.skillsHeading")}
              </h3>
              <span className="text-muted text-[10px] uppercase tracking-widest">
                {g.skills.length} {g.skills.length > 1 ? t("general.skillsSlotsSuffixPlural") : t("general.skillsSlotsSuffix")} · {t("general.qualityLabel")} {qualityLabel}
              </span>
            </div>
            <div className="space-y-3">
              {g.skills.map((s) => (
                <SkillBlock
                  key={s.slot}
                  skill={s}
                  generalSlug={g.slug}
                  category={g.category}
                  recommended={slotRecommendations.get(s.slot)}
                  locale={params.locale}
                />
              ))}
            </div>
            {replaceableCount > 0 && (
              <div
                className="mt-4 text-muted text-[11px] italic"
                dangerouslySetInnerHTML={{ __html: t("general.academyHint") }}
              />
            )}
          </div>

          {/* TRAINING PATH (Swords/Sceptres of Dominance) */}
          {g.hasTrainingPath && g.training && (
            <div
              id="training"
              className="border-2 rounded-lg p-6 mb-6"
              style={{
                borderColor: "#d4a44a",
                background:
                  "linear-gradient(135deg, rgba(212,164,74,0.10) 0%, rgba(212,164,74,0.02) 100%), #1a2230",
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg">
                  {t("general.trainingHeading")}
                </h3>
                <div className="flex gap-2">
                  {g.training.totalSwordCost != null && (
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded border bg-gold/20 border-gold/40 text-gold2">
                      ⚔ {g.training.totalSwordCost} {t("general.swordsUnit")}
                    </span>
                  )}
                  {g.training.totalSceptreCost != null && (
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded border bg-gold/20 border-gold/40 text-gold2">
                      🪄 {g.training.totalSceptreCost} {t("general.sceptresUnit")}
                    </span>
                  )}
                </div>
              </div>
              {g.training.summary && (
                <p className="text-dim text-sm mb-4 italic">{g.training.summary}</p>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.training.stages.map((stage) => (
                  <TrainingStageCard key={stage.stage} stage={stage} locale={params.locale} />
                ))}
              </div>
              <div className="mt-4 text-muted text-[11px] italic">
                {t("general.trainingHint")}
              </div>
            </div>
          )}

          {/* BONUSES */}
          <div id="bonuses" className="bg-panel border border-border rounded-lg p-6 mb-6">
            <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              {t("general.bonusesHeading")}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {g.bonuses.map((b, i) => (
                <div
                  key={i}
                  className="border border-border rounded-lg p-3 bg-bg3 text-center"
                >
                  <div className="text-muted text-[10px] uppercase tracking-widest mb-1">
                    {b.target}
                  </div>
                  <div className="text-gold2 font-extrabold text-xl">{b.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ACQUISITION */}
          <div id="acquisition" className="bg-panel border border-border rounded-lg p-6 mb-6">
            <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              {t("general.acquisitionHeading", { name: g.name })}
            </h3>
            <div className="grid md:grid-cols-[auto_1fr] gap-5 items-center">
              <div className="border-2 border-gold rounded-lg p-4 text-center min-w-[160px]">
                <div className="text-4xl mb-2">{acqMeta.icon}</div>
                <div className="text-gold2 font-bold text-base mb-1">{acqMeta.label}</div>
                {g.acquisition.cost != null ? (
                  <div className="text-gold font-extrabold text-2xl">
                    {g.acquisition.cost}
                  </div>
                ) : (
                  <div className="text-muted text-[11px] italic">{t("general.acquisitionCostTbd")}</div>
                )}
              </div>
              <div className="text-dim text-sm leading-relaxed">
                {g.acquisition.notes || t("general.acquisitionNotesFallback")}
                {g.acquisition.type === "campaign" && (
                  <p className="mt-2 text-amber-200 text-xs">
                    {t("general.acquisitionCampaignNote")}
                  </p>
                )}
                {g.acquisition.type === "medals" && (
                  <p className="mt-2 text-muted text-xs">
                    {t("general.acquisitionMedalsNote")}
                  </p>
                )}
                {g.acquisition.type === "iron-cross" && (
                  <p className="mt-2 text-amber-200 text-xs">
                    {t("general.acquisitionIronCrossNote")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="ad-slot">{t("ui.adSlot")}</div>

          {/* RECOMMENDED UNITS */}
          {recommended.length > 0 && (
            <div id="units" className="bg-panel border border-border rounded-lg p-6 mb-6">
              <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
                {t("general.recommendedUnitsHeading")}
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommended.map((u) => (
                  <Link
                    key={u.slug}
                    href={`/world-conqueror-4/unites-elite/${u.slug}`}
                    className="block bg-bg3 border border-border rounded-lg p-4 hover:border-gold transition-colors no-underline"
                  >
                    <div className="text-gold2 font-bold text-sm mb-1">{u.name}</div>
                    <div className="text-dim text-xs line-clamp-2">{u.shortDesc}</div>
                    <div className="text-muted text-[10px] uppercase tracking-widest mt-2">
                      {COUNTRY_FLAGS[u.country]} {u.countryName} · Tier {u.tier}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {g.recommendedUnits.length > recommended.length && (
            <div className="text-muted text-xs mb-6">
              {t("general.alsoMentioned")}{" "}
              {g.recommendedUnits
                .filter((slug) => !recommended.find((u) => u.slug === slug))
                .join(", ")}
            </div>
          )}

          {/* RELATED */}
          {related.length > 0 && (
            <>
              <h2 className="text-xl mb-4 mt-8">
                {t("general.relatedHeading", { label: m.label.toLowerCase() })}
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/world-conqueror-4/generaux/${r.slug}`}
                    className="block bg-panel border border-border rounded-lg p-4 hover:border-gold transition-colors no-underline"
                  >
                    <h3 className="text-gold2 font-bold text-base mb-1">{r.name}</h3>
                    <p className="text-dim text-xs line-clamp-2">{r.shortDesc}</p>
                    <div className="text-muted text-[10px] uppercase tracking-widest mt-2">
                      {COUNTRY_FLAGS[r.country]} · Tier {r.rank}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* SOURCES */}
          {g.sources && g.sources.length > 0 && (
            <div className="text-muted text-xs mt-8">
              <b>{t("general.sources")}</b> {g.sources.join(" · ")}
            </div>
          )}
        </main>
      </div>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${g.nameEn || g.name} — World Conqueror 4`,
            about: {
              "@type": "VideoGame",
              name: "World Conqueror 4",
              gamePlatform: ["Android", "iOS"],
              publisher: { "@type": "Organization", name: "EasyTech" },
            },
            author: { "@type": "Organization", name: "EasyTech Wiki" },
            inLanguage: params.locale,
            description: g.shortDesc,
          }),
        }}
      />
    </>
  );
}

// ─── components ──────────────────────────────────────────────────────────

function SkillBlock({
  skill,
  generalSlug,
  category,
  recommended,
  locale,
}: {
  skill: GeneralSkill;
  generalSlug: string;
  category: string;
  recommended?: string;
  locale: string;
}) {
  const isFr = locale === "fr";
  const rating = skill.rating;
  const ratingColor =
    rating === "S+" || rating === "S"
      ? "bg-red-500/20 border-red-500/40 text-red-300"
      : rating === "A"
      ? "bg-gold/20 border-gold/40 text-gold2"
      : rating === "B"
      ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
      : "bg-bg3 border-border text-dim";

  // Re-fetch the general & candidates server-side (the page already resolved g;
  // this keeps the component pure).
  const g = getGeneral(generalSlug);
  const candidates =
    skill.replaceable && g
      ? getCandidatesForGeneralSlot(g, skill.slot)
      : [];
  void category;

  // If the skill has a catalog slug, wrap the header in a link to the detail page
  // and render its icon.
  const skillDetailHref = skill.skillSlug
    ? `/world-conqueror-4/competences/${skill.skillSlug}`
    : null;

  // Resolve locale-aware display name & description. The general JSON often
  // stores the English canonical name in `skill.name` (backfilled from APK),
  // so we prefer the skill catalog's `nameFr`/`renderedDescFr` fields when in
  // FR locale, and the catalog's `name`/`renderedDesc` in EN locale. We fall
  // back to the general's own `skill.name`/`skill.desc` only when the catalog
  // lookup fails (empty slots, missing data).
  const catalog = skill.skillSlug ? getSkill(skill.skillSlug) : null;
  const progEntry =
    catalog && skill.skillLevel != null
      ? catalog.progression.find((p) => p.level === skill.skillLevel) ?? null
      : null;
  const rawName = isFr
    ? catalog?.nameFr || skill.name
    : catalog?.name || skill.nameEn || skill.name;
  const rawDesc = isFr
    ? progEntry?.renderedDescFr ||
      catalog?.descriptionTemplateFr ||
      skill.desc
    : progEntry?.renderedDesc ||
      catalog?.descriptionTemplate ||
      skill.desc;
  const isFreeSlot = skill.name === "Emplacement libre";
  const displayName = isFreeSlot
    ? isFr ? "Emplacement libre" : "Free slot"
    : rawName;
  const displayDesc = isFreeSlot
    ? isFr
      ? "Compétence apprenable — emplacement libre jusqu'au premium training."
      : "Learnable skill — slot stays open until premium training."
    : rawDesc;

  return (
    <div
      className={`border rounded-lg p-4 ${
        skill.replaceable ? "border-gold/40 bg-gold/5" : "bg-bg3 border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        {skill.icon ? (
          <div
            className="w-12 h-12 rounded-md border border-gold/40 bg-bg3 relative overflow-hidden flex-shrink-0"
          >
            <Image
              src={skill.icon}
              alt={displayName}
              fill
              sizes="48px"
              className="object-contain p-1"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-md border border-border bg-bg3 grid place-items-center flex-shrink-0 text-xl">
            ⚡
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-muted text-[10px] uppercase tracking-widest font-bold">
                Slot {skill.slot}
              </span>
              {skillDetailHref ? (
                <Link
                  href={skillDetailHref as any}
                  className="text-gold2 font-bold text-sm hover:underline no-underline truncate"
                >
                  {displayName}
                </Link>
              ) : (
                <span className="text-gold2 font-bold text-sm truncate">
                  {displayName}
                </span>
              )}
              {skill.skillLevel != null && (
                <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-gold/15 border border-gold/40 text-gold2">
                  L{skill.skillLevel}
                </span>
              )}
              {skill.replaceable && (
                <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded border bg-gold/15 border-gold/40 text-gold2">
                  🎓 {isFr ? "Libre" : "Free"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {rating && (
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${ratingColor}`}
                >
                  {rating}
                </span>
              )}
            </div>
          </div>
          <div className="text-dim text-sm leading-relaxed">{displayDesc}</div>
          {skill.replaceableReason && (
            <div className="text-muted text-[10px] italic mt-1">
              {skill.replaceableReason}
            </div>
          )}
          {skillDetailHref && (
            <div className="mt-2">
              <Link
                href={skillDetailHref as any}
                className="text-[11px] text-gold/80 hover:text-gold2 no-underline"
              >
                {isFr ? "📈 Voir la progression L1 → L5 →" : "📈 View L1 → L5 progression →"}
              </Link>
            </div>
          )}
        </div>
      </div>

      {skill.replaceable && candidates.length > 0 && (
        <TrainedSkillVote
          generalSlug={generalSlug}
          slot={skill.slot}
          currentSkillName={skill.name}
          candidates={candidates}
          recommended={recommended}
        />
      )}
    </div>
  );
}

function TrainingStageCard({ stage, locale }: { stage: TrainingStage; locale: string }) {
  const isFr = locale === "fr";
  const stageLabel = isFr ? `Étape ${stage.stage}` : `Stage ${stage.stage}`;
  const effectsLabel = isFr ? "Effets" : "Effects";
  const costTbd = isFr ? "Coût à vérifier in-game." : "Cost to verify in-game.";
  const modificationFallback = isFr ? "modification" : "change";
  return (
    <div className="border border-gold/30 rounded-lg p-3 bg-bg3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gold2 font-bold text-xs uppercase tracking-widest">
          {stageLabel}
        </span>
        <div className="flex gap-1">
          {stage.swordCost != null && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gold/20 border border-gold/40 text-gold2">
              ⚔ {stage.swordCost}
            </span>
          )}
          {stage.sceptreCost != null && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gold/20 border border-gold/40 text-gold2">
              🪄 {stage.sceptreCost}
            </span>
          )}
        </div>
      </div>
      {stage.label && (
        <div className="text-dim text-xs mb-1">{stage.label}</div>
      )}
      {stage.notes && (
        <div className="text-muted text-[11px] italic">{stage.notes}</div>
      )}
      {(stage.skillChanges?.length ?? 0) > 0 && (
        <div className="mt-2 text-[11px] text-dim">
          <div className="text-muted uppercase tracking-widest text-[9px] mb-0.5">{effectsLabel}</div>
          <ul className="list-disc pl-4 space-y-0.5">
            {stage.skillChanges!.map((c, i) => (
              <li key={i}>
                Slot {c.slot} : {c.kind === "unlock" ? "🆕" : c.kind === "upgrade" ? "⬆" : "♻"}{" "}
                {c.newName || c.notes || modificationFallback}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(!stage.swordCost && !stage.sceptreCost && !stage.notes) && (
        <div className="text-muted text-[11px] italic mt-1">
          {costTbd}
        </div>
      )}
    </div>
  );
}

function Tag({
  children,
  accent,
  scorpion,
}: {
  children: React.ReactNode;
  accent?: boolean;
  scorpion?: boolean;
}) {
  if (scorpion) {
    return (
      <span
        className="px-2.5 py-1 rounded-xl text-xs font-semibold border text-red-200"
        style={{ background: "rgba(200,55,45,0.15)", borderColor: "#c8372d" }}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${
        accent ? "bg-gold/15 border-gold text-gold2" : "bg-bg3 border-border text-dim"
      }`}
    >
      {children}
    </span>
  );
}
