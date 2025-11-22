# Spec Requirements: Scraper Automation

## Initial Description
Configure robust periodic execution (Cron/BullMQ) with error handling and monitoring for the scraper.

## Requirements Discussion

### First Round Questions

**Q1:** I assume we should use **BullMQ** for job scheduling since it's already in the tech stack. Is that correct?
**Answer:** Yes, use BullMQ for scheduler and scraper job processing.
- Reasons: Already in stack, native retries/backoff, decouples scraper from HTTP, facilitates logging/monitoring, allows future parallelization.
- BullMQ is the standard for scraping automation.

**Q2:** I'm thinking the scraper should run **daily** (e.g., at 3 AM) to update events. Does this frequency work for you?
**Answer:** Yes, **3 AM daily** is perfect for MVP.
- Reasons: Low volume of new events, avoids peak hours, minimizes DB/infra impact.
- Future: May increase to 2x daily (3 AM + 3 PM) for national expansion.

**Q3:** I assume we need a **Cron Job** to trigger the scraping queue. Should this Cron be defined within NestJS using `@nestjs/schedule` or handled externally?
**Answer:** Use **NestJS native Cron** via `@nestjs/schedule`.
- Reasons: Simple, works well with BullMQ, avoids external services, easy deploy.
- Flow: Cron `0 3 * * *` calls a service -> service adds job to BullMQ (`scraperQueue.add('runScraper', {})`) -> Queue executes asynchronously.

**Q4:** I'm thinking we should implement **retries** for failed scraping jobs (e.g., 3 retries with exponential backoff). Is this desired?
**Answer:** Yes, exactly.
- **3 retries**.
- **Exponential backoff** (e.g., 30s -> 60s -> 120s).
- Protects against temporary site failures, timeouts, network instability.

**Q5:** I assume we want to **monitor** job status. Should we log failures to the database or just use standard logging (console/file) for this MVP?
**Answer:** **Simple logging** (console) is sufficient for MVP.
- Log: Job start/end, count of processed events, scraping errors, retries.
- Future: DB logging (ScraperRun table), Sentry/Logtail integration.

**Q6:** Are there any specific **error notifications** you want (e.g., email/Slack on failure), or is logging sufficient for now?
**Answer:** **Logging is sufficient** for now.
- Future: Slack webhook/email, Sentry cron monitoring, health dashboard.

**Q7:** Should the automation include **deduplication** logic (preventing duplicate events if the scraper runs multiple times), or is that handled by the existing scraper service?
**Answer:** Deduplication should remain in the **Scraper Service**, not the job/workflow.
- Job only triggers scraper.
- Scraper Service handles logic: scrape -> save -> dedupe -> return result.

### Existing Code to Reference

**Similar Features Identified:**
- **BullMQ Setup:** Does not exist yet. Will be created as standard infra for scraper jobs, push notifications, internal tasks.
- **Cron Jobs:** No active cron jobs. This will be the first/base.
- **Error Handling:** Reuse `Security & Integrity` layer (global logger, exception filter).

### Follow-up Questions
None needed. Requirements are clear.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
No visual assets provided.

## Requirements Summary

### Functional Requirements
1.  **BullMQ Integration:**
    - Set up `ScraperQueue` using BullMQ.
    - Configure Processor to run the scraping logic.
    - Implement job options: 3 retries, exponential backoff.
2.  **Cron Scheduling:**
    - Install `@nestjs/schedule`.
    - Create `ScraperSchedulerService`.
    - Schedule job for 3:00 AM daily (`0 3 * * *`).
    - Trigger: Add `runScraper` job to `ScraperQueue`.
3.  **Job Processing:**
    - Create `ScraperProcessor`.
    - Call existing `ScraperService` logic.
    - Handle success/failure.
4.  **Logging:**
    - Log job start, end, success count, error details.
    - Use standard NestJS Logger.

### Reusability Opportunities
- **Scraper Service:** Reuse existing `apps/api/src/scraper/scraper.service.ts` for the actual scraping logic.
- **Security Layer:** Reuse global logger/filters from `Security & Integrity` spec.

### Scope Boundaries
**In Scope:**
- BullMQ setup for Scraper.
- Cron scheduling (3 AM).
- Retries & Backoff configuration.
- Console Logging.

**Out of Scope:**
- Database logging of job runs (ScraperRun table).
- External notifications (Slack/Email).
- Dashboard/UI for job monitoring.
- National expansion frequency (2x daily).

### Technical Considerations
- **Dependencies:** Install `@nestjs/bullmq`, `bullmq`, `@nestjs/schedule`.
- **Redis:** Ensure Redis connection is configured (already in `AppModule` but verify BullMQ setup).
- **Env Vars:** Verify REDIS_HOST/PORT availability.
