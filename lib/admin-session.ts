import crypto from "node:crypto";

export const ADMIN_COOKIE = "ew_admin_session";
export const REAUTH_COOKIE = "ew_admin_reauth";

function sessionSecret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) return null;
  return s;
}

function adminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  if (!p || p.length < 8) return null;
  return p;
}

/** Constant-time string compare — avoids leaking length-or-char timing info. */
export function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function isPasswordValid(candidate: string): boolean {
  const p = adminPassword();
  if (!p) return false;
  return timingSafeEqual(candidate, p);
}

export function isAdminConfigured(): boolean {
  return sessionSecret() !== null && adminPassword() !== null;
}

function hmac(secret: string, data: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

/**
 * Session token format: `<issuedAtMs>.<expiresAtMs>.<nonce>.<hmac>`
 * HMAC covers `<issuedAtMs>.<expiresAtMs>.<nonce>` so the cookie is
 * tamper-proof without a server-side session store.
 */
export function issueSession(ttlMs: number): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const now = Date.now();
  const expires = now + ttlMs;
  const nonce = crypto.randomBytes(12).toString("base64url");
  const payload = `${now}.${expires}.${nonce}`;
  return `${payload}.${hmac(secret, payload)}`;
}

export type VerifiedSession = {
  issuedAt: number;
  expiresAt: number;
};

export function verifySession(token: string | undefined | null): VerifiedSession | null {
  if (!token) return null;
  const secret = sessionSecret();
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [issuedStr, expiresStr, nonce, sig] = parts;
  const payload = `${issuedStr}.${expiresStr}.${nonce}`;
  const expectedSig = hmac(secret, payload);
  if (!timingSafeEqual(sig, expectedSig)) return null;
  const issuedAt = Number(issuedStr);
  const expiresAt = Number(expiresStr);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) return null;
  if (Date.now() > expiresAt) return null;
  return { issuedAt, expiresAt };
}

/**
 * Short-lived re-auth token. Separate from the session cookie so that
 * stealing a logged-in laptop doesn't let an attacker click "reset all
 * votes" without re-entering the password.
 */
export function issueReauth(ttlMs: number): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const expires = Date.now() + ttlMs;
  const nonce = crypto.randomBytes(8).toString("base64url");
  const payload = `reauth.${expires}.${nonce}`;
  return `${payload}.${hmac(secret, payload)}`;
}

export function verifyReauth(token: string | undefined | null): boolean {
  if (!token) return false;
  const secret = sessionSecret();
  if (!secret) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [kind, expiresStr, nonce, sig] = parts;
  if (kind !== "reauth") return false;
  const payload = `${kind}.${expiresStr}.${nonce}`;
  if (!timingSafeEqual(sig, hmac(secret, payload))) return false;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  return true;
}

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
export const REAUTH_TTL_MS = 60 * 1000; // 60s — short-lived confirmation window
