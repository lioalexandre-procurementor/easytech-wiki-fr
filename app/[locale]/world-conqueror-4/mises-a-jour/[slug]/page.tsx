import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { getAllUpdateSlugs, getUpdate } from "@/lib/updates";
import { loadUpdate } from "@/lib/content-editable";
import { locales, type Locale } from "@/src/i18n/config";
import { ogLocale } from "@/src/i18n/og-locale";
import { ogImage } from "@/lib/og";
import type { Metadata } from "next";
import ReportMistakeLink from "@/components/ReportMistakeLink";

export function generateStaticParams() {
  const slugs = getAllUpdateSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const u = await loadUpdate(slug);
  if (!u) return { title: "404" };
  const t = await getTranslations({ locale, namespace: "updatesPage" });
  const loc = locale as Locale;
  const ogImages = ogImage({
    title: u.title[loc],
    sub: "World Conqueror 4",
  });
  return {
    title: t("detailSeoTitle", { title: u.title[loc] }),
    description: t("detailSeoDescription", {
      version: u.version,
      summary: u.summary[loc],
    }),
    alternates: {
      canonical:
        locale === "fr"
          ? `/fr/world-conqueror-4/mises-a-jour/${slug}`
          : `/${locale}/world-conqueror-4/updates/${slug}`,
      languages: {
        fr: `/fr/world-conqueror-4/mises-a-jour/${slug}`,
        en: `/en/world-conqueror-4/updates/${slug}`,
        de: `/de/world-conqueror-4/updates/${slug}`,
        "x-default": `/fr/world-conqueror-4/mises-a-jour/${slug}`,
      },
    },
    openGraph: {
      title: t("detailSeoTitle", { title: u.title[loc] }),
      description: u.summary[loc],
      type: "article",
      locale: ogLocale(locale),
      images: ogImages,
    },
    robots: { index: true, follow: true },
  };
}

/** Inline formatter — supports **bold** and *italic* (matches guide page). */
function renderInline(text: string): React.ReactNode {
  const tokens: Array<{ kind: "text" | "bold" | "italic"; value: string }> = [];
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > lastIdx) tokens.push({ kind: "text", value: text.slice(lastIdx, m.index) });
    if (m[2] !== undefined) tokens.push({ kind: "bold", value: m[2] });
    else if (m[3] !== undefined) tokens.push({ kind: "italic", value: m[3] });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) tokens.push({ kind: "text", value: text.slice(lastIdx) });
  return tokens.map((tk, i) => {
    if (tk.kind === "bold")
      return <strong key={i} className="font-bold text-gold2">{tk.value}</strong>;
    if (tk.kind === "italic")
      return <em key={i} className="italic text-dim">{tk.value}</em>;
    return <span key={i}>{tk.value}</span>;
  });
}

/** Markdown renderer: ## / ### headings, - lists, > blockquotes, **bold**, *italic*. */
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
    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={key++} className="text-gold2 text-lg font-bold mt-6 mb-2">
          {renderInline(line.slice(4).trim())}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={key++} className="text-gold2 text-2xl font-bold uppercase tracking-widest mt-8 mb-3">
          {renderInline(line.slice(3).trim())}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2).trim());
        i++;
      }
      blocks.push(
        <ul key={key++} className="list-disc marker:text-gold pl-6 text-ink space-y-1 mb-4">
          {items.map((it, j) => (
            <li key={j}>{renderInline(it)}</li>
          ))}
        </ul>
      );
      continue;
    }
    if (line.startsWith("> ")) {
      blocks.push(
        <blockquote key={key++} className="border-l-4 border-gold pl-4 italic text-dim my-4">
          {renderInline(line.slice(2).trim())}
        </blockquote>
      );
      i++;
      continue;
    }
    // default: paragraph
    blocks.push(
      <p key={key++} className="text-ink leading-relaxed mb-4">
        {renderInline(line)}
      </p>
    );
    i++;
  }
  return <>{blocks}</>;
}

export default async function UpdateDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  const u = await loadUpdate(slug);
  if (!u) notFound();
  const t = await getTranslations();
  const loc = locale as Locale;

  return (
    <>
      <TopBar />
      <div className="max-w-[860px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">{t("nav.home")}</Link>
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link href="/world-conqueror-4" className="text-dim">{t("nav.wc4")}</Link>
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link
          href={"/world-conqueror-4/mises-a-jour" as any}
          className="text-dim"
        >
          {t("updatesPage.breadcrumbCurrent")}
        </Link>
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <span>{u.version}</span>
      </div>

      <article className="max-w-[860px] mx-auto px-6 pb-20">
        <header className="mb-6">
          <div className="flex flex-wrap items-baseline gap-3 mb-2">
            <span className="text-gold2 font-black uppercase tracking-widest text-xs">
              {t("updatesPage.versionLabel")} {u.version}
            </span>
            <span className="text-muted text-xs">
              {t("updatesPage.publishedOn")} {u.date}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gold2 mb-2">
            {u.title[loc]}
          </h1>
          <p className="text-dim text-base leading-relaxed">
            {u.summary[loc]}
          </p>
          {u.tags && u.tags.length > 0 && (
            <div className="mt-3 text-muted text-[10px] uppercase tracking-widest">
              {t("updatesPage.tagsLabel")}: {u.tags.join(" · ")}
            </div>
          )}
          {u.sourceUrl && (
            <div className="mt-2 text-xs">
              <a
                href={u.sourceUrl}
                target="_blank"
                rel="noopener"
                className="text-gold hover:underline"
              >
                {t("updatesPage.sourceLabel")} &#x2197;
              </a>
            </div>
          )}
        </header>

        <section className="bg-panel border border-border rounded-lg p-6">
          {renderMarkdown(u.body[loc])}
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: u.title[loc],
              description: u.summary[loc],
              datePublished: u.date,
              dateModified: u.date,
              inLanguage: locale,
              author: { "@type": "Organization", name: "EasyTech Wiki" },
              publisher: { "@type": "Organization", name: "EasyTech Wiki" },
              about: { "@type": "VideoGame", name: "World Conqueror 4" },
              ...(u.sourceUrl ? { citation: u.sourceUrl } : {}),
            }),
          }}
        />

        <div className="mt-6">
          <Link
            href={"/world-conqueror-4/mises-a-jour" as any}
            className="text-gold2 text-xs uppercase tracking-widest hover:underline"
          >
            {t("updatesPage.backToList")}
          </Link>
        </div>
        <ReportMistakeLink className="mt-6" />
      </article>
      <Footer />
    </>
  );
}
