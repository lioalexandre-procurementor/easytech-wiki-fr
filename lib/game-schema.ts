import { BASE_URL } from "./seo-alternates";
import { getGame } from "./games";

/**
 * VideoGame JSON-LD for a game hub page. Makes the hub eligible for richer
 * results and gives search engines an explicit entity for the game (vs.
 * inferring it from prose). Publisher/developer is EasyTech; the wiki itself
 * is not the game's author, so we do NOT claim `author`.
 *
 * `applicationCategory` + `operatingSystem` come from the fact these are
 * free-to-play iOS/Android strategy titles. `url` points at the localized
 * hub so the entity resolves to a real indexable page.
 */
const GENRE: Record<string, string[]> = {
  "world-conqueror-4": ["Strategy", "Turn-based strategy", "War"],
  "great-conqueror-rome": ["Strategy", "Turn-based strategy", "War"],
  "european-war-6": ["Strategy", "Turn-based strategy", "War"],
};

export function gameSchema(opts: {
  gameSlug: string;
  locale: string;
  hubPath: string; // locale-internal path, e.g. "/world-conqueror-4"
  description: string;
}) {
  const game = getGame(opts.gameSlug);
  if (!game) return null;
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.name,
    url: `${BASE_URL}/${opts.locale}${opts.hubPath}`,
    description: opts.description,
    genre: GENRE[opts.gameSlug] ?? ["Strategy"],
    gamePlatform: ["iOS", "Android"],
    applicationCategory: "GameApplication",
    operatingSystem: "iOS, Android",
    publisher: { "@type": "Organization", name: "EasyTech" },
    author: { "@type": "Organization", name: "EasyTech" },
    inLanguage: opts.locale,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      category: "free-to-play",
    },
  };
}
