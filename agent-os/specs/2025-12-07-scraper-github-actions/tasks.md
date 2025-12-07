# Task Breakdown: Scraper as External Job (GitHub Actions)

## Overview
Total Tasks: 24

## Task List

### Project Setup

#### Task Group 1: Standalone Script Directory & Dependencies
**Dependencies:** None

- [ ] 1.0 Complete project setup
  - [ ] 1.1 Create directory structure
    - Create `scripts/scraper/` directory at repo root
    - Create `scripts/scraper/src/` for source files
    - Create `scripts/scraper/src/utils/` for utility modules
  - [ ] 1.2 Initialize package.json
    - `npm init -y` in `scripts/scraper/`
    - Add dependencies: `playwright`, `@prisma/client`, `node-fetch`
    - Add devDependencies: `typescript`, `ts-node`, `@types/node`
    - Configure scripts: `"start": "ts-node src/main.ts"`
  - [ ] 1.3 Configure TypeScript
    - Create `scripts/scraper/tsconfig.json`
    - Target ES2020+, module: CommonJS
    - Include `src/**/*`
  - [ ] 1.4 Setup Prisma Client
    - Create `scripts/scraper/prisma/schema.prisma` (symlink or copy from api)
    - Add `prisma generate` script
    - Test client generation works standalone

**Acceptance Criteria:**
- Directory structure exists
- `npm install` works without errors
- TypeScript compiles
- Prisma Client generates successfully

---

### Core Scraper Logic

#### Task Group 2: Extract & Adapt Scraper Logic
**Dependencies:** Task Group 1

- [ ] 2.0 Complete scraper extraction
  - [ ] 2.1 Write 3 focused tests for core scraper functions
    - Test STATE_URLS configuration is correct
    - Test StandardizedEvent interface compatibility
    - Test scraper can initialize Playwright browser
  - [ ] 2.2 Copy utility modules
    - Copy `price-extraction.utils.ts` to `src/utils/`
    - Copy `image-extraction.utils.ts` to `src/utils/`
    - Remove any NestJS dependencies (replace Logger with console)
  - [ ] 2.3 Copy interfaces
    - Copy `standardized-event.interface.ts` to `src/interfaces/`
    - Copy `ScraperOptions` interface (or inline it)
  - [ ] 2.4 Create main scraper module
    - Create `src/scraper.ts` based on `corridas-emaratonas.scraper.ts`
    - Remove NestJS Logger, use console.log/error
    - Remove BaseScraper class dependency (make standalone function)
    - Export `scrapeState(browser, state, config): Promise<StandardizedEvent[]>`
  - [ ] 2.5 Ensure scraper tests pass
    - Run tests to verify extraction works

**Acceptance Criteria:**
- All utilities copied and adapted
- Scraper module exports clean functions
- No NestJS dependencies in standalone script
- Tests pass

---

#### Task Group 3: Database Integration (Prisma)
**Dependencies:** Task Groups 1, 2

- [ ] 3.0 Complete database integration
  - [ ] 3.1 Write 3 focused tests for DB operations
    - Test Prisma Client connects with env vars
    - Test upsertEvent function works
    - Test checkEventsFreshness function works
  - [ ] 3.2 Create database module
    - Create `src/db.ts` with Prisma Client initialization
    - Implement connection cleanup function
    - Handle connection errors gracefully
  - [ ] 3.3 Implement upsertEvent function
    - Port logic from `EventsService.upsertFromStandardized()`
    - Handle existing event updates
    - Handle new event inserts
    - Return boolean: isNew (for notification trigger)
  - [ ] 3.4 Implement checkEventsFreshness function
    - Port logic from `EventsService.checkEventsFreshness()`
    - Query events by sourceUrl with staleness threshold
    - Return `Set<string>` of fresh URLs to skip
  - [ ] 3.5 Ensure database tests pass

**Acceptance Criteria:**
- Prisma Client connects successfully
- Events can be upserted
- Freshness check works correctly
- Connection properly cleaned up

---

#### Task Group 4: Configuration & Environment
**Dependencies:** Task Group 1

- [ ] 4.0 Complete configuration setup
  - [ ] 4.1 Create config module
    - Create `src/config.ts`
    - Read `DATABASE_URL`, `DIRECT_URL` from environment
    - Read `API_BASE_URL` for notification calls
    - Read scraper options: `DETAIL_TIMEOUT_MS`, `REG_TIMEOUT_MS`, `SCRAPER_EVENT_DELAY_MS`, `SCRAPER_STALENESS_DAYS`
    - Provide sensible defaults for all values
  - [ ] 4.2 Create .env.example
    - Document all required environment variables
    - Add sample values for local testing
  - [ ] 4.3 Validate configuration on startup
    - Check required vars are present
    - Log configuration summary (without secrets)

**Acceptance Criteria:**
- Config module exports all needed values
- Defaults work when vars not set
- Missing required vars cause clear error message

---

### Main Orchestration

#### Task Group 5: Main Entry Point & Orchestration
**Dependencies:** Task Groups 2, 3, 4

