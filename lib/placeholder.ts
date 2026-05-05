/**
 * Placeholder detection — GCR/EW6 entities auto-generated from decrypted
 * game files carry a boilerplate longDesc ending "à enrichir". This used
 * to gate noindex + sitemap exclusion + ad-slot suppression.
 *
 * Per the 2026-05-05 SEO remediation plan it now ONLY drives ad-slot
 * suppression (AdSense thin-content rule). Placeholder pages are
 * indexable and listed in the sitemap; the noindex blanket caused the
 * 4/22 indexing cliff and was rolled back.
 *
 * See EasyTech-Wiki-SEO-remediation-plan-2026-05-05.md (Bucket A).
 */
const PLACEHOLDER_RE = /à enrichir|Fiche générée automatiquement/i;

export function isPlaceholder(
  entity: { longDesc?: string | null } | null | undefined
): boolean {
  if (!entity) return false;
  return PLACEHOLDER_RE.test(entity.longDesc ?? "");
}
