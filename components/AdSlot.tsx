"use client";

import { useEffect, useRef } from "react";

/**
 * AdSlot — a single Google AdSense display slot.
 *
 * Behaviour:
 *  - If NEXT_PUBLIC_ADSENSE_CLIENT is empty (dev or pre-approval), we render
 *    a static placeholder with the same footprint as the real ad. This keeps
 *    the layout stable and signals to the author where ads will appear.
 *  - If NEXT_PUBLIC_ADSENSE_CLIENT is set, we render the real <ins> tag and
 *    push it to adsbygoogle once mounted.
 *
 * Consent: the AdSense script itself is loaded in app/[locale]/layout.tsx,
 * *after* Google Consent Mode v2 has been initialised (state = denied by
 * default) and after Google Funding Choices (CMP) has had a chance to prompt
 * the user. Ads will only serve once the user grants consent.
 */
export type AdSlotProps = {
  /** Data slot id provided by AdSense for this ad unit (optional at launch). */
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
  slot,
  format = "auto",
  responsive = true,
  className = "",
  label = "Publicité",
}: AdSlotProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!CLIENT || !slot || pushed.current) return;
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
  }, [slot]);

  // Dev / pre-approval placeholder
  if (!CLIENT || !slot) {
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
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
