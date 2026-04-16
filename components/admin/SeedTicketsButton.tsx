"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SeedTicketsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function seed() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/tickets/seed", { method: "POST" });
      const data = (await res.json()) as {
        created?: number;
        skipped?: number;
        total?: number;
        error?: string;
      };
      if (!res.ok) {
        setResult(`Failed: ${data.error ?? res.statusText}`);
      } else {
        setResult(
          `Seed complete: ${data.created ?? 0} created, ${data.skipped ?? 0} already existed (of ${data.total ?? 0}).`
        );
        router.refresh();
      }
    } catch {
      setResult("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={seed}
        disabled={busy}
        style={{
          padding: "10px 16px",
          background: "#1f2a3a",
          color: "#d4a44a",
          border: "1px solid #d4a44a55",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          cursor: busy ? "not-allowed" : "pointer",
        }}
      >
        {busy ? "Seeding..." : "Sync verification tickets from seed file"}
      </button>
      {result && (
        <div
          style={{
            marginTop: 10,
            color: "#9aa5b4",
            fontSize: 12,
          }}
        >
          {result}
        </div>
      )}
    </div>
  );
}
