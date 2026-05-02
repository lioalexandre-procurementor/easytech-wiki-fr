import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";
import { locales } from "@/src/i18n/config";
import { pageAlternates } from "@/lib/seo-alternates";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "votesLegalPage" });
  return {
    title: t("seoTitle"),
    description: t("seoDescription"),
    alternates: pageAlternates(locale, {
      fr: "/legal/votes",
      en: "/legal/votes",
      de: "/legal/votes",
    }),
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function VotesLegalPage({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations();
  return (
    <>
      <TopBar />
      <div className="max-w-[860px] mx-auto px-6 py-8">
        <div className="text-xs text-muted mb-4">
          <Link href="/" className="text-dim">
            {t("nav.home")}
          </Link>{" "}
          <span className="mx-2 text-border">›</span>
          <span>{t("votesLegalPage.breadcrumbCurrent")}</span>
        </div>

        <h1 className="text-3xl text-gold2 font-extrabold mb-2">
          {t("votesLegalPage.h1")}
        </h1>
        <p className="text-dim text-sm mb-8">
          {t("votesLegalPage.lastUpdated")}
        </p>

        <div className="bg-panel border border-border rounded-lg p-6 space-y-6 text-ink text-sm leading-relaxed">
          <section>
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-base mb-2">
              {t("votesLegalPage.sectionPurposeHeading")}
            </h2>
            <p>{t("votesLegalPage.sectionPurposeBody")}</p>
          </section>

          <section>
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-base mb-2">
              {t("votesLegalPage.sectionDataHeading")}
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                {t.rich("votesLegalPage.sectionDataItemCookie", {
                  b: (chunks) => <b>{chunks}</b>,
                  code: (chunks) => <code className="text-gold2">{chunks}</code>,
                })}
              </li>
              <li>
                {t.rich("votesLegalPage.sectionDataItemTurnstile", {
                  b: (chunks) => <b>{chunks}</b>,
                })}
              </li>
              <li>
                {t.rich("votesLegalPage.sectionDataItemCounter", {
                  b: (chunks) => <b>{chunks}</b>,
                })}
              </li>
            </ul>
            <p className="mt-2">
              {t.rich("votesLegalPage.sectionDataFooter", {
                b: (chunks) => <b>{chunks}</b>,
              })}
            </p>
          </section>

          <section>
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-base mb-2">
              {t("votesLegalPage.sectionCookieHeading")}
            </h2>
            <p>
              {t.rich("votesLegalPage.sectionCookieBody", {
                b: (chunks) => <b>{chunks}</b>,
                code: (chunks) => <code className="text-gold2">{chunks}</code>,
              })}
            </p>
          </section>

          <section>
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-base mb-2">
              {t("votesLegalPage.sectionDurationHeading")}
            </h2>
            <p>
              {t.rich("votesLegalPage.sectionDurationBody", {
                b: (chunks) => <b>{chunks}</b>,
              })}
            </p>
          </section>

          <section>
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-base mb-2">
              {t("votesLegalPage.sectionSafeguardsHeading")}
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                {t.rich("votesLegalPage.sectionSafeguardsItemTurnstile", {
                  b: (chunks) => <b>{chunks}</b>,
                })}
              </li>
              <li>
                {t.rich("votesLegalPage.sectionSafeguardsItemWhitelist", {
                  b: (chunks) => <b>{chunks}</b>,
                })}
              </li>
              <li>
                {t.rich("votesLegalPage.sectionSafeguardsItemModeration", {
                  b: (chunks) => <b>{chunks}</b>,
                })}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-base mb-2">
              {t("votesLegalPage.sectionRightsHeading")}
            </h2>
            <p>
              {t.rich("votesLegalPage.sectionRightsBody", {
                b: (chunks) => <b>{chunks}</b>,
                code: (chunks) => <code className="text-gold2">{chunks}</code>,
              })}
            </p>
          </section>

          <section>
            <h2 className="text-gold2 font-bold uppercase tracking-widest text-base mb-2">
              {t("votesLegalPage.sectionContactHeading")}
            </h2>
            <p>{t("votesLegalPage.sectionContactBody")}</p>
          </section>
        </div>

        <div className="mt-6">
          <Link
            href="/world-conqueror-4/generaux"
            className="text-gold2 text-xs uppercase tracking-widest hover:underline"
          >
            {t("votesLegalPage.backToGenerals")}
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
