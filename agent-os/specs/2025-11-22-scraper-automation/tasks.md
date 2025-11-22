# Task Breakdown: Scraper Automation

## Overview
Total Tasks: 3

## Task List

### Backend Infrastructure

#### Task Group 1: BullMQ & Cron Setup
**Dependencies:** None

- [x] 1.0 Implement Scraper Automation Infrastructure
  - [x] 1.1 Write 2-8 focused tests for Scraper Automation
    - Test that `ScraperSchedulerService` adds a job to the queue when triggered
    - Test that `ScraperProcessor` calls `ScraperService.scrapeEvents`
    - Test that `ScraperProcessor` handles errors gracefully (logging)
    - Mock `ScraperService` and `Queue` for isolation
  - [x] 1.2 Configure BullMQ
    - Install `@nestjs/bullmq` and `bullmq`
    - Configure `BullModule.forRoot` in `AppModule` using Redis env vars
    - Register `BullModule.registerQueue({ name: 'scraper' })` in `ScraperModule`
  - [x] 1.3 Implement Scraper Processor
    - Create `ScraperProcessor` class with `@Processor('scraper')`
    - Implement `@Process('runScraper')` method
    - Inject `ScraperService` and call `scrapeEvents`
    - Add logging for start, success (with count), and failure
  - [x] 1.4 Configure Cron Scheduler
    - Install `@nestjs/schedule`
    - Configure `ScheduleModule.forRoot()` in `AppModule`
    - Create `ScraperSchedulerService`
    - Add `@Cron('0 3 * * *')` method to add `runScraper` job to queue
    - Configure job options: 3 retries, exponential backoff (30s)
  - [x] 1.5 Ensure Scraper Automation tests pass
    - Run ONLY the 2-8 tests written in 1.1
    - Verify queue interaction and processor logic

**Acceptance Criteria:**
- BullMQ configured and connected to Redis
- Scraper job queue created
- Cron triggers job at 3 AM daily
- Processor executes scraper service
- Retries and backoff configured correctly

### Testing

#### Task Group 2: Test Review & Gap Analysis
**Dependencies:** Task Group 1

- [x] 2.0 Review existing tests and fill critical gaps only
  - [x] 2.1 Review tests from Task Group 1
    - Review the tests written in 1.1 (Automation Logic)
  - [x] 2.2 Analyze test coverage gaps for THIS feature only
    - Focus on integration: Does the Cron triggers the Queue? (Can be tested via manual trigger or e2e test if possible, but unit test of Scheduler is usually sufficient)
  - [x] 2.3 Write up to 10 additional strategic tests maximum
    - Add integration test: Trigger the scheduler manually and verify job is added to queue (using a mock queue or real redis in e2e)
  - [x] 2.4 Run feature-specific tests only
    - Run ONLY tests related to this spec's feature
    - Verify critical automation workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass
- Automation logic is verified

## Execution Order

Recommended implementation sequence:
1. Backend Infrastructure (Task Group 1)
2. Test Review & Gap Analysis (Task Group 2)
