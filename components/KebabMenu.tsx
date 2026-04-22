"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "@/src/i18n/navigation";
import type { NavItem } from "@/lib/nav-items";

interface Props {
  items: NavItem[];
  label: string;
}

export default function KebabMenu({ items, label }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="grid place-items-center w-10 h-10 rounded-md border border-border text-dim hover:text-gold2 hover:border-gold/50 transition-colors cursor-pointer"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[55]"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute top-full right-0 mt-1.5 min-w-[260px] bg-panel border border-border rounded-lg shadow-panel z-[56]"
          >
            {items.map((item, i) => {
              const cls =
                "flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-semibold no-underline transition-colors" +
                (i > 0 ? " border-t border-border" : "");

              if (item.disabled) {
                return (
                  <span
                    key={i}
                    className={`${cls} text-muted/50 cursor-default`}
                  >
                    {item.icon && <span>{item.icon}</span>}
                    <span className="flex-1">{item.label}</span>
                    <span className="text-[9px] uppercase tracking-widest text-muted/40 font-bold">
                      bientôt
                    </span>
                  </span>
                );
              }

              return (
                <Link
                  key={i}
                  href={item.href as any}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`${cls} text-dim hover:bg-gold/10 hover:text-gold2`}
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
