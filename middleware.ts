import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/src/i18n/config";
import { verifySession, ADMIN_COOKIE } from "@/lib/admin-session";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const session = await verifySession(req.cookies.get(ADMIN_COOKIE)?.value);
    if (!session) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const intlResponse = intlMiddleware(req);

  // Forward raw pathname to server components so TopBar can detect the active game.
  // IMPORTANT: use the intlResponse directly — it carries internal rewrites
  // (e.g. /fr/classements → /fr/leaderboards). Creating a fresh NextResponse.next()
  // would discard those rewrites and cause 404s on localized paths.
  intlResponse.headers.set("x-pathname", pathname);

  return intlResponse;
}

export const config = {
  // `og` is excluded so the OG-image generator route (app/og/route.tsx) is
  // reachable at /og without being locale-redirected to /fr/og by next-intl.
  matcher: ["/((?!api|og|_next|_vercel|.*\\..*).*)"],
};
