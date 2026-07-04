import { getDb, tenantDomains, tenants } from "@paperclip/db";
import { and, eq } from "drizzle-orm";

export type Tenant = typeof tenants.$inferSelect;

function hostWithoutPort(host: string): string {
  return host.split(":")[0] ?? host;
}

/**
 * Hostname → tenant. Subdomains of the platform root resolve by slug
 * ({slug}.root); anything else is looked up as a custom domain.
 */
export async function resolveTenantByHost(
  host: string,
  rootDomain: string,
): Promise<Tenant | null> {
  const db = getDb();
  const hostname = hostWithoutPort(host.toLowerCase());
  const rootHostname = hostWithoutPort(rootDomain.toLowerCase());

  if (hostname === rootHostname || hostname === `www.${rootHostname}`) return null;

  if (hostname.endsWith(`.${rootHostname}`)) {
    const slug = hostname.slice(0, -(rootHostname.length + 1));
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.slug, slug), eq(tenants.status, "active")))
      .limit(1);
    return tenant ?? null;
  }

  const [match] = await db
    .select({ tenant: tenants })
    .from(tenantDomains)
    .innerJoin(tenants, eq(tenants.id, tenantDomains.tenantId))
    .where(and(eq(tenantDomains.domain, hostname), eq(tenants.status, "active")))
    .limit(1);
  return match?.tenant ?? null;
}
