import { getGeneral } from "./units";
import type { TrainedSkillCandidate } from "./types";

export function getSlotCandidates(
  generalSlug: string,
  slot: 1 | 2
): TrainedSkillCandidate[] | null {
  const g = getGeneral(generalSlug);
  if (!g?.trained?.trainedSlots) return null;
  const s = g.trained.trainedSlots.find((x) => x.slot === slot);
  return s ? s.candidates : null;
}

export function isAllowedSkill(
  generalSlug: string,
  slot: 1 | 2,
  skillId: string
): boolean {
  const candidates = getSlotCandidates(generalSlug, slot);
  if (!candidates) return false;
  return candidates.some((c) => c.id === skillId);
}
