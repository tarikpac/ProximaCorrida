# Task List: Cleanup Past Events

### Task Group 1: Database Layer (Schema & Migrations)
**Goal:** Prepare the database to support "soft delete" or "archiving".

- [x] **Add `isActive` and `archivedAt` to Schema**
  - **File:** `apps/api/prisma/schema.prisma`
  - **Action:** Add fields to `Event` model.
  - **Type:** `isActive` (Boolean, default true), `archivedAt` (DateTime, optional).

- [x] **Create Migration**
  - **Command:** `npx prisma migrate dev --name add_is_active_to_events`
  - **Verify:** Check database schema.

- [x] **Generate Prisma Client**
  - **Command:** `npx prisma generate` (usually runs auto with migrate).

- [x] **Verification (Mini-Test)**
  - **Test:** Verify `Event` model in a scratchpad script or unit test creates with `isActive=true`.

---

### Task Group 2: Service Layer (Cleanup Logic & Filtering)
**Goal:** Implement the logic to identifying past events and filtering them out of standard queries.
**Dependencies:** Task Group 1

- [x] **Implement `archivePastEvents` Method**
  - **File:** `apps/api/src/events/events.service.ts`
  - **Logic:**
    - Calculate `todayStart` (00:00 BRT).
    - Update `isActive = false`, `archivedAt = now()` where `isActive = true` AND `date < todayStart`.
    - Return stats (count).
    - **Note:** Handle Timezone carefully (BRT is UTC-3).

- [x] **Update `findAll` to Filter Inactive**
  - **File:** `apps/api/src/events/events.service.ts`
  - **Logic:**
    - Add default `where: { isActive: true }` strictly.
    - Add default `date >= today` in query if no date filter provided.
  - **Exception:** Do NOT filter on `findOne` (allow direct link access).

- [x] **Unit Test Service Logic**
  - **File:** `apps/api/src/events/events.service.spec.ts` (or create new `events.cleanup.spec.ts`)
  - **Test:** Mock Prisma, call `archivePastEvents`, verify `updateMany` arguments.
  - **Test:** Call `findAll`, verify `isActive: true` is in query.

---

### Task Group 3: Scheduler Layer (Integration)
**Goal:** Hook the logic into the existing daily Cron job.
**Dependencies:** Task Group 2

- [x] **Inject `EventsService` into `ScraperScheduler`**
  - **File:** `apps/api/src/scraper/scraper.scheduler.service.ts`
  - **Action:** Add `EventsService` to constructor.

- [x] **Call Cleanup in Cron Job**
  - **File:** `apps/api/src/scraper/scraper.scheduler.service.ts`
  - **Method:** `handleCron` (@Cron('0 3 * * *'))
  - **Logic:**
    - `logger.log('Starting cleanup...')`
    - `await this.eventsService.archivePastEvents()`
    - `logger.log('Cleanup finished.')`
    - Proceed to `scraperQueue.add(...)`.

- [x] **Integration Verification**
  - **Action:** Run unit test for `ScraperSchedulerService` confirming it calls `archivePastEvents`.

---

### Task Group 4: Testing & Gap Analysis
**Goal:** Final sanity check.

- [x] **Review Timezone Logic**
  - **Check:** Ensure `getTodayStartBRT` logic correctly handles "midnight in Brazil" vs UTC. (e.g., 00:00 BRT = 03:00 UTC). `date < 00:00 BRT` means yesterday's events.

- [x] **Check `findOne` Availability**
  - **Check:** Verify `GET /events/:id` does NOT have `isActive: true` filter.

- [x] **Check "Yesterday's" Events**
  - **Scenario:** If it is 10:00 AM on Dec 7th. Event on Dec 6th (20:00).
  - **Logic:** `archivePastEvents` runs at 03:00 Dec 7th.
  - **Dec 6th < Dec 7th 00:00?** Yes.
  - **Result:** Archived. Correct.
