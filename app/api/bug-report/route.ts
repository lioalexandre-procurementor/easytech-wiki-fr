import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRedis } from "@/lib/redis";
import { verifyTurnstile } from "@/lib/turnstile";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REDIS_INDEX = "bug-reports:index";
const REDIS_COUNTS = "bug-reports:counts";
const RATE_COOKIE = "ew_bug_report_last";
const RATE_WINDOW_SEC = 60;
const MAX_DESCRIPTION_LEN = 2000;
const MAX_EMAIL_LEN = 120;
const MAX_URL_LEN = 500;
const MAX_TITLE_LEN = 200;

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || null;
}

function makeId(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `${t}-${r}`;
}

function sanitize(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

// POST /api/bug-report  { description, pageUrl, pageTitle?, email?, locale?, turnstileToken }
export async function POST(req: NextRequest) {
  let body: {
    description?: string;
    pageUrl?: string;
    pageTitle?: string;
    email?: string;
    locale?: string;
    turnstileToken?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const description = sanitize(body.description, MAX_DESCRIPTION_LEN);
  const pageUrl = sanitize(body.pageUrl, MAX_URL_LEN);
  const pageTitle = sanitize(body.pageTitle, MAX_TITLE_LEN);
  const email = sanitize(body.email, MAX_EMAIL_LEN);
  const locale = sanitize(body.locale, 5);

  if (description.length < 10) {
    return NextResponse.json({ error: "description too short" }, { status: 400 });
  }
  if (!pageUrl) {
    return NextResponse.json({ error: "missing page url" }, { status: 400 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "reporting disabled" }, { status: 503 });
  }

  const cookieJar = cookies();
  const last = cookieJar.get(RATE_COOKIE)?.value;
  if (last) {
    const lastTs = Number(last);
    if (Number.isFinite(lastTs) && Date.now() - lastTs < RATE_WINDOW_SEC * 1000) {
      return NextResponse.json({ error: "rate limited" }, { status: 429 });
    }
  }

  const turnstileOk = await verifyTurnstile(body.turnstileToken, clientIp(req));
  if (!turnstileOk) {
    return NextResponse.json({ error: "captcha failed" }, { status: 403 });
  }

  const id = makeId();
  const createdAt = Date.now();
  const record = {
    id,
    createdAt,
    source: "user" as const,
    kind: "bug" as const,
    title: description.slice(0, 80),
    description,
    pageUrl,
    pageTitle,
    email,
    locale,
    userAgent: (req.headers.get("user-agent") || "").slice(0, 300),
    ip: clientIp(req) || "",
    status: "open" as const,
  };

  await redis.hset(`bug-report:${id}`, record);
  await redis.zadd(REDIS_INDEX, { score: createdAt, member: id });
  await redis.hincrby(REDIS_COUNTS, "total", 1);
  await redis.hincrby(REDIS_COUNTS, "open", 1);
  await redis.hincrby("bug-reports:kinds", "bug", 1);

  cookieJar.set(RATE_COOKIE, String(createdAt), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: RATE_WINDOW_SEC,
    path: "/",
  });

  return NextResponse.json({ ok: true, id });
}
