# SEO and GEO Growth Audit

Audit date: 2026-07-21

GEO in this report means generative/answer-engine optimization: making content easy for search engines and AI answer systems to identify, trust, extract, and cite.

## Executive assessment

The site has a valuable multilingual niche, many server-rendered entity pages, structured data, a sitemap, and strong internal subject depth. Those strengths are currently undermined by large-scale wrong-game duplication, canonical inconsistencies, thin placeholder pages, redirecting localized links, and weak citation/provenance signals.

The fastest ranking gain will not come from publishing more pages. It will come from reducing low-quality indexable URLs, fixing canonical/hreflang integrity, and making existing high-value WC4 pages more authoritative and citable.

## Technical SEO priorities

### P0: Remove wrong-game duplicate content

`lib/guides.ts:5` and `lib/updates.ts:5` are hard-coded to WC4, but EW6 and GCR routes consume those loaders.

Current scale:

- 17 WC4 guides create 102 wrong EW6/GCR localized detail URLs.
- 3 WC4 updates create 18 wrong EW6/GCR localized detail URLs.
- Hubs also list the wrong content with wrong-game metadata.

Impact: severe topical contamination, misleading schema, near duplicates, and quality loss across all three game silos.

Action: make content loaders game-scoped. Return an honest empty/noindex hub or 404 where content does not exist. Never relabel WC4 text as another game.

### P0: Stop localized internal links from redirecting

`src/i18n/navigation.ts:1-5` uses shared-path navigation even though localized path mappings exist in `src/i18n/config.ts`. Internal English/German links therefore often point to French route segments and rely on middleware redirects.

Impact: wasted crawl requests, inconsistent internal signals, and disagreement among links, canonicals, hreflang, and JSON-LD.

Action: use the pathname-aware next-intl navigation API and the central path map. Add a test that every rendered internal link returns 200 without redirecting.

### P0: Fix matchup canonicals or noindex the pages

WC4, GCR, and EW6 matchup pages hand-build canonicals with French `/comparateur/unites/` segments for all locales:

- `app/[locale]/world-conqueror-4/comparateur/unites/[matchup]/page.tsx:79-85`
- equivalent GCR/EW6 files at `:78-84`

Approximately 1,100 English/German pages point to redirecting canonicals. Across the three games, 1,650 localized matchup pages are statically generated, indexable, absent from the sitemap, and effectively orphaned.

Action: choose one model:

1. Curate a limited set of useful matchup pages with unique analysis, direct internal links, correct self-canonicals, and sitemap inclusion; or
2. Treat arbitrary combinations as a tool and apply `noindex,follow` without mass static generation.

The second option is safer until each comparison contains genuinely unique editorial value.

### P1: Reconcile sitemap, canonical, and indexability policy

Current mismatches:

- Leaderboard base URLs are in the sitemap, but page canonicals include query parameters.
- Matchup pages are indexable but omitted.
- Wrong-game GCR/EW6 guide/update routes exist but are omitted.
- Static `lastModified` often uses build time, making unchanged pages look newly updated on every deployment: `app/sitemap.ts:56-78,155-166`.

Action: create one route registry used by metadata, navigation, static params, and sitemap generation. CI should verify that every sitemap URL returns 200, does not redirect, is self-canonical, is indexable, and appears once.

### P1: Restore complete reciprocal hreflang

GCR and EW6 skill details omit German hreflang while WC4 includes it.

- GCR: `app/[locale]/great-conqueror-rome/competences/[slug]/page.tsx:57-65`
- EW6: `app/[locale]/european-war-6/competences/[slug]/page.tsx:59-67`

Breadcrumb schema also concatenates localized prefixes with French path segments through `components/BreadcrumbNav.tsx:17-26`, producing redirecting structured-data URLs.

Action: use the existing `pageAlternates()`/route mapping for all canonicals, hreflang links, visible breadcrumbs, and breadcrumb JSON-LD. Validate reciprocal clusters in CI.

