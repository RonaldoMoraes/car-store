import { config } from "dotenv";
config({ path: "../../.env" });

import { closeDb, getDb } from "./client";
import { tenantDomains, tenants } from "./schema/tenants";
import { vehiclePhotos, vehicles } from "./schema/vehicles";

async function main() {
  const db = getDb();

  const [demo] = await db
    .insert(tenants)
    .values({
      slug: "demo",
      name: "Demo Veículos",
      templateId: "t1",
      theme: {
        primaryColor: "#0f172a",
        accentColor: "#dc2626",
      },
      whatsapp: "5535999990000",
      phone: "(35) 3622-0000",
      city: "Itajubá",
      state: "MG",
      addressLine: "Av. Principal, 100 — Centro",
    })
    .onConflictDoNothing({ target: tenants.slug })
    .returning();

  if (!demo) {
    console.log("Seed: tenant 'demo' already exists, nothing to do.");
    return;
  }

  await db.insert(tenantDomains).values({
    tenantId: demo.id,
    domain: "demo.localhost:3000",
    isPrimary: true,
  });

  const seedVehicles = [
    {
      brand: "Hyundai",
      model: "Creta",
      version: "2.0 Prestige",
      modelYear: 2020,
      manufactureYear: 2020,
      priceCents: 9_000_000,
      mileageKm: 45_000,
      color: "Preto",
      fuel: "Flex",
      transmission: "Automático",
      doors: 4,
      engine: "2.0",
      options: ["Ar-condicionado", "Direção elétrica", "Vidros elétricos", "Travas elétricas", "Alarme", "Som"],
    },
    {
      brand: "Chevrolet",
      model: "Onix",
      version: "1.0 LT",
      modelYear: 2022,
      manufactureYear: 2021,
      priceCents: 7_200_000,
      mileageKm: 28_000,
      color: "Branco",
      fuel: "Flex",
      transmission: "Manual",
      doors: 4,
      engine: "1.0",
      options: ["Ar-condicionado", "Direção elétrica"],
    },
  ];

  for (const v of seedVehicles) {
    const [row] = await db
      .insert(vehicles)
      .values({
        ...v,
        tenantId: demo.id,
        status: "published",
        publishedAt: new Date(),
      })
      .returning();
    if (row) {
      await db.insert(vehiclePhotos).values({
        vehicleId: row.id,
        url: `https://placehold.co/800x600?text=${encodeURIComponent(`${v.brand} ${v.model}`)}`,
        position: 0,
      });
    }
  }

  console.log(`Seed: tenant 'demo' created with ${seedVehicles.length} vehicles.`);
  console.log("Local site: http://demo.localhost:3000");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
