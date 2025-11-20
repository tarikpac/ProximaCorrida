# Specification: Pace Calculator

## Goal
Create a mobile-first "Calculadora de Pace" tool that allows runners to calculate pace or time based on distance, and view finish time predictions for standard race distances.

## User Stories
- As a runner, I want to calculate my pace based on a target distance and time so that I know how fast I need to run.
- As a runner, I want to calculate my finish time based on a target distance and pace so that I can set a realistic goal.
- As a runner, I want to see predicted finish times for common race distances (5k, 10k, 21k, 42k) based on my current pace so that I can plan my season.

## Specific Requirements

**Calculation Logic**
- Implement "Solve for X" logic:
  - Input Distance + Time -> Calculate Pace
  - Input Distance + Pace -> Calculate Time
- Trigger calculation ONLY when the user clicks the "Calcular" button (no real-time updates on keystroke).
- Support Metric units only (km, min/km) for this version.

**User Interface**
- Create a top-level route `/calculadora-pace`.
- Implement a mobile-first design with large, touch-friendly input fields for Distance, Time (hh:mm:ss), and Pace (min/km).
- Display a clear "Calcular" button to trigger the action.
- Show results (Calculated Pace or Time) clearly below the inputs.
- Include the specified PT-BR introductory text (Title + 2 paragraphs) at the top of the page.

**Prediction Table**
- Display a table below the main results showing predicted finish times for:
  - 5 km
  - 10 km
  - 15 km
  - 21.1 km (Half Marathon)
  - 42.2 km (Marathon)
  - 50 km
- Update this table whenever the main calculation runs.

**Validation & State**
- Handle invalid time formats (e.g., 99:99:99) gracefully with user-friendly error messages.
- Use local state (React `useState`) for managing inputs and results (no global store needed).
- Ensure inputs are easily tappable on mobile devices (min-height 44px).

## Visual Design
No visual assets provided.
- Follow the "tool-like" aesthetic: clean, focused, high contrast.
- Use the existing project color scheme and typography (Inter/Tailwind).

## Existing Code to Leverage

**`apps/web/components/ui/navbar.tsx`**
- Reuse the Navbar component for consistent site navigation.
- Add a link to "Calculadora" if appropriate, or ensure it's accessible via URL.

**`apps/web/components/ui/footer.tsx`**
- Reuse the Footer component for consistent site layout.

**`apps/web/app/layout.tsx`**
- Ensure the new page uses the main root layout.

## Out of Scope
- Imperial units (miles, min/mile).
- Real-time calculation on every keystroke.
- User accounts or saving calculation history.
- Social sharing of results.
- 1km, 3km, or 1 mile predictions.
