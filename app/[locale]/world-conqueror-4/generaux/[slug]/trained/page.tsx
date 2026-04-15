import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { StatsGrid } from "@/components/general/StatsGrid";
import { buildTrainedView } from "@/lib/general-trained";
import { getAllGeneralSlugs, getGeneral } from "@/lib/units";
import { locales, type Locale } from "@/src/i18n/config";
import type { Metadata } from "next";

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
        <span>{t("general.trainedMode")}</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20">
        <header className="bg-panel border border-border rounded-lg p-6 mb-6 grid md:grid-cols-[220px_1fr] gap-6">
          {g.image?.photoTrained && (
            <div className="relative h-[220px] rounded-lg border-2 border-gold overflow-hidden bg-[linear-gradient(135deg,#1a2230,#12161e)]">
              <Image
                src={g.image.photoTrained}
                alt={`${name} (trained)`}
                fill
                sizes="220px"
                className="object-contain p-2"
                priority
              />
              <span className="absolute top-2 right-2 text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border bg-gold/20 border-gold/40 text-gold2">
                ⚔ Trained
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gold2">
              {name} — {t("general.trainedMode")}
            </h1>
            <p className="text-muted mt-2">{t("trainedPage.intro", { name })}</p>
            <Link
              href={`/world-conqueror-4/generaux/${slug}`}
              className="inline-block mt-4 text-sm text-gold hover:underline"
            >
              {t("trainedPage.backToBase")}
            </Link>
          </div>
        </header>

        <StatsGrid attributes={trained.attributes} mode="trained" />

        <section
          id="skills"
          className="bg-panel border border-border rounded-lg p-6 mb-6"
        >
          <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
            ⚡ {t("general.skills")} ({t("general.trainedMode")})
          </h2>
          <div className="space-y-3">
            {trained.skills.map((s) => (
              <div key={s.slot} className="border border-border rounded p-3 bg-bg3">
                <div className="font-bold text-gold">
                  #{s.slot} — {s.nameEn || s.name}
                </div>
                <div className="text-sm text-muted mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {(trained.totalSwordCost != null || trained.totalSceptreCost != null) && (
          <section className="bg-panel border border-border rounded-lg p-6 mb-6">
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              ⚔ {t("trainedPage.totalCost")}
            </h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-muted text-sm">{t("trainedPage.swords")}</dt>
                <dd className="text-xl font-bold text-gold tabular-nums">
                  {trained.totalSwordCost ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-sm">{t("trainedPage.sceptres")}</dt>
                <dd className="text-xl font-bold text-gold tabular-nums">
                  {trained.totalSceptreCost ?? "—"}
                </dd>
              </div>
            </dl>
            {trained.summary && (
              <p className="text-sm text-muted mt-4">{trained.summary}</p>
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
