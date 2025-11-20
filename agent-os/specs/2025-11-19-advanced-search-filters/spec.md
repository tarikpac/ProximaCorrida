# Specification: Advanced Search & Filters

## Goal
Implement a comprehensive, mobile-first search and filtering system for race events, enabling users to filter by location (State/City), date, distance, and event type, with full URL synchronization for shareability and SEO.

## User Stories
- As a runner, I want to filter races by my state and city so I can find events near me.
- As a runner, I want to filter by distance (e.g., 5k, 21k) so I can find races that match my training goals.
- As a user, I want to search for specific events or organizers by name so I can quickly find a race I heard about.
- As a mobile user, I want to easily access filters via a drawer and see my active filters as chips so I can refine my search on the go.

## Specific Requirements

**Global Text Search**
- Implement a search bar that queries Event Title, City, and Organizer fields.
- Support partial matches and case-insensitive search.
- Integrate seamlessly with structured filters (e.g., "Night Run" in "PB").

**Hierarchical Location Filtering**
- **State (Required):** Primary filter, synced with URL path `/br/[state]` (e.g., `/br/pb`).
- **Region (Optional):** Helper filter (N, NE, CO, SE, S) to narrow down the state list.
- **City (Dependent):** Autocomplete input listing only cities with events in the selected state.

**Date Filtering Logic**
- **Presets:** "Este fim de semana", "Próximos 7 dias", "Próximos 30 dias", "Este mês".
- **Custom Range:** Date picker for Start Date and End Date.
- **Default:** Show future events by default if no date filter is applied.

**Distance & Type Filtering**
- **Distances:** Checkboxes for standard distances: 5K, 10K, 15K, 21K, 42K.
- **Event Types:** Checkboxes for types: Road, Trail, Walk (derived from tags/distances).
- **Logic:** OR logic within category (e.g., 5K OR 10K), AND logic between categories.

**URL Synchronization & SEO**
- **Path:** `/br/[state]` for state-level SEO landing pages.
- **Query Params:** Sync all other filters (city, from, to, distances, types, query) to URL.
- **Hydration:** App must read URL params on load and pre-fill the filter state.

**Mobile-First UI Components**
- **Filter Drawer:** Slide-over modal containing all detailed filter controls (Location, Date, Distance, Type).
- **Active Chips:** Horizontal scrollable chips on the event list summarizing active filters.
- **Hero Integration:** The existing "Onde/Quando/Distância" block in Hero triggers the filter drawer.

**Backend Search API**
- Extend `GET /events` to accept a comprehensive DTO: `state`, `city`, `from`, `to`, `distances[]`, `types[]`, `query`.
- Implement dynamic query building in `EventsService` using Supabase/Prisma.
- Ensure efficient indexing for text search and filtering.

**Language & Localization**
- All UI labels, placeholders, and error messages must be in **Brazilian Portuguese (pt-BR)**.
- Date formats must be `DD/MM/YYYY`.

## Visual Design
*No visual assets provided. Follow existing "Brutalist" design system.*

**Existing UI Patterns**
- **Hero Component:** Use as the primary filter entry point.
- **Chips:** Replicate the style of existing quick filter chips for the active filter display.
- **Drawer:** Implement a standard mobile slide-over drawer (right or bottom) matching the site's aesthetic.

## Existing Code to Leverage

**Frontend Components**
- `apps/web/app/page.tsx`: Main entry point, to be updated with filter state management.
- `apps/web/components/Hero.tsx`: Reuse visual layout, wire up "Onde/Quando" buttons to open drawer.
- `apps/web/components/EventCard.tsx`: Reuse for displaying search results.
- `apps/web/hooks/useEvents.ts` (or similar): Adapt React Query hook to accept filter params.

**Backend Services**
- `apps/api/src/events/events.controller.ts`: Update `findAll` to accept `SearchEventsDto`.
- `apps/api/src/events/events.service.ts`: Extend `findAll` method to build complex Supabase queries.
- `apps/api/prisma/schema.prisma`: Use existing `Event` model fields.

## Out of Scope
- User accounts and saving search preferences.
- "Organizer" as a structured checkbox filter (text search only).
- Distance slider (checkboxes only).
- Map view of events.
- Internationalization (English support).
