import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { getReferences, localeKey, referencePath, releaseStatus, type ReferenceEntry, type ReferenceKind } from "@/lib/wc4-coverage";

const copy = {
  fr: { checked: "Sources consultées", official: "Ajout confirmé par l’éditeur", pending: "Détails en attente de vérification", sources: "Source officielle", records: "Fiches de référence — détails à vérifier", history: "Historique des versions", guide: "Nouveautés de septembre", note: "Les ajouts officiels sont recensés. La vérification des statistiques et des stratégies reste partielle.", back: "Retour au wiki WC4", released: "Version d’introduction", published: "Publication" },
  en: { checked: "Sources checked", official: "Addition confirmed by the publisher", pending: "Details awaiting verification", sources: "Official source", records: "Reference pages — details awaiting verification", history: "Release history", guide: "September additions", note: "Official additions are covered. Stat and strategy verification remains partial.", back: "Back to the WC4 wiki", released: "Introduction version", published: "Published" },
  de: { checked: "Quellen geprüft", official: "Vom Herausgeber bestätigte Ergänzung", pending: "Details noch zu prüfen", sources: "Offizielle Quelle", records: "Referenzseiten — Details noch zu prüfen", history: "Versionshistorie", guide: "September-Ergänzungen", note: "Offizielle Ergänzungen sind erfasst. Werte und Strategien sind noch nicht vollständig geprüft.", back: "Zurück zum WC4-Wiki", released: "Einführungsversion", published: "Veröffentlicht" },
};

export function Wc4ReleaseStatus({ locale }: { locale: string }) {
  const loc = localeKey(locale);
  const c = copy[loc];
  return <section className="bg-panel border border-gold/30 rounded-lg p-4 mb-6" aria-label={c.history}>
    <div className="flex flex-wrap gap-x-5 gap-y-2 font-bold text-gold2">
      <a href={releaseStatus.platforms.ios.sourceUrl} className="hover:underline">iOS {releaseStatus.platforms.ios.version}</a>
      <a href={releaseStatus.platforms.android.sourceUrl} className="hover:underline">Android {releaseStatus.platforms.android.version}</a>
    </div>
    <p className="text-muted text-xs mt-2">{c.checked}: <time dateTime={releaseStatus.checkedAt}>{releaseStatus.checkedAt}</time></p>
    <p className="text-dim text-sm mt-2">{c.note}</p>
    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gold2">
      <Link href={`/${loc}/world-conqueror-4/${loc === "fr" ? "mises-a-jour" : "updates"}`} className="underline">{c.history}</Link>
      <Link href={`/${loc}/world-conqueror-4/guides/${releaseStatus.coverageGuide}`} className="underline">{c.guide}</Link>
    </div>
  </section>;
}

export function ReferenceDetails({ entry, locale }: { entry: ReferenceEntry; locale: string }) {
  const loc = localeKey(locale);
  const c = copy[loc];
  return <section className="bg-panel border border-border rounded-lg p-5 space-y-4">
    <p className="text-gold2 text-sm font-bold">{c.official}</p>
    <p className="text-ink leading-relaxed">{entry.summary[loc]}</p>
    <div className="border-l-2 border-amber-400 pl-4">
      <h2 className="text-amber-200 font-bold mb-2">{c.pending}</h2>
      <p className="text-dim leading-relaxed">{entry.pending[loc]}</p>
    </div>
    <dl className="text-sm text-dim grid gap-2">
      <div><dt className="inline font-bold">{c.released}: </dt><dd className="inline">iOS {entry.evidence.gameVersion}</dd></div>
      <div><dt className="inline font-bold">{c.published}: </dt><dd className="inline">{entry.evidence.sourcePublishedAt}</dd></div>
      <div><dt className="inline font-bold">{c.checked}: </dt><dd className="inline">{entry.evidence.lastVerifiedAt}</dd></div>
    </dl>
    <a href={entry.evidence.sourceUrl} className="text-gold2 underline">{c.sources}</a>
  </section>;
}

export function ReferencePage({ entry, locale }: { entry: ReferenceEntry; locale: string }) {
  const loc = localeKey(locale);
  return <><TopBar /><main className="max-w-4xl mx-auto px-6 py-8 pb-20">
    <Link href={`/${loc}/world-conqueror-4`} className="text-dim underline text-sm">{copy[loc].back}</Link>
    <h1 className="text-3xl md:text-4xl font-bold text-gold2 my-6">{entry.name[loc]}</h1>
    <ReferenceDetails entry={entry} locale={loc} />
    <div className="mt-6"><Wc4ReleaseStatus locale={loc} /></div>
  </main><Footer /></>;
}

export function ReferenceList({ kind, locale }: { kind: ReferenceKind; locale: string }) {
  const loc = localeKey(locale);
  return <section className="mb-8" id="reference-pages">
    <h2 className="text-xl font-bold text-gold2 mb-3">{copy[loc].records}</h2>
    <div className="grid sm:grid-cols-2 gap-3">
      {getReferences(kind).map(entry => <Link key={entry.slug} href={`/${loc}${referencePath(entry, loc)}`} className="block bg-panel border border-border rounded-lg p-4 hover:border-gold">
        <h3 className="text-gold2 font-bold">{entry.name[loc]}</h3>
        <p className="text-sm text-dim mt-2">{entry.summary[loc]}</p>
      </Link>)}
    </div>
  </section>;
}

export function GuideReviewNotice({ locale, reviewed, current }: { locale: string; reviewed: string; current: boolean }) {
  const loc = localeKey(locale);
  const text = current ? {
    fr: "Les sources confirment les annonces. Les conseils éditoriaux et les données à vérifier sont signalés dans le guide.",
    en: "Sources confirm announcements. Editorial advice and details awaiting verification are identified in the guide.",
    de: "Quellen bestätigen Ankündigungen. Redaktionelle Empfehlungen und ungeprüfte Details sind im Guide gekennzeichnet.",
  } : {
    fr: "Guide historique : ses chiffres et recommandations n’ont pas été revalidés pour le cycle de septembre. Consultez les fiches et les notes récentes avant de dépenser vos ressources.",
    en: "Legacy guide: its figures and recommendations have not been revalidated for September. Check current reference pages and release notes before spending resources.",
    de: "Älterer Guide: Zahlen und Empfehlungen wurden für September nicht erneut geprüft. Vor Ressourcenausgaben aktuelle Referenzseiten und Versionsnotizen prüfen.",
  };
  return <aside className="border-l-2 border-amber-400 bg-panel p-4 mb-6 text-sm text-dim">
    <p>{text[loc]}</p><p className="text-xs mt-2">{reviewed}</p>
  </aside>;
}
