import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getReference, getReferences, referencePath, releaseStatus } from "../lib/wc4-coverage";
import { getAllGenerals, getAllLearnableSkills, getEliteUnit, getSkillIndex } from "../lib/units";
import { getAllGuides } from "../lib/guides";
import { getAllUpdates } from "../lib/updates";
import { buildPremiumTrainingView } from "../lib/general-trained";

const root = process.cwd();
const read = (p: string) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const locales = ["fr", "en", "de"] as const;
const officialHosts = new Set(["apps.apple.com", "itunes.apple.com", "play.google.com", "note.com"]);
const updates = getAllUpdates();
for (const [platform, status] of Object.entries(releaseStatus.platforms)) {
  assert(updates.some(u => u.platform === platform && u.version === status.version && u.date === status.releasedAt), `Missing ${platform} baseline release`);
}
assert(updates.some(u => u.slug === releaseStatus.latestUpdateSlug), "Missing current release link");
assert(updates.every(u => !u.tags?.includes("latest")), "Latest release must come from the centralized baseline");
for (const u of updates) {
  assert(u.lastVerifiedAt && officialHosts.has(new URL(u.sourceUrl!).hostname), `Missing release evidence: ${u.slug}`);
  for (const l of locales) assert(u.title[l] && u.summary[l] && u.body[l], `Missing ${l} release copy: ${u.slug}`);
}

const referenceUrls = new Set<string>();
for (const kind of ["general", "unit", "formation", "training", "skill"] as const) {
  for (const entry of getReferences(kind)) {
    const key = `${kind}:${entry.slug}`;
    assert(!referenceUrls.has(key), `Duplicate reference: ${key}`);
    referenceUrls.add(key);
    assert(officialHosts.has(new URL(entry.evidence.sourceUrl).hostname), `Missing primary source: ${key}`);
    assert(entry.evidence.lastVerifiedAt >= entry.evidence.sourcePublishedAt, `Impossible evidence dates: ${key}`);
    for (const l of locales) assert(entry.name[l] && entry.summary[l] && entry.pending[l], `Incomplete ${l} reference: ${key}`);
    // References deliberately cannot silently acquire invented numeric stats or rankings.
    for (const forbidden of ["stats", "tier", "rank", "cost"]) assert(!(forbidden in entry), `Unverified field ${forbidden}: ${key}`);
    if (kind === "unit") {
      const detailed = getEliteUnit(entry.slug);
      assert(!detailed || detailed.preliminary, `Reference shadows a detailed unit: ${entry.slug}`);
    }
  }
}

const generals = getAllGenerals();
const canonical = read("data/wc4/trained-generals-canonical.json");
const trainingSlugs: string[] = [...canonical.f2pTrainable, ...canonical.goldIapTrainable].map(g => g.slug);
assert.equal(new Set(trainingSlugs).size, trainingSlugs.length, "Duplicate training identity");
assert.deepEqual(new Set(trainingSlugs), new Set(generals.filter(g => g.hasTrainingPath).map(g => g.slug)), "Training registry drift");
for (const g of generals.filter(g => g.trainingDetailsPending)) {
  assert(getReference("training", g.slug), `Missing pending training page: ${g.slug}`);
  assert.equal(buildPremiumTrainingView(g), null, `Unverified training projected as known: ${g.slug}`);
}
assert(!getAllLearnableSkills().some(s => s.id === "modernized-air-force"), "Unknown skill compatibility leaked into vote candidates");
assert.equal(read("data/wc4/skills/modernized-air-force.json").acquisitionSource, "challenge-pass");
const skillIndex = getSkillIndex();
const pendingSkill = skillIndex.skills.find(s => s.slug === "modernized-air-force");
assert(pendingSkill?.detailsPending && pendingSkill.series === -1, "Unverified skill must show its pending status in the catalog");

const guides = getAllGuides();
const guideSlugs = new Set(guides.map(g => g.slug));
assert(guideSlugs.has(releaseStatus.coverageGuide));
for (const g of guides.filter(g => g.evidence)) {
  assert.equal(g.lastReviewed, g.evidence!.lastVerifiedAt, `Guide review date drift: ${g.slug}`);
  assert(g.sources?.length, `Missing guide sources: ${g.slug}`);
  for (const slug of g.related) assert(guideSlugs.has(slug) && slug !== g.slug, `Broken or self-related guide: ${g.slug}/${slug}`);
  for (const l of locales) assert(g.title[l] && g.description[l] && g.body[l], `Missing ${l} guide: ${g.slug}`);
}

const search = read("public/search-index.json").items as Array<{ path: { en: string; fr: string } }>;
assert.equal(new Set(search.map(i => i.path.en)).size, search.length, "Duplicate search URLs");
for (const kind of ["general", "unit", "formation", "training", "skill"] as const) {
  for (const entry of getReferences(kind)) assert(search.some(i => i.path.en === referencePath(entry, "en") && i.path.fr === referencePath(entry, "fr")), `Reference missing from search: ${kind}/${entry.slug}`);
}
console.log(`WC4 content integrity passed: ${updates.length} releases, ${referenceUrls.size} references, ${trainingSlugs.length} training identities. This validates consistency, not in-game numerical accuracy.`);
