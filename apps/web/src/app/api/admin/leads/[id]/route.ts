import { NextRequest, NextResponse } from "next/server";
import { getDb, leads } from "@paperclip/db";
import { and, eq } from "drizzle-orm";
import { apiSession } from "@/lib/admin-auth";

const STATUSES = new Set(["new", "contacted", "closed"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await apiSession(request);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = (await request.json()) as { status?: string };
  if (!status || !STATUSES.has(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const updated = await getDb()
    .update(leads)
    .set({ status: status as "new" | "contacted" | "closed" })
    .where(and(eq(leads.id, id), eq(leads.tenantId, auth.tenant.id)))
    .returning({ id: leads.id });
  if (updated.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
