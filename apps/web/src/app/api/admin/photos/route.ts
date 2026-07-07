import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { MODULES, hasModule } from "@paperclip/core";
import { apiSession, moduleDenied } from "@/lib/admin-auth";

// Local-disk storage for the MVP; swaps to Vercel Blob at deploy (same contract).
const UPLOAD_DIR = path.join(process.cwd(), ".uploads");
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const auth = await apiSession(request);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!hasModule(auth.modules, MODULES.estoque)) return moduleDenied(MODULES.estoque);

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file missing" }, { status: 400 });
  }
  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return NextResponse.json({ error: "unsupported type" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file too large (max 8MB)" }, { status: 413 });
  }

  const name = `${randomUUID()}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(
    path.join(UPLOAD_DIR, name),
    Buffer.from(await file.arrayBuffer()),
  );

  return NextResponse.json({ url: `/api/uploads/${name}` }, { status: 201 });
}
