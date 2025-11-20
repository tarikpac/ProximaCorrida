# Spec Requirements: Advanced Search & Filters

## Initial Description
Implement advanced search and filtering capabilities for the event listing. This includes filtering by State, Region, City, Date, Distance, and Event Type, along with a global text search. The feature must be mobile-first, URL-state synchronized, and integrated with the existing backend and frontend architecture.

## Requirements Discussion

### First Round Questions

**Q1:** Scope of Filters: Should we also include "Event Type" or "Organizer"?
**Answer:** Yes, include "Event Type" as a structured filter (checkboxes) aligned with existing UI chips (5K, 10K, 15K, 21K, 42K, Trail Run, Caminhada). Organizer does NOT need to be a structured filter MVP; it will be covered by global text search.

**Q2:** Location Logic: Dependent dropdowns or free-text?
**Answer:** Hierarchical logic:
- Region (Optional high-level filter: N, NE, CO, SE, S)
- State (Primary geo filter, syncs with URL/Hero)
- City (Dependent on State, uses Autocomplete/Typeahead, no huge static dropdowns).

**Q3:** Date Filtering: Presets or range picker?
**Answer:** Combination:
- Presets: "This weekend", "Next 7 days", "Next 30 days", "This month".
- Advanced: Custom date range picker (From/To).
- UI: Hero shows summary, detailed selection in drawer.

**Q4:** Distance Logic: Slider or checkboxes?
**Answer:** Standard distance checkboxes (5K, 10K, 15K, 21K, 42K). No slider for now. Connected to existing quick filter chips.

**Q5:** Global Search Bar: Yes/No?
**Answer:** Yes, global text search across Event Title, City, Organizer, and future tags. Combined with structured filters.

**Q6:** Mobile UI: Drawer or horizontal chips?
**Answer:** Mobile-first approach:
- "Filter" button opens full-height slide-over drawer/modal with all detailed filters.
- Main list shows horizontal chips summarizing active filters (State, Date Preset, collapsed Distances/Types).
- Hero component acts as primary entry point.

**Q7:** URL State: Sync with query params?
**Answer:** Yes, all filters reflected in URL query params (e.g., `/br/pb?city=jp&distances=10k`).
- Filter changes update URL.
- Loading URL pre-populates filters.
- State segment `/br/[state]` syncs with Hero and State filter.

### Existing Code to Reference

**Similar Features Identified:**
- **Frontend:**
    - `app/page.tsx`: Composes Navbar, Hero, Marquee, EventGrid.
    - `Hero` component: Contains visual layout for Onde/Quando/Distância and quick filter chips.
    - `EventGrid` & `EventCard`: Display logic, currently fetches from `/events`.
    - `EventList` (older): Uses React Query pattern to be reused.
- **Backend:**
    - `schema.prisma`: Event model (id, title, date, city, state, distances, etc.).
    - `events.controller.ts`: Exposes `GET /events`.
    - `events.service.ts`: Uses SupabaseService. Needs extension for search/filter logic.

### Follow-up Questions
None needed. Requirements are very detailed and clear.

## Visual Assets

### Files Provided:
No visual assets provided (Bash check failed/returned no files).

### Visual Insights:
- User described "Brutalist" components and existing UI chips.
- Mobile-first slide-over drawer pattern requested.
- Horizontal chips for active filters on main list.

## Requirements Summary

### Functional Requirements
- **Global Text Search:** Filter by title, city, organizer.
- **Structured Filters:**
    - **Location:** Region (optional) -> State (required) -> City (autocomplete).
    - **Date:** Presets (Weekend, 7 days, 30 days, Month) + Custom Range (Start/End).
    - **Distance:** Checkboxes (5K, 10K, 15K, 21K, 42K).
    - **Event Type:** Checkboxes (Road, Trail, Walk, etc. - derived from distances/tags).
- **URL Synchronization:** Full state persistence in URL (path for state, query params for others).
- **Mobile UI:** Filter Drawer + Active Filter Chips.

### Reusability Opportunities
- **Frontend:**
    - Reuse `Hero` component for filter entry point.
    - Reuse `EventCard` for results.
    - Reuse TanStack Query pattern from `EventList`.
- **Backend:**
    - Extend `EventsController.findAll` to accept new DTO.
    - Extend `EventsService` to build dynamic Supabase queries.

### Scope Boundaries
**In Scope:**
- Advanced filtering logic (Frontend + Backend).
- UI implementation (Drawer, Chips, Search Bar).
- URL state management.
- Integration with existing Event model.

**Out of Scope:**
- Organizer structured filter (checkboxes).
- Distance slider.
- User accounts/saved searches (for now).

### Technical Considerations
- **Language:** All user-facing text must be in Brazilian Portuguese (pt-BR).
- **Stack:** Next.js 16 (App Router), TailwindCSS v4, NestJS 11, Supabase/Postgres.
- **Performance:** City autocomplete should be efficient (likely distinct query on DB).
- **SEO:** URL structure `/br/[state]` is critical.
