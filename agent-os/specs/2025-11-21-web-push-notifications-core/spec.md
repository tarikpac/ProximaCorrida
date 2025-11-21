# Specification: Web Push Notifications (Core)

## Goal
Implement the core infrastructure for Web Push Notifications, enabling users to subscribe to race alerts and select their preferred states, powered by a NestJS backend and Service Worker.

## User Stories
- As a user, I want to click a "Bell" icon in the navbar to enable notifications so I can stay updated on new races.
- As a user, I want to select specific states (e.g., PB, PE) to follow so I only receive relevant alerts.
- As a user, I want to receive a system notification when a new race is added in my selected states, even if the site is closed.
- As a user, I want to be able to update my state preferences at any time.

## Specific Requirements

**1. Database Schema (Prisma)**
- Create `PushSubscription` model in `schema.prisma`.
- Fields: `id` (UUID), `endpoint` (String, unique), `keys` (Json: p256dh, auth), `statePreferences` (String[]), `userAgent` (String?), `createdAt` (DateTime), `updatedAt` (DateTime).
- Run migration to update the database.

**2. Backend: Notification Service**
- Install `web-push` library (`npm install web-push @types/web-push`).
- Create `NotificationsService` in NestJS.
- Implement `sendNotification(subscription, payload)` method.
- Implement `generateVapidKeys()` utility (for dev setup).
- Configure `ConfigService` to load `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` from environment variables.

**3. Backend: Subscription API**
- Create `NotificationsController`.
- `POST /notifications/subscribe`: Accepts subscription object + state preferences. Upserts based on `endpoint`.
- `GET /notifications/preferences`: Returns current preferences for a given endpoint (passed via query or body, since no auth). *Correction: Since we can't easily send endpoint in GET without exposing it, we might use POST for fetching preferences or just rely on the client state for MVP.* -> Decision: `POST /notifications/preferences` to fetch/update preferences using the endpoint as key.
- `POST /notifications/test`: (Dev only) Trigger a test notification to a specific subscription.

**4. Frontend: Service Worker**
- Create/Update `public/sw.js` (or `service-worker.js`).
- Implement `push` event listener: Parse JSON payload, call `self.registration.showNotification`.
- Implement `notificationclick` event listener: Close notification, open `event.notification.data.url`.
- Ensure SW is registered in `layout.tsx` or a dedicated hook.

**5. Frontend: Subscription Logic**
- Create `usePushNotifications` hook.
- Manage `permission` state (default, granted, denied).
- Manage `subscription` state (null or PushSubscription object).
- Functions: `subscribeToPush()`, `updatePreferences(states)`, `unsubscribe()`.
- Handle VAPID public key conversion (`urlBase64ToUint8Array`).

**6. Frontend: UI Components**
- **Navbar Bell:** Add `Bell` icon from `lucide-react`. Show badge if notifications enabled (optional MVP).
- **Explainer Modal:** Reusable `Modal` component. Title: "Ativar Notificações". Body: Text explaining benefits. Action: "Ativar".
- **Preferences Modal:** Reusable `Modal` component. Title: "Preferências de Alerta". Body: Multi-select grid of states (PB, PE, RN, etc.). Action: "Salvar".
- **Flow:** Bell Click -> (if no sub) Explainer -> (on confirm) Request Permission -> (on grant) Subscribe -> Preferences -> Save.
- **Flow:** Bell Click -> (if sub exists) Preferences -> Save.

**7. Environment Configuration**
- Generate VAPID keys.
- Add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to frontend `.env.local`.
- Add `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` (mailto) to backend `.env`.

## Visual Design
No mockups provided. Use existing design system:
- **Modals:** Use `components/ui/modal.tsx` (Zinc-900 bg, White text, rounded-xl).
- **Buttons:** Lime-400 for primary actions, Zinc-800 for secondary.
- **State Selection:** Grid of toggleable buttons or a clean multi-select list.

## Existing Code to Leverage

**`components/ui/modal.tsx`**
- Use this exact component for both Explainer and Preferences modals.
- It handles `isOpen`, `onClose`, backdrop, and animations.

**`apps/web/components/ui/navbar.tsx`**
- Add the Bell icon button here, alongside the existing "Menu mobile" trigger or desktop links.

**`apps/web/hooks/use-events.ts`**
- Reference how API calls are made (using `fetch` or `axios` wrapper if exists) to implement the subscription API calls.

## Out of Scope
- User authentication/login (subscriptions are anonymous).
- "I'm Going" / Attendance tracking.
- Automated scraping pipeline integration (this spec only builds the *capability* to send/receive, not the automated trigger).
- Analytics dashboard.
- Email notifications.
