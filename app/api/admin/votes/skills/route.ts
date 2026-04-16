import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { listSkillVoteKeys } from "@/lib/admin-votes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const gate = requireAdmin();
  if (gate) return gate;
  const keys = await listSkillVoteKeys();
  return NextResponse.json({ keys });
}
