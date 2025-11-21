# Specification: Push Notification Pipeline

## Goal
Implement an automated pipeline that triggers push notifications immediately after a new event is scraped and saved to the database, using BullMQ for asynchronous processing and deduplication logic to ensure only new events trigger alerts.

## User Stories
- As a **System**, I want to detect when a new event is inserted so that I can trigger a notification job.
- As a **System**, I want to process notification jobs asynchronously so that the scraper is not blocked.
- As a **Subscriber**, I want to receive a push notification when a new race is added in my preferred state so that I can register early.
- As a **System**, I want to retry failed notifications automatically so that temporary network issues don't cause delivery failures.

## Specific Requirements

**Event Detection & Job Enqueueing**
- Modify `EventsService.upsertBySourceUrl` to return an indication of whether the event was inserted (new) or updated.
- If the event is **new** (inserted), enqueue a job named `send-push-notification` to the `notifications` queue.
- The job payload must include: `eventId`, `eventTitle`, `eventDate`, `eventCity`, `eventState`.
- Do NOT enqueue jobs for updated events.

**BullMQ Configuration**
- Configure `BullModule` in `AppModule` (or a dedicated `QueueModule`) to connect to Redis.
- Ensure Redis connection details are loaded from environment variables (`REDIS_HOST`, `REDIS_PORT`).
- Register the `notifications` queue.

**Notification Processor (Consumer)**
- Create a `NotificationsProcessor` class decorated with `@Processor('notifications')`.
- Implement a `@Process('send-push-notification')` method to handle the job.
- The processor must:
    1.  Receive the job data (event details).
    2.  Query `PrismaService` to find all `PushSubscription` records where `statePreferences` contains the event's state.
    3.  Iterate through subscriptions and call `NotificationsService.sendNotification` for each.
    4.  Log success/failure counts.

**Notification Content & Behavior**
- **Title:** Event Title.
- **Body:** "Nova corrida em [City]/[State] no dia [DD/MM]".
- **Data:** `{ url: '/events/[id]', eventId: [id] }`.
- **Icon/Badge:** Use standard app icons.
- **Interaction:** Clicking the notification must open the event details page (handled by existing Service Worker logic).

**Error Handling & Reliability**
- Configure BullMQ with default retry attempts (e.g., 3 retries with exponential backoff).
- Handle `410 Gone` errors by deleting the subscription (already implemented in `NotificationsService`, ensure it's used).
- Log any other errors without crashing the worker.

## Visual Design
No visual assets provided. The notification will use the system's standard push notification UI.

## Existing Code to Leverage

**`EventsService` (apps/api/src/events/events.service.ts)**
- Reuse `upsertBySourceUrl` logic.
- Modify lines 223-247 (Insert block) to trigger the queue.

**`NotificationsService` (apps/api/src/notifications/notifications.service.ts)**
- Reuse `sendNotification` method (lines 53-68) which handles `web-push` sending and `410` cleanup.

**`PushSubscription` Model (apps/api/prisma/schema.prisma)**
- Use `statePreferences` field for filtering subscribers.

**`@nestjs/bullmq`**
- Library is already installed. Use standard decorators (`@Processor`, `@Process`, `@InjectQueue`).

## Out of Scope
- Manual approval of notifications.
- Daily or weekly digest emails/notifications.
- Filtering by event category (e.g., Trail vs. Street) - State only for now.
- "Follow All" logic (users must select specific states).
- UI for viewing past notifications (Notification Center).
