import { boolean, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

// Module entitlements (Founder directive 2026-07-07): features ship as
// modules; a tenant's plan enables modules, users can be restricted further
// (users.modules), and both API and frontend gate on the effective set.
export const tenantModules = pgTable(
  "tenant_modules",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    module: text("module").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.tenantId, t.module] })],
);
