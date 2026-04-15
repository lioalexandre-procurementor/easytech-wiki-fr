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
  const fr = locale === "fr";
  return {
    title: fr ? "À propos | EasyTech Wiki FR" : "About | EasyTech Wiki",
    description: fr
      ? "Qui est derrière EasyTech Wiki FR, pourquoi ce projet existe, et comment les données sont collectées et vérifiées."
      : "Who is behind EasyTech Wiki, why this project exists, and how data is collected and verified.",
    robots: { index: true, follow: true },
  };
}

export default function AboutPage({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const fr = params.locale === "fr";
  const { site, disclaimer } = legalConfig;

  return (
    <LegalLayout
      locale={params.locale}
      title={fr ? "À propos" : "About"}
      lastUpdated={fr ? "Dernière mise à jour : 15 avril 2026" : "Last updated: April 15, 2026"}
      breadcrumbLabel={fr ? "À propos" : "About"}
    >
      <LegalSection title={fr ? "Pourquoi ce site ?" : "Why this site?"}>
        <p>
          {fr
            ? `Les jeux de stratégie d'${disclaimer.studioName} (${disclaimer.games.join(", ")}) cumulent des dizaines de millions de joueurs dans le monde, mais la plupart des ressources disponibles en ligne sont en anglais, en coréen ou en chinois — et souvent incomplètes ou obsolètes. En français, il n'existe quasiment rien de structuré.`
            : `${disclaimer.studioName}'s strategy games (${disclaimer.games.join(", ")}) have tens of millions of players worldwide, but most online resources are in English, Korean or Chinese — and often incomplete or outdated.`}
        </p>
        <p>
          {fr
            ? `${site.name} a été lancé en 2026 pour combler ce vide : offrir aux joueurs francophones une encyclopédie fiable, exhaustive et à jour, directement construite à partir des fichiers de jeu, avec des guides stratégiques rédigés en français et vérifiés.`
            : `${site.name} was launched in 2026 to fill that gap: provide players with a reliable, comprehensive, up-to-date encyclopedia, built directly from the game files, with editorial guides written and verified by humans.`}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "D'où viennent les données ?" : "Where does the data come from?"}>
        <p>
          {fr
            ? "Les statistiques numériques (attaque, défense, HP, coûts, niveaux, prérequis de technologie, effets des compétences) sont extraites directement des fichiers de configuration du jeu, puis recoupées avec des vérifications en jeu pour détecter d'éventuelles incohérences. Chaque fiche indique le numéro de version du jeu sur laquelle les données ont été extraites."
            : "Numerical data (attack, defense, HP, costs, levels, tech prerequisites, skill effects) is extracted directly from the game's configuration files, then cross-checked with in-game verification. Each fact sheet indicates the game version the data was extracted from."}
        </p>
        <p>
          {fr
            ? "Les descriptions éditoriales, les guides, les analyses de méta, les tier lists et les recommandations stratégiques sont rédigés par l'équipe éditoriale (humaine) à partir de son expérience de jeu, de la lecture attentive des patchs, et des échanges avec la communauté."
            : "Editorial descriptions, guides, meta analyses, tier lists and strategy recommendations are written by the (human) editorial team based on playing experience, careful reading of patch notes, and community exchanges."}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "Notre positionnement" : "Our stance"}>
        <ul className="list-disc pl-5 space-y-1">
          <li>{fr ? "Site totalement indépendant, sans lien avec le studio ni avec aucun éditeur tiers." : "Fully independent site, with no ties to the studio or any third-party publisher."}</li>
          <li>{fr ? "Données vérifiables et sourcées à la version du jeu." : "Verifiable, game-version-sourced data."}</li>
          <li>{fr ? "Pas de publicité agressive, pas de bannière intrusive, pas de pop-up." : "No aggressive advertising, no intrusive banners, no pop-ups."}</li>
          <li>{fr ? "Respect strict de la vie privée : aucun tracking tiers." : "Strict privacy: no third-party tracking."}</li>
          <li>{fr ? "Contenu gratuit et accessible sans inscription." : "Free content, accessible without sign-up."}</li>
        </ul>
      </LegalSection>

      <LegalSection title={fr ? "Comment contribuer ?" : "How to contribute"}>
        <p>
          {fr
            ? "Vous avez repéré une erreur, vous voulez signaler un changement suite à un patch, proposer un guide ou partager des résultats de vote communautaire ? Écrivez-nous via la "
            : "Spotted an error, want to report a patch change, suggest a guide, or share community voting results? Write to us via the "}
          <a href="/legal/contact" className="text-gold2 hover:underline">
            {fr ? "page Contact" : "Contact page"}
          </a>
          {fr ? ". Toute contribution sérieuse est lue et traitée." : ". All serious contributions are read and acted on."}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "Disclaimer officiel" : "Official disclaimer"}>
        <p className="text-dim italic">
          {fr
            ? `${site.name} est un projet communautaire indépendant. Il n'est pas affilié, associé, autorisé, sponsorisé ni d'aucune façon officiellement lié à ${disclaimer.studioName} ou à l'une de ses filiales. Toutes les marques, logos et noms de jeux mentionnés appartiennent à leurs détenteurs respectifs.`
            : `${site.name} is an independent community project. It is not affiliated with, associated with, authorized by, sponsored by, or in any way officially connected to ${disclaimer.studioName} or any of its subsidiaries. All trademarks, logos and game names mentioned belong to their respective owners.`}
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
