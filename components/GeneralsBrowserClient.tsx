"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Link } from "@/src/i18n/navigation";
import { COUNTRY_FLAGS } from "@/lib/units";
import { countryLabel } from "@/lib/countries";
import { localizedUnitField } from "@/lib/localized-copy";
import type { GeneralCategory, GeneralData, GeneralQuality } from "@/lib/types";

export type GeneralView = GeneralData & { isEco: boolean };

type CategoryMeta = Record<GeneralCategory, { icon: string; label: string }>;

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

const FILTER_CATEGORIES: GeneralCategory[] = [
  "tank",
  "artillery",
  "infantry",
  "navy",
  "airforce",
  "balanced",
];

type Labels = {
  standardHeading: string;
  scorpionHeading: string;
  scorpionSubtitle: string;
  scorpionCaptains: string;
  searchPlaceholder: string;
  filterHeading: string;
  allLabel: string;
  ecoLabel: string;
  trainedToggleLabel: string;
  noResults: string;
  qualityLabels: Record<GeneralQuality, string>;
  trainingLabel: string;
  freeSlotLabel: string;
  acqLabels: Record<string, string>;
};

export function GeneralsBrowserClient({
  standard,
  scorpion,
  locale,
  categoriesMeta,
  scorpionColor,
  labels,
}: {
  standard: GeneralView[];
  scorpion: GeneralView[];
  locale: string;
  categoriesMeta: CategoryMeta;
  scorpionColor: string;
  labels: Labels;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<GeneralCategory | "eco" | null>(null);
  const [trainedOnly, setTrainedOnly] = useState(false);

  const filterFn = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (g: GeneralView) => {
      if (trainedOnly && !g.hasTrainingPath) return false;
      if (category === "eco") {
        if (!g.isEco) return false;
      } else if (category && g.category !== category) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        g.name,
        g.nameEn,
        g.nameCanonical,
        g.countryName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    };
  }, [query, category, trainedOnly]);

  const filteredStandard = useMemo(
    () => standard.filter(filterFn),
    [standard, filterFn]
  );
  const filteredScorpion = useMemo(
    () => scorpion.filter(filterFn),
    [scorpion, filterFn]
  );

  const totalCount = filteredStandard.length + filteredScorpion.length;
  const isFiltering =
    query.trim().length > 0 || category !== null || trainedOnly;

  return (
    <>
      <section className="bg-panel border border-border rounded-lg p-4 mb-6 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="w-full md:max-w-sm bg-bg3 border border-border rounded-md px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-gold"
          />
          <label className="inline-flex items-center gap-2 text-xs text-dim cursor-pointer select-none">
            <input
              type="checkbox"
              checked={trainedOnly}
              onChange={(e) => setTrainedOnly(e.target.checked)}
              className="accent-gold"
            />
            <span>⚔️ {labels.trainedToggleLabel}</span>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted uppercase tracking-widest mr-1">
            {labels.filterHeading}
          </span>
          <FilterChip
            active={category === null}
            onClick={() => setCategory(null)}
          >
            {labels.allLabel}
          </FilterChip>
          {FILTER_CATEGORIES.map((c) => {
            const m = categoriesMeta[c];
            return (
              <FilterChip
                key={c}
                active={category === c}
                onClick={() => setCategory(category === c ? null : c)}
              >
                {m.icon} {m.label}
              </FilterChip>
            );
          })}
          <FilterChip
            active={category === "eco"}
            onClick={() => setCategory(category === "eco" ? null : "eco")}
          >
            💰 {labels.ecoLabel}
          </FilterChip>
        </div>
      </section>

      {isFiltering && totalCount === 0 && (
        <p className="text-muted italic mb-10">{labels.noResults}</p>
      )}

      {filteredStandard.length > 0 && (
        <section id="standard" className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl">🌍 {labels.standardHeading}</h2>
            <span className="bg-gold text-[#0f1419] text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
              {filteredStandard.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStandard.map((g) => (
              <GeneralCard
                key={g.slug}
                g={g}
                locale={locale}
                categoriesMeta={categoriesMeta}
                qualityLabel={labels.qualityLabels[g.quality]}
                trainingLabel={labels.trainingLabel}
                freeSlotLabel={labels.freeSlotLabel}
                acqLabels={labels.acqLabels}
              />
            ))}
          </div>
        </section>
      )}

      {filteredScorpion.length > 0 && (
        <section id="scorpion" className="mb-10">
          <div className="flex items-center gap-3 mb-4 mt-6">
            <h2 className="text-2xl">🦂 {labels.scorpionHeading}</h2>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-widest text-white"
              style={{ background: scorpionColor }}
            >
              {filteredScorpion.length} {labels.scorpionCaptains}
            </span>
          </div>
          {!isFiltering && (
            <p className="text-dim text-sm mb-4">{labels.scorpionSubtitle}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredScorpion.map((g) => (
              <GeneralCard
                key={g.slug}
                g={g}
                scorpion
                locale={locale}
                categoriesMeta={categoriesMeta}
                qualityLabel={labels.qualityLabels[g.quality]}
                trainingLabel={labels.trainingLabel}
                freeSlotLabel={labels.freeSlotLabel}
                acqLabels={labels.acqLabels}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[11px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded border transition-colors ${
        active
          ? "bg-gold/25 border-gold text-gold2"
          : "bg-bg3 border-border text-dim hover:border-gold/60 hover:text-gold2"
      }`}
    >
      {children}
    </button>
  );
}

function GeneralCard({
  g,
  scorpion,
  locale,
  categoriesMeta,
  qualityLabel,
  trainingLabel,
  freeSlotLabel,
  acqLabels,
}: {
  g: GeneralView;
  scorpion?: boolean;
  locale: string;
  categoriesMeta: CategoryMeta;
  qualityLabel: string;
  trainingLabel: string;
  freeSlotLabel: string;
  acqLabels: Record<string, string>;
}) {
  const m = categoriesMeta[g.category];
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
      <h3 className="text-gold2 font-bold text-base mb-1">
        {locale === "fr" ? g.name : g.nameEn || g.name}
      </h3>
      <div className="text-muted text-[10px] uppercase tracking-widest mb-2">
        {m.icon} {m.label}
      </div>
      <p className="text-dim text-xs leading-relaxed line-clamp-2 mb-3">
        {localizedUnitField(g as unknown as Record<string, unknown>, "shortDesc", locale)}
      </p>
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
