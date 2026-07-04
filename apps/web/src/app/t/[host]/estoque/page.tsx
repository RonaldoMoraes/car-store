import type { Metadata } from "next";
import { listBrandsInStock, listPublishedVehicles } from "@paperclip/core";
import { VehicleCard } from "@/components/site/vehicle-card";
import { getTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Estoque" };

const PRICE_STEPS = [30_000, 50_000, 80_000, 120_000, 200_000, 300_000];

export default async function EstoquePage({
  params,
  searchParams,
}: {
  params: Promise<{ host: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { host } = await params;
  const sp = await searchParams;
  const tenant = (await getTenant(host))!;

  const str = (v: string | string[] | undefined) =>
    typeof v === "string" && v !== "" ? v : undefined;
  const num = (v: string | string[] | undefined) => {
    const s = str(v);
    return s && !Number.isNaN(Number(s)) ? Number(s) : undefined;
  };

  const filters = {
    q: str(sp.busca),
    brand: str(sp.marca),
    yearMin: num(sp.anoMin),
    yearMax: num(sp.anoMax),
    priceMaxCents: num(sp.precoMax) ? num(sp.precoMax)! * 100 : undefined,
  };

  const [vehicles, brands] = await Promise.all([
    listPublishedVehicles(tenant.id, filters),
    listBrandsInStock(tenant.id),
  ]);

  const currentYear = new Date().getFullYear() + 1;
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);
  const selectClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900";
  const hasFilters = Object.values(filters).some((v) => v !== undefined);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-zinc-900">Estoque</h1>
      <p className="mt-1 text-zinc-500">
        {vehicles.length} veículo{vehicles.length === 1 ? "" : "s"}
        {hasFilters ? " encontrados com os filtros" : " disponíveis"}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        {/* Filters */}
        <aside>
          <form
            method="get"
            className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 lg:sticky lg:top-20"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Buscar
              </label>
              <input
                name="busca"
                defaultValue={filters.q ?? ""}
                placeholder="Modelo, marca…"
                className={selectClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Marca
              </label>
              <select name="marca" defaultValue={filters.brand ?? ""} className={selectClass}>
                <option value="">Todas</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Ano de
                </label>
                <select name="anoMin" defaultValue={filters.yearMin ?? ""} className={selectClass}>
                  <option value="">—</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  até
                </label>
                <select name="anoMax" defaultValue={filters.yearMax ?? ""} className={selectClass}>
                  <option value="">—</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Preço até
              </label>
              <select
                name="precoMax"
                defaultValue={
                  filters.priceMaxCents ? filters.priceMaxCents / 100 : ""
                }
                className={selectClass}
              >
                <option value="">Sem limite</option>
                {PRICE_STEPS.map((p) => (
                  <option key={p} value={p}>
                    R$ {p.toLocaleString("pt-BR")}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--tenant-accent)" }}
              >
                Filtrar
              </button>
              {hasFilters && (
                <a
                  href="/estoque"
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Limpar
                </a>
              )}
            </div>
          </form>
        </aside>

        {/* Grid */}
        <div>
          {vehicles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500">
              Nenhum veículo encontrado com esses filtros.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
