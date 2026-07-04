import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@paperclip/db";
import {
  getBrands,
  getCurrentReferenceCode,
  getModelYears,
  getModels,
  getPrice,
} from "@paperclip/fipe";
import { apiSession } from "@/lib/admin-auth";

// One endpoint, four lookups (?q=brands|models|years|price) over the
// fetch-through FIPE cache. Years/prices may hit FIPE live on cold cache.
export async function GET(request: NextRequest) {
  const auth = await apiSession(request);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const q = sp.get("q");
  const brand = sp.get("brand") ?? "";
  const model = sp.get("model") ?? "";
  const yearCode = sp.get("year") ?? "";

  const db = getDb();
  try {
    const ref = await getCurrentReferenceCode(db);
    switch (q) {
      case "brands": {
        const rows = await getBrands(db, ref, 1);
        return NextResponse.json({
          ref,
          brands: rows.map((b) => ({ code: b.brandCode, name: b.name })),
        });
      }
      case "models": {
        if (!brand) return NextResponse.json({ error: "brand required" }, { status: 400 });
        const rows = await getModels(db, ref, 1, brand);
        return NextResponse.json({
          models: rows.map((m) => ({ code: m.modelCode, name: m.name })),
        });
      }
      case "years": {
        if (!brand || !model)
          return NextResponse.json({ error: "brand+model required" }, { status: 400 });
        const rows = await getModelYears(db, ref, 1, brand, model);
        return NextResponse.json({
          years: rows.map((y) => ({
            code: y.yearCode,
            year: y.year,
            fuelCode: y.fuelCode,
          })),
        });
      }
      case "price": {
        if (!brand || !model || !yearCode)
          return NextResponse.json(
            { error: "brand+model+year required" },
            { status: 400 },
          );
        const price = await getPrice(db, ref, 1, brand, model, yearCode);
        return NextResponse.json({ ref, price });
      }
      default:
        return NextResponse.json({ error: "invalid q" }, { status: 400 });
    }
  } catch (err) {
    // FIPE flakiness must degrade gracefully (decision 005).
    return NextResponse.json(
      { error: "FIPE indisponível no momento", detail: String(err) },
      { status: 502 },
    );
  }
}
