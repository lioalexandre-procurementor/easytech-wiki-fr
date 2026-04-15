import type { Metadata } from "next";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/src/i18n/config";
import "../globals.css";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";
const GSC_TOKEN = process.env.NEXT_PUBLIC_GSC_VERIFICATION ?? "";

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
    verification: GSC_TOKEN ? { google: GSC_TOKEN } : undefined,
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
      <head>
        {/*
          Google Consent Mode v2 — default state.
          This MUST run before any Google tag (AdSense, Analytics, Funding
          Choices) so that gtag() calls are queued and no cookie is dropped
          until the user interacts with the Funding Choices banner.
          All ad/analytics signals start as "denied". Funding Choices will
          update them via gtag('consent', 'update', ...) based on the user's
          choice (accept / reject / customise).
        */}
        <Script id="gtag-consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'analytics_storage': 'denied',
              'functionality_storage': 'granted',
              'security_storage': 'granted',
              'wait_for_update': 500
            });
            gtag('set', 'ads_data_redaction', true);
            gtag('set', 'url_passthrough', true);
          `}
        </Script>
        {/*
          AdSense loader. Placed as a raw <script> in <head> so that it
          appears in the server-rendered HTML exactly as Google requires
          for site verification. Consent Mode (above) runs first and
          ensures no ad cookies are dropped before user interaction.
        */}
        {ADSENSE_CLIENT && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>

        {/*
          Funding Choices (CMP). The AdSense loader itself lives in <head>
          above so the verification crawler finds it in the raw HTML.
        */}
        {ADSENSE_CLIENT && (
          <>
            <Script
              id="funding-choices"
              async
              strategy="afterInteractive"
              src={`https://fundingchoicesmessages.google.com/i/${ADSENSE_CLIENT}?ers=1`}
            />
            <Script id="funding-choices-present" strategy="afterInteractive">
              {`(function() {function signalGooglefcPresent() {if (!window.frames['googlefcPresent']) {if (document.body) {const iframe = document.createElement('iframe'); iframe.style = 'width: 0; height: 0; border: none; z-index: -1000; left: -1000px; top: -1000px;'; iframe.style.display = 'none'; iframe.name = 'googlefcPresent'; document.body.appendChild(iframe);} else {setTimeout(signalGooglefcPresent, 0);}}} signalGooglefcPresent();})();`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
