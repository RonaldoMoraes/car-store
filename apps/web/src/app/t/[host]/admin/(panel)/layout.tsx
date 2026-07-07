import Link from "next/link";
import { MODULES, hasModule } from "@paperclip/core";
import { requireSession } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const { tenant, modules } = await requireSession(host);
  const canEstoque = hasModule(modules, MODULES.estoque);
  const canLeads = hasModule(modules, MODULES.leads);

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <aside className="hidden w-60 shrink-0 flex-col bg-zinc-900 text-zinc-300 sm:flex">
        <div className="border-b border-zinc-800 px-5 py-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Painel da loja
          </p>
          <p className="mt-1 font-semibold text-white">{tenant.name}</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4 text-sm">
          <Link
            href="/admin"
            className="block rounded-lg px-3 py-2 hover:bg-zinc-800 hover:text-white"
          >
            📊 Visão geral
          </Link>
          {canEstoque && (
            <>
              <Link
                href="/admin/veiculos"
                className="block rounded-lg px-3 py-2 hover:bg-zinc-800 hover:text-white"
              >
                🚗 Veículos
              </Link>
              <Link
                href="/admin/veiculos/novo"
                className="block rounded-lg px-3 py-2 hover:bg-zinc-800 hover:text-white"
              >
                ➕ Adicionar veículo
              </Link>
            </>
          )}
          {canLeads && (
            <Link
              href="/admin/leads"
              className="block rounded-lg px-3 py-2 hover:bg-zinc-800 hover:text-white"
            >
              💬 Leads
            </Link>
          )}
        </nav>
        <div className="space-y-2 border-t border-zinc-800 px-3 py-4">
          <a
            href="/"
            target="_blank"
            className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-800 hover:text-white"
          >
            ↗ Ver site
          </a>
          <form method="post" action="/api/admin/logout">
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-800 hover:text-white"
            >
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between bg-zinc-900 px-4 py-3 text-white sm:hidden">
          <span className="font-semibold">{tenant.name}</span>
          <nav className="flex gap-3 text-sm">
            <Link href="/admin">Início</Link>
            {canEstoque && <Link href="/admin/veiculos">Veículos</Link>}
            {canLeads && <Link href="/admin/leads">Leads</Link>}
          </nav>
        </div>
        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
