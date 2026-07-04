import { cache } from "react";
import { resolveTenantByHost, type Tenant } from "@paperclip/core";

const ROOT_DOMAIN = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost:3000";

// Deduped per request: layout + page + metadata all share one lookup.
export const getTenant = cache(async (host: string): Promise<Tenant | null> => {
  return resolveTenantByHost(decodeURIComponent(host), ROOT_DOMAIN);
});
