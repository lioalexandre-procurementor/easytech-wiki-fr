import { getBestGeneralTally } from "@/lib/admin-votes";
import BestGeneralActions from "@/components/admin/BestGeneralActions";
import { parseGame } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BestGeneralVotesAdmin({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const game = parseGame(searchParams.game) ?? "wc4";
  const tally = await getBestGeneralTally(game);

  return (
    <div>
      <h2 style={{ margin: "0 0 14px", fontSize: 24, fontWeight: 800 }}>
        Best-general votes — {game.toUpperCase()}
      </h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {(["wc4", "gcr", "ew6"] as const).map((g) => (
          <a
            key={g}
            href={`?game=${g}`}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              textDecoration: "none",
              border: g === game ? "1px solid #d4a44a" : "1px solid #2a3344",
              background: g === game ? "rgba(212,164,74,0.2)" : "#131924",
              color: g === game ? "#d4a44a" : "#9aa5b4",
            }}
          >
            {g}
          </a>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: 14,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            background: "#131924",
            border: "1px solid #2a3344",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          Total votes:{" "}
          <strong style={{ color: "#d4a44a" }}>{tally.total}</strong>
        </div>
        <BestGeneralActions hasAny={tally.entries.length > 0} />
      </div>

      {!tally.configured && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(200,55,45,0.1)",
            border: "1px solid rgba(200,55,45,0.4)",
            color: "#f3b2ad",
            fontSize: 13,
          }}
        >
          Redis not configured. Set the Upstash env vars and redeploy.
        </div>
      )}

      {tally.configured && tally.entries.length === 0 && (
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
          No votes cast yet. The site shows the placeholder podium until the
          300-vote threshold is reached.
        </div>
      )}

      {tally.entries.length > 0 && (
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
                <Th>Slug</Th>
                <Th>Votes</Th>
                <Th>%</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {tally.entries.map((e, i) => {
                const pct = tally.total > 0 ? Math.round((e.votes / tally.total) * 100) : 0;
                return (
                  <tr key={e.slug} style={{ borderTop: "1px solid #2a3344" }}>
                    <Td>#{i + 1}</Td>
                    <Td>
                      <code style={{ color: "#d4a44a" }}>{e.slug}</code>
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
                      <BestGeneralActions slug={e.slug} />
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
