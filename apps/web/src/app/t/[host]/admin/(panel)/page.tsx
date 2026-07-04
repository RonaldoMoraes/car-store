import Link from "next/link";
import { getDb, leads, vehicles } from "@paperclip/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { requireSession } from "@/lib/admin-auth";
import { LeadTypeBadge } from "@/components/admin/badges";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const { tenant } = await requireSession(host);
  const db = getDb();

  const count = async (where: ReturnType<typeof and>) => {
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(vehicles)
      .where(where);
    return row?.n ?? 0;
  };

  const [published, drafts, sold, newLeads, latestLeads] = await Promise.all([
    count(and(eq(vehicles.tenantId, tenant.id), eq(vehicles.status, "published"))),
    count(and(eq(vehicles.tenantId, tenant.id), eq(vehicles.status, "draft"))),
    count(and(eq(vehicles.tenantId, tenant.id), eq(vehicles.status, "sold"))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(leads)
      .where(and(eq(leads.tenantId, tenant.id), eq(leads.status, "new")))
      .then((r) => r[0]?.n ?? 0),
    db
      .select()
      .from(leads)
      .where(eq(leads.tenantId, tenant.id))
      .orderBy(desc(leads.createdAt))
      .limit(5),
  ]);

  const cards = [
    { label: "Publicados", value: published, href: "/admin/veiculos" },
    { label: "Rascunhos", value: drafts, href: "/admin/veiculos" },
    { label: "Vendidos", value: sold, href: "/admin/veiculos" },
    { label: "Leads novos", value: newLeads, href: "/admin/leads" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900">Visão geral</h1>
        <Link
          href="/admin/veiculos/novo"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
        >
          + Adicionar veículo
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <p className="text-sm text-zinc-500">{c.label}</p>
            <p className="mt-1 text-3xl font-bold text-zinc-900">{c.value}</p>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">
            Últimos leads
          </h2>
          <Link
            href="/admin/leads"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
          >
            Ver todos →
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {latestLeads.length === 0 ? (
            <p className="p-6 text-sm text-zinc-500">
              Nenhum lead ainda — eles aparecem aqui quando alguém entra em
              contato pelo site.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {latestLeads.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                  <LeadTypeBadge type={l.type} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {l.name ?? "Clique no WhatsApp"}
                      {l.phone ? ` · ${l.phone}` : ""}
                    </p>
                    {l.message && (
                      <p className="truncate text-xs text-zinc-500">
                        {l.message}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-zinc-400">
                    {l.createdAt.toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
