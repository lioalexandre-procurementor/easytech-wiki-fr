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
    fr: "Politique de cookies | EasyTech Wiki FR",
    en: "Cookie Policy | EasyTech Wiki",
    de: "Cookie-Richtlinie | EasyTech Wiki DE",
  };
  const descriptions: Record<string, string> = {
    fr: "Quels cookies sont déposés par EasyTech Wiki FR, à quoi ils servent, et comment les maîtriser.",
    en: "Which cookies EasyTech Wiki uses, what they are for, and how to control them.",
    de: "Welche Cookies EasyTech Wiki DE verwendet, wofür sie dienen und wie Sie sie steuern können.",
  };
  return {
    title: titles[locale] ?? titles.en,
    description: descriptions[locale] ?? descriptions.en,
    robots: { index: true, follow: true },
  };
}

export default function CookiesPage({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const tL = (fr: string, en: string, de: string): string =>
    params.locale === "fr" ? fr : params.locale === "de" ? de : en;
  const { site } = legalConfig;

  return (
    <LegalLayout
      locale={params.locale}
      title={tL("Politique de cookies", "Cookie Policy", "Cookie-Richtlinie")}
      lastUpdated={tL("Dernière mise à jour : 15 avril 2026", "Last updated: April 15, 2026", "Zuletzt aktualisiert: 15. April 2026")}
      breadcrumbLabel={tL("Cookies", "Cookies", "Cookies")}
    >
      <LegalSection title={tL("En résumé", "In short", "Kurzfassung")}>
        <p className="text-base">
          {tL(
            `${site.name} dépose un minimum de cookies. Aucune publicité, aucun tracking tiers, pas de bannière de consentement nécessaire tant que cette configuration reste en place. Seul un petit cookie technique est utilisé pour protéger les votes communautaires des abus.`,
            `${site.name} uses the minimum possible cookies. No ads, no third-party tracking, and no consent banner required as long as this setup remains. Only a small technical cookie is used to protect community votes from abuse.`,
            `${site.name} setzt so wenige Cookies wie möglich. Keine Werbung, kein Tracking durch Drittanbieter und kein Einwilligungs-Banner erforderlich, solange diese Konfiguration bestehen bleibt. Es wird lediglich ein kleiner technischer Cookie verwendet, um Community-Abstimmungen vor Missbrauch zu schützen.`
          )}
        </p>
      </LegalSection>

      <LegalSection title={tL("Qu'est-ce qu'un cookie ?", "What is a cookie?", "Was ist ein Cookie?")}>
        <p>
          {tL(
            "Un cookie est un petit fichier texte déposé sur votre appareil par votre navigateur lorsque vous visitez un site web. Il permet de stocker des informations comme vos préférences de langue, ou des identifiants techniques pour distinguer une session d'une autre.",
            "A cookie is a small text file placed on your device by your browser when you visit a website. It stores information such as language preferences or technical identifiers to distinguish one session from another.",
            "Ein Cookie ist eine kleine Textdatei, die beim Besuch einer Website von Ihrem Browser auf Ihrem Gerät gespeichert wird. Er speichert Informationen wie Spracheinstellungen oder technische Kennungen, um eine Sitzung von einer anderen zu unterscheiden."
          )}
        </p>
      </LegalSection>

      <LegalSection title={tL("Liste complète des cookies utilisés", "Full list of cookies used", "Vollständige Liste der verwendeten Cookies")}>
        <p>
          {tL("À ce jour, les seuls cookies déposés par ", "As of today, the only cookies set by ", "Derzeit sind die einzigen von ")}
          {site.name}
          {tL(" sont les suivants :", " are:", " gesetzten Cookies die folgenden:")}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse mt-3">
            <thead>
              <tr className="bg-[#1a2230] text-gold2">
                <th className="border border-border px-3 py-2 text-left">{tL("Nom", "Name", "Name")}</th>
                <th className="border border-border px-3 py-2 text-left">{tL("Finalité", "Purpose", "Zweck")}</th>
                <th className="border border-border px-3 py-2 text-left">{tL("Durée", "Lifetime", "Laufzeit")}</th>
                <th className="border border-border px-3 py-2 text-left">{tL("Essentiel ?", "Essential?", "Essenziell?")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-3 py-2"><code>ew_vote_id</code></td>
                <td className="border border-border px-3 py-2">
                  {tL(
                    "Identifiant anonyme attribué lors d'un vote communautaire, pour bloquer les votes multiples.",
                    "Anonymous identifier assigned during community voting, to block multiple votes.",
                    "Anonyme Kennung, die bei einer Community-Abstimmung vergeben wird, um Mehrfachabstimmungen zu verhindern."
                  )}
                </td>
                <td className="border border-border px-3 py-2">{tL("12 mois glissants", "12 rolling months", "12 gleitende Monate")}</td>
                <td className="border border-border px-3 py-2">{tL("Oui (exempté de consentement)", "Yes (exempt from consent)", "Ja (einwilligungsfrei)")}</td>
              </tr>
              <tr>
                <td className="border border-border px-3 py-2"><code>NEXT_LOCALE</code></td>
                <td className="border border-border px-3 py-2">
                  {tL(
                    "Mémorise votre préférence de langue (FR / EN) lorsque vous changez manuellement via le sélecteur de langue.",
                    "Remembers your language preference (FR / EN) when you change it manually via the language switcher.",
                    "Speichert Ihre Spracheinstellung (FR / EN / DE), wenn Sie sie manuell über die Sprachauswahl ändern."
                  )}
                </td>
                <td className="border border-border px-3 py-2">{tL("12 mois", "12 months", "12 Monate")}</td>
                <td className="border border-border px-3 py-2">{tL("Oui (préférence utilisateur)", "Yes (user preference)", "Ja (Nutzerpräferenz)")}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          {tL(
            "Ces deux cookies sont strictement nécessaires au fonctionnement des services que vous utilisez activement. Ils sont exemptés de consentement selon l'article 82 de la loi Informatique et Libertés et la doctrine de la CNIL. Aucun autre cookie n'est déposé.",
            "Both cookies are strictly necessary for the services you actively use. They are exempt from consent under art. 82 of the French Data Protection Act and CNIL guidance. No other cookies are set.",
            "Beide Cookies sind für die von Ihnen aktiv genutzten Dienste unbedingt erforderlich. Sie sind gemäß Art. 82 des französischen Datenschutzgesetzes und den CNIL-Leitlinien einwilligungsfrei. Es werden keine weiteren Cookies gesetzt."
          )}
        </p>
      </LegalSection>

      <LegalSection title={tL("Cookies qui pourraient apparaître plus tard", "Cookies that may appear later", "Cookies, die später hinzukommen könnten")}>
        <p>
          {tL(
            "Si nous activons un jour de la publicité ou des outils d'analyse non-essentiels, nous mettrons à jour cette page et afficherons une bannière de consentement respectant les exigences CNIL avant tout dépôt de cookie non essentiel. Vous pourrez alors accepter, refuser ou choisir finement vos préférences.",
            "If we ever activate advertising or non-essential analytics tools, we will update this page and show a CNIL-compliant consent banner before any non-essential cookie is set. You will then be able to accept, reject, or fine-tune your preferences.",
            "Falls wir jemals Werbung oder nicht wesentliche Analyse-Tools aktivieren, werden wir diese Seite aktualisieren und vor dem Setzen nicht wesentlicher Cookies ein den CNIL-Anforderungen entsprechendes Einwilligungs-Banner anzeigen. Sie können dann Werbe- und Analyse-Cookies akzeptieren, ablehnen oder Ihre Einwilligung im Detail festlegen."
          )}
        </p>
      </LegalSection>

      <LegalSection title={tL("Maîtriser les cookies depuis votre navigateur", "Controlling cookies from your browser", "Cookies über Ihren Browser steuern")}>
        <p>
          {tL(
            "Vous pouvez à tout moment bloquer ou supprimer les cookies via les paramètres de votre navigateur. Voici les liens vers les documentations officielles :",
            "You can block or delete cookies at any time via your browser settings. Here are links to the official documentation:",
            "Sie können Cookies jederzeit über die Einstellungen Ihres Browsers blockieren oder löschen. Hier finden Sie die Links zur offiziellen Dokumentation:"
          )}
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><a className="text-gold2 hover:underline" href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
          <li><a className="text-gold2 hover:underline" href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies-preferences" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
          <li><a className="text-gold2 hover:underline" href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Apple Safari</a></li>
          <li><a className="text-gold2 hover:underline" href="https://support.microsoft.com/fr-fr/microsoft-edge" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
        </ul>
        <p>
          {tL(
            "Attention : bloquer entièrement les cookies peut empêcher certaines fonctionnalités comme le vote communautaire ou la mémorisation de la langue.",
            "Note: fully blocking cookies may disable features like community voting or language preference memory.",
            "Hinweis: Das vollständige Blockieren von Cookies kann Funktionen wie die Community-Abstimmung oder das Speichern der Spracheinstellung deaktivieren."
          )}
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
