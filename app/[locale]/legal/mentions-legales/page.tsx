import type { Metadata } from "next";
import { unstable_setRequestLocale } from "next-intl/server";
import { locales } from "@/src/i18n/config";
import { LegalLayout, LegalSection, LegalField } from "@/components/LegalLayout";
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
    fr: "Mentions légales | EasyTech Wiki FR",
    en: "Legal Notice | EasyTech Wiki",
    de: "Impressum | EasyTech Wiki",
  };
  const descriptions: Record<string, string> = {
    fr: "Mentions légales du site EasyTech Wiki FR : éditeur, directeur de publication, hébergeur, propriété intellectuelle.",
    en: "Legal notice for EasyTech Wiki: publisher, hosting, and intellectual property disclaimers.",
    de: "Impressum des EasyTech Wiki: Anbieter, verantwortlich für den Inhalt, Hosting und Hinweise zum Urheberrecht.",
  };
  return {
    title: titles[locale] ?? titles.en,
    description: descriptions[locale] ?? descriptions.en,
    robots: { index: true, follow: true },
  };
}

export default function MentionsLegalesPage({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const tL = (fr: string, en: string, de: string): string =>
    params.locale === "fr" ? fr : params.locale === "de" ? de : en;
  const { publisher, host, site, disclaimer } = legalConfig;

  return (
    <LegalLayout
      locale={params.locale}
      title={tL("Mentions légales", "Legal Notice", "Impressum")}
      lastUpdated={tL(
        "Dernière mise à jour : 15 avril 2026",
        "Last updated: April 15, 2026",
        "Zuletzt aktualisiert: 15. April 2026"
      )}
      breadcrumbLabel={tL("Mentions légales", "Legal Notice", "Impressum")}
    >
      {/* ─── Publisher ─────────────────────────────────────────── */}
      <LegalSection title={tL("Éditeur du site", "Site publisher", "Angaben gemäß § 5 TMG")}>
        <p>
          {tL(
            "Le présent site est édité par :",
            "This site is published by:",
            "Diese Website wird herausgegeben von:"
          )}
        </p>
        <LegalField label={tL("Nom / Raison sociale", "Name", "Name / Firma")} value={publisher.name} />
        {publisher.type === "company" && publisher.legalForm && (
          <>
            <LegalField label={tL("Forme juridique", "Legal form", "Rechtsform")} value={publisher.legalForm} />
            {publisher.siren && <LegalField label="SIREN" value={publisher.siren} />}
            {publisher.siret && <LegalField label="SIRET" value={publisher.siret} />}
            {publisher.vatNumber && (
              <LegalField label={tL("TVA intracommunautaire", "VAT number", "Umsatzsteuer-Identifikationsnummer")} value={publisher.vatNumber} />
            )}
            {publisher.shareCapital && (
              <LegalField label={tL("Capital social", "Share capital", "Stammkapital")} value={publisher.shareCapital} />
            )}
          </>
        )}
        <LegalField
          label={tL("Adresse", "Address", "Anschrift")}
          value={`${publisher.address}, ${publisher.postalCode} ${publisher.city}, ${publisher.country}`}
        />
        <LegalField label="Email" value={publisher.email} />
        <LegalField
          label={tL("Directeur de la publication", "Publication director", "Verantwortlich für den Inhalt")}
          value={publisher.publicationDirector}
        />
      </LegalSection>

      {/* ─── Host ─────────────────────────────────────────────── */}
      <LegalSection title={tL("Hébergement", "Hosting", "Hosting")}>
        <p>
          {tL(
            "Le site est hébergé par :",
            "The site is hosted by:",
            "Die Website wird gehostet von:"
          )}
        </p>
        <LegalField label={tL("Hébergeur", "Provider", "Hosting-Anbieter")} value={host.name} />
        <LegalField label={tL("Adresse", "Address", "Anschrift")} value={host.address} />
        <LegalField label={tL("Site web", "Website", "Website")} value={host.website} />
      </LegalSection>

      {/* ─── Purpose ─────────────────────────────────────────── */}
      <LegalSection title={tL("Objet du site", "Purpose", "Zweck der Website")}>
        <p>
          {tL(
            `${site.name} est un site encyclopédique indépendant dédié aux jeux de stratégie édités par ${disclaimer.studioName}. Il propose des fiches détaillées (unités, généraux, compétences, technologies), des guides stratégiques, des comparatifs et des outils communautaires à destination des joueurs francophones.`,
            `${site.name} is an independent encyclopedic website dedicated to the strategy games published by ${disclaimer.studioName}. It provides detailed data sheets (units, generals, skills, technologies), strategy guides, comparators and community tools for players.`,
            `${site.name} ist eine unabhängige enzyklopädische Website, die den von ${disclaimer.studioName} veröffentlichten Strategiespielen gewidmet ist. Sie bietet detaillierte Datenblätter (Einheiten, Generäle, Fähigkeiten, Technologien), Strategieratgeber, Vergleiche und Community-Tools für Spieler.`
          )}
        </p>
      </LegalSection>

      {/* ─── IP / Copyright ──────────────────────────────────── */}
      <LegalSection title={tL("Propriété intellectuelle et marques", "Intellectual property and trademarks", "Urheberrecht und Markenrechte")}>
        <p>
          <strong>{tL("Site non-officiel.", "Unofficial website.", "Inoffizielle Website.")}</strong>{" "}
          {tL(
            `${site.name} n'est ni affilié, ni associé, ni autorisé, ni sponsorisé par ${disclaimer.studioName} ou par l'une de ses filiales. Toutes les marques, noms de jeux, noms de personnages, logos et œuvres graphiques cités (${disclaimer.games.join(", ")}) sont la propriété exclusive de leurs détenteurs respectifs et sont mentionnés à des fins strictement informatives et illustratives.`,
            `${site.name} is neither affiliated with, nor endorsed by, nor sponsored by ${disclaimer.studioName} or any of its subsidiaries. All trademarks, game names, character names, logos and artwork referenced (${disclaimer.games.join(", ")}) are the exclusive property of their respective owners and are mentioned for informational and illustrative purposes only.`,
            `${site.name} ist weder mit ${disclaimer.studioName} noch mit einer seiner Tochtergesellschaften verbunden, von diesen unterstützt, autorisiert oder gesponsert. Alle genannten Marken, Spielenamen, Charakternamen, Logos und grafischen Werke (${disclaimer.games.join(", ")}) sind das ausschließliche Eigentum ihrer jeweiligen Inhaber und werden ausschließlich zu Informations- und Illustrationszwecken genannt.`
          )}
        </p>
        <p>
          {tL(
            "Les données chiffrées (statistiques d'unités, coûts, niveaux, descriptions techniques) relèvent de faits non protégeables par le droit d'auteur et sont reproduites conformément à l'article L.122-5 du Code de la propriété intellectuelle (courtes citations à but d'information). Les captures d'écran, lorsqu'elles sont utilisées, le sont dans le cadre de l'exception de courte citation à fin d'illustration et d'analyse.",
            "Numerical data (unit stats, costs, levels, technical descriptions) are facts not protected by copyright and are reproduced under French IP Code art. L.122-5 (fair short-citation for informational purposes). Screenshots, when used, fall under the short-citation exception for illustrative and analytical purposes.",
            "Zahlenangaben (Einheitenstatistiken, Kosten, Stufen, technische Beschreibungen) sind urheberrechtlich nicht geschützte Fakten und werden gemäß Artikel L.122-5 des französischen Gesetzes über geistiges Eigentum (Kurzzitate zu Informationszwecken) wiedergegeben. Screenshots werden, sofern verwendet, im Rahmen der Ausnahme des Kurzzitats zu Illustrations- und Analysezwecken eingesetzt."
          )}
        </p>
        <p>
          {tL(
            `Les textes rédactionnels, guides, comparatifs et éléments originaux produits par ${site.name} sont protégés par le droit d'auteur. Toute reproduction, représentation, adaptation ou traduction, partielle ou totale, par quelque procédé que ce soit, est interdite sans autorisation écrite préalable, sauf dans les cas prévus par la loi.`,
            `Editorial content, guides, comparators and original material produced by ${site.name} are protected by copyright. Any reproduction, adaptation or translation, in whole or in part, is forbidden without prior written consent, except as permitted by law.`,
            `Die redaktionellen Texte, Ratgeber, Vergleiche und originären Inhalte, die von ${site.name} erstellt wurden, sind urheberrechtlich geschützt. Jede Vervielfältigung, Wiedergabe, Bearbeitung oder Übersetzung, ganz oder teilweise, gleich in welchem Verfahren, ist ohne vorherige schriftliche Genehmigung untersagt, sofern das Gesetz nichts anderes vorsieht.`
          )}
        </p>
        <p>
          {tL(
            "Pour toute demande de retrait d'un contenu protégé, les titulaires de droits peuvent écrire à l'adresse email indiquée ci-dessus. Les demandes légitimes seront traitées sous 7 jours.",
            "To request removal of protected content, rights holders may write to the email address listed above. Legitimate requests will be processed within 7 days.",
            "Für Anträge auf Entfernung geschützter Inhalte können sich Rechteinhaber an die oben genannte E-Mail-Adresse wenden. Berechtigte Anfragen werden innerhalb von 7 Tagen bearbeitet."
          )}
        </p>
      </LegalSection>

      {/* ─── Liability ───────────────────────────────────────── */}
      <LegalSection title={tL("Limitation de responsabilité", "Limitation of liability", "Haftungsausschluss")}>
        <p>
          {tL(
            `${site.name} s'efforce de fournir des informations aussi exactes que possible, extraites directement des fichiers du jeu. Cependant, les mécaniques de jeu peuvent changer d'une version à l'autre. Les informations présentes sur le site ne constituent pas une garantie de résultat en jeu, et l'éditeur ne saurait être tenu responsable d'erreurs, d'omissions ou de modifications intervenues après publication.`,
            `${site.name} strives to provide information as accurate as possible, extracted directly from the game files. However, game mechanics may change between versions. Information on this site does not constitute a guarantee of in-game results, and the publisher cannot be held liable for errors, omissions, or changes made after publication.`,
            `${site.name} bemüht sich, möglichst genaue Informationen bereitzustellen, die direkt aus den Spieldateien entnommen werden. Spielmechaniken können sich jedoch von Version zu Version ändern. Die auf dieser Website enthaltenen Informationen stellen keine Garantie für Spielergebnisse dar, und der Anbieter kann nicht für Fehler, Auslassungen oder nach der Veröffentlichung vorgenommene Änderungen haftbar gemacht werden.`
          )}
        </p>
      </LegalSection>

      {/* ─── Applicable law ──────────────────────────────────── */}
      <LegalSection title={tL("Droit applicable", "Applicable law", "Anwendbares Recht")}>
        <p>
          {tL(
            "Les présentes mentions légales sont soumises au droit français. Tout litige relatif à leur interprétation ou à leur exécution relève de la compétence exclusive des tribunaux français.",
            "This legal notice is governed by French law. Any dispute relating to its interpretation or execution falls within the exclusive jurisdiction of French courts.",
            "Dieses Impressum unterliegt französischem Recht. Für alle Streitigkeiten über seine Auslegung oder Durchführung sind ausschließlich die französischen Gerichte zuständig."
          )}
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
