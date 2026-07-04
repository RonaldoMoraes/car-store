"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LeadActions({
  leadId,
  status,
}: {
  leadId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: string) {
    setBusy(true);
    await fetch(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex gap-1.5">
      {status === "new" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => setStatus("contacted")}
          className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          Marcar em contato
        </button>
      )}
      {status !== "closed" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => setStatus("closed")}
          className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          Fechar
        </button>
      )}
    </div>
  );
}
