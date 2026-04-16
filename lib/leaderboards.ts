/**
 * Server-side Redis aggregation for the community leaderboards page.
 *
 * Pulls from two vote buckets, parameterized by game:
 *   - `vote:<game>:best-general`           — single hash, one counter per general
 *   - `vote:<game>:unit-general:<slug>`    — one hash per elite unit
 *
 * Per-general skill-slot vote aggregation used to live here too
 * (`vote:wc4:gen:<slug>:slot<n>`) but the leaderboards page no longer
 * surfaces a skills tab; the underlying per-general skill votes remain
 * and are consumed directly by the general page, not aggregated here.
 *
 * Uses `SCAN` for the per-unit keys so we don't need to pre-register
 * them. Scans are cheap (~50 keys per game on a mature site),
 * server-side only (never hits the client), and wrapped in a single
 * pipeline per bucket.
 *
 * Returns plain JSON-safe rows so leaderboard server components can
 * render without any extra massaging. Everything is graceful when
 * Redis is unavailable: an empty ranking is returned and the page
 * shows the corresponding empty-state message.
 */

import { getRedis } from "./redis";
import {
  getAllGenerals as getAllGeneralsWc4,
  getEliteUnit as getEliteUnitWc4,
  getAllEliteUnits as getAllEliteUnitsWc4,
} from "./units";
import {
  getAllGenerals as getAllGeneralsGcr,
  getEliteUnit as getEliteUnitGcr,
  getAllEliteUnits as getAllEliteUnitsGcr,
} from "./gcr";
import {
  getAllGenerals as getAllGeneralsEw6,
  getEliteUnit as getEliteUnitEw6,
  getAllEliteUnits as getAllEliteUnitsEw6,
} from "./ew6";
import type { GeneralData, Game, UnitData } from "./types";

const TOTAL_FIELD = "__total";

/** Per-unit pairing threshold: editorial picks below, community picks at or above. */
export const UNITS_LEADERBOARD_THRESHOLD = 50;

function getAllGeneralsForGame(game: Game): GeneralData[] {
  if (game === "wc4") return getAllGeneralsWc4();
  if (game === "gcr") return getAllGeneralsGcr();
  return getAllGeneralsEw6();
}

function getEliteUnitForGame(game: Game, slug: string): UnitData | null {
  if (game === "wc4") return getEliteUnitWc4(slug);
  if (game === "gcr") return getEliteUnitGcr(slug);
  return getEliteUnitEw6(slug);
}

function getAllEliteUnitsForGame(game: Game): UnitData[] {
  if (game === "wc4") return getAllEliteUnitsWc4();
  if (game === "gcr") return getAllEliteUnitsGcr();
  return getAllEliteUnitsEw6();
}

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

