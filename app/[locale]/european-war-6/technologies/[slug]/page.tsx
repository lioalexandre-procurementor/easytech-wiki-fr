import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { getAllTechSlugs, getTech } from "@/lib/ew6";
import { locales, type Locale } from "@/src/i18n/config";
import type { Metadata } from "next";

export function generateStaticParams() {
  const slugs = getAllTechSlugs();
  return locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const tech = getTech(slug) as any;
  if (!tech) return { title: "404" };
  const t = await getTranslations({ locale, namespace: "techPage" });
  const name = locale === "fr" ? tech.nameFr || tech.nameEn : tech.nameEn;
  return {
    title: `${name} — ${t("hubTitle")}`,
    description: t("techDetailIntro", { name, max: tech.maxLevel }),
    alternates: {
      canonical: `/${locale}/european-war-6/technologies/${slug}`,
      languages: {
        fr: `/fr/european-war-6/technologies/${slug}`,
        en: `/en/european-war-6/technologies/${slug}`,
        de: `/de/european-war-6/technologies/${slug}`,
        "x-default": `/fr/european-war-6/technologies/${slug}`,
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function TechDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  const tech = getTech(slug) as any;
  if (!tech) notFound();
  const t = await getTranslations();
  const loc = locale as Locale;
  const name = loc === "fr" ? tech.nameFr || tech.nameEn : tech.nameEn;

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 pb-20">
        <nav className="mt-4 mb-5">
          <Link
            href={"/european-war-6/technologies" as any}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-panel hover:border-gold hover:bg-gold/5 text-dim hover:text-gold2 text-sm font-semibold transition-colors no-underline"
          >
            {t("techPage.backToHub" as any)}
          </Link>
        </nav>

        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gold2 mb-2">
            {name}
          </h1>
          <p className="text-dim text-base max-w-3xl leading-relaxed">
            {t("techPage.techDetailIntro" as any, { name, max: tech.maxLevel })}
          </p>
          <div className="text-muted text-[10px] uppercase tracking-widest mt-2">
            {t(`techPage.category.${tech.category}` as any)} ·{" "}
            {t("techPage.needHQ" as any, { level: tech.needHQLv })}
          </div>
        </header>

        {(() => {
          const longDesc =
            loc === "fr"
              ? tech.longDesc
              : loc === "de"
                ? (tech.longDescDe ?? tech.longDescEn ?? tech.longDesc)
                : (tech.longDescEn ?? tech.longDesc);
          if (!longDesc) return null;
          return (
            <section className="bg-panel border border-border rounded-lg p-6 mb-6">
              <p className="text-ink text-sm leading-relaxed">{longDesc}</p>
            </section>
          );
        })()}

        {tech.levels.length === 0 ? (
          <div className="bg-panel border border-border rounded-lg p-6 text-dim text-sm">
            No levels available.
          </div>
        ) : (
          <section className="bg-panel border border-border rounded-lg p-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-muted text-[10px] uppercase tracking-widest p-3 border-b border-border">
                    {t("techPage.levelLabel" as any, { level: "" }).trim()}
                  </th>
                  <th className="text-right text-muted text-[10px] uppercase tracking-widest p-3 border-b border-border">
                    {t("techPage.costGold" as any)}
                  </th>
                  <th className="text-right text-muted text-[10px] uppercase tracking-widest p-3 border-b border-border">
                    {t("techPage.costIndustry" as any)}
                  </th>
                  <th className="text-right text-muted text-[10px] uppercase tracking-widest p-3 border-b border-border">
                    {t("techPage.costEnergy" as any)}
                  </th>
                  <th className="text-right text-muted text-[10px] uppercase tracking-widest p-3 border-b border-border">
                    {t("techPage.costTech" as any)}
                  </th>
                  <th className="text-left text-muted text-[10px] uppercase tracking-widest p-3 border-b border-border">
                    Effet
                  </th>
                </tr>
              </thead>
              <tbody>
                {tech.levels.map((lv: any) => (
                  <tr key={lv.level} className="border-b border-border/30">
                    <td className="p-3 text-gold2 font-bold tabular-nums">
                      L{lv.level}
                    </td>
                    <td className="p-3 text-right tabular-nums text-ink">
                      {lv.costGold}
                    </td>
                    <td className="p-3 text-right tabular-nums text-ink">
                      {lv.costIndustry}
                    </td>
                    <td className="p-3 text-right tabular-nums text-ink">
                      {lv.costEnergy}
                    </td>
                    <td className="p-3 text-right tabular-nums text-ink">
                      {lv.costTech}
                    </td>
                    <td className="p-3 text-dim text-xs">
                      {lv.descEn ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
      <Footer />
    </>
  );
}
