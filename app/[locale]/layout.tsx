import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/src/i18n/config";
import { ogLocale, ogAlternateLocales } from "@/src/i18n/og-locale";
import "../globals.css";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";
const GSC_TOKEN = process.env.NEXT_PUBLIC_GSC_VERIFICATION ?? "";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0e13",
};

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
        de: "/de",
        "x-default": "/fr",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      locale: ogLocale(locale),
      type: "website",
      alternateLocale: ogAlternateLocales(locale),
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
        {/*
          Google Consent Mode v2 + GA4 + AdSense.

          Rendered as raw <script> tags (not next/script) so they are
          inlined into the initial server HTML in strict order and execute
          before any React hydration. next/script with beforeInteractive
          serializes children into self.__next_s which is flushed by the
          Next.js runtime — that created a race with the async gtm.js loader
          and caused GA4 config to fire unreliably.

          Order matters:
            1. Consent defaults (dataLayer + gtag() stub + denied state)
            2. GA loader tag (async fetch)
            3. gtag('config', ...) page_view — pushed to dataLayer, processed
               by gtm.js as soon as it finishes loading
            4. AdSense loader (independent, needs head placement for Google
               site verification)
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}window.gtag = gtag;gtag('consent', 'default', {'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'denied','functionality_storage':'granted','security_storage':'granted','wait_for_update':500});gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',true);`,
          }}
        />
        {GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `gtag('js', new Date());gtag('config', '${GA_ID}', {'anonymize_ip':true});`,
              }}
            />
          </>
        )}
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
