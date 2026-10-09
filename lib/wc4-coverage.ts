import type { Metadata } from "next";
import referenceData from "@/data/wc4/reference-entries.json";
import releaseData from "@/data/wc4/release-status.json";
import type { Locale } from "@/src/i18n/config";

export type ReferenceKind = "unit" | "general" | "formation" | "skill" | "training";
export interface ReferenceEntry {
  kind: ReferenceKind;
  slug: string;
  name: Record<Locale, string>;
  summary: Record<Locale, string>;
  pending: Record<Locale, string>;
  category?: string;
  evidence: {
    status: "official-announcement";
    gameVersion: string;
    platform: "ios";
    sourceUrl: string;
    sourcePublishedAt: string;
    lastVerifiedAt: string;
  };
}

export const releaseStatus = releaseData;
const references = referenceData as ReferenceEntry[];
export const getReferences = (kind: ReferenceKind) => references.filter(r => r.kind === kind);
export const getReference = (kind: ReferenceKind, slug: string) => references.find(r => r.kind === kind && r.slug === slug);
export const localeKey = (locale: string): Locale => locale === "fr" || locale === "de" ? locale : "en";

export function referencePath(entry: ReferenceEntry, locale: string): string {
  const fr = locale === "fr";
  const segments: Record<ReferenceKind, string> = {
    unit: fr ? "unites-elite" : "elite-units",
    general: fr ? "generaux" : "generals",
    formation: fr ? "formations-legendes" : "legend-formations",
    skill: fr ? "competences" : "skills",
    training: fr ? "generaux" : "generals",
  };
  const suffix = entry.kind === "training" ? (fr ? "/entrainement-premium" : "/premium-training") : "";
  return `/world-conqueror-4/${segments[entry.kind]}/${entry.slug}${suffix}`;
}

export function referenceMetadata(entry: ReferenceEntry, locale: string): Metadata {
  const loc = localeKey(locale);
  return {
    title: `${entry.name[loc]} (WC4)`,
    description: entry.summary[loc],
    alternates: {
      canonical: `/${loc}${referencePath(entry, loc)}`,
      languages: Object.fromEntries([
        ...["fr", "en", "de"].map(l => [l, `/${l}${referencePath(entry, l)}`]),
        ["x-default", `/fr${referencePath(entry, "fr")}`],
      ]),
    },
    robots: { index: true, follow: true },
  };
}
