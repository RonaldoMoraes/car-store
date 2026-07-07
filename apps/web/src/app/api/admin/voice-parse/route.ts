import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@paperclip/db";
import { MODULES, hasModule } from "@paperclip/core";
import { getCurrentReferenceCode, parseVoiceCommand } from "@paperclip/fipe";
import { apiSession, moduleDenied } from "@/lib/admin-auth";

// Voice add-a-car (decision 011): transcript in, pre-filled draft out.
export async function POST(request: NextRequest) {
  const auth = await apiSession(request);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!hasModule(auth.modules, MODULES.voz)) return moduleDenied(MODULES.voz);

  const { transcript } = (await request.json()) as { transcript?: string };
  if (!transcript?.trim()) {
    return NextResponse.json({ error: "transcript required" }, { status: 400 });
  }

  const db = getDb();
  const ref = await getCurrentReferenceCode(db);
  const draft = await parseVoiceCommand(db, ref, 1, transcript.trim());
  return NextResponse.json({ ref, draft });
}
