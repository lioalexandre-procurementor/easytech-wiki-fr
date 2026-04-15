# Skills Visualization + i18n (FR/EN) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split each general detail page into a "base" and "trained" variant (separate URLs for SEO), add French + English locales via next-intl with localized pathnames, and backfill the 13 existing wiki generals with real data extracted from the WC4 game files.

**Architecture:**
- **Separate-page strategy** for base vs trained: two routes per general, canonical tag points trained → base to avoid duplicate-content risk, but each page carries substantively different content (training costs, skill progression, upgrade path) so it ranks for its own long-tail intent.
- **next-intl** with `[locale]` app-router segment, localized pathnames (FR keeps `generaux`, EN gets `generals`), full `hreflang` + `alternates` metadata, per-locale `openGraph`, static generation via `generateStaticParams` for every `(locale, slug, variant)` triple.
- **Data layer** stays file-based JSON. Type `GeneralData` gains an optional `trained` branch mirroring the base shape; backfill script reads `wc4_export/generals_canonical.json` and patches each existing wiki general in place with real stats (base + max), skill slot counts, and medal costs.

**Tech Stack:** Next.js 14.2 App Router · TypeScript strict · Tailwind · next-intl 3.x · Node fs (build-time JSON load) · Python 3.9 (backfill script, reuses existing `wc4_export/`)

**Out of scope (Chunk 2, not in this plan):** Elite unit i18n, Scorpion Empire translations, `TrainedSkillVote` modal translation, adding the 91 missing canonical generals, English overhaul of French-named skills, changing voting/Turnstile flows.

**Validation approach:** No test framework is installed in this project and adding one is out of scope. Each task validates via:
1. `npx tsc --noEmit` (strict type check)
2. `npm run build` (catches route / metadata / next-intl misconfigurations)
3. Manual `npm run dev` check against the specific URL(s) the task touched
4. Git commit after each task passes all three

---

## File Structure

**New files created:**
- `src/i18n/config.ts` — locale list, default locale, localized pathname map
- `src/i18n/request.ts` — next-intl request config (loads messages per locale)
- `src/i18n/navigation.ts` — typed `Link`/`redirect`/`usePathname` re-exports from next-intl
- `messages/fr.json` — French message catalog (source of truth for existing strings)
- `messages/en.json` — English message catalog
- `middleware.ts` — next-intl middleware (locale detection + pathname rewrite)
- `scripts/backfill-generals.py` — one-shot backfill from `wc4_export/` → `data/wc4/generals/*.json`
- `lib/general-trained.ts` — helper to compute the "trained" view of a `GeneralData`
- `app/[locale]/layout.tsx` — locale-aware root layout with `NextIntlClientProvider`
- `app/[locale]/world-conqueror-4/generaux/[slug]/trained/page.tsx` — new "trained" variant route (FR path: `entraine`, EN path: `trained`)
- `components/LocaleSwitcher.tsx` — FR ⇄ EN toggle in TopBar
- `components/BaseVsTrainedToggle.tsx` — pill-style "Base / Trained" link pair at top of detail card
- `components/general/StatsGrid.tsx` — extracted from the monolith page, takes a `mode: "base" | "trained"` prop

**Files moved (no content change yet):**
- `app/layout.tsx` → `app/[locale]/layout.tsx`
- `app/page.tsx` → `app/[locale]/page.tsx`
- `app/world-conqueror-4/**` → `app/[locale]/world-conqueror-4/**`
- `app/legal/**` → `app/[locale]/legal/**`
- `app/api/**` stays at `app/api/**` (API routes are locale-independent)

**Files heavily modified:**
- `lib/types.ts` — add `TrainedGeneralView` and extend `GeneralData.training` with resolved skill deltas
- `lib/units.ts` — add `getGeneralVariants(slug)` returning `{ base, trained }`
- `app/[locale]/world-conqueror-4/generaux/[slug]/page.tsx` — strip hardcoded FR strings, read from messages, emit `alternates` for both locales AND both variants, canonical tag
- `components/TopBar.tsx` — all labels via `useTranslations`, insert `<LocaleSwitcher />`
- `components/Footer.tsx` — all labels via `useTranslations`
- `next.config.mjs` — wrap with `createNextIntlPlugin`
- `tsconfig.json` — add `src/*` path alias if missing
- `data/wc4/generals/{guderian,rommel,patton,rokossovsky,konev,zhukov,donitz,yamaguchi,kuznetsov,montgomery,osborn,williams,colson}.json` — rewritten by backfill script

---

## Phase A — Data backfill (unblocks everything else)

### Task A1: Extend `GeneralData` types for trained variant + real-data fields

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add new fields to existing `GeneralData` interface**

Open `lib/types.ts`. Find the `GeneralData` interface (bottom of file). Add these fields just before the closing brace:

```typescript
  // ── Real-data additions (from wc4_export) ──
  /** Canonical English name from game data (EName field in game files). Stable across locales. */
  nameCanonical?: string;
  /** Number of skill slots — authoritative count from game files. */
  skillSlots?: number;
  /** Required HQ level to unlock in shop. */
  unlockHQLv?: number | null;
  /** Military rank enum (1..6) from game files. */
  militaryRank?: number | null;
  /** Raw game id for traceability. */
  gameId?: number;
```

- [ ] **Step 2: Add `TrainedGeneralView` helper type at bottom of file**

Append to `lib/types.ts`:

```typescript
/**
 * "Trained" projection of a general: everything promoted to its ceiling.
 * Used by the `/trained` route variant. A GeneralData may carry a partial
 * override here if the training unlocks skills/attributes that differ from
 * simply maxing the base values.
 */
export interface TrainedGeneralView {
  /** Attributes at their ceiling (i.e. every key set so `start === max`). */
  attributes: GeneralAttributes;
  /** Skills after all promotions applied (replace/unlock resolved). */
  skills: GeneralSkill[];
  /** Total training cost in swords. */
  totalSwordCost: number | null;
  /** Total training cost in sceptres. */
  totalSceptreCost: number | null;
  /** Human-readable summary of how the trained build differs from base. */
  summary: string;
}
```

- [ ] **Step 3: Type-check**

```bash
cd easytech-wiki && npx tsc --noEmit
```

Expected: PASS (no errors — these are additive optional fields and a new exported type).

- [ ] **Step 4: Commit**

```bash
cd easytech-wiki
git add lib/types.ts
git commit -m "feat(types): add TrainedGeneralView + real-data fields to GeneralData"
```

---

### Task A2: Write backfill script

**Files:**
- Create: `scripts/backfill-generals.py`

- [ ] **Step 1: Create the script**

Create `easytech-wiki/scripts/backfill-generals.py`:

