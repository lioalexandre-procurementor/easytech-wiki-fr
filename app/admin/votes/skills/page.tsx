import Link from "next/link";
import { listSkillVoteKeys } from "@/lib/admin-votes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SkillVotesAdmin() {
  const keys = await listSkillVoteKeys();
  return (
    <div>
      <h2 style={{ margin: "0 0 14px", fontSize: 24, fontWeight: 800 }}>Skill votes</h2>
      <p style={{ margin: "0 0 16px", color: "#9aa5b4", fontSize: 13 }}>
        Every (general, slot) pair with at least one vote. Drill in to see and
        manage per-skill tallies.
      </p>
      {keys.length === 0 ? (
        <div
          style={{
            padding: 18,
            background: "#131924",
            border: "1px solid #2a3344",
            borderRadius: 8,
            color: "#9aa5b4",
            fontSize: 13,
          }}
        >
          No skill votes cast yet.
        </div>
      ) : (
        <div
          style={{
            border: "1px solid #2a3344",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#131924", color: "#9aa5b4" }}>
                <Th>General</Th>
                <Th>Slot</Th>
                <Th>Total votes</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={`${k.general}-${k.slot}`} style={{ borderTop: "1px solid #2a3344" }}>
                  <Td>
                    <code style={{ color: "#d4a44a" }}>{k.general}</code>
                  </Td>
                  <Td>Slot {k.slot}</Td>
                  <Td>
                    <strong style={{ fontVariantNumeric: "tabular-nums" }}>{k.total}</strong>
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/votes/skills/${k.general}/${k.slot}`}
                      style={{
                        color: "#d4a44a",
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      Manage →
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

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "10px 12px",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: 2,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "10px 12px" }}>{children}</td>;
}
