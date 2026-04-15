import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRedis } from "@/lib/redis";
import { getGeneral } from "@/lib/units";
import { verifyTurnstile } from "@/lib/turnstile";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VOTE_TTL_DAYS = 30;
const COOKIE_NAME = "wc4_vote_best_general";
const REDIS_KEY = "vote:wc4:best-general";
const TOTAL_FIELD = "__total";

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || null;
}

async function readCounts(
  redis: ReturnType<typeof getRedis>
): Promise<{ counts: Record<string, number>; total: number }> {
  if (!redis) return { counts: {}, total: 0 };
  const raw = (await redis.hgetall(REDIS_KEY)) as Record<string, unknown> | null;
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

// GET /api/vote/best-general
export async function GET() {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(
      { counts: {}, total: 0, hasVoted: false, disabled: true },
      { status: 200 }
    );
  }
  const { counts, total } = await readCounts(redis);
  const hasVoted = Boolean(cookies().get(COOKIE_NAME)?.value);
  return NextResponse.json({ counts, total, hasVoted, disabled: false });
}

// POST /api/vote/best-general  { general, turnstileToken }
export async function POST(req: NextRequest) {
  let body: { general?: string; turnstileToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const { general, turnstileToken } = body;
  if (!general || typeof general !== "string") {
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  }

  if (!getGeneral(general)) {
    return NextResponse.json({ error: "unknown general" }, { status: 400 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "voting disabled" }, { status: 503 });
  }

  const cookieJar = cookies();
  if (cookieJar.get(COOKIE_NAME)?.value) {
    return NextResponse.json({ error: "already voted" }, { status: 429 });
  }

  const turnstileOk = await verifyTurnstile(turnstileToken, clientIp(req));
  if (!turnstileOk) {
    return NextResponse.json({ error: "captcha failed" }, { status: 403 });
  }

  await redis.hincrby(REDIS_KEY, general, 1);
  await redis.hincrby(REDIS_KEY, TOTAL_FIELD, 1);

  cookieJar.set(COOKIE_NAME, general, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: VOTE_TTL_DAYS * 86400,
    path: "/",
  });

  const { counts, total } = await readCounts(redis);
  return NextResponse.json({ counts, total, hasVoted: true, disabled: false });
}
