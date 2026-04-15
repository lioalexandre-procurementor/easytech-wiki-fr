import Image from "next/image";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { AdSlot } from "@/components/AdSlot";
import {
  getAllGenerals,
  getGeneralCategoryMeta,
  getFactionMeta,
  COUNTRY_FLAGS,
} from "@/lib/units";
import { countryLabel } from "@/lib/countries";
import { localizedUnitField } from "@/lib/localized-copy";
import type { GeneralCategory, GeneralData, GeneralQuality } from "@/lib/types";
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

const QUALITY_META: Record<
  GeneralQuality,
  { icon: string; bg: string; border: string; text: string }
> = {
  bronze: {
    icon: "🥉",
    bg: "rgba(180,110,60,0.15)",
    border: "rgba(205,127,50,0.5)",
    text: "#e8a574",
  },
  silver: {
    icon: "🥈",
    bg: "rgba(180,180,190,0.12)",
    border: "rgba(192,192,192,0.5)",
    text: "#d7d7de",
  },
  gold: {
    icon: "🥇",
    bg: "rgba(212,164,74,0.18)",
    border: "rgba(212,164,74,0.6)",
    text: "#e8c678",
  },
  marshal: {
    icon: "👑",
    bg: "rgba(200,55,45,0.15)",
    border: "rgba(200,55,45,0.55)",
    text: "#f0a090",
  },
};

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
  const standard = all.filter((g) => g.faction === "standard");
  const scorpion = all.filter((g) => g.faction === "scorpion");

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
                  <a
                    href={`#cat-${c}`}
                    className="block px-2 py-1 text-dim no-underline hover:text-gold2"
                  >
                    {m.icon} {m.label} ({count})
                  </a>
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

          {/* STANDARD */}
          <section id="standard" className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl">🌍 {tL("Généraux Standard", "Standard generals", "Standard-Generäle")}</h2>
              <span className="bg-gold text-[#0f1419] text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                {standard.length}
              </span>
            </div>

            {CAT_ORDER.map((cat) => {
              const list = standard.filter((g) => g.category === cat);
              if (list.length === 0) return null;
              const m = GENERAL_CAT[cat];
              return (
                <div key={cat} id={`cat-${cat}`} className="mb-6">
                  <h3 className="text-lg text-gold2 mb-3">
                    {m.icon} {m.label}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map((g) => (
                      <GeneralCard key={g.slug} g={g} locale={params.locale} qualityLabel={t(`general.quality.${g.quality}`)} trainingLabel={t("general.trainingLabel")} freeSlotLabel={t("general.freeSlotShort")} acqLabels={{
                        starter: t("acquisitionTypes.starter"),
                        medals: t("acquisitionTypes.medals"),
                        "iron-cross": t("acquisitionTypes.iron-cross"),
                        coin: t("acquisitionTypes.coin"),
                        campaign: t("acquisitionTypes.campaign"),
                        event: t("acquisitionTypes.event"),
                      }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>

          <AdSlot name="listingBottom" label={t("ui.adSlot")} className="my-6" />

          {/* SCORPION */}
          <section id="scorpion" className="mb-10">
            <div className="flex items-center gap-3 mb-4 mt-6">
              <h2 className="text-2xl">🦂 {FACTION.scorpion.label}</h2>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-widest text-white"
                style={{ background: FACTION.scorpion.color }}
              >
                {scorpion.length} {tL("capitaines", "captains", "Hauptmänner")}
              </span>
            </div>
            <p className="text-dim text-sm mb-4">
              {tL(
                "Les trois capitaines de l'Empire du Scorpion — obtenables via le pack campagne des généraux terroristes.",
                "The three Scorpion Empire captains — obtainable via the terrorist generals campaign pack.",
                "Die drei Hauptmänner des Skorpion-Imperiums — erhältlich über das Kampagnenpaket der Terroristen-Generäle."
              )}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scorpion.map((g) => (
                <GeneralCard
                  key={g.slug}
                  g={g}
                  scorpion
                  locale={params.locale}
                  qualityLabel={t(`general.quality.${g.quality}`)}
                  trainingLabel={t("general.trainingLabel")}
                  freeSlotLabel={t("general.freeSlotShort")}
                  acqLabels={{
                    starter: t("acquisitionTypes.starter"),
                    medals: t("acquisitionTypes.medals"),
                    "iron-cross": t("acquisitionTypes.iron-cross"),
                    coin: t("acquisitionTypes.coin"),
                    campaign: t("acquisitionTypes.campaign"),
                    event: t("acquisitionTypes.event"),
                  }}
                />
              ))}
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}

function GeneralCard({
  g,
  scorpion,
  locale,
  qualityLabel,
  trainingLabel,
  freeSlotLabel,
  acqLabels,
}: {
  g: GeneralData;
  scorpion?: boolean;
  locale: string;
  qualityLabel: string;
  trainingLabel: string;
  freeSlotLabel: string;
  acqLabels: Record<string, string>;
}) {
  const GENERAL_CAT = getGeneralCategoryMeta(locale);
  const m = GENERAL_CAT[g.category];
  const q = QUALITY_META[g.quality];
  const replaceableCount = g.skills.filter((s) => s.replaceable).length;
  const isFr = locale === "fr";
  return (
    <Link
      href={`/world-conqueror-4/generaux/${g.slug}` as any}
      className={`block bg-panel border rounded-lg p-4 transition-colors no-underline ${
        scorpion ? "hover:border-red-500" : "hover:border-gold"
      }`}
      style={scorpion ? { borderColor: "#3a1f26" } : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        {g.image?.head ? (
          <div
            className="w-14 h-14 rounded-full overflow-hidden relative border"
            style={{
              borderColor: scorpion ? "#c8372d" : "#d4a44a",
              background: scorpion
                ? "linear-gradient(135deg, #4a0f12, #c8372d)"
                : "linear-gradient(135deg, #8b7d4a, #d4a44a)",
            }}
          >
            <Image
              src={g.image.head}
              alt={g.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className="w-14 h-14 rounded-full grid place-items-center text-xl font-extrabold text-white"
            style={{
              background: scorpion
                ? "linear-gradient(135deg, #4a0f12, #c8372d)"
                : "linear-gradient(135deg, #8b7d4a, #d4a44a)",
              color: scorpion ? "#fff" : "#0f1419",
            }}
          >
            {scorpion ? "🦂" : g.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </div>
        )}
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-[11px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${
              g.rank === "S"
                ? "bg-red-500/20 border border-red-500/40 text-red-300"
                : "bg-gold/20 border border-gold/40 text-gold2"
            }`}
          >
            Tier {g.rank}
          </span>
          <span
            className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border"
            style={{
              backgroundColor: q.bg,
              borderColor: q.border,
              color: q.text,
            }}
          >
            {q.icon} {qualityLabel}
          </span>
          <span className="text-[10px] text-muted uppercase tracking-widest">
            {COUNTRY_FLAGS[g.country] || "🏳"} {countryLabel(g.country, locale)}
          </span>
        </div>
      </div>
      <h3 className="text-gold2 font-bold text-base mb-1">{locale === "fr" ? g.name : g.nameEn || g.name}</h3>
      <div className="text-muted text-[10px] uppercase tracking-widest mb-2">
        {m.icon} {m.label}
      </div>
      <p className="text-dim text-xs leading-relaxed line-clamp-2 mb-3">{localizedUnitField(g as unknown as Record<string, unknown>, "shortDesc", locale)}</p>
      <div className="flex flex-wrap gap-1.5 mt-auto">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-bg3 border border-border text-dim">
          {acqIcon(g.acquisition.type)} {acqLabels[g.acquisition.type] || g.acquisition.type}
          {g.acquisition.cost != null && ` · ${g.acquisition.cost}`}
        </span>
        {g.hasTrainingPath && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-500/10 border border-red-500/40 text-red-300">
            {trainingLabel}
          </span>
        )}
        {replaceableCount > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gold/15 border border-gold/40 text-gold2">
            🎓 {replaceableCount} slot{replaceableCount > 1 ? "s" : ""} {freeSlotLabel}{replaceableCount > 1 && isFr ? "s" : ""}
          </span>
        )}
      </div>
    </Link>
  );
}

function acqIcon(type: string): string {
  return (
    {
      starter: "🥇",
      medals: "🎖",
      "iron-cross": "✠",
      coin: "🪙",
      campaign: "🎬",
      event: "📅",
    }[type] || "🎁"
  );
}
