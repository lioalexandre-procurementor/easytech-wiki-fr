"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/src/i18n/navigation";

const STORAGE_KEY = "ew_consent_v1";

type ConsentChoice = "granted" | "denied";

type GtagFn = (...args: unknown[]) => void;

const LABELS: Record<
  string,
  {
    title: string;
    body: string;
    manage: string;
    accept: string;
    reject: string;
    policy: string;
  }
> = {
  fr: {
    title: "Cookies & mesure d'audience",
    body: "Nous utilisons des cookies et technologies similaires pour mesurer l'audience du site (Google Analytics) et, à terme, afficher des publicités (Google AdSense). Vous pouvez accepter, refuser, ou consulter notre politique pour en savoir plus. Votre choix est conservé 6 mois.",
    manage: "En savoir plus",
    accept: "Tout accepter",
    reject: "Tout refuser",
    policy: "politique cookies",
  },
  en: {
    title: "Cookies & analytics",
    body: "We use cookies and similar technologies to measure site traffic (Google Analytics) and, later, to serve ads (Google AdSense). You can accept, reject, or read our policy to learn more. Your choice is stored for 6 months.",
    manage: "Learn more",
    accept: "Accept all",
    reject: "Reject all",
    policy: "cookie policy",
  },
  de: {
    title: "Cookies & Analyse",
    body: "Wir verwenden Cookies und ähnliche Technologien, um die Zugriffe auf die Website zu messen (Google Analytics) und später Werbung auszuliefern (Google AdSense). Du kannst zustimmen, ablehnen oder unsere Richtlinie einsehen. Deine Auswahl wird 6 Monate gespeichert.",
    manage: "Mehr erfahren",
    accept: "Alle akzeptieren",
    reject: "Alle ablehnen",
    policy: "Cookie-Richtlinie",
  },
};

function readStoredChoice(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { choice: ConsentChoice; ts: number };
    const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 180;
    if (Date.now() - parsed.ts > SIX_MONTHS_MS) return null;
    if (parsed.choice === "granted" || parsed.choice === "denied") {
      return parsed.choice;
    }
    return null;
  } catch {
    return null;
  }
}

function writeChoice(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ choice, ts: Date.now() })
    );
  } catch {
    /* quota full, private mode — ignore */
  }
}

function pushConsentUpdate(choice: ConsentChoice) {
  const w = window as unknown as { gtag?: GtagFn };
  if (typeof w.gtag !== "function") return;
  const value = choice === "granted" ? "granted" : "denied";
  w.gtag("consent", "update", {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  });
}

export default function ConsentBanner() {
  const locale = useLocale();
  const labels = LABELS[locale] ?? LABELS.en;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prior = readStoredChoice();
    if (prior === null) {
      setVisible(true);
      return;
    }
    // Replay the stored choice so Consent Mode reflects it on every page load.
    pushConsentUpdate(prior);
  }, []);

  if (!visible) return null;

  function handle(choice: ConsentChoice) {
    writeChoice(choice);
    pushConsentUpdate(choice);
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-banner-title"
      className="fixed bottom-0 inset-x-0 z-[9998] border-t border-border bg-[#0a0e13]/95 backdrop-blur-sm"
    >
      <div className="max-w-5xl mx-auto px-5 py-4 flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
        <div className="flex-1 min-w-0 text-sm text-ink leading-relaxed">
          <div id="consent-banner-title" className="font-bold text-gold2 mb-1">
            {labels.title}
          </div>
          <p className="text-dim">
            {labels.body}{" "}
            <Link
              href="/legal/cookies"
              className="underline hover:text-gold2"
            >
              {labels.policy}
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handle("denied")}
            className="min-h-[44px] px-4 py-2 text-sm font-semibold rounded-lg border border-border text-dim hover:text-ink hover:border-gold2 transition-colors"
          >
            {labels.reject}
          </button>
          <button
            type="button"
            onClick={() => handle("granted")}
            className="min-h-[44px] px-4 py-2 text-sm font-bold rounded-lg bg-gold text-[#0a0e13] hover:bg-gold2 transition-colors"
          >
            {labels.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
