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
  const { publisher, dataController, site } = legalConfig;

  return (
    <LegalLayout
      locale={params.locale}
      title={tL("Politique de confidentialité", "Privacy Policy", "Datenschutzerklärung")}
      lastUpdated={tL(
        "Dernière mise à jour : 15 avril 2026",
        "Last updated: April 15, 2026",
        "Zuletzt aktualisiert: 15. April 2026"
      )}
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
            `${site.name} applique le principe de minimisation des données : nous ne collectons que ce qui est strictement nécessaire au fonctionnement du site, à sa sécurité, à l'amélioration de l'expérience utilisateur, et — après votre consentement explicite — à la mesure d'audience et à l'affichage de publicités permettant de financer le site. Nous ne revendons aucune donnée à des tiers et n'utilisons aucune technologie de fingerprinting.`,
            `${site.name} applies the principle of data minimization: we only collect what is strictly necessary for the site to function, to remain secure, to improve user experience, and — after your explicit consent — to measure traffic and display advertising that funds the site. We do not sell any data to third parties and do not use fingerprinting.`,
            `${site.name} wendet den Grundsatz der Datenminimierung an: Wir erheben ausschließlich Daten, die für den Betrieb der Website, ihre Sicherheit, die Verbesserung der Nutzererfahrung und – nach Ihrer ausdrücklichen Einwilligung – für die Reichweitenmessung und die Auslieferung von Werbung zur Finanzierung der Website zwingend erforderlich sind. Wir verkaufen keine Daten an Dritte und setzen keine Fingerprinting-Technologien ein.`
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={tL(
          "Données collectées, finalités et bases légales",
          "Data collected, purposes and legal bases",
          "Erhobene Daten, Zwecke und Rechtsgrundlagen"
        )}
      >
        <p className="font-bold text-gold2">
          {tL(
            "1. Mesure d'audience (Google Analytics 4)",
            "1. Analytics (Google Analytics 4)",
            "1. Reichweitenmessung (Google Analytics 4)"
          )}
        </p>
        <p>
          {tL(
            "Nous utilisons Google Analytics 4, un service d'analyse d'audience fourni par Google LLC (USA) — et, pour les visiteurs de l'UE, par Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande. Google Analytics dépose des cookies (voir la politique de cookies) permettant de comprendre comment les visiteurs naviguent sur le site : pages consultées, pays, type d'appareil, source de trafic. L'anonymisation des adresses IP est activée et le mode « Google Consent Mode v2 » est configuré en « denied » par défaut : tant que vous n'avez pas donné votre consentement via la bannière, aucune donnée personnelle n'est transmise à Google.",
            "We use Google Analytics 4, an analytics service provided by Google LLC (USA) — and, for EU visitors, by Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland. Google Analytics sets cookies (see the cookie policy) to understand how visitors navigate the site: pages viewed, country, device type, traffic source. IP anonymization is enabled and Google Consent Mode v2 is defaulted to \"denied\": until you give your consent via the banner, no personal data is transmitted to Google.",
            "Wir verwenden Google Analytics 4, einen Analysedienst der Google LLC (USA) – und für Besucher aus der EU der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Google Analytics setzt Cookies (siehe Cookie-Richtlinie), um zu verstehen, wie Besucher auf der Website navigieren: aufgerufene Seiten, Land, Gerätetyp, Traffic-Quelle. Die IP-Anonymisierung ist aktiviert und der Google Consent Mode v2 ist standardmäßig auf „verweigert“ gestellt: Solange Sie keine Einwilligung über das Banner erteilt haben, werden keine personenbezogenen Daten an Google übermittelt."
          )}
        </p>
        <p>
          <span className="text-muted">{tL("Base légale", "Legal basis", "Rechtsgrundlage")} :</span>{" "}
          {tL(
            "consentement de l'utilisateur (art. 6.1.a RGPD et art. 82 de la loi Informatique et Libertés). Vous pouvez retirer votre consentement à tout moment via le lien « Gérer mes cookies » en bas de page.",
            "user consent (art. 6.1.a GDPR and art. 82 of the French Data Protection Act). You can withdraw your consent at any time via the \"Manage cookies\" link at the bottom of the page.",
            "Einwilligung des Nutzers (Art. 6 Abs. 1 lit. a DSGVO und Art. 82 des französischen Datenschutzgesetzes). Sie können Ihre Einwilligung jederzeit über den Link „Cookies verwalten“ am Ende der Seite widerrufen."
          )}
        </p>

        <p className="font-bold text-gold2 mt-4">
          {tL(
            "2. Publicité (Google AdSense)",
            "2. Advertising (Google AdSense)",
            "2. Werbung (Google AdSense)"
          )}
        </p>
        <p>
          {tL(
            "Le site affiche des publicités diffusées par Google AdSense — géré pour les visiteurs de l'UE par Google Ireland Limited (Gordon House, Barrow Street, Dublin 4, Irlande). Google et ses partenaires du IAB Europe Transparency & Consent Framework v2.2 peuvent déposer des cookies publicitaires pour sélectionner des annonces, limiter leur fréquence d'affichage, mesurer la performance des campagnes et, si vous y consentez, personnaliser la publicité. Si vous refusez la publicité personnalisée, Google affichera uniquement des annonces contextuelles (basées sur la page consultée, jamais sur votre profil). Le consentement est recueilli via la bannière Google Funding Choices conforme au IAB TCF v2.2, certifiée Google.",
            "The site displays advertising served by Google AdSense — managed for EU visitors by Google Ireland Limited (Gordon House, Barrow Street, Dublin 4, Ireland). Google and its partners under the IAB Europe Transparency & Consent Framework v2.2 may set advertising cookies to select ads, cap their frequency, measure campaign performance and, if you consent, personalize advertising. If you decline personalized ads, Google will only show contextual ads (based on the page viewed, never on your profile). Consent is collected via the Google Funding Choices banner, which complies with IAB TCF v2.2 and is Google-certified.",
            "Die Website zeigt Werbung, die von Google AdSense ausgeliefert wird – für Besucher aus der EU betrieben von der Google Ireland Limited (Gordon House, Barrow Street, Dublin 4, Irland). Google und seine Partner im Rahmen des IAB Europe Transparency & Consent Framework v2.2 können Werbe-Cookies setzen, um Anzeigen auszuwählen, ihre Häufigkeit zu begrenzen, die Performance von Kampagnen zu messen und, sofern Sie einwilligen, Werbung zu personalisieren. Wenn Sie personalisierte Werbung ablehnen, zeigt Google ausschließlich kontextuelle Anzeigen (basierend auf der aufgerufenen Seite, niemals auf Ihrem Profil). Die Einwilligung wird über das Google-Funding-Choices-Banner eingeholt, das dem IAB TCF v2.2 entspricht und von Google zertifiziert ist."
          )}
        </p>
        <p>
          <span className="text-muted">{tL("Base légale", "Legal basis", "Rechtsgrundlage")} :</span>{" "}
          {tL(
            "consentement de l'utilisateur (art. 6.1.a RGPD et art. 82 de la loi Informatique et Libertés). Aucune annonce personnalisée n'est diffusée tant que vous n'avez pas donné votre accord explicite.",
            "user consent (art. 6.1.a GDPR and art. 82 of the French Data Protection Act). No personalized advertising is shown until you give explicit consent.",
            "Einwilligung des Nutzers (Art. 6 Abs. 1 lit. a DSGVO und Art. 82 des französischen Datenschutzgesetzes). Es wird keine personalisierte Werbung ausgespielt, solange Sie keine ausdrückliche Einwilligung erteilt haben."
          )}
        </p>
        <p>
          <span className="text-muted">
            {tL(
              "Politiques des tiers",
              "Third-party policies",
              "Richtlinien der Drittanbieter"
            )}
            {" : "}
          </span>
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold2 hover:underline"
          >
            {tL(
              "Politique de confidentialité Google",
              "Google Privacy Policy",
              "Google-Datenschutzerklärung"
            )}
          </a>
          {" · "}
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold2 hover:underline"
          >
            {tL(
              "Politique publicitaire Google",
              "Google Advertising Policy",
              "Google-Werberichtlinien"
            )}
          </a>
        </p>

        <p className="font-bold text-gold2 mt-4">
          {tL(
            "3. Vote communautaire sur les compétences",
            "3. Community skill voting",
            "3. Community-Abstimmung zu Fähigkeiten"
          )}
        </p>
        <p>
          {tL(
            "Lorsqu'un visiteur participe au système de vote communautaire, un cookie technique est déposé afin d'empêcher les votes multiples et de protéger le résultat. Ce cookie ne contient aucune information personnelle : uniquement un identifiant anonyme. Voir la ",
            "When a visitor participates in community skill voting, a technical cookie is set to prevent multiple votes and protect the result. This cookie contains no personal information, only an anonymous identifier. See the ",
            "Wenn ein Besucher am Community-Abstimmungssystem teilnimmt, wird ein technisches Cookie gesetzt, um Mehrfachabstimmungen zu verhindern und das Ergebnis zu schützen. Dieses Cookie enthält keine personenbezogenen Informationen, sondern lediglich eine anonyme Kennung. Siehe die "
          )}
          <a href="/legal/votes" className="text-gold2 hover:underline">
            {tL("page dédiée", "dedicated page", "entsprechende Seite")}
          </a>{" "}
          {tL("pour le détail complet.", "for full details.", "für alle Details.")}
        </p>
        <p>
          <span className="text-muted">{tL("Base légale", "Legal basis", "Rechtsgrundlage")} :</span>{" "}
          {tL(
            "intérêt légitime à protéger l'intégrité d'un vote communautaire (art. 6.1.f RGPD) et exemption de consentement au sens de l'article 82 de la loi Informatique et Libertés (finalité strictement nécessaire au service demandé).",
            "legitimate interest in protecting the integrity of a community vote (art. 6.1.f GDPR) and consent exemption under art. 82 of the French Data Protection Act (strictly necessary for the service requested).",
            "berechtigtes Interesse am Schutz der Integrität einer Community-Abstimmung (Art. 6 Abs. 1 lit. f DSGVO) und Einwilligungsausnahme gemäß Art. 82 des französischen Datenschutzgesetzes (zwingend erforderlich für den angeforderten Dienst)."
          )}
        </p>

        <p className="font-bold text-gold2 mt-4">
          {tL(
            "4. Protection anti-bot (Cloudflare Turnstile)",
            "4. Anti-bot protection (Cloudflare Turnstile)",
            "4. Bot-Schutz (Cloudflare Turnstile)"
          )}
        </p>
        <p>
          {tL(
            "Lors du vote, une vérification Cloudflare Turnstile est exécutée pour bloquer les robots. Turnstile est une alternative à reCAPTCHA qui ne dépose pas de cookies de tracking et ne collecte pas d'identifiants de session. Cloudflare traite temporairement l'adresse IP et certaines caractéristiques techniques du navigateur à des fins de sécurité, sans les partager avec des tiers commerciaux.",
            "During voting, a Cloudflare Turnstile check runs to block automated abuse. Turnstile is a reCAPTCHA alternative that does not drop tracking cookies or collect session identifiers. Cloudflare temporarily processes the IP address and certain browser characteristics for security purposes, without sharing them with commercial third parties.",
            "Bei der Abstimmung wird eine Cloudflare-Turnstile-Prüfung durchgeführt, um automatisierten Missbrauch zu blockieren. Turnstile ist eine Alternative zu reCAPTCHA, die keine Tracking-Cookies setzt und keine Sitzungskennungen erhebt. Cloudflare verarbeitet vorübergehend die IP-Adresse und bestimmte technische Merkmale des Browsers zu Sicherheitszwecken, ohne diese an kommerzielle Dritte weiterzugeben."
          )}
        </p>

        <p className="font-bold text-gold2 mt-4">
          {tL("5. Contact", "5. Contact", "5. Kontakt")}
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
        <p>
          {tL(
            "Pour être parfaitement clair, nous n'utilisons :",
            "To be perfectly clear, we do NOT use:",
            "Um vollkommen klarzustellen: Wir verwenden NICHT:"
          )}
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            {tL(
              "Aucun outil de profilage comportemental autre que ceux listés ci-dessus (pas de Facebook Pixel, Hotjar, Mixpanel, etc.).",
              "No behavioral profiling tools beyond those listed above (no Facebook Pixel, Hotjar, Mixpanel, etc.).",
              "Keine Tools zur Verhaltensprofilerstellung über die oben aufgeführten hinaus (kein Facebook Pixel, Hotjar, Mixpanel usw.)."
            )}
          </li>
          <li>
            {tL(
              "Aucune revente ni transmission de données à des courtiers en données.",
              "No resale or transmission of data to data brokers.",
              "Keinen Weiterverkauf oder keine Übermittlung von Daten an Datenhändler."
            )}
          </li>
          <li>
            {tL(
              "Aucun fingerprinting de navigateur.",
              "No browser fingerprinting.",
              "Kein Browser-Fingerprinting."
            )}
          </li>
          <li>
            {tL(
              "Aucune inscription forcée ni création de compte pour consulter les pages.",
              "No forced sign-up or account creation to browse pages.",
              "Keine erzwungene Anmeldung oder Kontoerstellung, um die Seiten zu durchsuchen."
            )}
          </li>
          <li>
            {tL(
              "Aucun cookie publicitaire ou analytique avant votre consentement explicite.",
              "No advertising or analytics cookies before your explicit consent.",
              "Keine Werbe- oder Analyse-Cookies vor Ihrer ausdrücklichen Einwilligung."
            )}
          </li>
        </ul>
      </LegalSection>

      <LegalSection title={tL("Durées de conservation", "Data retention periods", "Speicherfristen")}>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            {tL(
              "Google Analytics 4 : 14 mois maximum (paramétrage minimal disponible).",
              "Google Analytics 4: 14 months maximum (minimum available retention).",
              "Google Analytics 4: höchstens 14 Monate (kürzestmögliche Einstellung)."
            )}
          </li>
          <li>
            {tL(
              "Cookies Google AdSense / IAB TCF : 13 mois maximum (limite CNIL).",
              "Google AdSense / IAB TCF cookies: 13 months maximum (CNIL limit).",
              "Google-AdSense-/IAB-TCF-Cookies: höchstens 13 Monate (CNIL-Grenze)."
            )}
          </li>
          <li>
            {tL(
              "Cookie technique de vote : 12 mois glissants.",
              "Voting technical cookie: 12 rolling months.",
              "Technisches Abstimmungs-Cookie: 12 gleitende Monate."
            )}
          </li>
          <li>
            {tL(
              "Emails de contact : 3 ans maximum après le dernier échange.",
              "Contact emails: up to 3 years after the last exchange.",
              "Kontakt-E-Mails: bis zu 3 Jahre nach dem letzten Austausch."
            )}
          </li>
          <li>
            {tL(
              "Logs serveur Vercel : 7 jours (par défaut du prestataire).",
              "Vercel server logs: 7 days (provider default).",
              "Vercel-Serverprotokolle: 7 Tage (Standardeinstellung des Anbieters)."
            )}
          </li>
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
          <li>{tL("Droit de retirer votre consentement à tout moment", "Right to withdraw consent at any time", "Recht, Ihre Einwilligung jederzeit zu widerrufen")}</li>
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
          <a
            href={dataController.cnilComplaintUrl}
            className="text-gold2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {dataController.cnilComplaintUrl}
          </a>
        </p>
      </LegalSection>

      <LegalSection title={tL("Transferts hors UE", "Transfers outside the EU", "Übermittlungen außerhalb der EU")}>
        <p>
          {tL(
            "Plusieurs des services que nous utilisons sont opérés par des sociétés américaines (Vercel Inc. pour l'hébergement, Google LLC pour Analytics et AdSense, Cloudflare Inc. pour Turnstile). Les données personnelles traitées peuvent donc transiter par des infrastructures situées aux États-Unis. Ces transferts s'effectuent dans le cadre des Clauses Contractuelles Types de la Commission Européenne et du EU–US Data Privacy Framework (DPF), auquel Vercel, Google et Cloudflare adhèrent. Vous pouvez consulter leurs certifications DPF respectives sur ",
            "Several of the services we use are operated by US companies (Vercel Inc. for hosting, Google LLC for Analytics and AdSense, Cloudflare Inc. for Turnstile). The personal data processed may therefore transit through US-based infrastructure. These transfers take place under the European Commission's Standard Contractual Clauses and the EU–US Data Privacy Framework (DPF), to which Vercel, Google and Cloudflare have all subscribed. You can view their respective DPF certifications at ",
            "Mehrere der von uns genutzten Dienste werden von US-amerikanischen Unternehmen betrieben (Vercel Inc. für das Hosting, Google LLC für Analytics und AdSense, Cloudflare Inc. für Turnstile). Die verarbeiteten personenbezogenen Daten können daher über Infrastrukturen in den USA übertragen werden. Diese Übermittlungen erfolgen auf Grundlage der Standardvertragsklauseln der Europäischen Kommission und des EU-US Data Privacy Framework (DPF), dem Vercel, Google und Cloudflare beigetreten sind. Ihre jeweiligen DPF-Zertifizierungen können Sie unter "
          )}
          <a
            href="https://www.dataprivacyframework.gov/s/participant-search"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold2 hover:underline"
          >
            dataprivacyframework.gov
          </a>
          {tL(".", ".", " einsehen.")}
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
