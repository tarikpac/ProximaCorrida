# Spec Requirements: Scraper as External Job (GitHub Actions)

## Initial Description
Extract scraper from Nest/HTTP to standalone Playwright script that writes directly to Supabase. Use GitHub Actions daily cron as default (zero cost). Configure workflow with secrets (DATABASE_URL, DIRECT_URL, REDIS_URL, VAPID). Trigger notifications inline or via dedicated endpoint. Fallback: Cloud Run Job + Cloud Scheduler if lower latency/controlled region needed.

## Requirements Discussion

### First Round Questions

**Q1:** Estou assumindo que o script standalone deve ser criado em um novo diretório na raiz do monorepo (ex: `scripts/scraper/` ou `jobs/scraper/`). Isso está correto, ou prefere manter dentro de `apps/api/src/scraper/` com um entrypoint separado?

**Answer:** Preferência: diretório dedicado na raiz (ex: `scripts/scraper/` ou `jobs/scraper/`) com entrypoint claro e isolamento de deps. Manter referências utilitárias em `apps/api/src/scraper/` apenas se reaproveitar lógica; mas o entrypoint do job deve ser independente do Nest.

**Q2:** O scraper atual usa `@nestjs/bullmq` para enfileirar jobs. No script standalone, qual abordagem prefere: (A) Processar todos os 27 estados sequencialmente, (B) 27 workflows separados, ou (C) Matriz do GitHub Actions para paralelizar?

**Answer:** Sugestão: matriz do GitHub Actions (Opção C) com batch controlado, não 27 workflows separados. Ex.: matrix com 4–6 shards de estados para paralelizar sem sobrecarregar fonte nem estourar limites. Se quisermos máxima simplicidade, começar sequencial (Opção A) e só habilitar matriz se o tempo de execução for problema.

**Q3:** Para as notificações push, qual abordagem prefere: (A) O script chamará um endpoint da API existente ou (B) Implementar envio de push inline no próprio script?

**Answer:** Preferência: chamar endpoint existente da API (Opção A) para disparar notificações, mantendo a lógica centralizada. Inline (Opção B) só se a API não puder expor endpoint seguro ou se quisermos zero dependência de API durante a janela de manutenção; mas isso exige VAPID no workflow.

**Q4:** Para conexão com Supabase/Postgres no GitHub Actions, precisa de `REDIS_URL` também (para BullMQ) ou podemos eliminar a dependência de Redis neste script?

**Answer:** Prisma Client direto com `DATABASE_URL` (R/W) e `DIRECT_URL` (migrations/long-lived). Não usar Redis/BullMQ no script: eliminar a dependência no job externo. Apenas Postgres/Supabase + chamadas HTTP para notificações, se aplicável.

**Q5:** Sobre o scheduling, qual horário prefere para o cron do GitHub Actions? Há necessidade de execuções mais frequentes?

**Answer:** 1x/dia é suficiente inicialmente. Horário sugerido: 06:00 UTC (03:00 BRT) ou similar janela off-peak. Só aumentar frequência se houver demanda de frescor > diário.

**Q6:** O fallback para Cloud Run Job + Cloud Scheduler mencionado no roadmap: isso deve ser implementado agora ou documentado como opção futura?

**Answer:** Documentar como opção futura; não implementar agora. Implementar apenas se cron do GH Actions não atender (latência/região/quotas).

**Q7:** O que deve estar fora de escopo nesta spec?

**Answer:** 
- Não alterar schema do banco.
- Não alterar frontend.
- Alterações na API apenas para um endpoint de notificação (se necessário) e ajustes mínimos de configuração; nada estrutural.
- Não reescrever a lógica de extração além do necessário para rodar standalone.

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Scraper Logic - Path: `apps/api/src/scraper/scrapers/corridas-emaratonas.scraper.ts`
- Feature: Scraper Config - Path: `apps/api/src/scraper/scraper-config.service.ts`
- Feature: Database Schema - Path: `apps/api/prisma/schema.prisma`
- Feature: Events Service (upsert logic) - Path: `apps/api/src/events/events.service.ts`
- Feature: Base Scraper Interface - Path: `apps/api/src/scraper/scrapers/base.scraper.ts`
- Feature: Standardized Event Interface - Path: `apps/api/src/scraper/interfaces/standardized-event.interface.ts`

### Follow-up Questions
None needed - answers were comprehensive.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A - This is an infrastructure/backend feature with no UI components.

## Requirements Summary

### Functional Requirements
- Create standalone TypeScript script for scraping (independent of NestJS)
- Script must write directly to Supabase/Postgres via Prisma Client
- Implement GitHub Actions workflow with daily cron schedule (06:00 UTC)
- Script processes all 27 Brazilian states
- Trigger push notifications via API endpoint call (not inline)
- Reuse existing scraping logic from `corridas-emaratonas.scraper.ts`
- Apply same performance optimizations (timeouts, delays, pre-fetch filter)

### Technical Requirements
- **Location:** `scripts/scraper/` or `jobs/scraper/` directory at repo root
- **Dependencies:** Playwright, Prisma Client, node-fetch (or similar for HTTP calls)
- **No Dependencies On:** NestJS, BullMQ, Redis
- **Environment Variables (Secrets):**
  - `DATABASE_URL` - Supabase connection string (R/W)
  - `DIRECT_URL` - Direct Postgres connection (for Prisma)
  - `API_BASE_URL` - For notification endpoint calls
  - `SCRAPER_*` - Performance config vars (optional, can have defaults)
- **GitHub Actions Workflow:**
  - Cron: `0 6 * * *` (06:00 UTC / 03:00 BRT)
  - Option: Matrix with 4-6 shards for parallel state processing (future enhancement)
  - Initial implementation: Sequential processing (simpler)

### Reusability Opportunities
- Extract core scraping logic from `CorridasEMaratonasScraper` to shared utility
- Reuse `ScraperOptions` interface and default values
- Reuse price extraction and image extraction utilities
- Reuse `StandardizedEvent` interface for data model

### Scope Boundaries

**In Scope:**
- Standalone scraper script in dedicated directory
- GitHub Actions workflow configuration
- Prisma Client setup for direct DB access
- HTTP client for notification API calls
- State-based iteration (all 27 states)
- Apply existing performance optimizations
- Documentation of Cloud Run fallback option

**Out of Scope:**
- Database schema changes
- Frontend modifications
- Structural API changes (only minimal notification endpoint if needed)
- Rewriting extraction logic (reuse existing)
- Cloud Run Job implementation (future)
- Matrix parallelization (future enhancement)
- Multiple executions per day

### Technical Considerations
- Must work within GitHub Actions runner constraints (6-hour job limit, memory)
- Playwright needs headless browser setup in workflow
- Prisma Client requires `prisma generate` step in workflow
- State processing should be resumable/idempotent (use sourceUrl deduplication)
- Logging should be structured for GitHub Actions visibility
- Error handling should not fail entire job for single state/event failures
