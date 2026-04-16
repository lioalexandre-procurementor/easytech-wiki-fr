import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireAdminWithReauth } from "@/lib/admin-guard";
import { deleteTicket, getTicket, setTicketStatus } from "@/lib/tickets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const gate = requireAdmin();
  if (gate) return gate;
  const ticket = await getTicket(params.id);
  if (!ticket) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ticket });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = requireAdmin();
  if (gate) return gate;
  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (body.status !== "open" && body.status !== "resolved") {
    return NextResponse.json({ error: "bad status" }, { status: 400 });
  }
  const ticket = await setTicketStatus(params.id, body.status);
  if (!ticket) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ticket });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  // Delete is destructive → require fresh reauth.
  const gate = requireAdminWithReauth();
  if (gate) return gate;
  const ok = await deleteTicket(params.id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
