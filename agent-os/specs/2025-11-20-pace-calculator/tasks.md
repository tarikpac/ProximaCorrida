# Task Breakdown: Pace Calculator

## Overview
    - Layout: Navbar, Footer, Main Container
    - Intro Text: Title + 2 paragraphs (PT-BR)
  - [x] 1.4 Implement Input Fields
    - Distance Input (number, large, touch-friendly)
    - Time Input (HH:MM:SS mask/format, large)
    - Pace Input (MM:SS mask/format, large)
    - "Calcular" Button (prominent, triggers calculation)
  - [x] 1.5 Implement Results & Prediction Table
    - Display main calculated result (Pace or Time)
    - Render table with columns: Distance | Time
    - Show rows for: 5km, 10km, 15km, 21.1km, 42.2km, 50km
  - [x] 1.6 Ensure UI tests pass
    - Run ONLY the 2-8 tests written in 1.1
    - Verify calculation logic works correctly
    - Verify UI renders without errors

**Acceptance Criteria:**
- Calculator solves for Pace (given Dist+Time) and Time (given Dist+Pace)
- Prediction table shows correct estimates for all 6 standard distances
- UI is mobile-responsive with large inputs
- "Calcular" button triggers the update (not real-time)

### Testing

#### Task Group 2: Test Review & Gap Analysis
**Dependencies:** Task Group 1

- [x] 2.0 Review and Fill Testing Gaps
  - [x] 2.1 Review tests from Task Group 1
    - Check coverage of core calculation scenarios
  - [x] 2.2 Write up to 10 additional strategic tests
    - E2E test: User visits page -> Enters 10km + 50:00 -> Clicks Calculate -> Sees 5:00/km pace
    - E2E test: User visits page -> Enters 5:00/km pace + 42.2km -> Clicks Calculate -> Sees Marathon time
    - Verify mobile layout elements are visible
  - [x] 2.3 Run feature-specific tests only
    - Run tests from 1.1 and 2.2
    - Verify complete feature stability

**Acceptance Criteria:**
- Critical E2E flows pass
- Calculation accuracy is verified
- Feature is stable and ready for deployment

## Execution Order
1. Frontend Components (Task Group 1)
2. Testing (Task Group 2)