### P1: Remove invalid SearchAction schema

The site-wide `WebSite` schema advertises `/{locale}/search` in `app/[locale]/layout.tsx:92-102`, but no search route exists.

Action: remove `potentialAction` or implement a crawlable search route matching the declared target exactly.

### P1: Correct titles and metadata inheritance

The root layout applies `%s | EasyTech Wiki`: `app/[locale]/layout.tsx:37-40`. Many child pages already include `EasyTech Wiki`, which can produce duplicate brand suffixes. GCR/EW6 guide, update, and technology pages also reuse WC4-specific message namespaces.

Action: create a central metadata builder. Child titles should omit the brand unless using `title.absolute`. Assert that each game route includes the correct game and excludes competing game names.

### P1: Gate placeholder content from indexing

Large EW6/GCR page sets are intentionally indexable despite zero-valued skills, numeric-only names, empty descriptions, preliminary units, and generic source statements.

Examples:

- `data/ew6/generals/napoleon.json:16-85`
- `data/gcr/generals/caesar.json:16-72`
- `lib/placeholder.ts:1-9`

Action: define an indexability threshold. Require a resolved name, non-zero/meaningful facts, localized summary, valid sources, update/version metadata, and internal links. Apply `noindex` until a record passes.

### P2: Standardize Open Graph and Twitter metadata

Many pages define partial or no page-specific OG/Twitter data. Some omit `og:url`, locale, alternate locales, image, or Twitter card fields.

Action: use one metadata builder that always returns title, description, canonical, OG URL, locale, alternates, image, and Twitter card.

### P2: Use truthful sitemap freshness

Build time is not content modification time. It weakens the usefulness of `lastmod` and can encourage unnecessary recrawling.

Action: use explicit editorial dates or source-file modification dates. Omit `lastModified` when it cannot be supported.

## GEO and answer-engine priorities

### P0: Build a visible evidence model

Sources are often generic strings, entity source URLs are rendered as plain text, and guide `sources` are not displayed. The About page claims versioned verification that entity templates do not visibly provide.

Action: add a localized “Sources and methodology” block to every factual page containing:

- source title and publisher;
- clickable canonical URL;
- publication and access dates;
- game version and platform;
- verification status;
- exact claim scope;
- correction/report link.

Important numeric claims should use inline citations, not only a footer bibliography.

### P0: Do not expose unresolved entities to answer systems

Numeric skill names, zero-value mechanics, and wrong-game copies are highly extractable but wrong. They teach search and answer systems incorrect entity relationships.

Action: noindex unresolved records, remove them from sitemaps and recommendation rails, and add schema validation that blocks publication.

### P1: Align bylines and structured authorship

Guide pages can show a named byline, but Article schema always names the organization. Internal persona documents are not public author profiles.

Action: use real accountable authors/editors or explicitly label a collective editorial identity. Publish author pages with role, expertise, review policy, and content list. Ensure visible byline and JSON-LD author match; use `reviewedBy` when applicable.

### P1: Expose freshness and correction history

Entity Article schema often lacks `datePublished`, `dateModified`, URL, image, and publisher. Update pages do not emit appropriate Article/NewsArticle schema.

Action: persist and display publication date, last review, game version, platform, source date, and material corrections. Mirror those fields in structured data.

### P1: Model game entities accurately in schema

WC4 generals are emitted as `Person`, which can conflate an in-game profile with a historical person.

Evidence: `app/[locale]/world-conqueror-4/generaux/[slug]/page.tsx:160-170,532-548`.

Action: make the page an `Article` or `TechArticle` whose `mainEntity` is a `Thing`/game character linked with `isPartOf` to the `VideoGame`. Link to a historical `Person` only as a separate entity when justified.

### P1: Make entity pages answer-first