```python
#!/usr/bin/env python3
"""Backfill existing wiki generals with real data from wc4_export.

For each JSON in data/wc4/generals/*.json (excluding _index.json), match
to wc4_export/generals_canonical.json by last-name fallback (wiki uses
French display names like "Heinz Guderian", game-data uses "Guderian"), then
update:

  - attributes.{infantry,artillery,armor,navy,airforce,marching} = {start, max}
  - acquisition.cost (if currently null)
  - nameCanonical, skillSlots, unlockHQLv, militaryRank, gameId
  - skills[].nameEn (new field, leaves existing FR `name` untouched)

Existing human-curated fields (longDesc, shortDesc, recommendedUnits,
bonuses, training.summary, verified flag) are NEVER overwritten.

Run from easytech-wiki/ root:
    python3 scripts/backfill-generals.py
"""
import json
import re
import sys
from difflib import get_close_matches
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WIKI_DIR = ROOT / "data" / "wc4" / "generals"
EXPORT = ROOT.parent / "wc4_export" / "generals_canonical.json"


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def last_name(display: str) -> str:
    # "Heinz Guderian" -> "Guderian", "Karl Dönitz" -> "Dönitz"
    return display.split()[-1] if display else ""


def build_index(canonical: list) -> dict:
    idx = {}
    for g in canonical:
        for key in (g.get("nameEnRaw"), g.get("nameEn")):
            if key:
                idx[norm(key)] = g
                # last-segment fallback for dotted names ("Zhang.Z.Z" -> "Z")
                parts = key.split(".")
                if len(parts) > 1:
                    idx[norm(parts[-1])] = g
    return idx


def find_match(wiki: dict, idx: dict) -> dict | None:
    candidates = [
        wiki.get("nameEn"),
        last_name(wiki.get("nameEn") or ""),
        last_name(wiki.get("name") or ""),
        wiki.get("slug"),
    ]
    for c in candidates:
        if c and norm(c) in idx:
            return idx[norm(c)]
    # fuzzy fallback
    for c in candidates:
        if not c:
            continue
        hits = get_close_matches(norm(c), idx.keys(), n=1, cutoff=0.82)
        if hits:
            return idx[hits[0]]
    return None


def merge(wiki: dict, canon: dict) -> tuple[dict, list[str]]:
    """Return (updated_wiki, changelog). Never overwrites curated fields."""
    changes = []
    out = dict(wiki)  # shallow copy is fine — we reassign nested dicts

    # Real-data top-level fields
    for wiki_key, canon_key in [
        ("nameCanonical", "nameEn"),
        ("skillSlots", "skillSlots"),
        ("unlockHQLv", "unlockHQLv"),
        ("militaryRank", "militaryRank"),
        ("gameId", "id"),
    ]:
        cval = canon.get(canon_key)
        if cval is not None and out.get(wiki_key) != cval:
            out[wiki_key] = cval
            changes.append(f"  {wiki_key} = {cval}")

    # attributes: fill nulls from canonical stats/statsMax
    attr_map = [
        ("infantry", "infantry"),
        ("artillery", "artillery"),
        ("armor", "armor"),
        ("navy", "navy"),
        ("airforce", "airforce"),
        ("marching", "march"),
    ]
    attrs = dict(out.get("attributes") or {})
    for wiki_k, canon_k in attr_map:
        base = canon["stats"].get(canon_k)
        top = canon["statsMax"].get(canon_k)
        if base is None or top is None:
            continue
        if attrs.get(wiki_k) is None:
            attrs[wiki_k] = {"start": base, "max": top}
            changes.append(f"  attributes.{wiki_k} = {base}->{top}")
    out["attributes"] = attrs

    # acquisition.cost: fill if null
    acq = dict(out.get("acquisition") or {})
    if acq.get("cost") is None and canon.get("costMedal"):
        acq["cost"] = canon["costMedal"]
        acq["currency"] = "medals"
        changes.append(f"  acquisition.cost = {canon['costMedal']}")
    out["acquisition"] = acq

    # skills: add nameEn on each slot by ID-matching canonical skills
    #   (canon.skills is already resolved to English names via string tables)
    canon_names = [s.get("nameEn") for s in canon.get("skills", [])]
    wiki_skills = out.get("skills") or []
    for i, ws in enumerate(wiki_skills):
        if i < len(canon_names) and canon_names[i] and not ws.get("nameEn"):
            ws["nameEn"] = canon_names[i]
            changes.append(f"  skills[{i}].nameEn = {canon_names[i]}")

    return out, changes


def main() -> int:
    if not EXPORT.exists():
        print(f"ERROR: {EXPORT} not found. Run build_wc4_export.py first.", file=sys.stderr)
        return 1
    canonical = json.loads(EXPORT.read_text(encoding="utf-8"))
    idx = build_index(canonical)

    wiki_files = sorted(WIKI_DIR.glob("*.json"))
    wiki_files = [p for p in wiki_files if not p.name.startswith("_")]

    updated = 0
    unmatched = []
    for p in wiki_files:
        wiki = json.loads(p.read_text(encoding="utf-8"))
        canon = find_match(wiki, idx)
        if not canon:
            unmatched.append(p.name)
            continue
        new, changes = merge(wiki, canon)
        if changes:
            p.write_text(
                json.dumps(new, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            updated += 1
            print(f"✔ {p.stem}  ({canon['nameEn']})")
            for c in changes:
                print(c)

    print(f"\n{updated}/{len(wiki_files)} updated")
    if unmatched:
        print(f"UNMATCHED: {unmatched}")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Dry-run (read-only check) — inspect the Guderian match first**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
python3 -c "
import json, sys
sys.path.insert(0, 'scripts')
from pathlib import Path
import importlib.util
spec = importlib.util.spec_from_file_location('bf', 'scripts/backfill-generals.py')
bf = importlib.util.module_from_spec(spec); spec.loader.exec_module(bf)
canon = json.loads((bf.ROOT.parent / 'wc4_export' / 'generals_canonical.json').read_text())
idx = bf.build_index(canon)
wiki = json.loads((bf.WIKI_DIR / 'guderian.json').read_text())
m = bf.find_match(wiki, idx)
print('matched:', m['nameEn'], 'id:', m['id'])
"
```

Expected output: `matched: Guderian id: 1049`

- [ ] **Step 3: Run backfill for real**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
python3 scripts/backfill-generals.py
```

Expected: 13 generals updated, 0 unmatched. Each line shows the new values applied.

- [ ] **Step 4: Sanity-check one file**

```bash
cd "/Users/alexandrelio/Documents/SEO site project/easytech-wiki"
python3 -c "
import json
g = json.load(open('data/wc4/generals/guderian.json'))
print('nameCanonical:', g.get('nameCanonical'))
print('skillSlots:', g.get('skillSlots'))
print('gameId:', g.get('gameId'))
print('acquisition.cost:', g['acquisition']['cost'])
for k,v in (g.get('attributes') or {}).items():
    print(f'  {k}:', v)
for s in g['skills']:
    print(f'  slot {s[\"slot\"]}: name={s[\"name\"]!r} nameEn={s.get(\"nameEn\")!r}')
