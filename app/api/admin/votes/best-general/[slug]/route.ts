import { NextRequest, NextResponse } from "next/server";
import { requireAdminWithReauth } from "@/lib/admin-guard";
import { deleteBestGeneralSlug } from "@/lib/admin-votes";
import { parseGame } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  const gate = await requireAdminWithReauth();
  if (gate) return gate;
  const game = parseGame(req.nextUrl.searchParams.get("game"));
  if (!game) return NextResponse.json({ error: "invalid game" }, { status: 400 });
  const removed = await deleteBestGeneralSlug(game, params.slug);
  return NextResponse.json({ ok: true, removed });
}
