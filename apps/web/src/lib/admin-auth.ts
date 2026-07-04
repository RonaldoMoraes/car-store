import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  resolveTenantByHost,
  verifySessionToken,
  type SessionPayload,
  type Tenant,
} from "@paperclip/core";
import { getTenant } from "./tenant";

const ROOT_DOMAIN = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost:3000";

/** Server-component guard: valid session for this tenant or redirect to login. */
export async function requireSession(host: string): Promise<{
  tenant: Tenant;
  session: SessionPayload;
}> {
  const tenant = await getTenant(host);
  if (!tenant) redirect("/");
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session || session.tenantId !== tenant.id) redirect("/admin/login");
  return { tenant, session };
}

/** Route-handler guard: returns null when unauthenticated (caller sends 401). */
export async function apiSession(request: NextRequest): Promise<{
  tenant: Tenant;
  session: SessionPayload;
} | null> {
  const host = request.headers.get("host") ?? "";
  const tenant = await resolveTenantByHost(host, ROOT_DOMAIN);
  if (!tenant) return null;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session || session.tenantId !== tenant.id) return null;
  return { tenant, session };
}
