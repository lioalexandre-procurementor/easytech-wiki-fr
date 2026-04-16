"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDestructive from "./ConfirmDestructive";

export default function BestGeneralActions({
  slug,
  hasAny,
}: {
  slug?: string;
  hasAny?: boolean;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function deleteSlug() {
    if (!slug) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/votes/best-general/${slug}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function resetAll() {
    setBusy(true);
    try {
      await fetch(`/api/admin/votes/best-general`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (slug) {
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
            title={`Delete all votes for "${slug}"?`}
            body={`This zeroes the votes for this one general only. Other entries and the __total counter are adjusted to match.`}
            confirmLabel="Delete"
            onConfirm={deleteSlug}
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
        Reset all votes
      </button>
      {confirmOpen && (
        <ConfirmDestructive
          title="Reset ALL best-general votes?"
          body="This drops every entry in vote:wc4:best-general including the __total counter. There is no undo."
          confirmLabel="Reset everything"
          onConfirm={resetAll}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
