# Specification: Scraper Performance Optimizations

## Goal

Optimize the scraper's resource usage (memory, CPU, network) and execution time by implementing configurable timeouts, browser context reuse, pre-fetch filtering, and log verbosity control—without changing extraction logic or data models.

## User Stories

- As a **system operator**, I want the scraper to complete faster and consume less memory so that production costs are reduced and reliability improved.
- As a **developer**, I want scraper behavior (timeouts, delays, log level) configurable via environment variables so that I can tune performance without redeploying.

## Specific Requirements

**Browser Context Reuse**
- Reuse the same Playwright browser context across all events within a state scrape job
- Keep the existing pattern of one `detailsPage` per state (already implemented)
- Optionally add context renewal after X events to prevent memory leaks (configurable via `SCRAPER_CONTEXT_RENEWAL_THRESHOLD`, default: disabled/0)
- Close and recreate context only at job boundaries, not per-event

**Configurable Timeouts**
- Replace hardcoded timeout values with environment variable reads via `ConfigService`
- Add `DETAIL_TIMEOUT_MS` (default: 15000) for details page navigation
- Add `REG_TIMEOUT_MS` (default: 20000) for registration page navigation
- Implement graceful fallback: if timeout occurs, log warning and continue (don't fail the job)
- Apply `waitUntil: 'domcontentloaded'` as the default wait strategy

**Configurable Event Delay**
- Replace hardcoded `1000ms` delay with `SCRAPER_EVENT_DELAY_MS` (default: 500)
- Read delay value via `ConfigService` at scraper initialization
- Keep fallback delay for invalid URLs at 100ms (no change)

**Log Verbosity Control**
- Add `SCRAPER_LOG_LEVEL` environment variable (options: "debug", "info", "warn", "error"; default: "info")
- In production (`NODE_ENV=production` or `SCRAPER_LOG_LEVEL != debug`): log only errors and job summaries
- In development: keep verbose debug logs for image/price extraction
- Convert existing `this.logger.debug()` calls to check log level before logging
- Create a helper method `shouldLogDebug()` to centralize the check

**Pre-fetch Filter (Skip Existing Events)**
- Before opening details page, query database to check if event exists by `sourceUrl`
- If event exists AND `updatedAt` is within staleness threshold, skip scraping that event
- Add `SCRAPER_STALENESS_DAYS` environment variable (default: 7)
- Implement efficient batch lookup: fetch all existing sourceUrls for a state before iterating
- Log skipped events count in job summary

**Optional Batch Size Configuration**
- Add `SCRAPER_BATCH_SIZE` environment variable (default: 1 = sequential)
- For now, keep default sequential processing
- Prepare codebase structure to support parallel processing in future (but don't implement parallelism yet)

## Visual Design

No visual assets required—this is a backend/infrastructure optimization with no UI components.

## Existing Code to Leverage

**`apps/api/src/scraper/scrapers/corridas-emaratonas.scraper.ts`**
- Main scraper class with `scrape()` method containing the event loop
- Already reuses `detailsPage` within state (line 125)
- Timeout values at lines 84, 152, 460 need to be replaced with config reads
- Delay at line 238 needs to be configurable

**`apps/api/src/scraper/scraper.service.ts`**
- Injects `ConfigService` pattern already used in `AppModule`
- Browser launch happens here; can inject config for timeouts
- Should pass config values to scraper's `scrape()` method via options object

**`apps/api/src/events/events.service.ts`**
- Has `upsertFromStandardized()` that already does `findFirst` by `sourceUrl`
- Create new method `checkEventFreshness(sourceUrl: string, stalenessDays: number): Promise<boolean>` to support pre-fetch filter
- Leverage existing Prisma patterns and Logger usage

**`apps/api/src/app.module.ts`**
- Shows `ConfigModule.forRoot({ isGlobal: true })` pattern
- ConfigService available for injection throughout the app

**NestJS Logger Pattern**
- Existing pattern: `private readonly logger = new Logger(ClassName.name)`
- Extend to support conditional debug logging based on `SCRAPER_LOG_LEVEL`

## Out of Scope

- Changes to data sources, URLs, or selector logic
- New extraction heuristics for price/image
- Data model or Prisma schema changes
- Notification flow modifications
- Parallel/batch processing implementation (only prepare structure)
- Multi-provider scraper architecture (roadmap item #19)
- BullMQ job structure changes (keep 27 jobs for 27 states)
- GitHub Actions migration (roadmap item #16)
- API or Dockerfile changes
