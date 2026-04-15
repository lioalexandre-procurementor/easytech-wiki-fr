import type {
  GeneralAttributes,
  GeneralData,
  GeneralSkill,
  SkillCatalogEntry,
  TrainedGeneralView,
} from "./types";
import { getSkill } from "./units";

/**
 * Resolve a single skill to its catalog maxLevel, pulling the rendered
 * description and level bump from the progression array.
 * Returns the original skill unchanged if it has no catalog cross-link.
 */
function projectSkillToMax(skill: GeneralSkill): GeneralSkill {
  if (!skill.skillSlug) return { ...skill };
  const catalog: SkillCatalogEntry | null = getSkill(skill.skillSlug);
  if (!catalog || catalog.progression.length === 0) return { ...skill };
  const maxEntry =
    catalog.progression.find((p) => p.level === catalog.maxLevel) ||
    catalog.progression[catalog.progression.length - 1];
  return {
    ...skill,
    desc: maxEntry.renderedDesc || skill.desc,
    icon: skill.icon ?? catalog.icon ?? null,
    skillLevel: maxEntry.level,
  };
}

/**
 * Compute the "Maxed out" projection of a general:
 * - every attribute collapsed to its ceiling (`start === max`);
 * - every skill upgraded to its catalog `maxLevel`, with the rendered
 *   description pulled from the progression array.
 *
 * This is NOT the premium training path (Swords/Sceptres). It simply shows
 * what the general looks like when every slot is fully maxed out — useful
 * for at-a-glance comparison across generals regardless of their current
 * progression.
 *
 * Pure: never mutates `g`. Safe to call from server components.
 */
export function buildTrainedView(g: GeneralData): TrainedGeneralView {
  // Attributes: collapse every value so start === max.
  const attributes: GeneralAttributes = {};
  if (g.attributes) {
    for (const [key, v] of Object.entries(g.attributes)) {
      const k = key as keyof GeneralAttributes;
      if (v) {
        const ceiling = Math.max(v.start, v.max);
        attributes[k] = { start: ceiling, max: ceiling };
      } else {
        attributes[k] = v as null;
      }
    }
  }

  // Skills: project each base slot to its catalog max level.
  const skills: GeneralSkill[] = g.skills.map((s) => projectSkillToMax(s));

  return {
    attributes,
    skills,
    totalSwordCost: null,
    totalSceptreCost: null,
    summary: "",
  };
}

/**
 * Compute the "Premium training" projection of a general — the final-stage
 * loadout after spending Swords/Sceptres of Dominance. Only applicable to
 * generals with `hasTrainingPath=true` and a populated `trainedSkills` array
 * (authored by scripts/backfill-training-skills.py).
 *
 * Each skill in the trained loadout is additionally projected to its catalog
 * maxLevel, so the player sees both the signature unlock AND the max-level
 * description for every slot.
 */
export function buildPremiumTrainingView(g: GeneralData): TrainedGeneralView | null {
  if (!g.hasTrainingPath || !g.trainedSkills || g.trainedSkills.length === 0) {
    return null;
  }

  const attributes: GeneralAttributes = {};
  if (g.attributes) {
    for (const [key, v] of Object.entries(g.attributes)) {
      const k = key as keyof GeneralAttributes;
      if (v) {
        const ceiling = Math.max(v.start, v.max);
        attributes[k] = { start: ceiling, max: ceiling };
      } else {
        attributes[k] = v as null;
      }
    }
  }

  const skills: GeneralSkill[] = g.trainedSkills.map((s) => projectSkillToMax(s));

  return {
    attributes,
    skills,
    totalSwordCost: g.training?.totalSwordCost ?? null,
    totalSceptreCost: g.training?.totalSceptreCost ?? null,
    summary: g.training?.summary ?? "",
  };
}
