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
      {/* Row 1: logo + nav / title + actions */}
      <div className="max-w-[1320px] mx-auto flex items-center gap-1 md:gap-2 px-3 md:px-4 lg:px-6 py-2.5">
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

        {activeGame && (
          <nav className="flex items-center gap-1 flex-1 overflow-hidden ml-1">
            {primaryItems.map((item, i) =>
              item.disabled ? (
                <span
                  key={i}
                  className="px-2.5 py-2 text-dim text-xs font-bold rounded-md opacity-50 cursor-not-allowed whitespace-nowrap"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  key={i}
                  href={item.href as any}
                  className="px-2.5 py-2 text-dim text-xs font-bold rounded-md hover:bg-gold/14 hover:text-gold2 no-underline whitespace-nowrap"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
        )}

        {!activeGame && <div className="flex-1" />}

        {activeGame && secondaryItems.length > 0 && (
          <KebabMenu items={secondaryItems} label={t("nav.drawer.menu")} />
        )}

        <MobileNavDrawer
          navItems={navItems}
          activeGameSlug={activeGame?.slug ?? null}
          drawerLabels={drawerLabels}
        />
      </div>

      {/* Row 2: full-width search */}
      <div className="max-w-[1320px] mx-auto px-3 md:px-4 lg:px-6 pb-2.5">
        <SearchBar />
      </div>
    </div>
  );
}
