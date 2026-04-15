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
    title: fr ? "Contact | EasyTech Wiki FR" : "Contact | EasyTech Wiki",
    description: fr
      ? "Comment contacter l'équipe EasyTech Wiki FR."
      : "How to reach the EasyTech Wiki team.",
    robots: { index: true, follow: true },
  };
}

export default function ContactPage({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const fr = params.locale === "fr";
  const { publisher, dataController } = legalConfig;

  return (
    <LegalLayout
      locale={params.locale}
      title={fr ? "Nous contacter" : "Contact us"}
      lastUpdated={fr ? "Dernière mise à jour : 15 avril 2026" : "Last updated: April 15, 2026"}
      breadcrumbLabel={fr ? "Contact" : "Contact"}
    >
      <LegalSection title={fr ? "Pour les questions générales" : "For general inquiries"}>
        <p>
          {fr
            ? "Erreur dans une fiche, suggestion de guide, proposition de contribution, question sur le site :"
            : "Spotted an error, suggestion for a guide, want to contribute, question about the site:"}
        </p>
        <p className="text-lg">
          <a className="text-gold2 hover:underline" href={`mailto:${publisher.email}`}>
            {publisher.email}
          </a>
        </p>
      </LegalSection>

      <LegalSection title={fr ? "Pour les questions de confidentialité / RGPD" : "For privacy / GDPR matters"}>
        <p>
          {fr
            ? "Exercice de vos droits (accès, rectification, effacement, opposition, portabilité) :"
            : "Exercising your rights (access, rectification, erasure, objection, portability):"}
        </p>
        <p className="text-lg">
          <a className="text-gold2 hover:underline" href={`mailto:${dataController.email}`}>
            {dataController.email}
          </a>
        </p>
        <p className="text-xs text-muted mt-2">
          {fr
            ? "Nous répondons dans un délai maximum de 30 jours conformément au RGPD."
            : "We respond within 30 days at most, as required by GDPR."}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "Pour les ayants droit (demandes de retrait)" : "For rights holders (takedown requests)"}>
        <p>
          {fr
            ? `Si vous estimez qu'un contenu publié sur ${publisher.name} porte atteinte à vos droits (propriété intellectuelle, droit à l'image, marques), veuillez nous écrire à l'adresse de contact générale. Merci d'indiquer :`
            : `If you believe content published on this site infringes your rights (intellectual property, image rights, trademarks), please write to our general contact address. Please include:`}
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{fr ? "Votre identité et vos coordonnées" : "Your identity and contact details"}</li>
          <li>{fr ? "L'URL exacte du contenu concerné" : "The exact URL of the content in question"}</li>
          <li>{fr ? "La nature du droit invoqué et la preuve de détention" : "The nature of the right invoked and proof of ownership"}</li>
          <li>{fr ? "La raison précise pour laquelle vous demandez le retrait" : "The specific reason for the takedown request"}</li>
        </ul>
        <p className="text-xs text-muted mt-2">
          {fr
            ? "Les demandes légitimes et complètes sont traitées sous 7 jours."
            : "Legitimate and complete requests are processed within 7 days."}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "Ce que nous ne traitons pas" : "What we don't handle"}>
        <ul className="list-disc pl-5 space-y-1">
          <li>{fr ? "Support technique des jeux eux-mêmes (contactez directement le studio)." : "Technical support for the games themselves (contact the studio directly)."}</li>
          <li>{fr ? "Problèmes de compte ou de facturation in-game." : "In-game account or billing issues."}</li>
          <li>{fr ? "Demandes de prestation commerciale non sollicitées." : "Unsolicited commercial offers."}</li>
        </ul>
      </LegalSection>
    </LegalLayout>
  );
}
