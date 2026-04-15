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
    title: fr ? "Politique de cookies | EasyTech Wiki FR" : "Cookie Policy | EasyTech Wiki",
    description: fr
      ? "Quels cookies sont déposés par EasyTech Wiki FR, à quoi ils servent, et comment les maîtriser."
      : "Which cookies EasyTech Wiki uses, what they are for, and how to control them.",
    robots: { index: true, follow: true },
  };
}

export default function CookiesPage({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const fr = params.locale === "fr";
  const { site } = legalConfig;

  return (
    <LegalLayout
      locale={params.locale}
      title={fr ? "Politique de cookies" : "Cookie Policy"}
      lastUpdated={fr ? "Dernière mise à jour : 15 avril 2026" : "Last updated: April 15, 2026"}
      breadcrumbLabel={fr ? "Cookies" : "Cookies"}
    >
      <LegalSection title={fr ? "En résumé" : "In short"}>
        <p className="text-base">
          {fr
            ? `${site.name} dépose un minimum de cookies. Aucune publicité, aucun tracking tiers, pas de bannière de consentement nécessaire tant que cette configuration reste en place. Seul un petit cookie technique est utilisé pour protéger les votes communautaires des abus.`
            : `${site.name} uses the minimum possible cookies. No ads, no third-party tracking, and no consent banner required as long as this setup remains. Only a small technical cookie is used to protect community votes from abuse.`}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "Qu'est-ce qu'un cookie ?" : "What is a cookie?"}>
        <p>
          {fr
            ? "Un cookie est un petit fichier texte déposé sur votre appareil par votre navigateur lorsque vous visitez un site web. Il permet de stocker des informations comme vos préférences de langue, ou des identifiants techniques pour distinguer une session d'une autre."
            : "A cookie is a small text file placed on your device by your browser when you visit a website. It stores information such as language preferences or technical identifiers to distinguish one session from another."}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "Liste complète des cookies utilisés" : "Full list of cookies used"}>
        <p>
          {fr ? "À ce jour, les seuls cookies déposés par " : "As of today, the only cookies set by "}
          {site.name}
          {fr ? " sont les suivants :" : " are:"}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse mt-3">
            <thead>
              <tr className="bg-[#1a2230] text-gold2">
                <th className="border border-border px-3 py-2 text-left">{fr ? "Nom" : "Name"}</th>
                <th className="border border-border px-3 py-2 text-left">{fr ? "Finalité" : "Purpose"}</th>
                <th className="border border-border px-3 py-2 text-left">{fr ? "Durée" : "Lifetime"}</th>
                <th className="border border-border px-3 py-2 text-left">{fr ? "Essentiel ?" : "Essential?"}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-3 py-2"><code>ew_vote_id</code></td>
                <td className="border border-border px-3 py-2">
                  {fr
                    ? "Identifiant anonyme attribué lors d'un vote communautaire, pour bloquer les votes multiples."
                    : "Anonymous identifier assigned during community voting, to block multiple votes."}
                </td>
                <td className="border border-border px-3 py-2">{fr ? "12 mois glissants" : "12 rolling months"}</td>
                <td className="border border-border px-3 py-2">{fr ? "Oui (exempté de consentement)" : "Yes (exempt from consent)"}</td>
              </tr>
              <tr>
                <td className="border border-border px-3 py-2"><code>NEXT_LOCALE</code></td>
                <td className="border border-border px-3 py-2">
                  {fr
                    ? "Mémorise votre préférence de langue (FR / EN) lorsque vous changez manuellement via le sélecteur de langue."
                    : "Remembers your language preference (FR / EN) when you change it manually via the language switcher."}
                </td>
                <td className="border border-border px-3 py-2">{fr ? "12 mois" : "12 months"}</td>
                <td className="border border-border px-3 py-2">{fr ? "Oui (préférence utilisateur)" : "Yes (user preference)"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          {fr
            ? "Ces deux cookies sont strictement nécessaires au fonctionnement des services que vous utilisez activement. Ils sont exemptés de consentement selon l'article 82 de la loi Informatique et Libertés et la doctrine de la CNIL. Aucun autre cookie n'est déposé."
            : "Both cookies are strictly necessary for the services you actively use. They are exempt from consent under art. 82 of the French Data Protection Act and CNIL guidance. No other cookies are set."}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "Cookies qui pourraient apparaître plus tard" : "Cookies that may appear later"}>
        <p>
          {fr
            ? "Si nous activons un jour de la publicité ou des outils d'analyse non-essentiels, nous mettrons à jour cette page et afficherons une bannière de consentement respectant les exigences CNIL avant tout dépôt de cookie non essentiel. Vous pourrez alors accepter, refuser ou choisir finement vos préférences."
            : "If we ever activate advertising or non-essential analytics tools, we will update this page and show a CNIL-compliant consent banner before any non-essential cookie is set. You will then be able to accept, reject, or fine-tune your preferences."}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "Maîtriser les cookies depuis votre navigateur" : "Controlling cookies from your browser"}>
        <p>
          {fr
            ? "Vous pouvez à tout moment bloquer ou supprimer les cookies via les paramètres de votre navigateur. Voici les liens vers les documentations officielles :"
            : "You can block or delete cookies at any time via your browser settings. Here are links to the official documentation:"}
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><a className="text-gold2 hover:underline" href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
          <li><a className="text-gold2 hover:underline" href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies-preferences" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
          <li><a className="text-gold2 hover:underline" href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Apple Safari</a></li>
          <li><a className="text-gold2 hover:underline" href="https://support.microsoft.com/fr-fr/microsoft-edge" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
        </ul>
        <p>
          {fr
            ? "Attention : bloquer entièrement les cookies peut empêcher certaines fonctionnalités comme le vote communautaire ou la mémorisation de la langue."
            : "Note: fully blocking cookies may disable features like community voting or language preference memory."}
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
