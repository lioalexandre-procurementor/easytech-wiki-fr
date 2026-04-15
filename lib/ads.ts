/**
 * Central registry of Google AdSense slot IDs.
 *
 * Slot IDs come from AdSense → Ads → By ad unit. We read them from env so that:
 *  - Non-prod builds (where the vars are empty) render the dev placeholder
 *    instead of a real ad.
 *  - Preview and production can point at different units if we ever want to
 *    A/B a placement without touching code.
 *
 * To add a new placement: create the unit in AdSense, add a new env var in
 * Vercel, and add an entry here. Then use `<AdSlot name="…" />` at the call
 * site.
 */
export const AD_SLOTS = {
  /** Top of in-article content on detail pages (general/unit). High CTR. */
  inArticleTop: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE_TOP ?? "",
  /** Mid-article on detail pages, between two content sections. */
  inArticleMid: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE_MID ?? "",
  /** Bottom of listing / hub pages. */
  listingBottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LISTING_BOTTOM ?? "",
} as const;

export type AdSlotName = keyof typeof AD_SLOTS;
