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
11. [x] **Responsive Navigation & Layout** — Implement a fully responsive header, navigation menu, and footer that adapts seamlessly to mobile, tablet, and desktop screens. `S`
12. [x] **Scraper Refinement & Expansion** — Refactor scraper to support multiple states/origins (National Expansion), optimize performance for high volume, and standardize data models. `L`
13. [x] **Cleanup Past Events** — Create a scheduled cron job (running daily) to identify and soft-delete/archive events that occurred in the past (e.g., date < yesterday) to keep the database optimized and search results relevant. `S`
14. [x] **Scraper Enhancement: Photos & Prices** — Improve scraper to reliably capture event images and pricing information. Refine selectors and logic to handle various site structures. `S`
15. [x] **Scraper Performance Optimizations** — Reduce Playwright tab concurrency, reuse context/page, shorter timeouts. Filter before opening details, split scraping into smaller batches. Reduce verbose logging. `S`
16. [x] **Scraper as External Job (GitHub Actions)** — Extract scraper from Nest/HTTP to standalone Playwright script that writes directly to Supabase. Use GitHub Actions daily cron as default (zero cost). Configure workflow with secrets (DATABASE_URL, DIRECT_URL, REDIS_URL, VAPID). Trigger notifications inline or via dedicated endpoint. Fallback: Cloud Run Job + Cloud Scheduler if lower latency/controlled region needed. `M`
17. [ ] **API Migration to Koyeb** — Migrate NestJS API from local/Render to Koyeb (free tier with generous limits). Deploy via Git integration or Docker. Configure environment variables (DATABASE_URL, DIRECT_URL, REDIS_URL, VAPID keys). Update Vercel frontend to point to new Koyeb URL. Koyeb provides always-on instances (no cold starts) with automatic HTTPS and global edge network. `M` ⚠️ **PIVOT: AWS Lambda abortado por custos, migração para Koyeb**
18. [x] **Worker/Queue: Remove Continuous Worker** — Eliminated BullMQ/Redis dependency. Push notifications now sent inline (sync). Scraper runs on GitHub Actions. `S` ✅ **DONE: 2025-12-08**
19. [ ] **Multi-Provider Scraper Architecture** — Refactor scraper to fetch events directly from providers (TicketSports, Zenite, Doity, Sympla, Ticket Agora, MinhaInscrição, etc.) instead of aggregators like corridasemaratonas.com.br. Implement modular per-platform scrapers, automatic event discovery by region/state, and multi-source data consolidation. `XL`
20. [ ] **State Calendar Page** — Implement `/calendario` (state selection) and `/calendario/[UF]` (monthly calendar view). Features: max 2 events/day cell, "+X events" indicator, day details modal, month/year navigation, and state switcher. `M`
21. [ ] **Geographic Navigation & Routing** — Implement State Selector Header (horizontal scroll) and dynamic routes (`/br/[state]`) for SEO-friendly state filtering. `M`
22. [ ] **"I'm Going" & Popularity System** — Add "Eu vou" button, track attendance counts, and implement logic to badge events as "Popular" or "High Attendance". `M`
23. [ ] **Coupons & Discounts Page** — Develop a page to display discount coupons (manual entry or scraped), filterable by state, to provide extra value to runners. `S`
24. [ ] **Deployment & Final Polish** — Configure production environment (Vercel/Railway/Supabase), fix mobile-specific connection issues (CORS/SSL), optimize assets, and perform final E2E testing on real devices. `M`

> Notes
> - **Security First**: Integrity features are prioritized to ensure a stable foundation.
> - **Engagement**: Social features (Sharing, "I'm Going") are low-hanging fruit to increase user retention before the complex Push system.
> - **Push Complexity**: Split into Core (infra) and Pipeline (logic) to manage complexity.
> - **Expansion**: The national expansion is a larger effort (`L`) placed later to ensure the platform features are solid first.
> - **Infra Sequence**: Items #15-18 must be executed in order to avoid breaking production. Performance optimizations first, then external job migration (GH Actions), then API migration (Lambda), then worker removal.
> - **Multi-Provider**: Item #19 is a major refactor that should only be done after infrastructure is stabilized (#15-18 complete).
