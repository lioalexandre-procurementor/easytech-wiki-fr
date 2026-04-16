/**
 * Web Crypto-based session + reauth token helpers.
 *
 * Written against the WebCrypto API (globalThis.crypto.subtle) rather than
 * node:crypto so the same module can be imported from Next.js middleware
 * (Edge runtime, no node: scheme) and from API routes (Node runtime).
 * All sign/verify operations are therefore async.
 */

export const ADMIN_COOKIE = "ew_admin_session";
export const REAUTH_COOKIE = "ew_admin_reauth";

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
export const REAUTH_TTL_MS = 60 * 1000; // 60s

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

export function isAdminConfigured(): boolean {
  return sessionSecret() !== null && adminPassword() !== null;
}

const textEncoder = new TextEncoder();

/** base64url encode a Uint8Array (no padding). */
function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Constant-time byte comparison. */
function constantTimeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Constant-time string comparison (encodes both to UTF-8 bytes first). */
export function timingSafeEqual(a: string, b: string): boolean {
  return constantTimeEqualBytes(textEncoder.encode(a), textEncoder.encode(b));
}

export function isPasswordValid(candidate: string): boolean {
  const p = adminPassword();
  if (!p) return false;
  return timingSafeEqual(candidate, p);
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function hmacSignB64url(secret: string, data: string): Promise<string> {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, textEncoder.encode(data));
  return b64urlEncode(new Uint8Array(sig));
}

function randomB64url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return b64urlEncode(bytes);
}

/**
 * Session token format: `<issuedAtMs>.<expiresAtMs>.<nonce>.<hmac>`
 * HMAC covers `<issuedAtMs>.<expiresAtMs>.<nonce>` so the cookie is
 * tamper-proof without a server-side session store.
 */
export async function issueSession(ttlMs: number): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const now = Date.now();
  const expires = now + ttlMs;
  const nonce = randomB64url(12);
  const payload = `${now}.${expires}.${nonce}`;
  const sig = await hmacSignB64url(secret, payload);
  return `${payload}.${sig}`;
}

export type VerifiedSession = {
  issuedAt: number;
  expiresAt: number;
};

export async function verifySession(
  token: string | undefined | null
): Promise<VerifiedSession | null> {
  if (!token) return null;
  const secret = sessionSecret();
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [issuedStr, expiresStr, nonce, sig] = parts;
  const payload = `${issuedStr}.${expiresStr}.${nonce}`;
  const expectedSig = await hmacSignB64url(secret, payload);
  if (!timingSafeEqual(sig, expectedSig)) return null;
  const issuedAt = Number(issuedStr);
  const expiresAt = Number(expiresStr);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) return null;
  if (Date.now() > expiresAt) return null;
  return { issuedAt, expiresAt };
}

/**
 * Short-lived reauth token. Separate from the session cookie so stealing
 * a logged-in laptop doesn't let an attacker click "reset all votes"
 * without re-entering the password.
 */
export async function issueReauth(ttlMs: number): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const expires = Date.now() + ttlMs;
  const nonce = randomB64url(8);
  const payload = `reauth.${expires}.${nonce}`;
  const sig = await hmacSignB64url(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifyReauth(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const secret = sessionSecret();
  if (!secret) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [kind, expiresStr, nonce, sig] = parts;
  if (kind !== "reauth") return false;
  const payload = `${kind}.${expiresStr}.${nonce}`;
  const expectedSig = await hmacSignB64url(secret, payload);
  if (!timingSafeEqual(sig, expectedSig)) return false;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  return true;
}
