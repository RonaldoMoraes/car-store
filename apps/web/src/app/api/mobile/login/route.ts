import { NextRequest, NextResponse } from "next/server";
import {
  authenticateByEmail,
  createSessionToken,
  getTenantById,
} from "@paperclip/core";

// Mobile app login: JSON in, bearer token + tenant theme out (30-day session).
export async function POST(request: NextRequest) {
  const { email, password, slug } = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    slug?: string;
  };
  if (!email || !password) {
    return NextResponse.json({ error: "email e senha obrigatórios" }, { status: 400 });
  }

  const result = await authenticateByEmail(email, password, slug);
  if (!result.ok) {
    if (result.reason === "ambiguous") {
      return NextResponse.json(
        { error: "ambiguous", message: "Informe o código da loja." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "invalid", message: "E-mail ou senha incorretos." },
      { status: 401 },
    );
  }

  const tenant = await getTenantById(result.user.tenantId);
  if (!tenant) {
    return NextResponse.json({ error: "loja inativa" }, { status: 403 });
  }

  const token = createSessionToken(
    { userId: result.user.id, tenantId: tenant.id },
    60 * 60 * 24 * 30,
  );

  return NextResponse.json({
    token,
    user: { id: result.user.id, name: result.user.name, role: result.user.role },
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
