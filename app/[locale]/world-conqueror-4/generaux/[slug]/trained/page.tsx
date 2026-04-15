import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { StatsGrid } from "@/components/general/StatsGrid";
import { buildTrainedView } from "@/lib/general-trained";
import { getAllGeneralSlugs, getGeneral, getSkill } from "@/lib/units";
import { splitGeneralName } from "@/lib/general-name";
import { locales, type Locale } from "@/src/i18n/config";
import type { Metadata } from "next";

/**
 * "Maxed out" variant of the general page.
 *
 * Shows the general at their theoretical ceiling: every attribute at `max`
 * and every skill projected to its catalog `maxLevel`. Applies to ALL 104
 * generals — NOT the premium training path (that lives under
 * `/entrainement-premium`). Kept under the legacy `/trained` URL so existing
 * inbound links keep working.
 */

export function generateStaticParams() {
  const slugs = getAllGeneralSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const g = getGeneral(slug);
  if (!g) return { title: "404" };
  const t = await getTranslations({ locale, namespace: "trainedPage" });
  const name = g.nameEn || g.name;
  // Canonical points back to base to avoid duplicate-content penalty.
  const baseSlugSegment = locale === "fr" ? "generaux" : "generals";
  return {
    title: t("seoTitle", { name }),
    description: t("seoDesc", { name }),
    alternates: {
      canonical: `/${locale}/world-conqueror-4/${baseSlugSegment}/${slug}`,
      languages: {
        fr: `/fr/world-conqueror-4/generaux/${slug}/entraine`,
        en: `/en/world-conqueror-4/generals/${slug}/trained`,
        "x-default": `/fr/world-conqueror-4/generaux/${slug}/entraine`,
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

export default async function TrainedGeneralPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);

  const g = getGeneral(slug);
  if (!g) notFound();

  const trained = buildTrainedView(g);
  const t = await getTranslations();
  const name = g.nameEn || g.name;
  const isFr = locale === "fr";
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

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">{t("nav.home")}</Link>
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link href="/world-conqueror-4" className="text-dim">{t("nav.wc4")}</Link>
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link href="/world-conqueror-4/generaux" className="text-dim">{t("nav.generals")}</Link>
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link
          href={`/world-conqueror-4/generaux/${slug}`}
          className="text-dim"
        >
          {name}
        </Link>
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <span>{t("general.maxedMode")}</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20">
        <header className="bg-panel border border-border rounded-lg p-6 mb-6 grid md:grid-cols-[220px_1fr] gap-6">
          {(g.image?.photoTrained || g.image?.photo) && (
            <div className="relative h-[220px] rounded-lg border-2 border-gold overflow-hidden bg-[linear-gradient(135deg,#1a2230,#12161e)]">
              <Image
                src={(g.image?.photoTrained || g.image?.photo) as string}
                alt={`${name} (maxed out)`}
                fill
                sizes="220px"
                className="object-contain p-2"
                priority
              />
              <span className="absolute top-2 right-2 text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border bg-gold/20 border-gold/40 text-gold2">
                ★ MAX
              </span>
            </div>
          )}
          <div>
            <h1 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-gold2">
              <span className="text-4xl md:text-5xl font-black uppercase tracking-wide">{family}</span>
              {given && <span className="text-lg md:text-xl font-semibold text-dim">{given}</span>}
              <span className="text-lg md:text-xl italic text-dim">— {t("general.maxedMode")}</span>
            </h1>
            <p className="text-muted mt-2">{t("trainedPage.intro", { name })}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Link
                href={`/world-conqueror-4/generaux/${slug}`}
                className="text-sm text-gold hover:underline"
              >
                {t("trainedPage.backToBase")}
              </Link>
              {g.hasTrainingPath && g.trainedSkills && g.trainedSkills.length > 0 && (
                <Link
                  href={
                    locale === "fr"
                      ? `/world-conqueror-4/generaux/${slug}/entrainement-premium`
                      : `/world-conqueror-4/generals/${slug}/premium-training`
                  }
                  className="text-sm text-red-300 hover:underline"
                >
                  {t("general.viewPremiumTraining")}
                </Link>
              )}
            </div>
          </div>
        </header>

        <StatsGrid attributes={trained.attributes} mode="trained" />

        <section
          id="skills"
          className="bg-panel border border-border rounded-lg p-6 mb-6"
        >
          <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
            ⚡ {t("general.skills")} ({t("general.maxedMode")})
          </h2>
          <p className="text-muted text-xs mb-4 italic">
            {t("general.maxedModeHint")}
          </p>
          <div className="space-y-3">
            {trained.skills.map((s) => (
              <div key={s.slot} className="border border-border rounded p-3 bg-bg3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-muted text-[10px] uppercase tracking-widest font-bold">
                    Slot {s.slot}
                  </span>
                  <span className="font-bold text-gold2">
                    {nameForSkill(s)}
                  </span>
                  {s.skillLevel != null && (
                    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-gold/15 border border-gold/40 text-gold2">
                      L{s.skillLevel} MAX
                    </span>
                  )}
                </div>
                <div className="text-sm text-dim mt-1 leading-relaxed">{descForSkill(s)}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${g.nameEn || g.name} (Trained) — World Conqueror 4`,
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
