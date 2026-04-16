import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale, localePrefix, pathnames } from "@/src/i18n/config";
import { verifySession, ADMIN_COOKIE } from "@/lib/admin-session";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
  pathnames,
});

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes sit outside next-intl's locale system.
  // Gate everything under /admin/** except /admin/login itself.
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const session = verifySession(req.cookies.get(ADMIN_COOKIE)?.value);
    if (!session) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
