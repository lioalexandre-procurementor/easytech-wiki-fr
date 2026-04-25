import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireAdminWithReauth } from "@/lib/admin-guard";
import { getUnitGeneralTally, resetUnitGeneral } from "@/lib/admin-votes";
import { parseGame } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { game: string; unit: string } }
) {
  const gate = await requireAdmin();
  if (gate) return gate;
  const game = parseGame(params.game);
  if (!game) return NextResponse.json({ error: "bad game" }, { status: 400 });
  const data = await getUnitGeneralTally(game, params.unit);
  if (!data) return NextResponse.json({ error: "unknown unit" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { game: string; unit: string } }
) {
  const gate = await requireAdminWithReauth();
  if (gate) return gate;
  const game = parseGame(params.game);
  if (!game) return NextResponse.json({ error: "bad game" }, { status: 400 });
  await resetUnitGeneral(game, params.unit);
  return NextResponse.json({ ok: true });
}
