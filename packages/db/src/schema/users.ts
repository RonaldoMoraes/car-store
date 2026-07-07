import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const userRoleEnum = pgEnum("user_role", ["owner", "staff"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    // Auth wiring lands in M3 (app login); schema is here so RLS/ownership is right from day one.
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").notNull().default("staff"),
    // null = user sees every module the tenant has; otherwise an allow-list.
    modules: jsonb("modules").$type<string[] | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_tenant_email_idx").on(t.tenantId, t.email)],
);
