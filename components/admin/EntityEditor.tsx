"use client";

/**
 * Universal entity editor. Two-pane layout:
 *
 *   Left — structured fields: common top-level scalars (name, shortDesc,
 *          tier, category, etc.) surfaced as typed inputs, plus an i18n
 *          tab group for localized text fields with fallback indicators.
 *   Right — full JSON view of the merged entity. Editable, live-synced
 *          with the structured fields (typing in either side updates
 *          the other on blur/save).
 *
 * Save sends the FULL merged entity as `edited`. The server computes the
 * delta vs the base JSON and stores only the delta.
 */

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  entityType: string;
  slug: string;
  base: unknown;
  merged: unknown;
  hasOverride: boolean;
  ticketId: string | null;
};

type Msg = { kind: "ok" | "err" | "info"; text: string } | null;

const LOCALES: Array<"fr" | "en" | "de"> = ["fr", "en", "de"];

/**
 * Fields that are directly i18n "sibling" fields on the entity
 * (`shortDesc` / `shortDescEn` / `shortDescDe` style). The editor
 * surfaces these as tabbed inputs with fallback hints.
 */
const I18N_SIBLING_FIELDS = [
  { base: "name", en: "nameEn", de: "nameDe" },
  { base: "shortDesc", en: "shortDescEn", de: "shortDescDe" },
  { base: "longDesc", en: "longDescEn", de: "longDescDe" },
] as const;

/** Scalar fields surfaced as labeled inputs (varies per entity type). */
const SCALAR_FIELDS: Record<string, Array<{ path: string; label: string; kind: "text" | "bool"; hint?: string }>> = {
  "elite-unit": [
    { path: "tier", label: "Tier", kind: "text" },
    { path: "category", label: "Category", kind: "text", hint: "tank / infantry / artillery / navy / airforce" },
    { path: "country", label: "Country", kind: "text" },
    { path: "faction", label: "Faction", kind: "text", hint: "standard / scorpion" },
    { path: "obtainability", label: "Obtainability", kind: "text", hint: "free / event / shop / premium" },
    { path: "preliminary", label: "Preliminary (stats being verified)", kind: "bool" },
  ],
  general: [
    { path: "rank", label: "Rank", kind: "text" },
    { path: "quality", label: "Quality", kind: "text", hint: "bronze / silver / gold / marshal" },
    { path: "category", label: "Category", kind: "text" },
    { path: "country", label: "Country", kind: "text" },
    { path: "faction", label: "Faction", kind: "text" },
    { path: "hasTrainingPath", label: "Has training path", kind: "bool" },
  ],
  guide: [
    { path: "category", label: "Category", kind: "text" },
    { path: "publishedAt", label: "Published (YYYY-MM-DD)", kind: "text" },
    { path: "lastReviewed", label: "Last reviewed", kind: "text" },
  ],
  update: [
    { path: "version", label: "Version", kind: "text" },
    { path: "date", label: "Date (YYYY-MM-DD)", kind: "text" },
  ],
};

/** Per-locale title/description/tldr/body fields (guides + updates). */
const I18N_BLOB_FIELDS = ["title", "description", "tldr", "body"] as const;

function getPath(obj: unknown, path: string): unknown {
  return (obj as Record<string, unknown> | undefined)?.[path];
}

function setPath<T>(obj: T, path: string, value: unknown): T {
  const out = { ...(obj as Record<string, unknown>) };
  if (value === undefined) delete out[path];
  else out[path] = value;
  return out as T;
}

