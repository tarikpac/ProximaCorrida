# Product Tech Stack

## Backend (`apps/api`)
- **Framework:** NestJS 11
- **Linguagem:** TypeScript
- **Database:** PostgreSQL (hospedado no Supabase)
- **ORM:** Prisma
- **Scraping:** Playwright (Headless Browser)
- **Filas/Jobs:** BullMQ (preparado para processamento em background)
- **Push Notifications:** web-push (VAPID protocol)

## Frontend (`apps/web`)
- **Framework:** Next.js 16 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** TailwindCSS v4 + Lucide React (ícones)
- **Gerenciamento de Estado/Data:** TanStack Query (React Query)
- **Testes E2E:** Playwright

## Infraestrutura
- **Containerização:** Docker & Docker Compose
- **Gerenciador de Pacotes:** npm
