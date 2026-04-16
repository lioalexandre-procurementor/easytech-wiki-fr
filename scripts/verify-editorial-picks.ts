import {
  getEditorialPick,
  pickPlaceholderSlugs,
  BEST_GENERAL_PLACEHOLDER,
  UNIT_EDITORIAL_PICKS,
} from "../lib/editorial-picks";
import { getAllEliteUnits as getAllEliteUnitsWc4, getGeneral as getGeneralWc4 } from "../lib/units";
import { getAllEliteUnits as getAllEliteUnitsGcr, getGeneral as getGeneralGcr } from "../lib/gcr";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("ok — " + msg);
}

// 1. Both placeholder lists have exactly 10 entries.
assert(BEST_GENERAL_PLACEHOLDER.wc4.length === 10, "wc4 placeholder list has 10 entries");
assert(BEST_GENERAL_PLACEHOLDER.gcr.length === 10, "gcr placeholder list has 10 entries");

// 2. Every placeholder slug resolves to a real general in its game.
for (const slug of BEST_GENERAL_PLACEHOLDER.wc4) {
  assert(getGeneralWc4(slug) !== null, `wc4 placeholder ${slug} is a real general`);
}
for (const slug of BEST_GENERAL_PLACEHOLDER.gcr) {
  assert(getGeneralGcr(slug) !== null, `gcr placeholder ${slug} is a real general`);
}

// 3. Every WC4 elite unit has an editorial pick AND its primary (and
//    optional secondary) slot resolves to a real general.
const wc4Units = getAllEliteUnitsWc4();
const wc4Picks = UNIT_EDITORIAL_PICKS.wc4;
const wc4Missing: string[] = [];
for (const unit of wc4Units) {
  const pick = wc4Picks[unit.slug];
  if (!pick || typeof pick.primary !== "string") {
    wc4Missing.push(unit.slug);
    continue;
  }
  assert(
    getGeneralWc4(pick.primary) !== null,
    `wc4 primary pick for ${unit.slug} -> ${pick.primary} is a real general`
  );
  if (pick.secondary) {
    assert(
      getGeneralWc4(pick.secondary) !== null,
      `wc4 secondary pick for ${unit.slug} -> ${pick.secondary} is a real general`
    );
    assert(
      pick.secondary !== pick.primary,
      `wc4 pick for ${unit.slug} — primary/secondary differ`
    );
  }
}
assert(wc4Missing.length === 0, `every WC4 unit has a pick (missing: ${wc4Missing.join(", ") || "none"})`);

// 4. Every GCR elite unit has an editorial pick AND its primary (and
//    optional secondary) slot resolves to a real general.
const gcrUnits = getAllEliteUnitsGcr();
const gcrPicks = UNIT_EDITORIAL_PICKS.gcr;
const gcrMissing: string[] = [];
for (const unit of gcrUnits) {
  const pick = gcrPicks[unit.slug];
  if (!pick || typeof pick.primary !== "string") {
    gcrMissing.push(unit.slug);
    continue;
  }
  assert(
    getGeneralGcr(pick.primary) !== null,
    `gcr primary pick for ${unit.slug} -> ${pick.primary} is a real general`
  );
  if (pick.secondary) {
    assert(
      getGeneralGcr(pick.secondary) !== null,
      `gcr secondary pick for ${unit.slug} -> ${pick.secondary} is a real general`
    );
    assert(
      pick.secondary !== pick.primary,
      `gcr pick for ${unit.slug} — primary/secondary differ`
    );
  }
}
assert(gcrMissing.length === 0, `every GCR unit has a pick (missing: ${gcrMissing.join(", ") || "none"})`);

// 5. Dedup behavior: pickPlaceholderSlugs excludes already-ranked slugs.
const picked = pickPlaceholderSlugs("wc4", new Set(["manstein"]), 3);
assert(!picked.includes("manstein"), "pickPlaceholderSlugs dedup excludes manstein");
assert(picked.length === 3, "pickPlaceholderSlugs returns requested count");

// 6. getEditorialPick returns null for unknown slugs.
assert(getEditorialPick("wc4", "no-such-unit") === null, "getEditorialPick returns null for unknown unit");

console.log(
  `\nEditorial picks verified: ${wc4Units.length} WC4 units + ${gcrUnits.length} GCR units mapped.`
);
