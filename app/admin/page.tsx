import Link from "next/link";
import { getAdminStats } from "@/lib/admin-stats";
import SeedTicketsButton from "@/components/admin/SeedTicketsButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  return (
    <div>
      <h2 style={{ margin: "0 0 22px", fontSize: 24, fontWeight: 800 }}>Dashboard</h2>

      {!stats.redisConfigured && (
        <div
          style={{
            marginBottom: 24,
            padding: "12px 16px",
            background: "rgba(200,55,45,0.1)",
            border: "1px solid rgba(200,55,45,0.4)",
            borderRadius: 8,
            color: "#f3b2ad",
          }}
        >
          ⚠️ Redis isn't configured. Set{" "}
          <code>UPSTASH_REDIS_REST_URL</code> and{" "}
          <code>UPSTASH_REDIS_REST_TOKEN</code> on Vercel, then redeploy. All
          counts below will read zero until then.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <Tile label="Open tickets" value={stats.tickets.open} accent="#d4a44a" />
        <Tile label="Total tickets" value={stats.tickets.total} />
        <Tile label="Bug reports" value={stats.ticketsByKind.bug} />
        <Tile label="Verification tasks" value={stats.ticketsByKind.verification} />
        <Tile label="Best-general votes" value={stats.votes.bestGeneralTotal} />
        <Tile label="Per-unit vote keys" value={stats.votes.skillKeys} />
      </div>

      <h3 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 700 }}>
        Quick actions
      </h3>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <QuickLink href="/admin/tickets?status=open">Review open tickets →</QuickLink>
        <QuickLink href="/admin/tickets?kind=verification&status=open">
          Verification queue →
        </QuickLink>
        <QuickLink href="/admin/votes/best-general">Manage best-general votes →</QuickLink>
        <QuickLink href="/admin/votes/skills">Generals per elite unit →</QuickLink>
      </div>

      <h3 style={{ margin: "28px 0 10px", fontSize: 16, fontWeight: 700 }}>
        Seed verification tickets
      </h3>
      <p style={{ margin: "0 0 10px", color: "#9aa5b4", fontSize: 13 }}>
        Idempotently creates all &ldquo;data to verify&rdquo; tickets listed in
        <code style={{ marginLeft: 4 }}>
          data/verification-tickets-seed.json
        </code>
        . Existing tickets with the same slug are left untouched.
      </p>
      <SeedTicketsButton />
    </div>
  );
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "#131924",
        border: `1px solid ${accent ? accent + "55" : "#2a3344"}`,
        borderRadius: 8,
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#9aa5b4",
          textTransform: "uppercase",
          letterSpacing: 2,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: accent ?? "#e7ecf2",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function QuickLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        padding: "8px 14px",
        background: "#131924",
        border: "1px solid #2a3344",
        borderRadius: 6,
        color: "#d4a44a",
        fontSize: 13,
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}
