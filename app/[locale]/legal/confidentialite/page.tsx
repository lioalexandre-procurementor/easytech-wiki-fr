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
    title: fr ? "Politique de confidentialité | EasyTech Wiki FR" : "Privacy Policy | EasyTech Wiki",
    description: fr
      ? "Politique de confidentialité et RGPD d'EasyTech Wiki FR : quelles données, pourquoi, combien de temps, et comment exercer vos droits."
      : "Privacy policy and GDPR information for EasyTech Wiki: what data, why, how long, and how to exercise your rights.",
    robots: { index: true, follow: true },
  };
}

export default function ConfidentialitePage({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const fr = params.locale === "fr";
  const { publisher, dataController, analytics, site } = legalConfig;

  return (
    <LegalLayout
      locale={params.locale}
      title={fr ? "Politique de confidentialité" : "Privacy Policy"}
      lastUpdated={fr ? "Dernière mise à jour : 15 avril 2026" : "Last updated: April 15, 2026"}
      breadcrumbLabel={fr ? "Confidentialité" : "Privacy"}
    >
      <LegalSection title={fr ? "Responsable du traitement" : "Data controller"}>
        <p>
          {fr
            ? `Le responsable du traitement des données personnelles pour ${site.name} est ${dataController.name}. Vous pouvez le contacter à l'adresse ${dataController.email}.`
            : `The data controller for ${site.name} is ${dataController.name}. You can reach the controller at ${dataController.email}.`}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "Principe général" : "General principle"}>
        <p>
          {fr
            ? `${site.name} applique le principe de minimisation des données : nous ne collectons que ce qui est strictement nécessaire au fonctionnement du site, à sa sécurité, et à l'amélioration de l'expérience utilisateur. Nous n'utilisons aucune publicité ciblée, aucun tracking cross-site, aucune technologie de fingerprinting, et nous ne revendons aucune donnée à des tiers.`
            : `${site.name} applies the principle of data minimization: we only collect what is strictly necessary for the site to function, to remain secure, and to improve user experience. We do not use targeted advertising, cross-site tracking, or fingerprinting, and we do not sell data to third parties.`}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "Données collectées et bases légales" : "Data collected and legal bases"}>
        <p className="font-bold text-gold2">
          {fr ? "1. Mesure d'audience (Plausible Analytics)" : "1. Analytics (Plausible Analytics)"}
        </p>
        <p>
          {fr
            ? `Nous utilisons ${analytics.provider}, une solution d'analyse d'audience sans cookie, hébergée dans l'Union Européenne (${analytics.dataLocation}). Plausible agrège des statistiques anonymes (pays, type d'appareil, référent, page consultée) sans jamais identifier individuellement les visiteurs. Aucune donnée personnelle au sens du RGPD n'est collectée, aucun cookie n'est déposé. C'est pourquoi aucune bannière de consentement n'est affichée pour cette finalité, conformément à la recommandation de la CNIL.`
            : `We use ${analytics.provider}, a cookie-less analytics service hosted in the European Union (${analytics.dataLocation}). Plausible aggregates anonymous statistics (country, device type, referrer, page visited) without ever identifying individual visitors. No personal data under GDPR is collected, and no cookies are set. For this reason, no consent banner is displayed for this purpose, in line with CNIL guidance.`}
        </p>
        <p>
          <span className="text-muted">{fr ? "Base légale" : "Legal basis"} :</span>{" "}
          {fr
            ? "intérêt légitime de l'éditeur à mesurer la fréquentation de son site sans porter atteinte à la vie privée (art. 6.1.f RGPD)."
            : "legitimate interest of the publisher to measure site traffic without impacting privacy (art. 6.1.f GDPR)."}
        </p>

        <p className="font-bold text-gold2 mt-4">
          {fr ? "2. Vote communautaire sur les compétences" : "2. Community skill voting"}
        </p>
        <p>
          {fr
            ? "Lorsqu'un visiteur participe au système de vote communautaire (sélection des compétences recommandées pour un général), un cookie technique est déposé afin d'empêcher les votes multiples et de protéger le résultat. Ce cookie ne contient aucune information personnelle : uniquement un identifiant anonyme. Voir la "
            : "When a visitor participates in the community skill voting system, a technical cookie is set to prevent multiple votes and protect the result. This cookie contains no personal information, only an anonymous identifier. See the "}
          <a href="/legal/votes" className="text-gold2 hover:underline">
            {fr ? "page dédiée" : "dedicated page"}
          </a>{" "}
          {fr ? "pour le détail complet." : "for full details."}
        </p>
        <p>
          <span className="text-muted">{fr ? "Base légale" : "Legal basis"} :</span>{" "}
          {fr
            ? "intérêt légitime à protéger l'intégrité d'un vote communautaire (art. 6.1.f RGPD). Le cookie est également exempté de consentement au sens de l'article 82 de la loi Informatique et Libertés (finalité strictement nécessaire au service demandé)."
            : "legitimate interest in protecting the integrity of a community vote (art. 6.1.f GDPR). The cookie is also exempted from consent under art. 82 of the French Data Protection Act (strictly necessary for the service requested)."}
        </p>

        <p className="font-bold text-gold2 mt-4">
          {fr ? "3. Protection anti-bot (Cloudflare Turnstile)" : "3. Anti-bot protection (Cloudflare Turnstile)"}
        </p>
        <p>
          {fr
            ? "Lors du vote, une vérification Cloudflare Turnstile est exécutée pour bloquer les robots. Turnstile est une alternative à reCAPTCHA qui ne dépose pas de cookies de tracking et ne collecte pas d'identifiants de session. Cloudflare traite temporairement l'adresse IP et certaines caractéristiques techniques du navigateur à des fins de sécurité, sans les partager avec des tiers commerciaux."
            : "During voting, a Cloudflare Turnstile check runs to block automated abuse. Turnstile is a reCAPTCHA alternative that does not drop tracking cookies or collect session identifiers. Cloudflare temporarily processes the IP address and certain browser characteristics for security purposes, without sharing them with commercial third parties."}
        </p>

        <p className="font-bold text-gold2 mt-4">
          {fr ? "4. Contact" : "4. Contact"}
        </p>
        <p>
          {fr
            ? `Si vous nous écrivez à ${publisher.email}, votre adresse email et le contenu de votre message sont conservés le temps nécessaire au traitement de votre demande, puis archivés ou supprimés dans un délai maximum de 3 ans. Nous ne réutilisons jamais ces coordonnées à des fins commerciales ou de prospection.`
            : `If you email us at ${publisher.email}, your email address and message content are kept for as long as needed to handle your request, then archived or deleted within 3 years at most. We never reuse this contact information for commercial or marketing purposes.`}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "Ce que nous ne faisons PAS" : "What we do NOT do"}>
        <p>{fr ? "Pour être parfaitement clair, nous n'utilisons :" : "To be perfectly clear, we do NOT use:"}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{fr ? "Aucun cookie publicitaire, ni de régie publicitaire tierce tant qu'aucune publicité n'est affichée sur le site." : "No advertising cookies, and no third-party ad network as long as no ads are displayed."}</li>
          <li>{fr ? "Aucun outil de profilage comportemental (Google Analytics, Facebook Pixel, Hotjar, etc.)." : "No behavioral profiling tools (Google Analytics, Facebook Pixel, Hotjar, etc.)."}</li>
          <li>{fr ? "Aucune revente ou transmission de données à des courtiers en données." : "No resale or transmission of data to data brokers."}</li>
          <li>{fr ? "Aucun fingerprinting de navigateur." : "No browser fingerprinting."}</li>
          <li>{fr ? "Aucun inscription forcée ni création de compte pour consulter les pages." : "No forced sign-up or account creation to browse pages."}</li>
        </ul>
      </LegalSection>

      <LegalSection title={fr ? "Évolution en cas d'activation de la publicité" : "What happens if ads are turned on"}>
        <p>
          {fr
            ? "Si nous activons dans le futur une régie publicitaire (AdSense, Ezoic, ou équivalent), nous mettrons à jour cette page au moins 15 jours avant, ajouterons une bannière de consentement conforme aux recommandations CNIL/CEPD, et publierons la liste complète des cookies tiers déposés ainsi que leurs finalités. Le consentement sera demandé avant tout dépôt de cookie non essentiel."
            : "If we later activate an ad network (AdSense, Ezoic, or equivalent), we will update this page at least 15 days in advance, add a consent banner compliant with CNIL/EDPB guidance, and publish the full list of third-party cookies dropped and their purposes. Consent will be required before any non-essential cookie is set."}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "Durées de conservation" : "Data retention periods"}>
        <ul className="list-disc pl-5 space-y-1">
          <li>{fr ? "Statistiques Plausible : 24 mois en agrégé, aucune donnée individuelle." : "Plausible statistics: 24 months in aggregate form only."}</li>
          <li>{fr ? "Cookie technique de vote : 12 mois glissants." : "Voting technical cookie: 12 rolling months."}</li>
          <li>{fr ? "Emails de contact : 3 ans maximum après le dernier échange." : "Contact emails: up to 3 years after the last exchange."}</li>
          <li>{fr ? "Logs serveur Vercel : 7 jours (par défaut du prestataire)." : "Vercel server logs: 7 days (provider default)."}</li>
        </ul>
      </LegalSection>

      <LegalSection title={fr ? "Vos droits (RGPD)" : "Your rights (GDPR)"}>
        <p>
          {fr
            ? "Conformément au Règlement Général sur la Protection des Données et à la loi Informatique et Libertés, vous disposez des droits suivants :"
            : "Under the General Data Protection Regulation and the French Data Protection Act, you have the following rights:"}
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{fr ? "Droit d'accès à vos données" : "Right of access to your data"}</li>
          <li>{fr ? "Droit de rectification" : "Right to rectification"}</li>
          <li>{fr ? "Droit à l'effacement (« droit à l'oubli »)" : "Right to erasure (right to be forgotten)"}</li>
          <li>{fr ? "Droit à la limitation du traitement" : "Right to restrict processing"}</li>
          <li>{fr ? "Droit d'opposition au traitement" : "Right to object to processing"}</li>
          <li>{fr ? "Droit à la portabilité de vos données" : "Right to data portability"}</li>
          <li>{fr ? "Droit de retirer votre consentement à tout moment lorsqu'il est requis" : "Right to withdraw consent at any time where applicable"}</li>
          <li>{fr ? "Droit de définir des directives post-mortem" : "Right to set post-mortem directives"}</li>
        </ul>
        <p>
          {fr
            ? `Pour exercer ces droits, écrivez-nous à ${dataController.email}. Nous vous répondrons dans un délai maximum de 30 jours.`
            : `To exercise these rights, write to us at ${dataController.email}. We will respond within 30 days at most.`}
        </p>
        <p>
          {fr ? "Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL : " : "If, after contacting us, you believe your rights are not being respected, you may file a complaint with the CNIL: "}
          <a href={dataController.cnilComplaintUrl} className="text-gold2 hover:underline" target="_blank" rel="noopener noreferrer">
            {dataController.cnilComplaintUrl}
          </a>
        </p>
      </LegalSection>

      <LegalSection title={fr ? "Transferts hors UE" : "Transfers outside the EU"}>
        <p>
          {fr
            ? "Notre hébergeur (Vercel Inc.) est une entreprise américaine. Les données techniques nécessaires au fonctionnement du site (requêtes HTTP, logs serveurs) peuvent transiter par des infrastructures situées aux États-Unis. Ces transferts s'effectuent dans le cadre des clauses contractuelles types de la Commission Européenne et du Data Privacy Framework (DPF) dont Vercel est adhérent. Notre solution d'analytics (Plausible) est hébergée en Allemagne et ne génère aucun transfert hors UE."
            : "Our host (Vercel Inc.) is a US company. Technical data needed to operate the site (HTTP requests, server logs) may transit through US-based infrastructure. These transfers take place under the European Commission's Standard Contractual Clauses and the EU–US Data Privacy Framework (DPF), which Vercel has joined. Our analytics (Plausible) is hosted in Germany and generates no transfers outside the EU."}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "Sécurité" : "Security"}>
        <p>
          {fr
            ? "Le site est intégralement servi en HTTPS. Les éventuelles données transmises (formulaire de contact, vote) sont chiffrées en transit. Nous appliquons les mises à jour de sécurité de nos dépendances dans les meilleurs délais et procédons à des audits réguliers de notre code."
            : "The site is served entirely over HTTPS. Any data transmitted (contact form, vote) is encrypted in transit. We apply security updates to our dependencies promptly and regularly audit our code."}
        </p>
      </LegalSection>

      <LegalSection title={fr ? "Contact" : "Contact"}>
        <p>
          {fr
            ? `Pour toute question concernant cette politique ou l'exercice de vos droits : ${dataController.email}.`
            : `For any question about this policy or to exercise your rights: ${dataController.email}.`}
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
