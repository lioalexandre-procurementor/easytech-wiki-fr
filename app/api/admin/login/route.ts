import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRedis } from "@/lib/redis";
import {
  ADMIN_COOKIE,
  SESSION_TTL_MS,
  isAdminConfigured,
  isPasswordValid,
  issueSession,
} from "@/lib/admin-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;
const WINDOW_SEC = 15 * 60;

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

async function checkAndBumpRate(ip: string): Promise<{ ok: boolean; remaining: number }> {
  const redis = getRedis();
  if (!redis) return { ok: true, remaining: MAX_ATTEMPTS }; // fail-open if Redis missing
  const key = `admin:login:attempts:${ip}`;
  const count = (await redis.incr(key)) as number;
  if (count === 1) {
    await redis.expire(key, WINDOW_SEC);
  }
  return { ok: count <= MAX_ATTEMPTS, remaining: Math.max(0, MAX_ATTEMPTS - count) };
}

async function resetRate(ip: string) {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(`admin:login:attempts:${ip}`);
}

export async function POST(req: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "admin not configured — set ADMIN_PASSWORD and ADMIN_SESSION_SECRET" },
      { status: 503 }
    );
  }

  const ip = clientIp(req);
  const rate = await checkAndBumpRate(ip);
  if (!rate.ok) {
    return NextResponse.json({ error: "too many attempts" }, { status: 429 });
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!isPasswordValid(password)) {
    return NextResponse.json(
      { error: "invalid password", remaining: rate.remaining },
      { status: 401 }
    );
  }

  const token = issueSession(SESSION_TTL_MS);
  if (!token) {
    return NextResponse.json({ error: "session issuance failed" }, { status: 500 });
  }

  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    path: "/",
  });

  // Clear the rate-limit counter so a legit admin can't lock themselves out
  // by typing wrong once then logging in successfully.
  await resetRate(ip);

  return NextResponse.json({ ok: true });
}
