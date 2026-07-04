import { notFound } from "next/navigation";
import { getTenantVehicle } from "@paperclip/core";
import { requireSession } from "@/lib/admin-auth";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { DeleteVehicleButton } from "@/components/admin/delete-vehicle";

export const dynamic = "force-dynamic";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ host: string; id: string }>;
}) {
  const { host, id } = await params;
  const { tenant } = await requireSession(host);
  const vehicle = await getTenantVehicle(tenant.id, id);
  if (!vehicle) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            {vehicle.brand} {vehicle.model} {vehicle.modelYear}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Editar veículo</p>
        </div>
        <DeleteVehicleButton vehicleId={vehicle.id} />
      </div>
      <VehicleForm
        initial={{
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          version: vehicle.version ?? undefined,
          modelYear: vehicle.modelYear,
          priceCents: vehicle.priceCents ?? undefined,
          mileageKm: vehicle.mileageKm ?? undefined,
          color: vehicle.color ?? undefined,
          fuel: vehicle.fuel ?? undefined,
          transmission: vehicle.transmission ?? undefined,
          doors: vehicle.doors ?? undefined,
          engine: vehicle.engine ?? undefined,
          plate: vehicle.plate ?? undefined,
          options: vehicle.options,
          description: vehicle.description ?? undefined,
          status: vehicle.status,
          fipeCode: vehicle.fipeCode ?? undefined,
          fipeReferenceCode: vehicle.fipeReferenceCode ?? undefined,
          fipePriceCents: vehicle.fipePriceCents ?? undefined,
          photoUrls: vehicle.photos.map((p) => p.url),
        }}
      />
    </div>
  );
}
