import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  REAUTH_COOKIE,
  isAdminConfigured,
  verifyReauth,
  verifySession,
} from "./admin-session";

/**
 * Ensures the incoming API request carries a valid admin session.
 * Returns `null` if authorized, or a NextResponse to return immediately.
 *
 * Middleware already protects /admin/** pages. API routes live under
 * /api/admin/** and are NOT covered by middleware (which skips /api),
 * so every admin API handler must call this.
 */
export function requireAdmin(): NextResponse | null {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "admin not configured" }, { status: 503 });
  }
  const session = verifySession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * For destructive operations (reset-all, delete-all). Requires both a
 * valid session AND a fresh reauth cookie (issued by /api/admin/reauth).
 * The reauth cookie expires 60s after being minted, so clicking "reset"
 * without a fresh password re-entry is rejected.
 */
export function requireAdminWithReauth(): NextResponse | null {
  const sessionCheck = requireAdmin();
  if (sessionCheck) return sessionCheck;
  if (!verifyReauth(cookies().get(REAUTH_COOKIE)?.value)) {
    return NextResponse.json({ error: "reauth required" }, { status: 401 });
  }
  return null;
}
