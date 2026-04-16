/**
 * Curated editorial data for the voting surfaces.
 *
 * Two maps per game:
 *   1. UNIT_EDITORIAL_PICKS — per-unit recommended general(s). Used as
 *      the slot-1 "Notre choix" label on the leaderboards units tab when
 *      a unit has fewer than `UNITS_LEADERBOARD_THRESHOLD` votes.
 *      Supports up to two picks per unit: `primary` is the slot-1 fill;
 *      `secondary` is reserved for a future 2-editorial-slot variant and
 *      is currently ignored by the UI. Keeping the shape expressive now
 *      avoids a data-model churn when we roll that out.
 *   2. BEST_GENERAL_PLACEHOLDER — 10 curated general slugs. Fill empty
 *      ranks on the leaderboards generals grid (tiles 9–10 always, or
 *      all 10 tiles when total votes are zero).
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

export type EditorialPick = {
  /** Slot-1 recommendation — always rendered before threshold. */
  primary: string;
  /** Optional slot-2 recommendation — unused today, wired for future
   *  "show 2 editorial + 1 placeholder" variant. */
  secondary?: string;
};

export const UNIT_EDITORIAL_PICKS: Record<Game, Record<string, EditorialPick>> = {
  wc4: {
    // Airforce
    "ah-64-apache": { primary: "doolittle" },
    "b-52-stratofortress": { primary: "spaatz" },
    "c-47-skytrain": { primary: "eisenhower" },
    "harrier": { primary: "dowding" },
    "ju-87-stuka": { primary: "de-gaulle" },            // rumor-skill synergy with dive bombers
    "mi-24-hind": { primary: "bagramyan" },
    "mystic-bomber": { primary: "de-gaulle" },
    "mystic-strategic-bomber": { primary: "spaatz" },
    "p-40-warhawk": { primary: "doolittle" },
    "su-30": { primary: "bagramyan" },
    "supermarine-spitfire": { primary: "dowding" },     // Battle of Britain classic
    "sva-23": { primary: "richthofen" },
    // Navy
    "akagi": { primary: "yamamoto" },
    "arleigh-burke": { primary: "nimitz" },
    "bismarck": { primary: "raeder" },
    "enterprise-cv": { primary: "halsey" },
    "hms-prince-of-wales": { primary: "cunningham" },
    "richelieu": { primary: "de-gaulle" },              // FR naval (limited FR naval roster)
    "type-vii-uboat": { primary: "donitz" },
    "typhoon-submarine": { primary: "kuznetsov" },
    "yukikaze": { primary: "yamamoto" },
    // Tank
    "centurion": { primary: "montgomery" },
    "e-775": { primary: "guderian" },
    "heavenly-beginning-tank": { primary: "guderian" },
    "honeycomb": { primary: "rommel" },
    "is-3": { primary: "zhukov" },
    "konigs-tiger": { primary: "guderian" },            // DE Panzer doctrine
    "leopard-2": { primary: "manstein" },
    "m1a1-abrams": { primary: "abrams" },               // namesake
    "m26-pershing": { primary: "patton" },
    "t-44": { primary: "rokossovsky" },
    "t-72": { primary: "zhukov" },
    "titan-tank": { primary: "guderian" },
    // Artillery
    "auf1-spg": { primary: "de-gaulle" },               // FR artillery
    "b-4-howitzer": { primary: "voronov" },
    "bm-21-grad": { primary: "bagramyan" },
    "flak-88": { primary: "heinrici" },
    "ks-90": { primary: "bagramyan" },
    "m142-himars": { primary: "marshall" },
    "m7-priest": { primary: "marshall" },
    "schwerer-gustav": { primary: "rundstedt" },
    "stuka-rocket": { primary: "de-gaulle" },           // rocket-artillery rumor synergy
    "topol-m": { primary: "voronov" },
    // Infantry
    "alpini": { primary: "messe" },                     // IT mountain infantry
    "brandenburg-infantry": { primary: "manstein" },    // DE special forces
    "combat-medic": { primary: "eisenhower" },
    "delta-force": { primary: "patton" },
    "engineer-unit": { primary: "marshall" },
    "ghost-troop": { primary: "simo-hayha" },           // stealth/sniper archetype
    "hawkeye": { primary: "simo-hayha" },               // crit/recon synergy
    "mystery-paratrooper": { primary: "manstein" },
    "rpg-rocket-soldier": { primary: "chuikov" },       // RU urban combat
  },
  ew6: {
    // Empty initially — EW6 leaderboard isn't surfaced yet. The module is
    // still shaped per-game so voting API routes can validate EW6 slugs
    // without special-casing. Populate later when the EW6 leaderboard
    // page ships.
  },
  gcr: {
    // Infantry
    "anubis": { primary: "cleopatra" },                 // Egyptian theme
    "auxiliary-infantry": { primary: "caesar" },
    "axeman": { primary: "arminius" },
    "elite-guard": { primary: "octavian" },
    "elite-pirate": { primary: "sextus-pompey" },
    "gallic-swordsman": { primary: "vercingetorix" },
    "gladiator": { primary: "spartacus" },              // gladiator revolt
    "goblin": { primary: "attila" },
    "heavy-infantry": { primary: "caesar" },
    "legionary": { primary: "caesar" },
    "light-infantry": { primary: "caesar" },
    "minotaur": { primary: "hannibal" },
    "orc-hammerer": { primary: "attila" },
    "pirate": { primary: "sextus-pompey" },
    "royal-guard": { primary: "octavian" },
    "swordsman": { primary: "caesar" },
    "warrior": { primary: "arminius" },
    "woad-raider": { primary: "vercingetorix" },
    // Archer
    "bowman": { primary: "scipio" },
    "celtic-slinger": { primary: "vercingetorix" },
    "crossbow-man": { primary: "caesar" },
    "cyclops": { primary: "scipio" },
    "elite-archer": { primary: "scipio" },
    "horse-archer": { primary: "surena" },              // Parthian classic
    "hunter": { primary: "commius" },
    "javelineer": { primary: "scipio" },
    "marksman": { primary: "crassus" },
    "orc-spearwielder": { primary: "attila" },
    "slave-archer": { primary: "spartacus" },           // slave rebellion
    "slinger": { primary: "hannibal" },                 // Balearic slingers
    "syrian-archer": { primary: "cleopatra" },
    "terracotta-warrior": { primary: "huo" },           // Chinese theme
    // Cavalry
    "behemoth": { primary: "hannibal" },
    "cataphract": { primary: "surena" },                // Parthian cataphract
    "chieftain-cavalry": { primary: "vercingetorix" },
    "griffin": { primary: "hannibal" },
    "heavy-cavalry": { primary: "hannibal" },
    "imperial-guard": { primary: "octavian" },
    "light-cavalry": { primary: "agrippa" },
    "mammoth": { primary: "hannibal" },                 // pachyderm synergy
    "noble-cavalry": { primary: "pompey" },
    "pillager": { primary: "attila" },
    "raider": { primary: "antony" },
    "scout": { primary: "labienus" },                   // Caesar's recon
    "tribal-cavalry": { primary: "ariovistus" },
    "war-chariot": { primary: "vercingetorix" },        // Celtic chariot
    "war-elephant": { primary: "hannibal" },            // elephant classic
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
  ew6: [
    "napoleon",
    "nelson",
    "blucher",
    "kutuzov",
    "moltke",
    "davout",
    "suvorov",
    "ney",
    "murat",
    "washington",
  ],
};

export function getEditorialPick(game: Game, unitSlug: string): EditorialPick | null {
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
