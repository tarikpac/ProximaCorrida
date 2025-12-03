# Spec Requirements: Scraper Refinement & Expansion

## Initial Description
Refactor scraper to support multiple states/origins (National Expansion), optimize performance for high volume, and standardize data models.

## Requirements Discussion

### First Round Questions

**Q1:** I assume we should structure the new scrapers by **Platform** (e.g., `TicketSportsScraper`, `MinhasInscricoesScraper`) rather than by geographic State, since most platforms cover the whole country. Is that correct?
**Answer:** Yes, but with this vision adjustment: The architecture should be by platform, not by state.
Example:
`CorridasEMaratonasScraper` (main platform, covers multiple states)
`BackupPlatformScraper` (backup platform)
Each platform can internally iterate through multiple states using a list of `{ state, url }`.
For your specific case:
`CorridasEMaratonasScraper` will have an array like `[{ state: 'PB', url: '...paraiba' }, { state: 'PE', url: '...pernambuco' }, ...]`.
For each item, reuse the same logic you already have in `scrapeEvents`, just parameterizing `state` and `url`.
Thus you maintain:
1 main scraper (platform)
Each state treated as a "sub-task" within it.

**Q2:** I'm thinking of implementing a `StandardizedEvent` interface that all specific platform scrapers must return to ensure data consistency. Are there any specific new fields (e.g., `organizer_id`, `source_url`, `original_id`) that we must capture now to support this expansion?
**Answer:** Yes. Based on your `EventsService` and what you want to do, I would go with something like this:
```typescript
interface StandardizedEvent {
  title: string;
  date: Date;
  city: string | null;
  state: string | null;
  distances: string[];
  regUrl: string | null;
  sourceUrl: string;            // event page link on the platform
  sourcePlatform: string;       // 'corridasemaratonas', 'backup_platform', etc.
  sourceEventId?: string | null; // original platform ID, if available
  imageUrl?: string | null;
  priceText?: string | null;    // e.g., "R$ 89,90", "On request"
  priceMin?: number | null;     // optional: numeric minimum value (89.90)
  organizerName?: string | null;
  rawLocation?: string | null;  // original location/city/state string
}
```
In the database, it is worth anticipating:
`sourcePlatform` (string or enum)
`sourceEventId` (string, optional)
`rawLocation` (string)
`priceText` and, if you want, `priceMin` as numeric.
`organizer_id` (relational) you don't need now; working with `organizerName` text solves it well at this stage.
Then, in `EventsService`, you can create a method `async upsertFromStandardized(evt: StandardizedEvent)` that uses `normalizeDistance()`, assembles `EventCreateInput`, performs dedupe by `(sourcePlatform, sourceEventId/sourceUrl)`, and triggers the notification queue just like the current `upsertBySourceUrl`.

**Q3:** To handle "high volume", I plan to use BullMQ to run different platform scrapers in parallel. Should we implement a specific concurrency limit (e.g., max 3 scrapers at once) to avoid resource exhaustion?
**Answer:** Yes. Use BullMQ to run different platform scrapers in parallel. I recommend a concurrency limit: 3 in the job processors.
Conceptual example:
```typescript
@Processor('scraper')
export class ScraperProcessor {
  @Process({ name: 'run-platform-scraper', concurrency: 3 })
  async handle(job: Job<{ platform: string }>) {
    await this.scraperService.runPlatform(job.data.platform);
  }
}
```
Since for now your idea is 1 main platform (`CorridasEMaratonasScraper`) and 1 backup platform, you are very safe with this limit, and already preparing ground for future integrations.

**Q4:** Regarding **Deduplication**: If the same event appears on multiple platforms (or is scraped twice), I assume we should use a composite key like `slug` (derived from title) + `date` to prevent duplicates. Is this sufficient, or do we need smarter logic?
**Answer:** In two parts:
4.1. **Dedup within the platform**: Today you already do `.select('id').eq('sourceUrl', data.sourceUrl).single();`. This ensures if the same event is scraped again from the same URL, you only update. For expansion, the ideal is: dedupe by `(sourcePlatform, sourceEventId)` if the platform has its own ID, otherwise by `(sourcePlatform, sourceUrl)`. This is sufficient and robust within each platform.
4.2. **Dedup between different platforms**: `slug(title) + date` is not reliable enough to become a global unique key (generic names, races in different cities on the same day, small title variations). So, the answer: For the moment (1 main + 1 backup), I would not use `slug + date` as a database key. I would use `slug + date + city` at most as a heuristic to detect possible duplicates in a future phase. In your current plan (backup runs only if main fails), the risk of "same race in 2 sources at the same time" is much smaller. So: serious dedupe -> by platform (`sourcePlatform + sourceEventId/sourceUrl`). Cross-platform heuristic -> subject for another phase.

