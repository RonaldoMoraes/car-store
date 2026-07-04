import { notFound } from "next/navigation";
import {
  formatPriceBRL,
  listPublishedVehicles,
  resolveTenantByHost,
  whatsappLink,
} from "@paperclip/core";

// Tenant sites read live inventory — always dynamic.
export const dynamic = "force-dynamic";

const ROOT_DOMAIN = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost:3000";

export default async function TenantHome({
  params,
}: {
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const tenant = await resolveTenantByHost(decodeURIComponent(host), ROOT_DOMAIN);
  if (!tenant) notFound();

  const vehicles = await listPublishedVehicles(tenant.id);
  const primary = tenant.theme.primaryColor ?? "#0f172a";
  const accent = tenant.theme.accentColor ?? "#dc2626";

  return (
    <div
      className="min-h-screen bg-zinc-50"
      style={
        {
          "--tenant-primary": primary,
          "--tenant-accent": accent,
        } as React.CSSProperties
      }
    >
      <header
        className="px-6 py-5 text-white"
        style={{ backgroundColor: "var(--tenant-primary)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold">{tenant.name}</h1>
          <span className="text-sm opacity-80">
            {tenant.city}
            {tenant.state ? ` · ${tenant.state}` : ""}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-semibold text-zinc-900">
          Estoque ({vehicles.length})
        </h2>

        {vehicles.length === 0 ? (
          <p className="text-zinc-500">Nenhum veículo publicado no momento.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <li
                key={v.id}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
              >
                {v.photos[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.photos[0].url}
                    alt={`${v.brand} ${v.model}`}
                    className="aspect-[4/3] w-full object-cover"
                  />
                )}
                <div className="space-y-1 p-4">
                  <h3 className="font-semibold text-zinc-900">
                    {v.brand} {v.model}{" "}
                    <span className="font-normal text-zinc-500">
                      {v.version}
                    </span>
                  </h3>
                  <p className="text-sm text-zinc-500">
                    {v.modelYear} · {v.mileageKm?.toLocaleString("pt-BR")} km ·{" "}
                    {v.transmission}
                  </p>
                  <p
                    className="text-lg font-bold"
                    style={{ color: "var(--tenant-accent)" }}
                  >
                    {formatPriceBRL(v.priceCents)}
                  </p>
                  {tenant.whatsapp && (
                    <a
                      href={whatsappLink(
                        tenant.whatsapp,
                        `Olá! Tenho interesse no ${v.brand} ${v.model} ${v.modelYear} anunciado no site.`,
                      )}
                      className="mt-2 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white"
                      style={{ backgroundColor: "#25D366" }}
                    >
                      Chamar no WhatsApp
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="border-t border-zinc-200 bg-white px-6 py-6 text-center text-sm text-zinc-500">
        {tenant.addressLine} — {tenant.city}/{tenant.state}
        {tenant.phone ? ` · ${tenant.phone}` : ""}
      </footer>
    </div>
  );
}
