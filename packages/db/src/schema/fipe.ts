import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// FIPE cache — immutable once written (same params never change, decision 005/009).
// Mirrors the full lookup hierarchy so every query path is served from our DB:
// reference month → vehicle type (1 carro / 2 moto / 3 caminhão) → brand → model → model-year → price.

export const fipeReferenceMonths = pgTable("fipe_reference_months", {
  code: integer("code").primaryKey(),
  month: text("month").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const fipeBrands = pgTable(
  "fipe_brands",
  {
    referenceCode: integer("reference_code").notNull(),
    vehicleType: integer("vehicle_type").notNull(),
    brandCode: text("brand_code").notNull(),
    name: text("name").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.referenceCode, t.vehicleType, t.brandCode] }),
    index("fipe_brands_name_idx").on(t.name),
  ],
);

export const fipeModels = pgTable(
  "fipe_models",
  {
    referenceCode: integer("reference_code").notNull(),
    vehicleType: integer("vehicle_type").notNull(),
    brandCode: text("brand_code").notNull(),
    modelCode: text("model_code").notNull(),
    name: text("name").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({
      columns: [t.referenceCode, t.vehicleType, t.brandCode, t.modelCode],
    }),
    // Reverse model-name lookup: voice flow infers the brand from the model (decision 011).
    index("fipe_models_name_idx").on(t.name),
  ],
);

export const fipeModelYears = pgTable(
  "fipe_model_years",
  {
    referenceCode: integer("reference_code").notNull(),
    vehicleType: integer("vehicle_type").notNull(),
    brandCode: text("brand_code").notNull(),
    modelCode: text("model_code").notNull(),
    yearCode: text("year_code").notNull(), // e.g. "2020-1" (year + fuel code)
    year: integer("year").notNull(),
    fuelCode: integer("fuel_code").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({
      columns: [
        t.referenceCode,
        t.vehicleType,
        t.brandCode,
        t.modelCode,
        t.yearCode,
      ],
    }),
  ],
);

export const fipePrices = pgTable(
  "fipe_prices",
  {
    referenceCode: integer("reference_code").notNull(),
    vehicleType: integer("vehicle_type").notNull(),
    brandCode: text("brand_code").notNull(),
    modelCode: text("model_code").notNull(),
    yearCode: text("year_code").notNull(),
    fipeCode: text("fipe_code").notNull(),
    priceCents: bigint("price_cents", { mode: "number" }).notNull(),
    brandName: text("brand_name"),
    modelName: text("model_name"),
    year: integer("year"),
    fuelName: text("fuel_name"),
    monthLabel: text("month_label"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({
      columns: [
        t.referenceCode,
        t.vehicleType,
        t.brandCode,
        t.modelCode,
        t.yearCode,
      ],
    }),
    index("fipe_prices_fipe_code_idx").on(t.fipeCode),
  ],
);

export const fipeCrawlState = pgTable("fipe_crawl_state", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
