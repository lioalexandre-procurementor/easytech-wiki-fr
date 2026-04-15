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
    title: fr ? "Conditions générales d'utilisation | EasyTech Wiki FR" : "Terms of Use | EasyTech Wiki",
    description: fr
      ? "Conditions générales d'utilisation d'EasyTech Wiki FR."
      : "Terms of Use for EasyTech Wiki.",
    robots: { index: true, follow: true },
  };
}

export default function CguPage({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const fr = params.locale === "fr";
  const { site, disclaimer } = legalConfig;

  return (
    <LegalLayout
      locale={params.locale}
      title={fr ? "Conditions générales d'utilisation" : "Terms of Use"}
      lastUpdated={fr ? "Dernière mise à jour : 15 avril 2026" : "Last updated: April 15, 2026"}
      breadcrumbLabel={fr ? "CGU" : "Terms"}
    >
      <LegalSection title={fr ? "1. Objet" : "1. Purpose"}>
        <p>
          {fr
            ? `Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et l'utilisation du site ${site.name} (ci-après « le Site »). En accédant au Site, vous acceptez sans réserve les présentes CGU. Si vous ne les acceptez pas, nous vous invitons à cesser immédiatement votre navigation.`
            : `These Terms of Use govern access to and use of ${site.name} (the "Site"). By accessing the Site, you accept these Terms in full. If you do not accept them, please stop browsing immediately.`}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "2. Accès au Site" : "2. Access to the Site"}>
        <p>
          {fr
            ? "Le Site est accessible gratuitement, 24 heures sur 24, 7 jours sur 7, sauf en cas de force majeure ou d'intervention technique planifiée. L'éditeur ne peut être tenu responsable des interruptions, lenteurs ou indisponibilités."
            : "The Site is accessible free of charge, 24/7, except in cases of force majeure or scheduled technical maintenance. The publisher cannot be held liable for interruptions, slowness, or downtime."}
        </p>
        <p>
          {fr
            ? "Aucune inscription n'est requise pour consulter les pages encyclopédiques. Certaines fonctionnalités interactives (votes communautaires) peuvent nécessiter l'acceptation d'un cookie technique décrit dans notre "
            : "No registration is required to view encyclopedic pages. Some interactive features (community voting) may require accepting a technical cookie described in our "}
          <a href="/legal/cookies" className="text-gold2 hover:underline">
            {fr ? "politique de cookies" : "cookie policy"}
          </a>.
        </p>
      </LegalSection>

      <LegalSection title={fr ? "3. Usage autorisé" : "3. Permitted use"}>
        <p>
          {fr
            ? "Vous pouvez consulter, imprimer et partager le contenu du Site à des fins strictement personnelles et non commerciales. Toute utilisation à des fins commerciales, toute extraction massive automatisée (scraping, crawl intensif) ou toute copie en vue de la republication sur un autre site sont interdites sans autorisation écrite préalable de l'éditeur."
            : "You may browse, print and share the Site's content for strictly personal, non-commercial purposes. Any commercial use, massive automated extraction (scraping, aggressive crawling), or copying for republication on another site is prohibited without prior written consent from the publisher."}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "4. Contenus générés par les utilisateurs" : "4. User-generated content"}>
        <p>
          {fr
            ? "Lorsqu'un visiteur participe à un vote communautaire, la donnée transmise est strictement le choix de vote, accompagné d'un identifiant anonyme. Aucun champ libre n'est proposé et aucune modération de commentaires n'est nécessaire."
            : "When a visitor participates in a community vote, the data transmitted is strictly the vote choice, along with an anonymous identifier. No free-text field is offered and no comment moderation is needed."}
        </p>
        <p>
          {fr
            ? "Si un système de commentaires ou de contribution ouverte est ajouté ultérieurement, ces CGU seront mises à jour pour inclure une clause de modération et de responsabilité."
            : "If a comment or open contribution system is added later, these Terms will be updated to include moderation and liability clauses."}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "5. Propriété intellectuelle" : "5. Intellectual property"}>
        <p>
          {fr
            ? `Les éléments éditoriaux originaux (guides, analyses, comparatifs, rédaction, structure de l'information, visuels produits par l'éditeur) sont la propriété exclusive de ${site.name} et protégés par le droit d'auteur. Les marques et jeux ${disclaimer.games.join(", ")} appartiennent à ${disclaimer.studioName} et sont cités à titre informatif. Voir la page `
            : `Original editorial elements (guides, analysis, comparators, copy, information structure, visuals produced by the publisher) are the exclusive property of ${site.name} and protected by copyright. The trademarks and games ${disclaimer.games.join(", ")} belong to ${disclaimer.studioName} and are mentioned for informational purposes. See the `}
          <a href="/legal/mentions-legales" className="text-gold2 hover:underline">
            {fr ? "Mentions légales" : "Legal Notice"}
          </a>{" "}
          {fr ? "pour le détail." : "for details."}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "6. Liens externes" : "6. External links"}>
        <p>
          {fr
            ? "Le Site peut contenir des liens vers d'autres sites web. L'éditeur n'a aucun contrôle sur le contenu de ces sites tiers et ne peut être tenu responsable de leurs pratiques ou de leur disponibilité."
            : "The Site may contain links to other websites. The publisher has no control over the content of these third-party sites and cannot be held liable for their practices or availability."}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "7. Limitation de responsabilité" : "7. Limitation of liability"}>
        <p>
          {fr
            ? "Le contenu du Site est fourni à titre purement informatif. L'éditeur ne garantit pas l'exactitude, l'exhaustivité ou l'actualité des informations publiées. L'utilisation du Site se fait sous votre seule responsabilité. En aucun cas l'éditeur ne pourra être tenu responsable de dommages directs ou indirects résultant de l'utilisation du Site."
            : "Site content is provided for informational purposes only. The publisher does not guarantee the accuracy, completeness, or timeliness of the information published. Use of the Site is at your own risk. In no event shall the publisher be liable for direct or indirect damages resulting from use of the Site."}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "8. Modification des CGU" : "8. Changes to these Terms"}>
        <p>
          {fr
            ? "L'éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication sur le Site. Il est conseillé de relire cette page périodiquement."
            : "The publisher may modify these Terms at any time. Changes take effect upon publication on the Site. Please review this page periodically."}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "9. Droit applicable et juridiction" : "9. Applicable law and jurisdiction"}>
        <p>
          {fr
            ? "Les présentes CGU sont soumises au droit français. Tout litige relatif à leur interprétation ou à leur exécution relève de la compétence exclusive des tribunaux français, sous réserve des règles impératives protégeant les consommateurs."
            : "These Terms are governed by French law. Any dispute relating to their interpretation or execution falls within the exclusive jurisdiction of French courts, subject to mandatory consumer protection rules."}
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
