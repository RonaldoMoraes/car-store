import { config } from "dotenv";
config({ path: "../../.env" });

import { scryptSync, randomBytes } from "node:crypto";
import { closeDb, getDb } from "./client";
import { tenantModules } from "./schema/modules";
import { tenantDomains, tenants } from "./schema/tenants";
import { users } from "./schema/users";
import { vehiclePhotos, vehicles } from "./schema/vehicles";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `s1:${salt}:${hash}`;
}

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
      email: "contato@demoveiculos.com.br",
      city: "Itajubá",
      state: "MG",
      addressLine: "Av. Principal, 100 — Centro",
      instagram: "demoveiculos",
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

  await db.insert(users).values({
    tenantId: demo.id,
    name: "Dono Demo",
    email: "dono@demoveiculos.com.br",
    passwordHash: hashPassword("demo1234"),
    role: "owner",
  });

  // Essencial plan modules
  await db.insert(tenantModules).values(
    ["estoque", "site", "leads", "fipe", "voz"].map((module) => ({
      tenantId: demo.id,
      module,
    })),
  );

  const seedVehicles = [
    {
      brand: "Hyundai",
      model: "Creta",
      version: "2.0 Prestige",
      modelYear: 2020,
      manufactureYear: 2020,
      priceCents: 9_000_000,
      fipePriceCents: 9_350_000,
      mileageKm: 45_000,
      color: "Preto",
      fuel: "Flex",
      transmission: "Automático",
      doors: 4,
      engine: "2.0",
      options: ["Ar-condicionado", "Direção elétrica", "Vidros elétricos", "Travas elétricas", "Alarme", "Central multimídia", "Câmera de ré", "Teto solar"],
      description:
        "Creta Prestige impecável, único dono, todas as revisões em concessionária. Teto solar, bancos em couro e central multimídia.",
    },
    {
      brand: "Chevrolet",
      model: "Onix",
      version: "1.0 Turbo LTZ",
      modelYear: 2022,
      manufactureYear: 2021,
      priceCents: 7_200_000,
      fipePriceCents: 7_150_000,
      mileageKm: 28_000,
      color: "Branco",
      fuel: "Flex",
      transmission: "Manual",
      doors: 4,
      engine: "1.0",
      options: ["Ar-condicionado", "Direção elétrica", "Vidros elétricos", "MyLink"],
      description: "Onix LTZ turbo, econômico e completo. Pneus novos.",
    },
    {
      brand: "Fiat",
      model: "Toro",
      version: "Volcano 2.0 Diesel 4x4",
      modelYear: 2021,
      manufactureYear: 2021,
      priceCents: 13_900_000,
      fipePriceCents: 14_200_000,
      mileageKm: 62_000,
      color: "Cinza",
      fuel: "Diesel",
      transmission: "Automático",
      doors: 4,
      engine: "2.0",
      options: ["Ar-condicionado", "4x4", "Central multimídia", "Rodas 18\"", "Capota marítima"],
      description: "Toro Volcano diesel 4x4, revisada, pronta para o trabalho e para a estrada.",
    },
    {
      brand: "Volkswagen",
      model: "T-Cross",
      version: "1.4 TSI Highline",
      modelYear: 2023,
      manufactureYear: 2022,
      priceCents: 12_500_000,
      fipePriceCents: 12_480_000,
      mileageKm: 15_000,
      color: "Azul",
      fuel: "Flex",
      transmission: "Automático",
      doors: 4,
      engine: "1.4",
      options: ["Ar-condicionado digital", "ACC", "Teto solar", "Rodas 17\"", "Sensor de estacionamento"],
      description: "T-Cross Highline na garantia de fábrica, o SUV mais vendido da categoria.",
    },
    {
      brand: "Toyota",
      model: "Corolla",
      version: "2.0 XEi",
      modelYear: 2019,
      manufactureYear: 2019,
      priceCents: 10_800_000,
      fipePriceCents: 11_000_000,
      mileageKm: 78_000,
      color: "Prata",
      fuel: "Flex",
      transmission: "Automático",
      doors: 4,
      engine: "2.0",
      options: ["Ar-condicionado", "Bancos em couro", "Central multimídia", "Piloto automático"],
      description: "Corolla XEi, o sedã mais confiável do Brasil. Manual e chave reserva.",
    },
    {
      brand: "Jeep",
      model: "Renegade",
      version: "1.8 Longitude",
      modelYear: 2020,
      manufactureYear: 2020,
      priceCents: 8_900_000,
      fipePriceCents: 8_850_000,
      mileageKm: 51_000,
      color: "Vermelho",
      fuel: "Flex",
      transmission: "Automático",
      doors: 4,
      engine: "1.8",
      options: ["Ar-condicionado", "Central multimídia", "Rodas de liga leve"],
      description: "Renegade Longitude automático, SUV compacto ideal para a cidade.",
    },
  ];

  const palette: Record<string, string> = {
    Preto: "1f2937",
    Branco: "e5e7eb",
    Cinza: "6b7280",
    Azul: "1d4ed8",
    Prata: "9ca3af",
    Vermelho: "b91c1c",
  };

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
      const bg = palette[v.color] ?? "334155";
      await db.insert(vehiclePhotos).values(
        [0, 1, 2].map((i) => ({
          vehicleId: row.id,
          url: `https://placehold.co/1200x900/${bg}/ffffff?text=${encodeURIComponent(
            `${v.brand} ${v.model}${i > 0 ? ` · foto ${i + 1}` : ""}`,
          )}`,
          position: i,
        })),
      );
    }
  }

  console.log(`Seed: tenant 'demo' created with ${seedVehicles.length} vehicles.`);
  console.log("Site:  http://demo.localhost:3000");
  console.log("Admin: http://demo.localhost:3000/admin (dono@demoveiculos.com.br / demo1234)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
