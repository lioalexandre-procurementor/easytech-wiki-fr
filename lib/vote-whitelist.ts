import { getGeneral, getCandidatesForGeneralSlot } from "./units";
import type { LearnableSkill } from "./types";

/**
 * Returns the learnable-skill candidates for a (general, slot) pair.
 * Returns null if the general doesn't exist or the slot is not replaceable.
 */
export function getSlotCandidates(
  generalSlug: string,
  slot: number
): LearnableSkill[] | null {
  const g = getGeneral(generalSlug);
  if (!g) return null;
  const skill = g.skills.find((s) => s.slot === slot);
  if (!skill || !skill.replaceable) return null;
  return getCandidatesForGeneralSlot(g, slot);
}

/**
 * True iff the given learnable-skill id is a legal vote for (general, slot).
 */
export function isAllowedSkill(
  generalSlug: string,
  slot: number,
  skillId: string
): boolean {
  const candidates = getSlotCandidates(generalSlug, slot);
  if (!candidates) return false;
  return candidates.some((c) => c.id === skillId);
}
