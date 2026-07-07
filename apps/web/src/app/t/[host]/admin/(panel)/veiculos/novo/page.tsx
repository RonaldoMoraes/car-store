import { MODULES } from "@paperclip/core";
import { requireModule } from "@/lib/admin-auth";
import { VehicleForm } from "@/components/admin/vehicle-form";

export const dynamic = "force-dynamic";

export default async function NewVehiclePage({
  params,
}: {
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const { modules } = await requireModule(host, MODULES.estoque);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Adicionar veículo</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Fale o carro no microfone, busque na FIPE ou preencha manualmente —
          revise e salve.
        </p>
      </div>
      <VehicleForm modules={modules} />
    </div>
  );
}
