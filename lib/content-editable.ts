/**
 * Async loaders that merge the base JSON (disk, sync) with any Redis
 * override (async) and wrap the result in `unstable_cache` with an entity
 * tag. Saving an override calls `revalidateTag` on the same tag, which
 * flushes the rendered HTML for that entity at the edge.
 *
 * Usage in pages:
 *
 *   const unit = await loadEliteUnit(slug);
 *
 * replaces the previous sync `getEliteUnit(slug)`. Pages that don't care
 * about live editing can stay on the sync loader.
 */
import { unstable_cache } from "next/cache";
import { applyPatch, getOverride, tagFor, type EntityType } from "./overrides";
import {
  getEliteUnit as wc4EliteUnit,
  getGeneral as wc4General,
} from "./units";
import {
  getEliteUnit as gcrEliteUnit,
  getGeneral as gcrGeneral,
} from "./gcr";
import { getGuide as baseGuide } from "./guides";
import { getUpdate as baseUpdate } from "./updates";
import type { UnitData, GeneralData, Guide, UpdateEntry } from "./types";

/**
 * Cross-game loaders for `loadEliteUnit` / `loadGeneral`.
 *
 * The site serves both WC4 and GCR out of the same Next.js app but slug
 * spaces don't currently overlap (WW2-era vs antiquity names). Falling
 * through from WC4 → GCR keeps every call site that was written against
 * WC4 working for GCR too, without per-page refactors.
 *
 * When an override is saved against `general:<slug>` the applicable game
 * is determined by which base loader returned a hit. For admin saves
 * targeting GCR content specifically, use the `gcr-general` entity type
 * so the override key stays namespaced.
 */
function baseEliteUnit(slug: string): UnitData | null {
  return wc4EliteUnit(slug) ?? gcrEliteUnit(slug);
}

function baseGeneral(slug: string): GeneralData | null {
  return wc4General(slug) ?? gcrGeneral(slug);
}

/** Per-entity ISR freshness window. Tag invalidation cuts through this. */
const DEFAULT_REVALIDATE_SEC = 60 * 60;

/**
 * During `next build` (static prerender of 2000+ pages), every prerender
 * would otherwise do a Redis round-trip to check for overrides — which
 * blows past Vercel's 45-min build budget on this repo. At build time we
 * return pure base JSON: any existing override will propagate the next
 * time the page is revalidated at runtime (either via ISR window or an
 * explicit revalidateTag from an admin save). Admin saves always call
 * revalidateTag, so overrides become visible within seconds after build.
 */
const IS_BUILD_PHASE = process.env.NEXT_PHASE === "phase-production-build";

type Loader<T> = (slug: string) => T | null;

function wrap<T>(entityType: EntityType, loader: Loader<T>) {
  return async (slug: string): Promise<T | null> => {
    if (IS_BUILD_PHASE) return loader(slug);
    return unstable_cache(
      async () => {
        const base = loader(slug);
        if (!base) return null;
        const record = await getOverride(entityType, slug);
        if (!record || record.patch === undefined || record.patch === null) {
          return base;
        }
        return applyPatch(base, record.patch);
      },
      [`${entityType}:${slug}`],
      {
        tags: [tagFor(entityType, slug), `${entityType}:all`],
        revalidate: DEFAULT_REVALIDATE_SEC,
      }
    )();
  };
}

export const loadEliteUnit = wrap<UnitData>("elite-unit", baseEliteUnit);
export const loadGeneral = wrap<GeneralData>("general", baseGeneral);
export const loadGuide = wrap<Guide>("guide", baseGuide);
export const loadUpdate = wrap<UpdateEntry>("update", baseUpdate);

// GCR-scoped variants. These resolve base data from `lib/gcr` only and
// store overrides under `gcr-*` keys. Page files that want to edit-gate
// a specifically-GCR entity (rather than falling through from WC4) should
// call these. Kept exported for admin form routing; existing GCR pages
// can keep using `loadGeneral` / `loadEliteUnit` thanks to the fallthrough
// in `baseGeneral` / `baseEliteUnit` above.
export const loadGcrEliteUnit = wrap<UnitData>("gcr-elite-unit", gcrEliteUnit);
export const loadGcrGeneral = wrap<GeneralData>("gcr-general", gcrGeneral);

/** Raw base loader (no override). Used by the admin editor to diff against. */
export function loadBase(entityType: EntityType, slug: string): unknown | null {
  switch (entityType) {
    case "elite-unit":
      return baseEliteUnit(slug);
    case "general":
      return baseGeneral(slug);
    case "guide":
      return baseGuide(slug);
    case "update":
      return baseUpdate(slug);
    case "gcr-elite-unit":
      return gcrEliteUnit(slug);
    case "gcr-general":
      return gcrGeneral(slug);
    case "gcr-guide":
    case "gcr-update":
    case "gcr-skill":
    case "gcr-technology":
    case "skill":
    case "technology":
      // Slice 1 does not yet ship editors for these types; loader is a
      // stub so the generic admin form can still inspect the raw JSON
      // via a direct fs read from the entity list page.
      return null;
    default:
      return null;
  }
}
