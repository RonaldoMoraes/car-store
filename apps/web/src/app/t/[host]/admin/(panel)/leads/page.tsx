import { getDb, leads, vehicles } from "@paperclip/db";
import { desc, eq } from "drizzle-orm";
import { requireSession } from "@/lib/admin-auth";
import { LeadStatusBadge, LeadTypeBadge } from "@/components/admin/badges";
import { LeadActions } from "@/components/admin/lead-actions";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage({
  params,
}: {
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const { tenant } = await requireSession(host);
  const db = getDb();

  const rows = await db
    .select({ lead: leads, vehicle: vehicles })
    .from(leads)
    .leftJoin(vehicles, eq(vehicles.id, leads.vehicleId))
    .where(eq(leads.tenantId, tenant.id))
    .orderBy(desc(leads.createdAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">
        Leads ({rows.length})
      </h1>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {rows.length === 0 ? (
          <p className="p-10 text-center text-zinc-500">
            Nenhum lead recebido ainda.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {rows.map(({ lead, vehicle }) => (
              <li key={lead.id} className="space-y-2 px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <LeadTypeBadge type={lead.type} />
                  <LeadStatusBadge status={lead.status} />
                  <span className="text-xs text-zinc-400">
                    {lead.createdAt.toLocaleString("pt-BR")}
                  </span>
                  <div className="ml-auto">
                    <LeadActions leadId={lead.id} status={lead.status} />
                  </div>
                </div>

                <div className="text-sm">
                  <p className="font-medium text-zinc-900">
                    {lead.name ?? "Visitante (clique no WhatsApp)"}
                    {lead.phone && (
                      <a
                        href={`https://wa.me/55${lead.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 font-semibold text-green-700 hover:underline"
                      >
                        {lead.phone} ↗
                      </a>
                    )}
                    {lead.email && (
                      <span className="ml-2 text-zinc-500">{lead.email}</span>
                    )}
                  </p>
                  {vehicle && (
                    <p className="text-zinc-600">
                      Interesse: {vehicle.brand} {vehicle.model}{" "}
                      {vehicle.modelYear}
                    </p>
                  )}
                  {lead.message && (
                    <p className="mt-1 text-zinc-600">“{lead.message}”</p>
                  )}
                  {Object.keys(lead.payload).length > 0 && (
                    <p className="mt-1 text-xs text-zinc-500">
                      {Object.entries(lead.payload)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
