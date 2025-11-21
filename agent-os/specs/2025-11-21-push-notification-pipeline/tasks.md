# Task Breakdown: Push Notification Pipeline

## Overview
Total Tasks: 4

## Task List

### API Layer

#### Task Group 1: BullMQ Configuration & Infrastructure
**Dependencies:** None

- [x] 1.0 Configure BullMQ and Redis
  - [x] 1.1 Write 2-8 focused tests for Queue Configuration
    - Test that BullModule can connect to Redis (mocked)
    - Test that the 'notifications' queue is registered
  - [x] 1.2 Configure BullModule in AppModule
    - Import `BullModule.forRoot` with Redis connection details from env
    - Register `BullModule.registerQueue({ name: 'notifications' })`
  - [x] 1.3 Ensure infrastructure tests pass
    - Run ONLY the 2-8 tests written in 1.1
    - Verify queue registration works

**Acceptance Criteria:**
- BullMQ is configured and connected to Redis
- 'notifications' queue is available for injection
- Tests pass

#### Task Group 2: Notification Processor (Consumer)
**Dependencies:** Task Group 1

- [x] 2.0 Implement Notification Processor
  - [x] 2.1 Write 2-8 focused tests for NotificationsProcessor
    - Test `process` method calls `NotificationsService.sendNotification`
    - Test filtering subscriptions by state
    - Test error handling (logging)
  - [x] 2.2 Create `NotificationsProcessor` class
    - Decorate with `@Processor('notifications')`
    - Inject `NotificationsService` and `PrismaService`
  - [x] 2.3 Implement `handleSendPushNotification` method
    - Decorate with `@Process('send-push-notification')`
    - Query `PushSubscription` where `statePreferences` has event state
    - Loop and send notifications using `NotificationsService`
    - Format notification payload (Title, Body, URL)
  - [x] 2.4 Ensure processor tests pass
    - Run ONLY the 2-8 tests written in 2.1
    - Verify logic for filtering and sending

**Acceptance Criteria:**
- Processor correctly picks up jobs
- Subscriptions are filtered by state
- Notifications are sent via `NotificationsService`
- Tests pass

#### Task Group 3: Event Detection & Enqueueing (Producer)
**Dependencies:** Task Group 2

- [x] 3.0 Integrate Event Detection
  - [x] 3.1 Write 2-8 focused tests for EventsService Enqueueing
    - Test that `upsertBySourceUrl` adds job to queue ONLY on insert
    - Test that `upsertBySourceUrl` does NOT add job on update
  - [x] 3.2 Modify `EventsService`
    - Inject `@InjectQueue('notifications')`
    - Update `upsertBySourceUrl` to detect 'insert' vs 'update'
    - On insert: `await this.notificationsQueue.add('send-push-notification', eventData)`
  - [x] 3.3 Ensure producer tests pass
    - Run ONLY the 2-8 tests written in 3.1
    - Verify queue interaction

**Acceptance Criteria:**
- New events trigger a background job
- Updated events do NOT trigger a job
- Job payload contains correct event details
- Tests pass

### Testing

#### Task Group 4: Test Review & Gap Analysis
**Dependencies:** Task Groups 1-3

- [x] 4.0 Review existing tests and fill critical gaps only
  - [x] 4.1 Review tests from Task Groups 1-3
    - Review the tests written in 1.1, 2.1, and 3.1
  - [x] 4.2 Analyze test coverage gaps for THIS feature only
    - Focus on the end-to-end flow: Scraper -> Service -> Queue -> Processor -> Push
  - [x] 4.3 Write up to 10 additional strategic tests maximum
    - Add integration test simulating the full pipeline (mocking Redis/WebPush)
  - [x] 4.4 Run feature-specific tests only
    - Run ONLY tests related to this spec's feature
    - Verify critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass
- Critical pipeline workflow is verified
