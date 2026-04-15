/**
 * Central legal & compliance configuration.
 *
 * ⚠️ BEFORE LAUNCH: Fill in the placeholders marked [TO FILL IN].
 * Required by French law (Loi pour la Confiance dans l'Économie Numérique, LCEN)
 * and EU GDPR (Règlement Général sur la Protection des Données).
 *
 * If Alex is operating as an individual (not a company), that is fine — the
 * mentions légales must still include name, contact, and hosting info.
 */

export const legalConfig = {
  // --- Identity of the publisher / directeur de la publication ---
  publisher: {
    // Full legal name of the person or company publishing the site
    name: "[TO FILL IN — Prénom Nom ou Raison sociale]",
    // "individual" | "company"
    type: "individual" as "individual" | "company",
    // Company-only fields (ignore if individual)
    legalForm: "", // e.g. "SASU", "EURL", "Auto-entrepreneur"
    siren: "", // 9-digit SIREN number
    siret: "", // 14-digit SIRET number
    vatNumber: "", // FR + 11 chars
    shareCapital: "", // e.g. "1 000 €"
    // Contact (required regardless of type)
    email: "contact@[TO FILL IN — domain.fr]",
    // Mailing address — can be a work address or PO box; NEVER a personal home address on a public site
    address: "[TO FILL IN — adresse postale professionnelle ou BP]",
    city: "[Ville]",
    postalCode: "[Code postal]",
    country: "France",
    // Director of publication (French legal concept) — same as the publisher in most cases
    publicationDirector: "[TO FILL IN — nom du directeur de la publication]",
  },

  // --- Hosting provider (required by LCEN art. 6) ---
  host: {
    name: "Vercel Inc.",
    address: "340 S Lemon Ave #4133, Walnut, CA 91789, USA",
    website: "https://vercel.com",
    // Optional but useful
    phone: "—",
  },

  // --- CNIL declaration (RGPD) ---
  // Since May 2018, no CNIL declaration is required in France, but contact
  // info for the data controller (responsable de traitement) is mandatory.
  dataController: {
    name: "[TO FILL IN — same as publisher unless delegated]",
    email: "privacy@[TO FILL IN — domain.fr]",
    // CNIL contact for user complaints — fixed public info
    cnilWebsite: "https://www.cnil.fr",
    cnilComplaintUrl: "https://www.cnil.fr/fr/plaintes",
  },

  // --- Analytics & third-party services used ---
  analytics: {
    // Plausible = cookieless, RGPD-compliant, no consent banner needed
    provider: "Plausible Analytics",
    cookieless: true,
    dataLocation: "EU (Germany)",
  },

  // --- Domain info ---
  site: {
    name: "EasyTech Wiki FR",
    shortName: "EasyTech Wiki",
    domain: "[TO FILL IN — example: easytechwiki.fr]",
    url: "https://[TO FILL IN — domain]",
    launchYear: 2026,
  },

  // --- Disclaimers ---
  disclaimer: {
    // All EasyTech games mentioned
    games: [
      "World Conqueror 4",
      "European War 6",
      "European War 7",
      "Great Conqueror: Rome",
      "Great Conqueror 2",
      "Age of Conquest",
    ],
    studioName: "EasyTech Studio (易幻网络)",
  },
} as const;

export type LegalConfig = typeof legalConfig;
