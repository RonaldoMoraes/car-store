import { NextRequest, NextResponse } from "next/server";
import { apiSession } from "@/lib/admin-auth";

// App boot: validates the stored token and refreshes tenant theme.
export async function GET(request: NextRequest) {
  const auth = await apiSession(request);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { tenant } = auth;
  return NextResponse.json({
    modules: auth.modules,
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      theme: tenant.theme,
      whatsapp: tenant.whatsapp,
      city: tenant.city,
      state: tenant.state,
    },
  });
}
