# Spec Requirements: Push Notification Pipeline

## Initial Description
Connect Scraper to Notification System: Scraping -> Deduplication -> Persistence -> Trigger Push for subscribers of the specific state.

## Requirements Discussion

### First Round Questions

**Q1:** I assume the notification trigger should happen **automatically** immediately after the scraper successfully identifies and saves a **new** event. Is that correct, or should there be a manual approval step or a batched daily digest?
**Answer:** Yes, automatic trigger immediately after the scraper saves a new event. No manual approval or daily digest for now.
- Scraper saves/updates the event.
- If it is truly new (insert), enqueue a notification job.
- Queue processes and sends the push.

**Q2:** I'm thinking of using **BullMQ** to handle the notification dispatching asynchronously. This would allow us to retry failed sends and not block the scraping process. Does this align with your architectural vision?
**Answer:** Totally aligned. BullMQ should be used to ensure the scraper is never blocked by notification sending. It will handle async dispatch, rate limiting, retries, backoff, and logging.

**Q3:** For **deduplication**, I assume we should only trigger a notification if the event is strictly **newly created** in the database (not updated). Is that correct?
**Answer:** Yes, exactly. Only notify when the event is created for the first time (insert), not on updates.
- Logic should reside in the persistence layer (scraper service).
- If the upsert result indicates "insert" -> enqueue notification.
- If "update" -> do nothing.
- This prevents spam from small edits and duplicate notifications.

**Q4:** Regarding the **notification content**, I assume the title should be the Event Name and the body should include the Date and Location (City/State). Clicking the notification should take the user to the Event Details page on our app. Is this the desired behavior?
**Answer:** Perfect.
- **Title:** Event Name
- **Body:** "Nova corrida em [City/State] no dia [DD/MM]: [Event Name]" or similar.
- **Click:** Opens the event details page on ProximaCorrida.
- **Payload:** Include direct URL and eventId.
- **Service Worker:** `on click -> clients.openWindow(data.url)`

**Q5:** I assume we should filter the target audience by matching the **Event's State** with the **User's State Preferences** (stored in `PushSubscription`). Is that correct?
**Answer:** Yes. Match event state with `statePreferences`.
- When a new event is created in "PB", find all subscriptions where "PB" is in `statePreferences` and send push to this group.
- Future: "All" option or Category filtering (Street, Trail), but for now just State.

**Q6:** Are there existing features in your codebase with similar patterns we should reference?
**Answer:**
- **Queue/Jobs:** Centralize jobs (notifications, email, etc.) in the same queue infrastructure (BullMQ).
- **Scraper Logic:** Reuse the scraper service's existing upsert/deduplication logic (based on sourceUrl/key) to decide if an event is new. Connect this to the queue producer.

### Existing Code to Reference

**Similar Features Identified:**
- **Scraper Service:** Logic for upserting events and detecting new vs existing.
- **BullMQ:** Use for job queue infrastructure.

### Follow-up Questions
None needed.

## Visual Assets

### Files Provided:
No visual assets provided.

## Requirements Summary

### Functional Requirements
- **Event Detection:** The system must detect when a *new* event is inserted into the database by the scraper. Updates to existing events must NOT trigger notifications.
- **Job Enqueueing:** Upon detecting a new event, a "send-push-notification" job must be added to a BullMQ queue. The job data should include the event ID and relevant details.
- **Async Processing:** A background worker must process the queue.
- **Audience Targeting:** The worker must query `PushSubscription` records to find users subscribed to the event's state (e.g., `statePreferences` includes "PB").
- **Notification Dispatch:** Send push notifications to the targeted subscriptions using `web-push`.
- **Notification Content:**
    - Title: Event Name
    - Body: "Nova corrida em [City/State] no dia [DD/MM]"
    - Data: URL to event details
- **Interaction:** Clicking the notification opens the event details page.
- **Error Handling:** Failed sends should be handled by BullMQ's retry mechanism. Expired subscriptions (410 Gone) should be removed from the database.

### Reusability Opportunities
- **Scraper Service:** Modify the existing `upsert` method in `EventsService` (or equivalent) to return whether an event was created or updated, and trigger the job if created.
- **Notifications Service:** Reuse the existing `sendNotification` method for the actual sending logic.

### Scope Boundaries
**In Scope:**
- Integration with Scraper's persistence layer.
- BullMQ setup (Producer & Consumer).
- Logic to filter subscriptions by state.
- Constructing and sending the push payload.

**Out of Scope:**
- Manual approval workflow.
- Daily/Weekly digests.
- Filtering by event category (Street vs Trail).
- "Follow All" logic (unless implemented as selecting all states).

### Technical Considerations
- **BullMQ:** Requires Redis. Ensure Redis connection is configured in the API.
- **Performance:** Fetching subscriptions for a state might involve many records. Consider pagination or batching if the user base grows significantly (though likely fine for MVP).
- **Reliability:** The scraper transaction should ideally commit *before* the job is enqueued, or the job should handle the case where the event isn't visible yet (though unlikely with standard flow).
