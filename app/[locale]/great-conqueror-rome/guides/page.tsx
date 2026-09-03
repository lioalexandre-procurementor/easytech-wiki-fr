import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialSectionUnavailable } from "@/components/EditorialSectionUnavailable";
import { pageAlternates } from "@/lib/seo-alternates";
import { locales, type Locale } from "@/src/i18n/config";
import { unstable_setRequestLocale } from "next-intl/server";

const title = {
  fr: "Guides Great Conqueror: Rome",
  en: "Great Conqueror: Rome Guides",
  de: "Great Conqueror: Rome Guides",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export function generateMetadata({ params: { locale } }: { params: { locale: string } }): Metadata {
  const loc = locales.includes(locale as Locale) ? (locale as Locale) : "fr";
  return {
    title: title[loc],
    description: "Verified Great Conqueror: Rome guides are in preparation.",
    alternates: pageAlternates(locale, {
      fr: "/great-conqueror-rome/guides",
      en: "/great-conqueror-rome/guides",
      de: "/great-conqueror-rome/guides",
    }),
    robots: { index: false, follow: true },
  };
}

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  return <EditorialSectionUnavailable locale={locale as Locale} gameName="Great Conqueror: Rome" gameHref="/great-conqueror-rome" sectionName={title[locale as Locale]} />;
}
