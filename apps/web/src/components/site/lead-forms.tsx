"use client";

import { useState } from "react";

const TABS = [
  { key: "form", label: "Tenho interesse" },
  { key: "financing", label: "Financiamento" },
  { key: "trade_in", label: "Troca" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none";

function CommonFields() {
  return (
    <>
      <input name="name" required placeholder="Seu nome" className={inputClass} />
      <input
        name="phone"
        required
        placeholder="Telefone / WhatsApp"
        className={inputClass}
      />
      <input
        name="email"
        type="email"
        placeholder="E-mail (opcional)"
        className={inputClass}
      />
    </>
  );
}

function Consent() {
  return (
    <label className="flex items-start gap-2 text-xs text-zinc-500">
      <input type="checkbox" name="consent" required className="mt-0.5" />
      <span>
        Autorizo o uso dos meus dados para contato sobre esta solicitação
        (LGPD).
      </span>
    </label>
  );
}

export function LeadForms({
  vehicleId,
  submitted,
}: {
  vehicleId: string;
  submitted?: boolean;
}) {
  const [tab, setTab] = useState<TabKey>("form");

  return (
    <div id="contato" className="rounded-2xl border border-zinc-200 bg-white p-5">
      {submitted && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          ✓ Recebemos seus dados! A loja vai falar com você em breve.
        </div>
      )}

      <div className="mb-4 flex gap-1 rounded-xl bg-zinc-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "form" && (
        <form method="post" action="/api/leads" className="space-y-3">
          <input type="hidden" name="type" value="form" />
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <CommonFields />
          <textarea
            name="message"
            rows={3}
            placeholder="Sua mensagem"
            className={inputClass}
          />
          <Consent />
          <SubmitButton>Enviar mensagem</SubmitButton>
        </form>
      )}

      {tab === "financing" && (
        <form method="post" action="/api/leads" className="space-y-3">
          <input type="hidden" name="type" value="financing" />
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <CommonFields />
          <input
            name="downPayment"
            placeholder="Valor de entrada (R$)"
            className={inputClass}
          />
          <select name="installments" className={inputClass} defaultValue="48">
            {[12, 24, 36, 48, 60].map((n) => (
              <option key={n} value={n}>
                {n}x
              </option>
            ))}
          </select>
          <Consent />
          <SubmitButton>Simular financiamento</SubmitButton>
        </form>
      )}

      {tab === "trade_in" && (
        <form method="post" action="/api/leads" className="space-y-3">
          <input type="hidden" name="type" value="trade_in" />
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <CommonFields />
          <input
            name="tradeInVehicle"
            required
            placeholder="Seu carro (marca, modelo, ano)"
            className={inputClass}
          />
          <input
            name="tradeInKm"
            placeholder="Quilometragem"
            className={inputClass}
          />
          <Consent />
          <SubmitButton>Avaliar troca</SubmitButton>
        </form>
      )}
    </div>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      style={{ backgroundColor: "var(--tenant-accent)" }}
    >
      {children}
    </button>
  );
}
