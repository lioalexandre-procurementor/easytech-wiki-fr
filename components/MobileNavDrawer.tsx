"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import LocaleSwitcher from "./LocaleSwitcher";
import { GAMES } from "@/lib/games";
import type { NavItem } from "@/lib/nav-items";

interface DrawerLabels {
  open: string;
  close: string;
  nav: string;
  menu: string;
  language: string;
}

interface Props {
  navItems: NavItem[];
  activeGameSlug: string | null;
  drawerLabels: DrawerLabels;
}

export default function MobileNavDrawer({ navItems, activeGameSlug, drawerLabels }: Props) {
  const [open, setOpen] = useState(false);
  const [gameSwitcherOpen, setGameSwitcherOpen] = useState(false);
  const locale = useLocale();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const activeGame = GAMES.find((g) => g.slug === activeGameSlug) ?? null;
  const localCopy = locale === "fr"
    ? { choose: "Choisir un jeu", active: "actif", soon: "bientôt", home: "Accueil multi-jeux" }
    : locale === "de"
      ? { choose: "Spiel auswählen", active: "aktiv", soon: "bald", home: "Alle Spiele" }
      : { choose: "Choose a game", active: "active", soon: "soon", home: "All games" };

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      (previouslyFocused ?? triggerRef.current)?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={drawerLabels.open}
        aria-expanded={open}
        className="grid place-items-center w-11 h-11 rounded-md border border-border text-gold2 hover:bg-gold/10 cursor-pointer"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-navigation-title"
          className="fixed inset-0 z-[60] flex h-[100dvh]"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/70" />
          <div
            ref={panelRef}
            className="relative ml-auto h-[100dvh] w-[min(340px,90vw)] bg-panel border-l border-border flex flex-col overflow-y-auto pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span id="mobile-navigation-title" className="text-gold2 font-bold uppercase tracking-widest text-sm">
                {drawerLabels.menu}
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={drawerLabels.close}
                className="grid place-items-center w-11 h-11 rounded-md text-muted hover:text-gold2 hover:bg-gold/10 cursor-pointer text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <button
              type="button"
              onClick={() => setGameSwitcherOpen((o) => !o)}
              className="flex min-h-11 items-center justify-between px-4 py-3 border-b border-border text-left hover:bg-gold/5 cursor-pointer w-full"
            >
              <span className="text-gold2 font-semibold text-sm">
                🎮 {activeGame ? activeGame.name : localCopy.choose}
              </span>
              <span className="text-muted text-xs">{gameSwitcherOpen ? "▲" : "▼"}</span>
            </button>

            {gameSwitcherOpen && (
              <div className="border-b border-border bg-black/20">
                {GAMES.filter((g) => g.available).map((g) => (
                  <Link
                    key={g.slug}
                    href={`/${g.slug}` as any}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-11 items-center justify-between px-6 py-2.5 text-sm no-underline hover:bg-gold/10 ${
                      g.slug === activeGameSlug ? "text-gold2 font-bold" : "text-dim"
                    }`}
                  >
                    {g.name}
                    {g.slug === activeGameSlug && <span className="text-[10px] text-green-400">● {localCopy.active}</span>}
                  </Link>
                ))}
                {GAMES.filter((g) => !g.available).map((g) => (
                  <div key={g.slug} className="flex min-h-11 items-center justify-between px-6 py-2.5 text-sm text-muted/40">
                    {g.name}
                    <span className="text-[10px]">{localCopy.soon}</span>
                  </div>
                ))}
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center px-6 py-2.5 text-sm text-blue-400 no-underline hover:bg-gold/10 border-t border-border"
                >
                  ← {localCopy.home}
                </Link>
              </div>
            )}

            <nav className="flex flex-col p-2 flex-1">
              {navItems.map((item, i) =>
                item.disabled ? (
                  <span key={i} className="px-4 py-3 text-dim text-base font-semibold opacity-50">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    key={i}
                    href={item.href as any}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center px-4 py-3 text-dim text-base font-semibold rounded-md hover:bg-gold/10 hover:text-gold2 no-underline"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            <div className="mt-auto px-4 py-4 border-t border-border">
              <div className="text-muted text-[11px] font-semibold uppercase tracking-widest mb-2">
                {drawerLabels.language}
              </div>
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
