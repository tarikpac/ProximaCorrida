# Specification: iOS PWA Optimization

## Goal
Implement a user experience strategy to guide iOS users to install the ProximaCorrida PWA, which is a prerequisite for receiving web push notifications on iOS, and ensure technical compatibility for background notifications.

## User Stories
- As an iOS user, I want to be guided on how to install the app to my home screen so that I can enable push notifications.
- As an iOS user, I want the installation guide to appear only when I try to enable notifications, so it doesn't interrupt my browsing unnecessarily.
- As a System, I want to detect if an iOS user is not in standalone mode so I can provide the correct instructions.
- As a System, I want to ensure push notifications work reliably on iOS even when the app is in the background.

## Specific Requirements

**iOS Device Detection**
- Detect if the user is on an iOS device (iPhone, iPad, iPod) using `navigator.userAgent`.
- Detect if the app is running in the browser (not standalone) using `!window.navigator.standalone` and `matchMedia('(display-mode: standalone)').matches === false`.
- Encapsulate this logic in a reusable hook or utility (e.g., `useIOSPWA`).

**Installation Guide UI (Bottom Sheet)**
- Create a `PWAInstallGuide` component using a Bottom Sheet / Drawer pattern.
- **Content:**
    - Title: "Instale o App para Receber Notificações"
    - Step 1: "Toque no ícone de compartilhamento" (with Share icon).
    - Step 2: "Selecione 'Adicionar à Tela de Início'".
    - Step 3: "Abra o app pela tela inicial e ative as notificações".
    - Action: "Entendi" button to dismiss.
- **Style:** Occupy ~60-70% of screen height on mobile, styled with TailwindCSS (dark mode compatible).

**Trigger Logic**
- **Primary Trigger:** Intercept the "Bell" icon click in `NavbarBell`.
- **Condition:** IF (is iOS) AND (is NOT standalone) THEN show `PWAInstallGuide` INSTEAD OF `showExplainer`.
- **Persistence:**
    - If dismissed via "Entendi" or background click, save timestamp `ios_pwa_prompt_dismissed_at` to `localStorage`.
    - Do not auto-show (if auto-trigger added later) for 7 days.
    - **Crucial:** ALWAYS show on Bell click, ignoring the 7-day cooldown.

**Service Worker iOS Compatibility**
- Verify `sw.js` handles `push` events correctly for iOS.
- Ensure `notificationclick` event uses `clients.openWindow` correctly to open the app or focus an existing window, handling the `data.url` payload.
- Ensure `manifest.json` has `display: standalone`.

## Visual Design
No mockups provided.
- **Layout:** Bottom Sheet (Drawer) anchored to the bottom of the viewport.
- **Colors:** Zinc-900 background, Zinc-100 text, Lime-400 accents (consistent with existing design).
- **Icons:** Use `lucide-react` for the Share icon (square with arrow up) and others.

## Existing Code to Leverage

**`NavbarBell` (apps/web/components/notifications/navbar-bell.tsx)**
- Existing entry point for notification logic.
- Modify `handleBellClick` to include the iOS check.

**`Modal` (apps/web/components/ui/modal.tsx)**
- Reuse or adapt for the Bottom Sheet if it supports bottom positioning/animation.
- Alternatively, create a lightweight `Drawer` component using similar styling patterns.

**`usePushNotifications` (apps/web/hooks/use-push-notifications.ts)**
- Keep core subscription logic here.
- The iOS check can live here or in a new `useIOSPWA` hook.

## Out of Scope
- Android PWA installation prompts (native support is sufficient).
- Animated GIFs or complex illustrations for the guide.
- Persistent "Install App" banners on the home page.
- Changes to the actual push notification backend logic.
