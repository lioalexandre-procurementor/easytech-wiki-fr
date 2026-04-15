"use client";

import { useEffect, useState } from "react";
import { Link } from "@/src/i18n/navigation";
import LocaleSwitcher from "./LocaleSwitcher";

type NavItem = { href: string; label: string; disabled?: boolean };

export default function MobileNavDrawer({ navItems }: { navItems: NavItem[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        className="grid place-items-center w-11 h-11 rounded-md border border-border text-gold2 hover:bg-gold/10 cursor-pointer"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation"
          className="fixed inset-0 z-[60] flex"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/70" />
          <div
            className="relative ml-auto h-full w-[min(320px,85vw)] bg-panel border-l border-border flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-gold2 font-bold uppercase tracking-widest text-sm">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="grid place-items-center w-11 h-11 rounded-md text-muted hover:text-gold2 hover:bg-gold/10 cursor-pointer text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <nav className="flex flex-col p-2">
              {navItems.map((item, i) =>
                item.disabled ? (
                  <span
                    key={i}
                    className="px-4 py-3 text-dim text-base font-semibold opacity-50"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    key={i}
                    href={item.href as any}
                    onClick={() => setOpen(false)}
                    className="px-4 py-3 text-dim text-base font-semibold rounded-md hover:bg-gold/10 hover:text-gold2 no-underline"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            <div className="mt-auto px-4 py-4 border-t border-border">
              <div className="text-muted text-[11px] font-semibold uppercase tracking-widest mb-2">
                Langue
              </div>
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
