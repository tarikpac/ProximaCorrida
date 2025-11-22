# Spec Requirements: iOS PWA Optimization

## Initial Description
iOS PWA Optimization — Implement UX strategy to guide iOS users to install the PWA (required for Push) and ensure the Service Worker handles background notifications.

## Requirements Discussion

### First Round Questions

**Q1:** Detection Strategy (detectar iOS não standalone)
**Answer:** Detect iOS via userAgent (iPhone / iPad / iPod) AND confirm it is NOT in standalone mode (`!window.navigator.standalone` and/or `matchMedia('(display-mode: standalone)').matches === false`). If already PWA (standalone), do not show anything.

**Q2:** Trigger Timing (quando mostrar o guia)
**Answer:** 
- **Primary (Option B):** Show ONLY when the user tries to enable notifications (clicks the bell icon). Instead of requesting permission immediately (which would fail or do nothing on iOS browser), show the "Add to Home Screen" guide explaining it's necessary for notifications.
- **Future/Optional:** A discreet banner on first visit ("For a full experience..."), but for this MVP, focus on the bell interaction.

**Q3:** UI Component (formato do guia)
**Answer:** 
- **Format:** Bottom sheet / Drawer (mobile standard).
- **Design:** Occupy ~60-70% of height. Title + short text + list of steps + "Understood" button.
- **Reasoning:** Modern UX, doesn't block full screen, fits the step-by-step instructions well.

**Q4:** Instructions Content (conteúdo visual)
**Answer:** 
- **Content:** Clear text + simple icons.
- **Steps:**
    1. Tap the Share icon in Safari (square with arrow up).
    2. Select "Add to Home Screen".
    3. Open ProximaCorrida from the home screen icon.
    4. Return here and enable notifications.
- **Visuals:** Optional static image illustrating the share button. No animated GIFs for MVP.

**Q5:** Persistence (quando esconder / reexibir)
**Answer:** 
- **Dismissal:** If user closes/dismisses, do not show again in the same session.
- **LocalStorage:** Save `ios_pwa_prompt_dismissed_at` timestamp. Do not auto-prompt again for at least 7 days.
- **Exception:** If user clicks the bell icon again, ALWAYS show the guide, regardless of the 7-day timer, as it is an intentional action.

**Q6:** Service Worker / iOS bugs
**Answer:** General requirement to ensure compatibility. Ensure `self.registration.showNotification(...)` works and `clients.openWindow(...)` correctly handles `data.url` in `notificationclick` event when the app is closed or in background on iOS.

### Existing Code to Reference

**Similar Features Identified:**
- **Modal/Bottom Sheet:** Reuse the existing component used for "Sharing Fallback" and "Notification Preferences" (State Selection).
- **Component Name:** `NavbarBell` (likely contains the modal logic) or a generic `Dialog`/`Sheet` component from the UI library.

### Follow-up Questions
None needed. Requirements are clear.

## Visual Assets

### Files Provided:
No visual assets provided.

## Requirements Summary

### Functional Requirements
- **Device Detection:** Accurately identify iOS users (iPhone/iPad) who are accessing via browser (not standalone).
- **Interception:** Intercept the "Enable Notifications" (bell click) action on iOS browser.
- **Installation Guide:** Display a Bottom Sheet with step-by-step instructions to install the PWA.
- **Persistence Logic:** Implement 7-day cooldown for auto-prompts (if implemented later) or general dismissal, but ALWAYS override cooldown if user explicitly clicks the bell.
- **Service Worker Compatibility:** Verify and adjust `sw.js` to ensure push notifications work reliably on iOS (background/closed state).

### Reusability Opportunities
- **UI Components:** Reuse existing `Dialog`, `Sheet`, or `Drawer` components used in `NavbarBell` or `ShareButton`.
- **Styles:** Use existing Tailwind classes for the guide layout.

### Scope Boundaries
**In Scope:**
- iOS detection logic.
- "Add to Home Screen" Bottom Sheet UI.
- Logic to show guide on Bell click (iOS browser only).
- LocalStorage logic for dismissal persistence.
- Service Worker verification for iOS.

**Out of Scope:**
- Android PWA installation prompts (Android has native support).
- Animated GIFs or complex graphics for the guide.
- Persistent "Install App" banner on the home page (for now).

### Technical Considerations
- **iOS Specifics:** `window.navigator.standalone` is a non-standard property specific to iOS.
- **PWA Manifest:** Ensure `manifest.json` is correctly configured for standalone mode (display: standalone).
- **Testing:** Requires testing on actual iOS device or Simulator to verify detection and PWA behavior.
