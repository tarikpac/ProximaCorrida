# Specification: Scraper Automation

## Goal
Implement robust, automated daily scraping of race events using NestJS Cron and BullMQ to ensure the database is kept up-to-date without manual intervention, featuring automatic retries and error logging.

## User Stories
- As a **System Administrator**, I want the scraper to **run automatically every day at 3 AM** so that the event list is always fresh without manual triggers.
- As a **Developer**, I want the system to **automatically retry failed scraping attempts** so that temporary network glitches don't cause data gaps.
- As a **Developer**, I want **clear logs of job execution** (start, success, failure) so that I can easily debug issues via console logs.

## Specific Requirements

**BullMQ Integration**
- Install `@nestjs/bullmq` and `bullmq`.
- Configure `BullModule` in `AppModule` (ensure Redis connection uses `REDIS_HOST`/`REDIS_PORT`).
- Create a `ScraperQueue` (name: `scraper`).
- Define job options:
    - **Retries:** 3 attempts.
    - **Backoff:** Exponential (delay: 30000ms, type: 'exponential').

**Cron Scheduling**
- Install `@nestjs/schedule`.
- Create `ScraperSchedulerService`.
- Implement a cron job running at **3:00 AM daily** (`0 3 * * *`).
- **Action:** Add a `runScraper` job to the `scraper` queue.

**Job Processing**
- Create `ScraperProcessor` (Consumer for `scraper` queue).
- **Process:**
    - Inject `ScraperService`.
    - Execute the scraping logic.
    - Log "Job Started".
    - Log "Job Completed" with event count.
    - Log "Job Failed" with error details on failure.

**Logging**
- Use standard `Logger` from `@nestjs/common`.
- Log levels:
    - `log`: Start, End, Summary.
    - `error`: Failures, Stack Traces.
    - `warn`: Retries (if accessible via event listeners).

## Visual Design
No visual assets provided. Backend-only feature.

## Existing Code to Leverage

**`apps/api/src/scraper/scraper.service.ts`**
- Reuse the existing `scrapeEvents` method (or equivalent) to perform the actual scraping.
- Ensure this service handles deduplication internally (as per requirements).

**`apps/api/src/app.module.ts`**
- Reuse existing Redis configuration logic for BullMQ connection.

## Out of Scope
- **Database Logging:** No `ScraperRun` table or persistence of job history in DB.
- **Notifications:** No Slack/Email alerts on failure.
- **Dashboard:** No UI for monitoring queues (use Bull Board locally if needed, but not in scope for this spec).
- **Complex Deduplication:** Deduplication logic remains in `ScraperService`, not in the job processor.
