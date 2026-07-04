import { NextRequest, NextResponse } from "next/server";
import { getDb, vehiclePhotos, vehicles } from "@paperclip/db";
import { and, eq } from "drizzle-orm";
import { apiSession } from "@/lib/admin-auth";
import { vehicleValues, type VehicleInput } from "@/lib/vehicle-input";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await apiSession(request);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const [existing] = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, id), eq(vehicles.tenantId, auth.tenant.id)))
    .limit(1);
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const input = (await request.json()) as VehicleInput;
  if (!input.brand?.trim() || !input.model?.trim() || !input.modelYear) {
    return NextResponse.json(
      { error: "marca, modelo e ano são obrigatórios" },
      { status: 400 },
    );
  }

  const status = input.status ?? existing.status;
  await db
    .update(vehicles)
    .set({
      ...vehicleValues(input),
      status,
      updatedAt: new Date(),
      publishedAt:
        status === "published" && !existing.publishedAt
          ? new Date()
          : existing.publishedAt,
      soldAt:
        status === "sold" && !existing.soldAt ? new Date() : existing.soldAt,
    })
    .where(eq(vehicles.id, id));

  // Photos: replace the set (ordered) with what the form sent.
  if (input.photoUrls) {
    await db.delete(vehiclePhotos).where(eq(vehiclePhotos.vehicleId, id));
    if (input.photoUrls.length > 0) {
      await db.insert(vehiclePhotos).values(
        input.photoUrls.map((url, position) => ({
          vehicleId: id,
          url,
          position,
        })),
      );
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await apiSession(request);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const deleted = await db
    .delete(vehicles)
    .where(and(eq(vehicles.id, id), eq(vehicles.tenantId, auth.tenant.id)))
    .returning({ id: vehicles.id });
  if (deleted.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
