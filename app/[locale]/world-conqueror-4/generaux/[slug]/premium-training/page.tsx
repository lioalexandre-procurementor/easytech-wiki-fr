import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { StatsGrid } from "@/components/general/StatsGrid";
import { buildPremiumTrainingView } from "@/lib/general-trained";
import { getAllGeneralSlugs, getGeneral, getSkill } from "@/lib/units";
import { splitGeneralName } from "@/lib/general-name";
import { locales, type Locale } from "@/src/i18n/config";
import type { Metadata } from "next";

/**
 * "Premium training" variant of the general page — reserved for the 19
 * generals with `hasTrainingPath=true` and a populated `trainedSkills`
 * override. Shows the signature skills unlocked via Swords/Sceptres of
 * Dominance and the full post-training loadout.
 *
 * Generals without a premium training path return a 404: use the
 * `/trained` ("Maxed out") view instead.
 */
export function generateStaticParams() {
  const slugs = getAllGeneralSlugs();
  // Only generate for trainable generals — no point pre-rendering 404s.
  const trainableSlugs = slugs.filter((slug) => {
    const g = getGeneral(slug);
    return !!(g?.hasTrainingPath && g.trainedSkills?.length);
  });
  return locales.flatMap((locale) =>
    trainableSlugs.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const g = getGeneral(slug);
  if (!g) return { title: "404" };
  const t = await getTranslations({ locale, namespace: "premiumTrainingPage" });
  const name = g.nameEn || g.name;
  const baseSlugSegment = locale === "fr" ? "generaux" : "generals";
  return {
    title: t("seoTitle", { name }),
    description: t("seoDesc", { name }),
    alternates: {
      canonical: `/${locale}/world-conqueror-4/${baseSlugSegment}/${slug}`,
      languages: {
        fr: `/fr/world-conqueror-4/generaux/${slug}/entrainement-premium`,
        en: `/en/world-conqueror-4/generals/${slug}/premium-training`,
        "x-default": `/fr/world-conqueror-4/generaux/${slug}/entrainement-premium`,
      },
    },
    openGraph: {
      title: t("seoTitle", { name }),
      description: t("seoDesc", { name }),
      type: "article",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      alternateLocale: locale === "fr" ? ["en_US"] : ["fr_FR"],
    },
    twitter: {
      card: "summary_large_image",
      title: t("seoTitle", { name }),
      description: t("seoDesc", { name }),
    },
    robots: { index: true, follow: true },
  };
}

export default async function PremiumTrainingPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);

  const g = getGeneral(slug);
  if (!g) notFound();

  const view = buildPremiumTrainingView(g);
  if (!view) notFound();

  const t = await getTranslations();
  const isFr = locale === "fr";
  // Top-level header keeps the English canonical (stable across locales for
  // SEO/branding). Skill rows below resolve to locale-aware names via the
  // `nameForSkill`/`descForSkill` helpers.
  const name = g.nameEn || g.name;
  const { family, given } = splitGeneralName(name);

  const nameForSkill = (s: { name: string; nameEn?: string; skillSlug?: string }) => {
    if (s.name === "Emplacement libre") return isFr ? "Emplacement libre" : "Free slot";
    const cat = s.skillSlug ? getSkill(s.skillSlug) : null;
    if (isFr) return cat?.nameFr || s.name;
    return cat?.name || s.nameEn || s.name;
  };
  const descForSkill = (s: {
    name: string;
    desc: string;
    skillSlug?: string;
    skillLevel?: number;
  }) => {
    if (s.name === "Emplacement libre") {
      return isFr
        ? "Compétence apprenable — emplacement libre jusqu'au premium training."
        : "Learnable skill — slot stays open until premium training.";
    }
    const cat = s.skillSlug ? getSkill(s.skillSlug) : null;
    const prog =
      cat && s.skillLevel != null
        ? cat.progression.find((p) => p.level === s.skillLevel) ?? null
        : null;
    if (isFr) {
      return (
        prog?.renderedDescFr ||
        cat?.descriptionTemplateFr ||
        s.desc
      );
    }
    return prog?.renderedDesc || cat?.descriptionTemplate || s.desc;
  };

  // Identify signature skills (the ones added by training) by cross-referencing
  // the base skills array. A signature is a slot whose skillType is NOT
  // present in the base loadout.
  const baseSkillTypes = new Set(
    g.skills.map((s) => s.skillType).filter((t): t is number => t != null)
  );
  const signatureSkills = view.skills.filter(
    (s) => s.skillType != null && !baseSkillTypes.has(s.skillType)
  );

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">
          {t("nav.home")}
        </Link>
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link href="/world-conqueror-4" className="text-dim">
          {t("nav.wc4")}
        </Link>
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link href="/world-conqueror-4/generaux" className="text-dim">
          {t("nav.generals")}
        </Link>
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link
          href={`/world-conqueror-4/generaux/${slug}`}
          className="text-dim"
        >
          {name}
        </Link>
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <span>{t("general.premiumTrainingMode")}</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20">
        <header className="bg-panel border-2 border-red-500/40 rounded-lg p-6 mb-6 grid md:grid-cols-[220px_1fr] gap-6 bg-[linear-gradient(135deg,rgba(200,55,45,0.10)_0%,rgba(200,55,45,0.02)_100%),#1a2230]">
          {(g.image?.photoTrained || g.image?.photo) && (
            <div className="relative h-[220px] rounded-lg border-2 border-red-500/60 overflow-hidden bg-[linear-gradient(135deg,#2a0f12,#12161e)]">
              <Image
                src={(g.image?.photoTrained || g.image?.photo) as string}
                alt={`${name} (premium trained)`}
                fill
                sizes="220px"
                className="object-contain p-2"
                priority
              />
              <span className="absolute top-2 right-2 text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border bg-red-500/20 border-red-500/40 text-red-300">
                ⚔ PREMIUM
              </span>
            </div>
          )}
          <div>
            <h1 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-gold2">
              <span className="text-4xl md:text-5xl font-black uppercase tracking-wide">{family}</span>
              {given && <span className="text-lg md:text-xl font-semibold text-dim">{given}</span>}
              <span className="text-lg md:text-xl italic text-dim">— {t("general.premiumTrainingMode")}</span>
            </h1>
            <p className="text-muted mt-2">
              {t("premiumTrainingPage.intro", { name })}
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <Link
                href={`/world-conqueror-4/generaux/${slug}`}
                className="text-sm text-gold hover:underline"
              >
                {t("premiumTrainingPage.backToBase")}
              </Link>
              <Link
                href={
                  locale === "fr"
                    ? `/world-conqueror-4/generaux/${slug}/entraine`
                    : `/world-conqueror-4/generals/${slug}/trained`
                }
                className="text-sm text-gold hover:underline"
              >
                {t("general.viewMaxed")}
              </Link>
            </div>
          </div>
        </header>

        <StatsGrid attributes={view.attributes} mode="trained" />

        {signatureSkills.length > 0 && (
          <section className="border-2 border-red-500/40 rounded-lg p-6 mb-6 bg-[linear-gradient(135deg,rgba(200,55,45,0.08)_0%,rgba(200,55,45,0.01)_100%),#1a2230]">
            <h2 className="text-red-300 font-bold uppercase tracking-widest text-lg mb-4">
              ⚔ {t("premiumTrainingPage.signatureSkills")}
            </h2>
            <div className="space-y-3">
              {signatureSkills.map((s) => (
                <div
                  key={s.slot}
                  className="border border-red-500/40 rounded p-3 bg-bg3 flex items-start gap-3"
                >
                  {s.icon && (
                    <div className="w-12 h-12 rounded-md border border-red-500/40 bg-bg3 relative overflow-hidden flex-shrink-0">
                      <Image
                        src={s.icon}
                        alt={nameForSkill(s)}
                        fill
                        sizes="48px"
                        className="object-contain p-1"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-muted text-[10px] uppercase tracking-widest font-bold">
                        Slot {s.slot}
                      </span>
                      {s.skillSlug ? (
                        <Link
                          href={`/world-conqueror-4/competences/${s.skillSlug}` as any}
                          className="text-red-300 font-bold text-sm hover:underline no-underline"
                        >
                          {nameForSkill(s)}
                        </Link>
                      ) : (
                        <span className="text-red-300 font-bold text-sm">
                          {nameForSkill(s)}
                        </span>
                      )}
                      {s.skillLevel != null && (
                        <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/40 text-red-300">
                          L{s.skillLevel}
                        </span>
                      )}
                      <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded border bg-red-500/15 border-red-500/40 text-red-300">
                        🆕 Signature
                      </span>
                    </div>
                    <div className="text-dim text-sm leading-relaxed">{descForSkill(s)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section
          id="skills"
          className="bg-panel border border-border rounded-lg p-6 mb-6"
        >
          <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
            ⚡ {t("premiumTrainingPage.finalLoadout")}
          </h2>
          <div className="space-y-3">
            {view.skills.map((s) => {
              const isSignature =
                s.skillType != null && !baseSkillTypes.has(s.skillType);
              return (
                <div
                  key={s.slot}
                  className={`border rounded p-3 flex items-start gap-3 ${
                    isSignature
                      ? "border-red-500/40 bg-red-500/5"
                      : "border-border bg-bg3"
                  }`}
                >
                  {s.icon && (
                    <div className="w-12 h-12 rounded-md border border-gold/40 bg-bg3 relative overflow-hidden flex-shrink-0">
                      <Image
                        src={s.icon}
                        alt={nameForSkill(s)}
                        fill
                        sizes="48px"
                        className="object-contain p-1"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-muted text-[10px] uppercase tracking-widest font-bold">
                        Slot {s.slot}
                      </span>
                      <span className="font-bold text-gold2">
                        {nameForSkill(s)}
                      </span>
                      {s.skillLevel != null && (
                        <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-gold/15 border border-gold/40 text-gold2">
                          L{s.skillLevel}
                        </span>
                      )}
                    </div>
                    <div className="text-dim text-sm leading-relaxed">{descForSkill(s)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {(view.totalSwordCost != null || view.totalSceptreCost != null) && (
          <section className="bg-panel border border-border rounded-lg p-6 mb-6">
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              ⚔ {t("premiumTrainingPage.totalCost")}
            </h2>
            <dl className="grid grid-cols-2 gap-4">
              <div className="border border-gold/30 rounded-lg p-4 bg-bg3 text-center">
                <dt className="text-muted text-[11px] uppercase tracking-widest mb-1">
                  {t("premiumTrainingPage.swords")}
                </dt>
                <dd className="text-3xl font-extrabold text-gold tabular-nums">
                  ⚔ {view.totalSwordCost ?? "—"}
                </dd>
              </div>
              <div className="border border-gold/30 rounded-lg p-4 bg-bg3 text-center">
                <dt className="text-muted text-[11px] uppercase tracking-widest mb-1">
                  {t("premiumTrainingPage.sceptres")}
                </dt>
                <dd className="text-3xl font-extrabold text-gold tabular-nums">
                  🪄 {view.totalSceptreCost ?? "—"}
                </dd>
              </div>
            </dl>
            {view.summary && (
              <p className="text-sm text-muted mt-4 italic">{view.summary}</p>
            )}
            {g.training?.stages && g.training.stages.length > 0 && (
              <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.training.stages.map((stage) => (
                  <div
                    key={stage.stage}
                    className="border border-gold/30 rounded-lg p-3 bg-bg3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gold2 font-bold text-xs uppercase tracking-widest">
                        {stage.label || `Étape ${stage.stage}`}
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
                    {stage.notes && (
                      <div className="text-muted text-[11px] italic">
                        {stage.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${g.nameEn || g.name} (Premium Training) — World Conqueror 4`,
            about: {
              "@type": "VideoGame",
              name: "World Conqueror 4",
              gamePlatform: ["Android", "iOS"],
              publisher: { "@type": "Organization", name: "EasyTech" },
            },
            author: { "@type": "Organization", name: "EasyTech Wiki" },
            inLanguage: locale,
            description: g.shortDesc,
          }),
        }}
      />
    </>
  );
}
