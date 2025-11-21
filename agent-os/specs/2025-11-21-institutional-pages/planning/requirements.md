# Spec Requirements: Institutional Pages

## Initial Description
Create "About/How it Works" page (trust/SEO) and "All States" page (`/estados`) with summary cards for national expansion.

## Requirements Discussion

### First Round Questions

**Q1:** I assume the "About/How it Works" page should be a single page (`/sobre` or `/about`) that combines the project mission, how the scraper works (transparency), and maybe a contact section. Is that correct, or should they be separate pages?
**Answer:** Single page `/sobre`. Content should focus on:
- Mission (based on `mission.md`)
- How it helps the runner (benefits, not technical implementation)
- How to use (search, filters, notifications, calculator)
- Contact section (placeholder/email)
- NO mention of scraping or technical details.

**Q2:** For the "All States" page (`/estados`), I'm thinking of a grid of cards representing each state (flag + name + event count), linking to the filtered view (e.g., `/br/pb`). Should we display all 27 states immediately, or only those with active events?
**Answer:** Show ALL 27 states.
- Grid of cards.
- Content: Sigla (PB, PE...), Name, Event Count.
- Link: `/br/[UF]`.
- States with 0 events: Show "0 corridas" or "Em breve", style slightly dimmed but clickable.

**Q3:** I assume these pages should be statically generated (SSG) for maximum SEO performance since the content (especially "About") rarely changes. Is that acceptable?
**Answer:** Yes.
- `/sobre`: Pure SSG.
- `/estados`: SSG with ISR (e.g., revalidate every 1h). Backend should aggregate counts during build/revalidate.

**Q4:** For the "About" page content, do you have specific copy/text ready, or should I use placeholders based on the `mission.md` content?
**Answer:** Use `mission.md` as a base for the copy.
- Sections: "Nossa missão", "Como o ProximaCorrida te ajuda", "Para quem é", "Fale com a gente".

**Q5:** Should the "All States" page include a search bar to filter states by name, or is a simple grid sufficient given the number of states (27)?
**Answer:** No search bar needed for MVP. Simple grid is sufficient.

**Q6:** Are there any specific SEO requirements for these pages beyond standard meta tags (title, description, OpenGraph)?
**Answer:** Standard best practices.
- Unique Title/Description.
- H1 hierarchy.
- Internal linking (Navbar/Footer -> /sobre, /estados; /estados -> /br/[UF]).

**Q7:** Reusability check?
**Answer:**
- Reuse Navbar and Footer.
- Reuse `EventCard` styling/feeling for `StateCard` (border, hover, typography).
- Reuse Page Layout structure (Hero-style title, centered content).
- Backend: Reuse `Event` table `state` column. Create new service method for `SELECT state, COUNT(*)`.

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Event Card - Path: `apps/web/components/ui/event-card.tsx`
- Feature: Routing - Path: `apps/web/app/[country]/[state]/page.tsx` (Already handles `/br/[state]`)
- Feature: Navbar/Footer - Path: `apps/web/components/ui/navbar.tsx`, `apps/web/components/ui/footer.tsx`

## Visual Assets

### Files Provided:
No visual assets provided.

## Requirements Summary

### Functional Requirements
- **Page `/sobre`**:
  - Static content explaining the platform's value proposition.
  - Sections: Mission, Benefits, Target Audience, Contact.
  - SEO optimized.
- **Page `/estados`**:
  - Grid displaying all 27 Brazilian states.
  - Each card shows State Code, Name, and Count of upcoming events.
  - Clicking a card navigates to `/br/[state_code]`.
  - Handles "empty" states gracefully (visual indication).

### Reusability Opportunities
- **UI**: `StateCard` should inherit design tokens/styles from `EventCard`.
- **Layout**: Use existing Main Layout (Navbar + Footer).
- **Routing**: Leverage existing `[country]/[state]` dynamic route structure.

### Scope Boundaries
**In Scope:**
- Creation of `/sobre` page (Frontend).
- Creation of `/estados` page (Frontend).
- Backend endpoint/method to get event counts by state.
- Integration of state counts into `/estados` (ISR).

**Out of Scope:**
- Search/Filter on `/estados` page.
- Dynamic "About" content (CMS).
- Implementation of `/br/[state]` route (already exists).

### Technical Considerations
- **SSG/ISR**: Critical for SEO and performance.
- **Backend**: Efficient aggregation query (`GROUP BY state`) to avoid fetching all events.
- **Design**: Must maintain "Premium" aesthetic (dark mode, neon accents).
