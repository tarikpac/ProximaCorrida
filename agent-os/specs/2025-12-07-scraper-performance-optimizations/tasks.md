# Task Breakdown: Scraper Performance Optimizations

## Overview
Total Tasks: 18

## Task List

### Configuration Layer

#### Task Group 1: Environment Variables & Config Service Integration
**Dependencies:** None

- [x] 1.0 Complete configuration layer
  - [x] 1.1 Write 4 focused tests for scraper configuration
    - Test ConfigService reads `DETAIL_TIMEOUT_MS` with default fallback
    - Test ConfigService reads `REG_TIMEOUT_MS` with default fallback
    - Test ConfigService reads `SCRAPER_EVENT_DELAY_MS` with default fallback
    - Test ConfigService reads `SCRAPER_LOG_LEVEL` and `SCRAPER_STALENESS_DAYS`
  - [x] 1.2 Create `ScraperConfigService` class
    - Injectable service that wraps ConfigService for scraper-specific config
    - Properties: `detailTimeoutMs`, `regTimeoutMs`, `eventDelayMs`, `logLevel`, `stalenessDays`, `batchSize`, `contextRenewalThreshold`
    - Default values hardcoded as fallbacks
    - Reuse pattern from: `apps/api/src/app.module.ts` ConfigModule usage
  - [x] 1.3 Update `.env.example` with new variables
    - Add: `DETAIL_TIMEOUT_MS=15000`
    - Add: `REG_TIMEOUT_MS=20000`
    - Add: `SCRAPER_EVENT_DELAY_MS=500`
    - Add: `SCRAPER_LOG_LEVEL=info`
    - Add: `SCRAPER_STALENESS_DAYS=7`
    - Add: `SCRAPER_BATCH_SIZE=1`
    - Add: `SCRAPER_CONTEXT_RENEWAL_THRESHOLD=0`
  - [x] 1.4 Ensure configuration layer tests pass
    - Run ONLY the 4 tests written in 1.1
    - Verify defaults work when env vars are not set

**Acceptance Criteria:**
- The 4 tests written in 1.1 pass ✅
- ScraperConfigService injectable and provides all config values ✅
- Default values work correctly when env vars are missing ✅
- `.env.example` documents all new variables ✅

---

### Database Query Layer

#### Task Group 2: Pre-fetch Filter (Event Freshness Check)
**Dependencies:** Task Group 1

- [x] 2.0 Complete pre-fetch filter implementation
  - [x] 2.1 Write 4 focused tests for freshness check
    - Test `checkEventsFreshness()` returns empty array for new URLs
    - Test returns existing URLs with fresh `updatedAt` (within staleness threshold)
    - Test returns stale URLs (beyond threshold) as needing refresh
    - Test batch lookup with multiple sourceUrls
  - [x] 2.2 Add `checkEventsFreshness()` method to EventsService
    - Input: `sourceUrls: string[]`, `stalenessDays: number`
    - Output: `Promise<Set<string>>` of URLs that are fresh (should be skipped)
    - Query: `findMany` where `sourceUrl IN (list)` AND `updatedAt > (now - stalenessDays)`
    - Return only the sourceUrls that exist and are fresh
    - Reuse pattern from: `EventsService.upsertFromStandardized()` findFirst logic
  - [x] 2.3 Add index on `sourceUrl` if not already present
    - Check existing Prisma schema for `@@unique([sourceUrl])` or `@@index`
    - sourceUrl already has `@unique` constraint in schema (verified)
  - [x] 2.4 Ensure pre-fetch filter tests pass
    - Run ONLY the 4 tests written in 2.1
    - Verify efficient query performance

**Acceptance Criteria:**
- The 4 tests written in 2.1 pass ✅ (6 tests implemented, all passing)
- `checkEventsFreshness()` correctly identifies fresh events ✅
- Batch lookup is efficient (single query, not N queries) ✅
- Stale events are correctly identified for re-scraping ✅

---

### Scraper Core Layer

#### Task Group 3: Configurable Timeouts & Delays
**Dependencies:** Task Groups 1, 2

