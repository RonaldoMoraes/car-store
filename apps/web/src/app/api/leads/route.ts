import { NextRequest, NextResponse } from "next/server";
import { createLead, resolveTenantByHost } from "@paperclip/core";

const ROOT_DOMAIN = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost:3000";
const LEAD_TYPES = new Set(["form", "financing", "trade_in"]);

export async function POST(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const tenant = await resolveTenantByHost(host, ROOT_DOMAIN);
  if (!tenant) return NextResponse.json({ error: "unknown tenant" }, { status: 404 });

  const form = await request.formData();
  const type = String(form.get("type") ?? "form");
  const consent = form.get("consent");
  const name = String(form.get("name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();

  if (!LEAD_TYPES.has(type) || !consent || !name || !phone) {
    return NextResponse.json({ error: "invalid submission" }, { status: 400 });
  }

  const vehicleId = String(form.get("vehicleId") ?? "") || null;
  const payload: Record<string, unknown> = {};
  for (const key of ["downPayment", "installments", "tradeInVehicle", "tradeInKm"]) {
    const value = String(form.get(key) ?? "").trim();
    if (value) payload[key] = value;
  }

  await createLead({
    tenantId: tenant.id,
    vehicleId,
    type: type as "form" | "financing" | "trade_in",
    name,
    phone,
    email: String(form.get("email") ?? "").trim() || null,
    message: String(form.get("message") ?? "").trim() || null,
    payload,
    consentAt: new Date(),
  });

  // Progressive enhancement: plain form post → redirect back with a success flag.
  const referer = request.headers.get("referer");
  const back = referer ? new URL(referer) : new URL(`http://${host}/`);
  back.searchParams.set("enviado", "1");
  back.hash = "contato";
  return NextResponse.redirect(back, 303);
}
