import { getDb, vehiclePhotos, vehicles } from "@paperclip/db";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

export type Vehicle = typeof vehicles.$inferSelect;
export type VehiclePhoto = typeof vehiclePhotos.$inferSelect;
export type VehicleWithPhotos = Vehicle & { photos: VehiclePhoto[] };

export async function listPublishedVehicles(
  tenantId: string,
): Promise<VehicleWithPhotos[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.tenantId, tenantId), eq(vehicles.status, "published")))
    .orderBy(desc(vehicles.publishedAt));

  if (rows.length === 0) return [];

  const photos = await db
    .select()
    .from(vehiclePhotos)
    .where(
      inArray(
        vehiclePhotos.vehicleId,
        rows.map((v) => v.id),
      ),
    )
    .orderBy(asc(vehiclePhotos.position));

  const byVehicle = new Map<string, VehiclePhoto[]>();
  for (const p of photos) {
    const list = byVehicle.get(p.vehicleId) ?? [];
    list.push(p);
    byVehicle.set(p.vehicleId, list);
  }
  return rows.map((v) => ({ ...v, photos: byVehicle.get(v.id) ?? [] }));
}

export function formatPriceBRL(priceCents: number | null): string {
  if (priceCents == null) return "Consulte";
  return (priceCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
