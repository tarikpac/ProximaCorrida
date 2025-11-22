# Task Breakdown: Organizer Submission Flow

## Overview
Total Tasks: 3

## Task List

### Frontend Components

#### Task Group 1: UI Implementation & Integration
**Dependencies:** None

- [x] 1.0 Implement Organizer Page & Navigation
  - [x] 1.1 Write 2-8 focused tests for Organizer Page
    - Test that the page renders the main title "Divulgue sua corrida no ProximaCorrida"
    - Test that the Google Form iframe (or fallback button) is present
    - Test that the benefits section is displayed
    - Test that the "How it works" steps are visible
  - [x] 1.2 Create Configuration File
    - Create `src/config/constants.ts` (if not exists)
    - Add `GOOGLE_FORM_URL` constant with placeholder value
  - [x] 1.3 Create `/organizador` Page
    - Implement `apps/web/app/organizador/page.tsx`
    - Use standard layout (Navbar, Footer, Main Container)
    - Implement Hero Section with Title & Subtitle
    - Implement Benefits Section (reuse `FeatureCard` pattern if applicable or create simple list)
    - Implement "How it Works" Section (3 steps with icons)
    - Implement Google Form Embed (iframe) with responsive styling
    - Add Fallback/Mobile CTA Button ("Preencher Formulário") linking to `GOOGLE_FORM_URL`
    - Add SEO Metadata (Title, Description)
  - [x] 1.4 Update Navigation
    - Verify/Update `Navbar` component: Ensure "ORGANIZADOR" link points to `/organizador`
    - Verify/Update Mobile Menu in `Navbar`: Ensure "ORGANIZADOR" link points to `/organizador`
    - Update `Footer` component: Add "Área do Organizador" link pointing to `/organizador`
  - [x] 1.5 Ensure UI tests pass
    - Run ONLY the 2-8 tests written in 1.1
    - Verify page renders correctly with all sections
    - Verify navigation links are correct

**Acceptance Criteria:**
- `/organizador` page is accessible and responsive
- Google Form is embedded and/or accessible via button
- Navigation links (Navbar, Mobile, Footer) work correctly
- Tests pass

### Testing

#### Task Group 2: Test Review & Gap Analysis
**Dependencies:** Task Group 1

- [ ] 2.0 Review existing tests and fill critical gaps only
  - [ ] 2.1 Review tests from Task Group 1
    - Review the tests written in 1.1
  - [ ] 2.2 Analyze test coverage gaps for THIS feature only
    - Focus on the user flow: Navigation -> Page Load -> Form Interaction (iframe load/button click)
  - [ ] 2.3 Write up to 10 additional strategic tests maximum
    - Add integration test verifying navigation from Home to Organizer page
  - [ ] 2.4 Run feature-specific tests only
    - Run ONLY tests related to this spec's feature
    - Verify critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass
- Critical user workflow is verified

## Execution Order

Recommended implementation sequence:
1. UI Implementation & Integration (Task Group 1)
2. Test Review & Gap Analysis (Task Group 2)
