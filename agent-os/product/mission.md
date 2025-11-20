# Product Mission

## Pitch
ProximaCorrida is a mobile-first platform that helps street runners find their next challenge by providing a centralized, automated, and responsive aggregation of race events.

## Users

### Primary Customers
- **Street Runners**: Amateur and professional runners looking for race events to participate in.
- **Event Organizers**: (Indirectly) benefited by having their events listed and accessible to a broader audience.

### User Personas
**The Dedicated Runner** (25-45)
- **Role:** Amateur Athlete / Enthusiast
- **Context:** Trains regularly and plans their race calendar months in advance. Uses mobile devices primarily.
- **Pain Points:** Race information is scattered across multiple organizer sites, ticketing platforms, and news portals. It's time-consuming to find consolidated info.
- **Goals:** Quickly find upcoming races in their region (starting with Paraíba), view details, and access registration links easily.

## The Problem

### Fragmented Event Information
Information about street races is dispersed across various websites (organizers, ticket platforms, news). Runners have to visit multiple sources to find what they are looking for.

**Our Solution:** A centralized platform that uses an automated scraper to gather, standardize, and display race events in a clean, mobile-optimized interface.

## Differentiators

### Automated Centralization
Unlike individual organizer sites that only show their own events, or general news portals that are cluttered, we provide a dedicated, automated aggregator specifically for street races.
This results in a **comprehensive and up-to-date calendar** for the user without manual curation effort.

## Key Features
### Core Features
- **Automated Event Scraper:** Automatically collects event data (title, date, location, distances, price, images) from various sources.
- **Mobile-First Event Listing:** A responsive list of upcoming events, optimized for mobile viewing.
- **Event Details & Registration:** Detailed view of each event with a direct "Inscreva-se" (Register) link to the official ticketing page.
- **Pace Calculator:** A utility tool for runners to calculate pace, speed, and finish times for standard distances.
- **Organizer Area:** A dedicated section for event organizers to submit their races for listing (initially via form for manual approval).

### Engagement & Social Features
- **Web Push Notifications:** Real-time alerts for new races in specific states (PB, PE, RN, etc.), supported on Android, Desktop, and iOS (via PWA).
- **Social Sharing:** Native sharing integration (WhatsApp, Instagram, etc.) with fallback for desktop to easily share race details.
- **"I'm Going" & Popularity:** Users can mark attendance ("Eu vou"), and events with high interest are highlighted as "Popular".
- **Coupons & Discounts:** A dedicated page listing race discount coupons, filterable by state.

### Security & Integrity
- **Robust Error Handling:** System ensures no internal errors are leaked to users; graceful degradation.
- **System Integrity:** Protected routes and rate limiting to prevent abuse and ensure availability.

### Advanced Features
- **National Geographic Expansion:** Scalable architecture to support expansion from Paraíba to all of Brazil, with state/region filtering.
- **Geographic Navigation:** dedicated state selector header (mobile-first horizontal scroll) and SEO-friendly URLs (e.g., `/br/pb`).
- **Smart Filters:** Ability to filter events by date, city, distance, and popularity.
