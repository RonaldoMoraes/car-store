import { NextRequest, NextResponse } from "next/server";
import { getDb, vehiclePhotos, vehicles } from "@paperclip/db";
import { listTenantVehicles } from "@paperclip/core";
import { apiSession } from "@/lib/admin-auth";
import { vehicleValues, type VehicleInput } from "@/lib/vehicle-input";

// Inventory list for the mobile app (all statuses, with photos).
export async function GET(request: NextRequest) {
  const auth = await apiSession(request);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await listTenantVehicles(auth.tenant.id);
  return NextResponse.json({ vehicles: rows });
}

export async function POST(request: NextRequest) {
  const auth = await apiSession(request);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const input = (await request.json()) as VehicleInput;
  if (!input.brand?.trim() || !input.model?.trim() || !input.modelYear) {
    return NextResponse.json(
      { error: "marca, modelo e ano são obrigatórios" },
      { status: 400 },
    );
  }

  const db = getDb();
  const status = input.status ?? "draft";
  const [vehicle] = await db
    .insert(vehicles)
    .values({
      ...vehicleValues(input),
      tenantId: auth.tenant.id,
      status,
      publishedAt: status === "published" ? new Date() : null,
    })
    .returning();
  if (!vehicle) return NextResponse.json({ error: "insert failed" }, { status: 500 });

  const urls = input.photoUrls ?? [];
  if (urls.length > 0) {
    await db.insert(vehiclePhotos).values(
      urls.map((url, position) => ({ vehicleId: vehicle.id, url, position })),
    );
  }

  return NextResponse.json({ id: vehicle.id }, { status: 201 });
}
