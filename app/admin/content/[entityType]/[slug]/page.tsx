import Link from "next/link";
import { notFound } from "next/navigation";
import type { EntityType } from "@/lib/overrides";
import { applyPatch, getOverride } from "@/lib/overrides";
import { loadBase } from "@/lib/content-editable";
import { getTicket } from "@/lib/tickets";
import EntityEditor from "@/components/admin/EntityEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_TYPES: EntityType[] = [
  "elite-unit",
  "general",
  "guide",
  "update",
];

function livePathFor(entityType: EntityType, slug: string): string {
  switch (entityType) {
    case "elite-unit":
      return `/fr/world-conqueror-4/unites-elite/${slug}`;
    case "general":
      return `/fr/world-conqueror-4/generaux/${slug}`;
    case "guide":
      return `/fr/world-conqueror-4/guides/${slug}`;
    case "update":
      return `/fr/world-conqueror-4/mises-a-jour/${slug}`;
    default:
      return "/";
  }
}

export default async function EntityEditorPage({
  params,
  searchParams,
}: {
  params: { entityType: string; slug: string };
  searchParams: { ticket?: string };
}) {
  const entityType = params.entityType as EntityType;
  if (!VALID_TYPES.includes(entityType)) return notFound();

  const base = loadBase(entityType, params.slug);
  if (!base) return notFound();

  const override = await getOverride(entityType, params.slug);
  const merged = override?.patch ? applyPatch(base, override.patch) : base;

  const ticket = searchParams.ticket ? await getTicket(searchParams.ticket) : null;

  return (
    <div>
      <Link
        href={`/admin/content/${entityType}`}
        style={{ color: "#9aa5b4", fontSize: 12, textDecoration: "none" }}
      >
        ← All {entityType}s
      </Link>
      <h2 style={{ margin: "10px 0 4px", fontSize: 22, fontWeight: 800 }}>
        Editing <code style={{ color: "#d4a44a" }}>{entityType}</code> /
        <code style={{ color: "#d4a44a" }}> {params.slug}</code>
      </h2>
      <div style={{ fontSize: 12, color: "#9aa5b4", marginBottom: 14 }}>
        <a
          href={livePathFor(entityType, params.slug)}
          target="_blank"
          rel="noreferrer"
          style={{ color: "#9aa5b4" }}
        >
          Open on the live site ↗
        </a>
        {override?.updatedAt && (
          <>
            {" · "}
            Last edited{" "}
            {new Date(override.updatedAt).toISOString().slice(0, 16).replace("T", " ")} UTC
            {override.updatedBy ? ` by ${override.updatedBy}` : ""}
          </>
        )}
      </div>

      {ticket && (
        <div
          style={{
            padding: "12px 14px",
            marginBottom: 16,
            background: "rgba(212,164,74,0.08)",
            border: "1px solid rgba(212,164,74,0.4)",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          <div style={{ color: "#d4a44a", fontWeight: 700, marginBottom: 4 }}>
            🔗 Linked ticket: {ticket.title || ticket.description.slice(0, 60)}
          </div>
          <div style={{ color: "#c9cfd8", fontSize: 12 }}>
            {ticket.description}
          </div>
          <div style={{ color: "#9aa5b4", fontSize: 11, marginTop: 4 }}>
            Ticket <code>{ticket.id}</code> ·{" "}
            {ticket.status === "open" ? (
              <>Saving will auto-resolve this ticket (toggle below).</>
            ) : (
              <>Already resolved.</>
            )}
          </div>
        </div>
      )}

      <EntityEditor
        entityType={entityType}
        slug={params.slug}
        base={base}
        merged={merged}
        hasOverride={Boolean(override)}
        ticketId={ticket?.status === "open" ? ticket.id : null}
      />
    </div>
  );
}