export default function EntityEditor({
  entityType,
  slug,
  base,
  merged,
  hasOverride,
  ticketId,
}: Props) {
  const router = useRouter();
  const [edited, setEdited] = useState<unknown>(merged);
  const [msg, setMsg] = useState<Msg>(null);
  const [saving, setSaving] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [resolveTicket, setResolveTicket] = useState<boolean>(Boolean(ticketId));
  const [jsonDraft, setJsonDraft] = useState<string>(() => JSON.stringify(merged, null, 2));
  const [jsonErr, setJsonErr] = useState<string | null>(null);
  const [locale, setLocale] = useState<"fr" | "en" | "de">("fr");
  const lastSyncedJsonRef = useRef<string>(JSON.stringify(merged));

  // Re-sync the JSON text whenever `edited` changes from the structured side.
  function applyEditedToForm(next: unknown) {
    setEdited(next);
    const serialized = JSON.stringify(next, null, 2);
    setJsonDraft(serialized);
    lastSyncedJsonRef.current = JSON.stringify(next);
    setJsonErr(null);
  }

  function onJsonChange(v: string) {
    setJsonDraft(v);
    try {
      const parsed = JSON.parse(v);
      setEdited(parsed);
      lastSyncedJsonRef.current = JSON.stringify(parsed);
      setJsonErr(null);
    } catch (e) {
      setJsonErr((e as Error).message);
    }
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/content/${entityType}/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          edited,
          resolveTicketId: resolveTicket && ticketId ? ticketId : undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; cleared?: boolean; delta?: unknown; error?: string; ticketResolved?: boolean };
      if (!res.ok) {
        setMsg({ kind: "err", text: data.error ?? `HTTP ${res.status}` });
      } else if (data.cleared) {
        setMsg({ kind: "info", text: "No differences from base → override cleared. Live site now renders from base JSON." });
        router.refresh();
      } else {
        const parts = ["Saved."];
        if (data.ticketResolved) parts.push("Linked ticket marked resolved.");
        parts.push("Live site will reflect within a few seconds.");
        setMsg({ kind: "ok", text: parts.join(" ") });
        router.refresh();
      }
    } catch {
      setMsg({ kind: "err", text: "Network error — save failed." });
    } finally {
      setSaving(false);
    }
  }

  async function revert() {
    if (!confirm("Drop the override for this entity? The live page will revert to the base JSON committed in git.")) return;
    setReverting(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/content/${entityType}/${encodeURIComponent(slug)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMsg({ kind: "err", text: data.error ?? "Revert failed." });
      } else {
        setMsg({ kind: "info", text: "Override cleared. Page reverted to base JSON." });
        // Reset the editor to the base state
        applyEditedToForm(base);
        router.refresh();
      }
    } finally {
      setReverting(false);
    }
  }

  const scalars = SCALAR_FIELDS[entityType] ?? [];
  const isGuideOrUpdate = entityType === "guide" || entityType === "update";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {/* LEFT: structured fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Section title="Metadata">
          {scalars.map((f) => {
            const v = getPath(edited, f.path);
            if (f.kind === "bool") {
              return (
                <label key={f.path} style={rowStyle}>
                  <span style={labelStyle}>{f.label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(v)}
                    onChange={(e) =>
                      applyEditedToForm(setPath(edited, f.path, e.target.checked ? true : undefined))
                    }
                  />
                </label>
              );
            }
            return (
              <label key={f.path} style={rowStyle}>
                <span style={labelStyle}>{f.label}</span>
                <input
                  type="text"
                  value={(v as string) ?? ""}
                  placeholder={f.hint}
                  onChange={(e) => applyEditedToForm(setPath(edited, f.path, e.target.value || undefined))}
                  style={inputStyle}
                />
              </label>
            );
          })}
        </Section>

        {/* i18n sibling fields (name / shortDesc / longDesc) for units + generals */}
        {!isGuideOrUpdate && (
          <Section title="Text fields (per locale)">
            <LocaleTabs locale={locale} onChange={setLocale} />
            {I18N_SIBLING_FIELDS.map((f) => {
              const frValue = getPath(edited, f.base) as string | undefined;
              const enValue = getPath(edited, f.en) as string | undefined;
              const deValue = getPath(edited, f.de) as string | undefined;
              const activeKey = locale === "fr" ? f.base : locale === "en" ? f.en : f.de;
              const activeValue =
                locale === "fr" ? frValue : locale === "en" ? enValue : deValue;
              const fallback = computeFallback(locale, frValue, enValue, deValue, activeValue);
              return (
                <div key={f.base} style={{ marginBottom: 10 }}>
                  <div style={labelStyle}>
                    {f.base} ({locale})
                    {fallback && (
                      <span style={fallbackHintStyle}>
                        {" "}
                        — blank, falling back to <code>{fallback.sourceField}</code>
                      </span>
                    )}
                  </div>
                  <textarea
                    value={activeValue ?? ""}
                    placeholder={fallback?.sourceValue ?? ""}
                    onChange={(e) =>
                      applyEditedToForm(
                        setPath(edited, activeKey, e.target.value || undefined)
                      )
                    }
                    rows={f.base === "longDesc" ? 5 : 2}
                    style={{ ...inputStyle, fontFamily: "inherit" }}
                  />
                </div>
              );
            })}
          </Section>
        )}

        {/* i18n blob fields (guides + updates: { fr, en, de }) */}
        {isGuideOrUpdate && (
          <Section title="Localized content">
            <LocaleTabs locale={locale} onChange={setLocale} />
            {I18N_BLOB_FIELDS.map((field) => {
              const blob = getPath(edited, field) as Record<string, unknown> | undefined;
              if (!blob && field !== "body") return null;
              const raw = blob?.[locale];
              const isBody = field === "body";
              const isTldr = field === "tldr";
              const currentText = isTldr
                ? Array.isArray(raw)
                  ? raw.join("\n")
                  : ""
                : typeof raw === "string"
                ? raw
                : "";
              const frVal = blob?.fr as unknown;
              const enVal = blob?.en as unknown;
              const deVal = blob?.de as unknown;
              const textFor = (v: unknown) =>
                Array.isArray(v) ? v.join("\n") : typeof v === "string" ? v : "";
              const fallback = computeFallback(
                locale,
                textFor(frVal),
                textFor(enVal),
                textFor(deVal),
                currentText
              );
              return (
                <div key={field} style={{ marginBottom: 10 }}>
                  <div style={labelStyle}>
                    {field} ({locale})
                    {fallback && (
                      <span style={fallbackHintStyle}>
                        {" "}
                        — blank, falling back to <code>{fallback.sourceField}</code>
                      </span>
                    )}
                  </div>
                  <textarea
                    value={currentText}
                    placeholder={fallback?.sourceValue?.slice(0, 200)}
                    rows={isBody ? 12 : isTldr ? 4 : 2}
                    onChange={(e) => {
                      const newBlob: Record<string, unknown> = { ...(blob ?? {}) };
                      const v = e.target.value;
                      if (isTldr) {
                        newBlob[locale] = v ? v.split("\n").filter(Boolean) : [];
                      } else {
                        newBlob[locale] = v;
                      }
                      applyEditedToForm(setPath(edited, field, newBlob));
                    }}
                    style={{
                      ...inputStyle,
                      fontFamily: isBody ? "ui-monospace, Menlo, monospace" : "inherit",
                      fontSize: isBody ? 12 : 13,
                    }}
                  />
                </div>
              );
            })}
          </Section>
        )}
      </div>

      {/* RIGHT: full JSON editor */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Section title="Full JSON (every field is editable here)">
          <p style={{ margin: "0 0 10px", color: "#9aa5b4", fontSize: 11 }}>
            Edit here to reach any field the structured form above doesn&apos;t
            surface (stats arrays, perks, trainedSkills, faqs, etc.). Syntax
            errors prevent save.
          </p>
          <textarea
            value={jsonDraft}
            onChange={(e) => onJsonChange(e.target.value)}
            rows={30}
            spellCheck={false}
            style={{
              ...inputStyle,
              fontFamily: "ui-monospace, Menlo, monospace",
              fontSize: 12,
              width: "100%",
              lineHeight: 1.5,
            }}
          />
          {jsonErr && (
            <div style={{ marginTop: 6, color: "#f3b2ad", fontSize: 12 }}>
              JSON error: {jsonErr}
            </div>
          )}
        </Section>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={save}
            disabled={saving || Boolean(jsonErr)}
            style={{
              padding: "10px 18px",
              background: jsonErr ? "#4a5463" : "#d4a44a",
              color: "#0a0e13",
              border: "none",
              borderRadius: 6,
              fontWeight: 800,
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              cursor: saving || jsonErr ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {hasOverride && (
            <button
              type="button"
              onClick={revert}
              disabled={reverting}
              style={{
                padding: "10px 14px",
                background: "transparent",
                color: "#c8372d",
                border: "1px solid #c8372d55",
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                cursor: reverting ? "not-allowed" : "pointer",
              }}
            >
              Revert to base
            </button>
          )}
          {ticketId && (
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "#c9cfd8",
              }}
            >
              <input
                type="checkbox"
                checked={resolveTicket}
                onChange={(e) => setResolveTicket(e.target.checked)}
              />
              Mark linked ticket resolved on save
            </label>
          )}
        </div>
        {msg && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              fontSize: 13,
              background:
                msg.kind === "err"
                  ? "rgba(200,55,45,0.1)"
                  : msg.kind === "ok"
                  ? "rgba(92,141,104,0.1)"
                  : "rgba(58,127,176,0.1)",
              border:
                msg.kind === "err"
                  ? "1px solid rgba(200,55,45,0.4)"
                  : msg.kind === "ok"
                  ? "1px solid rgba(92,141,104,0.4)"
                  : "1px solid rgba(58,127,176,0.4)",
              color:
                msg.kind === "err" ? "#f3b2ad" : msg.kind === "ok" ? "#b4dbbd" : "#b5d4ea",
            }}
          >
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}