- [ ] 5.0 Complete main orchestration
  - [ ] 5.1 Write 2 focused tests for orchestration
    - Test main function processes states in order
    - Test error in one state doesn't abort job
  - [ ] 5.2 Create main entry point
    - Create `src/main.ts`
    - Initialize Prisma Client
    - Launch Playwright browser
    - Iterate through all 27 states
    - Handle per-state errors gracefully
    - Log progress and summaries
  - [ ] 5.3 Implement per-state processing
    - Fetch fresh URLs (pre-fetch filter)
    - Call scrapeState function
    - Upsert each event
    - Track counters: processed, skipped, errors, new
  - [ ] 5.4 Implement final cleanup
    - Close Playwright browser
    - Disconnect Prisma Client
    - Log final summary with duration
  - [ ] 5.5 Ensure orchestration tests pass

**Acceptance Criteria:**
- Script runs end-to-end
- All 27 states processed
- Per-state errors don't crash job
- Summary logged at end

---

### Notification Integration

#### Task Group 6: Push Notification Trigger
**Dependencies:** Task Group 5

- [ ] 6.0 Complete notification integration
  - [ ] 6.1 Write 2 focused tests for notification trigger
    - Test HTTP call to notification endpoint
    - Test graceful handling of API errors
  - [ ] 6.2 Create notification module
    - Create `src/notifications.ts`
    - Implement `triggerNotification(eventId, eventTitle, eventState)`
    - Use node-fetch or native fetch for HTTP call
    - POST to `${API_BASE_URL}/api/notifications/trigger`
  - [ ] 6.3 Integrate with main flow
    - After upsertEvent returns `isNew: true`, call triggerNotification
    - Log notification success/failure
    - Don't fail job on notification errors
  - [ ] 6.4 Add simple API endpoint (if needed)
    - Create `POST /api/notifications/trigger` in API
    - Accept { eventId, eventTitle, eventState }
    - Enqueue push notification job
  - [ ] 6.5 Ensure notification tests pass

**Acceptance Criteria:**
- New events trigger notification call
- API errors don't crash script
- Notifications logged for visibility

---

### GitHub Actions Workflow

#### Task Group 7: GitHub Actions Configuration
**Dependencies:** Task Groups 1-6

- [ ] 7.0 Complete GitHub Actions setup
  - [ ] 7.1 Create workflow file
    - Create `.github/workflows/scraper.yml`
    - Trigger: `schedule: cron: '0 6 * * *'` (06:00 UTC)
    - Also allow manual trigger: `workflow_dispatch`
  - [ ] 7.2 Configure job steps
    - Checkout repository
    - Setup Node.js 20
    - Install dependencies: `cd scripts/scraper && npm ci`
    - Generate Prisma Client: `npx prisma generate`
    - Install Playwright: `npx playwright install chromium --with-deps`
    - Run scraper: `npx ts-node src/main.ts`
  - [ ] 7.3 Configure secrets
    - Document required secrets in workflow comments
    - Use `${{ secrets.DATABASE_URL }}`, `${{ secrets.DIRECT_URL }}`, `${{ secrets.API_BASE_URL }}`
  - [ ] 7.4 Configure timeout and error handling
    - Set job timeout: 2 hours (covers 27 states)
    - Continue-on-error: false (we want failure notifications)

**Acceptance Criteria:**
- Workflow file is valid YAML
- Cron schedule is correct
- All secrets documented
- Manual trigger works

---

### Integration & Verification

#### Task Group 8: Final Integration & Testing
**Dependencies:** Task Groups 1-7

- [ ] 8.0 Complete integration and verification
  - [ ] 8.1 Local end-to-end test
    - Set env vars locally
    - Run `npm start` in `scripts/scraper/`
    - Verify single state processes correctly
    - Verify events appear in database
  - [ ] 8.2 Test workflow locally (act)
    - Optional: Use `act` to test workflow locally
    - Or push to branch and run manually
  - [ ] 8.3 Update documentation
    - Add README.md in `scripts/scraper/`
    - Document how to run locally
    - Document environment variables
    - Document fallback options (Cloud Run)
  - [ ] 8.4 Create verification report
    - Run all feature tests
    - Document test results
    - Note any issues or limitations

**Acceptance Criteria:**
- Script runs successfully locally
- Workflow runs successfully on GitHub
- Documentation is complete
- All tests pass

---

## Execution Order

Recommended implementation sequence:

1. **Project Setup** (Task Group 1) - Foundation
2. **Configuration** (Task Group 4) - Can be done in parallel with Group 1
3. **Extract Scraper Logic** (Task Group 2) - Core functionality
4. **Database Integration** (Task Group 3) - Persistence layer
5. **Main Orchestration** (Task Group 5) - Ties everything together
6. **Notification Integration** (Task Group 6) - External calls
7. **GitHub Actions** (Task Group 7) - Deployment config
8. **Final Integration** (Task Group 8) - Verification

```
Group 1 (Setup) ──┬──> Group 2 (Scraper) ──> Group 3 (Database) ──┐
                  │                                                │
                  └──> Group 4 (Config) ───────────────────────────┤
                                                                   │
                       ┌───────────────────────────────────────────┘
                       │
                       v
                  Group 5 (Main) ──> Group 6 (Notifications) ──> Group 7 (GH Actions) ──> Group 8 (Verify)
```

## Notes

- **No UI tasks**: This is entirely backend/infrastructure
- **No schema changes**: Reuses existing Prisma schema
- **Parallel potential**: Groups 1 and 4 can run in parallel
- **API changes**: Only if notification endpoint doesn't exist
- **Total tests**: ~13 focused tests for critical paths
- **Fallback documentation**: Cloud Run option documented but not implemented
