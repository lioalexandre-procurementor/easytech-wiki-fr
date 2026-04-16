import { getRedis } from "./redis";

export async function getBestGeneralTally(): Promise<{
  total: number;
  entries: Array<{ slug: string; votes: number }>;
  configured: boolean;
}> {
  const redis = getRedis();
  if (!redis) return { total: 0, entries: [], configured: false };
  const raw = (await redis.hgetall("vote:wc4:best-general")) as Record<string, unknown> | null;
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

export async function deleteBestGeneralSlug(slug: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  const prev = (await redis.hget("vote:wc4:best-general", slug)) as string | number | null;
  const n = typeof prev === "number" ? prev : Number(prev);
  if (!Number.isFinite(n) || n <= 0) return 0;
  await redis.hdel("vote:wc4:best-general", slug);
  await redis.hincrby("vote:wc4:best-general", "__total", -n);
  return n;
}

export async function resetBestGeneral(): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del("vote:wc4:best-general");
}

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
