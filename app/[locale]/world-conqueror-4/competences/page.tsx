import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { SkillsBrowserClient } from "@/components/SkillsBrowserClient";
import { getSkillIndex } from "@/lib/units";
import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { locales } from "@/src/i18n/config";
import { pageAlternates } from "@/lib/seo-alternates";
import type { SkillSeriesMeta } from "@/lib/types";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const titles: Record<string, string> = {
    fr: "Compétences de World Conqueror 4 — Catalogue complet (FR)",
    en: "World Conqueror 4 Skills — Complete Catalog",
    de: "World Conqueror 4 Fähigkeiten — Vollständiger Katalog (DE)",
  };
  const descriptions: Record<string, string> = {
    fr: "Toutes les compétences de WC4 organisées comme en jeu : Tactiques de terrain, Commandement, Logistique, Défense, Offensive, plus toutes les compétences spécifiques aux généraux avec progression L1→L5.",
    en: "Every WC4 skill organised as in-game: Field Tactics, Command, Logistics, Defense, Offense, plus all general-specific skills with L1→L5 progression.",
    de: "Alle WC4-Fähigkeiten wie im Spiel gegliedert: Feldtaktik, Kommando, Logistik, Verteidigung, Offensive, sowie alle generalspezifischen Fähigkeiten mit Progression L1→L5.",
  };
  return {
    title: titles[locale] ?? titles.en,
    description: descriptions[locale] ?? descriptions.en,
    alternates: pageAlternates(locale, {
      fr: "/world-conqueror-4/competences",
      en: "/world-conqueror-4/skills",
      de: "/world-conqueror-4/skills",
    }),
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Display order: learnable series (1..5) first, signature (series 0) last.
// This matches the user expectation of seeing generic skills they can slot
// into any general before the hero-locked signatures at the bottom.
const SERIES_DISPLAY_ORDER = [1, 2, 3, 4, 5, 0];

export default async function SkillsBrowser({
  params,
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations();
  const tL = (fr: string, en: string, de: string): string =>
    params.locale === "fr" ? fr : params.locale === "de" ? de : en;
  const isFr = params.locale === "fr";
  const index = getSkillIndex();
  const seriesMap = new Map<number, SkillSeriesMeta>();
  for (const s of index.series) seriesMap.set(s.series, s);

  const sectionsInOrder = SERIES_DISPLAY_ORDER
    .map((num) => seriesMap.get(num))
    .filter((s): s is SkillSeriesMeta => !!s);

  const totalCount = index.skills.length;

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">
          {t("nav.home")}
        </Link>{" "}
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link href="/world-conqueror-4" className="text-dim">
          {t("nav.wc4")}
        </Link>{" "}
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <span>{t("nav.skills")}</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20 grid lg:grid-cols-[240px_1fr] gap-7">
        <aside className="bg-panel border border-border rounded-lg p-4 h-fit lg:sticky lg:top-20">
          <h4 className="text-gold2 text-xs uppercase tracking-widest mb-1.5 border-b border-border pb-1.5">
            {t("nav.seriesHeading")}
          </h4>
          <ul className="list-none text-sm">
            {sectionsInOrder.map((s) => (
              <li key={s.series}>
                <a
                  href={`#series-${s.series}`}
                  className="block px-2 py-1 text-dim no-underline hover:text-gold2"
                >
                  {s.icon} {s.label} ({s.count})
                </a>
              </li>
            ))}
          </ul>
          <h4 className="text-gold2 text-xs uppercase tracking-widest mt-4 mb-1.5 border-b border-border pb-1.5">
            {t("nav.navigationHeading")}
          </h4>
          <ul className="list-none text-sm">
            <li>
              <Link
                href="/world-conqueror-4"
                className="block px-2 py-1 text-dim no-underline hover:text-gold2"
              >
                {t("nav.backToHubWc4")}
              </Link>
            </li>
            <li>
              <Link
                href="/world-conqueror-4/generaux"
                className="block px-2 py-1 text-dim no-underline hover:text-gold2"
              >
                👨‍✈️ {t("nav.generals")}
              </Link>
            </li>
            <li>
              <Link
                href="/world-conqueror-4/unites-elite"
                className="block px-2 py-1 text-dim no-underline hover:text-gold2"
              >
                🏅 {t("nav.eliteUnits")}
              </Link>
            </li>
          </ul>
        </aside>

        <main>
          <section
            className="hero-surface border border-border rounded-lg p-6 mb-6 shadow-panel"
          >
            <h1 className="text-3xl text-gold2 font-extrabold mb-2">
              ⚡ {t("skillsPage.h1")}
            </h1>
            <p className="text-dim max-w-3xl">
              <strong>{t("skillsPage.introBold", { count: totalCount })}</strong>{" "}
              {t("skillsPage.intro")}{" "}
              <em>{t("skillsPage.introSignature")}</em>{" "}
              {t("skillsPage.introEnd")}
            </p>
            <p className="text-muted text-xs mt-3">
              {t("skillsPage.introFootnote")}
            </p>
          </section>

          <SkillsBrowserClient
            sections={sectionsInOrder}
            allSkills={index.skills}
            isFr={isFr}
            t={{
              searchPlaceholder: t("skillsPage.searchPlaceholder"),
              searchNoResults: t("skillsPage.searchNoResults"),
              signatureBadge: t("skillsPage.signatureBadge"),
            }}
          />
        </main>
      </div>
      <Footer />
    </>
  );
}
