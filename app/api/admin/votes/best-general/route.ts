import { NextResponse } from "next/server";
import { requireAdmin, requireAdminWithReauth } from "@/lib/admin-guard";
import { getBestGeneralTally, resetBestGeneral } from "@/lib/admin-votes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const gate = requireAdmin();
  if (gate) return gate;
  const data = await getBestGeneralTally();
  return NextResponse.json(data);
}

export async function DELETE() {
  const gate = requireAdminWithReauth();
  if (gate) return gate;
  await resetBestGeneral();
  return NextResponse.json({ ok: true });
}
