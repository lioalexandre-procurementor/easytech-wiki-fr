"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "etw-theme";

function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

export default function ThemeToggle({
  labelDark,
  labelLight,
}: {
  labelDark: string;
  labelLight: string;
}) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getInitialTheme());
    setMounted(true);
  }, []);

  const apply = (next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    setTheme(next);
  };

  const next: Theme = theme === "dark" ? "light" : "dark";
  const isDark = theme === "dark";
  const stateLabel = isDark ? labelDark : labelLight;

  return (
    <button
      type="button"
      onClick={() => apply(next)}
      aria-label={stateLabel}
      suppressHydrationWarning
      className="inline-flex items-center gap-2 bg-panel border border-border rounded-full py-1.5 pl-1.5 pr-3 hover:border-gold/50 transition-colors cursor-pointer shrink-0"
    >
      <span
        className="grid place-items-center w-[26px] h-[26px] rounded-full"
        style={{
          background: isDark
            ? "linear-gradient(135deg,#1c2530,#0a0e13)"
            : "linear-gradient(135deg,#ffe9b8,#f0c869)",
        }}
      >
        {mounted && isDark ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f2c265"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7a5311"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        )}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-widest text-dim">
        {mounted ? stateLabel : ""}
      </span>
    </button>
  );
}
