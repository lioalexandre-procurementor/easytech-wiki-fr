import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { UnitCard } from "@/components/UnitCard";
import {
  getUnitsByFaction,
  getGeneralsByFaction,
  CATEGORY_META,
  GENERAL_CATEGORY_META,
  FACTION_META,
} from "@/lib/units";
import type { Category } from "@/lib/types";
import type { Metadata } from "next";
import { unstable_setRequestLocale } from "next-intl/server";
import { locales } from "@/src/i18n/config";

export const metadata: Metadata = {
  title: "Empire du Scorpion (Black Scorpion / Mystic Forces) — WC4 Wiki FR",
  description:
    "Guide complet de l'Empire du Scorpion dans World Conqueror 4 : unités mystiques (Titan Tank, KS-90, Heavenly Beginning Tank, SVA-23), capitaines Osborn, Williams et Colson, lore et stratégies.",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const CAT_ORDER: Category[] = ["tank", "infantry", "artillery", "navy", "airforce"];

export default function ScorpionHub({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const units = getUnitsByFaction("scorpion");
  const generals = getGeneralsByFaction("scorpion");
  const meta = FACTION_META.scorpion;

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">Accueil</Link> <span className="mx-2 text-border">›</span>
        <Link href="/world-conqueror-4" className="text-dim">World Conqueror 4</Link>{" "}
        <span className="mx-2 text-border">›</span>
        <span>Empire du Scorpion</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20 grid lg:grid-cols-[240px_1fr] gap-7">
        <aside className="bg-panel border border-border rounded-lg p-4 h-fit lg:sticky lg:top-20">
          <h4 className="text-gold2 text-xs uppercase tracking-widest mb-1.5 border-b border-border pb-1.5">
            Sur cette page
          </h4>
          <ul className="list-none text-sm">
            <li><a href="#lore" className="block px-2 py-1 text-dim no-underline hover:text-gold2">📖 Lore & origine</a></li>
            <li><a href="#generaux" className="block px-2 py-1 text-dim no-underline hover:text-gold2">👨‍✈️ Les 3 capitaines</a></li>
            <li><a href="#unites" className="block px-2 py-1 text-dim no-underline hover:text-gold2">🛡 Unités mystiques</a></li>
          </ul>
          <h4 className="text-gold2 text-xs uppercase tracking-widest mt-4 mb-1.5 border-b border-border pb-1.5">
            Navigation
          </h4>
          <ul className="list-none text-sm">
            <li><Link href="/world-conqueror-4" className="block px-2 py-1 text-dim no-underline hover:text-gold2">← Retour au hub WC4</Link></li>
            <li><Link href="/world-conqueror-4/unites-elite" className="block px-2 py-1 text-dim no-underline hover:text-gold2">🏅 Unités d'élite standard</Link></li>
            <li><Link href="/world-conqueror-4/generaux" className="block px-2 py-1 text-dim no-underline hover:text-gold2">👨‍✈️ Tous les généraux</Link></li>
          </ul>
        </aside>

        <main>
          {/* HERO */}
          <section
            className="bg-panel border rounded-lg p-9 mb-6 relative overflow-hidden"
            style={{
              borderColor: meta.color,
              background:
                "linear-gradient(135deg, rgba(200,55,45,0.15) 0%, rgba(139,0,0,0.12) 100%), #1a1418",
            }}
          >
            <div className="text-5xl mb-3">🦂</div>
            <h1 className="text-4xl font-extrabold mb-2" style={{ color: meta.color }}>
              Empire du Scorpion
            </h1>
            <p className="text-dim text-sm uppercase tracking-widest mb-4">
              Black Scorpion Empire — Mystic Forces — New World Order
            </p>
            <p className="text-ink text-base max-w-3xl leading-relaxed mb-5">
              L'<b>Empire du Scorpion</b> (également appelé <i>Black Scorpion Empire</i> ou <i>Mystic Forces</i>)
              est la faction antagoniste fictive de World Conqueror 4, apparaissant comme le nouvel ordre mondial
              à la fin du scénario <b>Modern War</b>. Dirigé par <b>Osborn</b> et ses deux capitaines <b>Williams</b>{" "}
              et <b>Colson</b>, cet empire déploie des unités mystiques ultra-puissantes aux noms évocateurs :
              Titan Tank, Heavenly Beginning Tank, KS-90, SVA-23, Mystic Bomber…
            </p>
            <div className="flex flex-wrap gap-7">
              <Stat n={units.length} l="Unités mystiques" />
              <Stat n={generals.length} l="Capitaines" />
              <Stat n="Modern" l="Ère" />
            </div>
          </section>

          {/* LORE */}
          <section id="lore" className="bg-panel border border-border rounded-lg p-6 mb-6">
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              📖 Origine & lore
            </h2>
            <div className="text-dim text-sm leading-relaxed space-y-3">
              <p>
                Dans la campagne de World Conqueror 4, l'Empire du Scorpion apparaît comme l'ennemi final après la
                résolution des conflits mondiaux modernes. Sa base technologique est fondée sur des systèmes
                mystiques et des armements futuristes, qui surpassent les équivalents du monde réel.
              </p>
              <p>
                L'origine d'Osborn remonte à un général britannique nommé <b>Alfred</b>, personnage non-recrutable
                qui apparaît dans la mission <i>Dunkerque</i> de l'événement <i>Origin of the Scorpion Empire</i>.
                Cette continuité narrative fait d'Osborn le fil rouge secret du jeu, d'abord allié puis chef de l'Empire.
              </p>
              <p className="text-amber-300/80">
                ⚠️ Ces unités sont exclusives à la campagne. Elles ne sont pas obtenables en Conquête classique
                et n'ont pas d'équivalent réel — les stats affichées sont des extrapolations en attendant vérification
                in-game.
              </p>
            </div>
          </section>

          {/* GENERALS */}
          <section id="generaux" className="mb-8">
            <h2 className="text-2xl mb-4">👨‍✈️ Les trois capitaines de l'Empire</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {generals.map((g) => (
                <Link
                  key={g.slug}
                  href={`/world-conqueror-4/generaux/${g.slug}`}
                  className="block bg-panel border border-border rounded-lg p-5 hover:border-red-500 transition-colors no-underline"
                  style={{ borderColor: "#3a1f26" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-14 h-14 rounded-full grid place-items-center text-2xl font-extrabold text-white"
                      style={{
                        background: "linear-gradient(135deg, #4a0f12, #c8372d)",
                      }}
                    >
                      🦂
                    </div>
                    <span className="bg-red-500/20 border border-red-500/40 text-red-300 text-[11px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded">
                      {g.rank}
                    </span>
                  </div>
                  <h3 className="text-gold2 font-bold text-lg mb-1">{g.name}</h3>
                  <div className="text-muted text-[10px] uppercase tracking-widest mb-2">
                    {GENERAL_CATEGORY_META[g.category].icon} {GENERAL_CATEGORY_META[g.category].label}
                  </div>
                  <p className="text-dim text-xs leading-relaxed line-clamp-3">{g.shortDesc}</p>
                </Link>
              ))}
            </div>
          </section>

          <div className="ad-slot">Emplacement publicitaire</div>

          {/* UNITS */}
          <section id="unites">
            <h2 className="text-2xl mb-4 mt-8">🛡 Unités mystiques de l'Empire du Scorpion</h2>
            {CAT_ORDER.map((cat) => {
              const list = units.filter((u) => u.category === cat);
              if (list.length === 0) return null;
              const cmeta = CATEGORY_META[cat];
              return (
                <div key={cat} className="mb-7">
                  <h3 className="text-lg mb-3">
                    {cmeta.icon} {cmeta.plural}{" "}
                    <span className="text-muted text-xs uppercase tracking-widest ml-2">
                      {list.length} unité{list.length > 1 ? "s" : ""}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map((u) => (
                      <UnitCard key={u.slug} unit={u} />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}

function Stat({ n, l }: { n: number | string; l: string }) {
  return (
    <div className="border-l-4 pl-3" style={{ borderColor: "#c8372d" }}>
      <div className="text-2xl font-extrabold" style={{ color: "#ff7d6b" }}>
        {n}
      </div>
      <div className="text-[11px] text-muted uppercase tracking-widest">{l}</div>
    </div>
  );
}
