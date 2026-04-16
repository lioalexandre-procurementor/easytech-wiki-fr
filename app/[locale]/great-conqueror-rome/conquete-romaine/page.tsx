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
} from "@/lib/gcr";
import { localizedUnitField } from "@/lib/localized-copy";
import type { Category } from "@/lib/types";
import type { Metadata } from "next";
import { locales } from "@/src/i18n/config";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "barbarianPage" });
  return {
    title: t("seoTitle"),
    description: t("seoDescription"),
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const CAT_ORDER: Category[] = ["infantry", "cavalry", "archer", "navy"];

export default async function BarbarianHub({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations();
  const units = getUnitsByFaction("barbarian");
  const generals = getGeneralsByFaction("barbarian");
  const CAT = getCategoryMeta(params.locale);
  const GENERAL_CAT = getGeneralCategoryMeta(params.locale);
  const FACTION = getFactionMeta(params.locale);
  const meta = FACTION.barbarian;

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">{t("nav.home")}</Link>{" "}
        <span className="mx-2 text-border">›</span>
        <Link href="/great-conqueror-rome" className="text-dim">Great Conqueror: Rome</Link>{" "}
        <span className="mx-2 text-border">›</span>
        <span>{t("barbarianPage.breadcrumbCurrent")}</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20 grid lg:grid-cols-[240px_1fr] gap-7">
        <aside className="bg-panel border border-border rounded-lg p-4 h-fit lg:sticky lg:top-20">
          <h4 className="text-gold2 text-xs uppercase tracking-widest mb-1.5 border-b border-border pb-1.5">
            {t("nav.onThisPage")}
          </h4>
          <ul className="list-none text-sm">
            <li><a href="#lore" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("barbarianPage.tocLore")}</a></li>
            <li><a href="#generaux" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("barbarianPage.tocCaptains")}</a></li>
            <li><a href="#unites" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("barbarianPage.tocUnits")}</a></li>
          </ul>
          <h4 className="text-gold2 text-xs uppercase tracking-widest mt-4 mb-1.5 border-b border-border pb-1.5">
            {t("nav.navigationHeading")}
          </h4>
          <ul className="list-none text-sm">
            <li><Link href="/great-conqueror-rome" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("barbarianPage.navBackToHub")}</Link></li>
            <li><Link href="/great-conqueror-rome/unites-elite" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("barbarianPage.navEliteUnits")}</Link></li>
            <li><Link href="/great-conqueror-rome/generaux" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("barbarianPage.navAllGenerals")}</Link></li>
          </ul>
        </aside>

        <main>
          {/* HERO */}
          <section
            className="bg-panel border rounded-lg p-9 mb-6 relative overflow-hidden"
            style={{
              borderColor: meta.color,
              background:
                "linear-gradient(135deg, rgba(139,58,46,0.15) 0%, rgba(80,20,10,0.12) 100%), #1a1418",
            }}
          >
            <div className="text-5xl mb-3">🦅</div>
            <h1 className="text-4xl font-extrabold mb-2" style={{ color: meta.color }}>
              {t("barbarianPage.h1")}
            </h1>
            <p className="text-dim text-sm uppercase tracking-widest mb-4">
              {t("barbarianPage.subtitle")}
            </p>
            <p className="text-ink text-base max-w-3xl leading-relaxed mb-5">
              {t.rich("barbarianPage.heroParagraph", {
                b: (chunks) => <b>{chunks}</b>,
                i: (chunks) => <i>{chunks}</i>,
              })}
            </p>
            <div className="flex flex-wrap gap-7">
              <Stat n={units.length} l={t("barbarianPage.statBarbarianUnits")} />
              <Stat n={generals.length} l={t("barbarianPage.statCaptains")} />
              <Stat n={t("barbarianPage.statEraValue")} l={t("barbarianPage.statEra")} />
            </div>
          </section>

          {/* LORE */}
          <section id="lore" className="bg-panel border border-border rounded-lg p-6 mb-6">
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              {t("barbarianPage.loreHeading")}
            </h2>
            <div className="text-dim text-sm leading-relaxed space-y-3">
              <p>
                {t.rich("barbarianPage.loreP1", {
                  b: (chunks) => <b>{chunks}</b>,
                  i: (chunks) => <i>{chunks}</i>,
                })}
              </p>
              <p>
                {t.rich("barbarianPage.loreP2", {
                  b: (chunks) => <b>{chunks}</b>,
                  i: (chunks) => <i>{chunks}</i>,
                })}
              </p>
              <p className="text-amber-300/80">
                {t.rich("barbarianPage.loreWarning", {
                  b: (chunks) => <b>{chunks}</b>,
                })}
              </p>
            </div>
          </section>

          {/* GENERALS */}
          <section id="generaux" className="mb-8">
            <h2 className="text-2xl mb-4">{t("barbarianPage.captainsHeading")}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {generals.map((g) => (
                <Link
                  key={g.slug}
                  href={`/great-conqueror-rome/generaux/${g.slug}`}
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
                        <span aria-hidden="true">🦅</span>
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

          <AdSlot name="listingBottom" label={t("barbarianPage.adSlot")} className="my-6" />

          {/* UNITS */}
          <section id="unites">
            <h2 className="text-2xl mb-4 mt-8">{t("barbarianPage.unitsHeading")}</h2>
            {CAT_ORDER.map((cat) => {
              const list = units.filter((u) => u.category === cat);
              if (list.length === 0) return null;
              const cmeta = CAT[cat];
              return (
                <div key={cat} className="mb-7">
                  <h3 className="text-lg mb-3">
                    {cmeta.icon} {cmeta.plural}{" "}
                    <span className="text-muted text-xs uppercase tracking-widest ml-2">
                      {t("barbarianPage.unitCountLabel", { count: list.length })}
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
