// The trust anchor nobody else in the region shows (teardown 2026-07-04):
// how the asking price sits against the Tabela FIPE reference.
export function FipeBadge({
  priceCents,
  fipePriceCents,
  className = "",
}: {
  priceCents: number | null;
  fipePriceCents: number | null;
  className?: string;
}) {
  if (!priceCents || !fipePriceCents) return null;
  const deltaPct = ((priceCents - fipePriceCents) / fipePriceCents) * 100;

  let label: string;
  let tone: string;
  if (deltaPct <= -2) {
    label = `${Math.abs(deltaPct).toFixed(0)}% abaixo da FIPE`;
    tone = "bg-emerald-600";
  } else if (deltaPct < 2) {
    label = "Preço FIPE";
    tone = "bg-sky-600";
  } else {
    return null; // above reference — say nothing, never mislead
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow ${tone} ${className}`}
    >
      {label}
    </span>
  );
}
