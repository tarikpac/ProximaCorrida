# Spec Requirements: Pace Calculator

## Initial Description
Create a dedicated "Calculadora de Pace" page with real-time conversion (Pace/Time/Speed), standard distance predictions, and mobile-first UI.

## Requirements Discussion

### First Round Questions

**Q1:** I assume you want a flexible "solve for X" calculator where the user can input any two variables (e.g., Time & Distance) to calculate the third (Pace), OR input Pace & Distance to get Time. Is that correct, or should it be a simpler "Input Pace -> See Predictions" tool?
**Answer:** Yes, I want a flexible “solve for X” calculator:
- If the user inputs Distance + Time → calculate Pace
- If the user inputs Distance + Pace → calculate Time
The “prediction table” below should always be based on the current pace (whether the user typed it directly or it was derived from Distance + Time).

**Q2:** I assume the "standard distance predictions" table should automatically show finish times for common races like 5km, 10km, 21km, and 42km. Should we include other distances (e.g., 1km, 3km, 15km, 1 mile)?
**Answer:** The prediction table should automatically show finish times for the following standard race distances:
- 5 km
- 10 km
- 15 km
- 21,1 km (Half Marathon)
- 42,2 km (Marathon)
- 50 km (for ultramarathon context)
We don’t need 1 km, 3 km or 1 mile in the first version – those can be added later if needed.

**Q3:** I assume "real-time" means the results update immediately as the user types, without requiring a "Calculate" button. Is that correct?
**Answer:** I do not want full real-time recalculation on every keystroke.
Instead, I prefer a flow similar to Strava’s:
1. The user fills the fields (pace + distance, or time + distance)
2. Then explicitly presses a “Calcular” button
3. Only after that, we update:
    - the main result (pace/time)
    - the prediction table
(If you want to add a small debounce or auto-update later it’s fine, but the main UX assumption is: explicit Calculate button, not continuous realtime.)

**Q4:** I assume the default units will be Metric (km, min/km). Do we need to support Imperial units (miles, min/mile) in this initial version?
**Answer:** For the initial version:
Only Metric units:
- Distance → km
- Pace → min/km
- Speed (if shown) → km/h
No need to support miles or min/mile in this release.
We can structure the code so it’s easy to add Imperial later, but it should not appear in the UI now.

**Q5:** I assume this page should be a top-level route (e.g., `/calculadora` or `/tools/pace`) accessible from the main navigation menu. Is that the preferred location?
**Answer:** Yes, this should be a top-level route, for example:
`/calculadora-pace`
And it should be accessible from the main navigation (e.g. a “Calculadora de Pace” item, possibly under a “Ferramentas / Tools” section in the future).

**Q6:** I'm thinking of a mobile-first design with large, touch-friendly input fields (similar to a currency converter). Should we prioritize this "tool-like" aesthetic over a standard form layout?
**Answer:** I want a mobile-first, tool-like design (similar to a currency converter or Strava’s calculator), not a generic long form.
So:
- Large, touch-friendly input fields
- Clear grouping of:
    - Distance
    - Time (hh:mm:ss)
    - Pace (min/km)
- Results and prediction table clearly separated below the inputs
Layout clean and focused on usability on phones, then adapted to desktop.

**Q7:** Explanation / intro text for the tool (inspired by Strava)
**Answer:** I want a short explanatory section at the top of the page, similar to Strava’s style: a title, 1–2 short paragraphs explaining what the tool does and how to use it.
You can use this PT-BR copy as the content:
*Título:* Calculadora de ritmo de corrida
*Texto introdutório:*
Use a calculadora de ritmo para descobrir em quanto tempo você completa diferentes distâncias de corrida com base no seu pace.
Basta informar seu ritmo ou o tempo de uma prova e a distância desejada para ver o tempo estimado de chegada e uma tabela com previsões para provas populares como 5 km, 10 km, meia maratona, maratona e 50 km.
This intro should appear above the inputs (title + 1–2 paragraphs), matching the overall visual style of the site.

### Existing Code to Reference
No similar existing features identified for reference.

### Follow-up Questions
None needed. The requirements are very clear.

## Visual Assets

### Files Provided:
No visual assets provided.

## Requirements Summary

### Functional Requirements
- **Calculator Logic:**
  - Solve for Pace given Distance + Time.
  - Solve for Time given Distance + Pace.
  - Trigger calculation on "Calcular" button press.
- **Prediction Table:**
  - Display estimated finish times for: 5km, 10km, 15km, 21.1km, 42.2km, 50km.
  - Based on the calculated/input pace.
- **Units:** Metric only (km, min/km, km/h).
- **Routing:** Top-level route `/calculadora-pace`.

### Reusability Opportunities
- **Input Components:** Can likely reuse or adapt existing form inputs, but need specific styling for "large, touch-friendly" tool aesthetic.
- **Layout:** Standard page layout (Header/Footer) but with a focused "tool" container.

### Scope Boundaries
**In Scope:**
- Mobile-first UI with large inputs.
- "Calcular" button flow.
- Specific PT-BR intro text.
- Metric units only.

**Out of Scope:**
- Imperial units (miles).
- Real-time calculation (on keystroke).
- User accounts/saving history (not mentioned, assumed stateless).
- Social sharing of results (not mentioned in this specific spec, though in roadmap).

### Technical Considerations
- **State Management:** Local state (React `useState`) is sufficient; no need for global store or URL state for this simple tool unless sharing is added later.
- **Validation:** Need to handle invalid time formats (e.g., 99:99:99) gracefully.
- **Responsiveness:** Critical. Inputs must be easily tappable on mobile.
