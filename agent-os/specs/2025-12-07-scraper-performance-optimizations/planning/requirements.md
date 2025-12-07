# Spec Requirements: Scraper Performance Optimizations

## Initial Description

**Scraper Performance Optimizations** — Reduce Playwright tab concurrency, reuse context/page, shorter timeouts. Filter before opening details, split scraping into smaller batches. Reduce verbose logging. `S`

## Requirements Discussion

### First Round Questions

**Q1:** Atualmente o scraper reutiliza a mesma `detailsPage` por estado, mas cria um novo `context` por `runPlatform()`. Assumo que devemos reutilizar o browser context entre batches para economizar memória e tempo de inicialização. Isso está correto, ou prefere manter contexts isolados por segurança?

**Answer:** Preferência: reutilizar o mesmo browser/context entre batches, mantendo uma aba de detalhes por estado, para reduzir cold start e consumo de memória/CPU. Segurança: aceitável se as páginas forem confiáveis (sites públicos). Se houver risco de isolamento, limitar a duração do contexto (ex: renovar a cada X estados ou Y eventos).

**Q2:** O timeout atual para carregar páginas de detalhes é de 30s (details) e 45s (registration). Estou pensando em reduzi-los para 15s e 20s respectivamente, com fallback graceful para continuar se der timeout. Concorda com esses valores, ou prefere outros?

**Answer:** Ok reduzir para ~15s (detalhes) e ~20s (registro) com fallback que segue o fluxo (não falha o job inteiro). Ajustar por env var para tunar sem redeploy (ex: DETAIL_TIMEOUT_MS, REG_TIMEOUT_MS).

**Q3:** Atualmente há um delay de 1000ms entre cada evento processado (linha 238). Devemos reduzir para 500ms ou configurar isso via environment variable?

**Answer:** Reduzir para 500ms e expor via env (SCRAPER_EVENT_DELAY_MS). Em ambiente protegido (runner próprio/cron), 500ms é um bom equilíbrio; manter possibilidade de subir para evitar bloqueio pelo site fonte.

**Q4:** O scraper processa 27 estados em jobs separados via BullMQ, mas cada job faz scrape sequencial de todos os eventos daquele estado. Devemos implementar processamento em batch (ex: 5 eventos por vez) dentro de cada job, ou manter sequencial?

**Answer:** Manter sequencial ou lote pequeno (ex: 3–5 em paralelo) só se monitorarmos carga/ban. Como o site fonte é sensível a overfetch, recomendação: manter sequencial por padrão; se houver SLA de tempo, introduzir paralelismo controlado configurável por env (SCRAPER_BATCH_SIZE).

**Q5:** Os logs atuais são bastante verbosos (debug de cada image/price extraction). Assumo que devemos reduzir para log apenas erros e sumários em produção, mantendo verbose apenas em NODE_ENV=development. Correto?

**Answer:** Sim: em produção, logs só de erro e sumário; verbose apenas em dev (NODE_ENV=development ou SCRAPER_LOG_LEVEL=debug). Ajuda a reduzir custo de logging e ruído.

**Q6:** Atualmente o scraper abre a página de detalhes e a página de registro para cada evento. Devemos implementar um filtro pré-abertura para pular eventos que já existem no banco (por sourceUrl) e não precisam ser atualizados?

**Answer:** Sim: checar por sourceUrl antes de abrir detalhes/registro e pular se não precisar atualizar. Incluir critério de "staleness" (ex: reprocessar se updatedAt > X dias) para pegar mudanças.

**Q7:** Há algo específico que devemos excluir deste escopo de otimizações?

**Answer:** Evitar mudanças de fonte/rotas ou novas heurísticas de extração agora; focar só em otimização de performance/recursos. Não alterar o modelo de dados nem fluxo de notificações neste pacote.

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Scraper Service - Path: `apps/api/src/scraper/scraper.service.ts`
- Feature: Main Scraper - Path: `apps/api/src/scraper/scrapers/corridas-emaratonas.scraper.ts`
- Feature: Base Scraper - Path: `apps/api/src/scraper/scrapers/base.scraper.ts`
- Feature: Scraper Processor (BullMQ) - Path: `apps/api/src/scraper/scraper.processor.ts`

### Follow-up Questions

No follow-up questions needed - user provided comprehensive answers.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A - This is a backend/performance optimization feature with no UI components.

## Requirements Summary

### Functional Requirements

1. **Browser Context Reuse**
   - Reutilizar o mesmo browser/context entre batches
   - Manter uma aba de detalhes reutilizável por estado
   - Opcionalmente renovar contexto a cada X estados ou Y eventos para evitar memory leaks

2. **Configurable Timeouts**
   - Reduzir timeout de detalhes: 30s → 15s (configurável via `DETAIL_TIMEOUT_MS`)
   - Reduzir timeout de registro: 45s → 20s (configurável via `REG_TIMEOUT_MS`)
   - Implementar fallback graceful (não falha o job se timeout)

3. **Configurable Event Delay**
   - Reduzir delay entre eventos: 1000ms → 500ms
   - Expor via env var `SCRAPER_EVENT_DELAY_MS`
   - Permitir ajuste para evitar bloqueio pelo site fonte

4. **Batch Processing (Optional)**
   - Manter sequencial por padrão
   - Adicionar suporte a paralelismo controlado via `SCRAPER_BATCH_SIZE` (default: 1)
   - Apenas habilitar se monitorarmos carga/ban

5. **Log Verbosity Control**
   - Em produção: apenas erros e sumários
   - Em dev: logs verbose completos
   - Controle via `NODE_ENV` ou `SCRAPER_LOG_LEVEL=debug`

6. **Pre-fetch Filter (Skip Existing)**
   - Checar `sourceUrl` no banco antes de abrir páginas de detalhes
   - Pular eventos que já existem e não estão "stale"
   - Implementar critério de staleness: reprocessar se `updatedAt > X dias`
   - Configurar staleness via `SCRAPER_STALENESS_DAYS` (ex: 7 dias)

### Reusability Opportunities

- Reuse existing `BaseScraper` interface
- Extend `scraper.service.ts` with new configuration options
- Keep BullMQ job structure intact (jobs por estado)

### Scope Boundaries

**In Scope:**
- Browser/context reuse optimization
- Configurable timeouts with env vars
- Configurable delays with env vars
- Log level control
- Pre-fetch filter for existing events
- Staleness check for re-scraping
- Optional batch size configuration

**Out of Scope:**
- Changes to data sources or routes
- New extraction heuristics
- Data model changes
- Notification flow changes
- Multi-provider architecture (roadmap item #19)

### Technical Considerations

- **Environment Variables to Add:**
  - `DETAIL_TIMEOUT_MS` (default: 15000)
  - `REG_TIMEOUT_MS` (default: 20000)
  - `SCRAPER_EVENT_DELAY_MS` (default: 500)
  - `SCRAPER_BATCH_SIZE` (default: 1)
  - `SCRAPER_LOG_LEVEL` (default: "info", options: "debug", "info", "warn", "error")
  - `SCRAPER_STALENESS_DAYS` (default: 7)

- **Database Query Needed:**
  - Query to check if event exists by `sourceUrl` and if `updatedAt` is within staleness threshold
  - Should be efficient (indexed query on `sourceUrl`)

- **Memory Management:**
  - Monitor context memory usage
  - Consider context renewal strategy if memory grows

- **Rate Limiting Awareness:**
  - Keep delays configurable to avoid site bans
  - Log rate limit errors for monitoring
