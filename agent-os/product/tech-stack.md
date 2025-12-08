# Product Tech Stack

## Backend (`apps/api`)
- **Framework:** NestJS 11
- **Runtime:** Node.js 20 (AWS Lambda)
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

### API (AWS Lambda)
- **Runtime:** AWS Lambda (Node 20) + API Gateway (HTTP API)
- **Modelo:** Serverless, scale-to-zero, pay-per-use
- **Região:** sa-east-1 (São Paulo)
- **URL:** `https://7smmzptkgk.execute-api.sa-east-1.amazonaws.com/`
- **Adaptador:** `@vendia/serverless-express` para NestJS
- **Secrets:** AWS SSM Parameter Store (DATABASE_URL, VAPID keys)
- **Logging:** CloudWatch
- **Deploy Tool:** Serverless Framework v3

### Frontend (Vercel)
- **Plataforma:** Vercel
- **URL:** `https://proxima-corrida.vercel.app/`
- **Framework:** Next.js com Edge Functions

### Database (Supabase)
- **Tipo:** PostgreSQL gerenciado
- **Conexão:** Via Prisma com connection pooling

### Scraper (GitHub Actions)
- **Execução:** Cron diário via GitHub Actions workflow
- **Engine:** Playwright headless
- **Fluxo:** Standalone script → escrita direta no Supabase
- **Código:** `scripts/scraper/`

## Arquitetura Removida (Lambda Optimization)

Para otimizar o tamanho do pacote Lambda (< 250MB), foram removidos:

- ❌ **BullMQ** — Push notifications agora são inline (síncronas)
- ❌ **Redis** — Não há mais dependência de fila/cache
- ❌ **Playwright na API** — Scraper roda em GitHub Actions
- ❌ **ScheduleModule** — Cron jobs via GitHub Actions

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUÇÃO                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │   Vercel     │───▶│   API Gateway    │───▶│   Lambda     │  │
│  │   Frontend   │    │   (HTTP API)     │    │   (NestJS)   │  │
│  │   Next.js    │    │                  │    │              │  │
│  └──────────────┘    └──────────────────┘    └──────┬───────┘  │
│                                                      │          │
│                                                      ▼          │
│                                               ┌──────────────┐  │
│                                               │   Supabase   │  │
│                                               │   Postgres   │  │
│                                               └──────┬───────┘  │
│                                                      ▲          │
│  ┌──────────────────────────────────────────────────┘          │
│  │                                                              │
│  │  ┌──────────────────┐                                       │
│  └──│   GitHub Actions │                                       │
│     │   Scraper Cron   │                                       │
│     │   (Playwright)   │                                       │
│     └──────────────────┘                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
