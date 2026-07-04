import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { getTenant } from "@/lib/tenant";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ host: string }>;
}): Promise<Metadata> {
  const { host } = await params;
  const tenant = await getTenant(host);
  if (!tenant) return {};
  const title = `${tenant.name} — Seminovos em ${tenant.city ?? "sua cidade"}`;
  return {
    title: { default: title, template: `%s | ${tenant.name}` },
    description: `Carros novos e seminovos com preço de referência FIPE em ${tenant.city ?? ""}. Fale direto no WhatsApp com a ${tenant.name}.`,
  };
}

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const tenant = await getTenant(host);
  if (!tenant) notFound();

  return (
    <div
      className="flex min-h-screen flex-col bg-zinc-50"
      style={
        {
          "--tenant-primary": tenant.theme.primaryColor ?? "#0f172a",
          "--tenant-accent": tenant.theme.accentColor ?? "#dc2626",
        } as React.CSSProperties
      }
    >
      <SiteHeader tenant={tenant} />
      <div className="flex-1">{children}</div>
      <SiteFooter tenant={tenant} />
    </div>
  );
}
