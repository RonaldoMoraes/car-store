import type { Metadata } from "next";
import { getTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sobre a loja" };

export default async function SobrePage({
  params,
}: {
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const tenant = (await getTenant(host))!;
  const mapsUrl = tenant.addressLine
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${tenant.name}, ${tenant.addressLine}, ${tenant.city ?? ""} ${tenant.state ?? ""}`,
      )}`
    : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-zinc-900">{tenant.name}</h1>
      <p className="mt-2 text-zinc-500">
        Loja em {tenant.city}
        {tenant.state ? ` — ${tenant.state}` : ""}.
      </p>

      <div className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
        {tenant.addressLine && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Endereço
            </h2>
            <p className="mt-1 text-zinc-800">
              {tenant.addressLine} — {tenant.city}/{tenant.state}
            </p>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm font-semibold hover:underline"
                style={{ color: "var(--tenant-accent)" }}
              >
                Ver no Google Maps →
              </a>
            )}
          </div>
        )}
        {tenant.phone && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Telefone
            </h2>
            <p className="mt-1 text-zinc-800">{tenant.phone}</p>
          </div>
        )}
        {tenant.email && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              E-mail
            </h2>
            <p className="mt-1 text-zinc-800">{tenant.email}</p>
          </div>
        )}
        {tenant.instagram && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Instagram
            </h2>
            <a
              href={`https://instagram.com/${tenant.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-zinc-800 hover:underline"
            >
              @{tenant.instagram}
            </a>
          </div>
        )}
        {tenant.whatsapp && (
          <a
            href={`/api/track/whatsapp?text=${encodeURIComponent(
              `Olá! Vim pelo site da ${tenant.name}.`,
            )}`}
            className="block rounded-xl bg-[#25D366] px-4 py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Falar no WhatsApp
          </a>
        )}
      </div>
    </main>
  );
}
