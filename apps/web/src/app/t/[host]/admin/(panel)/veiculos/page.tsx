import Link from "next/link";
import {
  MODULES,
  formatKm,
  formatPriceBRL,
  listTenantVehicles,
} from "@paperclip/core";
import { requireModule } from "@/lib/admin-auth";
import { VehicleStatusBadge } from "@/components/admin/badges";

export const dynamic = "force-dynamic";

export default async function AdminVehiclesPage({
  params,
}: {
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const { tenant } = await requireModule(host, MODULES.estoque);
  const vehicles = await listTenantVehicles(tenant.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900">
          Veículos ({vehicles.length})
        </h1>
        <Link
          href="/admin/veiculos/novo"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
        >
          + Adicionar veículo
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {vehicles.length === 0 ? (
          <div className="p-10 text-center text-zinc-500">
            <p className="font-medium">Nenhum veículo cadastrado.</p>
            <p className="mt-1 text-sm">
              Comece adicionando o primeiro carro do seu estoque.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {vehicles.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/admin/veiculos/${v.id}`}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-50 sm:px-5"
                >
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                    {v.photos[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.photos[0].url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-zinc-900">
                      {v.brand} {v.model}{" "}
                      <span className="font-normal text-zinc-500">
                        {v.version}
                      </span>
                    </p>
                    <p className="text-sm text-zinc-500">
                      {v.modelYear} · {formatKm(v.mileageKm)} ·{" "}
                      {formatPriceBRL(v.priceCents)}
                    </p>
                  </div>
                  <VehicleStatusBadge status={v.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
