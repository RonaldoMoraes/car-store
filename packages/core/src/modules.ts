import { getDb, tenantModules, users } from "@paperclip/db";
import { and, eq } from "drizzle-orm";

// Module registry — every gated feature has a key. API routes and frontends
// (admin nav/sections, app tabs) gate on the EFFECTIVE set:
// tenant entitlements ∩ user allow-list (users.modules; null = all).
export const MODULES = {
  estoque: "estoque",
  site: "site",
  leads: "leads",
  fipe: "fipe",
  voz: "voz",
  crm: "crm",
  vistoria: "vistoria",
  nfe: "nfe",
  placa: "placa",
  filiais: "filiais",
  whatsappApi: "whatsapp_api",
} as const;

export type ModuleKey = (typeof MODULES)[keyof typeof MODULES];

// The Essencial plan — what every tenant gets today.
export const DEFAULT_MODULES: ModuleKey[] = [
  MODULES.estoque,
  MODULES.site,
  MODULES.leads,
  MODULES.fipe,
  MODULES.voz,
];

export async function getTenantModules(tenantId: string): Promise<ModuleKey[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(tenantModules)
    .where(and(eq(tenantModules.tenantId, tenantId), eq(tenantModules.enabled, true)));
  // Tenants provisioned before the modules system get the default plan.
  if (rows.length === 0) return [...DEFAULT_MODULES];
  return rows.map((r) => r.module as ModuleKey);
}

export async function getEffectiveModules(
  tenantId: string,
  userId: string,
): Promise<ModuleKey[]> {
  const db = getDb();
  const [tenantSet, [user]] = await Promise.all([
    getTenantModules(tenantId),
    db.select().from(users).where(eq(users.id, userId)).limit(1),
  ]);
  if (!user?.modules) return tenantSet;
  const allow = new Set(user.modules);
  return tenantSet.filter((m) => allow.has(m));
}

export function hasModule(modules: string[], key: ModuleKey): boolean {
  return modules.includes(key);
}
