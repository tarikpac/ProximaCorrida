# Task Breakdown: Web Push Notifications (Core)

## Overview
Total Tasks: 13

## Task List

### Database Layer

#### Task Group 1: Data Models and Migrations
**Dependencies:** None

- [x] 1.0 Complete database layer
  - [x] 1.1 Write 2-8 focused tests for PushSubscription model
    - Test creation with valid data (endpoint, keys, statePreferences)
    - Test unique constraint on endpoint
  - [x] 1.2 Create PushSubscription model
    - Fields: id, endpoint (unique), keys (Json), statePreferences (String[]), userAgent, timestamps
    - Reuse pattern from existing models
  - [x] 1.3 Create migration for PushSubscription
    - Run `npx prisma migrate dev`
  - [x] 1.4 Ensure database layer tests pass
    - Run ONLY the tests written in 1.1

**Acceptance Criteria:**
- PushSubscription model exists in schema
- Migration applied successfully
- Tests pass

### API Layer

#### Task Group 2: Notification Service & API
**Dependencies:** Task Group 1

- [x] 2.0 Complete API layer
  - [x] 2.1 Write 2-8 focused tests for Notifications API
    - Test `POST /notifications/subscribe` creates/updates subscription
    - Test `POST /notifications/preferences` retrieves preferences
    - Test `sendNotification` service method (mocking web-push)
  - [x] 2.2 Configure Web Push & Environment
    - Install `web-push` and types
    - Add `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` to ConfigService
    - Create `generateVapidKeys` utility script (optional, for dev convenience)
  - [x] 2.3 Create NotificationsService
    - Implement `sendNotification(subscription, payload)`
    - Implement `upsertSubscription(data)`
  - [x] 2.4 Create NotificationsController
    - `POST /notifications/subscribe`: Upsert subscription
    - `POST /notifications/preferences`: Get preferences by endpoint
    - `POST /notifications/test`: Trigger test notification (dev only)
  - [x] 2.5 Ensure API layer tests pass
    - Run ONLY the tests written in 2.1

**Acceptance Criteria:**
- API endpoints functional
- Service can send notifications via web-push (mocked in tests)
- VAPID keys configured correctly

### Frontend Components

#### Task Group 3: UI & Service Worker
**Dependencies:** Task Group 2

- [x] 3.0 Complete UI components
  - [x] 3.1 Write 2-8 focused tests for UI components
    - Test `usePushNotifications` hook state changes
    - Test `Bell` icon click interaction
    - Test `PreferencesModal` rendering and save action
  - [x] 3.2 Implement Service Worker
    - Create `public/sw.js`
    - Handle `push` event (showNotification)
    - Handle `notificationclick` event (open URL)
  - [x] 3.3 Create `usePushNotifications` hook
    - Manage permission state
    - Handle subscription logic (`pushManager.subscribe`)
    - API integration for subscribe/preferences
  - [x] 3.4 Create UI Components
    - `NavbarBell`: Icon with badge logic
    - `ExplainerModal`: "Ativar Notificações"
    - `PreferencesModal`: State multi-select
  - [x] 3.5 Ensure UI component tests pass
    - Run ONLY the tests written in 3.1

**Acceptance Criteria:**
- Service Worker registers and handles push events
- User can subscribe and select states
- UI matches design system (Zinc/Lime)

### Testing

#### Task Group 4: Test Review & Gap Analysis
**Dependencies:** Task Groups 1-3

- [x] 4.0 Review existing tests and fill critical gaps only
  - [x] 4.1 Review tests from Task Groups 1-3
    - Check coverage of subscription flow and preference updates
  - [x] 4.2 Analyze test coverage gaps for THIS feature only
    - Focus on E2E flow: Bell Click -> Subscribe -> Save Preferences
  - [x] 4.3 Write up to 10 additional strategic tests maximum
    - E2E test for the full subscription flow (mocking PushManager if needed)
  - [x] 4.4 Run feature-specific tests only
    - Run tests from 1.1, 2.1, 3.1, and 4.3
    - Verify critical workflows pass

**Acceptance Criteria:**
- Full subscription flow verified
- Notifications trigger correctly (mocked)
- Preferences are saved and retrieved correctly

## Execution Order
1. Database Layer (Task Group 1)
2. API Layer (Task Group 2)
3. Frontend Components (Task Group 3)
4. Testing (Task Group 4)
