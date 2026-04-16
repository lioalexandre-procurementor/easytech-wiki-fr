import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { requireAdmin } from "@/lib/admin-guard";
import { createVerificationTicket } from "@/lib/tickets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SeedEntry = {
  seedSlug: string;
  title: string;
  description: string;
  pageUrl: string;
  context?: string;
  locale?: string;
};

export async function POST() {
  const gate = requireAdmin();
  if (gate) return gate;

  const seedPath = path.join(process.cwd(), "data", "verification-tickets-seed.json");
  if (!fs.existsSync(seedPath)) {
    return NextResponse.json({ error: "seed file missing" }, { status: 500 });
  }
  const raw = JSON.parse(fs.readFileSync(seedPath, "utf8")) as {
    tickets?: SeedEntry[];
  };
  const entries = Array.isArray(raw.tickets) ? raw.tickets : [];
  if (entries.length === 0) {
    return NextResponse.json({ created: 0, skipped: 0, total: 0 });
  }

  let created = 0;
  let skipped = 0;
  for (const entry of entries) {
    try {
      const { created: wasCreated } = await createVerificationTicket(entry);
      if (wasCreated) created++;
      else skipped++;
    } catch {
      // Redis not configured — bail out early with a partial report.
      return NextResponse.json(
        {
          error: "redis not configured",
          created,
          skipped,
          total: entries.length,
        },
        { status: 503 }
      );
    }
  }
  return NextResponse.json({ created, skipped, total: entries.length });
}
