import Image from "next/image";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { getSkillIndex } from "@/lib/units";
import type { Metadata } from "next";
import { unstable_setRequestLocale } from "next-intl/server";
import { locales } from "@/src/i18n/config";
import type { SkillIndexItem, SkillSeriesMeta } from "@/lib/types";

export const metadata: Metadata = {
  title: "Compétences de World Conqueror 4 — Catalogue complet (FR)",
  description:
    "Toutes les compétences de WC4 organisées comme en jeu : Tactiques de terrain, Commandement, Logistique, Défense, Offensive, plus toutes les compétences spécifiques aux généraux avec progression L1→L5.",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Display order: signature first, then learnable series 1..5
const SERIES_DISPLAY_ORDER = [0, 1, 2, 3, 4, 5];

export default function SkillsBrowser({
  params,
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(params.locale);
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
        <Link href="/" className="text-dim">Accueil</Link>{" "}
        <span className="mx-2 text-border">›</span>
        <Link href="/world-conqueror-4" className="text-dim">World Conqueror 4</Link>{" "}
        <span className="mx-2 text-border">›</span>
        <span>Compétences</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20 grid lg:grid-cols-[240px_1fr] gap-7">
        <aside className="bg-panel border border-border rounded-lg p-4 h-fit lg:sticky lg:top-20">
          <h4 className="text-gold2 text-xs uppercase tracking-widest mb-1.5 border-b border-border pb-1.5">
            Séries
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
            Navigation
          </h4>
          <ul className="list-none text-sm">
            <li>
              <Link
                href="/world-conqueror-4"
                className="block px-2 py-1 text-dim no-underline hover:text-gold2"
              >
                ← Retour au hub WC4
              </Link>
            </li>
            <li>
              <Link
                href="/world-conqueror-4/generaux"
                className="block px-2 py-1 text-dim no-underline hover:text-gold2"
              >
                👨‍✈️ Généraux
              </Link>
            </li>
            <li>
              <Link
                href="/world-conqueror-4/unites-elite"
                className="block px-2 py-1 text-dim no-underline hover:text-gold2"
              >
                🏅 Unités d'élite
              </Link>
            </li>
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
              ⚡ Compétences de World Conqueror 4
            </h1>
            <p className="text-dim max-w-3xl">
              <strong>{totalCount} compétences</strong> extraites directement du jeu,
              organisées comme dans l'Académie. Les 5 séries apprenables (Tactiques
              de terrain, Commandement, Logistique, Défense, Offensive) regroupent
              les compétences que vous pouvez débloquer contre des médailles. La
              section <em>Compétences spécifiques aux généraux</em> couvre toutes
              les compétences de signature ou d'entraînement liées à un héros
              précis (Rokossovsky — Hero, Eisenhower — Super Commander, etc.).
            </p>
            <p className="text-muted text-xs mt-3">
              Chaque fiche détaille la description complète, la progression L1→L5,
              le coût en médailles par niveau et la liste des généraux concernés.
              Descriptions en anglais (source : fichiers de jeu officiels) —
              traduction française en cours.
            </p>
          </section>

          {sectionsInOrder.map((s) => {
            const skills = index.skills.filter((k) => k.series === s.series);
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
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </main>
      </div>
      <Footer />
    </>
  );
}

function SkillCard({
  skill,
  signature,
  isFr,
}: {
  skill: SkillIndexItem;
  signature?: boolean;
  isFr?: boolean;
}) {
  const displayName = (isFr && skill.nameFr) || skill.name;
  const displayShort =
    (isFr && skill.shortDescFr) || skill.shortDesc || "Description à venir.";
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
            {signature && <span className="text-red-300 ml-1">· signature</span>}
          </div>
        </div>
      </div>
      <p className="text-dim text-xs leading-relaxed line-clamp-3">
        {displayShort}
      </p>
    </Link>
  );
}
