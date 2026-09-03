import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialSectionUnavailable } from "@/components/EditorialSectionUnavailable";
import { pageAlternates } from "@/lib/seo-alternates";
import { locales, type Locale } from "@/src/i18n/config";
import { unstable_setRequestLocale } from "next-intl/server";

const title = {
  fr: "Mises à jour European War 6",
  en: "European War 6 Updates",
  de: "European War 6 Updates",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export function generateMetadata({ params: { locale } }: { params: { locale: string } }): Metadata {
  const loc = locales.includes(locale as Locale) ? (locale as Locale) : "fr";
  return {
    title: title[loc],
    description: "Verified European War 6 release notes are in preparation.",
    alternates: pageAlternates(locale, {
      fr: "/european-war-6/mises-a-jour",
      en: "/european-war-6/updates",
      de: "/european-war-6/updates",
    }),
    robots: { index: false, follow: true },
  };
}

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  return <EditorialSectionUnavailable locale={locale as Locale} gameName="European War 6" gameHref="/european-war-6" sectionName={title[locale as Locale]} />;
}
