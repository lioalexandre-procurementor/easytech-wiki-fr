import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { UnitRow } from "@/components/UnitRow";
import { getUnitsByFaction, getCategoryMeta } from "@/lib/ew6";
import type { Category } from "@/lib/types";
import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { locales } from "@/src/i18n/config";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const titleByLocale: Record<string, string> = {
    fr: "Toutes les unités d'élite de Great Conqueror: Rome (FR) — Stats & Perks",
    en: "All Elite Units in Great Conqueror: Rome — Stats & Perks",
    de: "Alle Elite-Einheiten in Great Conqueror: Rome — Werte & Boni",
  };
  const descByLocale: Record<string, string> = {
    fr: "Liste complète des unités d'élite standard de GCR par catégorie : infanterie, cavalerie, archers, marine. Stats, tier list, perks niveau par niveau.",
    en: "Full list of GCR standard elite units by category: infantry, cavalry, archers, navy. Stats, tier list, per-level perks.",
    de: "Komplette Liste der Standard-Elite-Einheiten in GCR nach Kategorie: Infanterie, Kavallerie, Bogenschützen, Marine. Werte, Tier-Liste, Boni Stufe für Stufe.",
  };
  return {
    title: titleByLocale[locale] ?? titleByLocale.en,
    description: descByLocale[locale] ?? descByLocale.en,
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const ORDER: Category[] = ["infantry", "cavalry", "artillery", "navy"];

export default async function ElitesList({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations();
  const CAT = getCategoryMeta(params.locale);
  const all = getUnitsByFaction("standard");

  return (
    <>
      <TopBar/>
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">{t("nav.home")}</Link>{" "}
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link href="/european-war-6" className="text-dim">{t("nav.ew6")}</Link>{" "}
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <span>{t("nav.eliteUnits")}</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20 grid lg:grid-cols-[240px_1fr] gap-7">
        <aside className="bg-panel border border-border rounded-lg p-4 h-fit lg:sticky lg:top-20">
          <h4 className="text-gold2 text-xs uppercase tracking-widest mb-1.5 border-b border-border pb-1.5">{t("nav.categoriesHeading")}</h4>
          <ul className="list-none">
            <li><a href="#all" className="block px-2 py-1 rounded text-sm text-gold2 font-bold no-underline">{t("elitesPage.allLabel")} ({all.length})</a></li>
            {ORDER.map(c => (
              <li key={c}><a href={`#${c}`} className="block px-2 py-1 rounded text-sm text-dim no-underline hover:text-gold2">
                {CAT[c].icon} {CAT[c].plural} ({all.filter(u => u.category === c).length})
              </a></li>
            ))}
          </ul>
          <h4 className="text-gold2 text-xs uppercase tracking-widest mt-4 mb-1.5 border-b border-border pb-1.5">{t("nav.navigationHeading")}</h4>
          <ul className="list-none">
            <li><Link href="/european-war-6" className="block px-2 py-1 rounded text-sm text-dim no-underline hover:text-gold2">{t("nav.backToHubGcr")}</Link></li>
            <li><Link href="/european-war-6/generaux" className="block px-2 py-1 rounded text-sm text-dim no-underline hover:text-gold2">👨‍✈️ {t("nav.generals")}</Link></li>
          </ul>
        </aside>

        <main id="all">
          <section className="bg-panel border border-border rounded-lg p-6 mb-6"
            style={{ background: "linear-gradient(135deg, rgba(212,164,74,0.12) 0%, rgba(200,55,45,0.08) 100%), #1a2230" }}>
            <h1 className="text-3xl text-gold2 font-extrabold mb-2">{t("elitesPage.h1")}</h1>
            <p className="text-dim max-w-3xl">
              <b>{t("elitesPage.introBold", { count: all.length })}</b> {t("elitesPage.intro")}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 items-center">
              <span className="text-amber-300/80 text-xs">
                {t("elitesPage.statsWarning")}
              </span>
            </div>
          </section>

          {ORDER.map(cat => {
            const units = all.filter(u => u.category === cat);
            if (units.length === 0) return null;
            const meta = CAT[cat];
            return (
              <section key={cat} id={cat} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl">{meta.icon} {meta.plural} {t("elitesPage.sectionSuffix")}</h2>
                  <span className="bg-gold text-[#0f1419] text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">{units.length} {t("elitesPage.unitsCountSuffix")}</span>
                </div>
                <div className="grid gap-2.5">
                  {units.map(u => <UnitRow key={u.slug} unit={u} locale={params.locale}/>)}
                </div>
              </section>
            );
          })}
        </main>
      </div>
      <Footer/>
    </>
  );
}
