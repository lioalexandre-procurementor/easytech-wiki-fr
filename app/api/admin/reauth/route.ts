import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  REAUTH_COOKIE,
  REAUTH_TTL_MS,
  isAdminConfigured,
  isPasswordValid,
  issueReauth,
  verifySession,
} from "@/lib/admin-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "admin not configured" }, { status: 503 });
  }
  const session = await verifySession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const password = typeof body.password === "string" ? body.password : "";
  if (!isPasswordValid(password)) {
    return NextResponse.json({ error: "invalid password" }, { status: 401 });
  }

  const token = await issueReauth(REAUTH_TTL_MS);
  if (!token) {
    return NextResponse.json({ error: "reauth issuance failed" }, { status: 500 });
  }
  cookies().set(REAUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.floor(REAUTH_TTL_MS / 1000),
    path: "/",
  });
  return NextResponse.json({ ok: true, expiresInSec: Math.floor(REAUTH_TTL_MS / 1000) });
}
