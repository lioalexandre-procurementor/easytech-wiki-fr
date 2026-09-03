import { Footer } from "@/components/Footer";
import { TopBar } from "@/components/TopBar";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/config";

const copy = {
  fr: {
    eyebrow: "Contenu en préparation",
    body: "Cette section n'est pas encore publiée pour ce jeu. Nous préférons ne pas afficher de contenu provenant d'un autre jeu ou insuffisamment vérifié.",
    action: "Retour au jeu",
  },
  en: {
    eyebrow: "Content in preparation",
    body: "This section is not published for this game yet. We prefer not to show content copied from another game or information that has not been adequately verified.",
    action: "Back to the game",
  },
  de: {
    eyebrow: "Inhalt in Vorbereitung",
    body: "Dieser Bereich ist für dieses Spiel noch nicht veröffentlicht. Wir zeigen lieber keine Inhalte aus einem anderen Spiel oder unzureichend geprüfte Angaben.",
    action: "Zurück zum Spiel",
  },
} as const;

export function EditorialSectionUnavailable({
  locale,
  gameName,
  gameHref,
  sectionName,
}: {
  locale: Locale;
  gameName: string;
  gameHref: string;
  sectionName: string;
}) {
  const text = copy[locale];
  return (
    <>
      <TopBar />
      <main className="max-w-[880px] mx-auto px-6 py-16 min-h-[60vh]">
        <p className="text-gold uppercase tracking-widest text-xs font-bold mb-3">
          {text.eyebrow}
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gold2 mb-4">
          {sectionName} - {gameName}
        </h1>
        <p className="text-dim leading-relaxed max-w-2xl mb-7">{text.body}</p>
        <Link
          href={gameHref as any}
          className="inline-flex rounded-md bg-gold px-5 py-2.5 text-bg font-bold no-underline"
        >
          {text.action}
        </Link>
      </main>
      <Footer />
    </>
  );
}
