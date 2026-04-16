import { NextRequest, NextResponse } from "next/server";
import { requireAdminWithReauth } from "@/lib/admin-guard";
import { deleteSkillFromSlot } from "@/lib/admin-votes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { general: string; slot: string; skill: string } }
) {
  const gate = requireAdminWithReauth();
  if (gate) return gate;
  const slot = Number(params.slot);
  if (!Number.isInteger(slot) || slot < 1 || slot > 5) {
    return NextResponse.json({ error: "bad slot" }, { status: 400 });
  }
  const removed = await deleteSkillFromSlot(params.general, slot, params.skill);
  return NextResponse.json({ ok: true, removed });
}
