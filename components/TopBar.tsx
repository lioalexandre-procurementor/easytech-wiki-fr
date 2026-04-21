import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import LocaleSwitcher from "./LocaleSwitcher";
import SearchBar from "./SearchBar";
import MobileNavDrawer from "./MobileNavDrawer";
import GameSwitcher from "./GameSwitcher";
import { GAMES } from "@/lib/games";
import { getNavItemsForGame } from "@/lib/nav-items";

export async function TopBar() {
  const t = await getTranslations();
  const locale = await getLocale();

  const pathname = headers().get("x-pathname") ?? "";
  const segments = pathname.split("/").filter(Boolean);
  const gameSlug = segments[1] ?? null;
  const activeGame = GAMES.find((g) => g.slug === gameSlug) ?? null;

  const navItems = getNavItemsForGame(activeGame?.slug ?? null, (key) => t(key as any));

  const drawerLabels = {
    open: t("nav.drawer.open"),
    close: t("nav.drawer.close"),
    nav: t("nav.drawer.nav"),
    menu: t("nav.drawer.menu"),
    language: t("nav.drawer.language"),
  };

  return (
    <div className="bg-gradient-to-b from-[#0a0e13] to-[#121820] border-b border-border sticky top-0 z-50">
      <div className="max-w-[1320px] mx-auto flex items-center gap-3 lg:gap-7 px-4 lg:px-6 py-3 lg:py-3.5">
        <Link
          href="/"
          className="flex items-center gap-2 lg:gap-2.5 font-extrabold text-lg tracking-wide no-underline shrink-0"
        >
          <div
            className="w-9 h-9 rounded-md grid place-items-center text-[#0f1419] font-black text-lg font-serif"
            style={{ background: "linear-gradient(135deg, #d4a44a, #c8372d)" }}
          >
            W
          </div>
          <div className="hidden sm:block">
            <div className="text-gold2 leading-none">{t("site.shortTitle")}</div>
            <div className="text-muted text-[11px] font-semibold uppercase tracking-widest mt-0.5">
              {t("site.tagline")}
            </div>
          </div>
        </Link>

        <GameSwitcher activeGameSlug={activeGame?.slug ?? null} />

        <nav className="hidden lg:flex gap-0.5 flex-1">
          {navItems.map((item, i) =>
            item.disabled ? (
              <span
                key={i}
                className="px-3.5 py-2 text-dim text-sm font-semibold rounded-md opacity-50 cursor-not-allowed"
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={i}
                href={item.href as any}
                className="px-3.5 py-2 text-dim text-sm font-semibold rounded-md hover:bg-gold/10 hover:text-gold2 no-underline"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex flex-1 min-w-0">
          <SearchBar />
        </div>

        <div className="hidden lg:block">
          <LocaleSwitcher />
        </div>

        <div className="lg:hidden">
          <MobileNavDrawer
            navItems={navItems}
            activeGameSlug={activeGame?.slug ?? null}
            drawerLabels={drawerLabels}
          />
        </div>
      </div>
    </div>
  );
}
