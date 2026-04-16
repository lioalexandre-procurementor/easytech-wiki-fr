import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, REAUTH_COOKIE } from "@/lib/admin-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const jar = cookies();
  jar.delete(ADMIN_COOKIE);
  jar.delete(REAUTH_COOKIE);
  return NextResponse.json({ ok: true });
}
