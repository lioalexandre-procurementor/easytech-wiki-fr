"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Link } from "@/src/i18n/navigation";
import type { SkillIndexItem, SkillSeriesMeta } from "@/lib/types";

type SkillsBrowserClientProps = {
  sections: SkillSeriesMeta[];
  allSkills: SkillIndexItem[];
  isFr: boolean;
  t: {
    searchPlaceholder: string;
    searchNoResults: string;
    signatureBadge: string;
  };
};

/**
 * Interactive skills browser. Receives pre-sorted sections (learnable series
 * 1..5 first, signature series 0 last) plus the full skill list and renders
 * a search input that filters by both `name` and `nameFr`.
 *
 * When the search box is empty we show the normal grouped view. When it has
 * content we collapse everything into a single flat result grid.
 */
export function SkillsBrowserClient({
  sections,
  allSkills,
  isFr,
  t,
}: SkillsBrowserClientProps) {
  const [query, setQuery] = useState("");

  const normalized = query.trim().toLowerCase();
  const seriesById = useMemo(() => {
    const map = new Map<number, SkillSeriesMeta>();
    for (const s of sections) map.set(s.series, s);
    return map;
  }, [sections]);

  const filtered = useMemo(() => {
    if (!normalized) return null;
    return allSkills.filter((sk) => {
      const name = sk.name?.toLowerCase() ?? "";
      const nameFr = sk.nameFr?.toLowerCase() ?? "";
      const short = sk.shortDesc?.toLowerCase() ?? "";
      const shortFr = sk.shortDescFr?.toLowerCase() ?? "";
      return (
        name.includes(normalized) ||
        nameFr.includes(normalized) ||
        short.includes(normalized) ||
        shortFr.includes(normalized)
      );
    });
  }, [normalized, allSkills]);

  return (
    <>
      <div className="mb-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full max-w-md bg-bg3 border border-border rounded-md px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-gold"
        />
      </div>

      {filtered ? (
        filtered.length === 0 ? (
          <p className="text-muted italic">{t.searchNoResults}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((sk) => (
              <SkillCard
                key={sk.slug}
                skill={sk}
                signature={sk.series === 0}
                isFr={isFr}
                signatureLabel={t.signatureBadge}
              />
            ))}
          </div>
        )
      ) : (
        sections.map((s) => {
          const skills = allSkills.filter((k) => k.series === s.series);
          if (skills.length === 0) return null;
          return (
            <section key={s.series} id={`series-${s.series}`} className="mb-10">
              <div className="flex items-center gap-3 mb-2 mt-4">
                <h2 className="text-2xl">
                  {s.icon} {s.label}
                </h2>
                <span className="bg-gold text-[#0f1419] text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                  {skills.length}
                </span>
              </div>
              <p className="text-dim text-sm mb-4 max-w-3xl">{s.summary}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.map((sk) => (
                  <SkillCard
                    key={sk.slug}
                    skill={sk}
                    signature={s.series === 0}
                    isFr={isFr}
                    signatureLabel={t.signatureBadge}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}
      {/* keep seriesById referenced to silence unused warnings in prod builds */}
      <span className="hidden" aria-hidden>{seriesById.size}</span>
    </>
  );
}

function SkillCard({
  skill,
  signature,
  isFr,
  signatureLabel,
}: {
  skill: SkillIndexItem;
  signature?: boolean;
  isFr?: boolean;
  signatureLabel: string;
}) {
  const displayName = (isFr && skill.nameFr) || skill.name;
  const displayShort =
    (isFr && skill.shortDescFr) || skill.shortDesc || "";
  return (
    <Link
      href={`/world-conqueror-4/competences/${skill.slug}` as any}
      className={`block bg-panel border rounded-lg p-4 transition-colors no-underline ${
        signature ? "hover:border-red-400" : "hover:border-gold"
      }`}
    >
      <div className="flex items-start gap-3 mb-2">
        <div
          className="w-12 h-12 rounded-md border border-border bg-bg3 grid place-items-center relative overflow-hidden flex-shrink-0"
          style={
            signature
              ? { borderColor: "rgba(200,55,45,0.45)" }
              : { borderColor: "rgba(212,164,74,0.45)" }
          }
        >
          {skill.icon ? (
            <Image
              src={skill.icon}
              alt={displayName}
              fill
              sizes="48px"
              className="object-contain p-1"
            />
          ) : (
            <span className="text-xl">⚡</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-gold2 font-bold text-sm leading-tight mb-0.5 truncate">
            {displayName}
          </h3>
          {isFr && skill.nameFr && skill.nameFr !== skill.name && (
            <div className="text-muted text-[9px] italic truncate">
              {skill.name}
            </div>
          )}
          <div className="text-muted text-[10px] uppercase tracking-widest">
            L1 → L{skill.maxLevel}
            {signature && (
              <span className="text-red-300 ml-1">· {signatureLabel}</span>
            )}
          </div>
        </div>
      </div>
      <p className="text-dim text-xs leading-relaxed line-clamp-3">
        {displayShort}
      </p>
    </Link>
  );
}
