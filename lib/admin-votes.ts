import { getRedis, bestGeneralVoteKey, unitGeneralVoteKey } from "./redis";
import type { Game } from "./types";
import {
  getAllEliteUnits as getAllEliteUnitsWc4,
  getEliteUnit as getEliteUnitWc4,
  getAllGenerals as getAllGeneralsWc4,
} from "./units";
import {
  getAllEliteUnits as getAllEliteUnitsGcr,
  getEliteUnit as getEliteUnitGcr,
  getAllGenerals as getAllGeneralsGcr,
} from "./gcr";
import {
  getAllEliteUnits as getAllEliteUnitsEw6,
  getEliteUnit as getEliteUnitEw6,
  getAllGenerals as getAllGeneralsEw6,
} from "./ew6";
import { isNonVotableUnit } from "./unit-general-vote";
import type { GeneralData, UnitData } from "./types";

function getAllEliteUnitsForGame(game: Game): UnitData[] {
  if (game === "wc4") return getAllEliteUnitsWc4();
  if (game === "gcr") return getAllEliteUnitsGcr();
  return getAllEliteUnitsEw6();
}

function getEliteUnitForGame(game: Game, slug: string): UnitData | null {
  if (game === "wc4") return getEliteUnitWc4(slug);
  if (game === "gcr") return getEliteUnitGcr(slug);
  return getEliteUnitEw6(slug);
}

function getAllGeneralsForGame(game: Game): GeneralData[] {
  if (game === "wc4") return getAllGeneralsWc4();
  if (game === "gcr") return getAllGeneralsGcr();
  return getAllGeneralsEw6();
}

export async function getBestGeneralTally(game: Game): Promise<{
  total: number;
  entries: Array<{ slug: string; votes: number }>;
  configured: boolean;
}> {
  const redis = getRedis();
  if (!redis) return { total: 0, entries: [], configured: false };
  const raw = (await redis.hgetall(bestGeneralVoteKey(game))) as Record<string, unknown> | null;
  if (!raw) return { total: 0, entries: [], configured: true };
  let total = 0;
  const entries: Array<{ slug: string; votes: number }> = [];
  for (const [k, v] of Object.entries(raw)) {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) continue;
    if (k === "__total") total = n;
    else entries.push({ slug: k, votes: n });
  }
  entries.sort((a, b) => b.votes - a.votes);
  return { total, entries, configured: true };
}

export async function deleteBestGeneralSlug(game: Game, slug: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  const key = bestGeneralVoteKey(game);
  const prev = (await redis.hget(key, slug)) as string | number | null;
  const n = typeof prev === "number" ? prev : Number(prev);
  if (!Number.isFinite(n) || n <= 0) return 0;
  await redis.hdel(key, slug);
  await redis.hincrby(key, "__total", -n);
  return n;
}

export async function resetBestGeneral(game: Game): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(bestGeneralVoteKey(game));
}

/**
 * Per-general skill-slot admin helpers — stays WC4-only (matches
 * lib/redis.ts:voteKey which hardcodes `vote:wc4:gen:...`). Other
 * games don't have per-general skill voting yet.
 */
export async function listSkillVoteKeys(): Promise<
  Array<{ general: string; slot: number; total: number }>
> {
  const redis = getRedis();
  if (!redis) return [];
  let cursor: string | number = 0;
  const keys: string[] = [];
  do {
    const res = (await redis.scan(cursor, {
      match: "vote:wc4:gen:*:slot*",
      count: 200,
    })) as [string | number, string[]];
    cursor = res[0];
    keys.push(...res[1]);
  } while (String(cursor) !== "0");

  const parsed = keys.map((k) => {
    const m = k.match(/^vote:wc4:gen:([^:]+):slot(\d+)$/);
    if (!m) return null;
    return { key: k, general: m[1], slot: Number(m[2]) };
  }).filter((x): x is { key: string; general: string; slot: number } => x !== null);

  const totals = await Promise.all(
    parsed.map(async (p) => {
      const t = (await getRedis()!.hget(p.key, "__total")) as string | number | null;
      const n = typeof t === "number" ? t : Number(t);
      return { general: p.general, slot: p.slot, total: Number.isFinite(n) ? n : 0 };
    })
  );
  totals.sort((a, b) => b.total - a.total || a.general.localeCompare(b.general) || a.slot - b.slot);
  return totals;
}

