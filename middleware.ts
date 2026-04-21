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

  // If next-intl wants to redirect (missing locale prefix, etc.) honour it as-is
  if (intlResponse.headers.has("location")) return intlResponse;

  // Forward raw pathname to server components so TopBar can detect the active game
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Preserve locale cookie set by next-intl
  intlResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") response.headers.append("set-cookie", value);
  });

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
