import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Signed, stateless admin session stored in an httpOnly cookie.
// Token format: base64url(JSON payload) + "." + base64url(HMAC-SHA256 signature)

export const ADMIN_COOKIE = "gw_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

export interface AdminSession {
  id: string;
  name: string;
  email: string;
  role: string;
  exp: number; // unix seconds
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SESSION_SECRET must be set (32+ chars) in production.");
  }
  return "dev-only-insecure-admin-session-secret-change-me";
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

// Tokens carry a `kind` so a customer token can never be accepted as an admin token (and vice versa)
function createToken(payload: Record<string, unknown>, maxAge: number): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + maxAge })).toString("base64url");
  return `${body}.${sign(body)}`;
}

function verifyToken<T>(token: string | undefined | null, kind: "admin" | "customer"): T | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    // Admin tokens issued before `kind` existed have no kind field
    if ((payload.kind ?? "admin") !== kind) return null;
    return payload as T;
  } catch {
    return null;
  }
}

export function createAdminToken(user: Omit<AdminSession, "exp">): string {
  return createToken({ ...user, kind: "admin" }, ADMIN_SESSION_MAX_AGE);
}

export function verifyAdminToken(token: string | undefined | null): AdminSession | null {
  return verifyToken<AdminSession>(token, "admin");
}

// ---- Customer sessions ----

export const CUSTOMER_COOKIE = "gw_customer_session";
export const CUSTOMER_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface CustomerSession {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  exp: number;
}

export function createCustomerToken(user: Omit<CustomerSession, "exp">): string {
  return createToken({ ...user, kind: "customer" }, CUSTOMER_SESSION_MAX_AGE);
}

export function verifyCustomerToken(token: string | undefined | null): CustomerSession | null {
  return verifyToken<CustomerSession>(token, "customer");
}

// ---- Password hashing (scrypt). Stored as "scrypt$<salt>$<hash>" ----

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

export function isHashedPassword(stored: string): boolean {
  return stored.startsWith("scrypt$");
}

export function verifyPassword(password: string, stored: string): boolean {
  if (isHashedPassword(stored)) {
    const [, salt, hash] = stored.split("$");
    const expected = Buffer.from(hash, "base64url");
    const actual = scryptSync(password, salt, 64);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
  // Legacy plain-text password from the seed; caller upgrades it to a hash on success
  const expected = Buffer.from(stored);
  const actual = Buffer.from(password);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
