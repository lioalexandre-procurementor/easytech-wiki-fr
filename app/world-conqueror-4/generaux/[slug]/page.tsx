import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import {
  getAllGeneralSlugs,
  getGeneral,
  getAllGenerals,
  getEliteUnit,
  GENERAL_CATEGORY_META,
  COUNTRY_FLAGS,
  FACTION_META,
} from "@/lib/units";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getAllGeneralSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = getGeneral(params.slug);
  if (!g) return { title: "Général introuvable" };
  return {
    title: `${g.name} (WC4) — Compétences, bonus & unités recommandées | Wiki FR`,
    description: `Fiche complète du général ${g.name} dans World Conqueror 4 : ${g.shortDesc} Skills, bonus, meilleures unités à coupler.`,
  };
}

export default function GeneralPage({ params }: { params: { slug: string } }) {
  const g = getGeneral(params.slug);
  if (!g) notFound();

  const m = GENERAL_CATEGORY_META[g.category];
  const scorpion = g.faction === "scorpion";
  const faction = FACTION_META[g.faction];

  const related = getAllGenerals()
    .filter((x) => x.slug !== g.slug && x.category === g.category)
    .slice(0, 3);

  const recommended = g.recommendedUnits
    .map((slug) => getEliteUnit(slug))
    .filter((u): u is NonNullable<typeof u> => u !== null);

  const obtainLabel: Record<string, string> = {
    free: "Gratuit",
    event: "Événement",
    shop: "Boutique",
    premium: "Premium",
    campaign: "Campagne",
  };

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">Accueil</Link> <span className="mx-2 text-border">›</span>
        <Link href="/world-conqueror-4" className="text-dim">World Conqueror 4</Link>{" "}
        <span className="mx-2 text-border">›</span>
        <Link href="/world-conqueror-4/generaux" className="text-dim">Généraux</Link>{" "}
        <span className="mx-2 text-border">›</span>
        <span>{g.name}</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20 grid lg:grid-cols-[240px_1fr] gap-7">
        <aside className="bg-panel border border-border rounded-lg p-4 h-fit lg:sticky lg:top-20">
          <h4 className="text-gold2 text-xs uppercase tracking-widest mb-1.5 border-b border-border pb-1.5">
            Sur cette page
          </h4>
          <ul className="list-none text-sm">
            <li><a href="#skills" className="block px-2 py-1 text-dim no-underline hover:text-gold2">⚡ Compétences</a></li>
            <li><a href="#bonuses" className="block px-2 py-1 text-dim no-underline hover:text-gold2">📊 Bonus</a></li>
            <li><a href="#units" className="block px-2 py-1 text-dim no-underline hover:text-gold2">🛡 Unités recommandées</a></li>
            <li><a href="#lore" className="block px-2 py-1 text-dim no-underline hover:text-gold2">📖 Lore</a></li>
          </ul>
          <h4 className="text-gold2 text-xs uppercase tracking-widest mt-4 mb-1.5 border-b border-border pb-1.5">
            Navigation
          </h4>
          <ul className="list-none text-sm">
            <li><Link href="/world-conqueror-4/generaux" className="block px-2 py-1 text-dim no-underline hover:text-gold2">← Tous les généraux</Link></li>
            {scorpion && (
              <li><Link href="/world-conqueror-4/empire-du-scorpion" className="block px-2 py-1 text-dim no-underline hover:text-gold2">🦂 Empire du Scorpion</Link></li>
            )}
          </ul>
        </aside>

        <main>
          {/* HEADER */}
          <div className="grid md:grid-cols-[220px_1fr] gap-7 bg-panel border border-border rounded-lg p-6 mb-6">
            <div
              className="rounded-lg border-2 h-[220px] grid place-items-center relative"
              style={{
                borderColor: scorpion ? "#c8372d" : "#d4a44a",
                background: scorpion
                  ? "linear-gradient(135deg, #2a0f12, #1a1418)"
                  : "linear-gradient(135deg, #1a2230, #12161e)",
              }}
            >
              <div
                className="w-28 h-28 rounded-full grid place-items-center text-4xl font-extrabold"
                style={{
                  background: scorpion
                    ? "linear-gradient(135deg, #4a0f12, #c8372d)"
                    : "linear-gradient(135deg, #8b7d4a, #d4a44a)",
                  color: scorpion ? "#fff" : "#0f1419",
                }}
              >
                {scorpion ? "🦂" : g.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </div>
              <div className="absolute top-2.5 right-2.5">
                <span
                  className={`text-xs font-extrabold uppercase tracking-widest px-2.5 py-1 rounded ${
                    g.rank === "S"
                      ? "bg-red-500/20 border border-red-500/40 text-red-300"
                      : "bg-gold/20 border border-gold/40 text-gold2"
                  }`}
                >
                  Tier {g.rank}
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl text-gold2 font-extrabold mb-1">{g.name}</h1>
              <div className="text-dim text-sm mb-4">{g.shortDesc}</div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Tag accent>
                  {m.icon} Général {m.label}
                </Tag>
                <Tag>
                  {COUNTRY_FLAGS[g.country] || "🏳"} {g.countryName}
                </Tag>
                <Tag>🎖 Tier {g.rank}</Tag>
                <Tag>🎁 {obtainLabel[g.obtainability] || g.obtainability}</Tag>
                <Tag scorpion={scorpion}>
                  {scorpion ? "🦂" : "🌍"} {faction.label}
                </Tag>
                {!g.verified && <Tag>⚠️ Données à vérifier en jeu</Tag>}
              </div>
              <p className="text-ink text-sm leading-relaxed">{g.longDesc}</p>
            </div>
          </div>

          {/* SKILLS */}
          <div id="skills" className="bg-panel border border-border rounded-lg p-6 mb-6">
            <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              ⚡ Compétences
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {g.skills.map((s, i) => (
                <div key={i} className="border border-border rounded-lg p-4 bg-bg3">
                  <div className="text-gold2 font-bold text-sm mb-1">{s.name}</div>
                  <div className="text-dim text-sm leading-relaxed">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* BONUSES */}
          <div id="bonuses" className="bg-panel border border-border rounded-lg p-6 mb-6">
            <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              📊 Bonus appliqués
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {g.bonuses.map((b, i) => (
                <div
                  key={i}
                  className="border border-border rounded-lg p-3 bg-bg3 text-center"
                >
                  <div className="text-muted text-[10px] uppercase tracking-widest mb-1">
                    {b.target}
                  </div>
                  <div className="text-gold2 font-extrabold text-xl">{b.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="ad-slot">Emplacement publicitaire</div>

          {/* RECOMMENDED UNITS */}
          {recommended.length > 0 && (
            <div id="units" className="bg-panel border border-border rounded-lg p-6 mb-6">
              <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
                🛡 Unités recommandées avec ce général
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommended.map((u) => (
                  <Link
                    key={u.slug}
                    href={`/world-conqueror-4/unites-elite/${u.slug}`}
                    className="block bg-bg3 border border-border rounded-lg p-4 hover:border-gold transition-colors no-underline"
                  >
                    <div className="text-gold2 font-bold text-sm mb-1">{u.name}</div>
                    <div className="text-dim text-xs line-clamp-2">{u.shortDesc}</div>
                    <div className="text-muted text-[10px] uppercase tracking-widest mt-2">
                      {COUNTRY_FLAGS[u.country]} {u.countryName} · Tier {u.tier}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {g.recommendedUnits.length > recommended.length && (
            <div className="text-muted text-xs mb-6">
              Unités également mentionnées mais pas encore dans le wiki :{" "}
              {g.recommendedUnits
                .filter((slug) => !recommended.find((u) => u.slug === slug))
                .join(", ")}
            </div>
          )}

          {/* RELATED */}
          {related.length > 0 && (
            <>
              <h2 className="text-xl mb-4 mt-8">
                Autres généraux {m.label.toLowerCase()}
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/world-conqueror-4/generaux/${r.slug}`}
                    className="block bg-panel border border-border rounded-lg p-4 hover:border-gold transition-colors no-underline"
                  >
                    <h3 className="text-gold2 font-bold text-base mb-1">{r.name}</h3>
                    <p className="text-dim text-xs line-clamp-2">{r.shortDesc}</p>
                    <div className="text-muted text-[10px] uppercase tracking-widest mt-2">
                      {COUNTRY_FLAGS[r.country]} · Tier {r.rank}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* SOURCES */}
          {g.sources && g.sources.length > 0 && (
            <div className="text-muted text-xs mt-8">
              <b>Sources :</b> {g.sources.join(" · ")}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}

function Tag({
  children,
  accent,
  scorpion,
}: {
  children: React.ReactNode;
  accent?: boolean;
  scorpion?: boolean;
}) {
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
    <span
      className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${
        accent ? "bg-gold/15 border-gold text-gold2" : "bg-bg3 border-border text-dim"
      }`}
    >
      {children}
    </span>
  );
}
