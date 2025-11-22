# Task Breakdown: Responsive Navigation & Layout

## Overview
Total Tasks: 3

## Task List

### Frontend Components

#### Task Group 1: Responsive Header & Mobile Menu
**Dependencies:** None

- [x] 1.0 Implement Responsive Header & Mobile Menu
  - [x] 1.1 Write 2-8 focused tests for Header/Navbar
    - Test that hamburger menu appears on mobile (< md)
    - Test that full navigation appears on desktop (>= md)
    - Test that clicking hamburger opens the mobile drawer
    - Test that clicking close button/overlay closes the drawer
    - Test active link styling logic
  - [x] 1.2 Refactor Navbar Component
    - Update `apps/web/src/components/ui/navbar.tsx`
    - Implement sticky positioning logic (verify existing)
    - Add hamburger button for mobile
    - Add inline navigation for desktop
    - Implement active state logic (`text-lime-400` + border)
  - [x] 1.3 Implement Mobile Navigation Drawer
    - Create side drawer structure (slide-in from right)
    - Add overlay background with click-to-close
    - Add close button ("X")
    - List navigation items vertically
    - Add smooth transitions (`transition-transform`)
  - [x] 1.4 Ensure Header/Navbar tests pass
    - Run ONLY the 2-8 tests written in 1.1
    - Verify responsive behavior and interactions

**Acceptance Criteria:**
- Header is sticky
- Mobile shows hamburger, Desktop shows full menu
- Mobile menu slides in from right and closes correctly
- Active links are highlighted correctly

#### Task Group 2: Footer Expansion
**Dependencies:** None

- [x] 2.0 Expand Footer Content
  - [x] 2.1 Write 2-8 focused tests for Footer
    - Test that all new links are present (Sobre, Estados, etc.)
    - Test that social icons are present
    - Test responsive layout (stacking on mobile if needed)
  - [x] 2.2 Update Footer Component
    - Update `apps/web/src/components/ui/footer.tsx`
    - Add links: Sobre, Estados, Área do Organizador, Termos, Privacidade
    - Add Social Icons (Instagram) using `lucide-react`
    - Style according to "light brutalism" (uppercase, mono, tracking)
  - [x] 2.3 Ensure Footer tests pass
    - Run ONLY the 2-8 tests written in 2.1
    - Verify content and layout

**Acceptance Criteria:**
- Footer contains all specified links
- Social icons are displayed
- Layout is responsive and matches design system

### Testing

#### Task Group 3: Test Review & Gap Analysis
**Dependencies:** Task Groups 1-2

- [x] 3.0 Review existing tests and fill critical gaps only
  - [x] 3.1 Review tests from Task Groups 1-2
    - Review the tests written in 1.1 (Header)
    - Review the tests written in 2.1 (Footer)
  - [x] 3.2 Analyze test coverage gaps for THIS feature only
    - Focus on navigation flow: Can a user navigate from Home to other pages via both Mobile and Desktop menus?
  - [x] 3.3 Write up to 10 additional strategic tests maximum
    - Add E2E test for navigation flow (Home -> Page -> Verify URL/Active State)
    - Verify mobile menu interaction in E2E (Open -> Click Link -> Verify Navigation + Menu Close)
  - [x] 3.4 Run feature-specific tests only
    - Run ONLY tests related to this spec's feature
    - Verify critical navigation workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass
- Navigation flows verified on both mobile and desktop viewports

## Execution Order

Recommended implementation sequence:
1. Responsive Header & Mobile Menu (Task Group 1)
2. Footer Expansion (Task Group 2)
3. Test Review & Gap Analysis (Task Group 3)