export async function loadGeneralsLeaderboard(game: Game): Promise<GeneralsRanking> {
  const redis = getRedis();
  if (!redis) return { rows: [], total: 0 };
  try {
    const raw = (await redis.hgetall(`vote:${game}:best-general`)) as
      | Record<string, unknown>
      | null;
    if (!raw) return { rows: [], total: 0 };

    const generalsBySlug = new Map<string, GeneralData>();
    getAllGeneralsForGame(game).forEach((g) => generalsBySlug.set(g.slug, g));

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

// ─── PER-UNIT BEST-GENERAL (SCAN across unit hashes) ────────────────

export type UnitsRanking = {
  rows: Array<{
    unitSlug: string;
    unitName: string;
    unitNameEn?: string;
    unitCategory: string;
    unitCountry: string | null;
    totalVotes: number;
    reachedThreshold: boolean;
    topGeneralSlug?: string;
    topGeneralName?: string;
    topGeneralNameEn?: string;
    topGeneralVotes?: number;
    topGeneralShare?: number;
    top2GeneralSlug?: string;
    top2GeneralName?: string;
    top2GeneralNameEn?: string;
    top2GeneralVotes?: number;
    top3GeneralSlug?: string;
    top3GeneralName?: string;
    top3GeneralNameEn?: string;
    top3GeneralVotes?: number;
  }>;
  thresholdReached: number;  // count of units with votes >= threshold
  threshold: number;
};

export async function loadUnitsLeaderboard(
  game: Game,
  threshold: number = UNITS_LEADERBOARD_THRESHOLD
): Promise<UnitsRanking> {
  const allUnits = getAllEliteUnitsForGame(game);
  // Start with every unit as a zero-vote row. We overwrite entries as we
  // scan Redis; units never scanned (zero votes ever) stay with the
  // default zero-vote row so the UI can always show an editorial pick.
  const rowsByUnit = new Map<string, UnitsRanking["rows"][number]>();
  for (const u of allUnits) {
    rowsByUnit.set(u.slug, {
      unitSlug: u.slug,
      unitName: u.name,
      unitNameEn: u.nameEn,
      unitCategory: u.category,
      unitCountry: u.country ?? null,
      totalVotes: 0,
      reachedThreshold: false,
    });
  }

  const redis = getRedis();
  if (!redis) {
    return {
      rows: Array.from(rowsByUnit.values()),
      thresholdReached: 0,
      threshold,
    };
  }

  try {
    const keys: string[] = [];
    const prefix = `vote:${game}:unit-general:`;
    let cursor: string | number = 0;
    do {
      const res = (await redis.scan(cursor, {
        match: `${prefix}*`,
        count: 200,
      })) as [string | number, string[]];
      cursor = res[0];
      if (res[1]?.length) keys.push(...res[1]);
    } while (cursor !== 0 && cursor !== "0");

    if (keys.length === 0) {
      return {
        rows: Array.from(rowsByUnit.values()),
        thresholdReached: 0,
        threshold,
      };
    }

    const pipeline = redis.pipeline();
    for (const k of keys) pipeline.hgetall(k);
    const hashes = (await pipeline.exec()) as Array<
      Record<string, unknown> | null
    >;

    const generalsBySlug = new Map<string, GeneralData>();
    getAllGeneralsForGame(game).forEach((g) => generalsBySlug.set(g.slug, g));

    let reached = 0;
    keys.forEach((key, i) => {
      const h = hashes[i];
      if (!h) return;
      const unitSlug = key.replace(prefix, "");
      const row = rowsByUnit.get(unitSlug);
      if (!row) return; // unknown unit — skip (stale Redis key)
      const unit = getEliteUnitForGame(game, unitSlug);
      if (!unit) return;

      let totalVotes = 0;
      const counts: Array<{ slug: string; votes: number }> = [];
      for (const [k, v] of Object.entries(h)) {
        const n = typeof v === "number" ? v : Number(v);
        if (!Number.isFinite(n)) continue;
        if (k === TOTAL_FIELD) {
          totalVotes = n;
          continue;
        }
        counts.push({ slug: k, votes: n });
      }
      counts.sort((a, b) => b.votes - a.votes);

      row.totalVotes = totalVotes;
      row.reachedThreshold = totalVotes >= threshold;
      if (row.reachedThreshold) reached += 1;

      const assignSlot = (
        idx: 0 | 1 | 2,
        entry: { slug: string; votes: number } | undefined
      ) => {
        if (!entry) return;
        const g = generalsBySlug.get(entry.slug);
        if (!g) return;
        const share =
          totalVotes > 0 ? Math.round((entry.votes / totalVotes) * 1000) / 10 : 0;
        if (idx === 0) {
          row.topGeneralSlug = entry.slug;
          row.topGeneralName = g.name;
          row.topGeneralNameEn = g.nameEn;
          row.topGeneralVotes = entry.votes;
          row.topGeneralShare = share;
        } else if (idx === 1) {
          row.top2GeneralSlug = entry.slug;
          row.top2GeneralName = g.name;
          row.top2GeneralNameEn = g.nameEn;
          row.top2GeneralVotes = entry.votes;
        } else {
          row.top3GeneralSlug = entry.slug;
          row.top3GeneralName = g.name;
          row.top3GeneralNameEn = g.nameEn;
          row.top3GeneralVotes = entry.votes;
        }
      };

      assignSlot(0, counts[0]);
      assignSlot(1, counts[1]);
      assignSlot(2, counts[2]);
    });

    return {
      rows: Array.from(rowsByUnit.values()),
      thresholdReached: reached,
      threshold,
    };
  } catch {
    return {
      rows: Array.from(rowsByUnit.values()),
      thresholdReached: 0,
      threshold,
    };
  }
}
