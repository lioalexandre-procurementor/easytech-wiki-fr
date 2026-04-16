import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { getAllUpdates } from "@/lib/updates";
import { locales, type Locale } from "@/src/i18n/config";
import { ogLocale } from "@/src/i18n/og-locale";
import type { Metadata } from "next";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "updatesPage" });
  return {
    title: t("seoTitle"),
    description: t("seoDescription"),
    alternates: {
      canonical:
        locale === "fr"
          ? "/fr/great-conqueror-rome/mises-a-jour"
          : `/${locale}/great-conqueror-rome/updates`,
      languages: {
        fr: "/fr/great-conqueror-rome/mises-a-jour",
        en: "/en/great-conqueror-rome/updates",
        de: "/de/great-conqueror-rome/updates",
        "x-default": "/fr/great-conqueror-rome/mises-a-jour",
      },
    },
    openGraph: {
      title: t("seoTitle"),
      description: t("seoDescription"),
      type: "website",
      locale: ogLocale(locale),
    },
    robots: { index: true, follow: true },
  };
}

export default async function UpdatesListPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  const t = await getTranslations();
  const loc = locale as Locale;
  const updates = getAllUpdates();

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">{t("nav.home")}</Link>
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <Link href="/great-conqueror-rome" className="text-dim">{t("nav.gcr")}</Link>
        <span className="mx-2 text-border">{t("breadcrumb.separator")}</span>
        <span>{t("updatesPage.breadcrumbCurrent")}</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20">
        <section className="bg-panel border border-border rounded-lg p-9 mb-6">
          <h1 className="text-4xl font-extrabold text-gold2 mb-2">
            {t("updatesPage.h1")}
          </h1>
          <p className="text-dim text-base max-w-3xl leading-relaxed">
            {t("updatesPage.intro")}
          </p>
        </section>

        {updates.length === 0 ? (
          <div className="bg-panel border border-border rounded-lg p-9 text-center text-muted italic">
            {t("updatesPage.emptyState")}
          </div>
        ) : (
          <div className="grid gap-4">
            {updates.map((u) => (
              <Link
                key={u.slug}
                href={`/great-conqueror-rome/mises-a-jour/${u.slug}` as any}
                className="block bg-panel border border-border rounded-lg p-6 hover:border-gold transition-colors no-underline"
              >
                <div className="flex flex-wrap items-baseline gap-3 mb-2">
                  <span className="text-gold2 font-black uppercase tracking-widest text-xs">
                    {t("updatesPage.versionLabel")} {u.version}
                  </span>
                  <span className="text-muted text-xs">
                    {t("updatesPage.publishedOn")} {u.date}
                  </span>
                  {u.tags && u.tags.length > 0 && (
                    <span className="text-dim text-[10px] uppercase tracking-widest">
                      {u.tags.join(" · ")}
                    </span>
                  )}
                </div>
                <h2 className="text-gold2 text-xl font-bold mb-1">
                  {u.title[loc]}
                </h2>
                <p className="text-dim text-sm leading-relaxed mb-3">
                  {u.summary[loc]}
                </p>
                <span className="text-gold text-xs font-bold uppercase tracking-widest">
                  {t("updatesPage.readMore")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
