import Image from "next/image";
import { notFound } from "next/navigation";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import {
  getAllSkillSlugs,
  getSkill,
  getSkillIndex,
  getGeneralByApkId,
} from "@/lib/units";
import type { Metadata } from "next";
import { unstable_setRequestLocale } from "next-intl/server";
import { locales } from "@/src/i18n/config";
import type {
  SkillCatalogEntry,
  SkillUsageEntry,
  GeneralData,
} from "@/lib/types";

export function generateStaticParams() {
  const slugs = getAllSkillSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const s = getSkill(slug);
  if (!s) return { title: "404" };
  const title =
    locale === "fr"
      ? `${s.name} (WC4) — Effet, progression L1→L5 & généraux`
      : `${s.name} (WC4) — Effect, L1→L5 progression & generals`;
  const description = `${s.descriptionTemplate} Maximum level ${s.maxLevel}, series "${s.seriesLabel}".`;
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/world-conqueror-4/${
        locale === "fr" ? "competences" : "skills"
      }/${slug}`,
      languages: {
        fr: `/fr/world-conqueror-4/competences/${slug}`,
        en: `/en/world-conqueror-4/skills/${slug}`,
        "x-default": `/fr/world-conqueror-4/competences/${slug}`,
      },
    },
    openGraph: { title, description, type: "article" },
    robots: { index: true, follow: true },
  };
}

export default function SkillDetailPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  unstable_setRequestLocale(params.locale);
  const skill = getSkill(params.slug);
  if (!skill) notFound();

  const index = getSkillIndex();
  const seriesMeta = index.series.find((s) => s.series === skill.series);
  const signature = skill.series === 0;

  // Resolve usage entries → generals. Dedupe by slug across base+promoted.
  const resolvedMap = new Map<
    string,
    { general: GeneralData; levels: Set<number>; viaPromotion: boolean }
  >();
  const unresolvedIds: number[] = [];
  const addUsage = (entries: SkillUsageEntry[], viaPromotion: boolean) => {
    for (const e of entries) {
      const g = getGeneralByApkId(e.generalId);
      if (g) {
        const cur = resolvedMap.get(g.slug);
        if (cur) {
          cur.levels.add(e.level);
          cur.viaPromotion = cur.viaPromotion || viaPromotion;
        } else {
          resolvedMap.set(g.slug, {
            general: g,
            levels: new Set([e.level]),
            viaPromotion,
          });
        }
      } else {
        unresolvedIds.push(e.generalId);
      }
    }
  };
  addUsage(skill.usage.base, false);
  addUsage(skill.usage.promoted, true);
  const resolved = Array.from(resolvedMap.values()).sort((a, b) =>
    a.general.name.localeCompare(b.general.name, "fr")
  );

  const maxEffect = Math.max(...skill.progression.map((p) => p.effect));
  const maxChance = Math.max(...skill.progression.map((p) => p.chance));
  const variesLabel =
    skill.varyingField === "SkillEffect"
      ? "Effet"
      : "Chance d'activation";

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">
          Accueil
        </Link>{" "}
        <span className="mx-2 text-border">›</span>
        <Link href="/world-conqueror-4" className="text-dim">
          World Conqueror 4
        </Link>{" "}
        <span className="mx-2 text-border">›</span>
        <Link href="/world-conqueror-4/competences" className="text-dim">
          Compétences
        </Link>{" "}
        <span className="mx-2 text-border">›</span>
        <span>{skill.name}</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20 grid lg:grid-cols-[240px_1fr] gap-7">
        <aside className="bg-panel border border-border rounded-lg p-4 h-fit lg:sticky lg:top-20">
          <h4 className="text-gold2 text-xs uppercase tracking-widest mb-1.5 border-b border-border pb-1.5">
            Sur cette page
          </h4>
          <ul className="list-none text-sm">
            <li>
              <a
                href="#description"
                className="block px-2 py-1 text-dim no-underline hover:text-gold2"
              >
                📖 Description
              </a>
            </li>
            <li>
              <a
                href="#progression"
                className="block px-2 py-1 text-dim no-underline hover:text-gold2"
              >
                📈 Progression L1→L{skill.maxLevel}
              </a>
            </li>
            {resolved.length > 0 && (
              <li>
                <a
                  href="#generals"
                  className="block px-2 py-1 text-dim no-underline hover:text-gold2"
                >
                  👨‍✈️ Généraux qui l'utilisent
                </a>
              </li>
            )}
          </ul>
          <h4 className="text-gold2 text-xs uppercase tracking-widest mt-4 mb-1.5 border-b border-border pb-1.5">
            Navigation
          </h4>
          <ul className="list-none text-sm">
            <li>
              <Link
                href="/world-conqueror-4/competences"
                className="block px-2 py-1 text-dim no-underline hover:text-gold2"
              >
                ← Toutes les compétences
              </Link>
            </li>
            {seriesMeta && (
              <li>
                <Link
                  href={`/world-conqueror-4/competences#series-${seriesMeta.series}` as any}
                  className="block px-2 py-1 text-dim no-underline hover:text-gold2"
                >
                  {seriesMeta.icon} {seriesMeta.label}
                </Link>
              </li>
            )}
            <li>
              <Link
                href="/world-conqueror-4/generaux"
                className="block px-2 py-1 text-dim no-underline hover:text-gold2"
              >
                👨‍✈️ Généraux
              </Link>
            </li>
          </ul>
        </aside>

        <main>
          {/* HEADER */}
          <div className="grid md:grid-cols-[auto_1fr] gap-6 bg-panel border border-border rounded-lg p-6 mb-6">
            <div
              className="w-28 h-28 rounded-lg border-2 relative overflow-hidden grid place-items-center"
              style={{
                borderColor: signature ? "#c8372d" : "#d4a44a",
                background: signature
                  ? "linear-gradient(135deg, #2a0f12, #1a1418)"
                  : "linear-gradient(135deg, #1a2230, #12161e)",
              }}
            >
              {skill.icon ? (
                <Image
                  src={skill.icon}
                  alt={skill.name}
                  fill
                  sizes="112px"
                  className="object-contain p-2"
                  priority
                />
              ) : (
                <span className="text-5xl">⚡</span>
              )}
            </div>
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {seriesMeta && (
                  <span
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold border bg-gold/15 border-gold/40 text-gold2"
                  >
                    {seriesMeta.icon} {seriesMeta.label}
                  </span>
                )}
                {signature && (
                  <span
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold border text-red-200"
                    style={{
                      background: "rgba(200,55,45,0.15)",
                      borderColor: "#c8372d",
                    }}
                  >
                    👑 Signature — non apprenable
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-xl text-xs font-semibold border bg-bg3 border-border text-dim">
                  Niveau max : L{skill.maxLevel}
                </span>
              </div>
              <h1 className="text-3xl text-gold2 font-extrabold mb-1">
                {skill.name}
              </h1>
              <p className="text-dim text-sm leading-relaxed">
                {skill.descriptionTemplate}
              </p>
              <div className="mt-3 text-muted text-[11px] uppercase tracking-widest">
                Champ variable : {variesLabel} · Max : {maxEffect}
                {skill.varyingField === "ActivatesChance"
                  ? "% de chance"
                  : ""}
                {skill.varyingField === "SkillEffect" && maxChance < 100 && (
                  <> · Chance d'activation : {maxChance}%</>
                )}
              </div>
            </div>
          </div>

          {/* DESCRIPTION */}
          <section
            id="description"
            className="bg-panel border border-border rounded-lg p-6 mb-6"
          >
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-3">
              📖 Description
            </h2>
            <p className="text-ink text-sm leading-relaxed">
              {skill.descriptionTemplate}
            </p>
            <p className="text-muted text-xs mt-3 italic">
              Description en anglais, source : fichiers de jeu officiels. La
              valeur « X » dans le texte est remplacée par la valeur réelle à
              chaque niveau (tableau ci-dessous).
            </p>
          </section>

          {/* PROGRESSION */}
          <section
            id="progression"
            className="bg-panel border border-border rounded-lg p-6 mb-6"
          >
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              📈 Progression L1 → L{skill.maxLevel}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted text-[10px] uppercase tracking-widest border-b border-border">
                    <th className="text-left py-2 pr-3 w-12">Niv.</th>
                    <th className="text-left py-2 pr-3 w-20">Effet</th>
                    <th className="text-left py-2 pr-3 w-20">Chance</th>
                    <th className="text-left py-2 pr-3 w-24">Coût</th>
                    <th className="text-left py-2">Description effective</th>
                  </tr>
                </thead>
                <tbody>
                  {skill.progression.map((p) => (
                    <tr
                      key={p.level}
                      className="border-b border-border/40 align-top"
                    >
                      <td className="py-3 pr-3">
                        <span className="inline-grid place-items-center w-7 h-7 rounded-full bg-gold/20 border border-gold/50 text-gold2 font-bold text-xs">
                          {p.level}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-gold2 font-bold tabular-nums">
                        {skill.varyingField === "SkillEffect"
                          ? p.effect
                          : p.effect}
                      </td>
                      <td className="py-3 pr-3 text-dim tabular-nums">
                        {p.chance}%
                      </td>
                      <td className="py-3 pr-3 text-dim tabular-nums">
                        {p.costMedal > 0 ? (
                          <>🎖 {p.costMedal}</>
                        ) : (
                          <span className="text-muted italic">—</span>
                        )}
                      </td>
                      <td className="py-3 text-ink leading-relaxed">
                        {p.renderedDesc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!signature && (
              <div className="mt-4 text-muted text-[11px] italic">
                🎓 Coût cumulé L1→L{skill.maxLevel} :{" "}
                <strong>
                  {skill.progression.reduce((a, b) => a + b.costMedal, 0)} médailles
                </strong>
                . À l'Académie, vous pouvez apprendre cette compétence pour la
                poser dans un slot libre d'un général compatible.
              </div>
            )}
            {signature && (
              <div className="mt-4 text-muted text-[11px] italic">
                👑 Cette compétence n'est pas apprenable via l'Académie : elle
                est portée directement par les généraux listés ci-dessous (base
                ou via entraînement Épées/Sceptres).
              </div>
            )}
          </section>

          {/* GENERALS WHO CARRY IT */}
          {resolved.length > 0 && (
            <section
              id="generals"
              className="bg-panel border border-border rounded-lg p-6 mb-6"
            >
              <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
                👨‍✈️ Généraux qui utilisent cette compétence
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {resolved.map(({ general: g, levels, viaPromotion }) => (
                  <Link
                    key={g.slug}
                    href={`/world-conqueror-4/generaux/${g.slug}` as any}
                    className="flex items-start gap-3 bg-bg3 border border-border rounded-lg p-3 hover:border-gold transition-colors no-underline"
                  >
                    {g.image?.head ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden relative border border-gold/40 flex-shrink-0">
                        <Image
                          src={g.image.head}
                          alt={g.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full grid place-items-center bg-gold/20 border border-gold/40 text-gold2 font-bold text-sm flex-shrink-0">
                        {g.name
                          .split(" ")
                          .map((s) => s[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-gold2 font-bold text-sm truncate">
                        {g.name}
                      </div>
                      <div className="text-muted text-[10px] uppercase tracking-widest mb-1">
                        Tier {g.rank} · {g.quality}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(levels)
                          .sort((a, b) => a - b)
                          .map((lvl) => (
                            <span
                              key={lvl}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gold/15 border border-gold/40 text-gold2"
                            >
                              L{lvl}
                            </span>
                          ))}
                        {viaPromotion && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/40 text-red-300">
                            ⚔ Via entraînement
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {unresolvedIds.length > 0 && (
                <div className="mt-4 text-muted text-[11px] italic">
                  + {unresolvedIds.length} entrée(s) référencent des généraux pas
                  encore répertoriés dans le wiki (entraînements premium, variantes
                  non indexées).
                </div>
              )}
            </section>
          )}

          {resolved.length === 0 && unresolvedIds.length > 0 && (
            <section className="bg-panel border border-border rounded-lg p-6 mb-6">
              <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-2">
                👨‍✈️ Généraux qui utilisent cette compétence
              </h2>
              <p className="text-dim text-sm">
                Cette compétence est portée par {unresolvedIds.length} général(s)
                pas encore indexés dans le wiki. Fiches en cours de rédaction.
              </p>
            </section>
          )}
        </main>
      </div>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${skill.name} — World Conqueror 4`,
            about: {
              "@type": "VideoGame",
              name: "World Conqueror 4",
              gamePlatform: ["Android", "iOS"],
              publisher: { "@type": "Organization", name: "EasyTech" },
            },
            description: skill.descriptionTemplate,
            inLanguage: params.locale,
          }),
        }}
      />
    </>
  );
}

// ensure the type is treated as used in case of unused-var lint
void ({} as SkillCatalogEntry);
