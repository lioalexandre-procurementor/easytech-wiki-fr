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
 */
import type { Game } from "./types";

export const UNIT_EDITORIAL_PICKS: Record<Game, Record<string, string>> = {
  wc4: {
    // TODO: populate with curated picks in Task 3. Left empty here so
    // the module is importable and the verifier runs.
  },
  gcr: {
    // TODO: populate with curated picks in Task 3.
  },
};

export const BEST_GENERAL_PLACEHOLDER: Record<Game, string[]> = {
  wc4: [
    // TODO: extend to 10 in Task 3. Current 5 from world-conqueror-4/page.tsx:13.
    "manstein",
    "guderian",
    "rokossovsky",
    "simo-hayha",
    "de-gaulle",
  ],
  gcr: [
    // TODO: populate with 10 GCR generals in Task 3.
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
