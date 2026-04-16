import { getAllGenerals, getEliteUnit } from "./units";
import type { GeneralCategory, Category, GeneralData } from "./types";

/**
 * For a given elite unit, return the pool of generals a player could
 * reasonably train onto it. Used to filter both the vote modal choices
 * and to validate incoming vote POSTs server-side so someone can't
 * cast a "Patton" vote for a marine unit.
 *
 * Rule:
 *  - Generals whose `category` matches the unit's `category` are eligible.
 *  - `balanced` generals are eligible for every category.
 *  - Scorpion generals are only eligible for scorpion units.
 *  - Orders by rank (S > A > B > C) then name for stable listing.
 */
const UNIT_CATEGORY_TO_GENERAL_CATEGORIES: Record<Category, GeneralCategory[]> = {
  tank:      ["tank", "balanced"],
  infantry:  ["infantry", "balanced"],
  artillery: ["artillery", "balanced"],
  navy:      ["navy", "balanced"],
  airforce:  ["airforce", "balanced"],
};

const RANK_ORDER: Record<string, number> = { S: 0, A: 1, B: 2, C: 3 };

export function getEligibleGeneralsForUnit(unitSlug: string): GeneralData[] {
  const unit = getEliteUnit(unitSlug);
  if (!unit) return [];
  const allowed = UNIT_CATEGORY_TO_GENERAL_CATEGORIES[unit.category] ?? [];
  const wantScorpion = unit.faction === "scorpion";
  return getAllGenerals()
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
  unitSlug: string,
  generalSlug: string
): boolean {
  return getEligibleGeneralsForUnit(unitSlug).some((g) => g.slug === generalSlug);
}

/**
 * Minimum total votes before the community "best general" result is
 * surfaced publicly. Until the threshold is reached, the widget shows
 * a placeholder pointing at editorial picks instead of a noisy signal.
 */
export const UNIT_VOTE_THRESHOLD = 100;
