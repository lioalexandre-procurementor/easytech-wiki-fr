"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDestructive from "./ConfirmDestructive";

export default function SkillSlotActions({
  general,
  slot,
  skill,
  hasAny,
}: {
  general: string;
  slot: number;
  skill?: string;
  hasAny?: boolean;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function doDelete() {
    setBusy(true);
    try {
      if (skill) {
        await fetch(`/api/admin/votes/skills/${general}/${slot}/${skill}`, { method: "DELETE" });
      } else {
        await fetch(`/api/admin/votes/skills/${general}/${slot}`, { method: "DELETE" });
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (skill) {
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
            title={`Delete votes for skill "${skill}"?`}
            body={`Zeroes votes for this one skill on ${general} slot ${slot}. The __total counter is adjusted to match.`}
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
        Reset this slot
      </button>
      {confirmOpen && (
        <ConfirmDestructive
          title={`Reset all votes for ${general} slot ${slot}?`}
          body="Deletes the entire slot hash including every skill and the __total counter. There is no undo."
          confirmLabel="Reset slot"
          onConfirm={doDelete}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
