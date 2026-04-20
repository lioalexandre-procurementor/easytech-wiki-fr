import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { AdSlot } from "@/components/AdSlot";
import {
  getAllGenerals,
  getGeneralCategoryMeta,
  getFactionMeta,
} from "@/lib/units";
import {
  GeneralsBrowserClient,
  type GeneralView,
} from "@/components/GeneralsBrowserClient";
import type { GeneralCategory, GeneralData } from "@/lib/types";
import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { locales } from "@/src/i18n/config";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const titles: Record<string, string> = {
    fr: "Tous les généraux de World Conqueror 4 (FR) — Tier List & Guides",
    en: "All World Conqueror 4 Generals — Tier List & Guides",
    de: "Alle Generäle von World Conqueror 4 — Tier-Liste & Guides",
  };
  const descriptions: Record<string, string> = {
    fr: "Liste complète des meilleurs généraux de WC4 : Guderian, Rommel, Patton, Rokossovsky, Konev, Zhukov, Dönitz, Montgomery, Osborn et les capitaines de l'Empire du Scorpion. Compétences, bonus et unités recommandées.",
    en: "Full list of the best WC4 generals: Guderian, Rommel, Patton, Rokossovsky, Konev, Zhukov, Dönitz, Montgomery, Osborn and the Scorpion Empire captains. Skills, bonuses and recommended units.",
    de: "Vollständige Liste der besten WC4-Generäle: Guderian, Rommel, Patton, Rokossowski, Konew, Schukow, Dönitz, Montgomery, Osborn und die Hauptmänner des Skorpion-Imperiums. Fähigkeiten, Boni und empfohlene Einheiten.",
  };
  return {
    title: titles[locale] ?? titles.en,
    description: descriptions[locale] ?? descriptions.en,
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const CAT_ORDER: GeneralCategory[] = [
  "tank",
  "artillery",
  "infantry",
  "navy",
  "airforce",
  "balanced",
];

// Skill names that make a general "economic": they boost gold / industry /
// technology output on the world map rather than combat stats. Matched against
// both base skills and trained skills (English canonical name).
const ECO_SKILL_NAMES = new Set([
  "Economic Expert",
  "Industrial Expert",
  "Supply Organization",
]);

function isEcoGeneral(g: GeneralData): boolean {
  const pools = [g.skills ?? [], g.trainedSkills ?? []];
  for (const pool of pools) {
    for (const sk of pool) {
      const name = sk.nameEn ?? sk.name;
      if (name && ECO_SKILL_NAMES.has(name)) return true;
    }
  }
  return false;
}

export default async function GeneralsList({
  params,
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations();
  const tL = (fr: string, en: string, de: string): string =>
    params.locale === "fr" ? fr : params.locale === "de" ? de : en;
  const GENERAL_CAT = getGeneralCategoryMeta(params.locale);
  const FACTION = getFactionMeta(params.locale);
  const all = getAllGenerals();
  const allWithEco: GeneralView[] = all.map((g) => ({
    ...g,
    isEco: isEcoGeneral(g),
  }));
  const standard = allWithEco.filter((g) => g.faction === "standard");
  const scorpion = allWithEco.filter((g) => g.faction === "scorpion");

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">{t("nav.home")}</Link>{" "}
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link href="/world-conqueror-4" className="text-dim">{t("nav.wc4")}</Link>{" "}
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <span>{t("nav.generals")}</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20 grid lg:grid-cols-[240px_1fr] gap-7">
        <aside className="bg-panel border border-border rounded-lg p-4 h-fit lg:sticky lg:top-20">
          <h4 className="text-gold2 text-xs uppercase tracking-widest mb-1.5 border-b border-border pb-1.5">
            {tL("Sections", "Sections", "Abschnitte")}
          </h4>
          <ul className="list-none text-sm">
            <li><a href="#standard" className="block px-2 py-1 text-dim no-underline hover:text-gold2">🌍 {tL("Généraux Standard", "Standard generals", "Standard-Generäle")} ({standard.length})</a></li>
            <li><a href="#scorpion" className="block px-2 py-1 text-dim no-underline hover:text-gold2">🦂 {t("nav.scorpion")} ({scorpion.length})</a></li>
          </ul>
          <h4 className="text-gold2 text-xs uppercase tracking-widest mt-4 mb-1.5 border-b border-border pb-1.5">
            {t("nav.categoriesHeading")}
          </h4>
          <ul className="list-none text-sm">
            {CAT_ORDER.map((c) => {
              const m = GENERAL_CAT[c];
              const count = all.filter((g) => g.category === c).length;
              if (count === 0) return null;
              return (
                <li key={c}>
                  <span className="block px-2 py-1 text-dim">
                    {m.icon} {m.label} ({count})
                  </span>
                </li>
              );
            })}
          </ul>
          <h4 className="text-gold2 text-xs uppercase tracking-widest mt-4 mb-1.5 border-b border-border pb-1.5">
            {t("nav.navigationHeading")}
          </h4>
          <ul className="list-none text-sm">
            <li><Link href="/world-conqueror-4" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("nav.backToHubWc4")}</Link></li>
            <li><Link href="/world-conqueror-4/unites-elite" className="block px-2 py-1 text-dim no-underline hover:text-gold2">🏅 {t("nav.eliteUnits")}</Link></li>
          </ul>
        </aside>

        <main>
          <section
            className="bg-panel border border-border rounded-lg p-6 mb-6"
            style={{
              background:
                "linear-gradient(135deg, rgba(212,164,74,0.12) 0%, rgba(200,55,45,0.08) 100%), #1a2230",
            }}
          >
            <h1 className="text-3xl text-gold2 font-extrabold mb-2">
              {tL("Généraux de World Conqueror 4", "World Conqueror 4 Generals", "Generäle von World Conqueror 4")}
            </h1>
            <p className="text-dim max-w-3xl">
              {params.locale === "fr" ? (
                <>
                  {all.length} commandants répertoriés : les meilleurs généraux du roster standard
                  (Guderian, Rommel, Patton, Rokossovsky, Konev…) et les trois capitaines de l'Empire du Scorpion.
                  Chaque fiche détaille les compétences, bonus et unités à coupler.
                </>
              ) : params.locale === "de" ? (
                <>
                  {all.length} Kommandanten katalogisiert: die besten Generäle des Standard-Rosters
                  (Guderian, Rommel, Patton, Rokossowski, Konew…) und die drei Hauptmänner des
                  Skorpion-Imperiums. Jeder Eintrag behandelt Fähigkeiten, Boni und empfohlene Einheiten.
                </>
              ) : (
                <>
                  {all.length} commanders catalogued: the best generals from the standard roster
                  (Guderian, Rommel, Patton, Rokossovsky, Konev…) and the three captains of the
                  Scorpion Empire. Each entry covers skills, bonuses and recommended units.
                </>
              )}
            </p>
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded text-amber-200 text-xs">
              ⚠️ <strong>{t("wc4Hub.underConstruction")}</strong> — {t("wc4Hub.underConstructionNote")}
            </div>
          </section>

          <GeneralsBrowserClient
            standard={standard}
            scorpion={scorpion}
            locale={params.locale}
            categoriesMeta={GENERAL_CAT}
            scorpionColor={FACTION.scorpion.color}
            labels={{
              standardHeading: tL(
                "Généraux Standard",
                "Standard generals",
                "Standard-Generäle"
              ),
              scorpionHeading: FACTION.scorpion.label,
              scorpionSubtitle: tL(
                "Les trois capitaines de l'Empire du Scorpion — obtenables via le pack campagne des généraux terroristes.",
                "The three Scorpion Empire captains — obtainable via the terrorist generals campaign pack.",
                "Die drei Hauptmänner des Skorpion-Imperiums — erhältlich über das Kampagnenpaket der Terroristen-Generäle."
              ),
              scorpionCaptains: tL("capitaines", "captains", "Hauptmänner"),
              searchPlaceholder: tL(
                "Rechercher un général…",
                "Search generals…",
                "Generäle suchen…"
              ),
              filterHeading: tL("Catégorie", "Category", "Kategorie"),
              allLabel: tL("Tous", "All", "Alle"),
              ecoLabel: tL("Éco", "Eco", "Wirtschaft"),
              trainedToggleLabel: tL(
                "Entraînés uniquement (Épée/Sceptre)",
                "Trained only (Sword/Sceptre)",
                "Nur trainierbar (Schwert/Zepter)"
              ),
              noResults: tL(
                "Aucun général ne correspond à ces filtres.",
                "No general matches these filters.",
                "Keine Generäle entsprechen diesen Filtern."
              ),
              qualityLabels: {
                bronze: t("general.quality.bronze"),
                silver: t("general.quality.silver"),
                gold: t("general.quality.gold"),
                marshal: t("general.quality.marshal"),
              },
              trainingLabel: t("general.trainingLabel"),
              freeSlotLabel: t("general.freeSlotShort"),
              acqLabels: {
                starter: t("acquisitionTypes.starter"),
                medals: t("acquisitionTypes.medals"),
                "iron-cross": t("acquisitionTypes.iron-cross"),
                coin: t("acquisitionTypes.coin"),
                campaign: t("acquisitionTypes.campaign"),
                event: t("acquisitionTypes.event"),
              },
            }}
          />

          <AdSlot name="listingBottom" label={t("ui.adSlot")} className="my-6" />
        </main>
      </div>
      <Footer />
    </>
  );
}
