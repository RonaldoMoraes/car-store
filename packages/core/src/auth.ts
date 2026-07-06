// Minimal credentials auth for the dealer back-office: scrypt password hashes
// + HMAC-signed session tokens. Zero external deps (node:crypto only).
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { getDb, tenants, users } from "@paperclip/db";
import { and, eq } from "drizzle-orm";

export type User = typeof users.$inferSelect;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `s1:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "s1" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production");
  }
  return "dev-secret-do-not-use-in-production";
}

export type SessionPayload = {
  userId: string;
  tenantId: string;
  exp: number; // unix seconds
};

function sign(data: string): string {
  return createHmac("sha256", authSecret()).update(data).digest("base64url");
}

export function createSessionToken(
  payload: Omit<SessionPayload, "exp">,
  maxAgeSeconds = 60 * 60 * 24 * 7,
): string {
  const full: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "pc_session";

export async function authenticateUser(
  tenantId: string,
  email: string,
  password: string,
): Promise<User | null> {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.tenantId, tenantId), eq(users.email, email.toLowerCase())))
    .limit(1);
  if (!user?.passwordHash) return null;
  return verifyPassword(password, user.passwordHash) ? user : null;
}

/**
 * Mobile login: no host to resolve the tenant from, so we look the e-mail up
 * across tenants. Ambiguous e-mails (same address in several stores) must
 * disambiguate with the store slug.
 */
export async function authenticateByEmail(
  email: string,
  password: string,
  slug?: string,
): Promise<
  | { ok: true; user: User }
  | { ok: false; reason: "invalid" | "ambiguous" }
> {
  const db = getDb();
  const matches = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(10);

  let candidates = matches;
  if (slug) {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug.toLowerCase()))
      .limit(1);
    candidates = tenant ? matches.filter((u) => u.tenantId === tenant.id) : [];
  }

  const valid = candidates.filter(
    (u) => u.passwordHash && verifyPassword(password, u.passwordHash),
  );
  if (valid.length === 1) return { ok: true, user: valid[0]! };
  if (valid.length > 1) return { ok: false, reason: "ambiguous" };
  return { ok: false, reason: "invalid" };
}
