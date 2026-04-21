"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { GAMES } from "@/lib/games";

interface Props {
  activeGameSlug: string | null;
}

export default function GameSwitcher({ activeGameSlug }: Props) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const activeGame = GAMES.find((g) => g.slug === activeGameSlug) ?? null;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-bold border transition-colors ${
          activeGame
            ? "bg-gold/10 border-gold/30 text-gold2 hover:bg-gold/20"
            : "bg-panel border-border text-muted hover:text-gold2 hover:border-gold/30"
        }`}
      >
        🎮 {activeGame ? activeGame.shortName : "Jeux"} ▾
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute top-full left-0 mt-1.5 w-60 bg-panel border border-border rounded-lg shadow-2xl z-50 py-1"
        >
          <div className="px-3 py-1.5 text-[10px] text-muted font-bold uppercase tracking-widest">
            Jeux disponibles
          </div>
          {GAMES.filter((g) => g.available).map((g) => (
            <a
              key={g.slug}
              href={`/${locale}/${g.slug}`}
              role="option"
              aria-selected={g.slug === activeGameSlug}
              onClick={() => setOpen(false)}
              className={`flex items-center justify-between px-3 py-2 text-sm hover:bg-gold/10 no-underline ${
                g.slug === activeGameSlug ? "text-gold2 font-bold" : "text-dim"
              }`}
            >
              <span>{g.name}</span>
              {g.slug === activeGameSlug && (
                <span className="text-[10px] text-green-400">● actif</span>
              )}
            </a>
          ))}
          {GAMES.filter((g) => !g.available).map((g) => (
            <div
              key={g.slug}
              className="flex items-center justify-between px-3 py-2 text-sm text-muted/40"
            >
              <span>{g.name}</span>
              <span className="text-[10px]">bientôt</span>
            </div>
          ))}
          <div className="border-t border-border mt-1 pt-1">
            <a
              href={`/${locale}`}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-blue-400 hover:bg-gold/10 no-underline"
            >
              ← Accueil multi-jeux
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
