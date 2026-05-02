import type { Metadata } from "next";
import { unstable_setRequestLocale } from "next-intl/server";
import { locales } from "@/src/i18n/config";
import { LegalLayout, LegalSection } from "@/components/LegalLayout";
import { legalConfig } from "@/lib/legal-config";
import { pageAlternates } from "@/lib/seo-alternates";

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
    fr: "Quels cookies sont déposés par EasyTech Wiki, à quoi ils servent, et comment les maîtriser.",
    en: "Which cookies EasyTech Wiki uses, what they are for, and how to control them.",
    de: "Welche Cookies EasyTech Wiki verwendet, wofür sie dienen und wie Sie sie steuern können.",
  };
  return {
    title: titles[locale] ?? titles.en,
    description: descriptions[locale] ?? descriptions.en,
    alternates: pageAlternates(locale, {
      fr: "/legal/cookies",
      en: "/legal/cookies",
      de: "/legal/cookies",
    }),
    robots: { index: true, follow: true },
  };
}

type CookieRow = {
  name: string;
  purposeFr: string;
  purposeEn: string;
  purposeDe: string;
  lifetimeFr: string;
  lifetimeEn: string;
  lifetimeDe: string;
  essentialFr: string;
  essentialEn: string;
  essentialDe: string;
};

const ESSENTIAL_ROWS: CookieRow[] = [
  {
    name: "NEXT_LOCALE",
    purposeFr: "Mémorise votre préférence de langue (FR / EN / DE) lorsque vous changez manuellement via le sélecteur.",
    purposeEn: "Remembers your language preference (FR / EN / DE) when you change it via the language switcher.",
    purposeDe: "Speichert Ihre Spracheinstellung (FR / EN / DE), wenn Sie sie über die Sprachauswahl ändern.",
    lifetimeFr: "12 mois",
    lifetimeEn: "12 months",
    lifetimeDe: "12 Monate",
    essentialFr: "Oui (préférence utilisateur, exemptée de consentement)",
    essentialEn: "Yes (user preference, exempt from consent)",
    essentialDe: "Ja (Nutzerpräferenz, einwilligungsfrei)",
  },
  {
    name: "ew_vote_id",
    purposeFr: "Identifiant anonyme attribué lors d'un vote communautaire, pour bloquer les votes multiples.",
    purposeEn: "Anonymous identifier assigned during community voting, to block multiple votes.",
    purposeDe: "Anonyme Kennung, die bei einer Community-Abstimmung vergeben wird, um Mehrfachabstimmungen zu verhindern.",
    lifetimeFr: "12 mois glissants",
    lifetimeEn: "12 rolling months",
    lifetimeDe: "12 gleitende Monate",
    essentialFr: "Oui (exempté de consentement – finalité strictement nécessaire)",
    essentialEn: "Yes (exempt from consent – strictly necessary purpose)",
    essentialDe: "Ja (einwilligungsfrei – zwingend erforderlicher Zweck)",
  },
  {
    name: "FCCDCF / _GRECAPTCHA (Funding Choices / Cloudflare Turnstile)",
    purposeFr: "Enregistre votre choix sur la bannière de consentement et protège le vote contre les bots.",
    purposeEn: "Stores your choice on the consent banner and protects voting from bots.",
    purposeDe: "Speichert Ihre Auswahl im Einwilligungs-Banner und schützt Abstimmungen vor Bots.",
    lifetimeFr: "13 mois maximum",
    lifetimeEn: "13 months maximum",
    lifetimeDe: "höchstens 13 Monate",
    essentialFr: "Oui (mémorisation du consentement + sécurité)",
    essentialEn: "Yes (consent storage + security)",
    essentialDe: "Ja (Einwilligungsspeicherung + Sicherheit)",
  },
];

