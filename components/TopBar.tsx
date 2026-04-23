import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import SearchBar from "./SearchBar";
import MobileNavDrawer from "./MobileNavDrawer";
import KebabMenu from "./KebabMenu";
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
  const primaryItems = navItems.filter((item) => item.primary);
  const secondaryItems = navItems.filter((item) => !item.primary);

  const drawerLabels = {
    open: t("nav.drawer.open"),
    close: t("nav.drawer.close"),
    nav: t("nav.drawer.nav"),
    menu: t("nav.drawer.menu"),
    language: t("nav.drawer.language"),
  };

  return (
    <div className="topbar-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-[1320px] mx-auto flex items-center gap-1 lg:gap-2 px-3 md:px-4 lg:px-6 py-2.5">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-extrabold tracking-wide no-underline shrink-0"
        >
          <div
            className={`${activeGame ? "w-8 h-8" : "w-9 h-9"} rounded-md grid place-items-center text-bg font-black text-lg font-serif logo-mark`}
          >
            W
          </div>
          {!activeGame && (
            <div className="hidden sm:block">
              <div className="text-gold2 leading-none text-base">{t("site.shortTitle")}</div>
              <div className="text-muted text-[9px] font-bold uppercase tracking-widest mt-0.5">
                {t("site.tagline")}
              </div>
            </div>
          )}
        </Link>

        {/* Inline nav — mobile: first item only; desktop (lg+): all primary items.
            Render whenever there are primary items to show — even when the URL
            has no game context (e.g. /leaderboards), the default nav still
            surfaces game hubs + key destinations. */}
        {primaryItems.length > 0 && (
          <nav className="flex items-center gap-0.5 lg:gap-1 overflow-hidden ml-1">
            {primaryItems.map((item, i) => (
              <Link
                key={i}
                href={item.href as any}
                className={`px-2 lg:px-2.5 py-2 text-dim text-xs font-bold rounded-md hover:bg-gold/14 hover:text-gold2 no-underline whitespace-nowrap ${
                  i > 0 ? "hidden lg:inline-flex" : "inline-flex"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex-1" />

        {/* Kebab — desktop only */}
        {secondaryItems.length > 0 && (
          <div className="hidden lg:block">
            <KebabMenu items={secondaryItems} label={t("nav.drawer.menu")} />
          </div>
        )}

        {/* Search — desktop only (inline); mobile gets it in row 2 below */}
        {activeGame && (
          <div className="hidden lg:flex flex-1 min-w-0 max-w-sm">
            <SearchBar />
          </div>
        )}
        {!activeGame && (
          <div className="hidden lg:flex flex-1 min-w-0 max-w-md">
            <SearchBar />
          </div>
        )}

        {/* Hamburger — always visible */}
        <MobileNavDrawer
          navItems={navItems}
          activeGameSlug={activeGame?.slug ?? null}
          drawerLabels={drawerLabels}
        />
      </div>

      {/* Row 2: search on mobile/tablet only */}
      <div className="lg:hidden max-w-[1320px] mx-auto px-3 md:px-4 pb-2.5">
        <SearchBar />
      </div>
    </div>
  );
}
