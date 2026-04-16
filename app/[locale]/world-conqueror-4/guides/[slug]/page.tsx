import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { getAllGuideSlugs, getGuide } from "@/lib/guides";
import { locales, type Locale } from "@/src/i18n/config";
import { ogLocale } from "@/src/i18n/og-locale";
import type { Metadata } from "next";

/** Per-category tint applied behind the hero image when the guide has no
 *  image or on empty-card fallback. Keeps the hub visually scannable. */
const CATEGORY_TINT: Record<string, { from: string; to: string }> = {
  starter:  { from: "rgba(74,157,95,0.35)",  to: "rgba(74,157,95,0.05)" },  // green
  systems:  { from: "rgba(74,144,226,0.35)", to: "rgba(74,144,226,0.05)" }, // blue
  strategy: { from: "rgba(212,164,74,0.35)", to: "rgba(212,164,74,0.05)" }, // gold
  meta:     { from: "rgba(200,55,45,0.35)",  to: "rgba(200,55,45,0.05)" },  // red
};

export function generateStaticParams() {
  const slugs = getAllGuideSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const g = getGuide(slug);
  if (!g) return { title: "404" };
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "guidesPage" });
  return {
    title: t("detailSeoTitle", { title: g.title[loc] }),
    description: t("detailSeoDescription", { description: g.description[loc] }),
    alternates: {
      canonical: `/${locale}/world-conqueror-4/guides/${slug}`,
      languages: {
        fr: `/fr/world-conqueror-4/guides/${slug}`,
        en: `/en/world-conqueror-4/guides/${slug}`,
        de: `/de/world-conqueror-4/guides/${slug}`,
        "x-default": `/fr/world-conqueror-4/guides/${slug}`,
      },
    },
    openGraph: {
      title: g.title[loc],
      description: g.description[loc],
      type: "article",
      locale: ogLocale(locale),
    },
    robots: { index: true, follow: true },
  };
}

/**
 * Inline formatter — supports `**bold**` and inline `` `code` ``.
 * Bold renders as gold-tinted strong; code as a pill-shaped monospace
 * span so numeric callouts ("5 turns", "+25%") pop on a busy page.
 */
function renderInline(text: string): React.ReactNode {
  // Tokenize in one pass so nested markers don't double-replace.
  const tokens: Array<{ kind: "text" | "bold" | "code"; value: string }> = [];
  const pattern = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > lastIdx) tokens.push({ kind: "text", value: text.slice(lastIdx, m.index) });
    if (m[2] !== undefined) tokens.push({ kind: "bold", value: m[2] });
    else if (m[3] !== undefined) tokens.push({ kind: "code", value: m[3] });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) tokens.push({ kind: "text", value: text.slice(lastIdx) });
  return tokens.map((tk, i) => {
    if (tk.kind === "bold")
      return (
        <strong key={i} className="font-bold text-gold2">
          {tk.value}
        </strong>
      );
    if (tk.kind === "code")
      return (
        <code
          key={i}
          className="font-mono text-[0.85em] px-1.5 py-0.5 rounded bg-gold/10 border border-gold/30 text-gold2 whitespace-nowrap"
        >
          {tk.value}
        </code>
      );
    return <span key={i}>{tk.value}</span>;
  });
}

/**
 * Guide markdown renderer: ## / ### headings (with optional {#slug} anchors),
 * unordered/ordered lists, blockquotes, pipe tables (mobile-responsive wrapper),
 * and paragraphs. Inline **bold** is supported.
 */
