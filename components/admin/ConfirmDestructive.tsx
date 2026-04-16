"use client";

import { useState } from "react";

type Props = {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
};

/**
 * Modal that asks the admin to re-enter their password before running a
 * destructive action. On submit it POSTs to /api/admin/reauth to mint
 * a short-lived reauth cookie, then calls onConfirm — the destructive
 * endpoint must call requireAdminWithReauth() to verify the cookie.
 */
export default function ConfirmDestructive({
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: Props) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error === "invalid password" ? "Wrong password." : data.error ?? "Reauth failed.");
        setBusy(false);
        return;
      }
      await onConfirm();
      onClose();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={go}
        style={{
          width: "min(420px, 90vw)",
          background: "#131924",
          border: "1px solid #c8372d55",
          borderRadius: 10,
          padding: 22,
        }}
      >
        <h3 style={{ margin: "0 0 8px", color: "#c8372d", fontSize: 16, fontWeight: 800 }}>
          ⚠ {title}
        </h3>
        <p style={{ margin: "0 0 14px", color: "#c9cfd8", fontSize: 13, lineHeight: 1.5 }}>
          {body}
        </p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          required
          minLength={8}
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "#0f1520",
            border: "1px solid #2a3344",
            borderRadius: 6,
            color: "#e7ecf2",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {error && (
          <div style={{ marginTop: 10, color: "#f3b2ad", fontSize: 12 }}>{error}</div>
        )}
        <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              padding: "8px 14px",
              background: "transparent",
              color: "#9aa5b4",
              border: "1px solid #2a3344",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || password.length < 8}
            style={{
              padding: "8px 14px",
              background: "#c8372d",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              cursor: busy || password.length < 8 ? "not-allowed" : "pointer",
              opacity: busy || password.length < 8 ? 0.6 : 1,
            }}
          >
            {busy ? "..." : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
