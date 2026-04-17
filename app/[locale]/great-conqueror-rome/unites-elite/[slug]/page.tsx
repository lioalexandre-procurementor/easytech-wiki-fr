import Image from "next/image";
import { notFound } from "next/navigation";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { TierBadge } from "@/components/TierBadge";
import { UnitIcon } from "@/components/UnitIcon";
import { UnitDetailClient } from "@/components/UnitDetailClient";
import { AdSlot } from "@/components/AdSlot";
import { getAllSlugs, getEliteUnit, getCategoryMeta, COUNTRY_FLAGS, getUnitsByCategory, getFactionMeta, getAllGenerals } from "@/lib/gcr";
import { countryLabel } from "@/lib/countries";
import { localizedUnitField } from "@/lib/localized-copy";
import { loadEliteUnit } from "@/lib/content-editable";
import type { UnitData } from "@/lib/types";

/**
 * Placeholder detection — GCR entities auto-generated from decrypted game
 * files carry a boilerplate longDesc ending "à enrichir". Those pages are
 * not yet editorial quality (thin content for AdSense), so we noindex them
 * and skip ad rendering. See EasyTech-Wiki-SEO-Ads-Strategy-Assessment-2026-04-16.md.
 */
function isPlaceholderUnit(u: UnitData | null | undefined): boolean {
  if (!u) return false;
  return /à enrichir|Fiche générée automatiquement/i.test((u.longDesc ?? "") as string);
}
import {
  getEligibleGeneralsForUnit,
  UNIT_VOTE_THRESHOLD,
} from "@/lib/unit-general-vote";
import { getEditorialPick } from "@/lib/editorial-picks";
import UnitBestGeneralVote from "@/components/UnitBestGeneralVote";
import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { locales } from "@/src/i18n/config";