function renderMarkdown(md: string): React.ReactNode {
  const lines = md.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    // H2 with optional {#anchor}
    if (line.startsWith("## ")) {
      const raw = line.slice(3).trim();
      const am = raw.match(/^(.+?)\s*\{#([\w-]+)\}\s*$/);
      const text = am ? am[1] : raw;
      const id = am ? am[2] : undefined;
      blocks.push(
        <h2
          key={key++}
          id={id}
          className="text-gold2 text-xl md:text-2xl font-bold uppercase tracking-widest mt-8 mb-3 scroll-mt-24"
        >
          {renderInline(text)}
        </h2>
      );
      i++;
      continue;
    }
    // H3
    if (line.startsWith("### ")) {
      const raw = line.slice(4).trim();
      blocks.push(
        <h3
          key={key++}
          className="text-gold2 text-base md:text-lg font-bold mt-6 mb-2"
        >
          {renderInline(raw)}
        </h3>
      );
      i++;
      continue;
    }
    // Pipe table: | col | col |  + | --- | --- |
    if (
      line.startsWith("|") &&
      i + 1 < lines.length &&
      /^\|\s*:?-+/.test(lines[i + 1])
    ) {
      const header = line
        .split("|")
        .slice(1, -1)
        .map((s) => s.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(
          lines[i]
            .split("|")
            .slice(1, -1)
            .map((s) => s.trim())
        );
        i++;
      }
      blocks.push(
        <div
          key={key++}
          className="overflow-x-auto -mx-2 md:mx-0 my-5 rounded-lg border border-border shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
        >
          <table className="w-full text-xs md:text-sm border-collapse min-w-[520px]">
            <thead>
              <tr className="bg-gradient-to-r from-gold/15 to-gold/5">
                {header.map((h, hi) => (
                  <th
                    key={hi}
                    className="text-left text-gold2 text-[10px] md:text-xs uppercase tracking-widest font-bold p-2.5 md:p-3 border-b-2 border-gold/30"
                  >
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr
                  key={ri}
                  className={`border-b border-border/30 ${ri % 2 === 1 ? "bg-bg3/40" : ""} hover:bg-gold/5 transition-colors`}
                >
                  {r.map((c, ci) => (
                    <td
                      key={ci}
                      className="p-2.5 md:p-3 text-ink align-top leading-relaxed"
                    >
                      {renderInline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }
    // Unordered list
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2).trim());
        i++;
      }
      blocks.push(
        <ul
          key={key++}
          className="list-disc marker:text-gold pl-5 md:pl-6 text-ink space-y-1.5 mb-5 leading-relaxed"
        >
          {items.map((it, j) => (
            <li key={j}>{renderInline(it)}</li>
          ))}
        </ul>
      );
      continue;
    }
    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      blocks.push(
        <ol
          key={key++}
          className="list-decimal marker:text-gold marker:font-bold pl-5 md:pl-6 text-ink space-y-1.5 mb-5 leading-relaxed"
        >
          {items.map((it, j) => (
            <li key={j}>{renderInline(it)}</li>
          ))}
        </ol>
      );
      continue;
    }
    // Blockquote (supports multi-line, terminated by blank line)
    if (line.startsWith("> ")) {
      const quotedLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quotedLines.push(lines[i].slice(2).trim());
        i++;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="relative border-l-4 border-gold bg-gold/5 pl-4 pr-3 py-3 my-5 text-dim italic leading-relaxed rounded-r"
        >
          {quotedLines.map((q, j) => (
            <p key={j} className={j === 0 ? "" : "mt-2"}>
              {renderInline(q)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }
    // Paragraph
    blocks.push(
      <p key={key++} className="text-ink leading-relaxed mb-4 text-[15px] md:text-base">
        {renderInline(line)}
      </p>
    );
    i++;
  }
  return <>{blocks}</>;
}

/** Extract H2 anchors (## Heading {#slug}) to build a table of contents. */
function extractToc(md: string): Array<{ id: string; text: string }> {
  const toc: Array<{ id: string; text: string }> = [];
  for (const line of md.split("\n")) {
    if (!line.startsWith("## ")) continue;
    const raw = line.slice(3).trim();
    const m = raw.match(/^(.+?)\s*\{#([\w-]+)\}\s*$/);
    if (m) toc.push({ id: m[2], text: m[1] });
  }
  return toc;
}

export default async function GuideDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  const guide = getGuide(slug);
  if (!guide) notFound();
  const loc = locale as Locale;
  const t = await getTranslations();
  const body = guide.body[loc] ?? guide.body.en ?? guide.body.fr;
  const toc = extractToc(body);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "World Conqueror 4",
        item: `https://easytech-wiki.com/${locale}/world-conqueror-4`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("guidesPage.hubTitle"),
        item: `https://easytech-wiki.com/${locale}/world-conqueror-4/guides`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.title[loc],
        item: `https://easytech-wiki.com/${locale}/world-conqueror-4/guides/${slug}`,
      },
    ],
  };

  return (
    <>
      <TopBar />
      <article className="max-w-[860px] mx-auto px-4 md:px-6 pb-20">
        {/* Breadcrumbs */}
        <nav
          className="text-xs text-muted mb-4 mt-3 flex flex-wrap items-center gap-1"
          aria-label="Breadcrumb"
        >
          <Link href={"/world-conqueror-4" as any} className="hover:text-gold2">
            WC4
          </Link>
          <span aria-hidden="true">›</span>
          <Link href={"/world-conqueror-4/guides" as any} className="hover:text-gold2">
            {t("guidesPage.hubTitle")}
          </Link>
          <span aria-hidden="true">›</span>
          <span className="text-dim truncate max-w-[220px] md:max-w-none">
            {guide.title[loc]}
          </span>
        </nav>

        <header className="mb-6">
          {/* Hero image — WC4-themed, falls back to category-colored gradient */}
          {guide.heroImage ? (
            <div
              className="relative w-full aspect-[21/9] md:aspect-[3/1] rounded-lg overflow-hidden mb-5 border border-gold/30"
              style={{
                background: `linear-gradient(135deg, ${CATEGORY_TINT[guide.category]?.from ?? "rgba(212,164,74,0.35)"}, ${CATEGORY_TINT[guide.category]?.to ?? "rgba(212,164,74,0.05)"}), #111820`,
              }}
            >
              <Image
                src={guide.heroImage}
                alt={guide.heroAlt ?? ""}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 860px"
                className="object-contain object-center p-4 md:p-6"
              />
              {/* Category badge in corner */}
              <span className="absolute top-3 left-3 bg-[#0a0e13]/85 backdrop-blur-sm text-gold2 font-black uppercase tracking-widest text-[10px] md:text-xs px-2.5 py-1 rounded border border-gold/40">
                {t(`guidesPage.category.${guide.category}`)}
              </span>
            </div>
          ) : null}
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
            {!guide.heroImage && (
              <span className="text-gold2 font-black uppercase tracking-widest text-[10px] md:text-xs">
                {t(`guidesPage.category.${guide.category}`)}
              </span>
            )}
            <span className="text-muted text-[10px] md:text-xs">
              {t("guidesPage.readingTime", { minutes: guide.readingTimeMinutes })}
            </span>
            <span className="text-muted text-[10px] md:text-xs">
              {t("guidesPage.lastReviewed")} {guide.lastReviewed}
            </span>
            {guide.byline && (
              <span className="text-muted text-[10px] md:text-xs">
                · {guide.byline}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-gold2 mb-2 leading-tight">
            {guide.title[loc]}
          </h1>
          <p className="text-dim text-sm md:text-base leading-relaxed">
            {guide.description[loc]}
          </p>
        </header>

        {guide.tldr[loc]?.length > 0 && (
          <section className="bg-gold/5 border border-gold/30 rounded-lg p-4 md:p-5 mb-6">
            <div className="text-gold2 font-black uppercase tracking-widest text-[10px] md:text-xs mb-2">
              {t("guidesPage.tldrLabel")}
            </div>
            <ul className="list-disc pl-5 md:pl-6 text-ink space-y-1 text-sm md:text-base">
              {guide.tldr[loc].map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>
        )}

        {toc.length > 1 && (
          <nav
            aria-label="Table of contents"
            className="bg-panel border border-border rounded-lg p-4 md:p-5 mb-6"
          >
            <div className="text-gold2 font-black uppercase tracking-widest text-[10px] md:text-xs mb-2">
              {t("guidesPage.tocLabel")}
            </div>
            <ol className="list-decimal pl-5 md:pl-6 text-ink space-y-1 text-sm md:text-base">
              {toc.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`} className="hover:text-gold2 underline-offset-2">
                    {h.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <section className="bg-panel border border-border rounded-lg p-4 md:p-6 mb-6">
          {renderMarkdown(body)}
        </section>

        {guide.faqs[loc]?.length > 0 && (
          <section
            id="faq"
            className="bg-panel border border-border rounded-lg p-4 md:p-6 mb-6 scroll-mt-24"
          >
            <h2 className="text-gold2 text-xl md:text-2xl font-bold uppercase tracking-widest mb-4">
              {t("guidesPage.faqHeading")}
            </h2>
            <div className="space-y-3 md:space-y-4">
              {guide.faqs[loc].map((faq, i) => (
                <details key={i} className="border-l-2 border-gold/40 pl-3 md:pl-4">
                  <summary className="text-gold2 font-bold cursor-pointer text-sm md:text-base leading-snug">
                    {faq.q}
                  </summary>
                  <p className="text-dim mt-2 leading-relaxed text-sm md:text-base">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* BreadcrumbList JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />

        {/* Article JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: guide.title[loc],
              datePublished: guide.publishedAt,
              dateModified: guide.lastReviewed,
              author: { "@type": "Organization", name: "EasyTech Wiki" },
              inLanguage: locale,
              description: guide.description[loc],
              about: {
                "@type": "VideoGame",
                name: "World Conqueror 4",
                publisher: { "@type": "Organization", name: "EasyTech" },
              },
            }),
          }}
        />
        {/* FAQPage JSON-LD */}
        {guide.faqs[loc]?.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: guide.faqs[loc].map((faq) => ({
                  "@type": "Question",
                  name: faq.q,
                  acceptedAnswer: { "@type": "Answer", text: faq.a },
                })),
              }),
            }}
          />
        )}
      </article>
      <Footer />
    </>
  );
}
