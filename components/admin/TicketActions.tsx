"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDestructive from "./ConfirmDestructive";

export default function TicketActions({
  id,
  status,
}: {
  id: string;
  status: "open" | "resolved";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function toggleStatus() {
    const next = status === "open" ? "resolved" : "open";
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteTicket() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        router.replace("/admin/tickets");
      }
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: "12px 16px",
        background: "#131924",
        border: "1px solid #2a3344",
        borderRadius: 8,
      }}
    >
      <button
        type="button"
        onClick={toggleStatus}
        disabled={busy}
        style={{
          padding: "8px 14px",
          background: status === "open" ? "#5c8d68" : "#d4a44a",
          color: "#0a0e13",
          border: "none",
          borderRadius: 6,
          fontWeight: 700,
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          cursor: busy ? "not-allowed" : "pointer",
        }}
      >
        {status === "open" ? "✓ Mark resolved" : "↺ Reopen"}
      </button>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={busy}
        style={{
          padding: "8px 14px",
          background: "transparent",
          color: "#c8372d",
          border: "1px solid #c8372d55",
          borderRadius: 6,
          fontWeight: 700,
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          cursor: busy ? "not-allowed" : "pointer",
        }}
      >
        Delete
      </button>
      {error && <span style={{ color: "#f3b2ad", fontSize: 12 }}>{error}</span>}
      {confirmOpen && (
        <ConfirmDestructive
          title="Delete this ticket?"
          body="This permanently removes the ticket and its metadata from Redis. Enter your admin password to confirm."
          confirmLabel="Delete ticket"
          onConfirm={deleteTicket}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