export function generateStaticParams() {
  const slugs = getAllSlugs();
  return locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }): Promise<Metadata> {
  const u = await loadEliteUnit(params.slug);
  if (!u) return { title: "404" };
  const { locale } = params;
  const titleByLocale: Record<string, string> = {
    fr: `${u.name} (GCR) — Stats, perks niveau 1-12 & généraux | Wiki FR`,
    en: `${u.name} (GCR) — Stats, level 1-12 perks & generals | Wiki`,
    de: `${u.name} (GCR) — Werte, Stufen 1–12 Boni & Generäle | Wiki DE`,
  };
  const shortDescLocalized = localizedUnitField(u as unknown as Record<string, unknown>, "shortDesc", locale);
  const descByLocale: Record<string, string> = {
    fr: `Fiche complète du ${u.name} dans Great Conqueror Rome : ${shortDescLocalized} Stats détaillées, perks niveau par niveau, généraux recommandés.`,
    en: `Complete profile of ${u.nameEn || u.name} in Great Conqueror Rome: ${shortDescLocalized} Detailed stats, per-level perks, recommended generals.`,
    de: `Komplettes Profil der ${u.nameEn || u.name} in Great Conqueror Rome: ${shortDescLocalized} Detaillierte Werte, Boni pro Stufe, empfohlene Generäle.`,
  };
  return {
    title: titleByLocale[locale] ?? titleByLocale.en,
    description: descByLocale[locale] ?? descByLocale.en,
    robots: isPlaceholderUnit(u as unknown as UnitData)
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export default async function UnitPage({ params }: { params: { locale: string; slug: string } }) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations();
  const tL = (fr: string, en: string, de: string): string =>
    params.locale === "fr" ? fr : params.locale === "de" ? de : en;
  const unit = await loadEliteUnit(params.slug);
  if (!unit) notFound();
  const placeholder = isPlaceholderUnit(unit as unknown as UnitData);

  const sameCat = getUnitsByCategory(unit.category, unit.faction)
    .filter(u => u.slug !== unit.slug)
    .slice(0, 3);
  const CAT = getCategoryMeta(params.locale);
  const FACTION = getFactionMeta(params.locale);
  const meta = CAT[unit.category];
  const factionMeta = FACTION[unit.faction];
  const isScorpion = unit.faction === "scorpion";
  const sidebarUnits = getUnitsByCategory(unit.category, unit.faction);

  // Auto-link recommended generals by name if not explicitly listed as slugs
  const allGens = getAllGenerals();
  const linkedGenerals = unit.recommendedGenerals
    .map(ref => {
      const lower = ref.toLowerCase();
      return allGens.find(g =>
        g.slug === lower ||
        g.name.toLowerCase() === lower ||
        g.name.toLowerCase().includes(lower)
      );
    })
    .filter((g): g is NonNullable<typeof g> => g !== undefined);
  // Also add generals that recommend this unit
  const reverseGens = allGens.filter(g => g.recommendedUnits.includes(unit.slug));
  const matchedGenerals = Array.from(
    new Map([...linkedGenerals, ...reverseGens].map(g => [g.slug, g])).values()
  );

  return (
    <>
      <TopBar/>
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">{t("nav.home")}</Link>{" "}
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link href="/great-conqueror-rome" className="text-dim">{t("nav.gcr")}</Link>{" "}
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link href="/great-conqueror-rome/unites-elite" className="text-dim">{t("nav.eliteUnits")}</Link>{" "}
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <span>{unit.name}</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20 grid lg:grid-cols-[240px_1fr] gap-7">
        <aside className="bg-panel border border-border rounded-lg p-4 h-fit lg:sticky lg:top-20">
          <h4 className="text-gold2 text-xs uppercase tracking-widest mb-1.5 border-b border-border pb-1.5">{t("nav.onThisPage")}</h4>
          <ul className="list-none text-sm">
            <li><a href="#stats" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{tL("Stats par niveau", "Per-level stats", "Werte pro Stufe")}</a></li>
            <li><a href="#slider" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{tL("Slider niveau 1-12", "Level 1-12 slider", "Stufen 1–12 Slider")}</a></li>
            <li><a href="#perks" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{tL("Perks détaillés", "Detailed perks", "Detaillierte Boni")}</a></li>
            <li><a href="#strategy" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{tL("Stratégie", "Strategy", "Strategie")}</a></li>
            <li><a href="#faq" className="block px-2 py-1 text-dim no-underline hover:text-gold2">FAQ</a></li>
          </ul>
          <h4 className="text-gold2 text-xs uppercase tracking-widest mt-4 mb-1.5 border-b border-border pb-1.5">
            {meta.plural} {isScorpion ? "(Scorpion)" : t("elitesPage.sectionSuffix")}
          </h4>
          <ul className="list-none text-sm">
            {sidebarUnits.map(u => (
              <li key={u.slug}>
                <Link href={`/great-conqueror-rome/unites-elite/${u.slug}` as any}
                  className={`block px-2 py-1 rounded no-underline ${u.slug === unit.slug ? "text-gold2 font-bold bg-gold/10 border-l-2 border-gold pl-2.5" : "text-dim hover:text-gold2"}`}>
                  {u.name}
                </Link>
              </li>
            ))}
          </ul>
          <h4 className="text-gold2 text-xs uppercase tracking-widest mt-4 mb-1.5 border-b border-border pb-1.5">{t("nav.navigationHeading")}</h4>
          <ul className="list-none text-sm">
            <li><Link href="/great-conqueror-rome/unites-elite" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{tL("← Toutes les unités d'élite", "← All elite units", "← Alle Elite-Einheiten")}</Link></li>
            {isScorpion && (
              <li><Link href="/great-conqueror-rome/empire-du-scorpion" className="block px-2 py-1 text-dim no-underline hover:text-gold2">🦂 {t("nav.scorpion")}</Link></li>
            )}
            <li><Link href="/great-conqueror-rome/generaux" className="block px-2 py-1 text-dim no-underline hover:text-gold2">👨‍✈️ {t("nav.generals")}</Link></li>
          </ul>
        </aside>

        <main>
          {unit.preliminary && (
            <div className="mb-4 p-3 rounded border border-amber-500/40 bg-amber-500/10 text-amber-200 text-xs leading-relaxed">
              ⚠️ <strong>{tL(
                "Données en cours de vérification",
                "Data being verified",
                "Daten werden überprüft"
              )}</strong>{" "}
              —{" "}
              {tL(
                "Cette fiche a été publiée dès la sortie du patch d'avril 2026. Seules les valeurs de niveau 1 et les compétences confirmées par captures d'écran en jeu sont fiables. Les niveaux 2 à 12 affichent des valeurs provisoires en attendant la progression complète. Toute erreur repérée peut être signalée via le lien « Signaler une erreur » en bas de page.",
                "This page was shipped as soon as the April 2026 patch dropped. Only Lv.1 values and perks confirmed from in-game screenshots are reliable. Levels 2–12 show placeholder values pending the full progression capture. Any mistake can be flagged via the \"Report a mistake\" link in the footer.",
                "Diese Seite wurde direkt mit dem April-2026-Patch veröffentlicht. Nur die Stufe-1-Werte und die durch Screenshots bestätigten Perks sind zuverlässig. Stufen 2–12 zeigen Platzhalterwerte, bis die vollständige Progression erfasst ist. Fehler können über den Link 'Fehler melden' im Footer gemeldet werden."
              )}
            </div>
          )}

          {/* HEADER */}
          <div className="grid md:grid-cols-[220px_1fr] gap-5 md:gap-7 bg-panel border border-border rounded-lg p-4 md:p-6 mb-6">
            <div className="rounded-lg border-2 border-gold h-[180px] md:h-[220px] w-full max-w-[200px] md:max-w-none mx-auto md:mx-0 grid place-items-center relative bg-gradient-to-br from-bg3 to-bg overflow-hidden">
              {unit.image?.sprite ? (
                <Image
                  src={unit.image.sprite}
                  alt={unit.name}
                  fill
                  sizes="(max-width: 768px) 200px, 220px"
                  className="object-contain p-4"
                  priority
                />
              ) : (
                <UnitIcon category={unit.category} country={unit.country} size={140}/>
              )}
              <div className="absolute top-2.5 right-2.5 z-10"><TierBadge tier={unit.tier} size="md"/></div>
            </div>
            <div>
              <h1 className="text-3xl text-gold2 font-extrabold mb-1">{params.locale === "fr" ? unit.name : unit.nameEn || unit.name}</h1>
              <div className="text-dim text-sm mb-4">{localizedUnitField(unit as unknown as Record<string, unknown>, "longDesc", params.locale).split(".")[0]}.</div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Tag accent>{meta.icon} {meta.label} {t("elitesPage.sectionSuffix")}</Tag>
                <Tag>{COUNTRY_FLAGS[unit.country]} {countryLabel(unit.country, params.locale)}</Tag>
                <Tag scorpion={isScorpion}>
                  {isScorpion ? "🦂" : "🌍"} {factionMeta.label}
                </Tag>
                <Tag>📊 {tL("Niveaux 1-12", "Levels 1-12", "Stufen 1–12")}</Tag>
                <Tag>🎁 {obtainabilityLabel(unit.obtainability, params.locale)}</Tag>
              </div>
              <p className="text-ink text-sm leading-relaxed">{localizedUnitField(unit as unknown as Record<string, unknown>, "longDesc", params.locale)}</p>
            </div>
          </div>


          {/* INTERACTIVE BLOCK */}
          <div id="stats"></div>
          <div id="slider"></div>
          <div id="perks"></div>
          <UnitDetailClient unit={unit}/>

          {!placeholder && (
            <AdSlot name="inArticleTop" label={t("ui.adSlot")} className="my-6" />
          )}

          {/* STRATEGY */}
          <div id="strategy" className="bg-panel border border-border rounded-lg p-6 mb-6">
            <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">⚔️ {tL("Stratégie et appariements", "Strategy & pairings", "Strategie und Paarungen")}</h3>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <h4 className="text-ink font-bold mb-2.5">👨‍✈️ {tL("Généraux recommandés", "Recommended generals", "Empfohlene Generäle")}</h4>
                <p className="text-dim text-sm mb-3">{tL("Les généraux les plus efficaces avec cette unité :", "The most effective generals paired with this unit:", "Die effektivsten Generäle für diese Einheit:")}</p>
                <div>
                  {matchedGenerals.length > 0 ? (
                    matchedGenerals.map(g => (
                      <Link
                        key={g.slug}
                        href={`/great-conqueror-rome/generaux/${g.slug}` as any}
                        className="inline-flex items-center gap-2 bg-bg3 border border-border px-3 py-1.5 rounded-full mr-1.5 mb-1.5 text-sm no-underline hover:border-gold transition-colors"
                      >
                        <span className="w-5 h-5 rounded-full grid place-items-center text-[10px] font-extrabold text-[#0f1419]"
                              style={{ background: "linear-gradient(135deg, #8b7d4a, #d4a44a)" }}>
                          {g.name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase()}
                        </span>
                        <span className="text-gold2">{g.name}</span>
                      </Link>
                    ))
                  ) : unit.recommendedGenerals.length > 0 ? (
                    unit.recommendedGenerals.map(g => (
                      <span key={g} className="inline-flex items-center gap-2 bg-bg3 border border-border px-3 py-1.5 rounded-full mr-1.5 mb-1.5 text-sm">
                        <span className="w-5 h-5 rounded-full grid place-items-center text-[10px] font-extrabold text-[#0f1419]"
                              style={{ background: "linear-gradient(135deg, #8b7d4a, #d4a44a)" }}>
                          {g.slice(0, 2).toUpperCase()}
                        </span>
                        {g}
                      </span>
                    ))
                  ) : (
                    <Link href="/great-conqueror-rome/generaux" className="text-dim text-sm no-underline hover:text-gold2">
                      {tL("Explorer les généraux du wiki →", "Browse all generals →", "Alle Generäle durchsuchen →")}
                    </Link>
                  )}
                </div>
                {/* Community vote — "best general for this unit". Placeholder
                    until UNIT_VOTE_THRESHOLD total votes, then top-3 podium. */}
                {(() => {
                  const eligible = getEligibleGeneralsForUnit("gcr", unit.slug);
                  if (eligible.length === 0) return null;
                  const candidates = eligible.map((g) => ({
                    slug: g.slug,
                    name: g.name,
                    nameEn: g.nameEn,
                    rank: (g.rank ?? null) as "S" | "A" | "B" | "C" | null,
                    country: g.country ?? null,
                    portrait: g.image?.head ?? null,
                  }));
                  const unitDisplayName =
                    params.locale === "fr" ? unit.name : unit.nameEn || unit.name;
                  const editorialPick = getEditorialPick("gcr", unit.slug);
                  return (
                    <UnitBestGeneralVote
                      game="gcr"
                      unitSlug={unit.slug}
                      unitDisplayName={unitDisplayName}
                      candidates={candidates}
                      threshold={UNIT_VOTE_THRESHOLD}
                      editorialSlug={editorialPick?.primary ?? undefined}
                      unitImage={unit.image?.sprite ?? null}
                    />
                  );
                })()}
              </div>
              <div>
                <h4 className="text-ink font-bold mb-2.5">📈 {tL("Ordre de leveling recommandé", "Recommended leveling order", "Empfohlene Level-Reihenfolge")}</h4>
                <ul className="list-none">
                  {unit.levelingPriority.map((step, i) => (
                    <li key={i} className="py-2 border-b border-border last:border-none text-sm text-dim flex gap-2.5">
                      <span className="text-ok font-bold">✓</span>
                      <span dangerouslySetInnerHTML={{ __html: step }}/>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* IN-ARTICLE MID AD — between Strategy and Related */}
          {!placeholder && (
            <AdSlot name="inArticleMid" label={t("ui.adSlot")} className="my-6" />
          )}

          {/* RELATED */}
          {sameCat.length > 0 && (
            <>
              <h2 className="text-xl mb-4 mt-8">{tL(`Comparer avec d'autres ${meta.plural.toLowerCase()} d'élite`, `Compare with other elite ${meta.plural.toLowerCase()}`, `Mit anderen Elite-${meta.plural} vergleichen`)}</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {sameCat.map(u => (
                  <Link key={u.slug} href={`/great-conqueror-rome/unites-elite/${u.slug}`}
                    className="block bg-panel border border-border rounded-lg p-4 hover:border-gold transition-all no-underline">
                    <div className="flex justify-between items-start mb-2">
                      {u.image?.sprite ? (
                        <div className="relative w-12 h-12">
                          <Image src={u.image.sprite} alt={u.name} fill sizes="48px" className="object-contain"/>
                        </div>
                      ) : (
                        <UnitIcon category={u.category} country={u.country} size={48}/>
                      )}
                      <TierBadge tier={u.tier} size="sm"/>
                    </div>
                    <h3 className="text-gold2 font-bold text-base mb-1">{params.locale === "fr" ? u.name : u.nameEn || u.name}</h3>
                    <p className="text-dim text-xs">{localizedUnitField(u as unknown as Record<string, unknown>, "shortDesc", params.locale)}</p>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* FAQ */}
          {(() => {
            // Pick the locale-specific FAQ list when available. Fallback chain: de → en → fr.
            const locale = params.locale;
            const localizedFaqs =
              locale === "fr" ? unit.faqs :
              locale === "de" ? (unit.faqsDe ?? unit.faqsEn ?? unit.faqs) :
              (unit.faqsEn ?? unit.faqs);
            if (!localizedFaqs || localizedFaqs.length === 0) return null;
            // Google-eligible FAQPage schema — emitted for the currently-rendered locale only.
            const faqSchema = {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: localizedFaqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            };
            return (
              <div id="faq" className="bg-panel border border-border rounded-lg p-6 mt-8">
                <script
                  type="application/ld+json"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                />
                <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">❓ {tL("Questions fréquentes", "Frequently asked questions", "Häufig gestellte Fragen")}</h3>
                {localizedFaqs.map((f, i) => (
                  <div key={i} className="border-b border-border last:border-none py-3.5">
                    <div className="font-bold text-ink mb-1.5 text-sm">{f.q}</div>
                    <div className="text-dim text-sm leading-relaxed">{f.a}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* SOURCES */}
          {unit.sources && unit.sources.length > 0 && (
            <div className="text-muted text-xs mt-6">
              <b>{tL("Sources :", "Sources:", "Quellen:")}</b> {unit.sources.join(" · ")}
            </div>
          )}
        </main>
      </div>
      <Footer/>
    </>
  );
}

function obtainabilityLabel(o: string, locale: string): string {
  const labels: Record<string, Record<string, string>> = {
    fr: { free: "Gratuite", event: "Événement", shop: "Boutique", premium: "Premium" },
    en: { free: "Free", event: "Event", shop: "Shop", premium: "Premium" },
    de: { free: "Kostenlos", event: "Event", shop: "Shop", premium: "Premium" },
  };
  const dict = labels[locale] ?? labels.en;
  if (o === "free") return dict.free;
  if (o === "event") return dict.event;
  if (o === "shop") return dict.shop;
  return dict.premium;
}

function Tag({ children, accent, scorpion }: { children: React.ReactNode; accent?: boolean; scorpion?: boolean }) {
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
    <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${accent ? "bg-gold/15 border-gold text-gold2" : "bg-bg3 border-border text-dim"}`}>
      {children}
    </span>
  );
}