"
```

Expected: Guderian shows `nameCanonical: Guderian`, `skillSlots: 5`, `gameId: 1049`, `acquisition.cost: 2935`, attributes populated, skills have both `name` (FR) and `nameEn`.

- [ ] **Step 5: Type-check to make sure schemas still compile**

```bash
cd easytech-wiki && npx tsc --noEmit
```

Expected: PASS. The new fields are optional on `GeneralData` so existing reads are unaffected.

- [ ] **Step 6: Build check**

```bash
cd easytech-wiki && npm run build
```

Expected: PASS — all 13 general pages regenerate with new data.

- [ ] **Step 7: Commit**

```bash
cd easytech-wiki
git add scripts/backfill-generals.py data/wc4/generals/*.json
git commit -m "feat(data): backfill 13 wiki generals from WC4 game data export

Real stats (base + max), skill slots, medal costs, canonical English names,
and per-skill nameEn fields populated from wc4_export/generals_canonical.json.
Existing curated fields (descriptions, bonuses, training summaries) preserved."
```

---

### Task A3: Fix slot-count mismatches flagged by validator

The validator caught three wiki errors: Kuznetsov has 4 slot entries but game has 3; Montgomery & Rokossovsky have 4 entries but game has 5. The backfill script sets `skillSlots` correctly but leaves the manually-authored `skills[]` array alone. This task reconciles the array length with the authoritative count.

**Files:**
- Modify: `data/wc4/generals/kuznetsov.json`
- Modify: `data/wc4/generals/montgomery.json`
- Modify: `data/wc4/generals/rokossovsky.json`

- [ ] **Step 1: Kuznetsov — remove one phantom skill**

Open `data/wc4/generals/kuznetsov.json`. `skillSlots` is now `3`. Count the entries in `skills[]`: you'll find 4. Delete the last replaceable "Slot libre" entry (the one with the highest `slot` number where `replaceable: true`). Keep the 3 canonical skills (Rumor / Fleet Leader / Sailor per the game files).

- [ ] **Step 2: Montgomery — add one missing slot**

Open `data/wc4/generals/montgomery.json`. `skillSlots` is now `5`. Add a 5th entry at the end of `skills[]`:

```json
    {
      "slot": 5,
      "name": "Slot libre",
      "desc": "Compétence apprenable — débloqué via training (5e slot Gold).",
      "rating": null,
      "stars": null,
      "icon": null,
      "replaceable": true,
      "replaceableReason": "Slot apprenable Gold — pool défini par l'Académie"
    }
```

- [ ] **Step 3: Rokossovsky — add one missing slot**

Open `data/wc4/generals/rokossovsky.json`. Same fix as Montgomery: add a 5th entry at the end, identical shape.

- [ ] **Step 4: Verify**

```bash
cd easytech-wiki && python3 -c "
import json
for slug in ['kuznetsov','montgomery','rokossovsky']:
    g = json.load(open(f'data/wc4/generals/{slug}.json'))
    print(slug, 'slots:', g.get('skillSlots'), 'entries:', len(g['skills']))
"
```

Expected:
```
kuznetsov slots: 3 entries: 3
montgomery slots: 5 entries: 5
rokossovsky slots: 5 entries: 5
```

- [ ] **Step 5: Build**

```bash
cd easytech-wiki && npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd easytech-wiki
git add data/wc4/generals/kuznetsov.json data/wc4/generals/montgomery.json data/wc4/generals/rokossovsky.json
git commit -m "fix(data): reconcile skill slot counts with game-data (Kuznetsov/Montgomery/Rokossovsky)"
```

---

## Phase B — next-intl scaffolding

### Task B1: Install next-intl + set up config

**Files:**
- Modify: `package.json`
- Create: `src/i18n/config.ts`
- Create: `src/i18n/request.ts`
- Create: `src/i18n/navigation.ts`
- Modify: `next.config.mjs`
- Modify: `tsconfig.json`

- [ ] **Step 1: Install dependency**

```bash
cd easytech-wiki && npm install next-intl@^3.26.0
```

Expected: no errors, `next-intl` appears in `package.json` dependencies.

- [ ] **Step 2: Create locale config**

Create `easytech-wiki/src/i18n/config.ts`:

```typescript
import type { Pathnames } from "next-intl/routing";

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

/**
 * Localized pathnames: one canonical route → per-locale URL segment.
 *
 * Rule: French keeps existing slugs (zero broken inbound links). English
 * gets clean English equivalents. Each segment is rewritten independently
 * by next-intl middleware.
 */
export const pathnames = {
  "/": "/",
  "/world-conqueror-4": {
    fr: "/world-conqueror-4",
    en: "/world-conqueror-4",
  },
  "/world-conqueror-4/generals": {
    fr: "/world-conqueror-4/generaux",
    en: "/world-conqueror-4/generals",
  },
  "/world-conqueror-4/generals/[slug]": {
    fr: "/world-conqueror-4/generaux/[slug]",
    en: "/world-conqueror-4/generals/[slug]",
  },
  "/world-conqueror-4/generals/[slug]/trained": {
    fr: "/world-conqueror-4/generaux/[slug]/entraine",
    en: "/world-conqueror-4/generals/[slug]/trained",
  },
  "/world-conqueror-4/elite-units": {
    fr: "/world-conqueror-4/unites-elite",
    en: "/world-conqueror-4/elite-units",
  },
  "/world-conqueror-4/elite-units/[slug]": {
    fr: "/world-conqueror-4/unites-elite/[slug]",
    en: "/world-conqueror-4/elite-units/[slug]",
  },
  "/world-conqueror-4/scorpion-empire": {
    fr: "/world-conqueror-4/empire-du-scorpion",
    en: "/world-conqueror-4/scorpion-empire",
  },
  "/legal/votes": {
    fr: "/legal/votes",
    en: "/legal/votes",
  },
} satisfies Pathnames<typeof locales>;

