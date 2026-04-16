import { getRedis } from "./redis";

export type TicketSource = "user" | "system";
export type TicketKind = "bug" | "verification";
export type TicketStatus = "open" | "resolved";

export type Ticket = {
  id: string;
  createdAt: number;
  source: TicketSource;
  kind: TicketKind;
  status: TicketStatus;
  title: string;
  description: string;
  pageUrl: string;
  pageTitle?: string;
  email?: string;
  locale?: string;
  userAgent?: string;
  ip?: string;
  /** Optional wiki-entity context for verification tickets. */
  context?: string;
  /** Optional stable slug for verification tickets — lets seeding be idempotent. */
  seedSlug?: string;
  resolvedAt?: number;
};

const INDEX = "bug-reports:index";
const COUNTS = "bug-reports:counts"; // { total, open }
const KINDS = "bug-reports:kinds"; // { bug, verification }
const SEED_SET = "bug-reports:seed-slugs";

function makeId(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `${t}-${r}`;
}

function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalize(raw: Record<string, unknown> | null, id: string): Ticket | null {
  if (!raw) return null;
  const source: TicketSource =
    raw.source === "system" ? "system" : "user";
  const kind: TicketKind =
    raw.kind === "verification" ? "verification" : "bug";
  const status: TicketStatus =
    raw.status === "resolved" ? "resolved" : "open";
  return {
    id: (raw.id as string) || id,
    createdAt: toNum(raw.createdAt),
    source,
    kind,
    status,
    title: typeof raw.title === "string" ? raw.title : "",
    description: typeof raw.description === "string" ? raw.description : "",
    pageUrl: typeof raw.pageUrl === "string" ? raw.pageUrl : "",
    pageTitle: typeof raw.pageTitle === "string" ? raw.pageTitle : undefined,
    email: typeof raw.email === "string" && raw.email ? raw.email : undefined,
    locale: typeof raw.locale === "string" && raw.locale ? raw.locale : undefined,
    userAgent: typeof raw.userAgent === "string" ? raw.userAgent : undefined,
    ip: typeof raw.ip === "string" ? raw.ip : undefined,
    context: typeof raw.context === "string" && raw.context ? raw.context : undefined,
    seedSlug: typeof raw.seedSlug === "string" && raw.seedSlug ? raw.seedSlug : undefined,
    resolvedAt: raw.resolvedAt ? toNum(raw.resolvedAt) : undefined,
  };
}

export async function listTickets(opts: {
  status?: TicketStatus;
  kind?: TicketKind;
  source?: TicketSource;
  offset?: number;
  limit?: number;
} = {}): Promise<{ tickets: Ticket[]; totalIndex: number }> {
  const redis = getRedis();
  if (!redis) return { tickets: [], totalIndex: 0 };

  const offset = opts.offset ?? 0;
  const limit = opts.limit ?? 50;

  // Pull page from index (newest first).
  const ids = (await redis.zrange(INDEX, -1 - offset, -1 - offset - limit + 1, {
    rev: false,
  })) as string[];
  // zrange with rev: true would be clearer; Upstash REST supports rev.
  const recent = (await redis.zrange(INDEX, offset, offset + limit - 1, {
    rev: true,
  })) as string[];
  // Use the rev: true result.
  void ids;

  const records = await Promise.all(
    recent.map(async (id) => {
      const raw = (await redis.hgetall(`bug-report:${id}`)) as Record<string, unknown> | null;
      return normalize(raw, id);
    })
  );

  let tickets = records.filter((t): t is Ticket => t !== null);
  if (opts.status) tickets = tickets.filter((t) => t.status === opts.status);
  if (opts.kind) tickets = tickets.filter((t) => t.kind === opts.kind);
  if (opts.source) tickets = tickets.filter((t) => t.source === opts.source);

  const totalIndex = (await redis.zcard(INDEX)) as number;
  return { tickets, totalIndex };
}

export async function getTicket(id: string): Promise<Ticket | null> {
  const redis = getRedis();
  if (!redis) return null;
  const raw = (await redis.hgetall(`bug-report:${id}`)) as Record<string, unknown> | null;
  return normalize(raw, id);
}

export async function createVerificationTicket(input: {
  seedSlug: string;
  title: string;
  description: string;
  pageUrl: string;
  context?: string;
  locale?: string;
}): Promise<{ ticket: Ticket; created: boolean }> {
  const redis = getRedis();
  if (!redis) throw new Error("redis not configured");

  // Idempotency: if this seedSlug has already been synced, return the
  // existing ticket. We use a Redis set to track minted slugs.
  const existingId = (await redis.hget(SEED_SET, input.seedSlug)) as string | null;
  if (existingId) {
    const existing = await getTicket(existingId);
    if (existing) return { ticket: existing, created: false };
    // Stale pointer — drop and re-create
    await redis.hdel(SEED_SET, input.seedSlug);
  }

  const id = makeId();
  const createdAt = Date.now();
  const record: Record<string, string | number> = {
    id,
    createdAt,
    source: "system",
    kind: "verification",
    status: "open",
    title: input.title,
    description: input.description,
    pageUrl: input.pageUrl,
    seedSlug: input.seedSlug,
  };
  if (input.context) record.context = input.context;
  if (input.locale) record.locale = input.locale;

  await redis.hset(`bug-report:${id}`, record);
  await redis.zadd(INDEX, { score: createdAt, member: id });
  await redis.hset(SEED_SET, { [input.seedSlug]: id });
  await redis.hincrby(COUNTS, "total", 1);
  await redis.hincrby(COUNTS, "open", 1);
  await redis.hincrby(KINDS, "verification", 1);

  const ticket = await getTicket(id);
  return { ticket: ticket!, created: true };
}

export async function setTicketStatus(id: string, status: TicketStatus): Promise<Ticket | null> {
  const redis = getRedis();
  if (!redis) return null;
  const current = await getTicket(id);
  if (!current) return null;
  if (current.status === status) return current;

  const updates: Record<string, string | number> = { status };
  if (status === "resolved") {
    updates.resolvedAt = Date.now();
  }
  await redis.hset(`bug-report:${id}`, updates);
  // Keep the "open" counter in sync. `total` stays constant until delete.
  if (status === "resolved" && current.status === "open") {
    await redis.hincrby(COUNTS, "open", -1);
  } else if (status === "open" && current.status === "resolved") {
    await redis.hincrby(COUNTS, "open", 1);
  }
  return getTicket(id);
}

export async function deleteTicket(id: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  const current = await getTicket(id);
  if (!current) return false;
  await redis.del(`bug-report:${id}`);
  await redis.zrem(INDEX, id);
  if (current.seedSlug) {
    await redis.hdel(SEED_SET, current.seedSlug);
  }
  await redis.hincrby(COUNTS, "total", -1);
  if (current.status === "open") {
    await redis.hincrby(COUNTS, "open", -1);
  }
  await redis.hincrby(KINDS, current.kind, -1);
  return true;
}
