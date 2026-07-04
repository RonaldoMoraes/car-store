import {
  bigint,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "draft",
  "published",
  "reserved",
  "sold",
]);

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    status: vehicleStatusEnum("status").notNull().default("draft"),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    version: text("version"),
    modelYear: integer("model_year").notNull(),
    manufactureYear: integer("manufacture_year"),
    // Money is integer cents everywhere — no floats.
    priceCents: bigint("price_cents", { mode: "number" }),
    mileageKm: integer("mileage_km"),
    color: text("color"),
    fuel: text("fuel"),
    transmission: text("transmission"),
    doors: integer("doors"),
    engine: text("engine"),
    plate: text("plate"),
    options: jsonb("options").$type<string[]>().notNull().default([]),
    description: text("description"),
    fipeCode: text("fipe_code"),
    fipeReferenceCode: integer("fipe_reference_code"),
    fipePriceCents: bigint("fipe_price_cents", { mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    soldAt: timestamp("sold_at", { withTimezone: true }),
  },
  (t) => [index("vehicles_tenant_status_idx").on(t.tenantId, t.status)],
);

export const vehiclePhotos = pgTable(
  "vehicle_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("vehicle_photos_vehicle_idx").on(t.vehicleId)],
);
