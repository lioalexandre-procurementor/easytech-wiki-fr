/**
 * POST /api/vote/unit-general
 *   body: { game, unit, general, turnstileToken }
 * GET  /api/vote/unit-general?game=wc4&unit=<slug>
 *
 * Each visitor can cast ONE vote per (game, unit) combination, tracked
 * via an httpOnly cookie per pair. Cross-game voting is allowed: a
 * visitor may vote once on a WC4 unit, once on a GCR unit, and once on
 * an EW6 unit.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRedis, unitGeneralVoteKey } from "@/lib/redis";
import { verifyTurnstile } from "@/lib/turnstile";
import { getEliteUnit as getEliteUnitWc4 } from "@/lib/units";
import { getEliteUnit as getEliteUnitGcr } from "@/lib/gcr";
import { getEliteUnit as getEliteUnitEw6 } from "@/lib/ew6";
import { isEligibleGeneralForUnit } from "@/lib/unit-general-vote";
import { parseGame, type Game } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VOTE_TTL_DAYS = 30;
const TOTAL_FIELD = "__total";
const LEGACY_COOKIE_PREFIX = "wc4_vote_unit_"; // pre-game-dimension; kept for graceful read

function cookieName(game: Game, unitSlug: string): string {
  return `wc4_vote_unit_${game}_${unitSlug}`;
}

function lookupUnit(game: Game, slug: string) {
  if (game === "wc4") return getEliteUnitWc4(slug);
  if (game === "gcr") return getEliteUnitGcr(slug);
  return getEliteUnitEw6(slug);
}

function hasVoted(game: Game, unitSlug: string): boolean {
  const c = cookies();
  if (c.get(cookieName(game, unitSlug))?.value) return true;
  // Legacy WC4 cookie (no game suffix): treat as a WC4 vote for grace window.
  if (game === "wc4" && c.get(`${LEGACY_COOKIE_PREFIX}${unitSlug}`)?.value) return true;
  return false;
}

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || null;
}

async function readCounts(
  redis: ReturnType<typeof getRedis>,
  game: Game,
  unitSlug: string
): Promise<{ counts: Record<string, number>; total: number }> {
  if (!redis) return { counts: {}, total: 0 };
  const raw = (await redis.hgetall(unitGeneralVoteKey(game, unitSlug))) as
    | Record<string, unknown>
    | null;
  if (!raw) return { counts: {}, total: 0 };
  const counts: Record<string, number> = {};
  let total = 0;
  for (const [k, v] of Object.entries(raw)) {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) continue;
    if (k === TOTAL_FIELD) total = n;
    else counts[k] = n;
  }
  return { counts, total };
}

export async function GET(req: NextRequest) {
  const game = parseGame(req.nextUrl.searchParams.get("game"));
  if (!game) {
    return NextResponse.json({ error: "invalid game" }, { status: 400 });
  }
  const unitSlug = req.nextUrl.searchParams.get("unit") ?? "";
  if (!unitSlug || !lookupUnit(game, unitSlug)) {
    return NextResponse.json({ error: "unknown unit" }, { status: 400 });
  }
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(
      { counts: {}, total: 0, hasVoted: false, disabled: true },
      { status: 200 }
    );
  }
  const { counts, total } = await readCounts(redis, game, unitSlug);
  return NextResponse.json({
    counts,
    total,
    hasVoted: hasVoted(game, unitSlug),
    disabled: false,
  });
}

export async function POST(req: NextRequest) {
  let body: { game?: string; unit?: string; general?: string; turnstileToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const game = parseGame(body.game);
  if (!game) return NextResponse.json({ error: "invalid game" }, { status: 400 });
  const { unit, general, turnstileToken } = body;
  if (!unit || typeof unit !== "string") {
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  }
  if (!general || typeof general !== "string") {
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  }
  if (!lookupUnit(game, unit)) {
    return NextResponse.json({ error: "unknown unit" }, { status: 400 });
  }
  // Server-side validation: the chosen general must be eligible for this
  // unit's category (e.g. no Patton votes on a battleship).
  if (!isEligibleGeneralForUnit(game, unit, general)) {
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
  if (hasVoted(game, unit)) {
    return NextResponse.json({ error: "already voted" }, { status: 429 });
  }

  const turnstileOk = await verifyTurnstile(turnstileToken, clientIp(req));
  if (!turnstileOk) {
    return NextResponse.json({ error: "captcha failed" }, { status: 403 });
  }

  const key = unitGeneralVoteKey(game, unit);
  await redis.hincrby(key, general, 1);
  await redis.hincrby(key, TOTAL_FIELD, 1);

  cookieJar.set(cookieName(game, unit), general, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: VOTE_TTL_DAYS * 86400,
    path: "/",
  });

  const { counts, total } = await readCounts(redis, game, unit);
  return NextResponse.json({ counts, total, hasVoted: true, disabled: false });
}
