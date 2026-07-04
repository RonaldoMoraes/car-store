import Link from "next/link";
import type { Tenant } from "@paperclip/core";

export function SiteHeader({ tenant }: { tenant: Tenant }) {
  return (
    <header
      className="sticky top-0 z-40 text-white shadow-md"
      style={{ backgroundColor: "var(--tenant-primary)" }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          {tenant.theme.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.theme.logoUrl}
              alt={tenant.name}
              className="h-9 w-auto"
            />
          ) : (
            <span className="text-lg font-bold tracking-tight sm:text-xl">
              {tenant.name}
            </span>
          )}
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 transition-colors hover:bg-white/10"
          >
            Início
          </Link>
          <Link
            href="/estoque"
            className="rounded-lg px-3 py-2 transition-colors hover:bg-white/10"
          >
            Estoque
          </Link>
          <Link
            href="/sobre"
            className="hidden rounded-lg px-3 py-2 transition-colors hover:bg-white/10 sm:block"
          >
            A loja
          </Link>
          {tenant.whatsapp && (
            <a
              href={`/api/track/whatsapp?text=${encodeURIComponent(
                `Olá! Vim pelo site da ${tenant.name}.`,
              )}`}
              className="ml-2 rounded-lg bg-[#25D366] px-3 py-2 font-semibold text-white transition-opacity hover:opacity-90"
            >
              WhatsApp
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
