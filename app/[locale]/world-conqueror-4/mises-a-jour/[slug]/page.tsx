import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { getAllUpdateSlugs, getUpdate } from "@/lib/updates";
import { locales, type Locale } from "@/src/i18n/config";
import { ogLocale } from "@/src/i18n/og-locale";
import type { Metadata } from "next";

export function generateStaticParams() {
  const slugs = getAllUpdateSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const u = getUpdate(slug);
  if (!u) return { title: "404" };
  const t = await getTranslations({ locale, namespace: "updatesPage" });
  const loc = locale as Locale;
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
    },
    robots: { index: true, follow: true },
  };
}

/** Minimal safe-ish markdown renderer: paragraphs, headings, lists, blockquotes. */
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
    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={key++} className="text-gold2 text-2xl font-bold uppercase tracking-widest mt-8 mb-3">
          {line.slice(3).trim()}
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
        <ul key={key++} className="list-disc pl-6 text-ink space-y-1 mb-4">
          {items.map((it, j) => (
            <li key={j}>{it}</li>
          ))}
        </ul>
      );
      continue;
    }
    if (line.startsWith("> ")) {
      blocks.push(
        <blockquote key={key++} className="border-l-4 border-gold pl-4 italic text-dim my-4">
          {line.slice(2).trim()}
        </blockquote>
      );
      i++;
      continue;
    }
    // default: paragraph
    blocks.push(
      <p key={key++} className="text-ink leading-relaxed mb-4">
        {line}
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
  const u = getUpdate(slug);
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
                rel="nofollow noopener"
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

        <div className="mt-6">
          <Link
            href={"/world-conqueror-4/mises-a-jour" as any}
            className="text-gold2 text-xs uppercase tracking-widest hover:underline"
          >
            {t("updatesPage.backToList")}
          </Link>
        </div>
      </article>
      <Footer />
    </>
  );
}
