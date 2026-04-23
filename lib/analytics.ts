/**
 * GA4 custom event helper.
 *
 * All events are routed through the single `window.gtag` queue set up in
 * `app/[locale]/layout.tsx` (Google Consent Mode v2 + GA4). Events fired
 * before the user has granted analytics consent are silently dropped by
 * gtag itself — we don't need to re-check consent here.
 *
 * Keep event names in the GA4 recommended-snake_case format. Keep param
 * keys under 40 chars. Limit cardinality (e.g. don't send raw URLs as
 * event values; prefer slug/id fields).
 */

export type GtagEventParams = Record<string, string | number | boolean | null | undefined>;

type GtagFn = (
  command: "event" | "config" | "set" | "consent" | "js",
  name: string,
  params?: GtagEventParams,
) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

/**
 * Emit a GA4 custom event. Safe on the server (no-op), safe before gtag
 * has finished loading (queued via window.dataLayer), safe under denied
 * consent (gtag drops the hit).
 */
export function trackEvent(name: string, params: GtagEventParams = {}): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params);
    } else if (Array.isArray(window.dataLayer)) {
      // gtag stub not yet installed — push raw so it gets replayed.
      window.dataLayer.push(["event", name, params]);
    }
  } catch {
    // Never throw from analytics.
  }
}

/** Convenience helpers for the events fired from this codebase. */
export const analytics = {
  voteCast(params: { game: string; entity: "best_general" | "best_general_for_unit" | "trained_skill"; slug: string; unitSlug?: string }): void {
    trackEvent("vote_cast", params);
  },
  outboundClick(params: { network: string; href: string; location: "footer" | "header" | "body" }): void {
    trackEvent("outbound_click", params);
  },
  guideRead(params: { slug: string; game: string; locale: string }): void {
    trackEvent("guide_read", params);
  },
};
