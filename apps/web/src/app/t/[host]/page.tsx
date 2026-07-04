import Link from "next/link";
import {
  countPublishedVehicles,
  listBrandsInStock,
  listPublishedVehicles,
} from "@paperclip/core";
import { VehicleCard } from "@/components/site/vehicle-card";
import { getTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function TenantHome({
  params,
}: {
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const tenant = (await getTenant(host))!;
  const [featured, total, brands] = await Promise.all([
    listPublishedVehicles(tenant.id, {}, 6),
    countPublishedVehicles(tenant.id),
    listBrandsInStock(tenant.id),
  ]);

  return (
    <main>
      {/* Hero */}
      <section
        className="px-4 py-16 text-white sm:px-6 sm:py-24"
        style={{
          background:
            "linear-gradient(135deg, var(--tenant-primary), color-mix(in srgb, var(--tenant-primary) 70%, black))",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
            Seu próximo carro está aqui.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/75">
            {total} veículos em estoque, com preço comparado à Tabela FIPE e
            atendimento direto no WhatsApp.
          </p>

          <form
            action="/estoque"
            className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
          >
            <select
              name="marca"
              className="flex-1 rounded-xl border-0 bg-white px-4 py-3 text-sm text-zinc-900"
              defaultValue=""
            >
              <option value="">Todas as marcas</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--tenant-accent)" }}
            >
              Ver estoque
            </button>
          </form>

          <div className="mt-8 flex flex-wrap gap-2 text-xs font-medium text-white/80">
            <span className="rounded-full bg-white/10 px-3 py-1.5">
              ✓ Referência Tabela FIPE
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1.5">
              ✓ Atendimento no WhatsApp
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1.5">
              ✓ {tenant.city ?? "Loja física"}
              {tenant.state ? ` — ${tenant.state}` : ""}
            </span>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-zinc-900">
            Últimas novidades
          </h2>
          <Link
            href="/estoque"
            className="text-sm font-semibold hover:underline"
            style={{ color: "var(--tenant-accent)" }}
          >
            Ver todos →
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="text-zinc-500">Nenhum veículo publicado no momento.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
