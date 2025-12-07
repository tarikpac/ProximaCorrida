# Specification: Cleanup Past Events

## Goal
To maintain database performance and ensure relevance of search results by automatically soft-deleting events that occurred in the past (before today).

## User Stories
- As a **Runner**, I want to see only upcoming events on the timeline so that I don't waste time clicking on races that have already happened.
- As a **System Administrator**, I want the system to automatically archive past events daily so that I don't have to manage them manually.
- As a **User with a direct link**, I want to be able to access a past event's details so that I can see the information even after it has occurred.

## Specific Requirements

**Database Model Update**
- Add `isActive` boolean column to `Event` table (default: `true`).
- Add `archivedAt` timestamp column to `Event` table (nullable).
- Create a Prisma migration to apply these changes.

**Cleanup Service Logic**
- Implement `archivePastEvents()` in `EventsService`.
- Logic: Find all events where `date < today (00:00:00 BRT)` AND `isActive = true`.
- Update these events: set `isActive = false` and `archivedAt = now()`.
- Return the count of archived events for logging.

**Scheduling**
- Modify `ScraperSchedulerService` to inject `EventsService`.
- In the `@Cron('0 3 * * *')` handler, call `await this.eventsService.archivePastEvents()` *before* triggering the scraper job.
- Log the number of events archived.

**API List Filtering**
- Update `EventsService.findAll()` method.
- Add default filter condition: `{ isActive: true, date: { gte: today } }`.
- Ensure this default applies only when no conflicting filters are present (though "past" events should essentially be hidden from standard search unless explicitly requested in the future).
- For this spec, simply enforce that `findAll` excludes inactive events.

**API Detail View**
- Ensure `EventsService.findOne()` does **NOT** filter by `isActive`.
- It must return the event record by ID regardless of its status.

## Visual Design
No visual assets provided. This is a backend-only feature.

## Existing Code to Leverage

**`EventsService` (apps/api/src/events/events.service.ts)**
- Existing service for manipulating events.
- Will add `archivePastEvents` method here.
- Will modify `findAll` method here to include `isActive` check.

**`ScraperSchedulerService` (apps/api/src/scraper/scraper.scheduler.service.ts)**
- Existing cron job at usually 03:00 AM.
- Use this to trigger the cleanup logic.

**Prisma Schema**
- Current `Event` model will be extended.

## Out of Scope
- Hard deleting event records (physical deletion).
- UI changes (frontend will naturally stop showing past events since the API won't return them).
- "Include Past Events" toggle in the frontend/API (reserved for future).
