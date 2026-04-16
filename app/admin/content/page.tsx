import Link from "next/link";
import { listOverrides } from "@/lib/overrides";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type EntityTypeGroup = {
  heading: string;
  items: Array<{ slug: string; label: string; description: string }>;
};

const ENTITY_GROUPS: EntityTypeGroup[] = [
  {
    heading: "World Conqueror 4",
    items: [
      { slug: "elite-unit", label: "Elite units", description: "All 50+ unit cards under /unites-elite — Delta Force, Bismarck, everything." },
      { slug: "general", label: "Generals", description: "All 104 generals, plus their trained (/entraine) and premium-training (/entrainement-premium) variants." },
      { slug: "guide", label: "Guides", description: "The /guides hub content — April 2026 patch, tier lists, beginner guide, etc." },
      { slug: "update", label: "Update entries", description: "The /mises-a-jour patch log." },
    ],
  },
  {
    heading: "Great Conqueror: Rome",
    items: [
      { slug: "gcr-general", label: "GCR — Generals", description: "Ancient-era generals (Agrippa, Scipio, Vercingetorix…) under /great-conqueror-rome/generaux." },
      { slug: "gcr-elite-unit", label: "GCR — Elite units", description: "Antiquity elite units (Legionary, Praetorian…) under /great-conqueror-rome/unites-elite." },
      { slug: "gcr-guide", label: "GCR — Guides", description: "Great Conqueror: Rome guides hub (empty until editorial content lands)." },
      { slug: "gcr-update", label: "GCR — Update entries", description: "GCR patch log entries — /great-conqueror-rome/mises-a-jour." },
    ],
  },
  {
    heading: "European War 6: 1914",
    items: [
      { slug: "ew6-general", label: "EW6 — Generals", description: "1800-1914 commanders (Napoleon, Wellington, Kutuzov…) under /european-war-6/generaux." },
      { slug: "ew6-elite-unit", label: "EW6 — Elite units", description: "Line infantry, cavalry, artillery and ships under /european-war-6/unites-elite." },
      { slug: "ew6-guide", label: "EW6 — Guides", description: "European War 6 guides hub (empty until editorial content lands)." },
      { slug: "ew6-update", label: "EW6 — Update entries", description: "EW6 patch log entries — /european-war-6/mises-a-jour." },
    ],
  },
];

function ts(n?: number): string {
  if (!n) return "—";
  return new Date(n).toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

export default async function ContentHub() {
  const overrides = await listOverrides();
  return (
    <div>
      <h2 style={{ margin: "0 0 14px", fontSize: 24, fontWeight: 800 }}>Wiki content editor</h2>
      <p style={{ margin: "0 0 24px", color: "#9aa5b4", fontSize: 13, maxWidth: 720 }}>
        Edit any wiki entity. Saves go to a Redis override layer that the
        rendered pages merge on top of the base JSON, so changes appear on
        the live site within seconds — no redeploy. Empty override = the
        entity reverts to its base file.
      </p>

      {ENTITY_GROUPS.map((group) => (
        <div key={group.heading} style={{ marginBottom: 22 }}>
          <h3
            style={{
              margin: "0 0 8px",
              fontSize: 11,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#9aa5b4",
              fontWeight: 700,
            }}
          >
            {group.heading}
          </h3>
          <div style={{ display: "grid", gap: 12 }}>
            {group.items.map((t) => (
              <Link
                key={t.slug}
                href={`/admin/content/${t.slug}`}
                style={{
                  display: "block",
                  padding: "14px 18px",
                  background: "#131924",
                  border: "1px solid #2a3344",
                  borderRadius: 8,
                  color: "#e7ecf2",
                  textDecoration: "none",
                }}
              >
                <div style={{ color: "#d4a44a", fontSize: 15, fontWeight: 800, marginBottom: 2 }}>
                  {t.label} →
                </div>
                <div style={{ color: "#9aa5b4", fontSize: 12 }}>{t.description}</div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "#9aa5b4" }}>
        Recent overrides
      </h3>
      {overrides.length === 0 ? (
        <div style={{ padding: 16, background: "#131924", border: "1px solid #2a3344", borderRadius: 8, color: "#9aa5b4", fontSize: 13 }}>
          No overrides yet. All entities are rendering from their base JSON files exactly as committed in git.
        </div>
      ) : (
        <div style={{ border: "1px solid #2a3344", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#131924", color: "#9aa5b4" }}>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>Entity</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>Slug</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>Last edited</th>
                <th style={{ padding: "10px 12px" }} />
              </tr>
            </thead>
            <tbody>
              {overrides.slice(0, 20).map((o) => (
                <tr key={`${o.entityType}:${o.slug}`} style={{ borderTop: "1px solid #2a3344" }}>
                  <td style={{ padding: "10px 12px" }}>{o.entityType}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <code style={{ color: "#d4a44a" }}>{o.slug}</code>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#9aa5b4" }}>{ts(o.updatedAt)}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <Link href={`/admin/content/${o.entityType}/${o.slug}`} style={{ color: "#d4a44a", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
