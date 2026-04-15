import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { GAMES } from "@/lib/games";
import { unstable_setRequestLocale } from "next-intl/server";
import { locales } from "@/src/i18n/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type HomeCopy = {
  h1: string;
  lede: string;
  cta: string;
  gamesHeading: string;
  available: string;
  soon: string;
  explore: string;
  voteHeading: string;
  voteBody: string;
  voteCta: string;
};

const COPY: Record<string, HomeCopy> = {
  fr: {
    h1: "Le Wiki FR des jeux EasyTech",
    lede:
      "Stratégies, unités d'élite, généraux et guides pour World Conqueror 4, European War 7, Great Conqueror Rome et tous les jeux du studio EasyTech — entièrement en français.",
    cta: "🏅 Explorer World Conqueror 4",
    gamesHeading: "Jeux couverts",
    available: "● Disponible",
    soon: "○ Bientôt",
    explore: "Explorer →",
    voteHeading: "🗳 Votez pour votre général préféré !",
    voteBody:
      "Manstein, Guderian, Rokossovsky, Simo Häyhä, De Gaulle… Qui mérite la première place ? Participez au classement communautaire.",
    voteCta: "Voter maintenant →",
  },
  en: {
    h1: "The English Wiki for EasyTech Games",
    lede:
      "Strategies, elite units, generals and guides for World Conqueror 4, European War 7, Great Conqueror Rome and all EasyTech studio games — entirely in English.",
    cta: "🏅 Explore World Conqueror 4",
    gamesHeading: "Games covered",
    available: "● Available",
    soon: "○ Soon",
    explore: "Explore →",
    voteHeading: "🗳 Vote for your favorite general!",
    voteBody:
      "Manstein, Guderian, Rokossovsky, Simo Häyhä, De Gaulle… Who deserves the top spot? Join the community ranking.",
    voteCta: "Vote now →",
  },
  de: {
    h1: "Das deutsche Wiki für EasyTech-Spiele",
    lede:
      "Strategien, Elite-Einheiten, Generäle und Guides zu World Conqueror 4, European War 7, Great Conqueror Rome und allen Spielen des EasyTech-Studios — vollständig auf Deutsch.",
    cta: "🏅 World Conqueror 4 entdecken",
    gamesHeading: "Abgedeckte Spiele",
    available: "● Verfügbar",
    soon: "○ Bald",
    explore: "Entdecken →",
    voteHeading: "🗳 Stimme für deinen Lieblingsgeneral!",
    voteBody:
      "Manstein, Guderian, Rokossovsky, Simo Häyhä, De Gaulle… Wer verdient den ersten Platz? Mach beim Community-Ranking mit.",
    voteCta: "Jetzt abstimmen →",
  },
};

export default function Home({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const c = COPY[params.locale] ?? COPY.en;
  return (
    <>
      <TopBar/>
      <main className="max-w-[1320px] mx-auto px-6 py-10">
        <section className="bg-panel border border-border rounded-lg p-9 mb-8 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(212,164,74,0.12) 0%, rgba(200,55,45,0.08) 100%), #1a2230" }}>
          <h1 className="text-4xl text-gold2 font-extrabold mb-2">{c.h1}</h1>
          <p className="text-dim text-base max-w-3xl mb-5">
            {c.lede}
          </p>
          <Link href={`/${params.locale}/world-conqueror-4`}
            className="inline-block bg-gold text-[#0f1419] px-5 py-2.5 rounded-md font-bold text-sm no-underline">
            {c.cta}
          </Link>
        </section>

        <Link
          href={`/${params.locale}/world-conqueror-4#best-general-vote`}
          className="block bg-panel border rounded-lg p-5 mb-8 no-underline transition-colors hover:border-gold"
          style={{ borderColor: "rgba(212,164,74,0.4)" }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h3 className="text-gold2 font-extrabold text-base mb-1">
                {c.voteHeading}
              </h3>
              <p className="text-dim text-sm max-w-2xl">{c.voteBody}</p>
            </div>
            <span className="text-gold2 font-bold text-sm shrink-0 whitespace-nowrap">
              {c.voteCta}
            </span>
          </div>
        </Link>

        <h2 className="text-xl mb-4">{c.gamesHeading}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {GAMES.map(g => (
            <div key={g.slug} className="bg-panel border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase tracking-widest font-bold"
                      style={{ color: g.available ? "#4a9d5f" : "#6b7685" }}>
                  {g.available ? c.available : c.soon}
                </span>
              </div>
              <h3 className="text-gold2 font-bold mb-1">{g.name}</h3>
              <p className="text-dim text-sm mb-3">{g.tagline}</p>
              <div className="text-muted text-[11px] uppercase tracking-widest">{g.era}</div>
              {g.available && (
                <Link href={`/${params.locale}/${g.slug}`} className="text-gold2 text-sm font-semibold mt-3 inline-block">
                  {c.explore}
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
