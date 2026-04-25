import { getRedis } from "./redis";

export type AdminStats = {
  tickets: { total: number; open: number; resolved: number };
  ticketsByKind: { bug: number; verification: number };
  votes: { bestGeneralTotal: number; skillKeys: number };
  redisConfigured: boolean;
};

async function countByMember(redis: ReturnType<typeof getRedis>, key: string): Promise<number> {
  if (!redis) return 0;
  const n = await redis.zcard(key);
  return typeof n === "number" ? n : 0;
}

async function countSkillKeys(redis: ReturnType<typeof getRedis>): Promise<number> {
  if (!redis) return 0;
  // Counts all per-unit vote hashes across games (`vote:*:unit-general:*`),
  // i.e. how many elite units have at least one community vote. The
  // function name is kept for back-compat with the dashboard tile and
  // type signature; pre-redesign it counted `vote:wc4:gen:*:slot*`.
  let cursor: string | number = 0;
  let total = 0;
  do {
    const res = (await redis.scan(cursor, {
      match: "vote:*:unit-general:*",
      count: 200,
    })) as [string | number, string[]];
    cursor = res[0];
    total += res[1].length;
  } while (String(cursor) !== "0");
  return total;
}

export async function getAdminStats(): Promise<AdminStats> {
  const redis = getRedis();
  if (!redis) {
    return {
      tickets: { total: 0, open: 0, resolved: 0 },
      ticketsByKind: { bug: 0, verification: 0 },
      votes: { bestGeneralTotal: 0, skillKeys: 0 },
      redisConfigured: false,
    };
  }

  const [ticketCounts, kindCounts, bestGen, skillKeys] = await Promise.all([
    redis.hgetall("bug-reports:counts") as Promise<Record<string, unknown> | null>,
    redis.hgetall("bug-reports:kinds") as Promise<Record<string, unknown> | null>,
    redis.hget("vote:wc4:best-general", "__total") as Promise<string | number | null>,
    countSkillKeys(redis),
  ]);

  const toNum = (v: unknown) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // Prefer fast-counter fields, fall back to index length for total.
  const total = toNum(ticketCounts?.total) || (await countByMember(redis, "bug-reports:index"));
  const open = toNum(ticketCounts?.open);
  const resolved = Math.max(0, total - open);
  const bug = toNum(kindCounts?.bug);
  const verification = toNum(kindCounts?.verification);

  return {
    tickets: { total, open, resolved },
    ticketsByKind: { bug, verification },
    votes: { bestGeneralTotal: toNum(bestGen), skillKeys },
    redisConfigured: true,
  };
}
