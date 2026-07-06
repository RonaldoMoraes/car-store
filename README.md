# Paperclip Car Store

White-label platform for Brazilian car dealerships: branded dealership websites + inventory management with voice-first car entry, powered by one multi-tenant API with Tabela FIPE integration.

## Structure

```
apps/
  web/        Next.js 16 — multi-tenant dealership sites + dealer back-office (/admin)
  mobile/     Expo (React Native) — white-label B2B dealer app (one binary, themed at login)
packages/
  db/         Drizzle ORM schema + migrations (Postgres)
  core/       Domain logic: tenants, inventory, leads, auth
  fipe/       FIPE crawler + immutable fetch-through cache + voice parser
```

## Getting started

```bash
pnpm install
cp .env.example .env          # then set AUTH_SECRET (openssl rand -hex 32)
docker compose up -d          # local Postgres on :5433
pnpm db:migrate               # apply migrations
pnpm db:seed                  # demo tenant + vehicles + owner user
pnpm fipe:crawl               # cache FIPE brands+models (~1 min, polite pacing)
pnpm dev                      # web on :3000
```

- Platform landing: http://localhost:3000
- Demo dealership site: http://demo.localhost:3000
- Dealer back-office: http://demo.localhost:3000/admin — `dono@demoveiculos.com.br` / `demo1234`

## What the MVP does

**Buyer-facing site (per dealership, white-label):** themed home + hero, estoque with filters (busca/marca/ano/preço), vehicle pages with gallery, ficha técnica, options, **FIPE reference badge** ("X% abaixo da FIPE"), schema.org Car/Offer JSON-LD, and lead capture: WhatsApp CTAs with vehicle context (tracked), contact / financing / trade-in forms with LGPD consent.

**Dealer back-office (`/admin`):** session auth, dashboard, inventory CRUD with status workflow (rascunho → publicado → reservado/vendido), photo uploads, lead inbox (novo → em contato → fechado, WhatsApp reply links), and two assisted ways to add a car:

- **Voice** — tap 🎤 and say _"Adicionar um Creta 2020 preto 2.0 Prestige completo por 90 mil reais"_: on-device pt-BR speech-to-text → heuristic parser + FIPE reverse model lookup → pre-filled form (brand inferred from model, FIPE price fetched, "completo" expanded to the standard options set). Dealer reviews and saves — voice never publishes on its own.
- **FIPE cascade** — marca → modelo (type-ahead) → ano → price + specs autofill.

## Mobile app (B2B, dealer-facing)

```bash
cd apps/mobile
EXPO_PUBLIC_API_URL=http://<your-lan-ip>:3000 pnpm start   # scan QR with Expo Go
```

One shared binary for all dealerships — the app fetches the tenant's theme at login (`/api/mobile/login`, bearer token, 30-day session). Screens: estoque (pull-to-refresh, status badges, offline-draft retry queue), add/edit vehicle (voice/text command → same voice-parse endpoint → pre-filled ficha + FIPE match; camera/gallery photo upload; options chips), and lead inbox (WhatsApp reply deep links, status workflow). Saves that fail offline are queued in AsyncStorage and re-sent from the estoque screen.

## How multi-tenancy works

`apps/web/src/proxy.ts` rewrites any non-root hostname to `/t/<host>`; the tenant is resolved by subdomain slug (`{slug}.<root>`) or custom domain (`tenant_domains`). Branding is per-tenant data (`tenants.theme`) applied over shared templates — never code forks.

## FIPE cache

Immutable mirror of the FIPE lookup hierarchy (reference month → type → brand → model → year → price), pre-warmed by `pnpm fipe:crawl` (months/brands/models) and lazily filled via fetch-through on first request (years/prices). Same params never change at FIPE, so cached rows are never invalidated. A reverse model-name index powers the voice flow's brand inference.
