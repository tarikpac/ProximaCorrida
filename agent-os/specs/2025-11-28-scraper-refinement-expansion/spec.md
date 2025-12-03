# Specification: Scraper Refinement & Expansion

## Goal
Refactor the scraping architecture to support multiple platforms (starting with CorridasEMaratonas as the main one) and multiple states, standardizing event data ingestion and optimizing performance with parallel processing.

## User Stories
- As a developer, I want to easily add new scraping sources (platforms) by implementing a standard interface so that the system can expand nationally.
- As a developer, I want the system to handle high volumes of scraping jobs in parallel without crashing so that data is updated quickly.
- As a user, I want to see consistent event details (price, location, state) regardless of the source website so that I can filter and decide easily.

## Specific Requirements

**Platform-Based Architecture**
- Create an abstract base class or interface for scrapers to ensure consistency.
- Implement `CorridasEMaratonasScraper` as the primary platform scraper.
- Configure `CorridasEMaratonasScraper` to iterate through a list of state-specific URLs (e.g., PB, PE).
- Create a placeholder structure for `BackupPlatformScraper` for future use.

**Standardized Data Model**
- Define `StandardizedEvent` interface: `title`, `date`, `city`, `state`, `distances`, `regUrl`, `sourceUrl`, `sourcePlatform`, `sourceEventId`, `imageUrl`, `priceText`, `priceMin`, `organizerName`, `rawLocation`.
- Update Prisma `Event` model to include: `sourcePlatform`, `sourceEventId`, `rawLocation`, `priceText`, `priceMin`.
- Ensure `sourcePlatform` is mandatory and `sourceEventId` is optional (but indexed for lookups).

**Orchestration & Concurrency**
- Refactor `ScraperService` to act as an orchestrator that triggers platform-specific scrapers.
- Update `ScraperProcessor` to handle jobs with `concurrency: 3`.
- Ensure `ScraperSchedulerService` schedules the orchestration job daily.

**Event Upsert Logic**
- Update `EventsService` with `upsertFromStandardized(evt: StandardizedEvent)`.
- Implement deduplication logic: Match by `(sourcePlatform, sourceEventId)` if ID exists, otherwise `(sourcePlatform, sourceUrl)`.
- Trigger notification queue after successful insert (reusing existing logic).

**Location Parsing Utility**
- Create `parseLocation(raw: string)` utility function.
- Function should extract City and State (UF) from strings like "João Pessoa - PB" or "Recife/PE".
- Map full state names to UF acronyms if needed.

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**`apps/api/src/scraper/scraper.service.ts`**
- Reuse the existing Playwright setup, page navigation, and HTML extraction logic.
- Move the specific scraping logic (selectors, loops) into the new `CorridasEMaratonasScraper`.

**`apps/api/src/events/events.service.ts`**
- Reuse `upsertBySourceUrl` logic for the new `upsertFromStandardized` method.
- Keep the distance normalization and notification triggering flow.

**`apps/api/src/scraper/scraper.module.ts`**
- Reuse the BullMQ configuration.
- Update the processor registration to support the new concurrency settings.

**`apps/api/src/common/utils/` (check for distance utils)**
- Reuse `normalizeDistance` for standardizing race distances across all platforms.

## Out of Scope
- Implementing the actual logic for `BackupPlatformScraper` (only the class structure).
- Cross-platform deduplication (e.g., matching events between two different sites).
- Frontend UI changes to display "Starting from R$..." (database support only).
