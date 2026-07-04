import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Multi-tenant routing: any hostname that isn't the platform root gets
// rewritten to /t/<host>/<path>, where the tenant is resolved from the DB.
const ROOT_DOMAIN = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost:3000";

export default function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase() ?? "";
  const rootHost = ROOT_DOMAIN.toLowerCase();

  if (host === rootHost || host === `www.${rootHost}`) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/t/${host}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip static assets and Next internals; /t/ is rewrite-only, never direct.
  matcher: ["/((?!_next/|favicon.ico|.*\\..*).*)"],
};