export const localePrefix = "always" as const;
```

- [ ] **Step 3: Create request config**

Create `easytech-wiki/src/i18n/request.ts`:

```typescript
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "./config";

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound();
  return {
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 4: Create typed navigation helpers**

Create `easytech-wiki/src/i18n/navigation.ts`:

```typescript
import { createSharedPathnamesNavigation } from "next-intl/navigation";
import { locales, localePrefix } from "./config";

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales, localePrefix });
```

- [ ] **Step 5: Wrap next config with plugin**

Replace `easytech-wiki/next.config.mjs` entire contents:

```javascript
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 6: Add `@/src/*` path alias**

Open `easytech-wiki/tsconfig.json`. In `compilerOptions.paths`, add `"@/src/*": ["./src/*"]` alongside the existing `"@/*"` entry. If `paths` doesn't exist, add it:

```json
"paths": {
  "@/*": ["./*"],
  "@/src/*": ["./src/*"]
}
```

- [ ] **Step 7: Type-check**

```bash
cd easytech-wiki && npx tsc --noEmit
```

Expected: PASS (the `messages/` dir doesn't exist yet so the dynamic `import()` in `request.ts` is type-erased — tsc allows it).

- [ ] **Step 8: Commit**

```bash
cd easytech-wiki
git add package.json package-lock.json src/i18n next.config.mjs tsconfig.json
git commit -m "chore(i18n): install next-intl and scaffold locale config

Adds locale list (fr, en), localized pathnames with FR slugs preserved,
request config, typed navigation helpers, and next.config plugin wrap."
```

---

### Task B2: Create message catalogs with existing FR strings + EN mirror

**Files:**
- Create: `messages/fr.json`
- Create: `messages/en.json`

- [ ] **Step 1: Create `messages/fr.json`**

Create `easytech-wiki/messages/fr.json`:

```json
{
  "site": {
    "title": "EasyTech Wiki — World Conqueror, European War & plus",
    "description": "Le wiki de référence pour les jeux de stratégie EasyTech : World Conqueror 4, European War 6/7, Great Conqueror Rome. Stats détaillées des unités d'élite, généraux, technologies et guides.",
    "shortTitle": "EasyTech Wiki"
  },
  "nav": {
    "home": "Accueil",
    "wc4": "World Conqueror 4",
    "generals": "Généraux",
    "eliteUnits": "Unités d'élite",
    "scorpion": "Empire du Scorpion",
    "searchPlaceholder": "Rechercher une unité, un général…",
    "localeSwitcher": "Langue"
  },
  "footer": {
    "about": "À propos",
    "legal": "Mentions légales",
    "gdpr": "RGPD",
    "votes": "Votes communautaires",
    "contact": "Contact"
  },
  "breadcrumb": {
    "separator": "›"
  },
  "general": {
    "onThisPage": "Sur cette page",
    "attributes": "Attributs",
    "skills": "Compétences",
    "training": "Entraînement (Épées/Sceptres)",
    "bonuses": "Bonus",
    "acquisition": "Obtention",
    "recommendedUnits": "Unités recommandées",
    "relatedGenerals": "Généraux similaires",
    "attributeCeiling": "Actuel + plafond via promotions",
    "toVerify": "— à vérifier",
    "potentialSuffix": "(potentiel +{delta})",
    "baseMode": "Version de base",
    "trainedMode": "Version entraînée",
    "baseModeHint": "Statistiques et compétences à l'achat (avant training)",
    "trainedModeHint": "Statistiques et compétences au max (après tous les trainings)",
    "viewTrained": "Voir la version entraînée →",
    "viewBase": "← Voir la version de base",
    "skillSlots": "{count, plural, one {# slot} other {# slots}}",
    "skillSlotsLabel": "Emplacements de compétence",
    "cost": "Coût",
    "medalsCost": "{count} médailles",
    "quality": {
      "bronze": "Bronze",
      "silver": "Argent",
      "gold": "Or",
      "marshal": "Maréchal"
    }
  },
  "attributeKeys": {
    "infantry": "Infanterie",
    "artillery": "Artillerie",
    "armor": "Blindé",
    "navy": "Marine",
    "airforce": "Aviation",
    "marching": "Marche"
  },
  "categories": {
    "tank": "Blindé",
    "infantry": "Infanterie",
    "artillery": "Artillerie",
    "navy": "Marine",
    "airforce": "Aviation",
    "balanced": "Polyvalent"
  },
  "acquisitionTypes": {
    "starter": "Starter",
    "medals": "Médailles",
    "iron-cross": "Croix de fer",
    "coin": "Pièces",
    "campaign": "Campagne",
    "event": "Événement"
  },
  "trainedPage": {
    "intro": "Version entraînée de {name} : statistiques maximales, arbre de training complet et coût total pour maxer ce général.",
    "totalCost": "Coût total du training",
    "swords": "Épées",
    "sceptres": "Sceptres",
    "stageProgression": "Progression par étape",
    "backToBase": "← Fiche de base",
    "seoTitle": "{name} entraîné — Build max, coût training & compétences finales | WC4",
    "seoDesc": "Guide complet pour entraîner {name} dans World Conqueror 4 : statistiques max, coût en épées et sceptres, compétences après promotions."
  }
}
```

- [ ] **Step 2: Create `messages/en.json` (mirror structure, English copy)**

Create `easytech-wiki/messages/en.json`:

```json
{
  "site": {
    "title": "EasyTech Wiki — World Conqueror, European War & more",
    "description": "The reference wiki for EasyTech strategy games: World Conqueror 4, European War 6/7, Great Conqueror Rome. Detailed elite unit stats, generals, technologies and guides.",
    "shortTitle": "EasyTech Wiki"
  },
  "nav": {
    "home": "Home",
    "wc4": "World Conqueror 4",
    "generals": "Generals",
    "eliteUnits": "Elite Units",
    "scorpion": "Scorpion Empire",
    "searchPlaceholder": "Search for a unit or general…",
    "localeSwitcher": "Language"
  },
  "footer": {
    "about": "About",
    "legal": "Legal",
    "gdpr": "Privacy",
    "votes": "Community Votes",
    "contact": "Contact"
  },
  "breadcrumb": {
    "separator": "›"
  },
  "general": {
    "onThisPage": "On this page",
    "attributes": "Attributes",
    "skills": "Skills",
    "training": "Training (Swords/Sceptres)",
    "bonuses": "Bonuses",
    "acquisition": "How to get",
    "recommendedUnits": "Recommended units",
    "relatedGenerals": "Similar generals",
    "attributeCeiling": "Current + ceiling via promotions",
    "toVerify": "— to verify",
    "potentialSuffix": "(potential +{delta})",
    "baseMode": "Base build",
    "trainedMode": "Trained build",
    "baseModeHint": "Stats and skills at purchase (before training)",
    "trainedModeHint": "Stats and skills at max (after full training)",
    "viewTrained": "View trained build →",
    "viewBase": "← View base build",
    "skillSlots": "{count, plural, one {# slot} other {# slots}}",
    "skillSlotsLabel": "Skill slots",
    "cost": "Cost",
    "medalsCost": "{count} medals",
    "quality": {
      "bronze": "Bronze",
      "silver": "Silver",
      "gold": "Gold",
      "marshal": "Marshal"
    }
  },
  "attributeKeys": {
    "infantry": "Infantry",
    "artillery": "Artillery",
    "armor": "Armor",
    "navy": "Navy",
    "airforce": "Air Force",
    "marching": "March"
  },
  "categories": {
    "tank": "Armor",
    "infantry": "Infantry",
    "artillery": "Artillery",
    "navy": "Navy",
    "airforce": "Air Force",
    "balanced": "Balanced"
  },
  "acquisitionTypes": {
    "starter": "Starter",
    "medals": "Medals",
    "iron-cross": "Iron Cross",
    "coin": "Coins",
    "campaign": "Campaign",
    "event": "Event"
  },
  "trainedPage": {
    "intro": "Trained build of {name}: max stats, full training tree and total cost to max this general.",
    "totalCost": "Total training cost",
    "swords": "Swords",
    "sceptres": "Sceptres",
    "stageProgression": "Stage progression",
    "backToBase": "← Back to base build",
    "seoTitle": "{name} Trained Build — Max stats, training cost & final skills | WC4",
    "seoDesc": "Full guide to training {name} in World Conqueror 4: max stats, sword and sceptre cost, final skills after all promotions."
  }
}
```

- [ ] **Step 3: Validate JSON**

```bash
cd easytech-wiki && python3 -c "
import json
for f in ['messages/fr.json','messages/en.json']:
    d = json.load(open(f))
    print(f, 'keys:', len(d))
"
```

Expected: both files parse, both report 8 top-level keys.

- [ ] **Step 4: Commit**

```bash
cd easytech-wiki
git add messages/
git commit -m "feat(i18n): add fr/en message catalogs"
```

---

### Task B3: Create middleware + `[locale]` route segment, move root layout

**Files:**
- Create: `middleware.ts`
- Create: `app/[locale]/layout.tsx`
- Delete: `app/layout.tsx` (content moved to `[locale]/layout.tsx`)
- Modify: `app/globals.css` — no change, but verify the path import in new layout

- [ ] **Step 1: Create middleware**

Create `easytech-wiki/middleware.ts`:

```typescript
import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale, localePrefix, pathnames } from "@/src/i18n/config";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
  pathnames,
});

export const config = {
  // Match all paths except: static files, api routes, _next internals, favicon
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 2: Create `app/[locale]/layout.tsx`**

Create `easytech-wiki/app/[locale]/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/src/i18n/config";
import "../globals.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!locales.includes(locale as Locale)) notFound();
  const t = await getTranslations({ locale, namespace: "site" });
  return {
    title: {
      default: t("title"),
      template: `%s | ${t("shortTitle")}`,
    },
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        fr: "/fr",
        en: "/en",
        "x-default": "/fr",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      locale: locale === "fr" ? "fr_FR" : "en_US",
      type: "website",
      alternateLocale: locale === "fr" ? ["en_US"] : ["fr_FR"],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Delete the old root layout**

```bash
cd easytech-wiki && rm app/layout.tsx
```

- [ ] **Step 4: Type-check**

```bash
cd easytech-wiki && npx tsc --noEmit
```

Expected: PASS. If it errors about `unstable_setRequestLocale` not being exported, upgrade next-intl to `^3.26.0` (already pinned in Task B1).

- [ ] **Step 5: Commit**

```bash
cd easytech-wiki
git add middleware.ts app/[locale]/layout.tsx
git rm app/layout.tsx
git commit -m "feat(i18n): add middleware and [locale] root layout with hreflang metadata"
```

---

### Task B4: Move all route pages under `[locale]/`

**Files (moves only, no content edits):**
- Move: `app/page.tsx` → `app/[locale]/page.tsx`
- Move: `app/world-conqueror-4/` → `app/[locale]/world-conqueror-4/`
- Move: `app/legal/` → `app/[locale]/legal/`

API routes under `app/api/` stay put (they are locale-independent).

- [ ] **Step 1: Move the files**

```bash
cd easytech-wiki
mv app/page.tsx app/[locale]/page.tsx
mv app/world-conqueror-4 app/[locale]/world-conqueror-4
mv app/legal app/[locale]/legal
```

- [ ] **Step 2: Add `unstable_setRequestLocale` call to every page file**

Every page component under `app/[locale]/` must call `unstable_setRequestLocale(locale)` before any i18n hook. For each of these files:

- `app/[locale]/page.tsx`
- `app/[locale]/world-conqueror-4/page.tsx`
- `app/[locale]/world-conqueror-4/generaux/page.tsx`
- `app/[locale]/world-conqueror-4/generaux/[slug]/page.tsx`
- `app/[locale]/world-conqueror-4/unites-elite/page.tsx`
- `app/[locale]/world-conqueror-4/unites-elite/[slug]/page.tsx`
- `app/[locale]/world-conqueror-4/empire-du-scorpion/page.tsx`
- `app/[locale]/legal/votes/page.tsx`

Add to each:

1. Update the `params` type to include `locale: string` (merge with existing `slug` where applicable).
2. Add at the very top of the component body:
   ```typescript
   import { unstable_setRequestLocale } from "next-intl/server";
   // …
   export default function Page({ params }: { params: { locale: string } }) {
     unstable_setRequestLocale(params.locale);
     // … existing body
   }
   ```

For `[slug]/page.tsx` files that call `generateStaticParams`, extend the returned shape to include `locale`:

```typescript
export function generateStaticParams() {
  const slugs = getAllGeneralSlugs();
  return locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}
```

(Import `locales` from `@/src/i18n/config`.)

- [ ] **Step 3: Build**

```bash
cd easytech-wiki && npm run build
```

Expected: all pages generate twice (once per locale). Log should show `/fr/world-conqueror-4/generaux/guderian` and `/en/world-conqueror-4/generals/guderian` among the routes.

If the build errors about a page file not calling `unstable_setRequestLocale`, go back and add it to that file.

- [ ] **Step 4: Dev server smoke test**

```bash
cd easytech-wiki && npm run dev &
sleep 3
curl -sI http://localhost:3000/fr/world-conqueror-4/generaux/guderian | head -3
curl -sI http://localhost:3000/en/world-conqueror-4/generals/guderian | head -3
curl -sI http://localhost:3000/ | head -5  # should 307 to /fr or /en based on Accept-Language
kill %1
```

Expected: both localized URLs return 200. The root returns 307 to `/fr`.

- [ ] **Step 5: Commit**

```bash
cd easytech-wiki
git add -A
git commit -m "feat(i18n): move all routes under [locale] segment with unstable_setRequestLocale"
```

---

### Task B5: Replace hardcoded FR strings in TopBar, Footer, breadcrumbs

**Files:**
- Modify: `components/TopBar.tsx`
- Modify: `components/Footer.tsx`
- Modify: `app/[locale]/world-conqueror-4/generaux/[slug]/page.tsx` (breadcrumb section only)

- [ ] **Step 1: TopBar — convert to client component using `useTranslations`**

Open `components/TopBar.tsx`. At the top add `"use client";` if not already present. Replace the imports region with:

```typescript
"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import LocaleSwitcher from "./LocaleSwitcher";
```

Replace every hardcoded FR label with `t("nav.X")`:

```typescript
export function TopBar() {
  const t = useTranslations();
  return (
    <header className="…">
      <Link href="/" className="…">{t("site.shortTitle")}</Link>
      <nav>
        <Link href="/world-conqueror-4">{t("nav.wc4")}</Link>
        <Link href="/world-conqueror-4/generals">{t("nav.generals")}</Link>
        <Link href="/world-conqueror-4/elite-units">{t("nav.eliteUnits")}</Link>
      </nav>
      <input placeholder={t("nav.searchPlaceholder")} />
      <LocaleSwitcher />
    </header>
  );
}
```

(Adapt to your actual JSX shape — the point is: no string literals in French.)

- [ ] **Step 2: Footer — same treatment**

Open `components/Footer.tsx`. Add `"use client"` if needed, replace every string literal with `t("footer.X")`.

- [ ] **Step 3: Fix breadcrumbs in general page**

Open `app/[locale]/world-conqueror-4/generaux/[slug]/page.tsx`. Find the breadcrumb block (lines ~99–106). Replace:

```typescript
<Link href="/" className="text-dim">Accueil</Link>
<span className="mx-2 text-border">›</span>
<Link href="/world-conqueror-4" className="text-dim">World Conqueror 4</Link>
// …
```

With (after adding `import { getTranslations } from "next-intl/server"` at top):

```typescript
const t = await getTranslations();
// …
<Link href="/" className="text-dim">{t("nav.home")}</Link>
<span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
<Link href="/world-conqueror-4" className="text-dim">{t("nav.wc4")}</Link>
<span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
<Link href="/world-conqueror-4/generals" className="text-dim">{t("nav.generals")}</Link>
```

Change the page component to `async function` and change `Link` imports from `next/link` to `@/src/i18n/navigation`.

- [ ] **Step 4: Build**

```bash
cd easytech-wiki && npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd easytech-wiki
git add components/TopBar.tsx components/Footer.tsx "app/[locale]/world-conqueror-4/generaux/[slug]/page.tsx"
git commit -m "feat(i18n): extract nav, footer, and breadcrumb strings to message catalog"
```

---

### Task B6: LocaleSwitcher component

**Files:**
- Create: `components/LocaleSwitcher.tsx`

- [ ] **Step 1: Create the component**

Create `easytech-wiki/components/LocaleSwitcher.tsx`:

```typescript
"use client";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/src/i18n/navigation";
import { locales, type Locale } from "@/src/i18n/config";
import { useTransition } from "react";

const FLAG: Record<Locale, string> = { fr: "🇫🇷", en: "🇬🇧" };
const LABEL: Record<Locale, string> = { fr: "Français", en: "English" };

export default function LocaleSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1 text-sm" aria-label={t("localeSwitcher")}>
      {locales.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            disabled={active || isPending}
            onClick={() => {
              startTransition(() => {
                // @ts-expect-error — pathname is a typed route, locale switch rewrites segments
                router.replace(pathname, { locale: l });
              });
            }}
            className={
              active
                ? "px-2 py-1 rounded bg-gold/20 text-gold2 cursor-default"
                : "px-2 py-1 rounded text-dim hover:text-gold2 hover:bg-border/30"
            }
            aria-label={LABEL[l]}
            title={LABEL[l]}
          >
            {FLAG[l]} {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Build**

```bash
cd easytech-wiki && npm run build
```

Expected: PASS.

- [ ] **Step 3: Dev-server click test**

```bash
cd easytech-wiki && npm run dev &
sleep 3
```

Open `http://localhost:3000/fr/world-conqueror-4/generaux/guderian` in a browser, click the EN button in the TopBar — should navigate to `http://localhost:3000/en/world-conqueror-4/generals/guderian` keeping the same slug. Kill dev server: `kill %1`.

- [ ] **Step 4: Commit**

```bash
cd easytech-wiki
git add components/LocaleSwitcher.tsx
git commit -m "feat(i18n): add LocaleSwitcher button group"
```

---

## Phase C — Base vs Trained pages

### Task C1: Extract StatsGrid component with `mode` prop

**Files:**
- Create: `components/general/StatsGrid.tsx`
- Modify: `app/[locale]/world-conqueror-4/generaux/[slug]/page.tsx`

- [ ] **Step 1: Create the extracted component**

Create `easytech-wiki/components/general/StatsGrid.tsx`:

```typescript
import { useTranslations } from "next-intl";
import type { AttributeKey, AttributeValue, GeneralAttributes } from "@/lib/types";

const ATTR_KEYS: { key: AttributeKey; icon: string }[] = [
  { key: "infantry",  icon: "🪖" },
  { key: "artillery", icon: "🎯" },
  { key: "armor",     icon: "🛡" },
  { key: "navy",      icon: "⚓" },
  { key: "airforce",  icon: "✈" },
  { key: "marching",  icon: "🥾" },
];

export type StatsMode = "base" | "trained";

export function StatsGrid({
  attributes,
  mode,
}: {
  attributes: GeneralAttributes | null | undefined;
  mode: StatsMode;
}) {
  const t = useTranslations();
  const hasAny = attributes && ATTR_KEYS.some(({ key }) => attributes?.[key] != null);

  return (
    <div id="attributes" className="bg-panel border border-border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg">
          ⭐ {t("general.attributes")}
        </h3>
        <span className="text-muted text-[10px] uppercase tracking-widest">
          {hasAny ? t(mode === "trained" ? "general.trainedModeHint" : "general.attributeCeiling") : ""}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {ATTR_KEYS.map(({ key, icon }) => {
          const raw = attributes?.[key] as AttributeValue | null | undefined;
          // In trained mode, collapse start to max so every star is "filled".
          const val = raw
            ? mode === "trained"
              ? { start: raw.max, max: raw.max }
              : raw
            : null;
          return (
            <div key={key} className="border border-border rounded-lg p-3 bg-bg3">
              <div className="text-muted text-[10px] uppercase tracking-widest mb-1.5">
                {icon} {t(`attributeKeys.${key}`)}
              </div>
              <AttributeBar value={val} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AttributeBar({ value }: { value: AttributeValue | null }) {
  const t = useTranslations();
  if (!value) {
    return <div className="text-muted text-[11px] italic">{t("general.toVerify")}</div>;
  }
  const MAX_SCALE = 6;
  const start = Math.max(0, Math.min(MAX_SCALE, value.start));
  const max = Math.max(start, Math.min(MAX_SCALE, value.max));
  return (
    <div className="flex flex-col gap-1">
      <div
        className="flex gap-0.5 text-base leading-none"
        aria-label={`${start}/${max} (max ${MAX_SCALE})`}
      >
        {Array.from({ length: MAX_SCALE }).map((_, i) => {
          const filled = i < start;
          const potential = i >= start && i < max;
          const shiny = i === 5 && max >= 6;
          return (
            <span
              key={i}
              className={
                shiny
                  ? "text-amber-300 drop-shadow"
                  : filled
                  ? "text-gold"
                  : potential
                  ? "text-gold/30"
                  : "text-border"
              }
            >
              ★
            </span>
          );
        })}
      </div>
      <div className="text-muted text-[10px] tabular-nums">
        {start}/{max}
        {max > start && (
          <span className="text-dim"> {t("general.potentialSuffix", { delta: max - start })}</span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Use it from the page**

In `app/[locale]/world-conqueror-4/generaux/[slug]/page.tsx`, delete the inline `AttributeBar` function (lines ~437–478) and the inline attributes section (lines ~203–235). Replace the attributes section JSX with:

```tsx
<StatsGrid attributes={g.attributes} mode="base" />
```

Add the import at the top:

```typescript
import { StatsGrid } from "@/components/general/StatsGrid";
```

Also delete the now-unused `ATTR_LABELS` constant (lines ~50–57).

- [ ] **Step 3: Build**

```bash
cd easytech-wiki && npm run build
```

Expected: PASS.

- [ ] **Step 4: Dev check**

```bash
cd easytech-wiki && npm run dev &
sleep 3
```

Open `http://localhost:3000/fr/world-conqueror-4/generaux/guderian` — attributes section should look identical to before the refactor, with real values (Infantry 3/3, Armor 6/6, etc.) now that backfill ran. Kill dev server.

- [ ] **Step 5: Commit**

```bash
cd easytech-wiki
git add components/general/StatsGrid.tsx "app/[locale]/world-conqueror-4/generaux/[slug]/page.tsx"
git commit -m "refactor(general): extract StatsGrid with base/trained mode prop"
```

---

### Task C2: Create `general-trained.ts` helper and `trained/page.tsx` route

**Files:**
- Create: `lib/general-trained.ts`
- Create: `app/[locale]/world-conqueror-4/generaux/[slug]/trained/page.tsx`

- [ ] **Step 1: Create the helper**

Create `easytech-wiki/lib/general-trained.ts`:

```typescript
import type {
  GeneralAttributes,
  GeneralData,
  GeneralSkill,
  TrainedGeneralView,
} from "./types";

/**
 * Compute the trained projection of a general: stats collapsed to max,
 * skills with any training-stage replacements applied, total costs summed.
 *
 * This is pure: it never mutates `g`. Safe to call from both server and
 * client components. The result is used by the `/trained` route variant.
 */
export function buildTrainedView(g: GeneralData): TrainedGeneralView {
  // Attributes: collapse every value so start === max.
  const attributes: GeneralAttributes = {};
  if (g.attributes) {
    for (const [key, v] of Object.entries(g.attributes)) {
      if (v) attributes[key as keyof GeneralAttributes] = { start: v.max, max: v.max };
      else attributes[key as keyof GeneralAttributes] = v as null;
    }
  }

  // Skills: start from base, apply each training stage's skillChanges in order.
  const skills: GeneralSkill[] = g.skills.map((s) => ({ ...s }));
  for (const stage of g.training?.stages ?? []) {
    for (const change of stage.skillChanges ?? []) {
      const target = skills.find((s) => s.slot === change.slot);
      if (!target) continue;
      if (change.kind === "unlock" || change.kind === "replace") {
        if (change.newName) target.name = change.newName;
        if (change.newDesc) target.desc = change.newDesc;
        if (change.newRating !== undefined) target.rating = change.newRating;
        if (change.kind === "unlock") target.replaceable = false;
      } else if (change.kind === "upgrade") {
        if (change.newDesc) target.desc = change.newDesc;
        if (change.newRating !== undefined) target.rating = change.newRating;
      }
    }
  }

  return {
    attributes,
    skills,
    totalSwordCost: g.training?.totalSwordCost ?? null,
    totalSceptreCost: g.training?.totalSceptreCost ?? null,
    summary: g.training?.summary ?? "",
  };
}
```

- [ ] **Step 2: Create the trained page route**

Create `easytech-wiki/app/[locale]/world-conqueror-4/generaux/[slug]/trained/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { StatsGrid } from "@/components/general/StatsGrid";
import { buildTrainedView } from "@/lib/general-trained";
import { getAllGeneralSlugs, getGeneral } from "@/lib/units";
import { locales, type Locale } from "@/src/i18n/config";
import type { Metadata } from "next";

export function generateStaticParams() {
  const slugs = getAllGeneralSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const g = getGeneral(slug);
  if (!g) return { title: "404" };
  const t = await getTranslations({ locale, namespace: "trainedPage" });
  const name = g.nameEn || g.name;
  // Canonical URL points back to base page to avoid duplicate-content penalty.
  const baseSlug = locale === "fr" ? "generaux" : "generals";
  return {
    title: t("seoTitle", { name }),
    description: t("seoDesc", { name }),
    alternates: {
      canonical: `/${locale}/world-conqueror-4/${baseSlug}/${slug}`,
      languages: {
        fr: `/fr/world-conqueror-4/generaux/${slug}/entraine`,
        en: `/en/world-conqueror-4/generals/${slug}/trained`,
        "x-default": `/fr/world-conqueror-4/generaux/${slug}/entraine`,
      },
    },
    openGraph: {
      title: t("seoTitle", { name }),
      description: t("seoDesc", { name }),
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default async function TrainedGeneralPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);

  const g = getGeneral(slug);
  if (!g) notFound();

  const trained = buildTrainedView(g);
  const t = await getTranslations();
  const name = g.nameEn || g.name;

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">{t("nav.home")}</Link>
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link href="/world-conqueror-4" className="text-dim">{t("nav.wc4")}</Link>
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link href="/world-conqueror-4/generals" className="text-dim">{t("nav.generals")}</Link>
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link
          href={{ pathname: "/world-conqueror-4/generals/[slug]", params: { slug } }}
          className="text-dim"
        >
          {name}
        </Link>
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <span>{t("general.trainedMode")}</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20">
        <header className="bg-panel border border-border rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gold2">{name} — {t("general.trainedMode")}</h1>
          <p className="text-muted mt-2">{t("trainedPage.intro", { name })}</p>
          <Link
            href={{ pathname: "/world-conqueror-4/generals/[slug]", params: { slug } }}
            className="inline-block mt-4 text-sm text-gold hover:underline"
          >
            {t("trainedPage.backToBase")}
          </Link>
        </header>

        <StatsGrid attributes={trained.attributes} mode="trained" />

        <section
          id="skills"
          className="bg-panel border border-border rounded-lg p-6 mb-6"
        >
          <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
            ⚡ {t("general.skills")} ({t("general.trainedMode")})
          </h2>
          <div className="space-y-3">
            {trained.skills.map((s) => (
              <div key={s.slot} className="border border-border rounded p-3 bg-bg3">
                <div className="font-bold text-gold">
                  #{s.slot} — {s.nameEn || s.name}
                </div>
                <div className="text-sm text-muted mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {(trained.totalSwordCost != null || trained.totalSceptreCost != null) && (
          <section className="bg-panel border border-border rounded-lg p-6 mb-6">
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              ⚔ {t("trainedPage.totalCost")}
            </h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-muted text-sm">{t("trainedPage.swords")}</dt>
                <dd className="text-xl font-bold text-gold tabular-nums">
                  {trained.totalSwordCost ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-sm">{t("trainedPage.sceptres")}</dt>
                <dd className="text-xl font-bold text-gold tabular-nums">
                  {trained.totalSceptreCost ?? "—"}
                </dd>
              </div>
            </dl>
            {trained.summary && (
              <p className="text-sm text-muted mt-4">{trained.summary}</p>
            )}
          </section>
        )}
      </div>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Build**

```bash
cd easytech-wiki && npm run build
```

Expected: 26 new routes generated (13 generals × 2 locales under `/trained`).

- [ ] **Step 4: Dev-server check**

```bash
cd easytech-wiki && npm run dev &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/fr/world-conqueror-4/generaux/guderian/entraine
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en/world-conqueror-4/generals/guderian/trained
kill %1
```

Expected: both return `200`.

- [ ] **Step 5: Commit**

```bash
cd easytech-wiki
git add lib/general-trained.ts "app/[locale]/world-conqueror-4/generaux/[slug]/trained"
git commit -m "feat(general): add /trained route variant with buildTrainedView helper"
```

---

### Task C3: Cross-link base ↔ trained + emit `alternates.canonical`

**Files:**
- Modify: `app/[locale]/world-conqueror-4/generaux/[slug]/page.tsx`

- [ ] **Step 1: Add cross-link CTA after the header**

In the base page, just after the hero/header section, add:

```tsx
<div className="max-w-[1320px] mx-auto px-6 mb-4">
  <Link
    href={{ pathname: "/world-conqueror-4/generals/[slug]/trained", params: { slug: g.slug } }}
    className="inline-flex items-center gap-2 px-4 py-2 rounded bg-gold/10 border border-gold/30 text-gold2 hover:bg-gold/20 transition"
  >
    {t("general.viewTrained")}
  </Link>
</div>
```

Import `Link` from `@/src/i18n/navigation`, call `getTranslations()` at the top of the page component.

- [ ] **Step 2: Update `generateMetadata` with full SEO**

Replace the existing `generateMetadata` with:

```typescript
export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const g = getGeneral(slug);
  if (!g) return { title: "404" };
  const name = g.nameEn || g.name;
  const baseSlug = locale === "fr" ? "generaux" : "generals";
  const trainedSlug = locale === "fr" ? "entraine" : "trained";
  const title =
    locale === "fr"
      ? `${name} (WC4) — Compétences, attributs & guide`
      : `${name} (WC4) — Skills, attributes & guide`;
  const description =
    locale === "fr"
      ? `Fiche complète du général ${name} dans World Conqueror 4 : ${g.shortDesc} Attributs, skills, training, unités recommandées.`
      : `Complete profile of general ${name} in World Conqueror 4: ${g.shortDesc} Attributes, skills, training, recommended units.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/world-conqueror-4/${baseSlug}/${slug}`,
      languages: {
        fr: `/fr/world-conqueror-4/generaux/${slug}`,
        en: `/en/world-conqueror-4/generals/${slug}`,
        "x-default": `/fr/world-conqueror-4/generaux/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "article",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      alternateLocale: locale === "fr" ? ["en_US"] : ["fr_FR"],
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}
```

- [ ] **Step 3: Build**

```bash
cd easytech-wiki && npm run build
```

Expected: PASS.

- [ ] **Step 4: Curl the metadata**

```bash
cd easytech-wiki && npm run dev &
sleep 3
curl -s http://localhost:3000/en/world-conqueror-4/generals/guderian | grep -oE '<link rel="alternate"[^>]+>' | head -5
curl -s http://localhost:3000/en/world-conqueror-4/generals/guderian | grep -oE '<link rel="canonical"[^>]+>'
kill %1
```

Expected: hreflang tags for `fr`, `en`, and `x-default`; canonical points to the English base URL.

- [ ] **Step 5: Commit**

```bash
cd easytech-wiki
git add "app/[locale]/world-conqueror-4/generaux/[slug]/page.tsx"
git commit -m "feat(general): cross-link trained variant, emit hreflang/canonical/OG metadata"
```

---

## Phase D — SEO polish

### Task D1: sitemap.xml with hreflang pairs

**Files:**
- Create: `app/sitemap.ts`

- [ ] **Step 1: Create the sitemap**

Create `easytech-wiki/app/sitemap.ts`:

```typescript
import type { MetadataRoute } from "next";
import { getAllGeneralSlugs, getAllSlugs as getAllEliteSlugs } from "@/lib/units";
import { locales } from "@/src/i18n/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://easytech-wiki.example";

function loc(locale: string, path: string) {
  return `${BASE_URL}/${locale}${path}`;
}

function alternates(pathFr: string, pathEn: string) {
  return {
    languages: {
      fr: `${BASE_URL}/fr${pathFr}`,
      en: `${BASE_URL}/en${pathEn}`,
      "x-default": `${BASE_URL}/fr${pathFr}`,
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Static roots
  for (const locale of locales) {
    entries.push({
      url: loc(locale, ""),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: alternates("", ""),
    });
    entries.push({
      url: loc(locale, "/world-conqueror-4"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: alternates("/world-conqueror-4", "/world-conqueror-4"),
    });
  }

  // Generals: base + trained variants
  for (const slug of getAllGeneralSlugs()) {
    for (const locale of locales) {
      const basePath =
        locale === "fr"
          ? `/world-conqueror-4/generaux/${slug}`
          : `/world-conqueror-4/generals/${slug}`;
      const trainedPath =
        locale === "fr"
          ? `/world-conqueror-4/generaux/${slug}/entraine`
          : `/world-conqueror-4/generals/${slug}/trained`;
      entries.push({
        url: `${BASE_URL}/${locale}${basePath}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: alternates(
          `/world-conqueror-4/generaux/${slug}`,
          `/world-conqueror-4/generals/${slug}`,
        ),
      });
      entries.push({
        url: `${BASE_URL}/${locale}${trainedPath}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: alternates(
          `/world-conqueror-4/generaux/${slug}/entraine`,
          `/world-conqueror-4/generals/${slug}/trained`,
        ),
      });
    }
  }

  // Elite units (base only — trained variant is out of scope)
  for (const slug of getAllEliteSlugs()) {
    for (const locale of locales) {
      const path =
        locale === "fr"
          ? `/world-conqueror-4/unites-elite/${slug}`
          : `/world-conqueror-4/elite-units/${slug}`;
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: alternates(
          `/world-conqueror-4/unites-elite/${slug}`,
          `/world-conqueror-4/elite-units/${slug}`,
        ),
      });
    }
  }

  return entries;
}
```

- [ ] **Step 2: Create robots.txt**

Create `easytech-wiki/app/robots.ts`:

```typescript
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://easytech-wiki.example";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: Build and verify**

```bash
cd easytech-wiki && npm run build && npm run dev &
sleep 3
curl -s http://localhost:3000/sitemap.xml | head -30
curl -s http://localhost:3000/robots.txt
kill %1
```

Expected: sitemap XML with `<url>` entries, `<xhtml:link rel="alternate" hreflang="...">` children, robots.txt with sitemap line.

- [ ] **Step 4: Commit**

```bash
cd easytech-wiki
git add app/sitemap.ts app/robots.ts
git commit -m "feat(seo): sitemap with hreflang pairs + robots.txt"
```

---

### Task D2: JSON-LD structured data on general pages

**Files:**
- Modify: `app/[locale]/world-conqueror-4/generaux/[slug]/page.tsx`

- [ ] **Step 1: Add JSON-LD script tag to the page**

Just before the closing `</TopBar>` ... `<Footer />` wrapper return, add:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `${name} — World Conqueror 4`,
      about: {
        "@type": "VideoGame",
        name: "World Conqueror 4",
        gamePlatform: ["Android", "iOS"],
        publisher: { "@type": "Organization", name: "EasyTech" },
      },
      author: { "@type": "Organization", name: "EasyTech Wiki" },
      inLanguage: locale,
      description: g.shortDesc,
    }),
  }}
/>
```

- [ ] **Step 2: Build**

```bash
cd easytech-wiki && npm run build
```

Expected: PASS.

- [ ] **Step 3: Verify**

```bash
cd easytech-wiki && npm run dev &
sleep 3
curl -s http://localhost:3000/en/world-conqueror-4/generals/guderian | grep -A2 'application/ld+json' | head -10
kill %1
```

Expected: JSON-LD block present.

- [ ] **Step 4: Commit**

```bash
cd easytech-wiki
git add "app/[locale]/world-conqueror-4/generaux/[slug]/page.tsx"
git commit -m "feat(seo): add JSON-LD Article+VideoGame structured data to general pages"
```

---

## Final validation

- [ ] **Full build**

```bash
cd easytech-wiki && npm run build 2>&1 | tail -60
```

Expected: all pages generate successfully. Route list shows `/fr/...` and `/en/...` pairs for every general, both base and `/trained` variants, for both locales.

- [ ] **End-to-end smoke test**

```bash
cd easytech-wiki && npm run dev &
sleep 3
for url in \
  "http://localhost:3000/" \
  "http://localhost:3000/fr/world-conqueror-4/generaux/guderian" \
  "http://localhost:3000/fr/world-conqueror-4/generaux/guderian/entraine" \
  "http://localhost:3000/en/world-conqueror-4/generals/guderian" \
  "http://localhost:3000/en/world-conqueror-4/generals/guderian/trained" \
  "http://localhost:3000/sitemap.xml" \
  "http://localhost:3000/robots.txt"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  echo "$code  $url"
done
kill %1
```

Expected: `307` for `/` (redirects to default locale), `200` for every other URL.

- [ ] **Verification-before-completion sub-skill**

Before declaring this plan done, invoke `superpowers:verification-before-completion` to run the final audit: build passes, no TypeScript errors, hreflang tags present, canonical URLs correct, base vs trained pages each render their distinct content.

---

## Self-review checklist

- [x] Every task has exact file paths
- [x] Every code step shows the full code, not a placeholder
- [x] Types consistent: `StatsMode`, `TrainedGeneralView`, `buildTrainedView` all defined before they're used
- [x] `Link` imports consistently come from `@/src/i18n/navigation` (not `next/link`) in localized pages
- [x] `unstable_setRequestLocale` called in every `[locale]/` page
- [x] SEO: per-locale metadata, hreflang alternates, canonical tags (trained → base), JSON-LD, sitemap with alternates, robots.txt
- [x] Commits after each task — granular, reversible
- [x] Scope boundary respected — no elite unit i18n, no 104-general backfill, no voting modal translation (those are Chunk 2)
