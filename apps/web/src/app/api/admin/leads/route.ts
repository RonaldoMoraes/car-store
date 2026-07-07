import { NextRequest, NextResponse } from "next/server";
import { getDb, leads, vehicles } from "@paperclip/db";
import { MODULES, hasModule } from "@paperclip/core";
import { desc, eq } from "drizzle-orm";
import { apiSession, moduleDenied } from "@/lib/admin-auth";

// Lead inbox for the mobile app.
export async function GET(request: NextRequest) {
  const auth = await apiSession(request);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!hasModule(auth.modules, MODULES.leads)) return moduleDenied(MODULES.leads);

  const db = getDb();
  const rows = await db
    .select({ lead: leads, vehicle: vehicles })
    .from(leads)
    .leftJoin(vehicles, eq(vehicles.id, leads.vehicleId))
    .where(eq(leads.tenantId, auth.tenant.id))
    .orderBy(desc(leads.createdAt))
    .limit(200);

  return NextResponse.json({
    leads: rows.map(({ lead, vehicle }) => ({
      ...lead,
      vehicle: vehicle
        ? {
            id: vehicle.id,
            brand: vehicle.brand,
            model: vehicle.model,
            modelYear: vehicle.modelYear,
          }
        : null,
    })),
  });
}
