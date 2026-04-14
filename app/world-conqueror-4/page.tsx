import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { UnitCard } from "@/components/UnitCard";
import { getAllEliteUnits, CATEGORY_META } from "@/lib/units";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "World Conqueror 4 — Wiki FR | EasyTech Wiki",
  description: "Le guide francophone le plus complet de World Conqueror 4 : 38 unités d'élite niveau par niveau, généraux, technologies, scénarios et stratégies.",
};

export default function WC4Hub() {
  const units = getAllEliteUnits();
  const top = units.slice(0, 6);
  const counts = (Object.keys(CATEGORY_META) as Array<keyof typeof CATEGORY_META>)
    .map(k => ({ key: k, count: units.filter(u => u.category === k).length, ...CATEGORY_META[k] }));

  return (
    <>
      <TopBar/>
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">Accueil</Link> <span className="mx-2 text-border">›</span>
        <span>World Conqueror 4</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20 grid lg:grid-cols-[240px_1fr] gap-7">
        <aside className="bg-panel border border-border rounded-lg p-4 h-fit lg:sticky lg:top-20">
          <SidebarSection title="World Conqueror 4">
            <SidebarLink href="/world-conqueror-4" active>🏠 Accueil WC4</SidebarLink>
            <SidebarLink href="#">📘 Guide débutant</SidebarLink>
            <SidebarLink href="#">⚔️ Unités standards</SidebarLink>
            <SidebarLink href="/world-conqueror-4/unites-elite">🏅 Unités d'élite</SidebarLink>
            <SidebarLink href="#">👨‍✈️ Généraux</SidebarLink>
            <SidebarLink href="#">🔬 Technologies</SidebarLink>
            <SidebarLink href="#">🗺 Scénarios</SidebarLink>
            <SidebarLink href="#">🌍 Conquêtes</SidebarLink>
          </SidebarSection>
          <SidebarSection title="Outils">
            <SidebarLink href="#">🏆 Tier Lists</SidebarLink>
            <SidebarLink href="#">⚖️ Comparateur</SidebarLink>
            <SidebarLink href="#">🧮 Calculateur XP</SidebarLink>
          </SidebarSection>
        </aside>

        <main>
          <section className="bg-panel border border-border rounded-lg p-9 mb-6 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(212,164,74,0.12) 0%, rgba(200,55,45,0.08) 100%), #1a2230" }}>
            <h1 className="text-4xl text-gold2 font-extrabold mb-2">World Conqueror 4 — Wiki Francophone</h1>
            <p className="text-dim text-base max-w-3xl mb-5">
              Le guide le plus complet en français pour maîtriser World Conqueror 4 d'EasyTech.
              Stats détaillées, unités d'élite niveau par niveau, généraux optimaux et stratégies de conquête.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/world-conqueror-4/unites-elite"
                className="inline-block bg-gold text-[#0f1419] px-5 py-2.5 rounded-md font-bold text-sm no-underline">
                🏅 Explorer les unités d'élite
              </Link>
              <Link href="#"
                className="inline-block bg-transparent text-gold2 px-5 py-2.5 rounded-md font-bold text-sm no-underline border border-gold">
                📘 Guide débutant
              </Link>
            </div>
            <div className="flex flex-wrap gap-7 mt-5">
              <Stat n={units.length} l="Unités d'élite"/>
              <Stat n="175+" l="Généraux"/>
              <Stat n="60+" l="Scénarios"/>
              <Stat n="12" l="Niveaux max"/>
            </div>
          </section>

          <h2 className="text-xl mb-4 mt-8">Explorer par catégorie</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {counts.map(c => (
              <Link key={c.key} href={`/world-conqueror-4/unites-elite?cat=${c.key}`}
                className="bg-panel border border-border rounded-lg p-4 hover:border-gold transition-colors no-underline block">
                <div className="text-2xl mb-2">{c.icon}</div>
                <h3 className="text-gold2 font-bold text-base mb-1">{c.plural}</h3>
                <div className="text-muted text-[11px] uppercase tracking-widest">{c.count} unités</div>
              </Link>
            ))}
          </div>

          <div className="ad-slot">Emplacement publicitaire (AdSense / Mediavine)</div>

          <h2 className="text-xl mb-4 mt-8">Unités d'élite les plus consultées</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {top.map(u => <UnitCard key={u.slug} unit={u}/>)}
          </div>
        </main>
      </div>

      <Footer/>
    </>
  );
}

function Stat({ n, l }: { n: number | string; l: string }) {
  return (
    <div className="border-l-4 border-gold pl-3">
      <div className="text-2xl text-gold2 font-extrabold">{n}</div>
      <div className="text-[11px] text-muted uppercase tracking-widest">{l}</div>
    </div>
  );
}
function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="text-gold2 text-xs uppercase tracking-widest mb-1.5 border-b border-border pb-1.5">{title}</h4>
      <ul className="list-none">{children}</ul>
    </div>
  );
}
function SidebarLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <li><Link href={href}
      className={`block px-2 py-1 rounded text-sm no-underline ${active ? "bg-gold/10 text-gold2 font-bold border-l-2 border-gold pl-2.5" : "text-dim hover:bg-gold/10 hover:text-gold2"}`}>
      {children}
    </Link></li>
  );
}
