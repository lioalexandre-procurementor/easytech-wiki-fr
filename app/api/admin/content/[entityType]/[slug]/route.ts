import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import {
  applyPatch,
  clearOverride,
  computeDelta,
  getOverride,
  setOverride,
  tagFor,
  type EntityType,
} from "@/lib/overrides";
import { loadBase } from "@/lib/content-editable";
import { setTicketStatus } from "@/lib/tickets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID: EntityType[] = [
  "elite-unit",
  "general",
  "guide",
  "update",
  "skill",
  "technology",
];

function entityTypeOf(raw: string): EntityType | null {
  return (VALID as string[]).includes(raw) ? (raw as EntityType) : null;
}

/** GET — returns base JSON + current patch + merged (what the editor seeds from). */
export async function GET(
  _req: NextRequest,
  { params }: { params: { entityType: string; slug: string } }
) {
  const gate = await requireAdmin();
  if (gate) return gate;
  const entityType = entityTypeOf(params.entityType);
  if (!entityType) return NextResponse.json({ error: "bad entity type" }, { status: 400 });

  const base = loadBase(entityType, params.slug);
  if (!base) return NextResponse.json({ error: "not found" }, { status: 404 });

  const record = await getOverride(entityType, params.slug);
  const patch = record?.patch;
  const merged = patch ? applyPatch(base, patch) : base;
  return NextResponse.json({
    entityType,
    slug: params.slug,
    base,
    patch: patch ?? null,
    merged,
    updatedAt: record?.updatedAt ?? null,
    updatedBy: record?.updatedBy ?? null,
  });
}

/**
 * PUT — editor ships the full edited entity. Server computes delta vs
 * base and stores only the delta so base updates propagate naturally for
 * untouched fields. If the body matches base exactly, the override is
 * cleared. Optionally resolves a linked verification ticket.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { entityType: string; slug: string } }
) {
  const gate = await requireAdmin();
  if (gate) return gate;
  const entityType = entityTypeOf(params.entityType);
  if (!entityType) return NextResponse.json({ error: "bad entity type" }, { status: 400 });

  let body: { edited?: unknown; note?: string; resolveTicketId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (body.edited === undefined) {
    return NextResponse.json({ error: "missing edited" }, { status: 400 });
  }

  const base = loadBase(entityType, params.slug);
  if (!base) return NextResponse.json({ error: "entity not found" }, { status: 404 });

  const delta = computeDelta(base, body.edited);
  if (delta === undefined) {
    // No changes vs base — clear any existing override.
    const cleared = await clearOverride(entityType, params.slug);
    revalidateTag(tagFor(entityType, params.slug));
    revalidateTag(`${entityType}:all`);
    return NextResponse.json({ ok: true, cleared, delta: null });
  }

  await setOverride(entityType, params.slug, delta, "admin", body.note);
  revalidateTag(tagFor(entityType, params.slug));
  revalidateTag(`${entityType}:all`);

  let ticketResolved = false;
  if (body.resolveTicketId) {
    const t = await setTicketStatus(body.resolveTicketId, "resolved");
    ticketResolved = Boolean(t);
  }

  return NextResponse.json({ ok: true, delta, ticketResolved });
}

/** DELETE — reverts the entity to pure base by dropping the override. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { entityType: string; slug: string } }
) {
  const gate = await requireAdmin();
  if (gate) return gate;
  const entityType = entityTypeOf(params.entityType);
  if (!entityType) return NextResponse.json({ error: "bad entity type" }, { status: 400 });
  const cleared = await clearOverride(entityType, params.slug);
  revalidateTag(tagFor(entityType, params.slug));
  revalidateTag(`${entityType}:all`);
  return NextResponse.json({ ok: true, cleared });
}