const ANALYTICS_ROWS: CookieRow[] = [
  {
    name: "_ga",
    purposeFr: "Google Analytics 4 – distingue les visiteurs uniques de façon anonyme.",
    purposeEn: "Google Analytics 4 – distinguishes unique visitors anonymously.",
    purposeDe: "Google Analytics 4 – unterscheidet eindeutige Besucher anonym.",
    lifetimeFr: "2 ans",
    lifetimeEn: "2 years",
    lifetimeDe: "2 Jahre",
    essentialFr: "Non (consentement requis)",
    essentialEn: "No (consent required)",
    essentialDe: "Nein (Einwilligung erforderlich)",
  },
  {
    name: "_ga_<container-id>",
    purposeFr: "Google Analytics 4 – conserve l'état de session pour agréger les pages vues.",
    purposeEn: "Google Analytics 4 – keeps session state to aggregate pageviews.",
    purposeDe: "Google Analytics 4 – speichert den Sitzungsstatus zur Aggregation von Seitenaufrufen.",
    lifetimeFr: "2 ans",
    lifetimeEn: "2 years",
    lifetimeDe: "2 Jahre",
    essentialFr: "Non (consentement requis)",
    essentialEn: "No (consent required)",
    essentialDe: "Nein (Einwilligung erforderlich)",
  },
];

const ADS_ROWS: CookieRow[] = [
  {
    name: "__gads / __gpi",
    purposeFr: "Google AdSense – sélection et fréquence des annonces affichées, mesure de performance.",
    purposeEn: "Google AdSense – ad selection, frequency capping, performance measurement.",
    purposeDe: "Google AdSense – Anzeigenauswahl, Frequency Capping, Performance-Messung.",
    lifetimeFr: "13 mois maximum",
    lifetimeEn: "13 months maximum",
    lifetimeDe: "höchstens 13 Monate",
    essentialFr: "Non (consentement requis)",
    essentialEn: "No (consent required)",
    essentialDe: "Nein (Einwilligung erforderlich)",
  },
  {
    name: "IDE / ANID / NID (doubleclick.net, google.com)",
    purposeFr: "Google AdSense / partenaires IAB TCF – diffusion d'annonces, plafonnement, lutte contre la fraude au clic.",
    purposeEn: "Google AdSense / IAB TCF partners – ad delivery, capping, click-fraud prevention.",
    purposeDe: "Google AdSense / IAB-TCF-Partner – Anzeigenauslieferung, Capping, Schutz vor Klickbetrug.",
    lifetimeFr: "13 mois maximum",
    lifetimeEn: "13 months maximum",
    lifetimeDe: "höchstens 13 Monate",
    essentialFr: "Non (consentement requis)",
    essentialEn: "No (consent required)",
    essentialDe: "Nein (Einwilligung erforderlich)",
  },
];

