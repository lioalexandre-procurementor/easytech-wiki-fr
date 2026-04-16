import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireAdminWithReauth } from "@/lib/admin-guard";
import { getBestGeneralTally, resetBestGeneral } from "@/lib/admin-votes";
import { parseGame } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if (gate) return gate;
  const game = parseGame(req.nextUrl.searchParams.get("game"));
  if (!game) return NextResponse.json({ error: "invalid game" }, { status: 400 });
  const data = await getBestGeneralTally(game);
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const gate = await requireAdminWithReauth();
  if (gate) return gate;
  const game = parseGame(req.nextUrl.searchParams.get("game"));
  if (!game) return NextResponse.json({ error: "invalid game" }, { status: 400 });
  await resetBestGeneral(game);
  return NextResponse.json({ ok: true });
}
