import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  authenticateUser,
  createSessionToken,
  resolveTenantByHost,
} from "@paperclip/core";

const ROOT_DOMAIN = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost:3000";

export async function POST(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const tenant = await resolveTenantByHost(host, ROOT_DOMAIN);
  if (!tenant) return NextResponse.json({ error: "unknown tenant" }, { status: 404 });

  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  const user = await authenticateUser(tenant.id, email, password);
  const base = `http://${host}`;
  if (!user) {
    return NextResponse.redirect(`${base}/admin/login?erro=1`, 303);
  }

  const response = NextResponse.redirect(`${base}/admin`, 303);
  response.cookies.set(SESSION_COOKIE, createSessionToken({
    userId: user.id,
    tenantId: tenant.id,
  }), {
    httpOnly: true,
    sameSite: "lax",
    // Secure except on localhost — local "next start" runs in production mode over http.
    secure:
      process.env.NODE_ENV === "production" && !host.includes("localhost"),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