function CookieTable({
  locale,
  rows,
}: {
  locale: string;
  rows: CookieRow[];
}) {
  const tL = (fr: string, en: string, de: string) =>
    locale === "fr" ? fr : locale === "de" ? de : en;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse mt-3">
        <thead>
          <tr className="bg-[#1a2230] text-gold2">
            <th className="border border-border px-3 py-2 text-left">
              {tL("Nom", "Name", "Name")}
            </th>
            <th className="border border-border px-3 py-2 text-left">
              {tL("Finalité", "Purpose", "Zweck")}
            </th>
            <th className="border border-border px-3 py-2 text-left">
              {tL("Durée", "Lifetime", "Laufzeit")}
            </th>
            <th className="border border-border px-3 py-2 text-left">
              {tL("Essentiel ?", "Essential?", "Essenziell?")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="border border-border px-3 py-2">
                <code>{r.name}</code>
              </td>
              <td className="border border-border px-3 py-2">
                {locale === "fr"
                  ? r.purposeFr
                  : locale === "de"
                    ? r.purposeDe
                    : r.purposeEn}
              </td>
              <td className="border border-border px-3 py-2">
                {locale === "fr"
                  ? r.lifetimeFr
                  : locale === "de"
                    ? r.lifetimeDe
                    : r.lifetimeEn}
              </td>
              <td className="border border-border px-3 py-2">
                {locale === "fr"
                  ? r.essentialFr
                  : locale === "de"
                    ? r.essentialDe
                    : r.essentialEn}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
      lastUpdated={tL(
        "Dernière mise à jour : 15 avril 2026",
        "Last updated: April 15, 2026",
        "Zuletzt aktualisiert: 15. April 2026"
      )}
      breadcrumbLabel={tL("Cookies", "Cookies", "Cookies")}
    >
      <LegalSection title={tL("En résumé", "In short", "Kurzfassung")}>
        <p className="text-base">
          {tL(
            `${site.name} dépose deux catégories de cookies : ceux qui sont strictement nécessaires au fonctionnement du site et à la sécurité (toujours actifs), et ceux liés à la mesure d'audience (Google Analytics) et à la publicité (Google AdSense), qui ne sont déposés qu'après votre consentement explicite via la bannière de consentement Google Funding Choices affichée à votre première visite. Vous pouvez modifier ou retirer votre consentement à tout moment via le lien « Gérer mes cookies » au bas de chaque page.`,
            `${site.name} uses two categories of cookies: those that are strictly necessary to run the site and keep it secure (always active), and those linked to analytics (Google Analytics) and advertising (Google AdSense), which are only set after you give explicit consent via the Google Funding Choices banner shown on your first visit. You can change or withdraw your consent at any time via the "Manage cookies" link at the bottom of every page.`,
            `${site.name} verwendet zwei Kategorien von Cookies: solche, die für den Betrieb der Website und die Sicherheit zwingend erforderlich sind (immer aktiv), und solche, die mit Reichweitenmessung (Google Analytics) und Werbung (Google AdSense) verbunden sind und erst nach Ihrer ausdrücklichen Einwilligung über das bei Ihrem ersten Besuch angezeigte Google-Funding-Choices-Banner gesetzt werden. Sie können Ihre Einwilligung jederzeit über den Link „Cookies verwalten“ am Ende jeder Seite ändern oder widerrufen.`
          )}
        </p>
      </LegalSection>

      <LegalSection title={tL("Qu'est-ce qu'un cookie ?", "What is a cookie?", "Was ist ein Cookie?")}>
        <p>
          {tL(
            "Un cookie est un petit fichier texte déposé sur votre appareil par votre navigateur lorsque vous visitez un site web. Il permet de stocker des informations comme vos préférences de langue, des identifiants techniques pour distinguer une session d'une autre, ou des données permettant à des partenaires publicitaires de mesurer l'efficacité d'une annonce.",
            "A cookie is a small text file placed on your device by your browser when you visit a website. It stores information such as language preferences, technical identifiers to distinguish one session from another, or data that lets advertising partners measure how an ad performs.",
            "Ein Cookie ist eine kleine Textdatei, die beim Besuch einer Website von Ihrem Browser auf Ihrem Gerät gespeichert wird. Er speichert Informationen wie Spracheinstellungen, technische Kennungen zur Unterscheidung von Sitzungen oder Daten, mit denen Werbepartner die Wirksamkeit einer Anzeige messen können."
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={tL(
          "1. Cookies strictement nécessaires (toujours actifs)",
          "1. Strictly necessary cookies (always active)",
          "1. Zwingend erforderliche Cookies (immer aktiv)"
        )}
      >
        <p>
          {tL(
            "Ces cookies sont indispensables au fonctionnement du site, à la sécurité des votes communautaires et à la mémorisation de votre consentement. Ils sont exemptés de consentement au titre de l'article 82 de la loi Informatique et Libertés (finalités strictement nécessaires).",
            "These cookies are essential to run the site, secure community voting and remember your consent choice. They are exempt from consent under art. 82 of the French Data Protection Act (strictly necessary purposes).",
            "Diese Cookies sind für den Betrieb der Website, die Absicherung der Community-Abstimmungen und die Speicherung Ihrer Einwilligungsentscheidung unverzichtbar. Sie sind gemäß Art. 82 des französischen Datenschutzgesetzes einwilligungsfrei (zwingend erforderliche Zwecke)."
          )}
        </p>
        <CookieTable locale={params.locale} rows={ESSENTIAL_ROWS} />
      </LegalSection>

      <LegalSection
        title={tL(
          "2. Cookies de mesure d'audience (soumis à consentement)",
          "2. Analytics cookies (consent required)",
          "2. Analyse-Cookies (einwilligungspflichtig)"
        )}
      >
        <p>
          {tL(
            "Nous utilisons Google Analytics 4 (propriété de Google LLC, USA) pour mesurer la fréquentation du site, comprendre quelles pages intéressent les visiteurs et améliorer le contenu. Ces cookies ne sont déposés qu'après votre acceptation via la bannière de consentement. L'anonymisation des adresses IP est activée et le mode « consent mode v2 » de Google est configuré en « denied » par défaut, ce qui signifie qu'aucune donnée personnelle n'est transmise à Google tant que vous n'avez pas donné votre accord.",
            "We use Google Analytics 4 (owned by Google LLC, USA) to measure site traffic, understand which pages interest visitors, and improve the content. These cookies are only set after you accept via the consent banner. IP anonymization is enabled and Google's Consent Mode v2 is defaulted to \"denied\", meaning no personal data is sent to Google until you give your consent.",
            "Wir verwenden Google Analytics 4 (eine Dienstleistung von Google LLC, USA), um die Besucherzahlen der Website zu messen, zu verstehen, welche Seiten Besucher interessieren, und die Inhalte zu verbessern. Diese Cookies werden erst nach Ihrer Zustimmung über das Einwilligungs-Banner gesetzt. Die IP-Anonymisierung ist aktiviert und der Consent Mode v2 von Google ist standardmäßig auf „verweigert“ gestellt, sodass keine personenbezogenen Daten an Google übermittelt werden, solange Sie keine Einwilligung erteilt haben."
          )}
        </p>
        <CookieTable locale={params.locale} rows={ANALYTICS_ROWS} />
      </LegalSection>

      <LegalSection
        title={tL(
          "3. Cookies publicitaires (soumis à consentement)",
          "3. Advertising cookies (consent required)",
          "3. Werbe-Cookies (einwilligungspflichtig)"
        )}
      >
        <p>
          {tL(
            "Nous diffusons de la publicité via Google AdSense (Google Ireland Limited pour les visiteurs de l'UE / Google LLC pour les autres régions). Google et ses partenaires IAB TCF peuvent déposer des cookies publicitaires afin de sélectionner des annonces pertinentes, limiter leur fréquence d'affichage et mesurer la performance des campagnes. Ces cookies ne sont jamais déposés sans votre consentement explicite. Vous pouvez consulter la liste complète des partenaires ad tech via la bannière Google Funding Choices (« Gérer les options ») ou la politique publicitaire de Google : ",
            "We serve advertising through Google AdSense (Google Ireland Limited for EU visitors / Google LLC elsewhere). Google and its IAB TCF partners may set advertising cookies to select relevant ads, cap how often they appear, and measure campaign performance. These cookies are never set without your explicit consent. You can view the full list of ad-tech partners via the Google Funding Choices banner (\"Manage options\") or Google's advertising policy: ",
            "Wir blenden Werbung über Google AdSense ein (Google Ireland Limited für Besucher aus der EU / Google LLC für andere Regionen). Google und seine IAB-TCF-Partner können Werbe-Cookies setzen, um relevante Anzeigen auszuwählen, ihre Anzeigehäufigkeit zu begrenzen und die Performance der Kampagnen zu messen. Diese Cookies werden niemals ohne Ihre ausdrückliche Einwilligung gesetzt. Die vollständige Liste der Ad-Tech-Partner finden Sie über das Google-Funding-Choices-Banner („Optionen verwalten“) oder die Werberichtlinie von Google: "
          )}
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold2 hover:underline"
          >
            policies.google.com/technologies/ads
          </a>
          .
        </p>
        <CookieTable locale={params.locale} rows={ADS_ROWS} />
        <p className="mt-3">
          {tL(
            "Vous pouvez également désactiver la personnalisation publicitaire Google pour l'ensemble de vos navigateurs depuis ",
            "You can also turn off Google ad personalization across all your browsers at ",
            "Sie können die personalisierte Google-Werbung für alle Ihre Browser auch deaktivieren unter "
          )}
          <a
            href="https://adssettings.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold2 hover:underline"
          >
            adssettings.google.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection
        title={tL(
          "Retirer ou modifier votre consentement",
          "Withdraw or change your consent",
          "Einwilligung widerrufen oder ändern"
        )}
      >
        <p>
          {tL(
            "Vous pouvez retirer ou modifier votre consentement à tout moment, aussi facilement que vous l'avez donné, en cliquant sur le lien « Gérer mes cookies » présent au bas de chaque page du site. Le retrait de votre consentement n'affecte pas la licéité des traitements antérieurs à ce retrait. Notre bannière Google Funding Choices est certifiée par Google dans le cadre du Transparency & Consent Framework v2.2 de l'IAB Europe et est conforme au RGPD, à la directive ePrivacy et aux recommandations de la CNIL.",
            "You can withdraw or change your consent at any time, as easily as you gave it, by clicking the \"Manage cookies\" link at the bottom of every page. Withdrawing consent does not affect the lawfulness of processing based on consent before its withdrawal. Our Google Funding Choices banner is certified by Google under the IAB Europe Transparency & Consent Framework v2.2 and is compliant with the GDPR, the ePrivacy Directive, and CNIL guidance.",
            "Sie können Ihre Einwilligung jederzeit widerrufen oder ändern – ebenso einfach, wie Sie sie erteilt haben – indem Sie auf den Link „Cookies verwalten“ am Ende jeder Seite klicken. Der Widerruf der Einwilligung berührt nicht die Rechtmäßigkeit der aufgrund der Einwilligung bis zum Widerruf erfolgten Verarbeitung. Unser Google-Funding-Choices-Banner ist im Rahmen des IAB Europe Transparency & Consent Framework v2.2 von Google zertifiziert und entspricht der DSGVO, der ePrivacy-Richtlinie sowie den CNIL-Empfehlungen."
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={tL(
          "Maîtriser les cookies depuis votre navigateur",
          "Controlling cookies from your browser",
          "Cookies über Ihren Browser steuern"
        )}
      >
        <p>
          {tL(
            "En complément de la bannière de consentement, vous pouvez à tout moment bloquer ou supprimer les cookies via les paramètres de votre navigateur :",
            "In addition to the consent banner, you can block or delete cookies at any time via your browser settings:",
            "Zusätzlich zum Einwilligungs-Banner können Sie Cookies jederzeit über die Einstellungen Ihres Browsers blockieren oder löschen:"
          )}
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <a
              className="text-gold2 hover:underline"
              href="https://support.google.com/chrome/answer/95647"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Chrome
            </a>
          </li>
          <li>
            <a
              className="text-gold2 hover:underline"
              href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies-preferences"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mozilla Firefox
            </a>
          </li>
          <li>
            <a
              className="text-gold2 hover:underline"
              href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac"
              target="_blank"
              rel="noopener noreferrer"
            >
              Apple Safari
            </a>
          </li>
          <li>
            <a
              className="text-gold2 hover:underline"
              href="https://support.microsoft.com/fr-fr/microsoft-edge"
              target="_blank"
              rel="noopener noreferrer"
            >
              Microsoft Edge
            </a>
          </li>
        </ul>
        <p>
          {tL(
            "Attention : bloquer entièrement les cookies peut empêcher certaines fonctionnalités, comme le vote communautaire ou la mémorisation de la langue.",
            "Note: fully blocking cookies may disable features such as community voting or language preference memory.",
            "Hinweis: Das vollständige Blockieren von Cookies kann Funktionen wie die Community-Abstimmung oder das Speichern der Spracheinstellung deaktivieren."
          )}
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
