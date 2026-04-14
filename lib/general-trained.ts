import type {
  GeneralAttributes,
  GeneralData,
  GeneralSkill,
  TrainedGeneralView,
} from "./types";

/**
 * Compute the trained projection of a general: stats collapsed to max,
 * skills with any training-stage replacements applied, total costs summed.
 *
 * Pure: never mutates `g`. Safe to call from both server and client components.
 */
export function buildTrainedView(g: GeneralData): TrainedGeneralView {
  // Attributes: collapse every value so start === max.
  const attributes: GeneralAttributes = {};
  if (g.attributes) {
    for (const [key, v] of Object.entries(g.attributes)) {
      const k = key as keyof GeneralAttributes;
      if (v) attributes[k] = { start: v.max, max: v.max };
      else attributes[k] = v as null;
    }
  }

  // Skills: clone base, then apply each training stage's skillChanges in order.
  const skills: GeneralSkill[] = g.skills.map((s) => ({ ...s }));
  for (const stage of g.training?.stages ?? []) {
    for (const change of stage.skillChanges ?? []) {
      const target = skills.find((s) => s.slot === change.slot);
      if (!target) continue;
      if (change.kind === "unlock" || change.kind === "replace") {
        if (change.newName) target.name = change.newName;
        if (change.newDesc) target.desc = change.newDesc;
        if (change.newRating !== undefined) target.rating = change.newRating;
        if (change.kind === "unlock") target.replaceable = false;
      } else if (change.kind === "upgrade") {
        if (change.newDesc) target.desc = change.newDesc;
        if (change.newRating !== undefined) target.rating = change.newRating;
      }
    }
  }

  return {
    attributes,
    skills,
    totalSwordCost: g.training?.totalSwordCost ?? null,
    totalSceptreCost: g.training?.totalSceptreCost ?? null,
    summary: g.training?.summary ?? "",
  };
}
