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
    fr: [
      { q: "Qu'est-ce que World Conqueror 4 ?", a: "World Conqueror 4 (WC4) est un jeu de stratégie au tour par tour signé EasyTech sur la Seconde Guerre mondiale, avec campagnes 1939-1945, généraux recrutables et unités d'élite." },
      { q: "Qui sont les meilleurs généraux de WC4 ?", a: "Le tier S communautaire regroupe Manstein, Guderian, Rokossovsky, Yamamoto et quelques autres profils selon l'arme. Le podium en haut de page est alimenté en direct par le vote des joueurs." },
      { q: "Quelles sont les unités d'élite les plus fortes ?", a: "Côté infanterie : Delta Force (anti-général). Côté artillerie : Schwerer Gustav et M142 HIMARS. Côté blindé : König's Tiger et IS-3. Côté marine : Bismarck et Richelieu. Côté air : B-52 Stratofortress et Mi-24 Hind." },
      { q: "Ce wiki est-il officiel ?", a: "Non. EasyTech Wiki est une base communautaire indépendante construite à partir des ressources du jeu. EasyTech n'est pas affilié à ce wiki." },
      { q: "À quelle fréquence le contenu est-il mis à jour ?", a: "Après chaque patch majeur du jeu, généralement sous une semaine. Consultez la section « Mises à jour » pour l'historique complet des patchs couverts." },
    ],
    en: [
      { q: "What is World Conqueror 4?", a: "World Conqueror 4 (WC4) is a turn-based strategy game from EasyTech set in World War II, with 1939–1945 campaigns, recruitable generals and elite units." },
      { q: "Who are the best generals in WC4?", a: "The community-voted S tier includes Manstein, Guderian, Rokossovsky, Yamamoto and a handful of others depending on branch. The live podium at the top of the page is driven by player votes." },
      { q: "What are the strongest elite units?", a: "Infantry: Delta Force (anti-general). Artillery: Schwerer Gustav and M142 HIMARS. Armor: King Tiger and IS-3. Navy: Bismarck and Richelieu. Air: B-52 Stratofortress and Mi-24 Hind." },
      { q: "Is this wiki official?", a: "No. EasyTech Wiki is an independent community database built from in-game resources. EasyTech is not affiliated with this wiki." },
      { q: "How often is the content updated?", a: "After each major game patch, usually within a week. Check the Updates section for the full history of patches covered." },
    ],
    de: [
      { q: "Was ist World Conqueror 4?", a: "World Conqueror 4 (WC4) ist ein rundenbasiertes Strategiespiel von EasyTech über den Zweiten Weltkrieg, mit Kampagnen von 1939 bis 1945, rekrutierbaren Generälen und Elite-Einheiten." },
      { q: "Wer sind die besten Generäle in WC4?", a: "Das von der Community gewählte S-Tier umfasst Manstein, Guderian, Rokossovsky, Yamamoto und einige weitere, je nach Waffengattung. Das Live-Podium oben auf der Seite wird durch Spielerabstimmungen gespeist." },
      { q: "Was sind die stärksten Elite-Einheiten?", a: "Infanterie: Delta Force (Anti-General). Artillerie: Schwerer Gustav und M142 HIMARS. Panzer: Königstiger und IS-3. Marine: Bismarck und Richelieu. Luft: B-52 Stratofortress und Mi-24 Hind." },
      { q: "Ist dieses Wiki offiziell?", a: "Nein. EasyTech Wiki ist eine unabhängige Community-Datenbank, die aus Spielressourcen aufgebaut ist. EasyTech ist nicht mit diesem Wiki verbunden." },
      { q: "Wie oft wird der Inhalt aktualisiert?", a: "Nach jedem größeren Spiel-Patch, meist innerhalb einer Woche. Im Bereich „Updates\u201C findest du die vollständige Patch-Historie." },
    ],
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
