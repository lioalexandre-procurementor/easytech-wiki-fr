/**
 * Locale-aware accessor for translatable descriptive fields on
 * generals / elite units / perks / etc.
 *
 * ## The sibling-field pattern
 *
 * Legacy JSONs on disk carry French content in flat fields like
 * `shortDesc`, `longDesc`, `countryName`. Rather than break the
 * schema, the German/English rollout adds sibling fields:
 *
 *   {
 *     "shortDesc": "Général blindée or — États-Unis.",      // FR canonical
 *     "shortDescEn": "Gold armor general — United States.", // EN override
 *     "shortDescDe": "Gold-Panzer-General — Vereinigte Staaten." // DE override
 *   }
 *
 * This helper resolves the right field for the current locale at
 * render time, with a safe fallback chain:
 *
 *   locale === "fr"  → <field>           (French canonical)
 *   locale === "en"  → <field>En    ?? <field>   (fall through to FR)
 *   locale === "de"  → <field>De    ?? <field>En ?? <field>   (fall through to EN → FR)
 *
 * If the locale-specific override is missing, the user at least sees
 * *some* text — never undefined or a React crash.
 */

type LocaleKey = "fr" | "en" | "de";

function resolveLocale(locale: string | undefined): LocaleKey {
  if (locale === "fr" || locale === "en" || locale === "de") return locale;
  return "fr";
}

/**
 * Generic resolver. Given an object with `<key>`, `<key>En`, `<key>De`
 * sibling string fields, return the one for the target locale with a
 * graceful fallback chain down to the French canonical.
 */
export function localizedField<T extends Record<string, unknown>>(
  obj: T,
  key: keyof T & string,
  locale: string | undefined
): string {
  const loc = resolveLocale(locale);
  const fr = (obj as Record<string, unknown>)[key];
  const en = (obj as Record<string, unknown>)[`${key}En`];
  const de = (obj as Record<string, unknown>)[`${key}De`];
  const pick =
    loc === "fr" ? fr :
    loc === "en" ? (en ?? fr) :
    /* de */       (de ?? en ?? fr);
  return typeof pick === "string" ? pick : "";
}

/**
 * Convenience wrapper with a narrower type for UnitData / GeneralData
 * descriptive fields.
 */
export function localizedUnitField(
  obj: Record<string, unknown>,
  key: "shortDesc" | "longDesc" | "countryName",
  locale: string | undefined
): string {
  return localizedField(obj as Record<string, unknown>, key, locale);
}

/**
 * Locale-aware accessor for perk strings.
 * A perk JSON looks like:
 *   { name, desc, nameEn?, nameDe?, descEn?, descDe?, ... }
 */
export function localizedPerkField(
  perk: Record<string, unknown>,
  key: "name" | "desc",
  locale: string | undefined
): string {
  return localizedField(perk, key, locale);
}

/**
 * Locale-aware accessor for FAQ entries on elite units.
 * A FAQ entry: `{ q, a, qEn?, qDe?, aEn?, aDe? }`.
 */
export function localizedFaq(
  faq: Record<string, unknown>,
  key: "q" | "a",
  locale: string | undefined
): string {
  return localizedField(faq, key, locale);
}
