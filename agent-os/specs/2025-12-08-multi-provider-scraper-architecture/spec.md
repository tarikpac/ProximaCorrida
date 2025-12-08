# Specification: Multi-Provider Scraper Architecture

## Goal

Refactor the scraper system to fetch events directly from ticketing providers (TicketSports, Minhas Inscrições, Doity, Sympla, Zenite) and regional platforms (Corre Paraíba, Race83) instead of aggregators, implementing a modular per-provider architecture with standardized event output and cross-provider deduplication.

## User Stories

- As a **runner**, I want to see events from all major ticketing platforms so that I have a comprehensive view of available races.
- As a **system administrator**, I want to run scrapers for specific states or providers so that I can test and debug efficiently.
- As a **maintainer**, I want modular provider-specific scrapers so that adding new providers is straightforward.

## Specific Requirements

**ProviderScraper Interface**
- Define `ProviderScraper` interface with methods: `getName()`, `scrape(options, states?)`, `supportsState(state)`
- Each implementation must return `StandardizedEvent[]`
- Include error handling contract: per-provider errors must not crash orchestrator
- Support optional state filter (UF) for partial runs
- Define common `ProviderScraperOptions` extending current `ScraperOptions`

**TicketSports Provider Scraper**
- Investigate API endpoints first (JSON responses, filters by state/category)
- Fallback: Playwright scraping of listing pages
- Extract: title, date, city, state, distances, regUrl, imageUrl, priceText/priceMin
- Source platform identifier: `ticketsports`
- Handle pagination if present

**Minhas Inscrições Provider Scraper**
- Investigate API endpoints first
- Fallback: Playwright scraping of listing pages
- Filter by running/corrida events
- Extract same core fields as TicketSports
- Source platform identifier: `minhasinscricoes`

**Doity Provider Scraper**
- Investigate API endpoints first
- Fallback: Playwright scraping
- Filter by sports/corrida category
- Extract same core fields
- Source platform identifier: `doity`

**Sympla Provider Scraper**
- Investigate API endpoints first
- Fallback: Playwright scraping
- Filter by sports/running category
- Extract same core fields
- Source platform identifier: `sympla`

**Zenite Provider Scraper**
- Investigate API endpoints first
- Fallback: Playwright scraping
- Extract same core fields
- Source platform identifier: `zenite`

**Corre Paraíba Provider Scraper (Regional)**
- Regional provider focused on Paraíba/Nordeste events
- Playwright scraping of listing pages
- Extract same core fields
- Source platform identifier: `correparaiba`
- Limit to states: PB, PE, RN, CE, AL, SE, BA (Nordeste)

**Race83 Provider Scraper (Regional)**
- Regional provider focused on Paraíba/Nordeste events
- Playwright scraping of listing pages
- Extract same core fields
- Source platform identifier: `race83`
- Limit to states: PB, PE, RN, CE, AL, SE, BA (Nordeste)

**Multi-Provider Orchestrator**
- Create `orchestrator.ts` that manages all provider scrapers
- Accept CLI args: `--state=XX` (filter), `--provider=NAME` (single provider)
- Run providers sequentially to manage resources
- Aggregate results from all providers
- Log per-provider summaries
- Continue on provider errors (don't abort entire job)

**Cross-Provider Deduplication**
- Normalize: lowercase title, remove accents, trim whitespace
- Match key: `normalized_title + date + normalized_city + state`
- First event wins (based on provider priority order)
- Log duplicates detected for monitoring
- Do not implement fuzzy matching in MVP

**Legacy Scraper Fallback**
- Keep `corridasemaratonas` scraper as separate provider
- Run as fallback/validation during transition
- Can be disabled via `--skip-legacy` flag
- Plan for removal once direct providers are stable

## Visual Design

No visual mockups provided. This is a backend-only feature.

## Existing Code to Leverage

**`scripts/scraper/src/scraper.ts`**
- Current scraper structure and patterns
- `scrapeState()` function signature as reference
- Browser context and page management approach
- Error handling per-event pattern
- Reuse as `CorridasEMaratonasProvider` adapter

**`scripts/scraper/src/interfaces/index.ts`**
- `StandardizedEvent` interface — use directly, don't modify
- `ScraperOptions` interface — extend for provider-specific options
- Keep field contract stable for database compatibility

**`scripts/scraper/src/utils/price-extraction.ts`**
- `extractPriceWithHeuristics()` — reuse for all providers
- `parsePrice()`, `classifyPrice()` — reuse directly
- Provider-specific price selectors may need extension

**`scripts/scraper/src/utils/image-extraction.ts`**
- `detectPlatform()`, `getPlatformWaitConfig()` — extend for new platforms
- Image extraction patterns — reuse meta tag extraction
- Platform-specific wait configurations — add new providers

**`scripts/scraper/src/db.ts`**
- `upsertEvent()` — reuse for all providers
- `checkEventsFreshness()` — reuse for pre-fetch optimization
- `initDatabase()`, `disconnectDatabase()` — reuse connection management

## Out of Scope

- International providers (only Brazilian platforms)
- Payment integrations
- Frontend changes (beyond consuming existing data)
- Fuzzy matching / advanced deduplication (phase 2)
- Long descriptions and specific modalities (phase 2)
- Other regional providers beyond Nordeste (focus on PB/Nordeste first)
- Real-time event updates (batch cron only)
- Provider-specific notification preferences
- API rate limiting implementation (rely on delays)
- Provider authentication (if required, skip provider)