export async function getSkillSlotTally(general: string, slot: number): Promise<{
  total: number;
  entries: Array<{ skill: string; votes: number }>;
}> {
  const redis = getRedis();
  if (!redis) return { total: 0, entries: [] };
  const raw = (await redis.hgetall(`vote:wc4:gen:${general}:slot${slot}`)) as Record<string, unknown> | null;
  if (!raw) return { total: 0, entries: [] };
  let total = 0;
  const entries: Array<{ skill: string; votes: number }> = [];
  for (const [k, v] of Object.entries(raw)) {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) continue;
    if (k === "__total") total = n;
    else entries.push({ skill: k, votes: n });
  }
  entries.sort((a, b) => b.votes - a.votes);
  return { total, entries };
}

export async function resetSkillSlot(general: string, slot: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(`vote:wc4:gen:${general}:slot${slot}`);
}

export async function deleteSkillFromSlot(general: string, slot: number, skill: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  const prev = (await redis.hget(`vote:wc4:gen:${general}:slot${slot}`, skill)) as string | number | null;
  const n = typeof prev === "number" ? prev : Number(prev);
  if (!Number.isFinite(n) || n <= 0) return 0;
  await redis.hdel(`vote:wc4:gen:${general}:slot${slot}`, skill);
  await redis.hincrby(`vote:wc4:gen:${general}:slot${slot}`, "__total", -n);
  return n;
}

/* ------------------------------------------------------------------
 * Per-elite-unit "best general" tally — replaces the old skill-vote
 * dashboard. For each elite unit (votable only), surfaces the
 * leading general, total votes cast, and the full distribution.
 * ------------------------------------------------------------------ */

export type UnitGeneralRow = {
  unitSlug: string;
  unitName: string;
  unitNameEn?: string;
  unitCategory: string;
  total: number;
  topGeneralSlug?: string;
  topGeneralName?: string;
  topGeneralNameEn?: string;
  topGeneralVotes?: number;
  topGeneralShare?: number; // 0-100
  entries: Array<{
    generalSlug: string;
    generalName: string;
    generalNameEn?: string;
    votes: number;
    share: number; // 0-100
  }>;
};

const TOTAL_FIELD = "__total";

/**
 * Returns one row per votable elite unit in `game`, sorted by total
 * votes (desc). Units with zero votes are still included so admins
 * can see coverage gaps at a glance.
 */
export async function getUnitGeneralTallies(game: Game): Promise<{
  rows: UnitGeneralRow[];
  configured: boolean;
  totalVotes: number;
}> {
  const allUnits = getAllEliteUnitsForGame(game).filter(
    (u) => !isNonVotableUnit(game, u.slug)
  );
  const generalsBySlug = new Map<string, GeneralData>();
  getAllGeneralsForGame(game).forEach((g) => generalsBySlug.set(g.slug, g));

  const rowByUnit = new Map<string, UnitGeneralRow>();
  for (const u of allUnits) {
    rowByUnit.set(u.slug, {
      unitSlug: u.slug,
      unitName: u.name,
      unitNameEn: u.nameEn,
      unitCategory: u.category,
      total: 0,
      entries: [],
    });
  }

  const redis = getRedis();
  if (!redis) {
    return {
      rows: Array.from(rowByUnit.values()),
      configured: false,
      totalVotes: 0,
    };
  }

  const prefix = `vote:${game}:unit-general:`;
  const keys: string[] = [];
  let cursor: string | number = 0;
  do {
    const res = (await redis.scan(cursor, {
      match: `${prefix}*`,
      count: 200,
    })) as [string | number, string[]];
    cursor = res[0];
    if (res[1]?.length) keys.push(...res[1]);
  } while (String(cursor) !== "0");

  if (keys.length === 0) {
    return {
      rows: Array.from(rowByUnit.values()),
      configured: true,
      totalVotes: 0,
    };
  }

  const pipeline = redis.pipeline();
  for (const k of keys) pipeline.hgetall(k);
  const hashes = (await pipeline.exec()) as Array<
    Record<string, unknown> | null
  >;

  let grandTotal = 0;
  keys.forEach((key, i) => {
    const h = hashes[i];
    if (!h) return;
    const unitSlug = key.replace(prefix, "");
    const row = rowByUnit.get(unitSlug);
    if (!row) return;

    let total = 0;
    const entries: Array<{ slug: string; votes: number }> = [];
    for (const [k, v] of Object.entries(h)) {
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n)) continue;
      if (k === TOTAL_FIELD) {
        total = n;
        continue;
      }
      entries.push({ slug: k, votes: n });
    }
    entries.sort((a, b) => b.votes - a.votes);

    row.total = total;
    grandTotal += total;
    row.entries = entries.map((e) => {
      const g = generalsBySlug.get(e.slug);
      return {
        generalSlug: e.slug,
        generalName: g?.name ?? e.slug,
        generalNameEn: g?.nameEn,
        votes: e.votes,
        share: total > 0 ? Math.round((e.votes / total) * 1000) / 10 : 0,
      };
    });
    if (row.entries.length > 0) {
      const top = row.entries[0];
      row.topGeneralSlug = top.generalSlug;
      row.topGeneralName = top.generalName;
      row.topGeneralNameEn = top.generalNameEn;
      row.topGeneralVotes = top.votes;
      row.topGeneralShare = top.share;
    }
  });

  const rows = Array.from(rowByUnit.values()).sort(
    (a, b) =>
      b.total - a.total ||
      (a.unitNameEn ?? a.unitName).localeCompare(b.unitNameEn ?? b.unitName)
  );

  return { rows, configured: true, totalVotes: grandTotal };
}

