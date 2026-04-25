/**
 * Admin — "General per elite troop" tracking.
 *
 * This page replaced the legacy per-(general, slot) skill-vote dashboard.
 * The community now votes for the best general to assign to each elite
 * unit (see /api/vote/unit-general), so the admin view that mattered to
 * us was the unit→general aggregate, not the per-skill breakdown.
 *
 * Route is intentionally kept at /admin/votes/skills so the existing
 * sidebar link, bookmarks and ticket references all keep working. The
 * label in the sidebar should read "Generals per elite unit".
 */
import Link from "next/link";
import { getUnitGeneralTallies } from "@/lib/admin-votes";
import { parseGame } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GeneralPerEliteUnitAdmin({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const game = parseGame(searchParams.game) ?? "wc4";
  const filter = (searchParams.filter as string | undefined) ?? "all";
  const { rows, configured, totalVotes } = await getUnitGeneralTallies(game);

  const filtered =
    filter === "voted"
      ? rows.filter((r) => r.total > 0)
      : filter === "empty"
        ? rows.filter((r) => r.total === 0)
        : rows;

  const unitsWithVotes = rows.filter((r) => r.total > 0).length;
  const coverage = rows.length > 0
    ? Math.round((unitsWithVotes / rows.length) * 100)
    : 0;

  return (
    <div>
      <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800 }}>
        Generals per elite troop — {game.toUpperCase()}
      </h2>
      <p style={{ margin: "0 0 14px", color: "#9aa5b4", fontSize: 13 }}>
        Community-voted best general for each elite unit. Each visitor can
        cast one vote per (game, unit) pair. Sorted by total votes
        descending; units with no votes yet are listed last so coverage
        gaps stay visible.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {(["wc4", "gcr", "ew6"] as const).map((g) => (
          <a
            key={g}
            href={`?game=${g}${filter !== "all" ? `&filter=${filter}` : ""}`}
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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <Tile label="Total votes" value={String(totalVotes)} accent="#d4a44a" />
        <Tile label="Units with votes" value={`${unitsWithVotes} / ${rows.length}`} />
        <Tile label="Coverage" value={`${coverage}%`} />
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        <FilterChip
          label={`All (${rows.length})`}
          active={filter === "all"}
          href={`?game=${game}`}
        />
        <FilterChip
          label={`With votes (${unitsWithVotes})`}
          active={filter === "voted"}
          href={`?game=${game}&filter=voted`}
        />
        <FilterChip
          label={`Empty (${rows.length - unitsWithVotes})`}
          active={filter === "empty"}
          href={`?game=${game}&filter=empty`}
        />
      </div>

      {!configured && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(200,55,45,0.1)",
            border: "1px solid rgba(200,55,45,0.4)",
            color: "#f3b2ad",
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          Redis isn't configured. Set the Upstash env vars on Vercel and
          redeploy — until then every tally reads zero.
        </div>
      )}

      {filtered.length === 0 ? (
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
          No elite units match this filter.
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
                <Th>Elite unit</Th>
                <Th>Category</Th>
                <Th>Top general</Th>
                <Th>Lead share</Th>
                <Th>Total votes</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.unitSlug} style={{ borderTop: "1px solid #2a3344" }}>
                  <Td>
                    <div style={{ fontWeight: 600 }}>
                      {r.unitNameEn ?? r.unitName}
                    </div>
                    <code style={{ color: "#9aa5b4", fontSize: 11 }}>{r.unitSlug}</code>
                  </Td>
                  <Td>
                    <span style={{ color: "#9aa5b4", textTransform: "capitalize" }}>
                      {r.unitCategory}
                    </span>
                  </Td>
                  <Td>
                    {r.topGeneralSlug ? (
                      <span>
                        <strong style={{ color: "#d4a44a" }}>
                          {r.topGeneralNameEn ?? r.topGeneralName}
                        </strong>{" "}
                        <span style={{ color: "#9aa5b4", fontSize: 11 }}>
                          ({r.topGeneralVotes} votes)
                        </span>
                      </span>
                    ) : (
                      <span style={{ color: "#6b7685" }}>—</span>
                    )}
                  </Td>
                  <Td>
                    {r.topGeneralShare != null ? (
                      <span style={{ color: "#9aa5b4" }}>{r.topGeneralShare}%</span>
                    ) : (
                      <span style={{ color: "#6b7685" }}>—</span>
                    )}
                  </Td>
                  <Td>
                    <strong style={{ fontVariantNumeric: "tabular-nums" }}>
                      {r.total}
                    </strong>
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/votes/skills/${game}/${r.unitSlug}`}
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

function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
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
          fontSize: 22,
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

function FilterChip({
  label,
  active,
  href,
}: {
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <a
      href={href}
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        textDecoration: "none",
        border: active ? "1px solid #d4a44a" : "1px solid #2a3344",
        background: active ? "rgba(212,164,74,0.15)" : "#131924",
        color: active ? "#d4a44a" : "#9aa5b4",
      }}
    >
      {label}
    </a>
  );
}
