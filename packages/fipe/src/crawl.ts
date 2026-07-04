// FIPE crawler MVP — pre-warms the cache: reference months → brands → models.
// Model-years and prices fill lazily via the fetch-through cache (cache.ts);
// crawling every price upfront would be ~40k+ requests against a flaky source.
// Resumable: progress checkpointed in fipe_crawl_state.

import { config } from "dotenv";
config({ path: "../../.env" });

import { closeDb, fipeCrawlState, getDb } from "@paperclip/db";
import { eq } from "drizzle-orm";
import { VEHICLE_TYPES, type VehicleType } from "./api";
import { getBrands, getModels, syncReferenceMonths } from "./cache";

const CHECKPOINT_KEY = "crawl:models";

async function main() {
  const db = getDb();
  const typesArg = process.argv.find((a) => a.startsWith("--types="));
  const types: VehicleType[] = typesArg
    ? (typesArg.replace("--types=", "").split(",").map(Number) as VehicleType[])
    : [VEHICLE_TYPES.carro];

  console.log("FIPE crawl: syncing reference months…");
  const referenceCode = await syncReferenceMonths(db);
  console.log(`FIPE crawl: current reference table = ${referenceCode}`);

  const [checkpoint] = await db
    .select()
    .from(fipeCrawlState)
    .where(eq(fipeCrawlState.key, CHECKPOINT_KEY));
  const done = new Set<string>(
    checkpoint && (checkpoint.value.referenceCode as number) === referenceCode
      ? (checkpoint.value.doneBrands as string[])
      : [],
  );

  for (const vehicleType of types) {
    const brands = await getBrands(db, referenceCode, vehicleType);
    console.log(`FIPE crawl: type ${vehicleType} → ${brands.length} brands`);

    let i = 0;
    for (const brand of brands) {
      i += 1;
      const key = `${vehicleType}:${brand.brandCode}`;
      if (done.has(key)) continue;

      const models = await getModels(db, referenceCode, vehicleType, brand.brandCode);
      done.add(key);
      await db
        .insert(fipeCrawlState)
        .values({
          key: CHECKPOINT_KEY,
          value: { referenceCode, doneBrands: [...done] },
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: fipeCrawlState.key,
          set: { value: { referenceCode, doneBrands: [...done] }, updatedAt: new Date() },
        });
      console.log(
        `  [${i}/${brands.length}] ${brand.name}: ${models.length} models cached`,
      );
    }
  }

  console.log("FIPE crawl: done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
