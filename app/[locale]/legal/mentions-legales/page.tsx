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
  const fr = locale === "fr";
  return {
    title: fr ? "Mentions légales | EasyTech Wiki FR" : "Legal Notice | EasyTech Wiki",
    description: fr
      ? "Mentions légales du site EasyTech Wiki FR : éditeur, directeur de publication, hébergeur, propriété intellectuelle."
      : "Legal notice for EasyTech Wiki: publisher, hosting, and intellectual property disclaimers.",
    robots: { index: true, follow: true },
  };
}

export default function MentionsLegalesPage({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const fr = params.locale === "fr";
  const { publisher, host, site, disclaimer } = legalConfig;

  return (
    <LegalLayout
      locale={params.locale}
      title={fr ? "Mentions légales" : "Legal Notice"}
      lastUpdated={fr ? "Dernière mise à jour : 15 avril 2026" : "Last updated: April 15, 2026"}
      breadcrumbLabel={fr ? "Mentions légales" : "Legal Notice"}
    >
      {/* ─── Publisher ─────────────────────────────────────────── */}
      <LegalSection title={fr ? "Éditeur du site" : "Site publisher"}>
        <p>
          {fr
            ? "Le présent site est édité par :"
            : "This site is published by:"}
        </p>
        <LegalField label={fr ? "Nom / Raison sociale" : "Name"} value={publisher.name} />
        {publisher.type === "company" && publisher.legalForm && (
          <>
            <LegalField label={fr ? "Forme juridique" : "Legal form"} value={publisher.legalForm} />
            {publisher.siren && <LegalField label="SIREN" value={publisher.siren} />}
            {publisher.siret && <LegalField label="SIRET" value={publisher.siret} />}
            {publisher.vatNumber && (
              <LegalField label={fr ? "TVA intracommunautaire" : "VAT number"} value={publisher.vatNumber} />
            )}
            {publisher.shareCapital && (
              <LegalField label={fr ? "Capital social" : "Share capital"} value={publisher.shareCapital} />
            )}
          </>
        )}
        <LegalField
          label={fr ? "Adresse" : "Address"}
          value={`${publisher.address}, ${publisher.postalCode} ${publisher.city}, ${publisher.country}`}
        />
        <LegalField label="Email" value={publisher.email} />
        <LegalField
          label={fr ? "Directeur de la publication" : "Publication director"}
          value={publisher.publicationDirector}
        />
      </LegalSection>

      {/* ─── Host ─────────────────────────────────────────────── */}
      <LegalSection title={fr ? "Hébergement" : "Hosting"}>
        <p>
          {fr
            ? "Le site est hébergé par :"
            : "The site is hosted by:"}
        </p>
        <LegalField label={fr ? "Hébergeur" : "Provider"} value={host.name} />
        <LegalField label={fr ? "Adresse" : "Address"} value={host.address} />
        <LegalField label={fr ? "Site web" : "Website"} value={host.website} />
      </LegalSection>

      {/* ─── Purpose ─────────────────────────────────────────── */}
      <LegalSection title={fr ? "Objet du site" : "Purpose"}>
        <p>
          {fr
            ? `${site.name} est un site encyclopédique indépendant dédié aux jeux de stratégie édités par ${disclaimer.studioName}. Il propose des fiches détaillées (unités, généraux, compétences, technologies), des guides stratégiques, des comparatifs et des outils communautaires à destination des joueurs francophones.`
            : `${site.name} is an independent encyclopedic website dedicated to the strategy games published by ${disclaimer.studioName}. It provides detailed data sheets (units, generals, skills, technologies), strategy guides, comparators and community tools for players.`}
        </p>
      </LegalSection>

      {/* ─── IP / Copyright ──────────────────────────────────── */}
      <LegalSection title={fr ? "Propriété intellectuelle et marques" : "Intellectual property and trademarks"}>
        <p>
          <strong>{fr ? "Site non-officiel." : "Unofficial website."}</strong>{" "}
          {fr
            ? `${site.name} n'est ni affilié, ni associé, ni autorisé, ni sponsorisé par ${disclaimer.studioName} ou par l'une de ses filiales. Toutes les marques, noms de jeux, noms de personnages, logos et œuvres graphiques cités (${disclaimer.games.join(", ")}) sont la propriété exclusive de leurs détenteurs respectifs et sont mentionnés à des fins strictement informatives et illustratives.`
            : `${site.name} is neither affiliated with, nor endorsed by, nor sponsored by ${disclaimer.studioName} or any of its subsidiaries. All trademarks, game names, character names, logos and artwork referenced (${disclaimer.games.join(", ")}) are the exclusive property of their respective owners and are mentioned for informational and illustrative purposes only.`}
        </p>
        <p>
          {fr
            ? "Les données chiffrées (statistiques d'unités, coûts, niveaux, descriptions techniques) relèvent de faits non protégeables par le droit d'auteur et sont reproduites conformément à l'article L.122-5 du Code de la propriété intellectuelle (courtes citations à but d'information). Les captures d'écran, lorsqu'elles sont utilisées, le sont dans le cadre de l'exception de courte citation à fin d'illustration et d'analyse."
            : "Numerical data (unit stats, costs, levels, technical descriptions) are facts not protected by copyright and are reproduced under French IP Code art. L.122-5 (fair short-citation for informational purposes). Screenshots, when used, fall under the short-citation exception for illustrative and analytical purposes."}
        </p>
        <p>
          {fr
            ? `Les textes rédactionnels, guides, comparatifs et éléments originaux produits par ${site.name} sont protégés par le droit d'auteur. Toute reproduction, représentation, adaptation ou traduction, partielle ou totale, par quelque procédé que ce soit, est interdite sans autorisation écrite préalable, sauf dans les cas prévus par la loi.`
            : `Editorial content, guides, comparators and original material produced by ${site.name} are protected by copyright. Any reproduction, adaptation or translation, in whole or in part, is forbidden without prior written consent, except as permitted by law.`}
        </p>
        <p>
          {fr
            ? "Pour toute demande de retrait d'un contenu protégé, les titulaires de droits peuvent écrire à l'adresse email indiquée ci-dessus. Les demandes légitimes seront traitées sous 7 jours."
            : "To request removal of protected content, rights holders may write to the email address listed above. Legitimate requests will be processed within 7 days."}
        </p>
      </LegalSection>

      {/* ─── Liability ───────────────────────────────────────── */}
      <LegalSection title={fr ? "Limitation de responsabilité" : "Limitation of liability"}>
        <p>
          {fr
            ? `${site.name} s'efforce de fournir des informations aussi exactes que possible, extraites directement des fichiers du jeu. Cependant, les mécaniques de jeu peuvent changer d'une version à l'autre. Les informations présentes sur le site ne constituent pas une garantie de résultat en jeu, et l'éditeur ne saurait être tenu responsable d'erreurs, d'omissions ou de modifications intervenues après publication.`
            : `${site.name} strives to provide information as accurate as possible, extracted directly from the game files. However, game mechanics may change between versions. Information on this site does not constitute a guarantee of in-game results, and the publisher cannot be held liable for errors, omissions, or changes made after publication.`}
        </p>
      </LegalSection>

      {/* ─── Applicable law ──────────────────────────────────── */}
      <LegalSection title={fr ? "Droit applicable" : "Applicable law"}>
        <p>
          {fr
            ? "Les présentes mentions légales sont soumises au droit français. Tout litige relatif à leur interprétation ou à leur exécution relève de la compétence exclusive des tribunaux français."
            : "This legal notice is governed by French law. Any dispute relating to its interpretation or execution falls within the exclusive jurisdiction of French courts."}
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
