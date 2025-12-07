# Spec Requirements: Cleanup Past Events

## Initial Description
Create a scheduled cron job (running daily) to identify and soft-delete/archive events that occurred in the past (e.g., date < yesterday) to keep the database optimized and search results relevant.

## Requirements Discussion

### First Round Questions

**Q1:** Mechanism – Soft delete ou apagar de verdade?
**Answer:** Soft delete. Add fields `isActive` (boolean, default true) and `archivedAt` (timestamptz | null). The cleanup routine sets `isActive = false` and `archivedAt = now()`. This preserves history for analytics and allows future "past races" display.

**Q2:** Threshold – O que é “evento passado”?
**Answer:** `date < hoje (00:00 BRT)`. Example: Running at 03:00 on Dec 6th archives everything up to Dec 5th (inclusive).

**Q3:** Visibilidade – Como se comporta na API?
**Answer:**
- `GET /events` (default): Should NOT return archived events. Default filter: `isActive = true AND date >= today`.
- `GET /events/:id`: MUST continue to return the event even if archived/inactive (for SEO and old links).
- Future considerations (not MVP): `includePast=true` query param.

**Q4:** Schedule – Quando rodar?
**Answer:** 03:00 AM BRT. Ideally reuse `ScraperSchedulerService` to run cleanup *before* fetching new data.

**Q5:** Retention – Precisa de hard delete?
**Answer:** Out of scope for now. Only soft-delete is needed for this MVP.

**Q6:** Existing Code Reuse?
**Answer:**
- **Scheduler:** Reuse `ScraperSchedulerService` in `ScraperModule`.
- **Event Model:** Need to add columns `isActive` and `archivedAt` via migration.
- **Service Logic:** Update `EventsService.findAll` to implement the default filter (`isActive=true`, `date >= today`).

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Scraper Scheduler - Path: `apps/api/src/scraper/scraper.scheduler.service.ts`
- Backend logic to reference: `EventsService` (probably in `apps/api/src/events/events.service.ts`) needs updating.

### Follow-up Questions
None needed. Requirements are very clear.

## Visual Assets

### Files Provided:
No visual assets provided.

## Requirements Summary

### Functional Requirements
1.  **Database Migration:** Add `isActive` (boolean, default true) and `archivedAt` (datetime, nullable) to the `Event` table/model.
2.  **Cleanup Logic:** Implement a service method `archivePastEvents()` that finds all events where `date < today (00:00 BRT)` and sets `isActive=false`, `archivedAt=now()`.
3.  **Scheduling:** Schedule the cleanup job to run daily at 03:00 AM BRT (using existing `ScraperSchedulerService`).
4.  **API Filtering:**
    - Update `GET /events` to exclude inactive/past events by default.
    - Ensure `GET /events/:id` acts as a direct permalink and still returns the event regardless of status.

### Reusability Opportunities
- Hooks into the existing Cron/BullMQ architecture used for scraping.
- Extends the existing `EventsService` rather than creating a new silo.

### Scope Boundaries
**In Scope:**
- Soft-delete implementation.
- API list filtering update.
- Cron job configuration.

**Out of Scope:**
- Hard deletion of old data.
- UI for "Past Events" (filtering is purely backend for now).
- Exposed API filters for clients to request past events explicitly (internal logic only for now, though code structure should permit it).

### Technical Considerations
- **Timezones:** Critical to ensure "today" is calculated based on Brazil time (UTC-3), not UTC or server time, to avoid archiving events that are happening "today".
- **Performance:** `date` column should likely be indexed if it isn't already, but `isActive` filtering is cheap.
- **Playwright/Docker:** No impact, this is purely database/API logic.
