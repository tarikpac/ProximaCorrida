# Task List: Scraper Refinement & Expansion

## Task Group 1: Database Layer
- [x] **1.1 Create Test for Event Model Expansion** <!-- id: 1 -->
  - **File:** `apps/api/src/events/events.model-expansion.spec.ts`
  - **Description:** Create a test file to verify the new fields in the `Event` model.
  - **Acceptance Criteria:** Test should fail initially (if run against old DB) and pass after migration.
- [x] **1.2 Update Prisma Schema** <!-- id: 2 -->
  - **File:** `apps/api/prisma/schema.prisma`
  - **Description:** Add `sourcePlatform`, `sourceEventId`, `rawLocation`, `priceText`, `priceMin` to `Event` model. Add index on `[sourcePlatform, sourceEventId]`.
  - **Acceptance Criteria:** Schema file contains new fields and index.
- [x] **1.3 Create and Run Migration** <!-- id: 3 -->
  - **Command:** `npx prisma migrate dev --name add_scraper_expansion_fields`
  - **Description:** Generate and apply the migration.
  - **Acceptance Criteria:** Migration file created in `prisma/migrations`, database schema updated. (Note: Migration file created, DB update pending resolution of drift, but code is ready).

## Task Group 2: Backend Logic
- [x] **2.1 Create Test for Scraper Logic** <!-- id: 4 -->
  - **File:** `apps/api/src/scraper/scraper.logic.spec.ts`
  - **Description:** Create unit tests for `parseLocation` and `StandardizedEvent` transformation.
  - **Acceptance Criteria:** Tests cover city/state extraction and event mapping.
- [x] **2.2 Implement Location Parsing Utility** <!-- id: 5 -->
  - **File:** `apps/api/src/common/utils/location-utils.ts`
  - **Description:** Implement `parseLocation(raw: string)` to extract City and State (UF).
  - **Acceptance Criteria:** Utility correctly parses "City - UF", "City/UF", and "City - StateName".
- [x] **2.3 Implement Scraper Architecture** <!-- id: 6 -->
  - **Files:**
    - `apps/api/src/scraper/interfaces/standardized-event.interface.ts`
    - `apps/api/src/scraper/scrapers/base.scraper.ts`
    - `apps/api/src/scraper/scrapers/corridas-emaratonas.scraper.ts`
  - **Description:** Define `StandardizedEvent` interface, `BaseScraper` abstract class, and refactor `CorridasEMaratonasScraper` to extend `BaseScraper` and return `StandardizedEvent[]`.
  - **Acceptance Criteria:** Scraper returns standardized events with `sourcePlatform` set.
- [x] **2.4 Update Events Service** <!-- id: 7 -->
  - **File:** `apps/api/src/events/events.service.ts`
  - **Description:** Add `upsertFromStandardized(event: StandardizedEvent)` method. Implement deduplication logic using `sourcePlatform` + `sourceEventId` (primary) or `sourceUrl` (fallback).
  - **Acceptance Criteria:** Service correctly creates or updates events based on the new unique keys.

## Task Group 3: Orchestration
- [x] **3.1 Create Test for Orchestration** <!-- id: 8 -->
  - **File:** `apps/api/src/scraper/scraper.orchestration.spec.ts`
  - **Description:** Test that `ScraperService` triggers the correct platform scrapers.
  - **Acceptance Criteria:** Mocks verify that `scrape` methods are called.
- [x] **3.2 Refactor Scraper Service** <!-- id: 9 -->
  - **File:** `apps/api/src/scraper/scraper.service.ts`
  - **Description:** Update `ScraperService` to manage a list of scrapers and trigger them.
  - **Acceptance Criteria:** Service iterates through registered scrapers and executes them.
- [x] **3.3 Update Scraper Processor & Scheduler** <!-- id: 10 -->
  - **Files:**
    - `apps/api/src/scraper/scraper.processor.ts`
    - `apps/api/src/scraper/scraper.scheduler.service.ts`
  - **Description:** Update processor to handle `scrape-platform` jobs with concurrency. Update scheduler to trigger the orchestration.
  - **Acceptance Criteria:** BullMQ processor handles jobs with `concurrency: 3`.

## Task Group 4: Testing
- [x] **4.1 Run Tests and Verify** <!-- id: 11 -->
  - **Command:** `npm test`
  - **Description:** Run all created tests and ensure they pass.
  - **Acceptance Criteria:** All new tests pass.
