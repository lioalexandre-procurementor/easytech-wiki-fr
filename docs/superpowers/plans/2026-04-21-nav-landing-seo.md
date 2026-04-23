# EasyTech Wiki Nav/Landing/SEO Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the landing page with live data sections, replace static flat nav with game-contextual TopBar, add JSON-LD SEO schemas, and add a WC4 generals tier list.

**Architecture:** `TopBar` (server component) reads the middleware-injected `x-pathname` request header to detect the active game and renders contextual nav items from `lib/nav-items.ts`. A new `GameSwitcher` client component handles the dropdown. Landing page gains VotePodium, GuideCard, UpdateCard, FaqAccordion sections. A generic `GameHub` component unifies the three hub pages. JSON-LD schemas use a thin `JsonLd` script injector.

**Note on spec deviation:** The approved spec called for per-game `layout.tsx` files to pass `activeGameSlug`. Instead, this plan uses a middleware `x-pathname` header (already a common pattern in this repo per observation 1776). This avoids modifying ~40 existing game pages and is architecturally cleaner. TopBar stays a pure server component either way.

**Tech Stack:** Next.js 14 App Router, next-intl 3.x (fr/en/de), Tailwind CSS, Upstash Redis (`@upstash/redis`), TypeScript

**Verification:** No test framework is installed. Each task ends with `npm run build` to verify TypeScript correctness, plus a `npm run dev` visual check where noted.

---

## File Map

### New files
```
middleware.ts                                          (modify — add x-pathname header)
lib/nav-items.ts                                       (create)
components/JsonLd.tsx                                  (create)
components/GameSwitcher.tsx                            (create)
components/VotePodium.tsx                              (create)
components/GuideCard.tsx                               (create)
components/UpdateCard.tsx                              (create)
components/FaqAccordion.tsx                            (create)
components/BreadcrumbNav.tsx                           (create)
components/GameHub.tsx                                 (create)
components/TierList.tsx                                (create)
content/tier-list/wc4-generals.json                   (create)
app/[locale]/world-conqueror-4/tier-list/page.tsx     (create)
```

### Modified files
```
messages/en.json                     add: site.tagline, nav.drawer.*, home.*, home.faq.*
messages/fr.json                     same
messages/de.json                     same
components/TopBar.tsx                remove inline dicts; add game detection + GameSwitcher
components/MobileNavDrawer.tsx       remove DRAWER_LABELS; add game context row
app/[locale]/page.tsx                full rewrite with new sections
app/[locale]/layout.tsx              add Organization + WebSite JSON-LD
app/[locale]/world-conqueror-4/page.tsx   remove sidebar; use GameHub; add BreadcrumbNav
app/[locale]/great-conqueror-rome/page.tsx    use GameHub; add BreadcrumbNav
app/[locale]/european-war-6/page.tsx          use GameHub; add BreadcrumbNav
app/sitemap.ts                       add tier-list route; verify alternates
lib/nav-items.ts                     (also modified in Task 20 to add tier-list item)
```

---

## Task 1 — Middleware: forward x-pathname to server components

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Update middleware to inject x-pathname**

Replace the full content of `middleware.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale, localePrefix, pathnames } from "@/src/i18n/config";
import { verifySession, ADMIN_COOKIE } from "@/lib/admin-session";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
  pathnames,
});

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const session = await verifySession(req.cookies.get(ADMIN_COOKIE)?.value);
    if (!session) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const intlResponse = intlMiddleware(req);

  // If next-intl wants to redirect (missing locale prefix, etc.) honour it as-is
  if (intlResponse.headers.has("location")) return intlResponse;

  // Forward raw pathname to server components so TopBar can detect the active game
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Preserve locale cookie set by next-intl
  intlResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") response.headers.append("set-cookie", value);
  });

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 2: Build to verify no TypeScript errors**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -20
```

Expected: build succeeds (same as before — we only changed the middleware logic).

- [ ] **Step 3: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add middleware.ts
git commit -m "feat: forward x-pathname header to server components for game detection"
```

---

## Task 2 — Translation migration: move inline locale dicts to messages/*.json

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/fr.json`
- Modify: `messages/de.json`

- [ ] **Step 1: Add new keys to messages/en.json**

In `messages/en.json`, make these additions (do NOT remove existing keys):

Under `"site"`, add:
```json
"tagline": "The EN reference"
```

Under `"nav"`, add:
```json
"drawer": {
  "open": "Open menu",
  "close": "Close menu",
  "nav": "Navigation menu",
  "menu": "Menu",
  "language": "Language"
}
```

Add a new top-level `"home"` section:
```json
"home": {
  "h1": "The English Wiki for EasyTech Games",
  "lede": "Strategies, elite units, generals and guides for World Conqueror 4, Great Conqueror Rome, European War 6 and all EasyTech studio games — entirely in English.",
  "cta": "🏅 Explore World Conqueror 4",
  "otherGames": "Other available games",
  "gamesHeading": "Games covered",
  "available": "● Available",
  "soon": "○ Soon",
  "explore": "Explore →",
  "statsEliteUnits": "Elite units",
  "statsGenerals": "Generals",
  "statsVotes": "Community votes",
  "statsTechs": "Technologies",
  "guidesHeading": "Latest WC4 Guides",
  "guidesViewAll": "All guides →",
  "updatesHeading": "Latest WC4 Updates",
  "updatesViewAll": "All updates →",
  "podiumHeading": "🗳 Favourite generals — WC4",
  "podiumVoteCta": "Vote now →",
  "faqHeading": "Frequently Asked Questions",
  "faq": [
    { "q": "What is World Conqueror 4?", "a": "World Conqueror 4 is a turn-based strategy game developed by EasyTech. It lets you command armies across different historical eras from WW2 to the Cold War." },
    { "q": "What is the difference between WC4, GCR and EW6?", "a": "World Conqueror 4 covers WW2 and the Cold War, Great Conqueror: Rome covers ancient Rome, and European War 6: 1914 covers the Napoleonic era through WW1." },
    { "q": "Is this wiki official?", "a": "No. EasyTech Wiki is an independent community wiki, not affiliated with or endorsed by EasyTech Studio." },
    { "q": "Which platforms support WC4?", "a": "World Conqueror 4 is available on iOS and Android, free to download with optional in-app purchases." }
  ]
}
```

- [ ] **Step 2: Add same keys to messages/fr.json**

Under `"site"`, add:
```json
"tagline": "La référence FR"
```

Under `"nav"`, add:
```json
"drawer": {
  "open": "Ouvrir le menu",
  "close": "Fermer le menu",
  "nav": "Menu de navigation",
  "menu": "Menu",
  "language": "Langue"
}
```

