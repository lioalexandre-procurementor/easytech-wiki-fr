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
  const titles: Record<string, string> = {
    fr: "Contact | EasyTech Wiki FR",
    en: "Contact | EasyTech Wiki",
    de: "Kontakt | EasyTech Wiki DE",
  };
  const descriptions: Record<string, string> = {
    fr: "Comment contacter l'équipe EasyTech Wiki FR.",
    en: "How to reach the EasyTech Wiki team.",
    de: "So erreichen Sie das Team des EasyTech Wiki.",
  };
  return {
    title: titles[locale] ?? titles.en,
    description: descriptions[locale] ?? descriptions.en,
    robots: { index: true, follow: true },
  };
}

export default function ContactPage({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const tL = (fr: string, en: string, de: string): string =>
    params.locale === "fr" ? fr : params.locale === "de" ? de : en;
  const { publisher, dataController } = legalConfig;

  return (
    <LegalLayout
      locale={params.locale}
      title={tL("Nous contacter", "Contact us", "Kontakt")}
      lastUpdated={tL("Dernière mise à jour : 15 avril 2026", "Last updated: April 15, 2026", "Zuletzt aktualisiert: 15. April 2026")}
      breadcrumbLabel={tL("Contact", "Contact", "Kontakt")}
    >
      <LegalSection title={tL("Pour les questions générales", "For general inquiries", "Für allgemeine Anfragen")}>
        <p>
          {tL(
            "Erreur dans une fiche, suggestion de guide, proposition de contribution, question sur le site :",
            "Spotted an error, suggestion for a guide, want to contribute, question about the site:",
            "Fehler in einem Eintrag entdeckt, Vorschlag für einen Leitfaden, Beitrag leisten, Frage zur Website:"
          )}
        </p>
        <p className="text-lg">
          <a className="text-gold2 hover:underline" href={`mailto:${publisher.email}`}>
            {publisher.email}
          </a>
        </p>
      </LegalSection>

      <LegalSection title={tL("Pour les questions de confidentialité / RGPD", "For privacy / GDPR matters", "Für Datenschutz- / DSGVO-Anfragen")}>
        <p>
          {tL(
            "Exercice de vos droits (accès, rectification, effacement, opposition, portabilité) :",
            "Exercising your rights (access, rectification, erasure, objection, portability):",
            "Ausübung Ihrer Rechte (Auskunft, Berichtigung, Löschung, Widerspruch, Datenübertragbarkeit):"
          )}
        </p>
        <p className="text-lg">
          <a className="text-gold2 hover:underline" href={`mailto:${dataController.email}`}>
            {dataController.email}
          </a>
        </p>
        <p className="text-xs text-muted mt-2">
          {tL(
            "Nous répondons dans un délai maximum de 30 jours conformément au RGPD.",
            "We respond within 30 days at most, as required by GDPR.",
            "Wir antworten gemäß DSGVO innerhalb von höchstens 30 Tagen."
          )}
        </p>
      </LegalSection>

      <LegalSection title={tL("Pour les ayants droit (demandes de retrait)", "For rights holders (takedown requests)", "Für Rechteinhaber (Anträge auf Entfernung)")}>
        <p>
          {tL(
            `Si vous estimez qu'un contenu publié sur ${publisher.name} porte atteinte à vos droits (propriété intellectuelle, droit à l'image, marques), veuillez nous écrire à l'adresse de contact générale. Merci d'indiquer :`,
            `If you believe content published on this site infringes your rights (intellectual property, image rights, trademarks), please write to our general contact address. Please include:`,
            `Falls Sie der Ansicht sind, dass auf ${publisher.name} veröffentlichte Inhalte Ihre Rechte verletzen (geistiges Eigentum, Recht am eigenen Bild, Marken), schreiben Sie uns bitte an die allgemeine Kontaktadresse. Bitte geben Sie Folgendes an:`
          )}
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{tL("Votre identité et vos coordonnées", "Your identity and contact details", "Ihre Identität und Ihre Kontaktdaten")}</li>
          <li>{tL("L'URL exacte du contenu concerné", "The exact URL of the content in question", "Die genaue URL des betreffenden Inhalts")}</li>
          <li>{tL("La nature du droit invoqué et la preuve de détention", "The nature of the right invoked and proof of ownership", "Die Art des geltend gemachten Rechts und den Nachweis der Inhaberschaft")}</li>
          <li>{tL("La raison précise pour laquelle vous demandez le retrait", "The specific reason for the takedown request", "Den genauen Grund für Ihren Antrag auf Entfernung")}</li>
        </ul>
        <p className="text-xs text-muted mt-2">
          {tL(
            "Les demandes légitimes et complètes sont traitées sous 7 jours.",
            "Legitimate and complete requests are processed within 7 days.",
            "Berechtigte und vollständige Anträge werden innerhalb von 7 Tagen bearbeitet."
          )}
        </p>
      </LegalSection>

      <LegalSection title={tL("Ce que nous ne traitons pas", "What we don't handle", "Was wir nicht bearbeiten")}>
        <ul className="list-disc pl-5 space-y-1">
          <li>{tL("Support technique des jeux eux-mêmes (contactez directement le studio).", "Technical support for the games themselves (contact the studio directly).", "Technischer Support für die Spiele selbst (wenden Sie sich bitte direkt an das Studio).")}</li>
          <li>{tL("Problèmes de compte ou de facturation in-game.", "In-game account or billing issues.", "Probleme mit In-Game-Konten oder Abrechnungen.")}</li>
          <li>{tL("Demandes de prestation commerciale non sollicitées.", "Unsolicited commercial offers.", "Unaufgeforderte kommerzielle Angebote.")}</li>
        </ul>
      </LegalSection>
    </LegalLayout>
  );
}
