import Link from "next/link";
import type { Tenant } from "@paperclip/core";

export function SiteFooter({ tenant }: { tenant: Tenant }) {
  return (
    <footer
      className="mt-16 text-white"
      style={{ backgroundColor: "var(--tenant-primary)" }}
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <h3 className="text-lg font-bold">{tenant.name}</h3>
          <p className="mt-2 text-sm text-white/70">
            {tenant.addressLine}
            <br />
            {tenant.city}
            {tenant.state ? ` — ${tenant.state}` : ""}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white/60">
            Contato
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            {tenant.phone && <li>{tenant.phone}</li>}
            {tenant.email && <li>{tenant.email}</li>}
            {tenant.instagram && (
              <li>
                <a
                  href={`https://instagram.com/${tenant.instagram}`}
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{tenant.instagram}
                </a>
              </li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white/60">
            Navegação
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>
              <Link href="/estoque" className="hover:underline">
                Estoque completo
              </Link>
            </li>
            <li>
              <Link href="/sobre" className="hover:underline">
                Sobre a loja
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/50">
        Preços de referência: Tabela FIPE. Ao enviar seus dados pelos formulários
        você concorda com o uso deles para contato sobre sua solicitação (LGPD).
      </div>
    </footer>
  );
}