/** Detail tally for a single (game, unit). */
export async function getUnitGeneralTally(
  game: Game,
  unitSlug: string
): Promise<UnitGeneralRow | null> {
  const unit = getEliteUnitForGame(game, unitSlug);
  if (!unit || isNonVotableUnit(game, unitSlug)) return null;

  const generalsBySlug = new Map<string, GeneralData>();
  getAllGeneralsForGame(game).forEach((g) => generalsBySlug.set(g.slug, g));

  const row: UnitGeneralRow = {
    unitSlug,
    unitName: unit.name,
    unitNameEn: unit.nameEn,
    unitCategory: unit.category,
    total: 0,
    entries: [],
  };

  const redis = getRedis();
  if (!redis) return row;

  const raw = (await redis.hgetall(unitGeneralVoteKey(game, unitSlug))) as
    | Record<string, unknown>
    | null;
  if (!raw) return row;

  let total = 0;
  const entries: Array<{ slug: string; votes: number }> = [];
  for (const [k, v] of Object.entries(raw)) {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) continue;
    if (k === TOTAL_FIELD) {
      total = n;
      continue;
    }
    entries.push({ slug: k, votes: n });
  }
  entries.sort((a, b) => b.votes - a.votes);

  row.total = total;
  row.entries = entries.map((e) => {
    const g = generalsBySlug.get(e.slug);
    return {
      generalSlug: e.slug,
      generalName: g?.name ?? e.slug,
      generalNameEn: g?.nameEn,
      votes: e.votes,
      share: total > 0 ? Math.round((e.votes / total) * 1000) / 10 : 0,
    };
  });
  if (row.entries.length > 0) {
    const top = row.entries[0];
    row.topGeneralSlug = top.generalSlug;
    row.topGeneralName = top.generalName;
    row.topGeneralNameEn = top.generalNameEn;
    row.topGeneralVotes = top.votes;
    row.topGeneralShare = top.share;
  }
  return row;
}

/** Reset every vote for a single (game, unit). */
export async function resetUnitGeneral(
  game: Game,
  unitSlug: string
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(unitGeneralVoteKey(game, unitSlug));
}

/** Remove a single general from a unit's tally and decrement __total accordingly. */
export async function deleteGeneralFromUnit(
  game: Game,
  unitSlug: string,
  generalSlug: string
): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  const key = unitGeneralVoteKey(game, unitSlug);
  const prev = (await redis.hget(key, generalSlug)) as string | number | null;
  const n = typeof prev === "number" ? prev : Number(prev);
  if (!Number.isFinite(n) || n <= 0) return 0;
  await redis.hdel(key, generalSlug);
  await redis.hincrby(key, TOTAL_FIELD, -n);
  return n;
}
