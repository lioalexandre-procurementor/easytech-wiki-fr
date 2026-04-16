# Game-Aware Navigation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the desktop top bar and mobile hamburger drawer **context-aware**: when the user is inside a game (WC4, GCR, EW6), the nav shows only that game's sections plus a distinctive **Game Switcher** pill to jump between games. On the home hub, the nav shows the game-selector directly.

**Architecture:**
- Convert `TopBar` from server component to client component so it can read `usePathname()` without prop-drilling through ~50 pages.
- Centralize nav config in a new `lib/nav.ts` that derives the current game from the pathname and returns the right items per game and locale.
- Introduce a `GameSwitcher` client component used in both the desktop bar and the mobile drawer.
- Add per-game accent tokens to the Tailwind theme so the Game Switcher pill and the active underline pick up the right color (WC4 gold, GCR crimson, EW6 indigo).

**Tech Stack:** Next.js 14 App Router, React 18 client components, `next-intl` 3 (shared pathnames navigation — `useLocale` / `useTranslations` / `usePathname` / `useRouter` from `@/src/i18n/navigation`), Tailwind 3.4 with custom theme colors, TypeScript 5.6 strict mode. No test framework is installed — plan uses `tsx` for a tiny logic-only unit test and `tsc --noEmit` / `next build` for regression checks.

**Aesthetic direction:** Military Campaign HQ. Georgia serif display (already in theme), small-caps tracked labels, 2px bottom bar in the current game's accent color on the active route. Motion restrained: popover fades + translates 6px on open. Per-game accents:
- WC4 → `#d4a44a` → `#f2c265` (existing gold)
- GCR → `#c8372d` → `#e85644` (imperial crimson)
- EW6 → `#3a6b9c` → `#5890c3` (Napoleonic indigo)

---

## File Structure

- **Create** `easytech-wiki/lib/nav.ts` — Single source of truth for the game-aware nav model. Exports `GameSlug`, `getGameFromPath`, `getGameNav`, `HUB_NAV`, and per-game accent tokens. Pure logic, easy to test.
- **Create** `easytech-wiki/scripts/test-nav.ts` — Tiny assertion-based test runner (no framework) for `getGameFromPath`. Runs via `npx tsx`.
- **Create** `easytech-wiki/components/GameSwitcher.tsx` — Client component. Pill button ("regimental insignia") that opens a popover listing all games with era, availability, and active state. Reused by desktop bar and mobile drawer.
- **Modify** `easytech-wiki/components/TopBar.tsx` — Convert from async server component to `"use client"` component. Renders game-specific nav via `getGameNav`, embeds `GameSwitcher`, applies the active underline in the current game's accent color.
- **Modify** `easytech-wiki/components/MobileNavDrawer.tsx` — Rework: drop the flat `navItems` prop. Read pathname itself via `usePathname`, render current-game header with embedded `GameSwitcher`, list the current game's nav sections, append locale switcher.
- **Modify** `easytech-wiki/tailwind.config.ts` — Add per-game accent tokens: `wc4`, `wc4Accent`, `gcr`, `gcrAccent`, `ew6`, `ew6Accent`.

**Out of scope for this plan:**
- Redesigning game hub pages themselves.
- Search bar visual changes (already launches on `⌘K`).
- Footer redesign.
- Localization of new UI strings beyond FR / EN / DE (the three existing locales).

---

## Task 1 — Add per-game accent tokens to Tailwind theme

**Files:**
- Modify: `easytech-wiki/tailwind.config.ts`

- [ ] **Step 1: Update the theme extension**

