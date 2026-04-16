import Link from "next/link";
import { notFound } from "next/navigation";
import type { EntityType } from "@/lib/overrides";
import { getAllEliteUnits, getAllGenerals } from "@/lib/units";
import { getAllGuides } from "@/lib/guides";
import { getAllUpdates } from "@/lib/updates";
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
  "elite-unit": "Elite units",
  general: "Generals",
  guide: "Guides",
  update: "Update entries",
};

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