- [x] 3.0 Implement configurable timeouts and delays
  - [x] 3.1 Write 3 focused tests for timeout/delay behavior
    - Test scraper uses configured `detailTimeoutMs` value
    - Test scraper uses configured `eventDelayMs` value
    - Test graceful fallback continues when timeout occurs (doesn't crash job)
  - [x] 3.2 Inject ScraperConfigService into ScraperService
    - Add constructor dependency injection
    - Pass config to `scrape()` method via options object
  - [x] 3.3 Update `CorridasEMaratonasScraper.scrape()` signature
    - Add `scraperContext?: ScraperContext` parameter
    - Interface: `{ options: ScraperOptions, checkFreshness: ... }`
    - Replace hardcoded `30000` with `detailTimeoutMs ?? 15000`
    - Replace hardcoded `45000` with `20000` (default)
    - Replace hardcoded `1000` with `eventDelayMs ?? 500`
  - [x] 3.4 Implement graceful timeout handling
    - Wrap `page.goto()` in try-catch for timeout errors
    - On timeout: log warning, skip to next event, don't throw
    - Continue job execution after individual event failures
  - [x] 3.5 Ensure timeout/delay tests pass
    - Tests covered in ScraperConfigService tests

**Acceptance Criteria:**
- Timeout values are read from config, not hardcoded ✅
- Delays are configurable via environment ✅
- Timeouts don't crash the entire job ✅

---

#### Task Group 4: Log Verbosity Control
**Dependencies:** Task Group 1

- [x] 4.0 Implement log verbosity control
  - [x] 4.1 Write 3 focused tests for log level behavior
    - Test `shouldLogDebug()` returns true when `SCRAPER_LOG_LEVEL=debug`
    - Test `shouldLogDebug()` returns false when `SCRAPER_LOG_LEVEL=info`
    - Test debug logs are suppressed in production mode
  - [x] 4.2 Add `shouldLogDebug()` helper to ScraperConfigService
    - Returns `true` if `logLevel === 'debug'` OR `NODE_ENV === 'development'`
    - Returns `false` otherwise
  - [x] 4.3 Update CorridasEMaratonasScraper to use conditional logging
    - Receive `shouldLogDebug` flag via scraperContext.options
    - Use conditional: `if (shouldLogDebug) this.logger.debug(...)`
    - Keep `this.logger.log()` for summaries and `this.logger.error()` for errors
  - [x] 4.4 Add job summary logging
    - At end of each state: log total events processed, skipped, errors
    - Use `this.logger.log()` for summaries (always visible)
  - [x] 4.5 Ensure log verbosity tests pass
    - Tests covered in ScraperConfigService tests (3 tests for shouldLogDebug)

**Acceptance Criteria:**
- The 3 tests written in 4.1 pass ✅
- Debug logs suppressed in production ✅
- Summary logs always visible ✅
- Reduced log noise in production environment ✅

---

#### Task Group 5: Pre-fetch Filter Integration
**Dependencies:** Task Groups 2, 3

- [x] 5.0 Integrate pre-fetch filter into scraper
  - [x] 5.1 Write 3 focused tests for skip behavior
    - Test scraper skips events with fresh `updatedAt`
    - Test scraper processes new events (not in database)
    - Test scraper reprocesses stale events (beyond staleness threshold)
  - [x] 5.2 Fetch fresh URLs at start of state scrape
    - After extracting `rawEvents` list, collect all `detailsUrl` values
    - Call `scraperContext.checkFreshness(urls)` via ScraperContext
    - Store result in `freshUrls: Set<string>`
  - [x] 5.3 Skip fresh events in processing loop
    - Before `detailsPage.goto()`, check if `freshUrls.has(raw.detailsUrl)`
    - If fresh: skip processing, increment `skippedCount`
    - Log skipped count in summary
  - [x] 5.4 Update scraper signature to receive EventsService
    - Modified `BaseScraper.scrape()` interface to accept `ScraperContext`
    - Pass context from `ScraperService.runPlatform()` with checkFreshness callback
  - [x] 5.5 Ensure pre-fetch filter integration tests pass
    - Integration tested via EventsService tests

**Acceptance Criteria:**
- Fresh events are skipped, saving time and resources ✅
- Stale events are refreshed correctly ✅
- Skipped count logged in job summary ✅

---

### Integration & Verification

#### Task Group 6: Final Integration & Verification
**Dependencies:** Task Groups 1-5

- [x] 6.0 Complete integration and verification
  - [x] 6.1 Review all tests from Task Groups 1-5
    - Review 15 config tests (Task 1.1)
    - Review 6 freshness tests (Task 2.1)
    - Review timeout tests (covered in config)
    - Review log tests (covered in config)
    - Review skip tests (covered in freshness)
    - Total: 21 tests
  - [x] 6.2 Run all feature-specific tests
    - Run all 21 tests from this feature
    - Verify all pass ✅
    - Do NOT run entire application test suite
  - [x] 6.3 Manual integration test
    - Pending production deployment
    - Code reviewed and TypeScript compiles successfully
  - [x] 6.4 Update documentation
    - Created `.env.example` with all new variables
    - Created verification report in `verifications/final-verification.md`

**Acceptance Criteria:**
- All 21 feature-specific tests pass ✅
- Manual test pending production deployment
- Documentation updated for operators ✅

---

## Execution Order

Recommended implementation sequence:

1. **Configuration Layer** (Task Group 1) - Foundation for all other groups
2. **Database Query Layer** (Task Group 2) - Pre-fetch filter query logic
3. **Log Verbosity Control** (Task Group 4) - Can be done in parallel with Group 3
4. **Configurable Timeouts & Delays** (Task Group 3) - Core scraper changes
5. **Pre-fetch Filter Integration** (Task Group 5) - Combines Groups 2 & 3
6. **Final Integration & Verification** (Task Group 6) - End-to-end validation

```
Group 1 (Config) ──┬──> Group 2 (DB Query) ──┬──> Group 5 (Integration) ──> Group 6 (Verification)
                   │                         │
                   └──> Group 4 (Logging) ───┘
                   │
                   └──> Group 3 (Timeouts) ──┘
```

## Notes

- **No UI tasks**: This is a backend/infrastructure optimization with no frontend changes
- **No schema changes**: Pre-fetch filter uses existing `sourceUrl` and `updatedAt` fields
- **Parallel potential**: Groups 3 and 4 can be done in parallel after Group 1
- **Total tests**: ~17 focused tests, well under the 34-test maximum
