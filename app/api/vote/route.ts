import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRedis, voteKey } from "@/lib/redis";
import { isAllowedSkill } from "@/lib/vote-whitelist";
import { verifyTurnstile } from "@/lib/turnstile";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VOTE_TTL_DAYS = 30;
const COOKIE_PREFIX = "wc4_vote_";
const TOTAL_FIELD = "__total";

function parseSlot(raw: unknown): 1 | 2 | null {
  const n = Number(raw);
  return n === 1 || n === 2 ? n : null;
}

function cookieName(general: string, slot: number) {
  return `${COOKIE_PREFIX}${general}_${slot}`;
}

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || null;
}

async function readCounts(
  redis: ReturnType<typeof getRedis>,
  general: string,
  slot: 1 | 2
): Promise<Record<string, number>> {
  if (!redis) return {};
  const raw = (await redis.hgetall(voteKey(general, slot))) as Record<
    string,
    unknown
  > | null;
  if (!raw) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k === TOTAL_FIELD) continue;
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
}

// GET /api/vote?general=guderian&slot=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const general = searchParams.get("general");
  const slot = parseSlot(searchParams.get("slot"));
  if (!general || !slot) {
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  }
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(
      { counts: {}, hasVoted: false, disabled: true },
      { status: 200 }
    );
  }
  const counts = await readCounts(redis, general, slot);
  const hasVoted = Boolean(cookies().get(cookieName(general, slot))?.value);
  return NextResponse.json({ counts, hasVoted, disabled: false });
}

// POST /api/vote { general, slot, skill, turnstileToken }
export async function POST(req: NextRequest) {
  let body: {
    general?: string;
    slot?: number;
    skill?: string;
    turnstileToken?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const { general, skill, turnstileToken } = body;
  const slot = parseSlot(body.slot);
  if (!general || !slot || !skill) {
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  }

  if (!isAllowedSkill(general, slot, skill)) {
    return NextResponse.json({ error: "unknown skill" }, { status: 400 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "voting disabled" }, { status: 503 });
  }

  const cookieJar = cookies();
  if (cookieJar.get(cookieName(general, slot))?.value) {
    return NextResponse.json({ error: "already voted" }, { status: 429 });
  }

  const turnstileOk = await verifyTurnstile(turnstileToken, clientIp(req));
  if (!turnstileOk) {
    return NextResponse.json({ error: "captcha failed" }, { status: 403 });
  }

  await redis.hincrby(voteKey(general, slot), skill, 1);
  await redis.hincrby(voteKey(general, slot), TOTAL_FIELD, 1);

  cookieJar.set(cookieName(general, slot), skill, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: VOTE_TTL_DAYS * 86400,
    path: "/",
  });

  const counts = await readCounts(redis, general, slot);
  return NextResponse.json({ counts, hasVoted: true, disabled: false });
}
