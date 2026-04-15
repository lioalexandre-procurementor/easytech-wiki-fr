import type { Metadata } from "next";
import { unstable_setRequestLocale } from "next-intl/server";
import { locales } from "@/src/i18n/config";
import { LegalLayout, LegalSection } from "@/components/LegalLayout";
import { legalConfig } from "@/lib/legal-config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const titleByLocale: Record<string, string> = {
    fr: "À propos | EasyTech Wiki FR",
    en: "About | EasyTech Wiki",
    de: "Über uns | EasyTech Wiki",
  };
  const descByLocale: Record<string, string> = {
    fr: "Qui est derrière EasyTech Wiki FR, pourquoi ce projet existe, et comment les données sont collectées et vérifiées.",
    en: "Who is behind EasyTech Wiki, why this project exists, and how data is collected and verified.",
    de: "Wer hinter dem EasyTech Wiki steht, warum dieses Projekt existiert und wie die Daten erhoben und überprüft werden.",
  };
  return {
    title: titleByLocale[locale] ?? titleByLocale.en,
    description: descByLocale[locale] ?? descByLocale.en,
    robots: { index: true, follow: true },
  };
}

export default function AboutPage({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const { site, disclaimer } = legalConfig;
  // Locale-triple helper: picks fr, en or de string based on current locale.
  const tL = (fr: string, en: string, de: string): string =>
    params.locale === "fr" ? fr : params.locale === "de" ? de : en;

  return (
    <LegalLayout
      locale={params.locale}
      title={tL("À propos", "About", "Über uns")}
      lastUpdated={tL(
        "Dernière mise à jour : 15 avril 2026",
        "Last updated: April 15, 2026",
        "Zuletzt aktualisiert: 15. April 2026"
      )}
      breadcrumbLabel={tL("À propos", "About", "Über uns")}
    >
      <LegalSection
        title={tL("Pourquoi ce site ?", "Why this site?", "Warum gibt es diese Seite?")}
      >
        <p>
          {tL(
            `Les jeux de stratégie d'${disclaimer.studioName} (${disclaimer.games.join(", ")}) cumulent des dizaines de millions de joueurs dans le monde, mais la plupart des ressources disponibles en ligne sont en anglais, en coréen ou en chinois — et souvent incomplètes ou obsolètes. En français, il n'existe quasiment rien de structuré.`,
            `${disclaimer.studioName}'s strategy games (${disclaimer.games.join(", ")}) have tens of millions of players worldwide, but most online resources are in English, Korean or Chinese — and often incomplete or outdated.`,
            `Die Strategiespiele von ${disclaimer.studioName} (${disclaimer.games.join(", ")}) haben weltweit zig Millionen Spieler:innen, doch die meisten Online-Ressourcen sind Englisch, Koreanisch oder Chinesisch — und oft unvollständig oder veraltet. Auf Deutsch gibt es kaum etwas Strukturiertes.`
          )}
        </p>
        <p>
          {tL(
            `${site.name} a été lancé en 2026 pour combler ce vide : offrir aux joueurs francophones une encyclopédie fiable, exhaustive et à jour, directement construite à partir des fichiers de jeu, avec des guides stratégiques rédigés en français et vérifiés.`,
            `${site.name} was launched in 2026 to fill that gap: provide players with a reliable, comprehensive, up-to-date encyclopedia, built directly from the game files, with editorial guides written and verified by humans.`,
            `${site.name} wurde 2026 gestartet, um diese Lücke zu schließen: eine verlässliche, umfassende und aktuelle Enzyklopädie direkt aus den Spieldateien, begleitet von Strategie-Guides, die von Menschen geschrieben und geprüft werden.`
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={tL(
          "D'où viennent les données ?",
          "Where does the data come from?",
          "Woher stammen die Daten?"
        )}
      >
        <p>
          {tL(
            "Les statistiques numériques (attaque, défense, HP, coûts, niveaux, prérequis de technologie, effets des compétences) sont extraites directement des fichiers de configuration du jeu, puis recoupées avec des vérifications en jeu pour détecter d'éventuelles incohérences. Chaque fiche indique le numéro de version du jeu sur laquelle les données ont été extraites.",
            "Numerical data (attack, defense, HP, costs, levels, tech prerequisites, skill effects) is extracted directly from the game's configuration files, then cross-checked with in-game verification. Each fact sheet indicates the game version the data was extracted from.",
            "Die numerischen Werte (Angriff, Verteidigung, HP, Kosten, Stufen, Technologievoraussetzungen, Fähigkeitseffekte) werden direkt aus den Konfigurationsdateien des Spiels extrahiert und anschließend mit In-Game-Überprüfungen abgeglichen, um Unstimmigkeiten zu erkennen. Jede Seite gibt die Spielversion an, aus der die Daten stammen."
          )}
        </p>
        <p>
          {tL(
            "Les descriptions éditoriales, les guides, les analyses de méta, les tier lists et les recommandations stratégiques sont rédigés par l'équipe éditoriale (humaine) à partir de son expérience de jeu, de la lecture attentive des patchs, et des échanges avec la communauté.",
            "Editorial descriptions, guides, meta analyses, tier lists and strategy recommendations are written by the (human) editorial team based on playing experience, careful reading of patch notes, and community exchanges.",
            "Redaktionelle Beschreibungen, Guides, Meta-Analysen, Tier-Listen und Strategie-Empfehlungen werden vom (menschlichen) Redaktionsteam auf Basis eigener Spielerfahrung, sorgfältiger Lektüre der Patch Notes und Austausch mit der Community verfasst."
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={tL("Notre positionnement", "Our stance", "Unsere Haltung")}
      >
        <ul className="list-disc pl-5 space-y-1">
          <li>
            {tL(
              "Site totalement indépendant, sans lien avec le studio ni avec aucun éditeur tiers.",
              "Fully independent site, with no ties to the studio or any third-party publisher.",
              "Vollständig unabhängige Seite, ohne Verbindung zum Studio oder zu Drittanbietern."
            )}
          </li>
          <li>
            {tL(
              "Données vérifiables et sourcées à la version du jeu.",
              "Verifiable, game-version-sourced data.",
              "Nachprüfbare Daten, bezogen auf die jeweilige Spielversion."
            )}
          </li>
          <li>
            {tL(
              "Pas de publicité agressive, pas de bannière intrusive, pas de pop-up.",
              "No aggressive advertising, no intrusive banners, no pop-ups.",
              "Keine aggressive Werbung, keine aufdringlichen Banner, keine Pop-ups."
            )}
          </li>
          <li>
            {tL(
              "Respect strict de la vie privée : aucun tracking tiers.",
              "Strict privacy: no third-party tracking.",
              "Strikter Datenschutz: kein Tracking durch Dritte."
            )}
          </li>
          <li>
            {tL(
              "Contenu gratuit et accessible sans inscription.",
              "Free content, accessible without sign-up.",
              "Kostenlose Inhalte, zugänglich ohne Anmeldung."
            )}
          </li>
        </ul>
      </LegalSection>

      <LegalSection
        title={tL("Comment contribuer ?", "How to contribute", "Wie kannst du mitwirken?")}
      >
        <p>
          {tL(
            "Vous avez repéré une erreur, vous voulez signaler un changement suite à un patch, proposer un guide ou partager des résultats de vote communautaire ? Écrivez-nous via la ",
            "Spotted an error, want to report a patch change, suggest a guide, or share community voting results? Write to us via the ",
            "Hast du einen Fehler entdeckt, willst du eine Patch-Änderung melden, einen Guide vorschlagen oder Community-Abstimmungsergebnisse teilen? Schreib uns über die "
          )}
          <a href="/legal/contact" className="text-gold2 hover:underline">
            {tL("page Contact", "Contact page", "Kontaktseite")}
          </a>
          {tL(
            ". Toute contribution sérieuse est lue et traitée.",
            ". All serious contributions are read and acted on.",
            ". Jeder ernsthafte Beitrag wird gelesen und bearbeitet."
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={tL("Disclaimer officiel", "Official disclaimer", "Offizieller Haftungsausschluss")}
      >
        <p className="text-dim italic">
          {tL(
            `${site.name} est un projet communautaire indépendant. Il n'est pas affilié, associé, autorisé, sponsorisé ni d'aucune façon officiellement lié à ${disclaimer.studioName} ou à l'une de ses filiales. Toutes les marques, logos et noms de jeux mentionnés appartiennent à leurs détenteurs respectifs.`,
            `${site.name} is an independent community project. It is not affiliated with, associated with, authorized by, sponsored by, or in any way officially connected to ${disclaimer.studioName} or any of its subsidiaries. All trademarks, logos and game names mentioned belong to their respective owners.`,
            `${site.name} ist ein unabhängiges Community-Projekt. Es ist in keiner Weise mit ${disclaimer.studioName} oder einer ihrer Tochterfirmen verbunden, von ihnen autorisiert oder gesponsert. Alle erwähnten Marken, Logos und Spielnamen gehören ihren jeweiligen Inhabern.`
          )}
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
