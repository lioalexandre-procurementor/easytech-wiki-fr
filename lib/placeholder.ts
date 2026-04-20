/**
 * Placeholder detection — GCR/EW6 entities auto-generated from decrypted
 * game files carry a boilerplate longDesc ending "à enrichir". Hub pages
 * add rel="nofollow" on links to these so Google does not waste crawl
 * budget discovering URLs that are noindex on their detail page.
 *
 * See EasyTech-Wiki-SEO-Ads-Strategy-Assessment-2026-04-16.md (Plan A)
 * and app/sitemap.ts which filters these out of the published sitemap.
 */
const PLACEHOLDER_RE = /à enrichir|Fiche générée automatiquement/i;

export function isPlaceholder(
  entity: { longDesc?: string | null } | null | undefined
): boolean {
  if (!entity) return false;
  return PLACEHOLDER_RE.test(entity.longDesc ?? "");
}
