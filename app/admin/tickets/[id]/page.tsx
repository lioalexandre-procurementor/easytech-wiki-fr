import Link from "next/link";
import { notFound } from "next/navigation";
import { getTicket } from "@/lib/tickets";
import TicketActions from "@/components/admin/TicketActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function ts(n?: number): string {
  if (!n) return "—";
  return new Date(n).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const ticket = await getTicket(params.id);
  if (!ticket) return notFound();

  return (
    <div>
      <Link
        href="/admin/tickets"
        style={{
          color: "#9aa5b4",
          fontSize: 12,
          textDecoration: "none",
          display: "inline-block",
          marginBottom: 18,
        }}
      >
        ← Back to tickets
      </Link>
      <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800 }}>
        {ticket.title || ticket.description.slice(0, 80) || "(untitled)"}
      </h2>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          fontSize: 11,
          color: "#9aa5b4",
          marginBottom: 22,
        }}
      >
        <Chip>ID {ticket.id}</Chip>
        <Chip>{ticket.status.toUpperCase()}</Chip>
        <Chip>{ticket.kind === "verification" ? "🔍 Verification" : "🐞 Bug"}</Chip>
        <Chip>Source: {ticket.source}</Chip>
        <Chip>Created {ts(ticket.createdAt)}</Chip>
        {ticket.resolvedAt && <Chip>Resolved {ts(ticket.resolvedAt)}</Chip>}
        {ticket.locale && <Chip>Locale: {ticket.locale}</Chip>}
      </div>

      <TicketActions id={ticket.id} status={ticket.status} />

      <Section title="Description">
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "inherit",
            fontSize: 14,
            color: "#e7ecf2",
            margin: 0,
          }}
        >
          {ticket.description}
        </pre>
      </Section>

      <Section title="Page">
        <code style={{ fontSize: 12, color: "#c9cfd8", wordBreak: "break-all" }}>
          {ticket.pageUrl}
        </code>
        {ticket.pageTitle && (
          <div style={{ marginTop: 4, fontSize: 12, color: "#9aa5b4" }}>
            Title: {ticket.pageTitle}
          </div>
        )}
      </Section>

      {ticket.context && (
        <Section title="Context">
          <code style={{ fontSize: 12, color: "#d4a44a" }}>{ticket.context}</code>
        </Section>
      )}

      {(ticket.email || ticket.userAgent || ticket.ip) && (
        <Section title="Reporter metadata">
          <dl style={{ margin: 0, fontSize: 12, color: "#9aa5b4" }}>
            {ticket.email && (
              <Row label="Email">
                <a href={`mailto:${ticket.email}`} style={{ color: "#d4a44a" }}>
                  {ticket.email}
                </a>
              </Row>
            )}
            {ticket.userAgent && <Row label="User-Agent">{ticket.userAgent}</Row>}
            {ticket.ip && <Row label="IP">{ticket.ip}</Row>}
          </dl>
        </Section>
      )}

      {ticket.seedSlug && (
        <div style={{ marginTop: 18, fontSize: 11, color: "#6b7685" }}>
          Minted by seed slug <code>{ticket.seedSlug}</code>. Re-seeding will not
          create a duplicate.
        </div>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        padding: "3px 8px",
        borderRadius: 4,
        background: "#131924",
        border: "1px solid #2a3344",
      }}
    >
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        marginTop: 18,
        background: "#131924",
        border: "1px solid #2a3344",
        borderRadius: 8,
        padding: "16px 18px",
      }}
    >
      <h3
        style={{
          margin: "0 0 10px",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 2,
          color: "#9aa5b4",
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        gap: 10,
        paddingTop: 6,
      }}
    >
      <dt style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2 }}>{label}</dt>
      <dd style={{ margin: 0, wordBreak: "break-all", color: "#c9cfd8" }}>{children}</dd>
    </div>
  );
}
