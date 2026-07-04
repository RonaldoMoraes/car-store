import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { vehicles } from "./vehicles";

export const leadTypeEnum = pgEnum("lead_type", [
  "whatsapp",
  "form",
  "call",
  "financing",
  "trade_in",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "closed",
]);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id, {
      onDelete: "set null",
    }),
    type: leadTypeEnum("type").notNull(),
    status: leadStatusEnum("status").notNull().default("new"),
    name: text("name"),
    phone: text("phone"),
    email: text("email"),
    message: text("message"),
    // financing/trade-in extra fields live here (entrada, parcelas, trade-in car…)
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    // LGPD: when the visitor consented, null = no explicit consent captured (whatsapp/call clicks)
    consentAt: timestamp("consent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("leads_tenant_status_idx").on(t.tenantId, t.status)],
);

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
