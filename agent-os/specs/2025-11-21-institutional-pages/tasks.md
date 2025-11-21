# Task Breakdown: Institutional Pages

## Overview
Total Tasks: 11

## Task List

### Backend Layer

#### Task Group 1: API & Data Aggregation
**Dependencies:** None

- [x] 1.0 Implement State Aggregation Logic
  - [x] 1.1 Write 2-8 focused tests for State Aggregation
    - Test `getEventsByStateCount` returns correct structure (state code, count)
    - Test handling of states with 0 events
  - [x] 1.2 Implement `getEventsByStateCount` in Events Service
    - Use Prisma `groupBy` or raw query to count events per state
    - Return format: `{ state: string, count: number }[]`
  - [x] 1.3 Create API Endpoint for State Counts
    - Route: `GET /events/stats/by-state` (or similar)
    - Public access (no auth required)
  - [x] 1.4 Ensure API tests pass
    - Run ONLY the tests written in 1.1
    - Verify endpoint returns expected JSON structure

**Acceptance Criteria:**
- API returns list of all states with their respective event counts
- States with 0 events are handled correctly (either returned with 0 or handled by frontend if omitted)
- Tests pass

### Frontend Components

#### Task Group 2: UI Components & Pages
**Dependencies:** Task Group 1

- [x] 2.0 Create Institutional Pages
  - [x] 2.1 Write 2-8 focused tests for UI Components
    - Test `StateCard` renders correctly with given props
    - Test `StateCard` handles "0 events" visual state
    - Test `/sobre` page renders main sections
  - [x] 2.2 Create `StateCard` Component
    - Props: `stateCode` (string), `name` (string), `count` (number)
    - Style: Based on `EventCard` (dark theme, border, hover effect)
    - Logic: Dimmed style if count === 0
    - Link: Wraps content in `Link` to `/br/[stateCode]`
  - [x] 2.3 Implement `/estados` Page
    - Fetch data from new API endpoint (Task 1.3)
    - Use `revalidate` (ISR) set to 3600 (1 hour)
    - Render Grid of `StateCard`s for all 27 states
    - Handle loading/empty states if necessary
  - [x] 2.4 Implement `/sobre` Page
    - Route: `app/sobre/page.tsx`
    - Content: Static sections based on `mission.md` (Mission, Benefits, Target, Contact)
    - Layout: Full width hero, centered text content
    - SEO: Add metadata (title, description)
  - [x] 2.5 Ensure UI tests pass
    - Run ONLY the tests written in 2.1
    - Verify pages build and render without errors

**Acceptance Criteria:**
- `/estados` displays 27 cards with correct counts
- `/sobre` displays correct static content
- `StateCard` matches design system aesthetics
- Navigation works correctly

### Testing

#### Task Group 3: Test Review & Gap Analysis
**Dependencies:** Task Groups 1-2

- [x] 3.0 Review and Fill Testing Gaps
  - [x] 3.1 Review tests from Task Groups 1-2
    - Check coverage of API aggregation and UI rendering
  - [x] 3.2 Write up to 10 additional strategic tests
    - E2E test: User navigates from Home -> Estados -> Specific State
    - E2E test: User navigates from Home -> Sobre
    - Verify SEO tags are present on new pages
  - [x] 3.3 Run feature-specific tests only
    - Run tests from 1.1, 2.1, and 3.2
    - Verify complete feature stability

**Acceptance Criteria:**
- Critical navigation flows verified
- SEO metadata verified
- Pages load correctly in production build (simulated)

## Execution Order
1. Backend Layer (Task Group 1)
2. Frontend Components (Task Group 2)
3. Testing (Task Group 3)
