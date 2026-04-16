/**
 * Content override layer.
 *
 * Every editable wiki entity (elite unit, general, guide, update, skill,
 * technology) has a base JSON on disk + an optional Redis "override" that
 * patches it at render time. Admin edits write the patch to Redis; the
 * data loader merges base + patch when reading. revalidateTag() on save
 * flushes the rendered HTML for that entity across Vercel's edge.
 *
 * Override semantics (JSON Merge Patch-ish, RFC 7396):
 * - Fields absent from the patch inherit from base
 * - Fields present in the patch override base (deep-merge for objects)
 * - Fields set to `null` in the patch are deleted from the merged result
 * - Arrays are replaced wholesale — there is no per-element merging
 *
 * Storage shape: `override:<entityType>:<slug>` holds an OverrideRecord
 * JSON string. We pick string JSON (not Upstash hash) because the patch
 * itself is a nested JSON structure and a single SET/GET is atomic.
 */
import { getRedis } from "./redis";

export type EntityType =
  | "elite-unit"
  | "general"
  | "guide"
  | "update"
  | "skill"
  | "technology";

export type OverrideRecord = {
  patch: unknown;
  updatedAt: number;
  updatedBy?: string;
  note?: string;
};

export function overrideKey(entityType: EntityType, slug: string): string {
  return `override:${entityType}:${slug}`;
}

export function tagFor(entityType: EntityType, slug: string): string {
  return `${entityType}:${slug}`;
}

function parseRecord(raw: unknown): OverrideRecord | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as OverrideRecord;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") return raw as OverrideRecord;
  return null;
}

export async function getOverride(
  entityType: EntityType,
  slug: string
): Promise<OverrideRecord | null> {
  const redis = getRedis();
  if (!redis) return null;
  const raw = (await redis.get(overrideKey(entityType, slug))) as unknown;
  return parseRecord(raw);
}

export async function setOverride(
  entityType: EntityType,
  slug: string,
  patch: unknown,
  updatedBy = "admin",
  note?: string
): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("redis not configured");
  const record: OverrideRecord = {
    patch,
    updatedAt: Date.now(),
    updatedBy,
    ...(note ? { note } : {}),
  };
  await redis.set(overrideKey(entityType, slug), JSON.stringify(record));
}

export async function clearOverride(
  entityType: EntityType,
  slug: string
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  const n = (await redis.del(overrideKey(entityType, slug))) as number;
  return n > 0;
}

/**
 * Deep-merge a patch into a base value.
 *  - undefined in patch: keep base as-is
 *  - null in patch: delete the field
 *  - arrays: replaced wholesale (RFC 7396 semantic)
 *  - primitives: patch replaces base
 *  - objects: recursive merge
 */
export function applyPatch<T>(base: T, patch: unknown): T {
  if (patch === undefined) return base;
  if (patch === null) return null as unknown as T;
  if (Array.isArray(patch)) return patch as unknown as T;
  if (typeof patch !== "object") return patch as unknown as T;
  if (typeof base !== "object" || base === null || Array.isArray(base)) {
    // base is primitive or array, patch is object → replace base with patch
    return patch as unknown as T;
  }
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
    if (value === null) {
      delete result[key];
    } else if (
      value !== undefined &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof result[key] === "object" &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = applyPatch(result[key], value);
    } else if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as unknown as T;
}

/**
 * Compute a minimal patch (JSON Merge Patch) from base → edited.
 * The editor ships the full edited entity; the server stores only the
 * delta so (a) future base updates propagate for untouched fields,
 * (b) the override stays small, (c) revision diffs are readable.
 */
export function computeDelta(base: unknown, edited: unknown): unknown {
  if (base === edited) return undefined;
  if (edited === undefined) return undefined;
  if (edited === null) return base === null ? undefined : null;
  if (typeof base !== typeof edited) return edited;
  if (Array.isArray(base) !== Array.isArray(edited)) return edited;
  if (Array.isArray(edited)) {
    return JSON.stringify(base) === JSON.stringify(edited) ? undefined : edited;
  }
  if (typeof edited !== "object") return edited === base ? undefined : edited;

  // both objects
  const baseObj = (base as Record<string, unknown>) ?? {};
  const editedObj = edited as Record<string, unknown>;
  const delta: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(baseObj), ...Object.keys(editedObj)]);
  let hasChanges = false;
  for (const key of keys) {
    const b = baseObj[key];
    const e = editedObj[key];
    if (!(key in editedObj)) {
      if (key in baseObj) {
        delta[key] = null;
        hasChanges = true;
      }
    } else {
      const d = computeDelta(b, e);
      if (d !== undefined) {
        delta[key] = d;
        hasChanges = true;
      }
    }
  }
  return hasChanges ? delta : undefined;
}

export type OverrideListItem = {
  entityType: EntityType;
  slug: string;
  updatedAt: number;
  updatedBy?: string;
};

export async function listOverrides(): Promise<OverrideListItem[]> {
  const redis = getRedis();
  if (!redis) return [];
  const keys: string[] = [];
  let cursor: string | number = 0;
  do {
    const res = (await redis.scan(cursor, {
      match: "override:*",
      count: 200,
    })) as [string | number, string[]];
    cursor = res[0];
    keys.push(...res[1]);
  } while (String(cursor) !== "0");

  const items: OverrideListItem[] = [];
  for (const key of keys) {
    const m = key.match(/^override:([^:]+):(.+)$/);
    if (!m) continue;
    const record = parseRecord((await redis.get(key)) as unknown);
    if (!record) continue;
    items.push({
      entityType: m[1] as EntityType,
      slug: m[2],
      updatedAt: record.updatedAt,
      updatedBy: record.updatedBy,
    });
  }
  items.sort((a, b) => b.updatedAt - a.updatedAt);
  return items;
}
