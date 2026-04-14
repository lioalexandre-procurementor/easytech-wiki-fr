import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale, localePrefix, pathnames } from "@/src/i18n/config";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
  pathnames,
});

export const config = {
  // Match all paths except: static files, api routes, _next internals, favicon
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
