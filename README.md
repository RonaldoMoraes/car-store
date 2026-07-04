# Paperclip Car Store

White-label platform for Brazilian car dealerships: branded dealership websites + native B2B inventory app, powered by one multi-tenant inventory API with Tabela FIPE integration.

## Structure

```
apps/
  web/        Next.js 16 — multi-tenant dealership sites (tenant resolved by hostname)
packages/
  db/         Drizzle ORM schema + migrations (Postgres)
  core/       Domain logic: tenants, inventory, leads
  fipe/       FIPE crawler + immutable fetch-through cache
```

## Getting started

```bash
pnpm install
cp .env.example .env
docker compose up -d          # local Postgres on :5433
pnpm db:migrate               # apply migrations
pnpm db:seed                  # demo tenant + vehicles
pnpm fipe:crawl               # cache FIPE brands+models (~1 min, polite pacing)
pnpm dev                      # web on :3000
```

- Platform landing: http://localhost:3000
- Demo dealership site: http://demo.localhost:3000

## How multi-tenancy works

`apps/web/src/proxy.ts` rewrites any non-root hostname to `/t/<host>`; the tenant is resolved from the DB by subdomain slug (`{slug}.<root>`) or custom domain (`tenant_domains`). Branding is per-tenant data (`tenants.theme`) applied over shared templates — never code forks.

## FIPE cache

Immutable mirror of the FIPE lookup hierarchy (reference month → type → brand → model → year → price), filled by `pnpm fipe:crawl` (months/brands/models) and lazily via fetch-through on first request (years/prices). Same params never change at FIPE, so cached rows are never invalidated.