function computeFallback(
  locale: "fr" | "en" | "de",
  frValue: string | undefined,
  enValue: string | undefined,
  deValue: string | undefined,
  activeValue: string | undefined
): { sourceField: string; sourceValue: string } | null {
  if (activeValue && activeValue.trim().length > 0) return null;
  // Fallback chain: de → en → fr | en → fr | fr has no fallback source
  if (locale === "de") {
    if (enValue) return { sourceField: "en", sourceValue: enValue };
    if (frValue) return { sourceField: "fr", sourceValue: frValue };
  } else if (locale === "en") {
    if (frValue) return { sourceField: "fr", sourceValue: frValue };
  }
  return null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: "#131924",
        border: "1px solid #2a3344",
        borderRadius: 8,
        padding: 14,
      }}
    >
      <h3
        style={{
          margin: "0 0 10px",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 2,
          color: "#9aa5b4",
          fontWeight: 700,
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function LocaleTabs({
  locale,
  onChange,
}: {
  locale: "fr" | "en" | "de";
  onChange: (l: "fr" | "en" | "de") => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          style={{
            padding: "4px 12px",
            background: locale === l ? "#d4a44a" : "transparent",
            color: locale === l ? "#0a0e13" : "#9aa5b4",
            border: locale === l ? "1px solid #d4a44a" : "1px solid #2a3344",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            cursor: "pointer",
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "200px 1fr",
  alignItems: "center",
  gap: 12,
  marginBottom: 8,
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: 2,
  fontWeight: 700,
  color: "#9aa5b4",
};

const fallbackHintStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#6b7685",
  fontWeight: 500,
  textTransform: "none",
  letterSpacing: 0,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  background: "#0f1520",
  border: "1px solid #2a3344",
  borderRadius: 4,
  color: "#e7ecf2",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  resize: "vertical",
};
