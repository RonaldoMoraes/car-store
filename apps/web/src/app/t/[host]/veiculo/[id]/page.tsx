import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  formatKm,
  formatPriceBRL,
  getPublishedVehicle,
  listSimilarVehicles,
} from "@paperclip/core";
import { Gallery } from "@/components/site/gallery";
import { LeadForms } from "@/components/site/lead-forms";
import { FipeBadge } from "@/components/site/fipe-badge";
import { VehicleCard } from "@/components/site/vehicle-card";
import { getTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ host: string; id: string }>;
}): Promise<Metadata> {
  const { host, id } = await params;
  const tenant = await getTenant(host);
  if (!tenant) return {};
  const vehicle = await getPublishedVehicle(tenant.id, id);
  if (!vehicle) return {};
  return {
    title: `${vehicle.brand} ${vehicle.model} ${vehicle.version ?? ""} ${vehicle.modelYear} — ${formatPriceBRL(vehicle.priceCents)}`,
    description: `${vehicle.brand} ${vehicle.model} ${vehicle.modelYear}, ${formatKm(vehicle.mileageKm)}, ${vehicle.color ?? ""}. ${vehicle.description ?? ""}`.slice(0, 160),
  };
}

export default async function VehiclePage({
  params,
  searchParams,
}: {
  params: Promise<{ host: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { host, id } = await params;
  const sp = await searchParams;
  const tenant = (await getTenant(host))!;
  const vehicle = await getPublishedVehicle(tenant.id, id);
  if (!vehicle) notFound();

  const similar = await listSimilarVehicles(tenant.id, vehicle);
  const title = `${vehicle.brand} ${vehicle.model}`;

  const specs: Array<[string, string | null]> = [
    ["Ano", String(vehicle.modelYear)],
    ["Quilometragem", formatKm(vehicle.mileageKm)],
    ["Cor", vehicle.color],
    ["Combustível", vehicle.fuel],
    ["Câmbio", vehicle.transmission],
    ["Motor", vehicle.engine],
    ["Portas", vehicle.doors ? String(vehicle.doors) : null],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${title} ${vehicle.version ?? ""}`.trim(),
    brand: { "@type": "Brand", name: vehicle.brand },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.modelYear),
    mileageFromOdometer: vehicle.mileageKm
      ? { "@type": "QuantitativeValue", value: vehicle.mileageKm, unitCode: "KMT" }
      : undefined,
    color: vehicle.color ?? undefined,
    image: vehicle.photos.map((p) => p.url),
    offers: vehicle.priceCents
      ? {
          "@type": "Offer",
          price: vehicle.priceCents / 100,
          priceCurrency: "BRL",
          availability: "https://schema.org/InStock",
          seller: { "@type": "AutoDealer", name: tenant.name },
        }
      : undefined,
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-4 text-sm text-zinc-500">
        <a href="/estoque" className="hover:underline">
          Estoque
        </a>{" "}
        / {title}
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: gallery + specs */}
        <div className="space-y-8">
          <Gallery photos={vehicle.photos} alt={`${title} ${vehicle.modelYear}`} />

          <section>
            <h2 className="mb-3 text-lg font-semibold text-zinc-900">
              Ficha técnica
            </h2>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 sm:grid-cols-3">
              {specs
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label} className="bg-white p-3">
                    <dt className="text-xs uppercase tracking-wide text-zinc-400">
                      {label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium text-zinc-900">
                      {value}
                    </dd>
                  </div>
                ))}
            </dl>
          </section>

          {vehicle.options.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-zinc-900">
                Opcionais
              </h2>
              <div className="flex flex-wrap gap-2">
                {vehicle.options.map((o) => (
                  <span
                    key={o}
                    className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700"
                  >
                    {o}
                  </span>
                ))}
              </div>
            </section>
          )}

          {vehicle.description && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-zinc-900">
                Sobre este veículo
              </h2>
              <p className="whitespace-pre-line text-zinc-600">
                {vehicle.description}
              </p>
            </section>
          )}
        </div>

        {/* Right: price + CTAs + forms */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h1 className="text-xl font-bold text-zinc-900">
              {title}{" "}
              <span className="font-normal text-zinc-500">
                {vehicle.version}
              </span>
            </h1>
            <p className="text-sm text-zinc-500">
              {vehicle.modelYear} · {formatKm(vehicle.mileageKm)}
            </p>

            <p
              className="mt-3 text-3xl font-bold"
              style={{ color: "var(--tenant-accent)" }}
            >
              {formatPriceBRL(vehicle.priceCents)}
            </p>

            {vehicle.fipePriceCents && (
              <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
                <FipeBadge
                  priceCents={vehicle.priceCents}
                  fipePriceCents={vehicle.fipePriceCents}
                />
                <span>
                  Ref. FIPE: {formatPriceBRL(vehicle.fipePriceCents)}
                </span>
              </div>
            )}

            {tenant.whatsapp && (
              <a
                href={`/api/track/whatsapp?v=${vehicle.id}&text=${encodeURIComponent(
                  `Olá! Tenho interesse no ${title} ${vehicle.modelYear} (${formatPriceBRL(vehicle.priceCents)}) anunciado no site.`,
                )}`}
                className="mt-4 block rounded-xl bg-[#25D366] px-4 py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Chamar no WhatsApp
              </a>
            )}
            {tenant.phone && (
              <a
                href={`tel:${tenant.phone.replace(/\D/g, "")}`}
                className="mt-2 block rounded-xl border border-zinc-300 px-4 py-3 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Ligar: {tenant.phone}
              </a>
            )}
          </div>

          <LeadForms vehicleId={vehicle.id} submitted={sp.enviado === "1"} />
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold text-zinc-900">
            Você também pode gostar
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
