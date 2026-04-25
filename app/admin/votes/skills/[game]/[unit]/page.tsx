/**
 * Per-elite-unit "best general" detail view. Replaces the legacy
 * /admin/votes/skills/[general]/[slot] page; the route lives under
 * the same /admin/votes/skills branch on purpose so admin nav,
 * bookmarks and ticket references continue to resolve.
 *
 * Note: the on-disk folder names were renamed [general]→[game],
 * [slot]→[unit] to keep the URL params semantically aligned with
 * the new model.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUnitGeneralTally } from "@/lib/admin-votes";
import { parseGame } from "@/lib/types";
import UnitGeneralActions from "@/components/admin/UnitGeneralActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UnitGeneralDetail({
  params,
}: {
  params: { game: string; unit: string };
}) {
  const game = parseGame(params.game);
  if (!game) return notFound();
  const row = await getUnitGeneralTally(game, params.unit);
  if (!row) return notFound();

  return (
    <div>
      <Link
        href="/admin/votes/skills"
        style={{ color: "#9aa5b4", fontSize: 12, textDecoration: "none" }}
      >
        ← All elite units
      </Link>
      <h2 style={{ margin: "10px 0 4px", fontSize: 22, fontWeight: 800 }}>
        {row.unitNameEn ?? row.unitName}
      </h2>
      <div style={{ color: "#9aa5b4", fontSize: 12, marginBottom: 18 }}>
        <code>{row.unitSlug}</code> &middot;{" "}
        <span style={{ textTransform: "capitalize" }}>{row.unitCategory}</span> &middot;{" "}
        Game {game.toUpperCase()}
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
          <strong style={{ color: "#d4a44a" }}>{row.total}</strong>
        </div>
        <UnitGeneralActions
          game={game}
          unit={row.unitSlug}
          hasAny={row.entries.length > 0}
        />
      </div>

      {row.entries.length === 0 ? (
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
          No votes yet for this unit.
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
                <Th>General</Th>
                <Th>Votes</Th>
                <Th>%</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {row.entries.map((e, i) => (
                <tr key={e.generalSlug} style={{ borderTop: "1px solid #2a3344" }}>
                  <Td>#{i + 1}</Td>
                  <Td>
                    <div style={{ fontWeight: 600 }}>
                      {e.generalNameEn ?? e.generalName}
                    </div>
                    <code style={{ color: "#9aa5b4", fontSize: 11 }}>
                      {e.generalSlug}
                    </code>
                  </Td>
                  <Td>
                    <strong style={{ fontVariantNumeric: "tabular-nums" }}>
                      {e.votes}
                    </strong>
                  </Td>
                  <Td>
                    <span style={{ color: "#9aa5b4" }}>{e.share}%</span>
                  </Td>
                  <Td>
                    <UnitGeneralActions
                      game={game}
                      unit={row.unitSlug}
                      general={e.generalSlug}
                    />
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
