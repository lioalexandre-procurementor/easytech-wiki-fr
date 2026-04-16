import {
  getEditorialPick,
  pickPlaceholderSlugs,
  BEST_GENERAL_PLACEHOLDER,
} from "../lib/editorial-picks";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("ok — " + msg);
}

// Scaffolding is empty for unit picks; full populate comes in Task 3.
assert(getEditorialPick("wc4", "any-unit") === null, "empty wc4 picks return null");
assert(getEditorialPick("gcr", "any-unit") === null, "empty gcr picks return null");

// pickPlaceholderSlugs dedup
const excluded = new Set(["manstein", "guderian"]);
const picked = pickPlaceholderSlugs("wc4", excluded, 2);
assert(picked.length === 2, "picks 2 slugs");
assert(!picked.includes("manstein"), "excludes manstein");
assert(!picked.includes("guderian"), "excludes guderian");
assert(picked[0] === "rokossovsky", "first non-excluded is rokossovsky");

// Full list = 5 slugs pre-Task-3 (will become 10 after Task 3)
assert(BEST_GENERAL_PLACEHOLDER.wc4.length >= 5, "wc4 list has at least 5");

// Count cap
const allPicked = pickPlaceholderSlugs("wc4", new Set(), 10);
assert(allPicked.length <= BEST_GENERAL_PLACEHOLDER.wc4.length, "count cap works");

console.log("\nEditorial picks scaffolding verified.");
