const VEHICLE_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Rascunho", cls: "bg-amber-100 text-amber-800" },
  published: { label: "Publicado", cls: "bg-emerald-100 text-emerald-800" },
  reserved: { label: "Reservado", cls: "bg-sky-100 text-sky-800" },
  sold: { label: "Vendido", cls: "bg-zinc-200 text-zinc-600" },
};

export function VehicleStatusBadge({ status }: { status: string }) {
  const s = VEHICLE_STATUS[status] ?? VEHICLE_STATUS.draft!;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

const LEAD_TYPES: Record<string, { label: string; cls: string }> = {
  whatsapp: { label: "WhatsApp", cls: "bg-green-100 text-green-800" },
  form: { label: "Mensagem", cls: "bg-blue-100 text-blue-800" },
  call: { label: "Ligação", cls: "bg-purple-100 text-purple-800" },
  financing: { label: "Financiamento", cls: "bg-orange-100 text-orange-800" },
  trade_in: { label: "Troca", cls: "bg-pink-100 text-pink-800" },
};

export function LeadTypeBadge({ type }: { type: string }) {
  const t = LEAD_TYPES[type] ?? LEAD_TYPES.form!;
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${t.cls}`}>
      {t.label}
    </span>
  );
}

const LEAD_STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "Novo", cls: "bg-red-100 text-red-800" },
  contacted: { label: "Em contato", cls: "bg-amber-100 text-amber-800" },
  closed: { label: "Fechado", cls: "bg-zinc-200 text-zinc-600" },
};

export function LeadStatusBadge({ status }: { status: string }) {
  const s = LEAD_STATUS[status] ?? LEAD_STATUS.new!;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}
