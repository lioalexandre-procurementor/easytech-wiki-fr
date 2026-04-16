import Link from "next/link";
import { notFound } from "next/navigation";
import type { EntityType } from "@/lib/overrides";
import { getAllEliteUnits, getAllGenerals } from "@/lib/units";
import {
  getAllEliteUnits as getAllGcrEliteUnits,
  getAllGenerals as getAllGcrGenerals,
} from "@/lib/gcr";
import {
  getAllEliteUnits as getAllEw6EliteUnits,
  getAllGenerals as getAllEw6Generals,
} from "@/lib/ew6";
import { getAllGuides } from "@/lib/guides";
import { getAllUpdates } from "@/lib/updates";
import fs from "node:fs";
import path from "node:path";
import EntityListSearch from "@/components/admin/EntityListSearch";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = {
  slug: string;
  title: string;
  subtitle?: string;
  preliminary?: boolean;
};

const LABEL_BY_TYPE: Partial<Record<EntityType, string>> = {
  "elite-unit": "Elite units (WC4)",
  general: "Generals (WC4)",
  guide: "Guides (WC4)",
  update: "Update entries (WC4)",
  "gcr-elite-unit": "Elite units (GCR)",
  "gcr-general": "Generals (GCR)",
  "gcr-guide": "Guides (GCR)",
  "gcr-update": "Update entries (GCR)",
  "ew6-elite-unit": "Elite units (EW6)",
  "ew6-general": "Generals (EW6)",
  "ew6-guide": "Guides (EW6)",
  "ew6-update": "Update entries (EW6)",
};

/** Read slugs from a `data/<game>/<dir>/*.json` folder, skipping `_index`. */
function listSlugsFromDataDir(game: "wc4" | "gcr" | "ew6", subdir: string): string[] {
  const dir = path.join(process.cwd(), "data", game, subdir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(/\.json$/, ""));
}

function collect(entityType: EntityType): Row[] {
  switch (entityType) {
    case "elite-unit":
      return getAllEliteUnits().map((u) => ({
        slug: u.slug,
        title: u.name,
        subtitle: `${u.category} · ${u.country} · ${u.tier}${u.faction === "scorpion" ? " · scorpion" : ""}`,
        preliminary: u.preliminary,
      }));
    case "general":
      return getAllGenerals().map((g) => ({
        slug: g.slug,
        title: g.name,
        subtitle: `${g.quality} · ${g.category} · ${g.country}${g.hasTrainingPath ? " · trainable" : ""}`,
      }));
    case "guide":
      return getAllGuides().map((g) => ({
        slug: g.slug,
        title: g.title?.fr ?? g.slug,
        subtitle: `${g.category} · ${g.readingTimeMinutes}min`,
      }));
    case "update":
      return getAllUpdates().map((u) => ({
        slug: u.slug,
        title: u.title?.fr ?? u.slug,
        subtitle: `${u.version ?? ""} · ${u.date ?? ""}`,
      }));
    case "gcr-elite-unit":
      return getAllGcrEliteUnits().map((u) => ({
        slug: u.slug,
        title: u.name,
        subtitle: `${u.category} · ${u.country} · ${u.tier}${u.faction === "barbarian" ? " · barbarian" : ""}`,
        preliminary: u.preliminary,
      }));
    case "gcr-general":
      return getAllGcrGenerals().map((g) => ({
        slug: g.slug,
        title: g.name,
        subtitle: `${g.quality} · ${g.category} · ${g.country}${g.faction === "barbarian" ? " · barbarian" : ""}`,
      }));
    case "gcr-guide":
      // Directory reads only — typed guide lib is WC4-scoped for now.
      // Editorial content for GCR hasn't landed; list is typically empty.
      return listSlugsFromDataDir("gcr", "guides").map((slug) => ({
        slug,
        title: slug,
        subtitle: "guide · gcr",
      }));
    case "gcr-update":
      return listSlugsFromDataDir("gcr", "updates").map((slug) => ({
        slug,
        title: slug,
        subtitle: "update · gcr",
      }));
    case "ew6-elite-unit":
      return getAllEw6EliteUnits().map((u) => ({
        slug: u.slug,
        title: u.name,
        subtitle: `${u.category} · ${u.country} · ${u.tier}`,
        preliminary: u.preliminary,
      }));
    case "ew6-general":
      return getAllEw6Generals().map((g) => ({
        slug: g.slug,
        title: g.name,
        subtitle: `${g.quality} · ${g.category} · ${g.country}`,
      }));
    case "ew6-guide":
      return listSlugsFromDataDir("ew6", "guides").map((slug) => ({
        slug,
        title: slug,
        subtitle: "guide · ew6",
      }));
    case "ew6-update":
      return listSlugsFromDataDir("ew6", "updates").map((slug) => ({
        slug,
        title: slug,
        subtitle: "update · ew6",
      }));
    default:
      return [];
  }
}

export default function EntityListPage({
  params,
}: {
  params: { entityType: string };
}) {
  const entityType = params.entityType as EntityType;
  if (!LABEL_BY_TYPE[entityType]) return notFound();
  const rows = collect(entityType);

  return (
    <div>
      <Link href="/admin/content" style={{ color: "#9aa5b4", fontSize: 12, textDecoration: "none" }}>
        ← Content hub
      </Link>
      <h2 style={{ margin: "10px 0 14px", fontSize: 24, fontWeight: 800 }}>
        {LABEL_BY_TYPE[entityType]}
      </h2>
      <div style={{ color: "#9aa5b4", fontSize: 12, marginBottom: 14 }}>
        {rows.length} entries. Click any to edit.
      </div>
      <EntityListSearch
        entityType={entityType}
        rows={rows.map((r) => ({
          slug: r.slug,
          title: r.title,
          subtitle: r.subtitle ?? "",
          preliminary: Boolean(r.preliminary),
        }))}
      />
    </div>
  );
}
