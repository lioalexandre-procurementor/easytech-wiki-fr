import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { listTickets } from "@/lib/tickets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if (gate) return gate;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const kind = searchParams.get("kind");
  const source = searchParams.get("source");
  const offset = Number(searchParams.get("offset") ?? "0");
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);

  const data = await listTickets({
    status: status === "open" || status === "resolved" ? status : undefined,
    kind: kind === "bug" || kind === "verification" ? kind : undefined,
    source: source === "user" || source === "system" ? source : undefined,
    offset: Number.isFinite(offset) ? offset : 0,
    limit: Number.isFinite(limit) ? limit : 50,
  });
  return NextResponse.json(data);
}
