export function formatBRL(cents: number | null | undefined): string {
  if (cents == null) return "Consulte";
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
}

export function formatKm(km: number | null | undefined): string {
  if (km == null) return "—";
  return `${km.toLocaleString("pt-BR")} km`;
}

export const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  reserved: "Reservado",
  sold: "Vendido",
};

export const STATUS_COLOR: Record<string, string> = {
  draft: "#d97706",
  published: "#059669",
  reserved: "#0284c7",
  sold: "#71717a",
};

export const LEAD_TYPE_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  form: "Mensagem",
  call: "Ligação",
  financing: "Financiamento",
  trade_in: "Troca",
};
