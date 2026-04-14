import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { UnitRow } from "@/components/UnitRow";
import { getUnitsByFaction, CATEGORY_META } from "@/lib/units";
import type { Category } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Toutes les unités d'élite de World Conqueror 4 (FR) — Stats & Perks",
  description: "Liste complète des unités d'élite standard de WC4 par catégorie : chars, infanterie, artillerie, marine, aviation. Stats, tier list, perks niveau par niveau.",
};

const ORDER: Category[] = ["tank", "infantry", "artillery", "navy", "airforce"];

export default function ElitesList() {
  const all = getUnitsByFaction("standard");

  return (
    <>
      <TopBar/>
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">Accueil</Link> <span className="mx-2 text-border">›</span>
        <Link href="/world-conqueror-4" className="text-dim">World Conqueror 4</Link> <span className="mx-2 text-border">›</span>
        <span>Unités d'Élite</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20 grid lg:grid-cols-[240px_1fr] gap-7">
        <aside className="bg-panel border border-border rounded-lg p-4 h-fit lg:sticky lg:top-20">
          <h4 className="text-gold2 text-xs uppercase tracking-widest mb-1.5 border-b border-border pb-1.5">Catégories</h4>
          <ul className="list-none">
            <li><a href="#all" className="block px-2 py-1 rounded text-sm text-gold2 font-bold no-underline">🏅 Toutes ({all.length})</a></li>
            {ORDER.map(c => (
              <li key={c}><a href={`#${c}`} className="block px-2 py-1 rounded text-sm text-dim no-underline hover:text-gold2">
                {CATEGORY_META[c].icon} {CATEGORY_META[c].plural} ({all.filter(u => u.category === c).length})
              </a></li>
            ))}
          </ul>
          <h4 className="text-gold2 text-xs uppercase tracking-widest mt-4 mb-1.5 border-b border-border pb-1.5">Navigation</h4>
          <ul className="list-none">
            <li><Link href="/world-conqueror-4" className="block px-2 py-1 rounded text-sm text-dim no-underline hover:text-gold2">← Retour au hub WC4</Link></li>
            <li><Link href="/world-conqueror-4/empire-du-scorpion" className="block px-2 py-1 rounded text-sm text-dim no-underline hover:text-gold2">🦂 Empire du Scorpion</Link></li>
            <li><Link href="/world-conqueror-4/generaux" className="block px-2 py-1 rounded text-sm text-dim no-underline hover:text-gold2">👨‍✈️ Généraux</Link></li>
          </ul>
        </aside>

        <main id="all">
          <section className="bg-panel border border-border rounded-lg p-6 mb-6"
            style={{ background: "linear-gradient(135deg, rgba(212,164,74,0.12) 0%, rgba(200,55,45,0.08) 100%), #1a2230" }}>
            <h1 className="text-3xl text-gold2 font-extrabold mb-2">Unités d'Élite — World Conqueror 4</h1>
            <p className="text-dim max-w-3xl">
              Les <b>{all.length} forces d'élite</b> du roster standard sont des unités uniques aux perks exclusifs,
              évolutives du niveau 1 au niveau 12. Chaque fiche détaille les stats par niveau, les compétences actives
              et passives, et les meilleurs généraux à coupler.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 items-center">
              <Link
                href="/world-conqueror-4/empire-du-scorpion"
                className="inline-block bg-red-500/15 border border-red-500/40 text-red-200 px-4 py-2 rounded-md text-sm font-semibold no-underline hover:bg-red-500/25 transition-colors"
              >
                🦂 Voir aussi les unités de l'Empire du Scorpion
              </Link>
              <span className="text-amber-300/80 text-xs">
                ⚠️ Stats extrapolées — vérification in-game en cours
              </span>
            </div>
          </section>

          {ORDER.map(cat => {
            const units = all.filter(u => u.category === cat);
            if (units.length === 0) return null;
            const meta = CATEGORY_META[cat];
            return (
              <section key={cat} id={cat} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl">{meta.icon} {meta.plural} d'élite</h2>
                  <span className="bg-gold text-[#0f1419] text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">{units.length} unités</span>
                </div>
                <div className="grid gap-2.5">
                  {units.map(u => <UnitRow key={u.slug} unit={u}/>)}
                </div>
              </section>
            );
          })}
        </main>
      </div>
      <Footer/>
    </>
  );
}
