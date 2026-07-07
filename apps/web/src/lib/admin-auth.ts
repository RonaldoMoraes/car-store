import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  getEffectiveModules,
  getTenantById,
  hasModule,
  resolveTenantByHost,
  verifySessionToken,
  type ModuleKey,
  type SessionPayload,
  type Tenant,
} from "@paperclip/core";
import { NextResponse } from "next/server";
import { getTenant } from "./tenant";

const ROOT_DOMAIN = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost:3000";

export type AuthContext = {
  tenant: Tenant;
  session: SessionPayload;
  modules: ModuleKey[];
};

/** Server-component guard: valid session for this tenant or redirect to login. */
export async function requireSession(host: string): Promise<AuthContext> {
  const tenant = await getTenant(host);
  if (!tenant) redirect("/");
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session || session.tenantId !== tenant.id) redirect("/admin/login");
  const modules = await getEffectiveModules(tenant.id, session.userId);
  return { tenant, session, modules };
}

/** Page-level module gate: bounce to the dashboard if the module is off. */
export async function requireModule(
  host: string,
  moduleKey: ModuleKey,
): Promise<AuthContext> {
  const ctx = await requireSession(host);
  if (!hasModule(ctx.modules, moduleKey)) redirect("/admin");
  return ctx;
}

/**
 * Route-handler guard: returns null when unauthenticated (caller sends 401).
 * Two transports: browser session cookie (tenant from Host header) and
 * mobile `Authorization: Bearer` token (tenant from the token itself).
 */
export async function apiSession(request: NextRequest): Promise<AuthContext | null> {
  const bearer = request.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    const session = verifySessionToken(bearer.slice(7));
    if (!session) return null;
    const tenant = await getTenantById(session.tenantId);
    if (!tenant) return null;
    const modules = await getEffectiveModules(tenant.id, session.userId);
    return { tenant, session, modules };
  }

  const host = request.headers.get("host") ?? "";
  const tenant = await resolveTenantByHost(host, ROOT_DOMAIN);
  if (!tenant) return null;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session || session.tenantId !== tenant.id) return null;
  const modules = await getEffectiveModules(tenant.id, session.userId);
  return { tenant, session, modules };
}

/** Route-handler module gate: 403 with a machine-readable code when off. */
export function moduleDenied(moduleKey: ModuleKey): NextResponse {
  return NextResponse.json(
    { error: "module_disabled", module: moduleKey },
    { status: 403 },
  );
}