**Q5:** For **State Detection**: Should the scraper automatically extract the state (UF) from the event location string if it's not explicitly provided by the source, or should we only scrape sources that provide structured location data?
**Answer:** Yes, but combining two approaches:
1. When the URL is already specific to a state (case `corridasemaratonas`): you already know the state by the route itself (`corridas-na-paraiba` -> 'PB'). So pass `state: 'PB'` as a parameter to that page's scraper and use it directly in `StandardizedEvent`.
2. When the platform doesn't give "dry" UF and only delivers a location text: create a utility function like `function parseLocation(raw: string): { city?: string; state?: string } { ... }`. In it, you try to read patterns like `City - UF`, `City/UF`, `City - StateName` and map state names to acronyms. If a source provides no useful location info (neither UF, nor city, nor state name), that source is terrible for your use — it's better to ignore those events than index something without state (since filters, calendar and notifications depend on UF).

### Existing Code to Reference
Based on user's response about similar features:

**Similar Features Identified:**
- Feature: **ScraperService** - Path: `apps/api/src/scraper/scraper.service.ts` (assumed)
  - Contains Playwright setup, loop for found events, details/reg page opening, price heuristic, image extraction. Should be refactored into `CorridasEMaratonasScraper`.
- Feature: **EventsService.upsertBySourceUrl** - Path: `apps/api/src/events/events.service.ts` (assumed)
  - Contains lookup by sourceUrl, distance normalization, insert + notification queue enqueue. Should become the core of `upsertFromStandardized`.
- Feature: **normalizeDistance** - Path: `apps/api/src/common/utils/distance-utils.ts` (assumed)
  - Solves standardization of "5k", "5 km", etc. Should be used by all platform scrapers.
- Feature: **BullMQ + ScraperModule** - Path: `apps/api/src/scraper/scraper.module.ts`
  - Queue registration. Expansion involves `ScraperSchedulerService` scheduling daily job, `ScraperProcessor` processing with concurrency 3, and `ScraperService` becoming an orchestrator.

### Follow-up Questions
None needed. The user provided very detailed architectural guidance.

## Visual Assets

### Files Provided:
No visual assets provided.

## Requirements Summary

### Functional Requirements
- **Platform-Based Scraping Architecture:**
  - Create `CorridasEMaratonasScraper` as the main implementation.
  - Support iterating through a list of `{ state, url }` configurations (e.g., PB, PE).
  - Prepare structure for `BackupPlatformScraper`.
- **Standardized Data Model:**
  - Implement `StandardizedEvent` interface with fields: `title`, `date`, `city`, `state`, `distances`, `regUrl`, `sourceUrl`, `sourcePlatform`, `sourceEventId`, `imageUrl`, `priceText`, `priceMin`, `organizerName`, `rawLocation`.
- **Database Updates:**
  - Add fields to Event model: `sourcePlatform`, `sourceEventId` (optional), `rawLocation`, `priceText`, `priceMin`.
- **Deduplication Logic:**
  - Primary: `(sourcePlatform, sourceEventId)` or `(sourcePlatform, sourceUrl)`.
  - Cross-platform: Not required for this phase (backup only runs on failure).
- **Orchestration:**
  - `ScraperService` acts as orchestrator (`runAllPlatforms`, `runPlatform`).
  - `ScraperProcessor` handles jobs with `concurrency: 3`.
  - `ScraperSchedulerService` schedules daily execution.
- **Location Parsing:**
  - Support explicit state injection (from URL config).
  - Implement `parseLocation` utility for extracting City/UF from raw strings.

### Reusability Opportunities
- **Scraper Logic:** Refactor existing `scrapeEvents` logic into `CorridasEMaratonasScraper`.
- **Event Upsert:** Refactor `upsertBySourceUrl` into `upsertFromStandardized` in `EventsService`.
- **Distance Normalization:** Reuse `normalizeDistance` utility.
- **Queue Infrastructure:** Reuse existing BullMQ setup in `ScraperModule`.

### Scope Boundaries
**In Scope:**
- Refactoring `ScraperService` into platform-specific classes.
- Implementing `CorridasEMaratonasScraper` with multi-state support.
- Updating Database Schema (Prisma).
- Updating `EventsService` to handle standardized events.
- Implementing `parseLocation` utility.
- Configuring BullMQ concurrency.

**Out of Scope:**
- Implementing the actual `BackupPlatformScraper` logic (just the architectural slot).
- Cross-platform deduplication heuristics (slug+date).
- Frontend changes for "A partir de R$" (mentioned as optional/next step, but `priceText` storage is in scope).

### Technical Considerations
- **Concurrency:** Limit to 3 in BullMQ processor.
- **Error Handling:** If main scraper fails, system should be able to trigger backup (future/manual for now).
- **Data Integrity:** Ensure `state` is always populated (either via config or parser) to support filtering/notifications.
