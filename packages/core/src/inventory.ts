import { getDb, vehiclePhotos, vehicles } from "@paperclip/db";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";

export type Vehicle = typeof vehicles.$inferSelect;
export type VehiclePhoto = typeof vehiclePhotos.$inferSelect;
export type VehicleWithPhotos = Vehicle & { photos: VehiclePhoto[] };

export type VehicleFilters = {
  q?: string;
  brand?: string;
  yearMin?: number;
  yearMax?: number;
  priceMaxCents?: number;
};

async function attachPhotos(rows: Vehicle[]): Promise<VehicleWithPhotos[]> {
  if (rows.length === 0) return [];
  const db = getDb();
  const photos = await db
    .select()
    .from(vehiclePhotos)
    .where(
      inArray(
        vehiclePhotos.vehicleId,
        rows.map((v) => v.id),
      ),
    )
    .orderBy(asc(vehiclePhotos.position), asc(vehiclePhotos.createdAt));

  const byVehicle = new Map<string, VehiclePhoto[]>();
  for (const p of photos) {
    const list = byVehicle.get(p.vehicleId) ?? [];
    list.push(p);
    byVehicle.set(p.vehicleId, list);
  }
  return rows.map((v) => ({ ...v, photos: byVehicle.get(v.id) ?? [] }));
}

export async function listPublishedVehicles(
  tenantId: string,
  filters: VehicleFilters = {},
  limit = 60,
): Promise<VehicleWithPhotos[]> {
  const db = getDb();
  const conditions = [
    eq(vehicles.tenantId, tenantId),
    eq(vehicles.status, "published"),
  ];
  if (filters.brand) conditions.push(eq(vehicles.brand, filters.brand));
  if (filters.yearMin) conditions.push(gte(vehicles.modelYear, filters.yearMin));
  if (filters.yearMax) conditions.push(lte(vehicles.modelYear, filters.yearMax));
  if (filters.priceMaxCents)
    conditions.push(lte(vehicles.priceCents, filters.priceMaxCents));
  if (filters.q) {
    const q = `%${filters.q}%`;
    const textMatch = or(
      ilike(vehicles.brand, q),
      ilike(vehicles.model, q),
      ilike(vehicles.version, q),
    );
    if (textMatch) conditions.push(textMatch);
  }

  const rows = await db
    .select()
    .from(vehicles)
    .where(and(...conditions))
    .orderBy(desc(vehicles.publishedAt))
    .limit(limit);
  return attachPhotos(rows);
}

export async function getPublishedVehicle(
  tenantId: string,
  id: string,
): Promise<VehicleWithPhotos | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(vehicles)
    .where(
      and(
        eq(vehicles.id, id),
        eq(vehicles.tenantId, tenantId),
        eq(vehicles.status, "published"),
      ),
    )
    .limit(1);
  const [withPhotos] = await attachPhotos(rows);
  return withPhotos ?? null;
}

export async function listSimilarVehicles(
  tenantId: string,
  vehicle: Vehicle,
  limit = 3,
): Promise<VehicleWithPhotos[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(vehicles)
    .where(
      and(
        eq(vehicles.tenantId, tenantId),
        eq(vehicles.status, "published"),
        ne(vehicles.id, vehicle.id),
      ),
    )
    .orderBy(
      // same brand first, then freshest
      sql`(${vehicles.brand} = ${vehicle.brand}) desc`,
      desc(vehicles.publishedAt),
    )
    .limit(limit);
  return attachPhotos(rows);
}

export async function listBrandsInStock(tenantId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .selectDistinct({ brand: vehicles.brand })
    .from(vehicles)
    .where(and(eq(vehicles.tenantId, tenantId), eq(vehicles.status, "published")))
    .orderBy(asc(vehicles.brand));
  return rows.map((r) => r.brand);
}

export async function countPublishedVehicles(tenantId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(vehicles)
    .where(and(eq(vehicles.tenantId, tenantId), eq(vehicles.status, "published")));
  return row?.count ?? 0;
}

// ——— dealer back-office (all statuses) ———

export async function listTenantVehicles(
  tenantId: string,
): Promise<VehicleWithPhotos[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.tenantId, tenantId))
    .orderBy(desc(vehicles.updatedAt));
  return attachPhotos(rows);
}

export async function getTenantVehicle(
  tenantId: string,
  id: string,
): Promise<VehicleWithPhotos | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, id), eq(vehicles.tenantId, tenantId)))
    .limit(1);
  const [withPhotos] = await attachPhotos(rows);
  return withPhotos ?? null;
}

export function formatPriceBRL(priceCents: number | null): string {
  if (priceCents == null) return "Consulte";
  return (priceCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function formatKm(km: number | null): string {
  if (km == null) return "—";
  return `${km.toLocaleString("pt-BR")} km`;
}
