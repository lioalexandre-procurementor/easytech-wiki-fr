import { NextRequest, NextResponse } from "next/server";
import { requireAdminWithReauth } from "@/lib/admin-guard";
import { deleteGeneralFromUnit } from "@/lib/admin-votes";
import { parseGame } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { game: string; unit: string; general: string } }
) {
  const gate = await requireAdminWithReauth();
  if (gate) return gate;
  const game = parseGame(params.game);
  if (!game) return NextResponse.json({ error: "bad game" }, { status: 400 });
  const removed = await deleteGeneralFromUnit(game, params.unit, params.general);
  return NextResponse.json({ ok: true, removed });
}
