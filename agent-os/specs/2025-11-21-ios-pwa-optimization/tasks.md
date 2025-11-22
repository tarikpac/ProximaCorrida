# Task Breakdown: iOS PWA Optimization

## Overview
Total Tasks: 4

## Task List

### Frontend Components

#### Task Group 1: iOS Detection & Hooks
**Dependencies:** None

- [x] 1.0 Implement iOS Detection Logic
  - [x] 1.1 Write 2-8 focused tests for `useIOSPWA` hook
    - Test detection of iOS user agent (iPhone/iPad)
    - Test detection of standalone mode (true/false)
    - Test persistence logic (localStorage timestamp)
  - [x] 1.2 Create `useIOSPWA` hook
    - Implement `isIOS` check using `navigator.userAgent`
    - Implement `isStandalone` check using `navigator.standalone` and `matchMedia`
    - Implement `shouldShowPrompt` logic with 7-day cooldown check
    - Implement `dismissPrompt` function to save timestamp
  - [x] 1.3 Ensure hook tests pass
    - Run ONLY the 2-8 tests written in 1.1
    - Verify detection logic works as expected

**Acceptance Criteria:**
- Hook correctly identifies iOS devices
- Hook correctly identifies standalone mode
- Cooldown logic works (7 days)
- Tests pass

#### Task Group 2: Installation Guide UI
**Dependencies:** Task Group 1

- [x] 2.0 Build PWA Install Guide Component
  - [x] 2.1 Write 2-8 focused tests for `PWAInstallGuide`
    - Test component renders correctly
    - Test "Entendi" button calls onDismiss
    - Test steps are displayed
  - [x] 2.2 Create `PWAInstallGuide` component
    - Implement Bottom Sheet / Drawer layout (fixed bottom, slide-up animation)
    - Add Title: "Instale o App para Receber Notificações"
    - Add Steps with Icons (Share icon, Add to Home icon)
    - Add "Entendi" button
    - Style with TailwindCSS (Zinc-900 bg, Lime-400 accents)
  - [x] 2.3 Ensure UI tests pass
    - Run ONLY the 2-8 tests written in 2.1
    - Verify component rendering and interaction

**Acceptance Criteria:**
- Component matches visual description (Bottom Sheet)
- All steps and icons are present
- Dismiss action works
- Tests pass

#### Task Group 3: Integration & Trigger Logic
**Dependencies:** Task Group 2

- [x] 3.0 Integrate Guide with NavbarBell
  - [x] 3.1 Write 2-8 focused tests for `NavbarBell` integration
    - Test that clicking Bell on iOS (browser) shows `PWAInstallGuide`
    - Test that clicking Bell on Android or iOS (standalone) shows standard flow
    - Test that clicking Bell ALWAYS overrides the 7-day cooldown
  - [x] 3.2 Modify `NavbarBell` component
    - Integrate `useIOSPWA` hook
    - Update `handleBellClick` logic:
      - IF `isIOS` AND `!isStandalone`: Show `PWAInstallGuide`
      - ELSE: Proceed with existing `showExplainer` or `showPreferences` logic
    - Render `PWAInstallGuide` conditionally
  - [x] 3.3 Ensure integration tests pass
    - Run ONLY the 2-8 tests written in 3.1
    - Verify correct flow for iOS vs others

**Acceptance Criteria:**
- Bell click on iOS browser triggers Install Guide
- Bell click on other devices/modes triggers standard flow
- Cooldown is ignored for explicit Bell clicks
- Tests pass

### Service Worker

#### Task Group 4: Service Worker & Manifest Verification
**Dependencies:** None

- [x] 4.0 Verify and Update Service Worker / Manifest
  - [x] 4.1 Review and Update `manifest.json`
    - Ensure `display` is set to `standalone`
    - Verify icons are present for iOS
  - [x] 4.2 Review and Update `sw.js` (or equivalent)
    - Verify `push` event listener exists
    - Verify `notificationclick` handles `clients.openWindow`
    - Ensure `data.url` is correctly extracted and used for navigation
  - [x] 4.3 Manual Verification (since automated SW testing is complex)
    - Document verification steps for iOS Simulator/Device
    - Confirm background notification handling

**Acceptance Criteria:**
- `manifest.json` has `display: standalone`
- Service Worker code handles `notificationclick` with `openWindow`
- Logic verified to be correct for iOS background handling

### Testing

#### Task Group 5: Test Review & Gap Analysis
**Dependencies:** Task Groups 1-3

- [x] 5.0 Review existing tests and fill critical gaps only
  - [x] 5.1 Review tests from Task Groups 1-3
    - Review the tests written in 1.1, 2.1, and 3.1
  - [x] 5.2 Analyze test coverage gaps for THIS feature only
    - Focus on the user flow: Bell Click -> iOS Check -> Guide -> Dismiss
  - [x] 5.3 Write up to 10 additional strategic tests maximum
    - Add integration test simulating the full flow
  - [x] 5.4 Run feature-specific tests only
    - Run ONLY tests related to this spec's feature
    - Verify critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass
- Critical user workflow is verified
