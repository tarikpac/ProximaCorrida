# Specification: Scraper as External Job (GitHub Actions)

## Goal
Extract the scraper from the NestJS API into a standalone TypeScript script that runs as a GitHub Actions cron job, writing directly to Supabase/Postgres via Prisma Client, eliminating Redis/BullMQ dependencies and achieving zero-cost infrastructure.

## User Stories
- As an operator, I want the scraper to run independently from the API deployment so that I can update scraper logic without redeploying the entire application.
- As a cost-conscious maintainer, I want to use GitHub Actions free tier for daily scraping so that I eliminate infrastructure costs for background jobs.

## Specific Requirements

**Standalone Script Directory**
- Create dedicated directory at repo root: `scripts/scraper/`
- Independent `package.json` with only required dependencies (playwright, @prisma/client, node-fetch)
- Clear entrypoint: `scripts/scraper/index.ts` or `scripts/scraper/main.ts`
- No NestJS, BullMQ, or Redis dependencies
- TypeScript configuration that compiles to ESM or CommonJS

**Prisma Client Integration**
- Generate Prisma Client from `apps/api/prisma/schema.prisma`
- Use `DATABASE_URL` for read/write operations
- Use `DIRECT_URL` for direct Postgres connection (pooler bypass if needed)
- Implement connection cleanup in finally blocks
- Reuse existing data model without schema changes

**State-by-State Processing**
- Process all 27 Brazilian states sequentially in single execution
- Iterate using `STATE_URLS` configuration (extract from existing scraper)
- Implement error handling per-state: failures should not abort entire job
- Log progress clearly for GitHub Actions visibility
- Track and log summary: processed, skipped, errors per state

**Pre-fetch Filter Integration**
- Implement `checkEventsFreshness()` logic from EventsService
- Query existing events by sourceUrl with staleness threshold
- Skip events that were updated within `SCRAPER_STALENESS_DAYS` (default: 7)
- Reduce unnecessary page navigations and DB writes

**Configurable Timeouts and Delays**
- Read from environment variables with defaults: `DETAIL_TIMEOUT_MS=15000`, `REG_TIMEOUT_MS=20000`, `SCRAPER_EVENT_DELAY_MS=500`
- Graceful timeout handling: log warning, continue to next event
- Individual event failures should not crash the job

**Push Notification Trigger**
- Call API endpoint for notification dispatch: `POST /api/notifications/trigger`
- Pass minimal payload: `eventId`, `eventTitle`, `eventState`
- Handle API errors gracefully (log and continue)
- Consider batch endpoint if many new events per run

**GitHub Actions Workflow**
- File: `.github/workflows/scraper.yml`
- Cron schedule: `0 6 * * *` (06:00 UTC / 03:00 BRT)
- Install dependencies: `npm ci` in `scripts/scraper/`
- Generate Prisma Client: `npx prisma generate`
- Install Playwright browsers: `npx playwright install chromium`
- Run script: `npx ts-node scripts/scraper/main.ts`
- Secrets: `DATABASE_URL`, `DIRECT_URL`, `API_BASE_URL`

**Logging and Observability**
- Structured console logs (GitHub Actions captures these)
- Clear job start/end timestamps
- Per-state summary logs: `[SP] processed=45, skipped=12, errors=2`
- Final summary: total events, total states, duration

## Visual Design
No visual assets provided - this is a backend/infrastructure feature.

## Existing Code to Leverage

**`apps/api/src/scraper/scrapers/corridas-emaratonas.scraper.ts`**
- Core scraping logic: `scrape()` method, `STATE_URLS` configuration
- Extraction methods: `extractImageWithFallback()`, `extractPriceWithClassification()`
- Registration link detection: `detectRegistrationLink()`
- Can be refactored to remove NestJS Logger dependency (use console instead)

**`apps/api/src/scraper/interfaces/standardized-event.interface.ts`**
- `StandardizedEvent` interface for type safety
- Copy directly to standalone script or import if module resolution allows

**`apps/api/src/scraper/utils/price-extraction.utils.ts`**
- Price extraction heuristics: `extractPriceWithHeuristics()`
- Copy to standalone script (no NestJS dependencies)

**`apps/api/src/scraper/utils/image-extraction.utils.ts`**
- Platform detection: `detectPlatform()`, `getPlatformWaitConfig()`
- Image extraction strategies
- Copy to standalone script (no NestJS dependencies)

**`apps/api/prisma/schema.prisma`**
- Event model definition (sourceUrl, updatedAt for freshness check)
- Generate client in standalone script directory

## Out of Scope
- No database schema changes
- No frontend modifications
- No structural API changes (only notification endpoint if needed)
- No rewriting of extraction logic (reuse existing)
- No Cloud Run Job implementation (document as future fallback only)
- No matrix parallelization in initial implementation (future enhancement)
- No multiple executions per day (daily is sufficient)
- No changes to existing scraper in `apps/api/` (it remains for backwards compatibility)
- No implementation of inline VAPID push notifications (use API endpoint)
- No changes to BullMQ queue configuration in API
