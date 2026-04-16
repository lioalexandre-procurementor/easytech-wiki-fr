import { NextRequest, NextResponse } from "next/server";
import { requireAdminWithReauth } from "@/lib/admin-guard";
import { deleteBestGeneralSlug } from "@/lib/admin-votes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string } }) {
  const gate = await requireAdminWithReauth();
  if (gate) return gate;
  const removed = await deleteBestGeneralSlug(params.slug);
  return NextResponse.json({ ok: true, removed });
}
