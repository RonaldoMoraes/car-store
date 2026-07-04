import { NextRequest, NextResponse } from "next/server";
import { createLead, resolveTenantByHost, whatsappLink } from "@paperclip/core";

const ROOT_DOMAIN = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost:3000";

// Records the WhatsApp click as a lead event, then bounces to wa.me.
export async function GET(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const tenant = await resolveTenantByHost(host, ROOT_DOMAIN);
  if (!tenant?.whatsapp) {
    return NextResponse.json({ error: "unknown tenant" }, { status: 404 });
  }

  const vehicleId = request.nextUrl.searchParams.get("v");
  const text =
    request.nextUrl.searchParams.get("text") ??
    `Olá! Vim pelo site da ${tenant.name}.`;

  try {
    await createLead({
      tenantId: tenant.id,
      vehicleId: vehicleId || null,
      type: "whatsapp",
      message: text,
      payload: {},
    });
  } catch {
    // Tracking must never block the customer reaching WhatsApp.
  }

  return NextResponse.redirect(whatsappLink(tenant.whatsapp, text), 302);
}
