# Product Roadmap

1. [x] **Advanced Search & Filters** — Implement filtering by State, Region, City, Date, and Distance to support the national database. `M`
2. [x] **Pace Calculator** — Create a dedicated "Calculadora de Pace" page with real-time conversion (Pace/Time/Speed), standard distance predictions, and mobile-first UI. `S`
3. [x] **Social Sharing** — Implement a generic share button using Web Share API for mobile and a modal fallback (Copy Link, WhatsApp, Telegram) for desktop. `S`
4. [x] **Institutional Pages** — Create "About/How it Works" page (trust/SEO) and "All States" page (`/estados`) with summary cards for national expansion. `S`
5. [x] **Web Push Notifications (Core)** — Implement Service Worker + VAPID + Push API. Create backend storage for subscriptions and user preference UI for selecting states. `M`
6. [x] **Push Notification Pipeline** — Connect Scraper to Notification System: Scraping -> Deduplication -> Persistence -> Trigger Push for subscribers of the specific state. `M`
7. [x] **iOS PWA Optimization** — Implement UX strategy to guide iOS users to install the PWA (required for Push) and ensure the Service Worker handles background notifications. `S`
8. [x] **Organizer Submission Flow** — Create an "Area do Organizador" with a submission form (MVP: Google Forms integration) for manual race entry and approval. `XS`
9. [x] **Security & Integrity Foundation** — Implement global exception filters to prevent error leakage, set up rate limiting, and secure internal routes to guarantee system stability. `S`
10. [x] **Scraper Automation** — Configure robust periodic execution (Cron/BullMQ) with error handling and monitoring. `S`
11. [ ] **Responsive Navigation & Layout** — Implement a fully responsive header, navigation menu, and footer that adapts seamlessly to mobile, tablet, and desktop screens. `S`
12. [ ] **Scraper Refinement & Expansion** — Refactor scraper to support multiple states/origins (National Expansion), optimize performance for high volume, and standardize data models. `L`
13. [ ] **Página de Calendário por Estado** — Implement `/calendario` (state selection) and `/calendario/[UF]` (monthly calendar view). Features: max 2 events/day cell, "+X events" indicator, day details modal, month/year navigation, and state switcher. `M`
14. [ ] **Geographic Navigation & Routing** — Implement State Selector Header (horizontal scroll) and dynamic routes (`/br/[state]`) for SEO-friendly state filtering. `M`
15. [ ] **"I'm Going" & Popularity System** — Add "Eu vou" button, track attendance counts, and implement logic to badge events as "Popular" or "High Attendance". `M`
16. [ ] **Coupons & Discounts Page** — Develop a page to display discount coupons (manual entry or scraped), filterable by state, to provide extra value to runners. `S`
17. [ ] **Deployment & Final Polish** — Configure production environment (Vercel/Railway/Supabase), fix mobile-specific connection issues (CORS/SSL), optimize assets, and perform final E2E testing on real devices. `M`

> Notes
> - **Security First**: Integrity features are prioritized to ensure a stable foundation.
> - **Engagement**: Social features (Sharing, "I'm Going") are low-hanging fruit to increase user retention before the complex Push system.
> - **Push Complexity**: Split into Core (infra) and Pipeline (logic) to manage complexity.
> - **Expansion**: The national expansion is a larger effort (`L`) placed later to ensure the platform features are solid first.
