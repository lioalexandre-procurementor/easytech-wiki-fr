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
} from "@/lib/gcr";
import { countryLabel } from "@/lib/countries";
import { localizedUnitField } from "@/lib/localized-copy";
import { isPlaceholder } from "@/lib/placeholder";
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
    fr: "Tous les généraux de Great Conqueror: Rome (FR) — Tier List & Guides",
    en: "All Great Conqueror: Rome Generals — Tier List & Guides",
    de: "Alle Generäle von Great Conqueror: Rome — Tier-Liste & Guides",
  };
  const descriptions: Record<string, string> = {
    fr: "Liste complète des généraux de GCR : César, Hannibal, Alexandre, Scipion, Spartacus. Compétences, bonus et légions recommandées.",
    en: "Full list of GCR generals: Caesar, Hannibal, Alexander, Scipio, Spartacus. Skills, bonuses and recommended legions.",
    de: "Vollständige Liste der GCR-Generäle: Caesar, Hannibal, Alexander, Scipio, Spartacus. Fähigkeiten, Boni und empfohlene Legionen.",
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
  "infantry",
  "cavalry",
  "archer",
  "navy",
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

export default async function GCRGeneralsList({
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
  const barbarian = all.filter((g) => g.faction === "barbarian");

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">{t("nav.home")}</Link>{" "}
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link href="/great-conqueror-rome" className="text-dim">{t("nav.gcr")}</Link>{" "}
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <span>{t("nav.generals")}</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20 grid lg:grid-cols-[240px_1fr] gap-7">
        <aside className="bg-panel border border-border rounded-lg p-4 h-fit lg:sticky lg:top-20">
          <h4 className="text-gold2 text-xs uppercase tracking-widest mb-1.5 border-b border-border pb-1.5">
            {tL("Sections", "Sections", "Abschnitte")}
          </h4>
          <ul className="list-none text-sm">
            <li><a href="#standard" className="block px-2 py-1 text-dim no-underline hover:text-gold2">🏛 {FACTION.standard?.label ?? "Civilizations"} ({standard.length})</a></li>
            {barbarian.length > 0 && (
              <li><a href="#barbarian" className="block px-2 py-1 text-dim no-underline hover:text-gold2">⚔ {FACTION.barbarian?.label ?? "Barbarians"} ({barbarian.length})</a></li>
            )}
          </ul>
          <h4 className="text-gold2 text-xs uppercase tracking-widest mt-4 mb-1.5 border-b border-border pb-1.5">
            {t("nav.categoriesHeading")}
          </h4>
          <ul className="list-none text-sm">
            {CAT_ORDER.map((c) => {
              const m = GENERAL_CAT[c];
              if (!m) return null;
              const count = all.filter((g) => g.category === c).length;
              if (count === 0) return null;
              return (
                <li key={c}>
                  <a href={`#cat-${c}`} className="block px-2 py-1 text-dim no-underline hover:text-gold2">
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
            <li><Link href="/great-conqueror-rome" className="block px-2 py-1 text-dim no-underline hover:text-gold2">{t("nav.backToHubGcr")}</Link></li>
            <li><Link href="/great-conqueror-rome/unites-elite" className="block px-2 py-1 text-dim no-underline hover:text-gold2">🏅 {t("nav.eliteUnits")}</Link></li>
          </ul>
        </aside>

        <main>
          <section
            className="bg-panel border border-border rounded-lg p-6 mb-6"
            style={{
              background: "linear-gradient(135deg, rgba(212,164,74,0.12) 0%, rgba(139,58,46,0.10) 100%), #1a2230",
            }}
          >
            <h1 className="text-3xl text-gold2 font-extrabold mb-2">
              {tL("Généraux de Great Conqueror: Rome", "Great Conqueror: Rome Generals", "Generäle von Great Conqueror: Rome")}
            </h1>
            <p className="text-dim max-w-3xl">
              {params.locale === "fr" ? (
                <>
                  {all.length} commandants répertoriés : les meilleurs généraux antiques
                  (César, Hannibal, Alexandre, Scipion…).
                  Chaque fiche détaille les compétences, attributs et stratégies de combat.
                </>
              ) : params.locale === "de" ? (
                <>
                  {all.length} Kommandanten katalogisiert: die besten antiken Generäle
                  (Caesar, Hannibal, Alexander, Scipio…).
                  Jeder Eintrag behandelt Fähigkeiten, Attribute und Kampfstrategien.
                </>
              ) : (
                <>
                  {all.length} commanders catalogued: the best ancient generals
                  (Caesar, Hannibal, Alexander, Scipio…).
                  Each entry covers skills, attributes and battle strategies.
                </>
              )}
            </p>
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded text-amber-200 text-xs">
              ⚠️ <strong>{t("gcrHub.underConstruction")}</strong> — {t("gcrHub.underConstructionNote")}
            </div>
          </section>

          {/* STANDARD / CIVILIZATIONS */}
          <section id="standard" className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl">🏛 {FACTION.standard?.label ?? "Civilizations"}</h2>
              <span className="bg-gold text-[#0f1419] text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                {standard.length}
              </span>
            </div>

            {CAT_ORDER.map((cat) => {
              const list = standard.filter((g) => g.category === cat);
              if (list.length === 0) return null;
              const m = GENERAL_CAT[cat];
              if (!m) return null;
              return (
                <div key={cat} id={`cat-${cat}`} className="mb-6">
                  <h3 className="text-lg text-gold2 mb-3">{m.icon} {m.label}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map((g) => (
                      <GCRGeneralCard key={g.slug} g={g} locale={params.locale} qualityLabel={t(`general.quality.${g.quality}`)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>

          <AdSlot name="listingBottom" label={t("ui.adSlot")} className="my-6" />

          {/* BARBARIANS */}
          {barbarian.length > 0 && (
            <section id="barbarian" className="mb-10">
              <div className="flex items-center gap-3 mb-4 mt-6">
                <h2 className="text-2xl">⚔ {FACTION.barbarian?.label ?? "Barbarians"}</h2>
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-widest text-white"
                  style={{ background: FACTION.barbarian?.color ?? "#8b3a2e" }}
                >
                  {barbarian.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {barbarian.map((g) => (
                  <GCRGeneralCard key={g.slug} g={g} locale={params.locale} barbarian qualityLabel={t(`general.quality.${g.quality}`)} />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}

function GCRGeneralCard({
  g,
  locale,
  barbarian,
  qualityLabel,
}: {
  g: GeneralData;
  locale: string;
  barbarian?: boolean;
  qualityLabel: string;
}) {
  const GENERAL_CAT = getGeneralCategoryMeta(locale);
  const m = GENERAL_CAT[g.category];
  const q = QUALITY_META[g.quality] ?? QUALITY_META.bronze;
  return (
    <Link
      href={`/great-conqueror-rome/generaux/${g.slug}` as any}
      className={`block bg-panel border rounded-lg p-4 transition-colors no-underline ${
        barbarian ? "hover:border-red-500" : "hover:border-gold"
      }`}
      style={barbarian ? { borderColor: "#3a1f26" } : undefined}
      rel={isPlaceholder(g) ? "nofollow" : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        {g.image?.head ? (
          <div
            className="w-14 h-14 rounded-full overflow-hidden relative border"
            style={{
              borderColor: barbarian ? "#8b3a2e" : "#d4a44a",
              background: barbarian
                ? "linear-gradient(135deg, #4a0f12, #8b3a2e)"
                : "linear-gradient(135deg, #8b7d4a, #d4a44a)",
            }}
          >
            <Image src={g.image.head} alt={g.name} fill sizes="56px" className="object-cover" />
          </div>
        ) : (
          <div
            className="w-14 h-14 rounded-full grid place-items-center text-xl font-extrabold"
            style={{
              background: barbarian
                ? "linear-gradient(135deg, #4a0f12, #8b3a2e)"
                : "linear-gradient(135deg, #8b7d4a, #d4a44a)",
              color: barbarian ? "#fff" : "#0f1419",
            }}
          >
            {g.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
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
            style={{ backgroundColor: q.bg, borderColor: q.border, color: q.text }}
          >
            {q.icon} {qualityLabel}
          </span>
          <span className="text-[10px] text-muted uppercase tracking-widest">
            {COUNTRY_FLAGS[g.country] || "🏳"} {countryLabel(g.country, locale)}
          </span>
        </div>
      </div>
      <h3 className="text-gold2 font-bold text-base mb-1">
        {locale === "fr" ? g.name : g.nameEn || g.name}
      </h3>
      {m && (
        <div className="text-muted text-[10px] uppercase tracking-widest mb-2">
          {m.icon} {m.label}
        </div>
      )}
      <p className="text-dim text-xs leading-relaxed line-clamp-2 mb-3">
        {localizedUnitField(g as unknown as Record<string, unknown>, "shortDesc", locale)}
      </p>
      <div className="flex flex-wrap gap-1.5 mt-auto">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-bg3 border border-border text-dim">
          {g.acquisition?.type === "medals" ? "🎖" : "🪙"}{" "}
          {g.acquisition?.type ?? "—"}
          {g.acquisition?.cost != null && ` · ${g.acquisition.cost}`}
        </span>
      </div>
    </Link>
  );
}
