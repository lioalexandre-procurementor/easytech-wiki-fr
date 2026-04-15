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
    fr: "Politique de confidentialité | EasyTech Wiki FR",
    en: "Privacy Policy | EasyTech Wiki",
    de: "Datenschutzerklärung | EasyTech Wiki",
  };
  const descriptions: Record<string, string> = {
    fr: "Politique de confidentialité et RGPD d'EasyTech Wiki FR : quelles données, pourquoi, combien de temps, et comment exercer vos droits.",
    en: "Privacy policy and GDPR information for EasyTech Wiki: what data, why, how long, and how to exercise your rights.",
    de: "Datenschutzerklärung und DSGVO-Informationen für EasyTech Wiki: welche Daten, warum, wie lange und wie Sie Ihre Rechte ausüben können.",
  };
  return {
    title: titles[locale] ?? titles.en,
    description: descriptions[locale] ?? descriptions.en,
    robots: { index: true, follow: true },
  };
}

export default function ConfidentialitePage({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const tL = (fr: string, en: string, de: string): string =>
    params.locale === "fr" ? fr : params.locale === "de" ? de : en;
  const { publisher, dataController, analytics, site } = legalConfig;

  return (
    <LegalLayout
      locale={params.locale}
      title={tL("Politique de confidentialité", "Privacy Policy", "Datenschutzerklärung")}
      lastUpdated={tL("Dernière mise à jour : 15 avril 2026", "Last updated: April 15, 2026", "Zuletzt aktualisiert: 15. April 2026")}
      breadcrumbLabel={tL("Confidentialité", "Privacy", "Datenschutz")}
    >
      <LegalSection title={tL("Responsable du traitement", "Data controller", "Verantwortlicher")}>
        <p>
          {tL(
            `Le responsable du traitement des données personnelles pour ${site.name} est ${dataController.name}. Vous pouvez le contacter à l'adresse ${dataController.email}.`,
            `The data controller for ${site.name} is ${dataController.name}. You can reach the controller at ${dataController.email}.`,
            `Der Verantwortliche für die Verarbeitung personenbezogener Daten für ${site.name} ist ${dataController.name}. Sie können ihn unter ${dataController.email} erreichen.`
          )}
        </p>
      </LegalSection>

      <LegalSection title={tL("Principe général", "General principle", "Allgemeiner Grundsatz")}>
        <p>
          {tL(
            `${site.name} applique le principe de minimisation des données : nous ne collectons que ce qui est strictement nécessaire au fonctionnement du site, à sa sécurité, et à l'amélioration de l'expérience utilisateur. Nous n'utilisons aucune publicité ciblée, aucun tracking cross-site, aucune technologie de fingerprinting, et nous ne revendons aucune donnée à des tiers.`,
            `${site.name} applies the principle of data minimization: we only collect what is strictly necessary for the site to function, to remain secure, and to improve user experience. We do not use targeted advertising, cross-site tracking, or fingerprinting, and we do not sell data to third parties.`,
            `${site.name} wendet den Grundsatz der Datenminimierung an: Wir erheben ausschließlich Daten, die für den Betrieb der Website, ihre Sicherheit und die Verbesserung der Nutzererfahrung zwingend erforderlich sind. Wir setzen keine zielgerichtete Werbung, kein seitenübergreifendes Tracking und keine Fingerprinting-Technologien ein, und wir verkaufen keine Daten an Dritte.`
          )}
        </p>
      </LegalSection>

      <LegalSection title={tL("Données collectées et bases légales", "Data collected and legal bases", "Erhobene Daten und Rechtsgrundlagen")}>
        <p className="font-bold text-gold2">
          {tL("1. Mesure d'audience (Plausible Analytics)", "1. Analytics (Plausible Analytics)", "1. Reichweitenmessung (Plausible Analytics)")}
        </p>
        <p>
          {tL(
            `Nous utilisons ${analytics.provider}, une solution d'analyse d'audience sans cookie, hébergée dans l'Union Européenne (${analytics.dataLocation}). Plausible agrège des statistiques anonymes (pays, type d'appareil, référent, page consultée) sans jamais identifier individuellement les visiteurs. Aucune donnée personnelle au sens du RGPD n'est collectée, aucun cookie n'est déposé. C'est pourquoi aucune bannière de consentement n'est affichée pour cette finalité, conformément à la recommandation de la CNIL.`,
            `We use ${analytics.provider}, a cookie-less analytics service hosted in the European Union (${analytics.dataLocation}). Plausible aggregates anonymous statistics (country, device type, referrer, page visited) without ever identifying individual visitors. No personal data under GDPR is collected, and no cookies are set. For this reason, no consent banner is displayed for this purpose, in line with CNIL guidance.`,
            `Wir verwenden ${analytics.provider}, einen cookielosen Analysedienst mit Sitz in der Europäischen Union (${analytics.dataLocation}). Plausible aggregiert anonyme Statistiken (Land, Gerätetyp, Referrer, aufgerufene Seite), ohne Besucher jemals individuell zu identifizieren. Es werden keine personenbezogenen Daten im Sinne der DSGVO erhoben und keine Cookies gesetzt. Aus diesem Grund wird für diesen Zweck kein Einwilligungsbanner angezeigt, im Einklang mit den Empfehlungen der französischen Datenschutzbehörde CNIL.`
          )}
        </p>
        <p>
          <span className="text-muted">{tL("Base légale", "Legal basis", "Rechtsgrundlage")} :</span>{" "}
          {tL(
            "intérêt légitime de l'éditeur à mesurer la fréquentation de son site sans porter atteinte à la vie privée (art. 6.1.f RGPD).",
            "legitimate interest of the publisher to measure site traffic without impacting privacy (art. 6.1.f GDPR).",
            "berechtigtes Interesse des Betreibers an der Messung der Besucherzahlen seiner Website, ohne die Privatsphäre zu beeinträchtigen (Art. 6 Abs. 1 lit. f DSGVO)."
          )}
        </p>

        <p className="font-bold text-gold2 mt-4">
          {tL("2. Vote communautaire sur les compétences", "2. Community skill voting", "2. Community-Abstimmung zu Fähigkeiten")}
        </p>
        <p>
          {tL(
            "Lorsqu'un visiteur participe au système de vote communautaire (sélection des compétences recommandées pour un général), un cookie technique est déposé afin d'empêcher les votes multiples et de protéger le résultat. Ce cookie ne contient aucune information personnelle : uniquement un identifiant anonyme. Voir la ",
            "When a visitor participates in the community skill voting system, a technical cookie is set to prevent multiple votes and protect the result. This cookie contains no personal information, only an anonymous identifier. See the ",
            "Wenn ein Besucher am Community-Abstimmungssystem teilnimmt (Auswahl der empfohlenen Fähigkeiten für einen General), wird ein technisches Cookie gesetzt, um Mehrfachabstimmungen zu verhindern und das Ergebnis zu schützen. Dieses Cookie enthält keine personenbezogenen Informationen, sondern lediglich eine anonyme Kennung. Siehe die "
          )}
          <a href="/legal/votes" className="text-gold2 hover:underline">
            {tL("page dédiée", "dedicated page", "entsprechende Seite")}
          </a>{" "}
          {tL("pour le détail complet.", "for full details.", "für alle Details.")}
        </p>
        <p>
          <span className="text-muted">{tL("Base légale", "Legal basis", "Rechtsgrundlage")} :</span>{" "}
          {tL(
            "intérêt légitime à protéger l'intégrité d'un vote communautaire (art. 6.1.f RGPD). Le cookie est également exempté de consentement au sens de l'article 82 de la loi Informatique et Libertés (finalité strictement nécessaire au service demandé).",
            "legitimate interest in protecting the integrity of a community vote (art. 6.1.f GDPR). The cookie is also exempted from consent under art. 82 of the French Data Protection Act (strictly necessary for the service requested).",
            "berechtigtes Interesse am Schutz der Integrität einer Community-Abstimmung (Art. 6 Abs. 1 lit. f DSGVO). Das Cookie ist zudem gemäß Art. 82 des französischen Datenschutzgesetzes von der Einwilligungspflicht ausgenommen (zwingend erforderlich für den angeforderten Dienst)."
          )}
        </p>

        <p className="font-bold text-gold2 mt-4">
          {tL("3. Protection anti-bot (Cloudflare Turnstile)", "3. Anti-bot protection (Cloudflare Turnstile)", "3. Bot-Schutz (Cloudflare Turnstile)")}
        </p>
        <p>
          {tL(
            "Lors du vote, une vérification Cloudflare Turnstile est exécutée pour bloquer les robots. Turnstile est une alternative à reCAPTCHA qui ne dépose pas de cookies de tracking et ne collecte pas d'identifiants de session. Cloudflare traite temporairement l'adresse IP et certaines caractéristiques techniques du navigateur à des fins de sécurité, sans les partager avec des tiers commerciaux.",
            "During voting, a Cloudflare Turnstile check runs to block automated abuse. Turnstile is a reCAPTCHA alternative that does not drop tracking cookies or collect session identifiers. Cloudflare temporarily processes the IP address and certain browser characteristics for security purposes, without sharing them with commercial third parties.",
            "Bei der Abstimmung wird eine Cloudflare-Turnstile-Prüfung durchgeführt, um automatisierten Missbrauch zu blockieren. Turnstile ist eine Alternative zu reCAPTCHA, die keine Tracking-Cookies setzt und keine Sitzungskennungen erhebt. Cloudflare verarbeitet vorübergehend die IP-Adresse und bestimmte technische Merkmale des Browsers zu Sicherheitszwecken, ohne diese an kommerzielle Dritte weiterzugeben."
          )}
        </p>

        <p className="font-bold text-gold2 mt-4">
          {tL("4. Contact", "4. Contact", "4. Kontakt")}
        </p>
        <p>
          {tL(
            `Si vous nous écrivez à ${publisher.email}, votre adresse email et le contenu de votre message sont conservés le temps nécessaire au traitement de votre demande, puis archivés ou supprimés dans un délai maximum de 3 ans. Nous ne réutilisons jamais ces coordonnées à des fins commerciales ou de prospection.`,
            `If you email us at ${publisher.email}, your email address and message content are kept for as long as needed to handle your request, then archived or deleted within 3 years at most. We never reuse this contact information for commercial or marketing purposes.`,
            `Wenn Sie uns unter ${publisher.email} schreiben, werden Ihre E-Mail-Adresse und der Inhalt Ihrer Nachricht so lange aufbewahrt, wie es zur Bearbeitung Ihrer Anfrage erforderlich ist, und anschließend innerhalb von maximal 3 Jahren archiviert oder gelöscht. Wir verwenden diese Kontaktdaten niemals für kommerzielle Zwecke oder Werbezwecke weiter.`
          )}
        </p>
      </LegalSection>

      <LegalSection title={tL("Ce que nous ne faisons PAS", "What we do NOT do", "Was wir NICHT tun")}>
        <p>{tL("Pour être parfaitement clair, nous n'utilisons :", "To be perfectly clear, we do NOT use:", "Um vollkommen klarzustellen: Wir verwenden NICHT:")}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{tL("Aucun cookie publicitaire, ni de régie publicitaire tierce tant qu'aucune publicité n'est affichée sur le site.", "No advertising cookies, and no third-party ad network as long as no ads are displayed.", "Keine Werbe-Cookies und kein Werbenetzwerk Dritter, solange keine Werbung angezeigt wird.")}</li>
          <li>{tL("Aucun outil de profilage comportemental (Google Analytics, Facebook Pixel, Hotjar, etc.).", "No behavioral profiling tools (Google Analytics, Facebook Pixel, Hotjar, etc.).", "Keine Tools zur Verhaltensprofilerstellung (Google Analytics, Facebook Pixel, Hotjar usw.).")}</li>
          <li>{tL("Aucune revente ou transmission de données à des courtiers en données.", "No resale or transmission of data to data brokers.", "Keinen Weiterverkauf oder keine Übermittlung von Daten an Datenhändler.")}</li>
          <li>{tL("Aucun fingerprinting de navigateur.", "No browser fingerprinting.", "Kein Browser-Fingerprinting.")}</li>
          <li>{tL("Aucun inscription forcée ni création de compte pour consulter les pages.", "No forced sign-up or account creation to browse pages.", "Keine erzwungene Anmeldung oder Kontoerstellung, um die Seiten zu durchsuchen.")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={tL("Évolution en cas d'activation de la publicité", "What happens if ads are turned on", "Was geschieht bei Aktivierung von Werbung")}>
        <p>
          {tL(
            "Si nous activons dans le futur une régie publicitaire (AdSense, Ezoic, ou équivalent), nous mettrons à jour cette page au moins 15 jours avant, ajouterons une bannière de consentement conforme aux recommandations CNIL/CEPD, et publierons la liste complète des cookies tiers déposés ainsi que leurs finalités. Le consentement sera demandé avant tout dépôt de cookie non essentiel.",
            "If we later activate an ad network (AdSense, Ezoic, or equivalent), we will update this page at least 15 days in advance, add a consent banner compliant with CNIL/EDPB guidance, and publish the full list of third-party cookies dropped and their purposes. Consent will be required before any non-essential cookie is set.",
            "Sollten wir künftig ein Werbenetzwerk (AdSense, Ezoic oder gleichwertig) aktivieren, werden wir diese Seite mindestens 15 Tage vorher aktualisieren, ein Einwilligungsbanner gemäß den Empfehlungen der CNIL/EDSA einfügen und die vollständige Liste der gesetzten Drittanbieter-Cookies sowie deren Zwecke veröffentlichen. Vor dem Setzen nicht unbedingt erforderlicher Cookies wird eine Einwilligung eingeholt."
          )}
        </p>
      </LegalSection>

      <LegalSection title={tL("Durées de conservation", "Data retention periods", "Speicherfristen")}>
        <ul className="list-disc pl-5 space-y-1">
          <li>{tL("Statistiques Plausible : 24 mois en agrégé, aucune donnée individuelle.", "Plausible statistics: 24 months in aggregate form only.", "Plausible-Statistiken: 24 Monate ausschließlich in aggregierter Form.")}</li>
          <li>{tL("Cookie technique de vote : 12 mois glissants.", "Voting technical cookie: 12 rolling months.", "Technisches Abstimmungs-Cookie: 12 gleitende Monate.")}</li>
          <li>{tL("Emails de contact : 3 ans maximum après le dernier échange.", "Contact emails: up to 3 years after the last exchange.", "Kontakt-E-Mails: bis zu 3 Jahre nach dem letzten Austausch.")}</li>
          <li>{tL("Logs serveur Vercel : 7 jours (par défaut du prestataire).", "Vercel server logs: 7 days (provider default).", "Vercel-Serverprotokolle: 7 Tage (Standardeinstellung des Anbieters).")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={tL("Vos droits (RGPD)", "Your rights (GDPR)", "Ihre Rechte (DSGVO)")}>
        <p>
          {tL(
            "Conformément au Règlement Général sur la Protection des Données et à la loi Informatique et Libertés, vous disposez des droits suivants :",
            "Under the General Data Protection Regulation and the French Data Protection Act, you have the following rights:",
            "Gemäß der Datenschutz-Grundverordnung und dem französischen Datenschutzgesetz stehen Ihnen folgende Rechte zu:"
          )}
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{tL("Droit d'accès à vos données", "Right of access to your data", "Recht auf Auskunft über Ihre Daten")}</li>
          <li>{tL("Droit de rectification", "Right to rectification", "Recht auf Berichtigung")}</li>
          <li>{tL("Droit à l'effacement (« droit à l'oubli »)", "Right to erasure (right to be forgotten)", "Recht auf Löschung (\u201ERecht auf Vergessenwerden\u201C)")}</li>
          <li>{tL("Droit à la limitation du traitement", "Right to restrict processing", "Recht auf Einschränkung der Verarbeitung")}</li>
          <li>{tL("Droit d'opposition au traitement", "Right to object to processing", "Recht auf Widerspruch gegen die Verarbeitung")}</li>
          <li>{tL("Droit à la portabilité de vos données", "Right to data portability", "Recht auf Datenübertragbarkeit")}</li>
          <li>{tL("Droit de retirer votre consentement à tout moment lorsqu'il est requis", "Right to withdraw consent at any time where applicable", "Recht, Ihre Einwilligung jederzeit zu widerrufen, sofern erforderlich")}</li>
          <li>{tL("Droit de définir des directives post-mortem", "Right to set post-mortem directives", "Recht, Verfügungen für den Todesfall festzulegen")}</li>
        </ul>
        <p>
          {tL(
            `Pour exercer ces droits, écrivez-nous à ${dataController.email}. Nous vous répondrons dans un délai maximum de 30 jours.`,
            `To exercise these rights, write to us at ${dataController.email}. We will respond within 30 days at most.`,
            `Um diese Rechte auszuüben, schreiben Sie uns an ${dataController.email}. Wir antworten Ihnen innerhalb von höchstens 30 Tagen.`
          )}
        </p>
        <p>
          {tL(
            "Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL : ",
            "If, after contacting us, you believe your rights are not being respected, you may file a complaint with the CNIL: ",
            "Wenn Sie der Auffassung sind, dass Ihre Rechte nach Kontaktaufnahme mit uns nicht gewahrt werden, können Sie bei der französischen Datenschutzbehörde CNIL Beschwerde einlegen: "
          )}
          <a href={dataController.cnilComplaintUrl} className="text-gold2 hover:underline" target="_blank" rel="noopener noreferrer">
            {dataController.cnilComplaintUrl}
          </a>
        </p>
      </LegalSection>

      <LegalSection title={tL("Transferts hors UE", "Transfers outside the EU", "Übermittlungen außerhalb der EU")}>
        <p>
          {tL(
            "Notre hébergeur (Vercel Inc.) est une entreprise américaine. Les données techniques nécessaires au fonctionnement du site (requêtes HTTP, logs serveurs) peuvent transiter par des infrastructures situées aux États-Unis. Ces transferts s'effectuent dans le cadre des clauses contractuelles types de la Commission Européenne et du Data Privacy Framework (DPF) dont Vercel est adhérent. Notre solution d'analytics (Plausible) est hébergée en Allemagne et ne génère aucun transfert hors UE.",
            "Our host (Vercel Inc.) is a US company. Technical data needed to operate the site (HTTP requests, server logs) may transit through US-based infrastructure. These transfers take place under the European Commission's Standard Contractual Clauses and the EU–US Data Privacy Framework (DPF), which Vercel has joined. Our analytics (Plausible) is hosted in Germany and generates no transfers outside the EU.",
            "Unser Hosting-Anbieter (Vercel Inc.) ist ein US-amerikanisches Unternehmen. Die für den Betrieb der Website erforderlichen technischen Daten (HTTP-Anfragen, Serverprotokolle) können über Infrastrukturen in den USA übertragen werden. Diese Übermittlungen erfolgen auf Grundlage der Standardvertragsklauseln der Europäischen Kommission und des EU-US Data Privacy Framework (DPF), dem Vercel beigetreten ist. Unsere Analyselösung (Plausible) wird in Deutschland gehostet und verursacht keine Übermittlungen außerhalb der EU."
          )}
        </p>
      </LegalSection>

      <LegalSection title={tL("Sécurité", "Security", "Sicherheit")}>
        <p>
          {tL(
            "Le site est intégralement servi en HTTPS. Les éventuelles données transmises (formulaire de contact, vote) sont chiffrées en transit. Nous appliquons les mises à jour de sécurité de nos dépendances dans les meilleurs délais et procédons à des audits réguliers de notre code.",
            "The site is served entirely over HTTPS. Any data transmitted (contact form, vote) is encrypted in transit. We apply security updates to our dependencies promptly and regularly audit our code.",
            "Die Website wird vollständig über HTTPS ausgeliefert. Alle übertragenen Daten (Kontaktformular, Abstimmung) werden bei der Übertragung verschlüsselt. Wir spielen Sicherheitsupdates für unsere Abhängigkeiten zeitnah ein und führen regelmäßige Audits unseres Codes durch."
          )}
        </p>
      </LegalSection>

      <LegalSection title={tL("Contact", "Contact", "Kontakt")}>
        <p>
          {tL(
            `Pour toute question concernant cette politique ou l'exercice de vos droits : ${dataController.email}.`,
            `For any question about this policy or to exercise your rights: ${dataController.email}.`,
            `Bei Fragen zu dieser Erklärung oder zur Ausübung Ihrer Rechte: ${dataController.email}.`
          )}
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
