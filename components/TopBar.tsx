import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import LocaleSwitcher from "./LocaleSwitcher";
import SearchBar from "./SearchBar";
import MobileNavDrawer from "./MobileNavDrawer";

export async function TopBar() {
  const t = await getTranslations();

  const navItems: Array<{ href: string; label: string; disabled?: boolean }> = [
    { href: "/world-conqueror-4", label: t("nav.wc4") },
    { href: "#", label: "European War 7", disabled: true },
    { href: "#", label: "Great Conqueror Rome", disabled: true },
    { href: "/world-conqueror-4/mises-a-jour", label: t("nav.updates") },
    { href: "/world-conqueror-4/guides", label: t("nav.guides") },
    { href: "#", label: "Classements", disabled: true },
  ];

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
              La référence FR
            </div>
          </div>
        </Link>

        {/* Desktop nav — hidden under lg */}
        <nav className="hidden lg:flex gap-0.5 ml-3 flex-1">
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

        {/* Search grows to fill available space on mobile */}
        <div className="flex flex-1 min-w-0">
          <SearchBar />
        </div>

        {/* Locale switcher on desktop only — mobile puts it in the drawer */}
        <div className="hidden lg:block">
          <LocaleSwitcher />
        </div>

        {/* Mobile menu trigger */}
        <div className="lg:hidden">
          <MobileNavDrawer navItems={navItems} />
        </div>
      </div>
    </div>
  );
}
