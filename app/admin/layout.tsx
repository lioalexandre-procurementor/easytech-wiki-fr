import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";

export const metadata: Metadata = {
  title: "Admin — EasyTech Wiki",
  robots: { index: false, follow: false, nocache: true },
};

// Force all admin pages dynamic — never prerender, never cache at the edge.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0a0e13",
          color: "#e7ecf2",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            minHeight: "100vh",
          }}
        >
          <aside
            style={{
              background: "#0f1520",
              borderRight: "1px solid #2a3344",
              padding: "24px 18px",
              position: "sticky",
              top: 0,
              alignSelf: "start",
              height: "100vh",
              overflowY: "auto",
            }}
          >
            <h1
              style={{
                margin: "0 0 22px",
                fontSize: 14,
                color: "#d4a44a",
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              🔒 Admin
            </h1>
            <NavSection title="Overview">
              <NavLink href="/admin">Dashboard</NavLink>
            </NavSection>
            <NavSection title="Wiki content">
              <NavLink href="/admin/content">All entities</NavLink>
              <NavLink href="/admin/content/elite-unit">Elite units</NavLink>
              <NavLink href="/admin/content/general">Generals</NavLink>
              <NavLink href="/admin/content/guide">Guides</NavLink>
              <NavLink href="/admin/content/update">Updates</NavLink>
            </NavSection>
            <NavSection title="Tickets">
              <NavLink href="/admin/tickets?status=open">
                Open tickets
              </NavLink>
              <NavLink href="/admin/tickets?kind=verification">
                Verification queue
              </NavLink>
              <NavLink href="/admin/tickets">All tickets</NavLink>
            </NavSection>
            <NavSection title="Votes">
              <NavLink href="/admin/votes/best-general">Best general</NavLink>
              <NavLink href="/admin/votes/skills">Skill votes</NavLink>
            </NavSection>
            <NavSection title="Site">
              <NavLink href="/" external>
                ← Back to site
              </NavLink>
            </NavSection>
            <div style={{ marginTop: 28 }}>
              <LogoutButton />
            </div>
          </aside>
          <main style={{ padding: "28px 32px" }}>{children}</main>
        </div>
      </body>
    </html>
  );
}

function NavSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h4
        style={{
          margin: "0 0 6px",
          fontSize: 10,
          color: "#6b7685",
          textTransform: "uppercase",
          letterSpacing: 2,
          fontWeight: 700,
        }}
      >
        {title}
      </h4>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>{children}</ul>
    </div>
  );
}

function NavLink({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        style={{
          display: "block",
          padding: "6px 10px",
          borderRadius: 4,
          fontSize: 13,
          color: "#c9cfd8",
          textDecoration: "none",
        }}
        prefetch={!external}
      >
        {children}
      </Link>
    </li>
  );
}
