"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDestructive from "./ConfirmDestructive";

export default function UnitGeneralActions({
  game,
  unit,
  general,
  hasAny,
}: {
  game: string;
  unit: string;
  general?: string;
  hasAny?: boolean;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function doDelete() {
    setBusy(true);
    try {
      const url = general
        ? `/api/admin/votes/unit-general/${game}/${unit}/${general}`
        : `/api/admin/votes/unit-general/${game}/${unit}`;
      await fetch(url, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (general) {
    return (
      <>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={busy}
          style={{
            padding: "4px 10px",
            background: "transparent",
            color: "#c8372d",
            border: "1px solid #c8372d55",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1,
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          Delete
        </button>
        {confirmOpen && (
          <ConfirmDestructive
            title={`Remove "${general}" from ${unit}?`}
            body={`Zeroes votes for this general on ${unit} (${game}). The __total counter is decremented to match.`}
            confirmLabel="Delete"
            onConfirm={doDelete}
            onClose={() => setConfirmOpen(false)}
          />
        )}
      </>
    );
  }

  if (!hasAny) return null;

  return (
    <>
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
          fontSize: 12,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          cursor: busy ? "not-allowed" : "pointer",
        }}
      >
        Reset all votes for this unit
      </button>
      {confirmOpen && (
        <ConfirmDestructive
          title={`Reset every vote on ${unit}?`}
          body={`Deletes the entire ${game}/${unit} hash including every general entry and the __total counter. There is no undo.`}
          confirmLabel="Reset unit"
          onConfirm={doDelete}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
