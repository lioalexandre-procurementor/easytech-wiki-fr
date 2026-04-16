/**
 * POST /api/vote/unit-general
 *   body: { unit: <unit slug>, general: <general slug>, turnstileToken: string }
 * GET  /api/vote/unit-general?unit=<slug>
 *
 * Each visitor can cast ONE vote per unit (tracked via httpOnly cookie),
 * picking the general they think pairs best with that elite unit.
 * Same Turnstile + Redis + 30-day cookie pattern as /api/vote.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRedis, unitGeneralVoteKey } from "@/lib/redis";
import { verifyTurnstile } from "@/lib/turnstile";
import { getEliteUnit } from "@/lib/units";
import { isEligibleGeneralForUnit } from "@/lib/unit-general-vote";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VOTE_TTL_DAYS = 30;
const COOKIE_PREFIX = "wc4_vote_unit_";
const TOTAL_FIELD = "__total";

function cookieName(unitSlug: string) {
  return `${COOKIE_PREFIX}${unitSlug}`;
}

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || null;
}

async function readCounts(
  redis: ReturnType<typeof getRedis>,
  unitSlug: string
): Promise<{ counts: Record<string, number>; total: number }> {
  if (!redis) return { counts: {}, total: 0 };
  const raw = (await redis.hgetall(unitGeneralVoteKey(unitSlug))) as
    | Record<string, unknown>
    | null;
  if (!raw) return { counts: {}, total: 0 };
  const counts: Record<string, number> = {};
  let total = 0;
  for (const [k, v] of Object.entries(raw)) {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) continue;
    if (k === TOTAL_FIELD) {
      total = n;
    } else {
      counts[k] = n;
    }
  }
  return { counts, total };
}

// GET /api/vote/unit-general?unit=king-tiger
export async function GET(req: NextRequest) {
  const unitSlug = req.nextUrl.searchParams.get("unit") ?? "";
  if (!unitSlug || !getEliteUnit(unitSlug)) {
    return NextResponse.json({ error: "unknown unit" }, { status: 400 });
  }
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(
      { counts: {}, total: 0, hasVoted: false, disabled: true },
      { status: 200 }
    );
  }
  const { counts, total } = await readCounts(redis, unitSlug);
  const hasVoted = Boolean(cookies().get(cookieName(unitSlug))?.value);
  return NextResponse.json({ counts, total, hasVoted, disabled: false });
}

// POST /api/vote/unit-general  { unit, general, turnstileToken }
export async function POST(req: NextRequest) {
  let body: { unit?: string; general?: string; turnstileToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const { unit, general, turnstileToken } = body;
  if (!unit || typeof unit !== "string") {
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  }
  if (!general || typeof general !== "string") {
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  }
  if (!getEliteUnit(unit)) {
    return NextResponse.json({ error: "unknown unit" }, { status: 400 });
  }
  // Server-side validation: the chosen general must be eligible for this
  // unit's category (e.g. no Patton votes on a battleship).
  if (!isEligibleGeneralForUnit(unit, general)) {
    return NextResponse.json(
      { error: "general not eligible for this unit" },
      { status: 400 }
    );
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "voting disabled" }, { status: 503 });
  }

  const cookieJar = cookies();
  if (cookieJar.get(cookieName(unit))?.value) {
    return NextResponse.json({ error: "already voted" }, { status: 429 });
  }

  const turnstileOk = await verifyTurnstile(turnstileToken, clientIp(req));
  if (!turnstileOk) {
    return NextResponse.json({ error: "captcha failed" }, { status: 403 });
  }

  await redis.hincrby(unitGeneralVoteKey(unit), general, 1);
  await redis.hincrby(unitGeneralVoteKey(unit), TOTAL_FIELD, 1);

  cookieJar.set(cookieName(unit), general, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: VOTE_TTL_DAYS * 86400,
    path: "/",
  });

  const { counts, total } = await readCounts(redis, unit);
  return NextResponse.json({ counts, total, hasVoted: true, disabled: false });
}