Add top-level `"home"`:
```json
"home": {
  "h1": "Le Wiki FR des jeux EasyTech",
  "lede": "Stratégies, unités d'élite, généraux et guides pour World Conqueror 4, Great Conqueror Rome, European War 6 et tous les jeux du studio EasyTech — entièrement en français.",
  "cta": "🏅 Explorer World Conqueror 4",
  "otherGames": "Autres jeux disponibles",
  "gamesHeading": "Jeux couverts",
  "available": "● Disponible",
  "soon": "○ Bientôt",
  "explore": "Explorer →",
  "statsEliteUnits": "Unités d'élite",
  "statsGenerals": "Généraux",
  "statsVotes": "Votes communauté",
  "statsTechs": "Technologies",
  "guidesHeading": "Derniers guides WC4",
  "guidesViewAll": "Tous les guides →",
  "updatesHeading": "Dernières mises à jour WC4",
  "updatesViewAll": "Toutes les mises à jour →",
  "podiumHeading": "🗳 Généraux préférés — WC4",
  "podiumVoteCta": "Voter maintenant →",
  "faqHeading": "Questions fréquentes",
  "faq": [
    { "q": "Qu'est-ce que World Conqueror 4 ?", "a": "World Conqueror 4 est un jeu de stratégie au tour par tour développé par EasyTech. Il vous permet de commander des armées à travers différentes époques historiques, de la Seconde Guerre mondiale à la Guerre froide." },
    { "q": "Quelle est la différence entre WC4, GCR et EW6 ?", "a": "World Conqueror 4 couvre la Seconde Guerre mondiale et la Guerre froide, Great Conqueror Rome l'Antiquité romaine, et European War 6 la période napoléonienne et la Première Guerre mondiale." },
    { "q": "Ce wiki est-il officiel ?", "a": "Non. EasyTech Wiki est un wiki communautaire indépendant, non affilié à EasyTech Studio ni endorsé par celui-ci." },
    { "q": "Sur quels appareils puis-je jouer à WC4 ?", "a": "World Conqueror 4 est disponible sur iOS et Android, gratuitement avec des achats intégrés optionnels." }
  ]
}
```

- [ ] **Step 3: Add same keys to messages/de.json**

Under `"site"`, add:
```json
"tagline": "Das DE Referenzwiki"
```

Under `"nav"`, add:
```json
"drawer": {
  "open": "Menü öffnen",
  "close": "Menü schließen",
  "nav": "Navigationsmenü",
  "menu": "Menü",
  "language": "Sprache"
}
```

Add top-level `"home"`:
```json
"home": {
  "h1": "Das deutsche Wiki für EasyTech-Spiele",
  "lede": "Strategien, Elite-Einheiten, Generäle und Guides zu World Conqueror 4, Great Conqueror Rome, European War 6 und allen Spielen des EasyTech-Studios — vollständig auf Deutsch.",
  "cta": "🏅 World Conqueror 4 entdecken",
  "otherGames": "Andere verfügbare Spiele",
  "gamesHeading": "Abgedeckte Spiele",
  "available": "● Verfügbar",
  "soon": "○ Bald",
  "explore": "Entdecken →",
  "statsEliteUnits": "Elite-Einheiten",
  "statsGenerals": "Generäle",
  "statsVotes": "Community-Stimmen",
  "statsTechs": "Technologien",
  "guidesHeading": "Neueste WC4-Guides",
  "guidesViewAll": "Alle Guides →",
  "updatesHeading": "Neueste WC4-Updates",
  "updatesViewAll": "Alle Updates →",
  "podiumHeading": "🗳 Beliebteste Generäle — WC4",
  "podiumVoteCta": "Jetzt abstimmen →",
  "faqHeading": "Häufig gestellte Fragen",
  "faq": [
    { "q": "Was ist World Conqueror 4?", "a": "World Conqueror 4 ist ein rundenbasiertes Strategiespiel von EasyTech, in dem du Armeen durch historische Epochen von WW2 bis zum Kalten Krieg führst." },
    { "q": "Was ist der Unterschied zwischen WC4, GCR und EW6?", "a": "World Conqueror 4 behandelt WW2 und den Kalten Krieg, Great Conqueror: Rome das antike Rom, und European War 6: 1914 die napoleonische Ära bis zum Ersten Weltkrieg." },
    { "q": "Ist dieses Wiki offiziell?", "a": "Nein. EasyTech Wiki ist ein unabhängiges Community-Wiki, das nicht mit EasyTech Studio verbunden oder von diesem unterstützt wird." },
    { "q": "Auf welchen Plattformen ist WC4 verfügbar?", "a": "World Conqueror 4 ist kostenlos auf iOS und Android erhältlich, mit optionalen In-App-Käufen." }
  ]
}
```

- [ ] **Step 4: Build to verify JSON is valid**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && node -e "
  require('./messages/en.json');
  require('./messages/fr.json');
  require('./messages/de.json');
  console.log('All message files are valid JSON');
"
```

Expected: `All message files are valid JSON`

- [ ] **Step 5: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add messages/en.json messages/fr.json messages/de.json
git commit -m "feat: migrate inline locale dicts to next-intl messages"
```

---

## Task 3 — JsonLd utility component

**Files:**
- Create: `components/JsonLd.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/JsonLd.tsx
interface Props {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

- [ ] **Step 2: Build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -5
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add components/JsonLd.tsx
git commit -m "feat: add JsonLd script injector component"
```

---

## Task 4 — FaqAccordion component

**Files:**
- Create: `components/FaqAccordion.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/FaqAccordion.tsx
"use client";

import { useState } from "react";

interface FaqItem {
  q: string;
  a: string;
}

interface Props {
  items: FaqItem[];
  heading: string;
}

export function FaqAccordion({ items, heading }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section aria-label={heading} className="bg-panel border border-border rounded-lg p-5">
      <h2 className="text-gold2 font-bold text-lg mb-4">{heading}</h2>
      <dl className="divide-y divide-border">
        {items.map((item, i) => (
          <div key={i}>
            <dt>
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between py-3 text-left text-dim text-sm font-semibold hover:text-gold2 cursor-pointer"
                aria-expanded={openIndex === i}
              >
                <span>{item.q}</span>
                <span className="ml-4 shrink-0 text-muted text-base leading-none">
                  {openIndex === i ? "−" : "+"}
                </span>
              </button>
            </dt>
            {openIndex === i && (
              <dd className="pb-4 text-dim text-sm leading-relaxed">{item.a}</dd>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}
```

- [ ] **Step 2: Build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add components/FaqAccordion.tsx
git commit -m "feat: add FaqAccordion collapsible component"
```

---

## Task 5 — GuideCard and UpdateCard components

**Files:**
- Create: `components/GuideCard.tsx`
- Create: `components/UpdateCard.tsx`

- [ ] **Step 1: Create GuideCard**

```typescript
// components/GuideCard.tsx
import { Link } from "@/src/i18n/navigation";
import type { Guide, GuideCategory } from "@/lib/types";

const CATEGORY_COLORS: Record<GuideCategory, string> = {
  starter: "text-amber-400",
  systems: "text-blue-400",
  strategy: "text-green-400",
  meta: "text-purple-400",
};

interface Props {
  guide: Guide;
  locale: string;
}