Guides already have TL;DR, TOC, sections, and FAQ. Entity pages often lead with dense stat UI rather than a concise answer.

Recommended entity template:

1. One-sentence definition.
2. “Best for / avoid when” block.
3. Key facts table.
4. Evidence-backed recommendation.
5. Current game version and last verified date.
6. Sources and corrections.
7. FAQ using natural-language queries only when the answers are page-specific.

This improves featured-snippet eligibility and makes passages easier to cite accurately.

### P1: Complete locale quality before advertising alternates

German metadata and content logic frequently falls back to English, and some sentence templates remain mixed-language.

Action: establish translation completeness thresholds. Do not advertise a locale alternate until title, description, H1, summary, primary facts, navigation, and citations are localized.

### P2: Publish a deliberate AI crawler policy

`app/robots.ts` allows all public crawlers and blocks API/admin paths, which is reasonable for discoverability. There is no explicit policy for answer retrieval versus model training and no `llms.txt`.

Action:

- Decide which crawlers may retrieve content for answers and which may use it for model training.
- Keep answer-engine crawlers allowed if GEO is a goal.
- Optionally publish `/llms.txt` with site purpose, canonical game hubs, locale structure, source methodology, and citation expectations.
- Treat `llms.txt` as supplementary, not a ranking mechanism.

## Content strategy for ranking growth

### Consolidate topical silos

Build one reliable silo per game:

- game hub;
- current version/update hub;
- generals;
- units;
- skills/technology;
- beginner and advanced guides;
- curated comparisons;
- source/methodology page.

Every page should identify the game, version, and relationship to parent entities. Do not reuse content across game silos.

### Prioritize high-intent pages

After technical cleanup, focus editorial effort on queries with clear player intent:

- best generals for the current WC4 version;
- MacArthur training cost, skills, and whether it is worth it;
- Aircraft Carrier Kuznetsov stats, fragments, and best general;
- current WC4 event calendar;
- Bismarck vs other naval elite units;
- beginner progression and medal spending;
- current GCR promotion/general release guides;
- exact EW6 game-specific pages after resolving 1804 versus 1914.

Each page should use official release evidence plus reproducible in-game verification.

### Earn links through unique assets

The strongest linkable assets for this niche are not generic guides. Build:

- versioned stat datasets with downloadable change history;
- patch diff pages showing exactly what changed;
- curated calculators/comparators with shareable stable URLs;
- event calendars with source links and timezone handling;
- transparent verification dashboards showing evidence and open questions.

## 90-day implementation order

### Days 1-14: stop quality loss

1. Remove wrong-game guides and updates.
2. Correct WC4 release versions and sources.
3. Noindex unresolved EW6/GCR and arbitrary matchup pages.
4. Fix localized internal links and matchup canonicals.
5. Remove invalid SearchAction and duplicate title suffixes.

### Days 15-45: establish trust

1. Add provenance fields and visible citations.
2. Add publication/review/correction metadata.
3. Rebuild reciprocal hreflang and breadcrumb URLs from one route registry.
4. Standardize metadata/OG/schema builders.
5. Add sitemap/canonical/indexability CI checks.

### Days 46-90: grow authority

1. Publish verified current-version landing pages.
2. Create answer-first templates for entities.
3. Build author/editor and methodology pages.
4. Curate only high-value comparison pages.
5. Publish patch diffs and evidence-backed event calendars.

## Success metrics

Track by locale and game silo:

- indexed URLs versus submitted URLs;
- duplicate/canonical conflict counts;
- redirected internal-link count;
- valid reciprocal hreflang clusters;
- pages passing the content completeness threshold;
- impressions/clicks for current-version queries;
- non-brand organic entrances;
- cited/referral traffic from answer engines;
- source-link clicks and correction submissions;
- refresh latency from official release to verified publication.

The immediate KPI should be quality ratio, not page count: fewer indexable pages, each self-canonical, game-correct, localized, sourced, and current.
