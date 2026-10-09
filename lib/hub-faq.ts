/**
 * Per-game hub FAQ entries used on `/[locale]/world-conqueror-4/`,
 * `/[locale]/great-conqueror-rome/`, and `/[locale]/european-war-6/`.
 *
 * Purpose: FAQ content is the cheapest-to-ship long-tail SEO asset on
 * these hubs. Ranked at position 7–9 on queries like "wc4 wiki" and
 * "world conqueror 4 wiki", a hub page becomes Google-eligible for FAQ
 * rich snippets as soon as the mainEntity JSON-LD matches DOM text
 * (requirement of the spec).
 *
 * Keep answers factual, short (1–2 sentences), and aligned with the
 * visible FAQ block on the page. Rewriting one without the other will
 * suppress the rich snippet.
 */

export interface FaqItem {
  q: string;
  a: string;
}

type Game = "wc4" | "gcr" | "ew6";

type LocalizedFaqs = Record<"fr" | "en" | "de", FaqItem[]>;

const FAQS: Record<Game, LocalizedFaqs> = {
  wc4: {
  "fr": [
    {
      "q": "Quelles versions sont couvertes ?",
      "a": "Consultez le bandeau des versions et la date de consultation des sources. Les ajouts sont recensés ; leur présence ne signifie pas que toutes les statistiques sont vérifiées."
    },
    {
      "q": "Quels sont les meilleurs généraux ?",
      "a": "Les préférences communautaires et les classements éditoriaux sont distincts des faits du jeu. Comparez les rôles et votre progression avant d’investir."
    },
    {
      "q": "Comment comparer les nouvelles unités ?",
      "a": "Les fiches de référence distinguent les ajouts officiels des valeurs à vérifier. Les chiffres provisoires sont masqués dans le comparateur."
    },
    {
      "q": "Ce wiki est-il officiel ?",
      "a": "Non. EasyTech Wiki est un site communautaire indépendant, non affilié à EasyTech."
    }
  ],
  "en": [
    {
      "q": "Which versions are covered?",
      "a": "Check the version banner and source-check date. Additions are catalogued; their presence does not mean all stats are verified."
    },
    {
      "q": "Who are the best generals?",
      "a": "Community preferences and editorial rankings are separate from game facts. Compare roles and your progression before investing."
    },
    {
      "q": "How can I compare new units?",
      "a": "Reference pages distinguish official additions from values awaiting verification. Provisional numbers are hidden in the comparator."
    },
    {
      "q": "Is this wiki official?",
      "a": "No. EasyTech Wiki is an independent community site, not affiliated with EasyTech."
    }
  ],
  "de": [
    {
      "q": "Welche Versionen sind abgedeckt?",
      "a": "Versionsanzeige und Datum der Quellenprüfung beachten. Ergänzungen sind erfasst; das bedeutet nicht, dass alle Werte geprüft sind."
    },
    {
      "q": "Wer sind die besten Generäle?",
      "a": "Community-Vorlieben und redaktionelle Ranglisten sind von Spielfakten zu unterscheiden. Rollen und eigenen Fortschritt vor einer Investition vergleichen."
    },
    {
      "q": "Wie vergleiche ich neue Einheiten?",
      "a": "Referenzseiten trennen offizielle Ergänzungen von ungeprüften Werten. Vorläufige Zahlen werden im Vergleich ausgeblendet."
    },
    {
      "q": "Ist dieses Wiki offiziell?",
      "a": "Nein. EasyTech Wiki ist eine unabhängige Community-Website ohne Verbindung zu EasyTech."
    }
  ]
},
  gcr: {
    fr: [
      { q: "Qu'est-ce que Great Conqueror: Rome ?", a: "Great Conqueror: Rome (GCR) est le spin-off d'EasyTech sur l'Antiquité : campagnes romaines, généraux antiques, légions et factions barbares." },
      { q: "Quels généraux vaut-il la peine de monter ?", a: "Les valeurs sûres sont César, Scipion et Hannibal côté généraux principaux, avec des spécialistes comme Spartacus et Ariovistus pour les compositions barbares." },
      { q: "GCR est-il lié à World Conqueror 4 ?", a: "Même studio (EasyTech), même philosophie de jeu au tour par tour, mais des ressources et une méta complètement distinctes. Les progressions ne sont pas partagées." },
      { q: "Ce wiki est-il officiel ?", a: "Non. EasyTech Wiki est une base communautaire indépendante, non affiliée à EasyTech." },
    ],
    en: [
      { q: "What is Great Conqueror: Rome?", a: "Great Conqueror: Rome (GCR) is EasyTech's Antiquity spin-off: Roman campaigns, ancient generals, legions and barbarian factions." },
      { q: "Which generals are worth leveling?", a: "Safe picks include Caesar, Scipio and Hannibal as core generals, with specialists like Spartacus and Ariovistus for barbarian compositions." },
      { q: "Is GCR connected to World Conqueror 4?", a: "Same studio (EasyTech), same turn-based design, but completely separate resources and meta. Progress doesn't carry over." },
      { q: "Is this wiki official?", a: "No. EasyTech Wiki is an independent community database, not affiliated with EasyTech." },
    ],
    de: [
      { q: "Was ist Great Conqueror: Rome?", a: "Great Conqueror: Rome (GCR) ist der Antike-Ableger von EasyTech: römische Kampagnen, antike Generäle, Legionen und barbarische Fraktionen." },
      { q: "Welche Generäle lohnen sich?", a: "Sichere Wahl sind Cäsar, Scipio und Hannibal als Kerngeneräle, mit Spezialisten wie Spartacus und Ariovistus für barbarische Aufstellungen." },
      { q: "Hängt GCR mit World Conqueror 4 zusammen?", a: "Gleiches Studio (EasyTech), gleiches rundenbasiertes Konzept, aber völlig getrennte Ressourcen und Meta. Fortschritt wird nicht übertragen." },
      { q: "Ist dieses Wiki offiziell?", a: "Nein. EasyTech Wiki ist eine unabhängige Community-Datenbank, nicht mit EasyTech verbunden." },
    ],
  },
  ew6: {
    fr: [
      { q: "Qu'est-ce que European War 6: 1914 ?", a: "European War 6: 1914 est un jeu de stratégie d'EasyTech couvrant les guerres napoléoniennes et la Grande Guerre, avec généraux historiques et technologies d'époque." },
      { q: "Sur quelle campagne commencer ?", a: "La campagne napoléonienne est la plus accessible pour débuter. La Grande Guerre propose un niveau de difficulté supérieur une fois les généraux clés recrutés." },
      { q: "EW6 est-il lié à WC4 ?", a: "Même studio, esprit de jeu similaire, mais contenu indépendant : généraux, unités et progression séparés." },
      { q: "Ce wiki est-il officiel ?", a: "Non. EasyTech Wiki est une base communautaire indépendante, non affiliée à EasyTech." },
    ],
    en: [
      { q: "What is European War 6: 1914?", a: "European War 6: 1914 is an EasyTech strategy game covering the Napoleonic Wars and the Great War, with period-accurate generals and technologies." },
      { q: "Which campaign should I start with?", a: "The Napoleonic campaign is the more accessible entry point. The Great War offers a higher difficulty ceiling once your key generals are recruited." },
      { q: "Is EW6 connected to WC4?", a: "Same studio, similar feel, but independent content — generals, units and progress are separate." },
      { q: "Is this wiki official?", a: "No. EasyTech Wiki is an independent community database, not affiliated with EasyTech." },
    ],
    de: [
      { q: "Was ist European War 6: 1914?", a: "European War 6: 1914 ist ein Strategiespiel von EasyTech über die napoleonischen Kriege und den Ersten Weltkrieg, mit zeitgetreuen Generälen und Technologien." },
      { q: "Mit welcher Kampagne starten?", a: "Die napoleonische Kampagne ist der zugänglichere Einstieg. Der Erste Weltkrieg bietet einen höheren Schwierigkeitsgrad, sobald die Schlüsselgeneräle rekrutiert sind." },
      { q: "Ist EW6 mit WC4 verbunden?", a: "Gleiches Studio, ähnliches Spielgefühl, aber eigenständiger Inhalt — Generäle, Einheiten und Fortschritt sind getrennt." },
      { q: "Ist dieses Wiki offiziell?", a: "Nein. EasyTech Wiki ist eine unabhängige Community-Datenbank, nicht mit EasyTech verbunden." },
    ],
  },
};

export function getHubFaqs(game: Game, locale: string): FaqItem[] {
  const bucket = FAQS[game];
  if (!bucket) return [];
  if (locale === "fr" || locale === "en" || locale === "de") {
    return bucket[locale];
  }
  return bucket.en;
}

/** Heading/tagline strings for the FAQ block — keep DOM text + JSON-LD in sync. */
export const HUB_FAQ_HEADING: Record<string, string> = {
  fr: "Questions fréquentes",
  en: "Frequently asked questions",
  de: "Häufig gestellte Fragen",
};