export function GuideCard({ guide, locale }: Props) {
  const loc = locale as "fr" | "en" | "de";
  const title = guide.title[loc] ?? guide.title.en;
  const colorClass = CATEGORY_COLORS[guide.category] ?? "text-muted";
  const date = new Date(guide.publishedAt).toLocaleDateString(locale, {
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/world-conqueror-4/guides/${guide.slug}` as any}
      className="bg-panel border border-border rounded-lg p-4 flex flex-col gap-2 hover:border-gold/50 no-underline"
    >
      <span className={`text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>
        {guide.category}
      </span>
      <span className="text-dim text-sm font-semibold leading-snug line-clamp-2">{title}</span>
      <span className="text-muted text-[11px] mt-auto">
        {date} · {guide.readingTimeMinutes} min
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: Create UpdateCard**

```typescript
// components/UpdateCard.tsx
import { Link } from "@/src/i18n/navigation";
import type { UpdateEntry } from "@/lib/types";

interface Props {
  update: UpdateEntry;
  locale: string;
}

export function UpdateCard({ update, locale }: Props) {
  const loc = locale as "fr" | "en" | "de";
  const title = update.title[loc] ?? update.title.en;
  const summary = update.summary[loc] ?? update.summary.en;
  const date = new Date(update.date).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/world-conqueror-4/mises-a-jour/${update.slug}` as any}
      className="bg-panel border border-border rounded-lg p-4 flex flex-col gap-1.5 hover:border-gold/50 no-underline"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-gold2 text-sm font-bold">v{update.version}</span>
        <span className="text-muted text-[11px]">{date}</span>
      </div>
      <span className="text-dim text-sm font-semibold leading-snug">{title}</span>
      <span className="text-muted text-[11px] line-clamp-2">{summary}</span>
    </Link>
  );
}
```

- [ ] **Step 3: Build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add components/GuideCard.tsx components/UpdateCard.tsx
git commit -m "feat: add GuideCard and UpdateCard components"
```

---

## Task 6 — VotePodium server component

**Files:**
- Create: `components/VotePodium.tsx`

- [ ] **Step 1: Create VotePodium**

```typescript
// components/VotePodium.tsx
import Image from "next/image";
import { Link } from "@/src/i18n/navigation";
import type { GeneralData } from "@/lib/types";
import { BEST_GENERAL_PLACEHOLDER } from "@/lib/editorial-picks";

const PLACEHOLDER_THRESHOLD = 100;
const MEDALS = ["🥈", "🥇", "🥉"] as const; // podium order: 2nd left, 1st centre, 3rd right
const SIZES = [44, 52, 40] as const;         // matching visual heights

interface PodiumEntry {
  slug: string;
  votes: number;
  general: GeneralData | undefined;
}

interface Props {
  counts: Record<string, number>;
  total: number;
  generals: GeneralData[];
  locale: string;
  heading: string;
  voteCta: string;
}

export function VotePodium({ counts, total, generals, locale, heading, voteCta }: Props) {
  const generalBySlug = new Map(generals.map((g) => [g.slug, g]));

  let top3: PodiumEntry[];

  if (total < PLACEHOLDER_THRESHOLD) {
    top3 = BEST_GENERAL_PLACEHOLDER.slice(0, 3).map((slug) => ({
      slug,
      votes: 0,
      general: generalBySlug.get(slug),
    }));
  } else {
    top3 = Object.entries(counts)
      .filter(([slug]) => generalBySlug.has(slug))
      .map(([slug, votes]) => ({ slug, votes, general: generalBySlug.get(slug)! }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 3);
  }

  // Reorder for podium display: index 0=2nd place (left), 1=1st (centre), 2=3rd (right)
  const podium: (PodiumEntry | undefined)[] = [top3[1], top3[0], top3[2]];
  const medalLabels = ["🥈", "🥇", "🥉"];

  function generalName(entry: PodiumEntry): string {
    if (!entry.general) return entry.slug;
    return locale === "fr" ? entry.general.name : (entry.general.nameEn ?? entry.general.name);
  }

  return (
    <section
      aria-label={heading}
      className="bg-panel border border-gold/40 rounded-lg p-5 mb-8"
      style={{ background: "linear-gradient(135deg, rgba(212,164,74,0.08) 0%, rgba(200,55,45,0.05) 100%), #1a2230" }}
    >
      <h2 className="text-gold2 font-bold text-base mb-4 text-center">{heading}</h2>
      <div className="flex items-end justify-center gap-6 mb-4">
        {podium.map((entry, i) => {
          if (!entry) return null;
          const size = SIZES[i];
          const hasImg = !!entry.general?.image?.head;
          return (
            <Link
              key={entry.slug}
              href={`/world-conqueror-4/generaux/${entry.slug}` as any}
              className="flex flex-col items-center gap-1 no-underline group"
            >
              <div
                className="rounded-full overflow-hidden bg-panel border-2 border-border group-hover:border-gold transition-colors"
                style={{ width: size, height: size }}
              >
                {hasImg ? (
                  <Image
                    src={entry.general!.image!.head}
                    alt={generalName(entry)}
                    width={size}
                    height={size}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-lg">
                    👤
                  </div>
                )}
              </div>
              <span className="text-[10px] font-semibold text-dim group-hover:text-gold2 transition-colors text-center max-w-[60px] truncate">
                {generalName(entry)}
              </span>
              {total >= PLACEHOLDER_THRESHOLD && (
                <span className="text-[10px] text-muted">{entry.votes.toLocaleString()}</span>
              )}
              <span className="text-lg">{medalLabels[i]}</span>
            </Link>
          );
        })}
      </div>
      <div className="text-center">
        <Link
          href="/world-conqueror-4#best-general-vote"
          className="inline-block border border-gold/40 text-gold2 text-sm font-semibold px-4 py-2 rounded-md hover:bg-gold/10 no-underline"
        >
          {voteCta}
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add components/VotePodium.tsx
git commit -m "feat: add VotePodium server component for landing page"
```

---

## Task 7 — Landing page rewrite

**Files:**
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Replace the full content of app/[locale]/page.tsx**

