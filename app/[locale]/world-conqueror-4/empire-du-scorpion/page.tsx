import Image from "next/image";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { UnitCard } from "@/components/UnitCard";
import { AdSlot } from "@/components/AdSlot";
import {
  getUnitsByFaction,
  getGeneralsByFaction,
  getCategoryMeta,
  getGeneralCategoryMeta,
  getFactionMeta,
} from "@/lib/units";
import { localizedUnitField } from "@/lib/localized-copy";
import type { Category } from "@/lib/types";
import type { Metadata } from "next";
import { locales } from "@/src/i18n/config";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "scorpionPage" });
  return {
    title: t("seoTitle"),
    description: t("seoDescription"),
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const CAT_ORDER: Category[] = ["tank", "infantry", "artillery", "navy", "airforce"];

export default async function ScorpionHub({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations();
  const units = getUnitsByFaction("scorpion");
  const generals = getGeneralsByFaction("scorpion");
  const CAT = getCategoryMeta(params.locale);
  const GENERAL_CAT = getGeneralCategoryMeta(params.locale);
  const FACTION = getFactionMeta(params.locale);
  const meta = FACTION.scorpion;

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">{t("nav.home")}</Link>{" "}
        <span className="mx-2 text-border">›</span>
        <Link href="/world-conqueror-4" className="text-dim">World Conqueror 4</Link>{" "}
        <span className="mx-2 text-border">›</span>
        <span>{t("scorpionPage.breadcrumbCurrent")}</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20 grid lg:grid-cols-[240px_1fr] gap-7">
        <aside className="bg-panel border border-border rounded-lg p-4 h-fit lg:sticky lg:top-20">
          <h4 className="text-gold2 text-xs uppercase tracking-widest mb-1.5 border-b border-border pb-1.5">
            {t("nav.onThisPage")}
          </h4>
          <ul className="list-none text-sm">
            <li><a href="#lore" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("scorpionPage.tocLore")}</a></li>
            <li><a href="#generaux" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("scorpionPage.tocCaptains")}</a></li>
            <li><a href="#unites" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("scorpionPage.tocUnits")}</a></li>
          </ul>
          <h4 className="text-gold2 text-xs uppercase tracking-widest mt-4 mb-1.5 border-b border-border pb-1.5">
            {t("nav.navigationHeading")}
          </h4>
          <ul className="list-none text-sm">
            <li><Link href="/world-conqueror-4" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("scorpionPage.navBackToHub")}</Link></li>
            <li><Link href="/world-conqueror-4/unites-elite" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("scorpionPage.navEliteUnits")}</Link></li>
            <li><Link href="/world-conqueror-4/generaux" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("scorpionPage.navAllGenerals")}</Link></li>
          </ul>
        </aside>

        <main>
          {/* HERO */}
          <section
            className="bg-panel border rounded-lg p-9 mb-6 relative overflow-hidden"
            style={{
              borderColor: meta.color,
              background:
                "linear-gradient(135deg, rgba(200,55,45,0.15) 0%, rgba(139,0,0,0.12) 100%), #1a1418",
            }}
          >
            <div className="text-5xl mb-3">🦂</div>
            <h1 className="text-4xl font-extrabold mb-2" style={{ color: meta.color }}>
              {t("scorpionPage.h1")}
            </h1>
            <p className="text-dim text-sm uppercase tracking-widest mb-4">
              {t("scorpionPage.subtitle")}
            </p>
            <p className="text-ink text-base max-w-3xl leading-relaxed mb-5">
              {t.rich("scorpionPage.heroParagraph", {
                b: (chunks) => <b>{chunks}</b>,
                i: (chunks) => <i>{chunks}</i>,
              })}
            </p>
            <div className="flex flex-wrap gap-7">
              <Stat n={units.length} l={t("scorpionPage.statMysticUnits")} />
              <Stat n={generals.length} l={t("scorpionPage.statCaptains")} />
              <Stat n={t("scorpionPage.statEraValue")} l={t("scorpionPage.statEra")} />
            </div>
          </section>

          {/* LORE */}
          <section id="lore" className="bg-panel border border-border rounded-lg p-6 mb-6">
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              {t("scorpionPage.loreHeading")}
            </h2>
            <div className="text-dim text-sm leading-relaxed space-y-3">
              <p>
                {t.rich("scorpionPage.loreP1", {
                  b: (chunks) => <b>{chunks}</b>,
                  i: (chunks) => <i>{chunks}</i>,
                })}
              </p>
              <p>
                {t.rich("scorpionPage.loreP2", {
                  b: (chunks) => <b>{chunks}</b>,
                  i: (chunks) => <i>{chunks}</i>,
                })}
              </p>
              <p className="text-amber-300/80">
                {t.rich("scorpionPage.loreWarning", {
                  b: (chunks) => <b>{chunks}</b>,
                })}
              </p>
            </div>
          </section>

          {/* GENERALS */}
          <section id="generaux" className="mb-8">
            <h2 className="text-2xl mb-4">{t("scorpionPage.captainsHeading")}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {generals.map((g) => (
                <Link
                  key={g.slug}
                  href={`/world-conqueror-4/generaux/${g.slug}`}
                  className="block bg-panel border border-border rounded-lg p-5 hover:border-red-500 transition-colors no-underline"
                  style={{ borderColor: "#3a1f26" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-14 h-14 rounded-full grid place-items-center text-2xl font-extrabold text-white overflow-hidden relative"
                      style={{
                        background: "linear-gradient(135deg, #4a0f12, #c8372d)",
                        border: "2px solid rgba(200,55,45,0.6)",
                      }}
                    >
                      {g.image?.head ? (
                        <Image
                          src={g.image.head}
                          alt={g.name}
                          width={56}
                          height={56}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span aria-hidden="true">🦂</span>
                      )}
                    </div>
                    <span className="bg-red-500/20 border border-red-500/40 text-red-300 text-[11px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded">
                      {g.rank}
                    </span>
                  </div>
                  <h3 className="text-gold2 font-bold text-lg mb-1">{g.name}</h3>
                  <div className="text-muted text-[10px] uppercase tracking-widest mb-2">
                    {GENERAL_CAT[g.category].icon} {GENERAL_CAT[g.category].label}
                  </div>
                  <p className="text-dim text-xs leading-relaxed line-clamp-3">{localizedUnitField(g as unknown as Record<string, unknown>, "shortDesc", params.locale)}</p>
                </Link>
              ))}
            </div>
          </section>

          <AdSlot name="listingBottom" label={t("scorpionPage.adSlot")} className="my-6" />

          {/* UNITS */}
          <section id="unites">
            <h2 className="text-2xl mb-4 mt-8">{t("scorpionPage.unitsHeading")}</h2>
            {CAT_ORDER.map((cat) => {
              const list = units.filter((u) => u.category === cat);
              if (list.length === 0) return null;
              const cmeta = CAT[cat];
              return (
                <div key={cat} className="mb-7">
                  <h3 className="text-lg mb-3">
                    {cmeta.icon} {cmeta.plural}{" "}
                    <span className="text-muted text-xs uppercase tracking-widest ml-2">
                      {t("scorpionPage.unitCountLabel", { count: list.length })}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map((u) => (
                      <UnitCard key={u.slug} unit={u} locale={params.locale} />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}

function Stat({ n, l }: { n: number | string; l: string }) {
  return (
    <div className="border-l-4 pl-3" style={{ borderColor: "#c8372d" }}>
      <div className="text-2xl font-extrabold" style={{ color: "#ff7d6b" }}>
        {n}
      </div>
      <div className="text-[11px] text-muted uppercase tracking-widest">{l}</div>
    </div>
  );
}
