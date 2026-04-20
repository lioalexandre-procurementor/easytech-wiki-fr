import {
  getAllGenerals as getAllGeneralsWc4,
  getEliteUnit as getEliteUnitWc4,
} from "./units";
import {
  getAllGenerals as getAllGeneralsGcr,
  getEliteUnit as getEliteUnitGcr,
} from "./gcr";
import {
  getAllGenerals as getAllGeneralsEw6,
  getEliteUnit as getEliteUnitEw6,
} from "./ew6";
import type {
  GeneralCategory,
  Category,
  GeneralData,
  UnitData,
  Game,
} from "./types";

/**
 * For a given elite unit, return the pool of generals a player could
 * reasonably train onto it. Used to filter both the vote modal choices
 * and to validate incoming vote POSTs server-side so someone can't
 * cast a "Patton" vote for a marine unit.
 *
 * Rule:
 *  - Generals whose `category` matches the unit's `category` are eligible.
 *  - `balanced` generals are eligible for every category.
 *  - Scorpion generals are only eligible for scorpion units (WC4-only
 *    faction; ignored by other games).
 *  - Orders by rank (S > A > B > C) then name for stable listing.
 */
const UNIT_CATEGORY_TO_GENERAL_CATEGORIES: Partial<Record<Category, GeneralCategory[]>> = {
  tank:      ["tank", "balanced"],
  infantry:  ["infantry", "balanced"],
  artillery: ["artillery", "balanced"],
  navy:      ["navy", "balanced"],
  airforce:  ["airforce", "balanced"],
  cavalry:   ["cavalry", "balanced"],
  archer:    ["archer", "balanced"],
};

const RANK_ORDER: Record<string, number> = { S: 0, A: 1, B: 2, C: 3 };

/**
 * Elite units that shouldn't accept general-pairing votes. These units
 * have no general slot in-game (classic WWII planes the player can't
 * assign a commander to) or belong to the Scorpion faction that
 * doesn't participate in the community pairing vote.
 *
 * Making eligibility empty for these slugs cascades through:
 *   - leaderboards `loadUnitsLeaderboard` drops the row
 *   - unit detail page's vote widget renders null (early return on
 *     `eligible.length === 0`)
 *   - POST /api/vote/unit-general rejects incoming votes as ineligible
 */
const NON_VOTABLE_UNITS: Partial<Record<Game, Set<string>>> = {
  wc4: new Set([
    // Airforce units with no assignable general in-game
    "supermarine-spitfire",
    "ju-87-stuka",
    "c-47-skytrain",
    "p-40-warhawk",
    // Scorpion faction units — out of scope for the community vote
    "e-775",
    "heavenly-beginning-tank",
    "ks-90",
    "mystery-paratrooper",
    "mystic-bomber",
    "mystic-strategic-bomber",
    "sva-23",
    "titan-tank",
  ]),
};

export function isNonVotableUnit(game: Game, unitSlug: string): boolean {
  return NON_VOTABLE_UNITS[game]?.has(unitSlug) ?? false;
}

function getAllGeneralsForGame(game: Game): GeneralData[] {
  if (game === "wc4") return getAllGeneralsWc4();
  if (game === "gcr") return getAllGeneralsGcr();
  return getAllGeneralsEw6();
}

function getEliteUnitForGame(game: Game, slug: string): UnitData | null {
  if (game === "wc4") return getEliteUnitWc4(slug);
  if (game === "gcr") return getEliteUnitGcr(slug);
  return getEliteUnitEw6(slug);
}

export function getEligibleGeneralsForUnit(
  game: Game,
  unitSlug: string
): GeneralData[] {
  if (isNonVotableUnit(game, unitSlug)) return [];
  const unit = getEliteUnitForGame(game, unitSlug);
  if (!unit) return [];
  const allowed = UNIT_CATEGORY_TO_GENERAL_CATEGORIES[unit.category] ?? [];
  const wantScorpion = unit.faction === "scorpion";
  return getAllGeneralsForGame(game)
    .filter((g) => {
      if (wantScorpion) return g.faction === "scorpion";
      if (g.faction === "scorpion") return false;
      return allowed.includes(g.category);
    })
    .sort((a, b) => {
      const ar = RANK_ORDER[a.rank ?? "C"] ?? 99;
      const br = RANK_ORDER[b.rank ?? "C"] ?? 99;
      if (ar !== br) return ar - br;
      return (a.nameEn ?? a.name).localeCompare(b.nameEn ?? b.name);
    });
}

export function isEligibleGeneralForUnit(
  game: Game,
  unitSlug: string,
  generalSlug: string
): boolean {
  return getEligibleGeneralsForUnit(game, unitSlug).some(
    (g) => g.slug === generalSlug
  );
}

/**
 * Minimum total votes before the community "best general" result is
 * surfaced publicly. Until the threshold is reached, the widget shows
 * a placeholder pointing at editorial picks instead of a noisy signal.
 *
 * Lowered from 100 → 50 in the voting redesign: pairings split across
 * many units, so a lower threshold still yields confident signal per
 * unit while letting community data appear sooner.
 */
export const UNIT_VOTE_THRESHOLD = 50;
