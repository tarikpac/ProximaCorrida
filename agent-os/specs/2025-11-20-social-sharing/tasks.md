# Task Breakdown: Social Sharing

## Overview
Total Tasks: 11

## Task List

### Frontend Components

#### Task Group 1: UI Foundation (Modal & Toast)
**Dependencies:** None

- [x] 1.0 Create reusable UI components
  - [x] 1.1 Write 2-8 focused tests for Modal and Toast
    - Test Modal renders children and handles close
    - Test Toast displays message and auto-dismisses
  - [x] 1.2 Create generic `Modal` component
    - Props: `isOpen`, `onClose`, `title`, `children`
    - Style: Centered overlay, backdrop blur, close button
  - [x] 1.3 Create generic `Toast` system
    - Context/Provider for global access
    - `useToast` hook with `showToast(message, type)`
    - Component to render active toasts (fixed position)
  - [x] 1.4 Ensure UI foundation tests pass
    - Run ONLY the tests written in 1.1
    - Verify components render and behave as expected

**Acceptance Criteria:**
- Modal component works with backdrop click close
- Toast system allows triggering notifications from anywhere
- Tests pass for basic rendering and interaction

#### Task Group 2: Share Logic & Components
**Dependencies:** Task Group 1

- [x] 2.0 Implement Share feature
  - [x] 2.1 Write 2-8 focused tests for Share logic
    - Test `shareEvent` calls `navigator.share` if available
    - Test `shareEvent` opens modal if `navigator.share` is missing (mock)
    - Test "Copy Link" triggers clipboard write and toast
  - [x] 2.2 Create `ShareModal` component
    - Uses generic `Modal` from Task 1.2
    - Displays social buttons: WhatsApp, Telegram, X, Facebook, Copy Link
    - Implements "Copy Link" logic with `navigator.clipboard` + `useToast`
  - [x] 2.3 Create `ShareButton` component
    - Props: `eventData` (title, text, url, city, date)
    - Logic: Check `navigator.share` -> Native Share OR Open `ShareModal`
    - UI: Renders `Share2` icon (variant for Card vs Details)
  - [x] 2.4 Integrate into Event Details Page
    - Add `ShareButton` to the header/info area
  - [x] 2.5 Integrate into Event Card
    - Add `ShareButton` (small variant) to `EventCard` component
  - [x] 2.6 Ensure Share logic tests pass
    - Run ONLY the tests written in 2.1
    - Verify sharing flow works for both mobile (mocked) and desktop

**Acceptance Criteria:**
- `ShareButton` adapts behavior based on device capabilities
- Native share triggers on mobile
- Fallback modal opens on desktop
- All social links open correctly
- "Copy Link" works and shows feedback

### Testing

#### Task Group 3: Test Review & Gap Analysis
**Dependencies:** Task Groups 1-2

- [x] 3.0 Review and Fill Testing Gaps
  - [x] 3.1 Review tests from Task Groups 1-2
    - Check coverage of Modal, Toast, and Share logic
  - [x] 3.2 Write up to 10 additional strategic tests
    - E2E test: User opens Event Details -> Clicks Share -> Sees Modal (Desktop view)
    - E2E test: User clicks Copy Link -> Sees Toast
    - Verify Share button visibility on Event Cards
  - [x] 3.3 Run feature-specific tests only
    - Run tests from 1.1, 2.1, and 3.2
    - Verify complete feature stability

**Acceptance Criteria:**
- Critical E2E flows pass
- Share functionality verified on both Card and Details views
- UI components (Modal/Toast) verified in context

## Execution Order
1. UI Foundation (Task Group 1)
2. Share Logic & Components (Task Group 2)
3. Testing (Task Group 3)
