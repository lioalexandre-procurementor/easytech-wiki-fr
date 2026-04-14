import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { TierBadge } from "@/components/TierBadge";
import { UnitIcon } from "@/components/UnitIcon";
import { UnitDetailClient } from "@/components/UnitDetailClient";
import { getAllSlugs, getEliteUnit, CATEGORY_META, COUNTRY_FLAGS, getUnitsByCategory } from "@/lib/units";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const u = getEliteUnit(params.slug);
  if (!u) return { title: "Unité introuvable" };
  return {
    title: `${u.name} (WC4) — Stats, perks niveau 1-12 & généraux | Wiki FR`,
    description: `Fiche complète du ${u.name} dans World Conqueror 4 : ${u.shortDesc} Stats détaillées, perks niveau par niveau, généraux recommandés.`,
  };
}

export default function UnitPage({ params }: { params: { slug: string } }) {
  const unit = getEliteUnit(params.slug);
  if (!unit) notFound();

  const sameCat = getUnitsByCategory(unit.category)
    .filter(u => u.slug !== unit.slug)
    .slice(0, 3);
  const meta = CATEGORY_META[unit.category];

  return (
    <>
      <TopBar/>
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">Accueil</Link> <span className="mx-2 text-border">›</span>
        <Link href="/world-conqueror-4" className="text-dim">World Conqueror 4</Link> <span className="mx-2 text-border">›</span>
        <Link href="/world-conqueror-4/unites-elite" className="text-dim">Unités d'Élite</Link> <span className="mx-2 text-border">›</span>
        <span>{unit.name}</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20 grid lg:grid-cols-[240px_1fr] gap-7">
        <aside className="bg-panel border border-border rounded-lg p-4 h-fit lg:sticky lg:top-20">
          <h4 className="text-gold2 text-xs uppercase tracking-widest mb-1.5 border-b border-border pb-1.5">Sur cette page</h4>
          <ul className="list-none text-sm">
            <li><a href="#stats" className="block px-2 py-1 text-dim no-underline hover:text-gold2">Stats par niveau</a></li>
            <li><a href="#slider" className="block px-2 py-1 text-dim no-underline hover:text-gold2">Slider niveau 1-12</a></li>
            <li><a href="#perks" className="block px-2 py-1 text-dim no-underline hover:text-gold2">Perks détaillés</a></li>
            <li><a href="#strategy" className="block px-2 py-1 text-dim no-underline hover:text-gold2">Stratégie</a></li>
            <li><a href="#faq" className="block px-2 py-1 text-dim no-underline hover:text-gold2">FAQ</a></li>
          </ul>
          <h4 className="text-gold2 text-xs uppercase tracking-widest mt-4 mb-1.5 border-b border-border pb-1.5">{meta.plural} d'élite</h4>
          <ul className="list-none text-sm">
            {getUnitsByCategory(unit.category).map(u => (
              <li key={u.slug}>
                <Link href={`/world-conqueror-4/unites-elite/${u.slug}`}
                  className={`block px-2 py-1 rounded no-underline ${u.slug === unit.slug ? "text-gold2 font-bold bg-gold/10 border-l-2 border-gold pl-2.5" : "text-dim hover:text-gold2"}`}>
                  {u.name}
                </Link>
              </li>
            ))}
          </ul>
          <h4 className="text-gold2 text-xs uppercase tracking-widest mt-4 mb-1.5 border-b border-border pb-1.5">Navigation</h4>
          <ul className="list-none text-sm">
            <li><Link href="/world-conqueror-4/unites-elite" className="block px-2 py-1 text-dim no-underline hover:text-gold2">← Toutes les unités d'élite</Link></li>
          </ul>
        </aside>

        <main>
          {/* HEADER */}
          <div className="grid md:grid-cols-[220px_1fr] gap-7 bg-panel border border-border rounded-lg p-6 mb-6">
            <div className="rounded-lg border-2 border-gold h-[220px] grid place-items-center relative bg-gradient-to-br from-bg3 to-bg">
              <UnitIcon category={unit.category} country={unit.country} size={160}/>
              <div className="absolute top-2.5 right-2.5"><TierBadge tier={unit.tier} size="md"/></div>
            </div>
            <div>
              <h1 className="text-3xl text-gold2 font-extrabold mb-1">{unit.name}</h1>
              <div className="text-dim text-sm mb-4">{unit.longDesc.split(".")[0]}.</div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Tag accent>{meta.icon} {meta.label} d'élite</Tag>
                <Tag>{COUNTRY_FLAGS[unit.country]} {unit.countryName}</Tag>
                <Tag>📊 Niveaux 1-12</Tag>
                <Tag>🎁 {unit.obtainability === "free" ? "Gratuite" : unit.obtainability === "event" ? "Événement" : unit.obtainability === "shop" ? "Boutique" : "Premium"}</Tag>
                {!unit.verified && <Tag>⚠️ Données à vérifier en jeu</Tag>}
              </div>
              <p className="text-ink text-sm leading-relaxed">{unit.longDesc}</p>
            </div>
          </div>

          {/* INTERACTIVE BLOCK */}
          <div id="stats"></div>
          <div id="slider"></div>
          <div id="perks"></div>
          <UnitDetailClient unit={unit}/>

          <div className="ad-slot">Emplacement publicitaire</div>

          {/* STRATEGY */}
          <div id="strategy" className="bg-panel border border-border rounded-lg p-6 mb-6">
            <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">⚔️ Stratégie et appariements</h3>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <h4 className="text-ink font-bold mb-2.5">👨‍✈️ Généraux recommandés</h4>
                <p className="text-dim text-sm mb-3">Les généraux les plus efficaces avec cette unité :</p>
                <div>
                  {unit.recommendedGenerals.map(g => (
                    <span key={g} className="inline-flex items-center gap-2 bg-bg3 border border-border px-3 py-1.5 rounded-full mr-1.5 mb-1.5 text-sm">
                      <span className="w-5 h-5 rounded-full grid place-items-center text-[10px] font-extrabold text-[#0f1419]"
                            style={{ background: "linear-gradient(135deg, #8b7d4a, #d4a44a)" }}>
                        {g.slice(0, 2).toUpperCase()}
                      </span>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-ink font-bold mb-2.5">📈 Ordre de leveling recommandé</h4>
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

          {/* RELATED */}
          {sameCat.length > 0 && (
            <>
              <h2 className="text-xl mb-4 mt-8">Comparer avec d'autres {meta.plural.toLowerCase()} d'élite</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {sameCat.map(u => (
                  <Link key={u.slug} href={`/world-conqueror-4/unites-elite/${u.slug}`}
                    className="block bg-panel border border-border rounded-lg p-4 hover:border-gold transition-all no-underline">
                    <div className="flex justify-between items-start mb-2">
                      <UnitIcon category={u.category} country={u.country} size={48}/>
                      <TierBadge tier={u.tier} size="sm"/>
                    </div>
                    <h3 className="text-gold2 font-bold text-base mb-1">{u.name}</h3>
                    <p className="text-dim text-xs">{u.shortDesc}</p>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* FAQ */}
          {unit.faqs.length > 0 && (
            <div id="faq" className="bg-panel border border-border rounded-lg p-6 mt-8">
              <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">❓ Questions fréquentes</h3>
              {unit.faqs.map((f, i) => (
                <div key={i} className="border-b border-border last:border-none py-3.5">
                  <div className="font-bold text-ink mb-1.5 text-sm">{f.q}</div>
                  <div className="text-dim text-sm leading-relaxed">{f.a}</div>
                </div>
              ))}
            </div>
          )}

          {/* SOURCES */}
          {unit.sources && unit.sources.length > 0 && (
            <div className="text-muted text-xs mt-6">
              <b>Sources :</b> {unit.sources.join(" · ")}
            </div>
          )}
        </main>
      </div>
      <Footer/>
    </>
  );
}

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${accent ? "bg-gold/15 border-gold text-gold2" : "bg-bg3 border-border text-dim"}`}>
      {children}
    </span>
  );
}
