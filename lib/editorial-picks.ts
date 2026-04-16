/**
 * Curated editorial data for the voting surfaces.
 *
 * Two maps per game:
 *   1. UNIT_EDITORIAL_PICKS — per-unit recommended general slug. Used as
 *      the slot-1 "Our pick" label on the leaderboards units tab when a
 *      unit has fewer than 50 votes.
 *   2. BEST_GENERAL_PLACEHOLDER — 10 curated general slugs. Fill empty
 *      ranks on the leaderboards generals grid (tiles 9–10 always, or
 *      all 10 tiles when total votes < 100).
 *
 * These lists live in code (not the admin override system) because they
 * are small, stable, and benefit from being code-reviewable alongside
 * UI changes. The admin override system remains the source of truth
 * for per-entity overrides (see lib/overrides.ts).
 *
 * Picks are based on game-synergy logic:
 *   - Country match first (e.g., DE unit → DE general)
 *   - Category match (air general for airforce unit, etc.)
 *   - Named-skill synergy (De Gaulle rumor → Stuka dive-bombers;
 *     Simo Häyhä crit → sniper/recon units)
 *   - Fallback: best-tier general of matching theme.
 */
import type { Game } from "./types";

export const UNIT_EDITORIAL_PICKS: Record<Game, Record<string, string>> = {
  wc4: {
    // Airforce
    "ah-64-apache": "doolittle",
    "b-52-stratofortress": "spaatz",
    "c-47-skytrain": "eisenhower",
    "harrier": "dowding",
    "ju-87-stuka": "de-gaulle",            // rumor-skill synergy with dive bombers
    "mi-24-hind": "bagramyan",
    "mystic-bomber": "de-gaulle",
    "mystic-strategic-bomber": "spaatz",
    "p-40-warhawk": "doolittle",
    "su-30": "bagramyan",
    "supermarine-spitfire": "dowding",     // Battle of Britain classic
    "sva-23": "richthofen",
    // Navy
    "akagi": "yamamoto",
    "arleigh-burke": "nimitz",
    "bismarck": "raeder",
    "enterprise-cv": "halsey",
    "hms-prince-of-wales": "cunningham",
    "richelieu": "de-gaulle",              // FR naval (limited FR naval roster)
    "type-vii-uboat": "donitz",
    "typhoon-submarine": "kuznetsov",
    "yukikaze": "yamamoto",
    // Tank
    "centurion": "montgomery",
    "e-775": "guderian",
    "heavenly-beginning-tank": "guderian",
    "honeycomb": "rommel",
    "is-3": "zhukov",
    "konigs-tiger": "guderian",            // DE Panzer doctrine
    "leopard-2": "manstein",
    "m1a1-abrams": "abrams",               // namesake
    "m26-pershing": "patton",
    "t-44": "rokossovsky",
    "t-72": "zhukov",
    "titan-tank": "guderian",
    // Artillery
    "auf1-spg": "de-gaulle",               // FR artillery
    "b-4-howitzer": "voronov",
    "bm-21-grad": "bagramyan",
    "flak-88": "heinrici",
    "ks-90": "bagramyan",
    "m142-himars": "marshall",
    "m7-priest": "marshall",
    "schwerer-gustav": "rundstedt",
    "stuka-rocket": "de-gaulle",           // rocket-artillery rumor synergy
    "topol-m": "voronov",
    // Infantry
    "alpini": "messe",                     // IT mountain infantry
    "brandenburg-infantry": "manstein",    // DE special forces
    "combat-medic": "eisenhower",
    "delta-force": "patton",
    "engineer-unit": "marshall",
    "ghost-troop": "simo-hayha",           // stealth/sniper archetype
    "hawkeye": "simo-hayha",               // crit/recon synergy
    "mystery-paratrooper": "manstein",
    "rpg-rocket-soldier": "chuikov",       // RU urban combat
  },
  gcr: {
    // Infantry
    "anubis": "cleopatra",                 // Egyptian theme
    "auxiliary-infantry": "caesar",
    "axeman": "arminius",
    "elite-guard": "octavian",
    "elite-pirate": "sextus-pompey",
    "gallic-swordsman": "vercingetorix",
    "gladiator": "spartacus",              // gladiator revolt
    "goblin": "attila",
    "heavy-infantry": "caesar",
    "legionary": "caesar",
    "light-infantry": "caesar",
    "minotaur": "hannibal",
    "orc-hammerer": "attila",
    "pirate": "sextus-pompey",
    "royal-guard": "octavian",
    "swordsman": "caesar",
    "warrior": "arminius",
    "woad-raider": "vercingetorix",
    // Archer
    "bowman": "scipio",
    "celtic-slinger": "vercingetorix",
    "crossbow-man": "caesar",
    "cyclops": "scipio",
    "elite-archer": "scipio",
    "horse-archer": "surena",              // Parthian classic
    "hunter": "commius",
    "javelineer": "scipio",
    "marksman": "crassus",
    "orc-spearwielder": "attila",
    "slave-archer": "spartacus",           // slave rebellion
    "slinger": "hannibal",                 // Balearic slingers
    "syrian-archer": "cleopatra",
    "terracotta-warrior": "huo",           // Chinese theme
    // Cavalry
    "behemoth": "hannibal",
    "cataphract": "surena",                // Parthian cataphract
    "chieftain-cavalry": "vercingetorix",
    "griffin": "hannibal",
    "heavy-cavalry": "hannibal",
    "imperial-guard": "octavian",
    "light-cavalry": "agrippa",
    "mammoth": "hannibal",                 // pachyderm synergy
    "noble-cavalry": "pompey",
    "pillager": "attila",
    "raider": "antony",
    "scout": "labienus",                   // Caesar's recon
    "tribal-cavalry": "ariovistus",
    "war-chariot": "vercingetorix",        // Celtic chariot
    "war-elephant": "hannibal",            // elephant classic
  },
};

export const BEST_GENERAL_PLACEHOLDER: Record<Game, string[]> = {
  wc4: [
    "manstein",
    "guderian",
    "rokossovsky",
    "simo-hayha",
    "de-gaulle",
    "zhukov",
    "patton",
    "yamamoto",
    "montgomery",
    "rommel",
  ],
  gcr: [
    "caesar",
    "hannibal",
    "scipio",
    "octavian",
    "cleopatra",
    "vercingetorix",
    "spartacus",
    "pompey",
    "attila",
    "antony",
  ],
};

export function getEditorialPick(game: Game, unitSlug: string): string | null {
  return UNIT_EDITORIAL_PICKS[game]?.[unitSlug] ?? null;
}

/**
 * Pick the first `count` placeholder slugs that are NOT present in
 * `excludeSlugs`. Used by the generals-tab grid to fill ranks 9–10
 * with curated slugs that don't duplicate real top-8 rankings.
 */
export function pickPlaceholderSlugs(
  game: Game,
  excludeSlugs: Set<string>,
  count: number
): string[] {
  const out: string[] = [];
  for (const slug of BEST_GENERAL_PLACEHOLDER[game]) {
    if (out.length >= count) break;
    if (!excludeSlugs.has(slug)) out.push(slug);
  }
  return out;
}
