"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      style={{
        width: "100%",
        padding: "8px 10px",
        background: "transparent",
        color: "#9aa5b4",
        border: "1px solid #2a3344",
        borderRadius: 4,
        fontSize: 12,
        cursor: busy ? "not-allowed" : "pointer",
        textTransform: "uppercase",
        letterSpacing: 1.5,
        fontWeight: 700,
      }}
    >
      {busy ? "..." : "Sign out"}
    </button>
  );
}
