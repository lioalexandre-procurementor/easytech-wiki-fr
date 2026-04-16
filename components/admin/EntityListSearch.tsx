"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Row = {
  slug: string;
  title: string;
  subtitle?: string;
  preliminary?: boolean;
};

export default function EntityListSearch({
  entityType,
  rows,
}: {
  entityType: string;
  rows: Row[];
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.slug.toLowerCase().includes(needle) ||
        r.title.toLowerCase().includes(needle) ||
        (r.subtitle ?? "").toLowerCase().includes(needle)
    );
  }, [q, rows]);

  return (
    <div>
      <input
        type="search"
        placeholder="Filter by slug, name, category…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: "#0f1520",
          border: "1px solid #2a3344",
          borderRadius: 6,
          color: "#e7ecf2",
          fontSize: 14,
          outline: "none",
          marginBottom: 14,
          boxSizing: "border-box",
        }}
      />
      <div style={{ border: "1px solid #2a3344", borderRadius: 8, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 18, color: "#9aa5b4", fontSize: 13, textAlign: "center" }}>
            No match.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.slug} style={{ borderTop: "1px solid #2a3344" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <Link
                      href={`/admin/content/${entityType}/${r.slug}`}
                      style={{ color: "#d4a44a", fontWeight: 700, textDecoration: "none" }}
                    >
                      {r.title}
                    </Link>
                    {r.preliminary && (
                      <span
                        style={{
                          marginLeft: 8,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "rgba(212,164,74,0.1)",
                          border: "1px solid rgba(212,164,74,0.4)",
                          color: "#d4a44a",
                          fontSize: 9,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        preliminary
                      </span>
                    )}
                    <div style={{ color: "#6b7685", fontSize: 11 }}>
                      <code>{r.slug}</code>
                      {r.subtitle && ` · ${r.subtitle}`}
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    <Link
                      href={`/admin/content/${entityType}/${r.slug}`}
                      style={{ color: "#d4a44a", fontSize: 12, textDecoration: "none", fontWeight: 600 }}
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
