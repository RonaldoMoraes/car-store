// Fetch-through cache over the FIPE hierarchy (decisions 005/009):
// read our DB first; on miss, fetch from FIPE, persist immutably, return.

import {
  fipeBrands,
  fipeModels,
  fipeModelYears,
  fipePrices,
  fipeReferenceMonths,
  type Db,
} from "@paperclip/db";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { fipeApi, parseBrlToCents, parseYearCode, type VehicleType } from "./api";

export async function syncReferenceMonths(db: Db): Promise<number> {
  const months = await fipeApi.referenceMonths();
  if (months.length === 0) throw new Error("FIPE returned no reference months");
  await db
    .insert(fipeReferenceMonths)
    .values(months.map((m) => ({ code: m.Codigo, month: m.Mes.trim() })))
    .onConflictDoNothing();
  return Math.max(...months.map((m) => m.Codigo));
}

export async function getCurrentReferenceCode(db: Db): Promise<number> {
  const [latest] = await db
    .select()
    .from(fipeReferenceMonths)
    .orderBy(desc(fipeReferenceMonths.code))
    .limit(1);
  if (latest) return latest.code;
  return syncReferenceMonths(db);
}

export async function getBrands(db: Db, referenceCode: number, vehicleType: VehicleType) {
  const cached = await db
    .select()
    .from(fipeBrands)
    .where(
      and(
        eq(fipeBrands.referenceCode, referenceCode),
        eq(fipeBrands.vehicleType, vehicleType),
      ),
    );
  if (cached.length > 0) return cached;

  const fresh = await fipeApi.brands(referenceCode, vehicleType);
  if (fresh.length === 0) return [];
  const rows = fresh.map((b) => ({
    referenceCode,
    vehicleType,
    brandCode: String(b.Value),
    name: b.Label,
  }));
  await db.insert(fipeBrands).values(rows).onConflictDoNothing();
  return db
    .select()
    .from(fipeBrands)
    .where(
      and(
        eq(fipeBrands.referenceCode, referenceCode),
        eq(fipeBrands.vehicleType, vehicleType),
      ),
    );
}

export async function getModels(
  db: Db,
  referenceCode: number,
  vehicleType: VehicleType,
  brandCode: string,
) {
  const where = and(
    eq(fipeModels.referenceCode, referenceCode),
    eq(fipeModels.vehicleType, vehicleType),
    eq(fipeModels.brandCode, brandCode),
  );
  const cached = await db.select().from(fipeModels).where(where);
  if (cached.length > 0) return cached;

  const fresh = await fipeApi.models(referenceCode, vehicleType, brandCode);
  if (fresh.length === 0) return [];
  await db
    .insert(fipeModels)
    .values(
      fresh.map((m) => ({
        referenceCode,
        vehicleType,
        brandCode,
        modelCode: String(m.Value),
        name: m.Label,
      })),
    )
    .onConflictDoNothing();
  return db.select().from(fipeModels).where(where);
}

export async function getModelYears(
  db: Db,
  referenceCode: number,
  vehicleType: VehicleType,
  brandCode: string,
  modelCode: string,
) {
  const where = and(
    eq(fipeModelYears.referenceCode, referenceCode),
    eq(fipeModelYears.vehicleType, vehicleType),
    eq(fipeModelYears.brandCode, brandCode),
    eq(fipeModelYears.modelCode, modelCode),
  );
  const cached = await db.select().from(fipeModelYears).where(where);
  if (cached.length > 0) return cached;

  const fresh = await fipeApi.modelYears(referenceCode, vehicleType, brandCode, modelCode);
  if (fresh.length === 0) return [];
  await db
    .insert(fipeModelYears)
    .values(
      fresh.map((y) => {
        const yearCode = String(y.Value);
        const { year, fuelCode } = parseYearCode(yearCode);
        return { referenceCode, vehicleType, brandCode, modelCode, yearCode, year, fuelCode };
      }),
    )
    .onConflictDoNothing();
  return db.select().from(fipeModelYears).where(where);
}

export async function getPrice(
  db: Db,
  referenceCode: number,
  vehicleType: VehicleType,
  brandCode: string,
  modelCode: string,
  yearCode: string,
) {
  const where = and(
    eq(fipePrices.referenceCode, referenceCode),
    eq(fipePrices.vehicleType, vehicleType),
    eq(fipePrices.brandCode, brandCode),
    eq(fipePrices.modelCode, modelCode),
    eq(fipePrices.yearCode, yearCode),
  );
  const [cached] = await db.select().from(fipePrices).where(where).limit(1);
  if (cached) return cached;

  const fresh = await fipeApi.price(referenceCode, vehicleType, brandCode, modelCode, yearCode);
  const row = {
    referenceCode,
    vehicleType,
    brandCode,
    modelCode,
    yearCode,
    fipeCode: fresh.CodigoFipe,
    priceCents: parseBrlToCents(fresh.Valor),
    brandName: fresh.Marca,
    modelName: fresh.Modelo,
    year: fresh.AnoModelo,
    fuelName: fresh.Combustivel,
    monthLabel: fresh.MesReferencia?.trim(),
  };
  await db.insert(fipePrices).values(row).onConflictDoNothing();
  return row;
}

// Reverse lookup for the voice flow (decision 011): "Creta" → Hyundai's Creta models,
// no brand required. Joins models to brands so the caller gets both.
export async function searchModelsByName(
  db: Db,
  referenceCode: number,
  vehicleType: VehicleType,
  query: string,
  limit = 20,
) {
  return db
    .select({
      brandCode: fipeModels.brandCode,
      brandName: fipeBrands.name,
      modelCode: fipeModels.modelCode,
      modelName: fipeModels.name,
    })
    .from(fipeModels)
    .innerJoin(
      fipeBrands,
      and(
        eq(fipeBrands.referenceCode, fipeModels.referenceCode),
        eq(fipeBrands.vehicleType, fipeModels.vehicleType),
        eq(fipeBrands.brandCode, fipeModels.brandCode),
      ),
    )
    .where(
      and(
        eq(fipeModels.referenceCode, referenceCode),
        eq(fipeModels.vehicleType, vehicleType),
        ilike(fipeModels.name, `%${query}%`),
      ),
    )
    .orderBy(sql`length(${fipeModels.name}) asc`)
    .limit(limit);
}