Open `easytech-wiki/tailwind.config.ts` and replace the `colors` block so it contains the existing tokens plus three pairs of per-game accents:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0f1419",
        bg2: "#151c24",
        bg3: "#1c2530",
        panel: "#1a2230",
        border: "#2a3544",
        gold: "#d4a44a",
        gold2: "#f2c265",
        khaki: "#8b7d4a",
        accent: "#c8372d",
        ink: "#e8ebf0",
        dim: "#9aa5b4",
        muted: "#6b7685",
        ok: "#4a9d5f",
        tierS: "#ff4d4d",
        tierA: "#ff9c40",
        tierB: "#ffd24d",
        tierC: "#6bb86b",
        // Per-game accents (used by GameSwitcher + active nav underline)
        wc4: "#d4a44a",
        wc4Accent: "#f2c265",
        gcr: "#c8372d",
        gcrAccent: "#e85644",
        ew6: "#3a6b9c",
        ew6Accent: "#5890c3",
      },
      fontFamily: {
        serif: ["Georgia", "ui-serif", "serif"],
      },
      boxShadow: {
        panel: "0 6px 20px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 2: Verify the theme compiles**

Run:
```bash
cd easytech-wiki && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add easytech-wiki/tailwind.config.ts
git commit -m "theme: add per-game accent tokens for navigation"
```

---

## Task 2 — Write the failing test for `getGameFromPath`

**Files:**
- Create: `easytech-wiki/scripts/test-nav.ts`

- [ ] **Step 1: Create the test file with all expected cases**

Create `easytech-wiki/scripts/test-nav.ts` with this exact content:

```ts
/**
 * Tiny assertion-based test runner for lib/nav.ts.
 * Run with: npx tsx scripts/test-nav.ts
 *
 * No framework, no snapshots — just typed assertions. Exit code 1 on any
 * failure so CI / pre-push hooks can gate on it.
 */
import { getGameFromPath, getGameNav, type GameSlug } from "@/lib/nav";

let failed = 0;
function eq<T>(actual: T, expected: T, label: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.error(`  FAIL ${label}`);
    console.error(`       expected: ${JSON.stringify(expected)}`);
    console.error(`       actual:   ${JSON.stringify(actual)}`);
  }
}

console.log("getGameFromPath:");
eq(getGameFromPath("/fr"), null, "root FR → null");
eq(getGameFromPath("/en"), null, "root EN → null");
eq(getGameFromPath("/"), null, "bare root → null");
eq(getGameFromPath("/fr/world-conqueror-4"), "wc4", "FR WC4 hub");
eq(getGameFromPath("/en/world-conqueror-4/generals"), "wc4", "EN WC4 deep");
eq(getGameFromPath("/de/world-conqueror-4/elite-units/tiger"), "wc4", "DE WC4 deep");
eq(getGameFromPath("/fr/great-conqueror-rome"), "gcr", "FR GCR hub");
eq(getGameFromPath("/en/great-conqueror-rome/roman-conquest"), "gcr", "EN GCR deep");
eq(getGameFromPath("/fr/european-war-6/technologies/tank"), "ew6", "FR EW6 deep");
eq(getGameFromPath("/fr/leaderboards"), null, "leaderboards → null");
eq(getGameFromPath("/en/legal/privacy"), null, "legal → null");

console.log("getGameNav — WC4 (en):");
const wc4Nav = getGameNav("wc4", "en");
eq(wc4Nav.length > 0, true, "returns non-empty list");
eq(
  wc4Nav.map((n) => n.key).includes("scorpion"),
  true,
  "includes scorpion section"
);
eq(
  wc4Nav.map((n) => n.key).includes("roman"),
  false,
  "excludes GCR-only section"
);

console.log("getGameNav — GCR (fr):");
const gcrNav = getGameNav("gcr", "fr");
eq(
  gcrNav.map((n) => n.key).includes("roman"),
  true,
  "includes roman-conquest section"
);
eq(
  gcrNav.map((n) => n.key).includes("scorpion"),
  false,
  "excludes WC4-only section"
);

console.log("getGameNav — EW6 (de):");
const ew6Nav = getGameNav("ew6", "de");
eq(
  ew6Nav.map((n) => n.key).includes("scorpion"),
  false,
  "EW6 has no faction hub"
);
eq(
  ew6Nav.map((n) => n.key).includes("roman"),
  false,
  "EW6 has no roman section"
);

// Type assertion — not runtime, but ensures GameSlug is narrow.
const _assertExhaustive: GameSlug = "wc4";
void _assertExhaustive;

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nall tests passed");
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
cd easytech-wiki && npx tsx scripts/test-nav.ts
```
Expected: FAIL — error like `Cannot find module '@/lib/nav'` because `lib/nav.ts` does not exist yet.

- [ ] **Step 3: Commit the failing test**

```bash
git add easytech-wiki/scripts/test-nav.ts
git commit -m "test: add failing tests for getGameFromPath and getGameNav"
```

---

## Task 3 — Implement `lib/nav.ts` to pass the tests

**Files:**
- Create: `easytech-wiki/lib/nav.ts`

- [ ] **Step 1: Create the module**

Create `easytech-wiki/lib/nav.ts` with this exact content:

```ts
/**
 * Game-aware navigation model.
 *
 * `getGameFromPath` detects which EasyTech game the user is currently
 * browsing based on the URL pathname. The navigation bar (TopBar.tsx) and
 * mobile drawer (MobileNavDrawer.tsx) use this to render only the current
 * game's sections, with a GameSwitcher pill to change context.
 *
 * Pathnames are shared across locales (see src/i18n/config.ts) — the game
 * segment (`world-conqueror-4`, `great-conqueror-rome`, `european-war-6`)
 * is identical on /fr, /en, /de, so detection is locale-agnostic.
 */

import type { Locale } from "@/src/i18n/config";

export type GameSlug = "wc4" | "gcr" | "ew6";

export interface GameAccent {
  /** Tailwind class fragment — used as `bg-${base}`, `text-${base}`, etc. */
  base: string;
  accent: string;
  /** Raw hex — used for inline borders / shadows that can't be Tailwind classes. */
  hex: string;
  hexAccent: string;
}

export const GAME_ACCENTS: Record<GameSlug, GameAccent> = {
  wc4: { base: "wc4", accent: "wc4Accent", hex: "#d4a44a", hexAccent: "#f2c265" },
  gcr: { base: "gcr", accent: "gcrAccent", hex: "#c8372d", hexAccent: "#e85644" },
  ew6: { base: "ew6", accent: "ew6Accent", hex: "#3a6b9c", hexAccent: "#5890c3" },
};

export interface GameSummary {
  slug: GameSlug;
  /** URL path to the hub. Locale prefix is added by next-intl's Link. */
  href: string;
  shortName: string;
  name: string;
  era: Record<Locale, string>;
  available: boolean;
}

export const GAMES_UI: GameSummary[] = [
  {
    slug: "wc4",
    href: "/world-conqueror-4",
    shortName: "WC4",
    name: "World Conqueror 4",
    era: { fr: "WW2 · Guerre froide · Moderne", en: "WW2 · Cold War · Modern", de: "WK2 · Kalter Krieg · Modern" },
    available: true,
  },
  {
    slug: "gcr",
    href: "/great-conqueror-rome",
    shortName: "GCR",
    name: "Great Conqueror: Rome",
    era: { fr: "Antiquité romaine", en: "Ancient Rome", de: "Antikes Rom" },
    available: true,
  },
  {
    slug: "ew6",
    href: "/european-war-6",
    shortName: "EW6",
    name: "European War 6: 1914",
    era: { fr: "Napoléon · Grande Guerre", en: "Napoleon · Great War", de: "Napoleon · Großer Krieg" },
    available: true,
  },
];

/**
 * Derive the current game from a pathname.
 * Accepts pathnames with or without the locale prefix.
 * Returns null for the home hub, leaderboards, legal pages, etc.
 */
export function getGameFromPath(pathname: string): GameSlug | null {
  // Strip leading slash, split on "/".
  const parts = pathname.replace(/^\/+/, "").split("/");
  // First segment might be the locale ("fr" / "en" / "de").
  const locales = ["fr", "en", "de"];
  const gameSegment = locales.includes(parts[0]) ? parts[1] : parts[0];
  switch (gameSegment) {
    case "world-conqueror-4":
      return "wc4";
    case "great-conqueror-rome":
      return "gcr";
    case "european-war-6":
      return "ew6";
    default:
      return null;
  }
}

/**
 * A single nav item rendered in the top bar / drawer.
 * `key` is stable across locales so active-state matching can work even
 * when segment names differ per locale (e.g. `generaux` vs `generals`).
 */
export interface NavItem {
  /** Stable identifier. Used to compare against the current URL. */
  key: string;
  /** Canonical href (FR-style slug — next-intl rewrites per locale). */
  href: string;
  /** URL substrings that mark this item as active. One per locale. */
  matchSegments: string[];
  /** Localized label. */
  label: Record<Locale, string>;
}

/**
 * Nav items for a given game, in rendered order.
 * Sections are curated by game (scorpion is WC4-only, roman-conquest is
 * GCR-only; EW6 has no faction hub section).
 */
export function getGameNav(game: GameSlug, _locale: Locale): NavItem[] {
  // _locale param kept for future per-locale reordering; current sections
  // don't vary per locale, only labels do.
  void _locale;
  const basePath =
    game === "wc4" ? "/world-conqueror-4" :
    game === "gcr" ? "/great-conqueror-rome" :
                     "/european-war-6";

  const common: NavItem[] = [
    {
      key: "hub",
      href: basePath,
      matchSegments: [basePath],
      label: { fr: "Accueil", en: "Home", de: "Start" },
    },
    {
      key: "generals",
      href: `${basePath}/generaux`,
      matchSegments: [`${basePath}/generaux`, `${basePath}/generals`],
      label: { fr: "Généraux", en: "Generals", de: "Generäle" },
    },
    {
      key: "elite-units",
      href: `${basePath}/unites-elite`,
      matchSegments: [`${basePath}/unites-elite`, `${basePath}/elite-units`],
      label: { fr: "Unités d'élite", en: "Elite units", de: "Eliteeinheiten" },
    },
    {
      key: "skills",
      href: `${basePath}/competences`,
      matchSegments: [`${basePath}/competences`, `${basePath}/skills`],
      label: { fr: "Compétences", en: "Skills", de: "Fähigkeiten" },
    },
    {
      key: "technologies",
      href: `${basePath}/technologies`,
      matchSegments: [`${basePath}/technologies`],
      label: { fr: "Technologies", en: "Technologies", de: "Technologien" },
    },
    {
      key: "comparator",
      href: `${basePath}/comparateur/unites`,
      matchSegments: [`${basePath}/comparateur`, `${basePath}/comparator`],
      label: { fr: "Comparateur", en: "Comparator", de: "Vergleich" },
    },
    {
      key: "updates",
      href: `${basePath}/mises-a-jour`,
      matchSegments: [`${basePath}/mises-a-jour`, `${basePath}/updates`],
      label: { fr: "Mises à jour", en: "Updates", de: "Updates" },
    },
    {
      key: "guides",
      href: `${basePath}/guides`,
      matchSegments: [`${basePath}/guides`],
      label: { fr: "Guides", en: "Guides", de: "Guides" },
    },
  ];

  if (game === "wc4") {
    // WC4 has the Scorpion Empire faction hub. Insert after Elite Units.
    const scorpion: NavItem = {
      key: "scorpion",
      href: "/world-conqueror-4/empire-du-scorpion",
      matchSegments: ["/empire-du-scorpion", "/scorpion-empire"],
      label: { fr: "Empire du Scorpion", en: "Scorpion Empire", de: "Skorpion-Imperium" },
    };
    return [...common.slice(0, 3), scorpion, ...common.slice(3)];
  }

  if (game === "gcr") {
    // GCR has the Roman Conquest (barbarian faction) hub. Insert after Elite Units.
    const roman: NavItem = {
      key: "roman",
      href: "/great-conqueror-rome/conquete-romaine",
      matchSegments: ["/conquete-romaine", "/roman-conquest"],
      label: { fr: "Conquête romaine", en: "Roman Conquest", de: "Römische Eroberung" },
    };
    return [...common.slice(0, 3), roman, ...common.slice(3)];
  }

  // EW6: no faction hub section.
  return common;
}

/**
 * Nav items shown on the home hub (when no game is selected).
 * Currently just a link to Leaderboards — the hub page itself renders the
 * game selection grid.
 */
export const HUB_NAV_KEYS = ["leaderboards"] as const;

export function getHubNav(): NavItem[] {
  return [
    {
      key: "leaderboards",
      href: "/leaderboards",
      matchSegments: ["/leaderboards", "/classements", "/bestenlisten"],
      label: { fr: "Classements", en: "Leaderboards", de: "Bestenlisten" },
    },
  ];
}

/**
 * Check whether a nav item should be rendered as active for the given path.
 * Uses substring match because locale-specific URL segments differ
 * (e.g. `/generaux` vs `/generals`).
 */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  // Normalize: strip locale prefix to match canonical-style segments.
  const stripped = pathname.replace(/^\/(?:fr|en|de)(?=\/|$)/, "") || "/";
  // Hub nav (e.g. `/world-conqueror-4`) must match exactly, not as a prefix,
  // otherwise it lights up on every sub-page.
  if (item.key === "hub") {
    return item.matchSegments.includes(stripped);
  }
  return item.matchSegments.some((seg) => stripped.startsWith(seg));
}
```

- [ ] **Step 2: Run the test to verify it passes**

Run:
```bash
cd easytech-wiki && npx tsx scripts/test-nav.ts
```
Expected output ends with `all tests passed` and exit code 0.

- [ ] **Step 3: Run the TypeScript compiler**

Run:
```bash
cd easytech-wiki && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add easytech-wiki/lib/nav.ts
git commit -m "feat(nav): add game-aware navigation model"
```

---

## Task 4 — Build the `GameSwitcher` component

**Files:**
- Create: `easytech-wiki/components/GameSwitcher.tsx`

- [ ] **Step 1: Create the component**

Create `easytech-wiki/components/GameSwitcher.tsx` with this exact content:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/config";
import {
  GAMES_UI,
  GAME_ACCENTS,
  type GameSlug,
} from "@/lib/nav";

const LABELS: Record<Locale, { switchGame: string; currentGame: string; allGames: string; pickGame: string }> = {
  fr: { switchGame: "Changer de jeu", currentGame: "Jeu actif", allGames: "Tous les jeux", pickGame: "Choisir un jeu" },
  en: { switchGame: "Switch game",     currentGame: "Active game", allGames: "All games",   pickGame: "Pick a game" },
  de: { switchGame: "Spiel wechseln",  currentGame: "Aktives Spiel", allGames: "Alle Spiele", pickGame: "Spiel wählen" },
};

interface GameSwitcherProps {
  /** null → on the home hub, no active game. */
  currentGame: GameSlug | null;
  /**
   * "pill" → desktop bar variant, compact with short-code badge.
   * "block" → mobile drawer variant, full-width card with name + era.
   */
  variant?: "pill" | "block";
}

export default function GameSwitcher({ currentGame, variant = "pill" }: GameSwitcherProps) {
  const locale = useLocale() as Locale;
  const labels = LABELS[locale] ?? LABELS.en;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeGame = currentGame ? GAMES_UI.find((g) => g.slug === currentGame) : null;
  const accent = currentGame ? GAME_ACCENTS[currentGame] : null;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const triggerClass =
    variant === "pill"
      ? "flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border bg-bg3 hover:bg-bg2 cursor-pointer transition-colors"
      : "flex items-center justify-between w-full gap-3 px-3 py-3 rounded-lg border border-border bg-bg3 hover:bg-bg2 cursor-pointer transition-colors";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={labels.switchGame}
        className={triggerClass}
      >
        {activeGame ? (
          <>
            <span
              className="grid place-items-center w-7 h-7 rounded font-black font-serif text-[13px] text-[#0f1419] shrink-0"
              style={{
                background: `linear-gradient(135deg, ${accent!.hex}, ${accent!.hexAccent})`,
              }}
              aria-hidden="true"
            >
              {activeGame.shortName}
            </span>
            <span className="flex flex-col items-start min-w-0 leading-none">
              <span className="text-[10px] uppercase tracking-widest text-muted">
                {labels.currentGame}
              </span>
              <span className="text-sm font-bold text-ink truncate max-w-[180px]">
                {variant === "pill" ? activeGame.shortName : activeGame.name}
              </span>
            </span>
          </>
        ) : (
          <>
            <span
              className="grid place-items-center w-7 h-7 rounded font-black font-serif text-sm text-[#0f1419] bg-gradient-to-br from-gold to-gold2 shrink-0"
              aria-hidden="true"
            >
              ⁙
            </span>
            <span className="text-sm font-bold text-ink">{labels.pickGame}</span>
          </>
        )}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-muted transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={labels.allGames}
          className={`absolute z-50 ${
            variant === "pill" ? "top-full left-0 mt-2 w-[320px]" : "top-full left-0 right-0 mt-2"
          } bg-panel border border-border rounded-lg shadow-panel overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150`}
        >
          <div className="px-3 py-2 border-b border-border">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
              {labels.allGames}
            </span>
          </div>
          <ul className="p-1">
            {GAMES_UI.map((g) => {
              const isActive = g.slug === currentGame;
              const ga = GAME_ACCENTS[g.slug];
              return (
                <li key={g.slug}>
                  <Link
                    href={g.href as any}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md no-underline transition-colors ${
                      isActive
                        ? "bg-gold/10 cursor-default"
                        : "hover:bg-border/40 cursor-pointer"
                    }`}
                  >
                    <span
                      className="grid place-items-center w-8 h-8 rounded font-black font-serif text-sm text-[#0f1419] shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${ga.hex}, ${ga.hexAccent})`,
                      }}
                      aria-hidden="true"
                    >
                      {g.shortName}
                    </span>
                    <span className="flex flex-col min-w-0 leading-tight">
                      <span className={`text-sm font-bold truncate ${isActive ? "text-gold2" : "text-ink"}`}>
                        {g.name}
                      </span>
                      <span className="text-[11px] text-muted truncate">
                        {g.era[locale] ?? g.era.en}
                      </span>
                    </span>
                    {isActive && (
                      <span
                        className="ml-auto text-[10px] font-bold uppercase tracking-widest text-gold2 shrink-0"
                        aria-hidden="true"
                      >
                        ●
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd easytech-wiki && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add easytech-wiki/components/GameSwitcher.tsx
git commit -m "feat(nav): add GameSwitcher component with pill and block variants"
```

---

## Task 5 — Refactor `TopBar` to a client component with game-aware nav

**Files:**
- Modify: `easytech-wiki/components/TopBar.tsx`

- [ ] **Step 1: Replace the file contents**

Overwrite `easytech-wiki/components/TopBar.tsx` with this exact content:

```tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/config";
import LocaleSwitcher from "./LocaleSwitcher";
import SearchBar from "./SearchBar";
import MobileNavDrawer from "./MobileNavDrawer";
import GameSwitcher from "./GameSwitcher";
import {
  GAME_ACCENTS,
  getGameFromPath,
  getGameNav,
  getHubNav,
  isNavItemActive,
} from "@/lib/nav";

const BRAND_TAGLINE: Record<Locale, string> = {
  fr: "La référence FR",
  en: "The EN reference",
  de: "Das DE Referenzwiki",
};

export function TopBar() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const rawPath = usePathname(); // e.g. `/world-conqueror-4/generaux`
  const currentGame = getGameFromPath(rawPath);
  const tagline = BRAND_TAGLINE[locale] ?? BRAND_TAGLINE.en;

  const navItems = currentGame ? getGameNav(currentGame, locale) : getHubNav();
  const accent = currentGame ? GAME_ACCENTS[currentGame] : null;

  return (
    <div className="bg-gradient-to-b from-[#0a0e13] to-[#121820] border-b border-border sticky top-0 z-50">
      <div className="max-w-[1320px] mx-auto flex items-center gap-3 lg:gap-5 px-4 lg:px-6 py-3 lg:py-3.5">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 lg:gap-2.5 font-extrabold text-lg tracking-wide no-underline shrink-0"
        >
          <div
            className="w-9 h-9 rounded-md grid place-items-center text-[#0f1419] font-black text-lg font-serif"
            style={{ background: "linear-gradient(135deg, #d4a44a, #c8372d)" }}
            aria-hidden="true"
          >
            W
          </div>
          <div className="hidden sm:block">
            <div className="text-gold2 leading-none">{t("site.shortTitle")}</div>
            <div className="text-muted text-[11px] font-semibold uppercase tracking-widest mt-0.5">
              {tagline}
            </div>
          </div>
        </Link>

        {/* Game switcher — visible on desktop next to the brand */}
        <div className="hidden lg:block shrink-0">
          <GameSwitcher currentGame={currentGame} variant="pill" />
        </div>

        {/* Desktop nav — game-specific sections */}
        <nav
          className="hidden lg:flex items-stretch gap-0.5 flex-1"
          aria-label={currentGame ? `${currentGame.toUpperCase()} navigation` : "Site navigation"}
        >
          {navItems.map((item) => {
            const active = isNavItemActive(item, rawPath);
            return (
              <Link
                key={item.key}
                href={item.href as any}
                aria-current={active ? "page" : undefined}
                className={`relative px-3 py-2 text-sm font-semibold rounded-md no-underline transition-colors ${
                  active
                    ? "text-gold2 bg-gold/5"
                    : "text-dim hover:bg-gold/10 hover:text-gold2"
                }`}
              >
                {item.label[locale] ?? item.label.en}
                {active && (
                  <span
                    className="absolute left-3 right-3 -bottom-[1px] h-[2px] rounded-full"
                    style={{
                      background: accent
                        ? `linear-gradient(90deg, ${accent.hex}, ${accent.hexAccent})`
                        : "linear-gradient(90deg, #d4a44a, #f2c265)",
                    }}
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Search grows to fill remaining space on mobile */}
        <div className="flex flex-1 min-w-0">
          <SearchBar />
        </div>

        {/* Locale switcher — desktop only; mobile drawer has its own */}
        <div className="hidden lg:block shrink-0">
          <LocaleSwitcher />
        </div>

        {/* Mobile drawer trigger */}
        <div className="lg:hidden shrink-0">
          <MobileNavDrawer currentGame={currentGame} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd easytech-wiki && npx tsc --noEmit
```
Expected: TWO categories of error — (a) *zero* errors from `TopBar.tsx` itself, (b) errors in `MobileNavDrawer.tsx` because the prop contract changed. That's intentional — Task 6 fixes it. If `TopBar.tsx` itself has errors, fix them before moving on.

- [ ] **Step 3: Commit** (even though the build is red — MobileNavDrawer is the next task and the commit message is honest about it)

```bash
git add easytech-wiki/components/TopBar.tsx
git commit -m "refactor(nav): convert TopBar to client component with game-aware nav

Breaks MobileNavDrawer prop contract; next commit updates the drawer."
```

---

## Task 6 — Refactor `MobileNavDrawer` to read pathname and render game-aware sections

**Files:**
- Modify: `easytech-wiki/components/MobileNavDrawer.tsx`

- [ ] **Step 1: Replace the file contents**

Overwrite `easytech-wiki/components/MobileNavDrawer.tsx` with this exact content:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/config";
import LocaleSwitcher from "./LocaleSwitcher";
import GameSwitcher from "./GameSwitcher";
import {
  GAME_ACCENTS,
  getGameNav,
  getHubNav,
  isNavItemActive,
  type GameSlug,
} from "@/lib/nav";

const DRAWER_LABELS: Record<Locale, {
  open: string;
  close: string;
  nav: string;
  menu: string;
  language: string;
  section: string;
  hubSection: string;
}> = {
  fr: { open: "Ouvrir le menu",  close: "Fermer le menu",  nav: "Menu de navigation", menu: "Menu", language: "Langue",   section: "Sections du jeu", hubSection: "Accueil" },
  en: { open: "Open menu",       close: "Close menu",      nav: "Navigation menu",    menu: "Menu", language: "Language", section: "Game sections",   hubSection: "Home"    },
  de: { open: "Menü öffnen",     close: "Menü schließen",  nav: "Navigationsmenü",    menu: "Menü", language: "Sprache",  section: "Spielbereiche",   hubSection: "Start"   },
};

interface MobileNavDrawerProps {
  currentGame: GameSlug | null;
}

export default function MobileNavDrawer({ currentGame }: MobileNavDrawerProps) {
  const [open, setOpen] = useState(false);
  const locale = useLocale() as Locale;
  const rawPath = usePathname();
  const labels = DRAWER_LABELS[locale] ?? DRAWER_LABELS.en;
  const navItems = currentGame ? getGameNav(currentGame, locale) : getHubNav();
  const accent = currentGame ? GAME_ACCENTS[currentGame] : null;

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
        aria-label={labels.open}
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
          aria-label={labels.nav}
          className="fixed inset-0 z-[60] flex"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/70" />
          <div
            className="relative ml-auto h-full w-[min(340px,88vw)] bg-panel border-l border-border flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-gold2 font-bold uppercase tracking-widest text-sm">
                {labels.menu}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={labels.close}
                className="grid place-items-center w-11 h-11 rounded-md text-muted hover:text-gold2 hover:bg-gold/10 cursor-pointer text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Game switcher — full-width block variant */}
            <div className="px-4 pt-4 pb-3">
              <GameSwitcher currentGame={currentGame} variant="block" />
            </div>

            {/* Game-specific sections */}
            <div className="px-4">
              <div className="text-muted text-[10px] font-bold uppercase tracking-widest mb-2">
                {currentGame ? labels.section : labels.hubSection}
              </div>
              <nav className="flex flex-col gap-0.5" aria-label={labels.section}>
                {navItems.map((item) => {
                  const active = isNavItemActive(item, rawPath);
                  return (
                    <Link
                      key={item.key}
                      href={item.href as any}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 px-3 py-3 rounded-md text-base font-semibold no-underline transition-colors ${
                        active
                          ? "bg-gold/10 text-gold2"
                          : "text-dim hover:bg-gold/10 hover:text-gold2"
                      }`}
                    >
                      {active && (
                        <span
                          className="w-1 h-5 rounded-full shrink-0"
                          style={{
                            background: accent
                              ? `linear-gradient(180deg, ${accent.hex}, ${accent.hexAccent})`
                              : "#f2c265",
                          }}
                          aria-hidden="true"
                        />
                      )}
                      <span>{item.label[locale] ?? item.label.en}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Locale switcher pinned at the bottom */}
            <div className="mt-auto px-4 py-4 border-t border-border">
              <div className="text-muted text-[11px] font-semibold uppercase tracking-widest mb-2">
                {labels.language}
              </div>
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd easytech-wiki && npx tsc --noEmit
```
Expected: no errors across the whole project. If there are errors, they're probably in pages that passed old props to `TopBar` — in the current code no page passes props, but double-check.

- [ ] **Step 3: Run the nav logic test again to make sure nothing regressed**

Run:
```bash
cd easytech-wiki && npx tsx scripts/test-nav.ts
```
Expected: `all tests passed`.

- [ ] **Step 4: Commit**

```bash
git add easytech-wiki/components/MobileNavDrawer.tsx
git commit -m "refactor(nav): game-aware mobile drawer with embedded GameSwitcher"
```

---

## Task 7 — Visual verification in dev server

**Files:** none modified.

- [ ] **Step 1: Start the dev server**

Run:
```bash
cd easytech-wiki && npm run dev
```
Expected: server listening on `http://localhost:3000`.

- [ ] **Step 2: Verify each context renders correctly**

Open in the browser one at a time and confirm the listed behavior:

| URL | Game switcher shows | Nav items |
|-----|--------------------|-----------|
| `http://localhost:3000/fr` | "Choisir un jeu" / `⁙` | Classements only |
| `http://localhost:3000/fr/world-conqueror-4` | WC4 pill (gold) | Accueil (active, gold underline), Généraux, Unités d'élite, Empire du Scorpion, Compétences, Technologies, Comparateur, Mises à jour, Guides |
| `http://localhost:3000/fr/world-conqueror-4/generaux` | WC4 pill | Généraux row active with gold underline |
| `http://localhost:3000/en/great-conqueror-rome/roman-conquest` | GCR pill (crimson) | Roman Conquest active with crimson underline |
| `http://localhost:3000/de/european-war-6/technologies` | EW6 pill (indigo) | Technologien active with indigo underline |

- [ ] **Step 3: Verify the Game Switcher popover**

On `/fr/world-conqueror-4`, click the WC4 pill. Confirm:
- Popover opens, shows all three games (WC4, GCR, EW6).
- WC4 row is marked active (`●` marker, gold text, non-clickable).
- Clicking GCR navigates to `/fr/great-conqueror-rome`; after navigation, the pill shows GCR (crimson) and nav has Conquête romaine.
- `Escape` closes the popover.
- Clicking outside closes it.

- [ ] **Step 4: Verify mobile drawer at 375px width**

Resize the viewport to 375 × 812 (iPhone SE). On `/fr/world-conqueror-4/unites-elite`:
- Hamburger is visible, desktop nav is hidden.
- Tap hamburger → drawer slides in from the right.
- Game switcher block shows WC4 (name + era).
- Sections list: Accueil, Généraux, Unités d'élite (active, with crimson-gradient bar? — WC4 gold-gradient bar), Empire du Scorpion, Compétences, Technologies, Comparateur, Mises à jour, Guides.
- Tapping the block game switcher opens the popover from inside the drawer; picking GCR navigates, drawer closes automatically (body scroll was restored, no frozen state).

- [ ] **Step 5: Verify locale switching preserves context**

On `/en/great-conqueror-rome/generals`, open the desktop locale switcher and pick `FR`. Confirm:
- URL becomes `/fr/great-conqueror-rome/generaux`.
- Nav is still GCR-themed.
- Nav labels are now French.

- [ ] **Step 6: Verify production build**

Stop the dev server, then run:
```bash
cd easytech-wiki && npm run build
```
Expected: build completes successfully (the repo has had long build times recorded in prior sessions — allow up to 20 minutes). Watch for any new SSR/SSG errors originating from `components/TopBar.tsx`, `components/MobileNavDrawer.tsx`, `components/GameSwitcher.tsx`, or `lib/nav.ts`.

- [ ] **Step 7: Commit the verification record (no code changes — skip commit if nothing needs tweaking)**

If all checks pass, nothing to commit. If you had to tweak a label or style, amend into the previous commit with:

```bash
git add -u && git commit --amend --no-edit
```

---

## Task 8 — Final clean-up + PR prep

**Files:** none modified (just git hygiene).

- [ ] **Step 1: Confirm tree is clean**

Run:
```bash
cd easytech-wiki && git status
```
Expected: `nothing to commit, working tree clean`.

- [ ] **Step 2: Confirm the test still passes**

Run:
```bash
cd easytech-wiki && npx tsx scripts/test-nav.ts
```
Expected: `all tests passed`.

- [ ] **Step 3: Confirm TypeScript still compiles**

Run:
```bash
cd easytech-wiki && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Push the branch**

Run (replace `<branch>` with the branch you created for this work):
```bash
git push origin <branch>
```

Expected: branch is pushed; user opens the PR via their standard workflow.

---

## Post-implementation notes

**Why `TopBar` had to become a client component:** It's imported directly by ~50 page files, with no wrapping per-game layout. Adding a `currentGame` prop would mean edits to every one of those pages (and every new page going forward). Reading `usePathname()` in a client component is the DRY alternative — all game context flows from the URL, no prop-drilling, no middleware plumbing. The only visible regression from this change is that the TopBar HTML is no longer in the initial SSR response for the bar *contents*, but the brand, search, and locale chrome still render server-side because the surrounding layout does, and the nav links are not critical for SEO (every game's internal pages are already linked from sitemap + hub pages).

**Why the nav uses `matchSegments` instead of a single canonical href:** `createSharedPathnamesNavigation` uses shared canonical paths, but `next-intl` middleware rewrites URLs per locale (e.g. `/en/world-conqueror-4/generals` instead of `/en/world-conqueror-4/generaux`). `usePathname()` returns the *visible* localized path, so active-state matching has to accept both the FR canonical segment and the EN/DE rewrite.

**Future work (out of scope):**
- Add per-game favicons (currently one global `apple-icon.png`).
- Add a faint tint to the entire page background when inside a specific game, keyed off `GAME_ACCENTS[game].hex` at very low opacity.
- Break out a `components/nav/` folder if the nav grows more files.
