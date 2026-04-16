"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace(nextPath);
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        remaining?: number;
      };
      if (res.status === 429) {
        setError("Too many attempts. Try again in 15 minutes.");
      } else if (res.status === 503) {
        setError("Admin panel not configured on the server (missing env vars).");
      } else {
        const r = typeof data.remaining === "number" ? ` (${data.remaining} attempts left)` : "";
        setError(`Invalid password${r}`);
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <html lang="en">
      <head>
        <title>Admin — Login</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0a0e13",
          color: "#e7ecf2",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          display: "grid",
          placeItems: "center",
          padding: "20px",
        }}
      >
        <form
          onSubmit={submit}
          style={{
            width: "100%",
            maxWidth: 380,
            background: "#131924",
            border: "1px solid #2a3344",
            borderRadius: 12,
            padding: "28px 24px",
          }}
        >
          <h1
            style={{
              margin: "0 0 6px",
              fontSize: 22,
              color: "#d4a44a",
              fontWeight: 800,
            }}
          >
            🔒 EasyTech Wiki — Admin
          </h1>
          <p style={{ margin: "0 0 22px", color: "#9aa5b4", fontSize: 13 }}>
            Enter the admin password to access the dashboard.
          </p>
          <label
            style={{
              display: "block",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 2,
              fontWeight: 700,
              color: "#9aa5b4",
              marginBottom: 6,
            }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
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
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 6,
                background: "rgba(200,55,45,0.1)",
                border: "1px solid rgba(200,55,45,0.4)",
                color: "#f3b2ad",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || password.length < 8}
            style={{
              width: "100%",
              marginTop: 18,
              padding: "12px 14px",
              background: "#d4a44a",
              color: "#0a0e13",
              border: "none",
              borderRadius: 6,
              fontWeight: 800,
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: 2,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting || password.length < 8 ? 0.6 : 1,
            }}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
          <p
            style={{
              marginTop: 22,
              fontSize: 11,
              color: "#6b7685",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            5 attempts / 15 min per IP. Sessions last 24h. Destructive ops
            require password re-entry.
          </p>
        </form>
      </body>
    </html>
  );
}