```typescript
// app/[locale]/page.tsx
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { VotePodium } from "@/components/VotePodium";
import { GuideCard } from "@/components/GuideCard";
import { UpdateCard } from "@/components/UpdateCard";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { GAMES } from "@/lib/games";
import { getAllGuides } from "@/lib/guides";
import { getAllUpdates } from "@/lib/updates";
import { getAllEliteUnits, getAllGenerals } from "@/lib/units";
import { getAllTechSlugs } from "@/lib/tech";
import { getRedis, bestGeneralVoteKey } from "@/lib/redis";
import { locales } from "@/src/i18n/config";
import type { Metadata } from "next";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: t("h1"),
    description: t("lede"),
  };
}

export default async function Home({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations();
  const locale = params.locale;

  // Data
  const guides = getAllGuides().slice(0, 3);
  const updates = getAllUpdates().slice(0, 2);
  const eliteUnits = getAllEliteUnits();
  const generals = getAllGenerals();
  const techCount = getAllTechSlugs().length;

  // Vote counts (single Redis call shared by stats band + podium)
  const redis = getRedis();
  let voteCounts: Record<string, number> = {};
  let voteTotal = 0;
  if (redis) {
    const raw = await redis.hgetall(bestGeneralVoteKey("wc4"));
    if (raw) {
      for (const [k, v] of Object.entries(raw)) {
        const n = Number(v);
        voteCounts[k] = n;
        voteTotal += n;
      }
    }
  }

  const availableGames = GAMES.filter((g) => g.available && g.slug !== "world-conqueror-4");
  const soonGames = GAMES.filter((g) => !g.available);

  // FAQ JSON-LD
  type FaqItem = { q: string; a: string };
  const faqItems = t.raw("home.faq") as FaqItem[];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <TopBar />
      <JsonLd data={faqSchema} />
      <main className="max-w-[1320px] mx-auto px-6 py-10">

        {/* ① Hero */}
        <section
          className="bg-panel border border-border rounded-lg p-9 mb-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(212,164,74,0.12) 0%, rgba(200,55,45,0.08) 100%), #1a2230" }}
        >
          <h1 className="text-4xl text-gold2 font-extrabold mb-2">{t("home.h1")}</h1>
          <p className="text-dim text-base max-w-3xl mb-5">{t("home.lede")}</p>
          <Link
            href="/world-conqueror-4"
            className="inline-block bg-gold text-[#0f1419] px-5 py-2.5 rounded-md font-bold text-sm no-underline mb-4"
          >
            {t("home.cta")}
          </Link>
          {(availableGames.length > 0 || soonGames.length > 0) && (
            <div className="border-t border-white/7 pt-4">
              <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-3">
                {t("home.otherGames")}
              </p>
              <div className="flex flex-wrap gap-2">
                {availableGames.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/${g.slug}` as any}
                    className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-md px-3 py-2 no-underline hover:border-gold/30 group"
                  >
                    <div className="text-left">
                      <div className="text-dim text-xs font-semibold group-hover:text-gold2">{g.name}</div>
                      <div className="text-muted text-[10px]">{g.era}</div>
                    </div>
                    <span className="text-muted text-xs ml-1">→</span>
                  </Link>
                ))}
                {soonGames.map((g) => (
                  <div
                    key={g.slug}
                    className="flex items-center gap-2 bg-white/2 border border-white/5 rounded-md px-3 py-2 opacity-40"
                  >
                    <div className="text-left">
                      <div className="text-muted text-xs font-semibold">{g.name}</div>
                      <div className="text-muted text-[10px]">{t("home.soon")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ② Community stats band */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { value: eliteUnits.length, label: t("home.statsEliteUnits") },
            { value: generals.length, label: t("home.statsGenerals") },
            { value: voteTotal.toLocaleString(), label: t("home.statsVotes") },
            { value: techCount, label: t("home.statsTechs") },
          ].map(({ value, label }) => (
            <div key={label} className="bg-panel border border-border rounded-lg p-4 text-center">
              <div className="text-gold2 font-extrabold text-2xl">{value}</div>
              <div className="text-muted text-[11px] font-semibold uppercase tracking-widest mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* ③ Live vote podium */}
        <VotePodium
          counts={voteCounts}
          total={voteTotal}
          generals={generals}
          locale={locale}
          heading={t("home.podiumHeading")}
          voteCta={t("home.podiumVoteCta")}
        />

        {/* ④ Latest 3 WC4 guides */}
        {guides.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-dim">{t("home.guidesHeading")}</h2>
              <Link href="/world-conqueror-4/guides" className="text-gold2 text-sm font-semibold no-underline hover:underline">
                {t("home.guidesViewAll")}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {guides.map((guide) => (
                <GuideCard key={guide.slug} guide={guide} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* ⑤ Latest 2 WC4 updates */}
        {updates.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-dim">{t("home.updatesHeading")}</h2>
              <Link href="/world-conqueror-4/mises-a-jour" className="text-gold2 text-sm font-semibold no-underline hover:underline">
                {t("home.updatesViewAll")}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {updates.map((update) => (
                <UpdateCard key={update.slug} update={update} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* ⑥ Games grid */}
        <section className="mb-6">
          <h2 className="text-xl mb-4">{t("home.gamesHeading")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {GAMES.map((g) => (
              <div key={g.slug} className="bg-panel border border-border rounded-lg p-4">
                <span
                  className="text-xs uppercase tracking-widest font-bold"
                  style={{ color: g.available ? "#4a9d5f" : "#6b7685" }}
                >
                  {g.available ? t("home.available") : t("home.soon")}
                </span>
                <h3 className="text-gold2 font-bold mb-1 mt-2">{g.name}</h3>
                <p className="text-dim text-sm mb-3">{g.tagline}</p>
                <div className="text-muted text-[11px] uppercase tracking-widest">{g.era}</div>
                {g.available && (
                  <Link href={`/${g.slug}` as any} className="text-gold2 text-sm font-semibold mt-3 inline-block no-underline hover:underline">
                    {t("home.explore")}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ⑦ FAQ */}
        <FaqAccordion items={faqItems} heading={t("home.faqHeading")} />

      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -20
```

Expected: build succeeds. Fix any TypeScript errors before proceeding.

- [ ] **Step 3: Start dev server and visually verify the landing page**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run dev
```

Open `http://localhost:3000/fr` and verify:
- Hero shows WC4 CTA + dimmed GCR/EW6 links below
- Stats band shows 4 numbers
- Vote podium renders (placeholder or live data)
- 3 guide cards in a horizontal row
- 2 update cards side by side
- Games grid unchanged
- FAQ accordion expands/collapses

Stop dev server (`Ctrl+C`) when done.

- [ ] **Step 4: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add app/[locale]/page.tsx
git commit -m "feat: enrich landing page with live sections and secondary game links"
```

---

## Task 8 — lib/nav-items.ts

**Files:**
- Create: `lib/nav-items.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/nav-items.ts

export type NavItem = {
  href: string;
  label: string;
  disabled?: boolean;
};

type T = (key: string) => string;

export function getNavItemsForGame(gameSlug: string | null, t: T): NavItem[] {
  switch (gameSlug) {
    case "world-conqueror-4":
      return [
        { href: "/world-conqueror-4", label: t("nav.wc4Home") },
        { href: "/world-conqueror-4/guides", label: t("nav.guides") },
        { href: "/world-conqueror-4/unites-elite", label: t("nav.eliteUnits") },
        { href: "/world-conqueror-4/empire-du-scorpion", label: t("nav.scorpion") },
        { href: "/world-conqueror-4/generaux", label: t("nav.generals") },
        { href: "/world-conqueror-4/tier-list", label: "Tier List" },
        { href: "/world-conqueror-4/competences", label: t("nav.skills") },
        { href: "/world-conqueror-4/technologies", label: t("nav.technologies") },
        { href: "/leaderboards", label: t("nav.leaderboards") },
      ];
    case "great-conqueror-rome":
      return [
        { href: "/great-conqueror-rome", label: t("nav.gcrHome") },
        { href: "/great-conqueror-rome/guides", label: t("nav.guides") },
        { href: "/great-conqueror-rome/unites-elite", label: t("nav.eliteUnits") },
        { href: "/great-conqueror-rome/conquete-romaine", label: t("nav.gcrCampaign") },
        { href: "/great-conqueror-rome/generaux", label: t("nav.generals") },
        { href: "/great-conqueror-rome/competences", label: t("nav.skills") },
        { href: "/great-conqueror-rome/technologies", label: t("nav.technologies") },
        { href: "/leaderboards", label: t("nav.leaderboards") },
      ];
    case "european-war-6":
      return [
        { href: "/european-war-6", label: t("nav.ew6Home") },
        { href: "/european-war-6/guides", label: t("nav.guides") },
        { href: "/european-war-6/unites-elite", label: t("nav.eliteUnits") },
        { href: "/european-war-6/generaux", label: t("nav.generals") },
        { href: "/european-war-6/competences", label: t("nav.skills") },
        { href: "/european-war-6/technologies", label: t("nav.technologies") },
        { href: "/leaderboards", label: t("nav.leaderboards") },
      ];
    default:
      return [
        { href: "/leaderboards", label: t("nav.leaderboards") },
        { href: "/world-conqueror-4/guides", label: t("nav.guides") },
        { href: "/world-conqueror-4/mises-a-jour", label: t("nav.updates") },
      ];
  }
}
```

- [ ] **Step 2: Build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add lib/nav-items.ts
git commit -m "feat: add getNavItemsForGame — contextual nav item factory"
```

---

## Task 9 — GameSwitcher client component

**Files:**
- Create: `components/GameSwitcher.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/GameSwitcher.tsx
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
```

- [ ] **Step 2: Build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add components/GameSwitcher.tsx
git commit -m "feat: add GameSwitcher dropdown component"
```

---

## Task 10 — TopBar refactor: game detection + contextual nav

**Files:**
- Modify: `components/TopBar.tsx`

- [ ] **Step 1: Replace the full content of TopBar.tsx**

```typescript
// components/TopBar.tsx
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

  // Detect active game from the x-pathname header set by middleware
  const pathname = headers().get("x-pathname") ?? "";
  const segments = pathname.split("/").filter(Boolean);
  const gameSlug = segments[1] ?? null; // segments[0] is the locale prefix
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
        {/* Logo */}
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

        {/* Game switcher pill */}
        <GameSwitcher activeGameSlug={activeGame?.slug ?? null} />

        {/* Desktop contextual nav */}
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

        {/* Search fills remaining space */}
        <div className="flex flex-1 min-w-0">
          <SearchBar />
        </div>

        {/* Locale switcher desktop only */}
        <div className="hidden lg:block">
          <LocaleSwitcher />
        </div>

        {/* Mobile hamburger */}
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
```

- [ ] **Step 2: Build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -10
```

Expected: TypeScript error on `MobileNavDrawer` prop types (we haven't updated it yet). That's fine — fix in Task 11.

If the build errors on something else, fix it before proceeding.

- [ ] **Step 3: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add components/TopBar.tsx
git commit -m "feat: refactor TopBar — game detection via x-pathname, contextual nav"
```

---

## Task 11 — MobileNavDrawer refactor

**Files:**
- Modify: `components/MobileNavDrawer.tsx`

- [ ] **Step 1: Replace the full content of MobileNavDrawer.tsx**

```typescript
// components/MobileNavDrawer.tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
  const activeGame = GAMES.find((g) => g.slug === activeGameSlug) ?? null;

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
      {/* Hamburger trigger */}
      <button
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
          aria-label={drawerLabels.nav}
          className="fixed inset-0 z-[60] flex"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/70" />
          <div
            className="relative ml-auto h-full w-[min(320px,85vw)] bg-panel border-l border-border flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-gold2 font-bold uppercase tracking-widest text-sm">
                {drawerLabels.menu}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={drawerLabels.close}
                className="grid place-items-center w-11 h-11 rounded-md text-muted hover:text-gold2 hover:bg-gold/10 cursor-pointer text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Game context row */}
            <button
              type="button"
              onClick={() => setGameSwitcherOpen((o) => !o)}
              className="flex items-center justify-between px-4 py-3 border-b border-border text-left hover:bg-gold/5 cursor-pointer w-full"
            >
              <span className="text-gold2 font-semibold text-sm">
                🎮 {activeGame ? activeGame.name : "Choisir un jeu"}
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
                    className={`flex items-center justify-between px-6 py-2.5 text-sm no-underline hover:bg-gold/10 ${
                      g.slug === activeGameSlug ? "text-gold2 font-bold" : "text-dim"
                    }`}
                  >
                    {g.name}
                    {g.slug === activeGameSlug && <span className="text-[10px] text-green-400">● actif</span>}
                  </Link>
                ))}
                {GAMES.filter((g) => !g.available).map((g) => (
                  <div key={g.slug} className="flex items-center justify-between px-6 py-2.5 text-sm text-muted/40">
                    {g.name}
                    <span className="text-[10px]">bientôt</span>
                  </div>
                ))}
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="block px-6 py-2.5 text-sm text-blue-400 no-underline hover:bg-gold/10 border-t border-border"
                >
                  ← Accueil multi-jeux
                </Link>
              </div>
            )}

            {/* Game nav items */}
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
                    className="px-4 py-3 text-dim text-base font-semibold rounded-md hover:bg-gold/10 hover:text-gold2 no-underline"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            {/* Language switcher */}
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
```

- [ ] **Step 2: Build — should now succeed fully**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -10
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 3: Smoke test in dev server**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run dev
```

Visit `http://localhost:3000/fr/world-conqueror-4`. Verify:
- TopBar shows `[🎮 WC4 ▾]` pill
- Desktop nav shows WC4 contextual items (Guides, Unités, Scorpion, Généraux, Tier List, Compétences, Techs, Classements)
- Mobile hamburger opens drawer with WC4 context row at top, game switcher expands inline

Visit `http://localhost:3000/fr`. Verify:
- TopBar shows `[🎮 Jeux ▾]` pill
- Desktop nav shows generic items (Classements, Guides, Mises à jour)

Stop dev server (`Ctrl+C`).

- [ ] **Step 4: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add components/MobileNavDrawer.tsx
git commit -m "feat: refactor MobileNavDrawer — game context row + structured nav sections"
```

---

## Task 12 — Remove WC4 hub sidebar

**Files:**
- Modify: `app/[locale]/world-conqueror-4/page.tsx`

- [ ] **Step 1: Read the current WC4 hub page to identify the aside block**

Open `app/[locale]/world-conqueror-4/page.tsx`. The changes to make are:
1. Remove the `<aside>` element and its children (the entire sidebar block starting with `<aside className="bg-panel...">`)
2. Change the grid wrapper `<div className="... grid lg:grid-cols-[240px_1fr] gap-7">` to `<div className="...">`  (remove the grid classes)
3. Remove the `SidebarSection` and `SidebarLink` helper components defined at the bottom of the file (they exist only for the sidebar)

Specifically, find and remove these inline helpers at the bottom of the file:

```typescript
// These are defined at the end of world-conqueror-4/page.tsx — delete them:
function SidebarSection(...) { ... }
function SidebarLink(...) { ... }
```

And change the layout wrapper from:
```typescript
<div className="max-w-[1320px] mx-auto px-6 pb-20 grid lg:grid-cols-[240px_1fr] gap-7">
  <aside className="bg-panel border border-border rounded-lg p-4 h-fit lg:sticky lg:top-20">
    ...
  </aside>
  <main>
    ...
  </main>
</div>
```

To:
```typescript
<div className="max-w-[1320px] mx-auto px-6 pb-20">
  <main>
    ...
  </main>
</div>
```

- [ ] **Step 2: Build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -10
```

Expected: build succeeds. If TypeScript errors on SidebarSection/SidebarLink, they are already removed. If not yet removed, remove them now.

- [ ] **Step 3: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add "app/[locale]/world-conqueror-4/page.tsx"
git commit -m "feat: remove WC4 hub sidebar — nav migrated to contextual TopBar"
```

---

## Task 13 — BreadcrumbNav component with JSON-LD

**Files:**
- Create: `components/BreadcrumbNav.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/BreadcrumbNav.tsx
import { Link } from "@/src/i18n/navigation";
import { JsonLd } from "./JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://easytech-wiki.fr";

export interface BreadcrumbItem {
  label: string;
  href?: string; // omit for current page (last item)
}

interface Props {
  items: BreadcrumbItem[];
  locale: string;
  separator?: string;
}

export function BreadcrumbNav({ items, locale, separator = "›" }: Props) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href
        ? { item: `${SITE_URL}/${locale}${item.href}` }
        : {}),
    })),
  };

  return (
    <>
      <JsonLd data={schema} />
      <nav
        aria-label="Breadcrumb"
        className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted"
      >
        <ol className="flex items-center flex-wrap gap-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && (
                <span className="text-border mx-1">{separator}</span>
              )}
              {item.href ? (
                <Link href={item.href as any} className="text-dim hover:text-gold2 no-underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
```

- [ ] **Step 2: Build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add components/BreadcrumbNav.tsx
git commit -m "feat: add BreadcrumbNav component with BreadcrumbList JSON-LD"
```

---

## Task 14 — GameHub generic component

**Files:**
- Create: `components/GameHub.tsx`

- [ ] **Step 1: Create GameHub**

```typescript
// components/GameHub.tsx
import { Link } from "@/src/i18n/navigation";
import { UnitCard } from "@/components/UnitCard";
import type { GameMeta, UnitData, Category } from "@/lib/types";

interface CategoryCount {
  key: Category;
  count: number;
  label: string;
  icon?: string;
}

interface Props {
  game: GameMeta;
  locale: string;
  t: (key: string) => string;
  unitCount: number;
  factionUnitCount?: number;
  factionLabel?: string;
  generalCount: number;
  categoryCounts: CategoryCount[];
  topUnits: UnitData[];
  hubTranslationPrefix: string; // e.g. "wc4Hub" | "gcrHub" | "ew6Hub"
}

export function GameHub({
  game,
  locale,
  t,
  unitCount,
  factionUnitCount,
  factionLabel,
  generalCount,
  categoryCounts,
  topUnits,
  hubTranslationPrefix,
}: Props) {
  const p = hubTranslationPrefix;

  return (
    <>
      {/* Hero */}
      <section
        className="bg-panel border border-border rounded-lg p-9 mb-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(212,164,74,0.12) 0%, rgba(200,55,45,0.08) 100%), #1a2230" }}
      >
        <h1 className="text-4xl text-gold2 font-extrabold mb-2">{t(`${p}.h1`)}</h1>
        <p className="text-dim text-base max-w-3xl mb-5">{t(`${p}.tagline`)}</p>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href={`/${game.slug}/unites-elite` as any}
            className="inline-block bg-gold text-[#0f1419] px-5 py-2.5 rounded-md font-bold text-sm no-underline"
          >
            {t(`${p}.ctaExplore`)}
          </Link>
          <Link
            href={`/${game.slug}/guides` as any}
            className="inline-block bg-transparent text-gold2 px-5 py-2.5 rounded-md font-bold text-sm no-underline border border-gold"
          >
            {t(`${p}.ctaBeginner`)}
          </Link>
        </div>
        <div className="flex flex-wrap gap-7 mt-5">
          <Stat n={unitCount} l={t(`${p}.statEliteUnits`)} />
          {factionUnitCount !== undefined && factionLabel && (
            <Stat n={factionUnitCount} l={factionLabel} />
          )}
          <Stat n={generalCount} l={t(`${p}.statGenerals`)} />
        </div>
      </section>

      {/* Explore by category */}
      {categoryCounts.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-dim mb-3">{t(`${p}.exploreByCategory`)}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categoryCounts.map(({ key, count, label, icon }) => (
              <Link
                key={key}
                href={`/${game.slug}/unites-elite` as any}
                className="bg-panel border border-border rounded-lg p-4 hover:border-gold/50 no-underline"
              >
                {icon && <div className="text-2xl mb-2">{icon}</div>}
                <div className="text-dim font-semibold text-sm">{label}</div>
                <div className="text-muted text-xs mt-1">
                  {count} {t(`${p}.unitsCountSuffix`)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Most viewed units */}
      {topUnits.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-dim mb-3">{t(`${p}.mostViewed`)}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {topUnits.map((unit) => (
              <UnitCard key={unit.slug} unit={unit} gameSlug={game.slug} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Stat({ n, l }: { n: number | string; l: string }) {
  return (
    <div>
      <div className="text-gold2 font-extrabold text-xl">{n}</div>
      <div className="text-muted text-xs uppercase tracking-widest">{l}</div>
    </div>
  );
}
```

- [ ] **Step 2: Build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -10
```

If `UnitCard` doesn't accept a `gameSlug` prop, check the current `UnitCard` signature and adjust the call accordingly (it may use `unit.faction` to determine image paths).

- [ ] **Step 3: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add components/GameHub.tsx
git commit -m "feat: add generic GameHub component for WC4/GCR/EW6 hub pages"
```

---

## Task 15 — Refactor hub pages to use GameHub + BreadcrumbNav

**Files:**
- Modify: `app/[locale]/world-conqueror-4/page.tsx`
- Modify: `app/[locale]/great-conqueror-rome/page.tsx`
- Modify: `app/[locale]/european-war-6/page.tsx`

- [ ] **Step 1: Update WC4 hub page**

In `app/[locale]/world-conqueror-4/page.tsx`:

1. Add imports at the top:
```typescript
import { GameHub } from "@/components/GameHub";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
```

2. Replace the inline hero section + category grid + most-viewed units with `<GameHub>`. Keep `<BestGeneralVote>` and `<AdSlot>` in place below it.

3. Replace the inline breadcrumb `<div className="max-w-[1320px]...">...</div>` with:
```typescript
<BreadcrumbNav
  items={[
    { label: t("nav.home"), href: "/" },
    { label: t("nav.wc4") },
  ]}
  locale={params.locale}
/>
```

4. Add the `<GameHub>` call:
```typescript
<GameHub
  game={{ slug: "world-conqueror-4", name: "World Conqueror 4", shortName: "WC4", era: "", tagline: "", available: true }}
  locale={params.locale}
  t={(key) => t(key as any)}
  unitCount={standardUnits.length}
  factionUnitCount={scorpionUnits.length}
  factionLabel={t("wc4Hub.statScorpionUnits")}
  generalCount={generals.length}
  categoryCounts={counts.map((c) => ({ key: c.key, count: c.count, label: c.label ?? c.key, icon: c.icon }))}
  topUnits={top}
  hubTranslationPrefix="wc4Hub"
/>
```

- [ ] **Step 2: Update GCR hub page**

In `app/[locale]/great-conqueror-rome/page.tsx`, apply the same pattern:
- Import `GameHub` and `BreadcrumbNav`
- Replace inline breadcrumb with `<BreadcrumbNav items={[{ label: t("nav.home"), href: "/" }, { label: t("nav.gcr") }]} locale={params.locale} />`
- Replace hero/category/most-viewed sections with `<GameHub ... hubTranslationPrefix="gcrHub" />`

- [ ] **Step 3: Update EW6 hub page**

Same pattern with `hubTranslationPrefix="ew6Hub"`.

- [ ] **Step 4: Build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -20
```

Fix any TypeScript errors. Common issue: `categoryCounts` shape mismatch — check what `getCategoryMeta` returns for each game and adjust the mapping.

- [ ] **Step 5: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add "app/[locale]/world-conqueror-4/page.tsx" "app/[locale]/great-conqueror-rome/page.tsx" "app/[locale]/european-war-6/page.tsx"
git commit -m "feat: refactor hub pages to use GameHub + BreadcrumbNav with JSON-LD"
```

---

## Task 16 — Organization + WebSite JSON-LD in locale layout

**Files:**
- Modify: `app/[locale]/layout.tsx`

- [ ] **Step 1: Add JsonLd import and schema to the layout**

In `app/[locale]/layout.tsx`, add the import:
```typescript
import { JsonLd } from "@/components/JsonLd";
```

In the `LocaleLayout` component, before the `return`, define:
```typescript
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://easytech-wiki.fr";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "EasyTech Wiki",
  url: siteUrl,
  logo: `${siteUrl}/img/logo.png`,
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "EasyTech Wiki",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/${locale}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};
```

In the `<head>` section (after the existing script tags), add:
```typescript
<JsonLd data={organizationSchema} />
<JsonLd data={websiteSchema} />
```

- [ ] **Step 2: Build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add "app/[locale]/layout.tsx"
git commit -m "feat: add Organization and WebSite JSON-LD schemas to locale layout"
```

---

## Task 17 — Add BreadcrumbNav to hub list pages

This task adds `<BreadcrumbNav>` to the remaining game list pages that currently have inline breadcrumb markup (guides, updates, generals, technologies, units list pages).

**Files:**  
- Modify: Each game's list pages that have inline breadcrumb markup

- [ ] **Step 1: Find all inline breadcrumbs**

```bash
grep -rl "breadcrumb.separator\|py-3.5 text-xs text-muted" \
  "/Users/alexandrelio/Documents/SEO site project/easytech-wiki/app/[locale]/world-conqueror-4" \
  "/Users/alexandrelio/Documents/SEO site project/easytech-wiki/app/[locale]/great-conqueror-rome" \
  "/Users/alexandrelio/Documents/SEO site project/easytech-wiki/app/[locale]/european-war-6"
```

- [ ] **Step 2: For each file found, replace the inline breadcrumb block**

The pattern to replace is:
```typescript
<div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
  <Link href="/" className="text-dim">{t("nav.home")}</Link>{" "}
  <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
  <Link href="/world-conqueror-4" className="text-dim">{t("nav.wc4")}</Link>{" "}
  <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
  <span>...</span>
</div>
```

Replace with (example for WC4 guides list):
```typescript
<BreadcrumbNav
  items={[
    { label: t("nav.home"), href: "/" },
    { label: t("nav.wc4"), href: "/world-conqueror-4" },
    { label: t("nav.guides") },
  ]}
  locale={params.locale}
/>
```

Adjust `items` for each page's actual breadcrumb trail.

Add `import { BreadcrumbNav } from "@/components/BreadcrumbNav";` to each file.

- [ ] **Step 3: Build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add -A
git commit -m "feat: replace inline breadcrumbs with BreadcrumbNav + JSON-LD on list pages"
```

---

## Task 18 — Hreflang audit and sitemap tier-list route

**Files:**
- Modify: `app/sitemap.ts`

- [ ] **Step 1: Audit existing sitemap alternates**

```bash
grep -n "alternates\|languages\|x-default" "/Users/alexandrelio/Documents/SEO site project/easytech-wiki/app/sitemap.ts" | head -30
```

Verify that the sitemap generates `alternates.languages` with `fr`, `en`, `de`, and `x-default` for every URL entry. If any entry is missing alternates, add them following the existing pattern.

- [ ] **Step 2: Add tier-list route to sitemap**

Find where WC4 routes are defined in `app/sitemap.ts` and add an entry for the tier list:

```typescript
// Inside the WC4 section of sitemap.ts, add:
{
  url: `${baseUrl}/fr/world-conqueror-4/tier-list`,
  lastModified: new Date(),
  alternates: {
    languages: {
      fr: `${baseUrl}/fr/world-conqueror-4/tier-list`,
      en: `${baseUrl}/en/world-conqueror-4/tier-list`,
      de: `${baseUrl}/de/world-conqueror-4/tier-list`,
      "x-default": `${baseUrl}/fr/world-conqueror-4/tier-list`,
    },
  },
},
```

- [ ] **Step 3: Build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add app/sitemap.ts
git commit -m "feat: add tier-list to sitemap; audit hreflang alternates"
```

---

## Task 19 — Tier list data file and TierList component

**Files:**
- Create: `content/tier-list/wc4-generals.json`
- Create: `components/TierList.tsx`

- [ ] **Step 1: Create the tier data file**

```bash
mkdir -p "/Users/alexandrelio/Documents/SEO site project/easytech-wiki/content/tier-list"
```

Create `content/tier-list/wc4-generals.json`:

```json
{
  "S": ["manstein", "guderian", "rokossovsky", "simo-hayha", "de-gaulle", "patton"],
  "A": ["rommel", "montgomery", "zhukov", "yamamoto", "halsey", "malinovsky"],
  "B": ["macarthur", "bradley", "konev", "vasilevsky", "leclerc", "kesselring"],
  "C": ["alexander", "timoshenko", "antonescu", "messe", "kleist", "busch"]
}
```

> Note: Adjust slug names to match the actual `GeneralData.slug` values in `data/wc4/generals/`. Run `ls data/wc4/generals/` to get exact slugs and update the JSON accordingly.

- [ ] **Step 2: Create TierList component**

```typescript
// components/TierList.tsx
import Image from "next/image";
import { Link } from "@/src/i18n/navigation";
import type { GeneralData } from "@/lib/types";

const TIER_COLORS = {
  S: { bg: "bg-red-500/20", border: "border-red-500/50", text: "text-red-400", badge: "bg-red-500" },
  A: { bg: "bg-orange-500/20", border: "border-orange-500/50", text: "text-orange-400", badge: "bg-orange-500" },
  B: { bg: "bg-yellow-500/20", border: "border-yellow-500/50", text: "text-yellow-400", badge: "bg-yellow-500" },
  C: { bg: "bg-blue-500/20", border: "border-blue-500/50", text: "text-blue-400", badge: "bg-blue-500" },
} as const;

type TierKey = keyof typeof TIER_COLORS;

interface TierData {
  S: string[];
  A: string[];
  B: string[];
  C: string[];
}

interface Props {
  tierData: TierData;
  generals: GeneralData[];
  locale: string;
}

export function TierList({ tierData, generals, locale }: Props) {
  const generalBySlug = new Map(generals.map((g) => [g.slug, g]));

  function generalName(g: GeneralData): string {
    return locale === "fr" ? g.name : (g.nameEn ?? g.name);
  }

  return (
    <div className="flex flex-col gap-4">
      {(["S", "A", "B", "C"] as TierKey[]).map((tier) => {
        const color = TIER_COLORS[tier];
        const slugs = tierData[tier];
        const rows = slugs.map((slug) => generalBySlug.get(slug)).filter(Boolean) as GeneralData[];

        return (
          <div key={tier} className={`border ${color.border} rounded-lg overflow-hidden`}>
            <div className={`flex items-center gap-3 px-4 py-3 ${color.bg}`}>
              <span className={`w-8 h-8 rounded ${color.badge} text-white font-black text-lg flex items-center justify-center`}>
                {tier}
              </span>
              <span className={`font-bold text-sm ${color.text}`}>
                Tier {tier}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 p-4 bg-panel">
              {rows.length === 0 ? (
                <span className="text-muted text-sm">—</span>
              ) : (
                rows.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/world-conqueror-4/generaux/${g.slug}` as any}
                    className="flex flex-col items-center gap-1 w-16 no-underline group"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-panel border border-border group-hover:border-gold transition-colors">
                      {g.image?.head ? (
                        <Image
                          src={g.image.head}
                          alt={generalName(g)}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted">👤</div>
                      )}
                    </div>
                    <span className="text-[10px] text-dim group-hover:text-gold2 text-center truncate w-full">
                      {generalName(g)}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add content/tier-list/wc4-generals.json components/TierList.tsx
git commit -m "feat: add WC4 generals tier list data and TierList component"
```

---

## Task 20 — Tier list page + nav integration

**Files:**
- Create: `app/[locale]/world-conqueror-4/tier-list/page.tsx`

- [ ] **Step 1: Create the tier list page**

```typescript
// app/[locale]/world-conqueror-4/tier-list/page.tsx
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { TierList } from "@/components/TierList";
import { getAllGenerals } from "@/lib/units";
import { locales } from "@/src/i18n/config";
import type { Metadata } from "next";
import tierData from "@/content/tier-list/wc4-generals.json";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const titles: Record<string, string> = {
    fr: "Tier List Généraux WC4 — Classement S/A/B/C | EasyTech Wiki",
    en: "WC4 Generals Tier List — S/A/B/C Ranking | EasyTech Wiki",
    de: "WC4 Generäle Tier-Liste — S/A/B/C Ranking | EasyTech Wiki",
  };
  const descs: Record<string, string> = {
    fr: "Classement communautaire S/A/B/C de tous les généraux de World Conqueror 4, basé sur leurs stats, compétences et polyvalence.",
    en: "Community S/A/B/C ranking of all World Conqueror 4 generals, based on stats, skills and versatility.",
    de: "Community S/A/B/C-Ranking aller Generäle in World Conqueror 4, basierend auf Stats, Fähigkeiten und Vielseitigkeit.",
  };
  return {
    title: titles[locale] ?? titles.en,
    description: descs[locale] ?? descs.en,
  };
}

export default async function TierListPage({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations();
  const generals = getAllGenerals();

  const headings: Record<string, string> = {
    fr: "Tier List — Généraux WC4",
    en: "WC4 Generals Tier List",
    de: "WC4 Generäle Tier-Liste",
  };

  return (
    <>
      <TopBar />
      <BreadcrumbNav
        items={[
          { label: t("nav.home"), href: "/" },
          { label: t("nav.wc4"), href: "/world-conqueror-4" },
          { label: "Tier List" },
        ]}
        locale={params.locale}
      />
      <main className="max-w-[1320px] mx-auto px-6 pb-20">
        <h1 className="text-3xl text-gold2 font-extrabold mb-2">
          {headings[params.locale] ?? headings.en}
        </h1>
        <p className="text-dim text-sm mb-8 max-w-2xl">
          {params.locale === "fr"
            ? "Classement éditorial S/A/B/C de tous les généraux WC4. S = méta dominant, A = très fort, B = solide, C = situationnel."
            : params.locale === "de"
            ? "Redaktionelles S/A/B/C-Ranking aller WC4-Generäle. S = dominante Meta, A = sehr stark, B = solide, C = situativ."
            : "Editorial S/A/B/C ranking of all WC4 generals. S = dominant meta, A = very strong, B = solid, C = situational."}
        </p>
        <TierList
          tierData={tierData as any}
          generals={generals}
          locale={params.locale}
        />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Add tsconfig path for content imports (if needed)**

If the import `@/content/tier-list/wc4-generals.json` fails, add `resolveJsonModule: true` to `tsconfig.json` (it's usually already enabled in Next.js projects). Verify:

```bash
grep "resolveJsonModule" "/Users/alexandrelio/Documents/SEO site project/easytech-wiki/tsconfig.json"
```

If not present, add `"resolveJsonModule": true` inside `compilerOptions`.

- [ ] **Step 3: Build**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run build 2>&1 | tail -15
```

Expected: build succeeds and the tier-list route is included in the static build output.

- [ ] **Step 4: Verify tier list page in dev**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki" && npm run dev
```

Open `http://localhost:3000/fr/world-conqueror-4/tier-list`. Verify:
- Breadcrumb shows Home › WC4 › Tier List
- 4 tier rows (S / A / B / C) each showing general portraits
- TopBar shows WC4 contextual nav with "Tier List" active/highlighted

Stop dev server (`Ctrl+C`).

- [ ] **Step 5: Commit**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
git add "app/[locale]/world-conqueror-4/tier-list/page.tsx"
git commit -m "feat: add WC4 generals tier list page at /world-conqueror-4/tier-list"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Hero with secondary game links | Task 7 |
| Community stats band | Task 7 |
| Live vote podium (Top 3) | Tasks 6 + 7 |
| Latest 3 WC4 guides horizontal | Tasks 5 + 7 |
| Latest 2 WC4 updates | Tasks 5 + 7 |
| FAQ + FAQPage JSON-LD | Tasks 4 + 7 |
| BRAND_TAGLINE / DRAWER_LABELS / COPY → next-intl | Task 2 |
| GameSwitcher dropdown | Task 9 |
| getNavItemsForGame() | Task 8 |
| TopBar contextual + game detection | Tasks 1 + 10 |
| MobileNavDrawer game context row | Task 11 |
| Remove WC4 sidebar | Task 12 |
| BreadcrumbNav + BreadcrumbList JSON-LD | Task 13 |
| Generic GameHub | Task 14 |
| Refactor WC4/GCR/EW6 hub pages | Task 15 |
| Organization + WebSite JSON-LD | Task 16 |
| Breadcrumbs on all hub/list pages | Task 17 |
| Hreflang audit + tier-list in sitemap | Task 18 |
| Tier list data + TierList component | Task 19 |
| Tier list page + nav integration | Task 20 |

**Type consistency check:**

- `NavItem` is defined in `lib/nav-items.ts` and imported in `MobileNavDrawer.tsx` ✓
- `BreadcrumbItem` is defined in `BreadcrumbNav.tsx` ✓
- `VotePodium` receives `counts: Record<string,number>` and `generals: GeneralData[]` — matches what landing page fetches ✓
- `GuideCard` receives `guide: Guide` and `locale: string` — matches `getAllGuides()` return type ✓
- `UpdateCard` receives `update: UpdateEntry` and `locale: string` — matches `getAllUpdates()` return type ✓
- `getNavItemsForGame(slug, t)` — `t` typed as `(key: string) => string`, called in TopBar as `(key) => t(key as any)` ✓

**Placeholder scan:** No TBD, TODO, or vague steps. All code is complete. ✓

**Note:** Task 19 tier list JSON uses general slugs that must match actual filesystem slugs. The task explicitly instructs the implementer to run `ls data/wc4/generals/` and verify. ✓
