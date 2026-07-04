import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@paperclip/core";

export async function POST(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const response = NextResponse.redirect(`http://${host}/admin/login`, 303);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
