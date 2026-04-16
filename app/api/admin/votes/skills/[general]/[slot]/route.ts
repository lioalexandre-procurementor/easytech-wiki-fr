import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireAdminWithReauth } from "@/lib/admin-guard";
import { getSkillSlotTally, resetSkillSlot } from "@/lib/admin-votes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseSlot(s: string): number | null {
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { general: string; slot: string } }
) {
  const gate = requireAdmin();
  if (gate) return gate;
  const slot = parseSlot(params.slot);
  if (!slot) return NextResponse.json({ error: "bad slot" }, { status: 400 });
  const data = await getSkillSlotTally(params.general, slot);
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { general: string; slot: string } }
) {
  const gate = requireAdminWithReauth();
  if (gate) return gate;
  const slot = parseSlot(params.slot);
  if (!slot) return NextResponse.json({ error: "bad slot" }, { status: 400 });
  await resetSkillSlot(params.general, slot);
  return NextResponse.json({ ok: true });
}
