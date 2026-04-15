"use client";

import { useEffect, useRef } from "react";
import { AD_SLOTS, type AdSlotName } from "@/lib/ads";

/**
 * AdSlot — a single Google AdSense display slot.
 *
 * Behaviour:
 *  - If NEXT_PUBLIC_ADSENSE_CLIENT is empty (dev or pre-approval), or if no
 *    slot id is resolved, we render a static placeholder with the same
 *    footprint as the real ad. This keeps the layout stable and signals to
 *    the author where ads will appear.
 *  - If NEXT_PUBLIC_ADSENSE_CLIENT is set AND a slot id is resolved, we
 *    render the real <ins> tag and push it to adsbygoogle once mounted.
 *
 * Two ways to specify which slot to render:
 *  - `name="inArticleTop"` — preferred. Looks the id up in the central
 *    registry at lib/ads.ts, which reads from env vars. Keeps slot ids out
 *    of page components.
 *  - `slot="1234567890"` — raw override. Use only for one-off experiments.
 *
 * Consent: the AdSense script itself is loaded in app/[locale]/layout.tsx,
 * *after* Google Consent Mode v2 has been initialised (state = denied by
 * default) and after Google Funding Choices (CMP) has had a chance to prompt
 * the user. Ads will only serve personalized once the user grants consent.
 */
export type AdSlotProps = {
  /** Named slot from the central registry (lib/ads.ts). Preferred. */
  name?: AdSlotName;
  /** Raw AdSense slot id. Escape hatch — use `name` when possible. */
  slot?: string;
  /** "auto" = responsive (default). Set "horizontal"/"rectangle" to constrain. */
  format?: "auto" | "horizontal" | "rectangle" | "vertical";
  /** Allow the ad to fluidly resize. Usually true. */
  responsive?: boolean;
  /** Optional extra class names for layout (margin, max-width…). */
  className?: string;
  /** Label shown on the placeholder in dev. */
  label?: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

export function AdSlot({
  name,
  slot,
  format = "auto",
  responsive = true,
  className = "",
  label = "Publicité",
}: AdSlotProps) {
  const pushed = useRef(false);

  // Resolve the slot id: explicit `slot` prop wins, otherwise look up by name.
  const resolvedSlot = slot || (name ? AD_SLOTS[name] : "");

  useEffect(() => {
    if (!CLIENT || !resolvedSlot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (err) {
      // swallow — happens on fast nav before the script is ready; AdSense
      // retries automatically on the next navigation.
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn("[AdSlot] push failed", err);
      }
    }
  }, [resolvedSlot]);

  // Dev / pre-approval placeholder
  if (!CLIENT || !resolvedSlot) {
    return (
      <div
        className={`ad-slot ${className}`}
        role="presentation"
        aria-label={label}
      >
        {label}
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle block ${className}`}
      style={{ display: "block" }}
      data-ad-client={CLIENT}
      data-ad-slot={resolvedSlot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
