# Product Tech Stack

## Backend (`apps/api`)
- **Framework:** NestJS 11
- **Runtime:** Node.js 20 (Koyeb - always-on container)
- **Linguagem:** TypeScript
- **Database:** PostgreSQL (hospedado no Supabase)
- **ORM:** Prisma
- **Push Notifications:** web-push (VAPID protocol) — enviadas inline/sync

## Frontend (`apps/web`)
- **Framework:** Next.js 16 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** TailwindCSS v4 + Lucide React (ícones)
- **Gerenciamento de Estado/Data:** TanStack Query (React Query)
- **Testes E2E:** Playwright

## Infraestrutura (Dev)
- **Containerização:** Docker & Docker Compose
- **Gerenciador de Pacotes:** npm

## Hosting & Deploy (Produção)

### API (Koyeb)
- **Plataforma:** Koyeb (container always-on, free tier)
- **Runtime:** Node.js 20 (Alpine Linux container)
- **Modelo:** Always-on instance (sem cold starts)
- **Região:** Washington DC (was)
- **URL:** `https://sensible-amalita-proximacorrida-fd8a53f4.koyeb.app`
- **Deploy:** Docker (via Dockerfile.koyeb)
- **Secrets:** Environment Variables no painel Koyeb
- **Logging:** Koyeb Dashboard

### Frontend (Vercel)
- **Plataforma:** Vercel
- **URL:** `https://proxima-corrida.vercel.app/`
- **Framework:** Next.js com Edge Functions

### Database (Supabase)
- **Tipo:** PostgreSQL gerenciado
- **Região:** sa-east-1 (São Paulo)
- **Conexão:** Via Prisma com connection pooling

### Scraper (GitHub Actions)
- **Execução:** Cron diário via GitHub Actions workflow
- **Engine:** Playwright headless
- **Fluxo:** Standalone script → escrita direta no Supabase
- **Código:** `scripts/scraper/`

## Arquitetura Simplificada (Koyeb Migration)

Após migração do AWS Lambda para Koyeb, removidos:

- ❌ **AWS Lambda** — Substituído por Koyeb container
- ❌ **API Gateway** — Koyeb fornece URL direta
- ❌ **SSM Parameter Store** — Env vars diretamente no Koyeb
- ❌ **Serverless Framework** — Deploy via Docker
- ❌ **BullMQ** — Push notifications são inline (síncronas)
- ❌ **Redis** — Não há dependência de fila/cache
- ❌ **Playwright na API** — Scraper roda em GitHub Actions

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUÇÃO                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                          ┌──────────────┐     │
│  │   Vercel     │─────────────────────────▶│   Koyeb      │     │
│  │   Frontend   │                          │   (NestJS)   │     │
│  │   Next.js    │                          │   Always-On  │     │
│  └──────────────┘                          └──────┬───────┘     │
│                                                    │             │
│                                                    ▼             │
│                                             ┌──────────────┐    │
│                                             │   Supabase   │    │
│                                             │   Postgres   │    │
│                                             └──────┬───────┘    │
│                                                    ▲             │
│  ┌─────────────────────────────────────────────────┘            │
│  │                                                               │
│  │  ┌──────────────────┐                                        │
│  └──│   GitHub Actions │                                        │
│     │   Scraper Cron   │                                        │
│     │   (Playwright)   │                                        │
│     └──────────────────┘                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Custos

| Serviço | Custo |
|---------|-------|
| Koyeb API | $0/mês (free tier) |
| Vercel Frontend | $0/mês (hobby) |
| Supabase Database | $0/mês (free tier) |
| GitHub Actions | $0/mês (public repo) |
| **Total** | **$0/mês** |
