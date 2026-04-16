/**
 * Server-side Redis aggregation for the community leaderboards page.
 *
 * Pulls from three vote buckets, all using Upstash Redis:
 *   - `vote:wc4:best-general`           — single hash, one counter per general
 *   - `vote:wc4:gen:<slug>:slot<n>`     — per-general-per-slot hash of skill IDs
 *   - `vote:wc4:unit-general:<slug>`    — one hash per elite unit
 *
 * Uses `SCAN` for the per-unit and per-slot keys so we don't need to
 * pre-register them. Scans are cheap (~100 keys on a mature site),
 * server-side only (never hits the client), and wrapped in a single
 * pipeline per bucket.
 *
 * Returns plain JSON-safe rows so leaderboard server components can
 * render without any extra massaging. Everything is graceful when
 * Redis is unavailable: an empty ranking is returned and the page
 * shows the corresponding empty-state message.
 */

import { getRedis } from "./redis";
import { getAllGenerals, getSkill } from "./units";
import { getEliteUnit } from "./units";
import type { GeneralData } from "./types";

const TOTAL_FIELD = "__total";

// ─── GENERAL BEST-GENERAL VOTE (single hash) ────────────────────────

export type GeneralsRanking = {
  rows: Array<{
    slug: string;
    name: string;       // FR canonical (data-baked)
    nameEn?: string;
    rank: string | null;
    country: string | null;
    votes: number;
    share: number;      // percent, rounded to 1 decimal
  }>;
  total: number;
};

