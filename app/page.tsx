import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { GAMES } from "@/lib/games";

export default function Home() {
  return (
    <>
      <TopBar/>
      <main className="max-w-[1320px] mx-auto px-6 py-10">
        <section className="bg-panel border border-border rounded-lg p-9 mb-8 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(212,164,74,0.12) 0%, rgba(200,55,45,0.08) 100%), #1a2230" }}>
          <h1 className="text-4xl text-gold2 font-extrabold mb-2">Le Wiki FR des jeux EasyTech</h1>
          <p className="text-dim text-base max-w-3xl mb-5">
            Stratégies, unités d'élite, généraux et guides pour World Conqueror 4, European War 7,
            Great Conqueror Rome et tous les jeux du studio EasyTech — entièrement en français.
          </p>
          <Link href="/world-conqueror-4"
            className="inline-block bg-gold text-[#0f1419] px-5 py-2.5 rounded-md font-bold text-sm no-underline">
            🏅 Explorer World Conqueror 4
          </Link>
        </section>

        <h2 className="text-xl mb-4">Jeux couverts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {GAMES.map(g => (
            <div key={g.slug} className="bg-panel border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase tracking-widest font-bold"
                      style={{ color: g.available ? "#4a9d5f" : "#6b7685" }}>
                  {g.available ? "● Disponible" : "○ Bientôt"}
                </span>
              </div>
              <h3 className="text-gold2 font-bold mb-1">{g.name}</h3>
              <p className="text-dim text-sm mb-3">{g.tagline}</p>
              <div className="text-muted text-[11px] uppercase tracking-widest">{g.era}</div>
              {g.available && (
                <Link href={`/${g.slug}`} className="text-gold2 text-sm font-semibold mt-3 inline-block">
                  Explorer →
                </Link>
              )}
            </div>
          ))}
        </div>
      </main>
      <Footer/>
    </>
  );
}
