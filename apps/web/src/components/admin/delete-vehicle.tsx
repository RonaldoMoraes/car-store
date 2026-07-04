"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteVehicleButton({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    const r = await fetch(`/api/admin/vehicles/${vehicleId}`, {
      method: "DELETE",
    });
    setBusy(false);
    if (r.ok) {
      router.push("/admin/veiculos");
      router.refresh();
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Excluir
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-600">Excluir de vez?</span>
      <button
        type="button"
        disabled={busy}
        onClick={() => void remove()}
        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        {busy ? "Excluindo…" : "Sim, excluir"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600"
      >
        Cancelar
      </button>
    </div>
  );
}
