import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRedis, bestGeneralVoteKey } from "@/lib/redis";
import { getGeneral as getGeneralWc4 } from "@/lib/units";
import { getGeneral as getGeneralGcr } from "@/lib/gcr";
import { getGeneral as getGeneralEw6 } from "@/lib/ew6";
import { verifyTurnstile } from "@/lib/turnstile";
import { parseGame, type Game } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VOTE_TTL_DAYS = 30;
const TOTAL_FIELD = "__total";
const LEGACY_WC4_COOKIE = "wc4_vote_best_general";

function cookieName(game: Game): string {
  return `wc4_vote_best_general_${game}`;
}

function lookupGeneral(game: Game, slug: string) {
  if (game === "wc4") return getGeneralWc4(slug);
  if (game === "gcr") return getGeneralGcr(slug);
  return getGeneralEw6(slug);
}

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || null;
}

async function readCounts(redis: ReturnType<typeof getRedis>, game: Game) {
  if (!redis) return { counts: {}, total: 0 };
  const raw = (await redis.hgetall(bestGeneralVoteKey(game))) as Record<string, unknown> | null;
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

function hasVoted(game: Game): boolean {
  const c = cookies();
  if (c.get(cookieName(game))?.value) return true;
  // Legacy cookie (pre-game-dimension): treat as a WC4 vote.
  if (game === "wc4" && c.get(LEGACY_WC4_COOKIE)?.value) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const game = parseGame(req.nextUrl.searchParams.get("game"));
  if (!game) {
    return NextResponse.json({ error: "invalid game" }, { status: 400 });
  }
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(
      { counts: {}, total: 0, hasVoted: false, disabled: true },
      { status: 200 }
    );
  }
  const { counts, total } = await readCounts(redis, game);
  return NextResponse.json({ counts, total, hasVoted: hasVoted(game), disabled: false });
}

export async function POST(req: NextRequest) {
  let body: { general?: string; game?: string; turnstileToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const game = parseGame(body.game);
  if (!game) return NextResponse.json({ error: "invalid game" }, { status: 400 });
  const { general, turnstileToken } = body;
  if (!general || typeof general !== "string") {
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  }
  if (!lookupGeneral(game, general)) {
    return NextResponse.json({ error: "unknown general" }, { status: 400 });
  }
  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "voting disabled" }, { status: 503 });

  const jar = cookies();
  if (hasVoted(game)) {
    return NextResponse.json({ error: "already voted" }, { status: 429 });
  }
  const turnstileOk = await verifyTurnstile(turnstileToken, clientIp(req));
  if (!turnstileOk) {
    return NextResponse.json({ error: "captcha failed" }, { status: 403 });
  }
  const key = bestGeneralVoteKey(game);
  await redis.hincrby(key, general, 1);
  await redis.hincrby(key, TOTAL_FIELD, 1);
  jar.set(cookieName(game), general, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: VOTE_TTL_DAYS * 86400,
    path: "/",
  });
  const { counts, total } = await readCounts(redis, game);
  return NextResponse.json({ counts, total, hasVoted: true, disabled: false });
}
