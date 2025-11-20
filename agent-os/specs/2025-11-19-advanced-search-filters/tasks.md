# Task Breakdown: Advanced Search & Filters

## Overview
Total Tasks: 4 Task Groups

## Task List

### API Layer

#### Task Group 1: API & Service Logic
**Dependencies:** None

- [x] 1.0 Implement Advanced Search Logic
  - [x] 1.1 Write 2-8 focused tests for Search Logic
    - Test `EventsService.findAll` with various filter combinations (state, city, date range, distances)
    - Test text search query generation (partial match, case insensitive)
  - [x] 1.2 Create `SearchEventsDto`
    - Fields: `state` (string), `city` (string), `from` (Date), `to` (Date), `distances` (string[]), `types` (string[]), `query` (string), `page` (number), `limit` (number)
    - Add validation using `class-validator` (e.g., `IsOptional`, `IsDateString`, `IsArray`)
  - [x] 1.3 Update `EventsController.findAll`
    - Accept `SearchEventsDto` as `@Query()`
    - Pass DTO to service layer
  - [x] 1.4 Extend `EventsService.findAll`
    - Implement dynamic query building using Supabase/Prisma
    - Handle text search (title, city, organizer) using `ilike` or equivalent
    - Handle date range filtering (`gte`, `lte`)
    - Handle array filtering for distances and types
    - Implement pagination
  - [x] 1.5 Ensure API tests pass
    - Run ONLY the 2-8 tests written in 1.1
    - Verify all filter combinations return expected results

**Acceptance Criteria:**
- `GET /events` accepts all new query parameters
- Database queries are constructed correctly based on filters
- Text search works for title, city, and organizer
- Pagination works correctly with filters

### Frontend Components

#### Task Group 2: UI Components & State
**Dependencies:** Task Group 1

- [x] 2.0 Build Filter UI Components
  - [x] 2.1 Write 2-8 focused tests for Filter Components
    - Test `FilterDrawer` opening/closing
    - Test `FilterChips` rendering based on active state
    - Test URL update on filter change
  - [x] 2.2 Create `FilterDrawer` Component
    - Slide-over modal implementation (Mobile-first)
    - Sections: Location (State/City), Date (Presets/Range), Distance (Checkboxes), Type (Checkboxes)
    - Integrate `Hero` "Onde/Quando" buttons to open drawer
  - [x] 2.3 Implement `ActiveFilterChips`
    - Horizontal scrollable list of active filters
    - "Clear All" functionality
    - Individual chip removal
  - [x] 2.4 Implement `GlobalSearchBar`
    - Input field for text search
    - Debounce input updates
  - [x] 2.5 Integrate URL State Management
    - Create hook `useEventFilters` to sync state with URL query params
    - Ensure `/br/[state]` path updates correctly
    - Hydrate state from URL on initial load
  - [x] 2.6 Ensure UI tests pass
    - Run ONLY the 2-8 tests written in 2.1
    - Verify drawer interactions and URL syncing

**Acceptance Criteria:**
- Filter Drawer opens/closes and displays all options
- Active filters are shown as chips
- URL updates immediately upon filter changes
- Back/Forward browser navigation restores filter state

#### Task Group 3: Integration & Search Results
**Dependencies:** Task Group 2

- [x] 3.0 Integrate Search with Event Listing
  - [x] 3.1 Write 2-8 focused tests for Integration
    - Test `useEvents` hook with filter parameters
    - Test empty state (no results found)
  - [x] 3.2 Update `useEvents` Hook
    - Accept filter object from `useEventFilters`
    - Pass params to API call
  - [x] 3.3 Update `EventGrid` / Home Page
    - Display loading state while fetching filtered results
    - Display "No events found" message with "Clear Filters" action
    - Ensure pagination works with current filters
  - [x] 3.4 Implement City Autocomplete
    - Fetch distinct cities based on selected State
    - Filter local list or async fetch as user types
  - [x] 3.5 Ensure Integration tests pass
    - Run ONLY the 2-8 tests written in 3.1
    - Verify end-to-end flow from Filter -> URL -> API -> Grid

**Acceptance Criteria:**
- Changing filters updates the event list
- Loading and Empty states are handled gracefully
- City autocomplete shows relevant options

### Testing

#### Task Group 4: Test Review & Gap Analysis
**Dependencies:** Task Groups 1-3

- [x] 4.0 Review and Fill Testing Gaps
  - [x] 4.1 Review tests from Groups 1-3
    - Check coverage of critical user flows (e.g., "Find 5k in PB next weekend")
  - [x] 4.2 Write up to 10 additional strategic tests
    - E2E test: User lands on home -> Opens Drawer -> Selects State -> Sees URL update -> Sees filtered results
    - E2E test: User searches for "Maratona" -> Sees results matching text
  - [x] 4.3 Run feature-specific tests only
    - Run all tests from 1.1, 2.1, 3.1, and 4.2
    - Verify complete feature stability

**Acceptance Criteria:**
- Critical E2E flows pass
- Feature is stable and ready for deployment
