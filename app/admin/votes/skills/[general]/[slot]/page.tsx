import Link from "next/link";
import { notFound } from "next/navigation";
import { getSkillSlotTally } from "@/lib/admin-votes";
import SkillSlotActions from "@/components/admin/SkillSlotActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SkillSlotAdmin({
  params,
}: {
  params: { general: string; slot: string };
}) {
  const slot = Number(params.slot);
  if (!Number.isInteger(slot) || slot < 1 || slot > 5) return notFound();
  const tally = await getSkillSlotTally(params.general, slot);

  return (
    <div>
      <Link
        href="/admin/votes/skills"
        style={{ color: "#9aa5b4", fontSize: 12, textDecoration: "none" }}
      >
        ← All skill-vote keys
      </Link>
      <h2 style={{ margin: "10px 0 8px", fontSize: 22, fontWeight: 800 }}>
        <code style={{ color: "#d4a44a" }}>{params.general}</code> — slot {slot}
      </h2>
      <div style={{ fontSize: 13, color: "#9aa5b4", marginBottom: 18 }}>
        Total: <strong style={{ color: "#d4a44a" }}>{tally.total}</strong> vote(s)
      </div>

      <div style={{ marginBottom: 16 }}>
        <SkillSlotActions general={params.general} slot={slot} hasAny={tally.entries.length > 0} />
      </div>

      {tally.entries.length === 0 ? (
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
          No votes yet for this slot.
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
                <Th>Rank</Th>
                <Th>Skill ID</Th>
                <Th>Votes</Th>
                <Th>%</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {tally.entries.map((e, i) => {
                const pct = tally.total > 0 ? Math.round((e.votes / tally.total) * 100) : 0;
                return (
                  <tr key={e.skill} style={{ borderTop: "1px solid #2a3344" }}>
                    <Td>#{i + 1}</Td>
                    <Td>
                      <code style={{ color: "#d4a44a" }}>{e.skill}</code>
                    </Td>
                    <Td>
                      <strong style={{ fontVariantNumeric: "tabular-nums" }}>
                        {e.votes}
                      </strong>
                    </Td>
                    <Td>
                      <span style={{ color: "#9aa5b4" }}>{pct}%</span>
                    </Td>
                    <Td>
                      <SkillSlotActions
                        general={params.general}
                        slot={slot}
                        skill={e.skill}
                      />
                    </Td>
                  </tr>
                );
              })}
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