export async function loadGeneralsLeaderboard(): Promise<GeneralsRanking> {
  const redis = getRedis();
  if (!redis) return { rows: [], total: 0 };
  try {
    const raw = (await redis.hgetall("vote:wc4:best-general")) as
      | Record<string, unknown>
      | null;
    if (!raw) return { rows: [], total: 0 };

    const generalsBySlug = new Map<string, GeneralData>();
    getAllGenerals().forEach((g) => generalsBySlug.set(g.slug, g));

    let total = 0;
    const counts: Array<{ slug: string; votes: number }> = [];
    for (const [k, v] of Object.entries(raw)) {
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n)) continue;
      if (k === TOTAL_FIELD) {
        total = n;
      } else {
        counts.push({ slug: k, votes: n });
      }
    }

    const rows = counts
      .filter((c) => generalsBySlug.has(c.slug))
      .map((c) => {
        const g = generalsBySlug.get(c.slug)!;
        return {
          slug: g.slug,
          name: g.name,
          nameEn: g.nameEn,
          rank: g.rank ?? null,
          country: g.country ?? null,
          votes: c.votes,
          share: total > 0 ? Math.round((c.votes / total) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.votes - a.votes);

    return { rows, total };
  } catch {
    return { rows: [], total: 0 };
  }
}

// ─── SKILLS AGGREGATE (SCAN across per-slot hashes) ────────────────

export type SkillsRanking = {
  rows: Array<{
    id: string;            // skill slug from learnable-skills catalog
    name: string;          // display name
    nameFr?: string;
    votes: number;         // aggregated across all generals + slots
    share: number;
    /** Generals/slots where this skill is in the top-voted pick. */
    appearsIn: number;     // distinct (general, slot) pairs where votes > 0
  }>;
  total: number;
};

const SKILL_KEY_PATTERN = "vote:wc4:gen:*:slot*";

export async function loadSkillsLeaderboard(): Promise<SkillsRanking> {
  const redis = getRedis();
  if (!redis) return { rows: [], total: 0 };
  try {
    // SCAN the keyspace for all per-slot vote hashes.
    const keys: string[] = [];
    let cursor: string | number = 0;
    do {
      const res = (await redis.scan(cursor, {
        match: SKILL_KEY_PATTERN,
        count: 200,
      })) as [string | number, string[]];
      cursor = res[0];
      if (res[1]?.length) keys.push(...res[1]);
    } while (cursor !== 0 && cursor !== "0");

    if (keys.length === 0) return { rows: [], total: 0 };

    // Pipeline: read every hash in one round trip.
    const pipeline = redis.pipeline();
    for (const k of keys) pipeline.hgetall(k);
    const hashes = (await pipeline.exec()) as Array<
      Record<string, unknown> | null
    >;

    const skillTotals = new Map<string, { votes: number; appearances: number }>();
    let grandTotal = 0;
    hashes.forEach((h) => {
      if (!h) return;
      for (const [k, v] of Object.entries(h)) {
        const n = typeof v === "number" ? v : Number(v);
        if (!Number.isFinite(n)) continue;
        if (k === TOTAL_FIELD) {
          grandTotal += n;
          continue;
        }
        const entry = skillTotals.get(k) ?? { votes: 0, appearances: 0 };
        entry.votes += n;
        entry.appearances += 1;
        skillTotals.set(k, entry);
      }
    });

    const rows = Array.from(skillTotals.entries())
      .map(([id, { votes, appearances }]) => {
        const catalog = getSkill(id);
        return {
          id,
          name: catalog?.name ?? id,
          nameFr: catalog?.nameFr,
          votes,
          share: grandTotal > 0 ? Math.round((votes / grandTotal) * 1000) / 10 : 0,
          appearsIn: appearances,
        };
      })
      .sort((a, b) => b.votes - a.votes);

    return { rows, total: grandTotal };
  } catch {
    return { rows: [], total: 0 };
  }
}

// ─── PER-UNIT BEST-GENERAL (SCAN across unit hashes) ────────────────

export type UnitsRanking = {
  rows: Array<{
    unitSlug: string;
    unitName: string;
    unitNameEn?: string;
    unitCategory: string;
    unitCountry: string | null;
    totalVotes: number;
    topGeneralSlug: string | null;
    topGeneralName: string | null;
    topGeneralNameEn: string | null;
    topGeneralVotes: number;
    topGeneralShare: number;
  }>;
  thresholdReached: number;  // count of units with votes >= threshold
  threshold: number;
};

export async function loadUnitsLeaderboard(
  threshold = 100
): Promise<UnitsRanking> {
  const redis = getRedis();
  if (!redis) return { rows: [], thresholdReached: 0, threshold };
  try {
    const keys: string[] = [];
    let cursor: string | number = 0;
    do {
      const res = (await redis.scan(cursor, {
        match: "vote:wc4:unit-general:*",
        count: 200,
      })) as [string | number, string[]];
      cursor = res[0];
      if (res[1]?.length) keys.push(...res[1]);
    } while (cursor !== 0 && cursor !== "0");

    if (keys.length === 0) {
      return { rows: [], thresholdReached: 0, threshold };
    }

    const pipeline = redis.pipeline();
    for (const k of keys) pipeline.hgetall(k);
    const hashes = (await pipeline.exec()) as Array<
      Record<string, unknown> | null
    >;

    const generalsBySlug = new Map<string, GeneralData>();
    getAllGenerals().forEach((g) => generalsBySlug.set(g.slug, g));

    const rows: UnitsRanking["rows"] = [];
    let reached = 0;
    keys.forEach((key, i) => {
      const h = hashes[i];
      if (!h) return;
      const unitSlug = key.replace("vote:wc4:unit-general:", "");
      const unit = getEliteUnit(unitSlug);
      if (!unit) return;

      let totalVotes = 0;
      let topSlug: string | null = null;
      let topVotes = 0;
      for (const [k, v] of Object.entries(h)) {
        const n = typeof v === "number" ? v : Number(v);
        if (!Number.isFinite(n)) continue;
        if (k === TOTAL_FIELD) {
          totalVotes = n;
          continue;
        }
        if (n > topVotes) {
          topVotes = n;
          topSlug = k;
        }
      }

      if (totalVotes < threshold) return;

      reached += 1;
      const topGen = topSlug ? generalsBySlug.get(topSlug) : null;
      rows.push({
        unitSlug: unit.slug,
        unitName: unit.name,
        unitNameEn: unit.nameEn,
        unitCategory: unit.category,
        unitCountry: unit.country ?? null,
        totalVotes,
        topGeneralSlug: topSlug,
        topGeneralName: topGen?.name ?? topSlug,
        topGeneralNameEn: topGen?.nameEn ?? null,
        topGeneralVotes: topVotes,
        topGeneralShare:
          totalVotes > 0 ? Math.round((topVotes / totalVotes) * 1000) / 10 : 0,
      });
    });

    // Order by confidence: total votes descending, tie-break by share of top pick.
    rows.sort((a, b) => {
      if (b.totalVotes !== a.totalVotes) return b.totalVotes - a.totalVotes;
      return b.topGeneralShare - a.topGeneralShare;
    });

    return { rows, thresholdReached: reached, threshold };
  } catch {
    return { rows: [], thresholdReached: 0, threshold };
  }
}

export const UNITS_LEADERBOARD_THRESHOLD = 100;
