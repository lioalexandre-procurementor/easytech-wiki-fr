import Link from "next/link";
import { listTickets, type TicketKind, type TicketStatus, type TicketSource } from "@/lib/tickets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function ts(n: number): string {
  if (!n) return "—";
  const d = new Date(n);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export default async function TicketsListPage({
  searchParams,
}: {
  searchParams: { status?: string; kind?: string; source?: string };
}) {
  const status =
    searchParams.status === "open" || searchParams.status === "resolved"
      ? (searchParams.status as TicketStatus)
      : undefined;
  const kind =
    searchParams.kind === "bug" || searchParams.kind === "verification"
      ? (searchParams.kind as TicketKind)
      : undefined;
  const source =
    searchParams.source === "user" || searchParams.source === "system"
      ? (searchParams.source as TicketSource)
      : undefined;

  const { tickets, totalIndex } = await listTickets({
    status,
    kind,
    source,
    limit: 100,
  });

  return (
    <div>
      <h2 style={{ margin: "0 0 14px", fontSize: 24, fontWeight: 800 }}>Tickets</h2>
      <FilterBar status={status} kind={kind} source={source} />

      <div style={{ fontSize: 12, color: "#9aa5b4", marginBottom: 12 }}>
        Showing {tickets.length} of {totalIndex} total ticket(s) in the index.
      </div>

      {tickets.length === 0 ? (
        <div
          style={{
            padding: 24,
            background: "#131924",
            border: "1px solid #2a3344",
            borderRadius: 8,
            color: "#9aa5b4",
            fontSize: 13,
          }}
        >
          No tickets match this filter. If this is a fresh deploy, try &ldquo;Seed
          verification tickets&rdquo; on the dashboard to populate the backlog.
        </div>
      ) : (
        <div
          style={{
            border: "1px solid #2a3344",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ background: "#131924", color: "#9aa5b4" }}>
                <Th>Status</Th>
                <Th>Kind</Th>
                <Th>Title</Th>
                <Th>Page</Th>
                <Th>Created</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} style={{ borderTop: "1px solid #2a3344" }}>
                  <Td>
                    <StatusBadge status={t.status} />
                  </Td>
                  <Td>
                    <KindBadge kind={t.kind} source={t.source} />
                  </Td>
                  <Td>
                    <div
                      style={{
                        color: "#e7ecf2",
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      {t.title || t.description.slice(0, 80) || "(untitled)"}
                    </div>
                    {t.context && (
                      <div style={{ fontSize: 11, color: "#6b7685" }}>
                        {t.context}
                      </div>
                    )}
                  </Td>
                  <Td>
                    <code style={{ fontSize: 11, color: "#9aa5b4" }}>
                      {t.pageUrl.length > 50 ? "…" + t.pageUrl.slice(-50) : t.pageUrl}
                    </code>
                  </Td>
                  <Td>
                    <span style={{ color: "#9aa5b4", fontSize: 12 }}>
                      {ts(t.createdAt)}
                    </span>
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/tickets/${t.id}`}
                      style={{
                        color: "#d4a44a",
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      View →
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterBar({
  status,
  kind,
  source,
}: {
  status?: TicketStatus;
  kind?: TicketKind;
  source?: TicketSource;
}) {
  const chips: { label: string; href: string; active: boolean }[] = [
    { label: "All", href: "/admin/tickets", active: !status && !kind && !source },
    { label: "Open", href: "/admin/tickets?status=open", active: status === "open" && !kind },
    { label: "Resolved", href: "/admin/tickets?status=resolved", active: status === "resolved" },
    { label: "Bugs", href: "/admin/tickets?kind=bug", active: kind === "bug" },
    { label: "Verification", href: "/admin/tickets?kind=verification", active: kind === "verification" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
      {chips.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: "none",
            background: c.active ? "#d4a44a" : "transparent",
            color: c.active ? "#0a0e13" : "#9aa5b4",
            border: c.active ? "1px solid #d4a44a" : "1px solid #2a3344",
          }}
        >
          {c.label}
        </Link>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const color = status === "open" ? "#d4a44a" : "#5c8d68";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 1,
        color,
        background: color + "22",
        border: `1px solid ${color}55`,
      }}
    >
      {status}
    </span>
  );
}

function KindBadge({ kind, source }: { kind: TicketKind; source: TicketSource }) {
  const label = kind === "verification" ? "🔍 Verify" : "🐞 Bug";
  const sub = source === "system" ? "sys" : "user";
  return (
    <div>
      <div style={{ fontSize: 12, color: "#e7ecf2" }}>{label}</div>
      <div style={{ fontSize: 10, color: "#6b7685", textTransform: "uppercase", letterSpacing: 1 }}>
        {sub}
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "10px 12px",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: 2,
        fontWeight: 700,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "10px 12px", verticalAlign: "top" }}>{children}</td>;
}
