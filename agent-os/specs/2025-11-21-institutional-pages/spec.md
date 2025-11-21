# Specification: Institutional Pages

## Goal
Create "About" (`/sobre`) and "All States" (`/estados`) pages to improve trust, SEO, and national navigation, providing users with project context and a directory of race events by state.

## User Stories
- As a new user, I want to read about the project's mission and benefits so that I understand how it helps me find races.
- As a runner planning a trip, I want to see a list of all states with event counts so that I can quickly find races in a specific region.
- As a user, I want to easily navigate to my state's page from a central directory.

## Specific Requirements

**Page: /sobre (About)**
- Implement a static page at `/sobre` using Next.js App Router.
- Use `mission.md` content to populate sections: "Nossa Missão", "Como Ajuda", "Para Quem É", "Contato".
- Ensure pure Static Site Generation (SSG) for optimal SEO.
- Include proper metadata (Title: "Sobre o ProximaCorrida...", Description).
- Layout: Full-width hero title, centered content, standard Navbar/Footer.

**Page: /estados (All States)**
- Implement a page at `/estados` displaying a grid of all 27 Brazilian states.
- Use Incremental Static Regeneration (ISR) with a 1-hour revalidation period.
- Fetch state event counts from the backend during build/revalidation.
- Display a grid of `StateCard` components.

**Component: StateCard**
- Create a reusable `StateCard` component based on `EventCard` aesthetics (dark mode, borders, hover effects).
- Display: State Flag/Icon (optional) or just Sigla (PB, SP), State Name, and "X corridas".
- Visual State: Dimmed/Grayed out if 0 events (but still clickable).
- Interaction: Click navigates to `/br/[state_code]`.

**Backend: State Aggregation**
- Implement a service method in NestJS to query `Event` table.
- Execute `SELECT state, COUNT(*) FROM events GROUP BY state` (or Prisma equivalent).
- Expose this data via a public API endpoint for the frontend build process.

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**EventCard Component**
- `apps/web/components/ui/event-card.tsx`
- Reuse the container styling, border colors, and hover animations for `StateCard`.

**Main Layout**
- `apps/web/app/layout.tsx` & `Navbar`/`Footer`
- Ensure new pages use the standard application layout.

**Dynamic Routing**
- `apps/web/app/[country]/[state]/page.tsx`
- The target destination `/br/[state]` already exists; ensure links match this pattern.

**Event Service**
- `apps/api/src/events/events.service.ts` (assumed path)
- Add the aggregation logic here to reuse the Prisma client injection.

## Out of Scope
- Search bar or filtering on the `/estados` page.
- CMS integration for the `/sobre` page content.
- Changes to the existing `/br/[state]` event listing page.
- User authentication or "logged in" specific views for these pages.
