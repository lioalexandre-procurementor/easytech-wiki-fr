import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { getAllGuideSlugs, getGuide } from "@/lib/guides";
import { locales, type Locale } from "@/src/i18n/config";
import { ogLocale } from "@/src/i18n/og-locale";
import type { Metadata } from "next";

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

/** Minimal markdown renderer: ## headings, - lists, > blockquotes, paragraphs. */
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
        <h2
          key={key++}
          className="text-gold2 text-2xl font-bold uppercase tracking-widest mt-8 mb-3"
        >
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
        <blockquote
          key={key++}
          className="border-l-4 border-gold pl-4 italic text-dim my-4"
        >
          {line.slice(2).trim()}
        </blockquote>
      );
      i++;
      continue;
    }
    blocks.push(
      <p key={key++} className="text-ink leading-relaxed mb-4">
        {line}
      </p>
    );
    i++;
  }
  return <>{blocks}</>;
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

  return (
    <>
      <TopBar />
      <article className="max-w-[860px] mx-auto px-6 pb-20">
        <div className="text-xs text-muted mb-4 mt-3">
          <Link href={"/world-conqueror-4/guides" as any}>
            {t("guidesPage.backToList")}
          </Link>
        </div>

        <header className="mb-6">
          <div className="flex flex-wrap items-baseline gap-3 mb-2">
            <span className="text-gold2 font-black uppercase tracking-widest text-xs">
              {t(`guidesPage.category.${guide.category}`)}
            </span>
            <span className="text-muted text-xs">
              {t("guidesPage.readingTime", { minutes: guide.readingTimeMinutes })}
            </span>
            <span className="text-muted text-xs">
              {t("guidesPage.lastReviewed")} {guide.lastReviewed}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gold2 mb-2">
            {guide.title[loc]}
          </h1>
          <p className="text-dim text-base leading-relaxed">{guide.description[loc]}</p>
        </header>

        {guide.tldr[loc]?.length > 0 && (
          <section className="bg-gold/5 border border-gold/30 rounded-lg p-5 mb-6">
            <div className="text-gold2 font-black uppercase tracking-widest text-xs mb-2">
              {t("guidesPage.tldrLabel")}
            </div>
            <ul className="list-disc pl-6 text-ink space-y-1">
              {guide.tldr[loc].map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-panel border border-border rounded-lg p-6 mb-6">
          {renderMarkdown(guide.body[loc])}
        </section>

        {guide.faqs[loc]?.length > 0 && (
          <section className="bg-panel border border-border rounded-lg p-6 mb-6">
            <h2 className="text-gold2 text-2xl font-bold uppercase tracking-widest mb-4">
              {t("guidesPage.faqHeading")}
            </h2>
            <div className="space-y-4">
              {guide.faqs[loc].map((faq, i) => (
                <details key={i} className="border-l-2 border-gold/40 pl-4">
                  <summary className="text-gold2 font-bold cursor-pointer">
                    {faq.q}
                  </summary>
                  <p className="text-dim mt-2 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

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
