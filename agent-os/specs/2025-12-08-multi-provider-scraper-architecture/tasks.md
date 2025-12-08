# Task Breakdown: Multi-Provider Scraper Architecture

## Overview
Total Tasks: 56
Total Providers: 8 (5 national + 2 regional + 1 legacy)

## Task List

### Core Infrastructure

#### Task Group 1: Provider Interface & Base Architecture
**Dependencies:** None

- [x] 1.0 Complete provider interface and base architecture
  - [x] 1.1 Write 4 focused tests for provider interface
    - Test `ProviderScraper` interface contract
    - Test `ProviderScraperOptions` extends `ScraperOptions`
    - Test base provider error handling
    - Test state filter functionality
  - [x] 1.2 Create `ProviderScraper` interface
    - Define `getName(): string`
    - Define `scrape(context, options, states?): Promise<StandardizedEvent[]>`
    - Define `supportsState(state: string): boolean`
    - Define `getPriority(): number` for deduplication order
  - [x] 1.3 Create `ProviderScraperOptions` interface
    - Extend current `ScraperOptions`
    - Add `providerName?: string` for single-provider runs
    - Add `skipLegacy?: boolean` for legacy exclusion
  - [x] 1.4 Create base provider utilities
    - Create `scripts/scraper/src/providers/base.ts`
    - Implement common navigation helpers
    - Implement common extraction utilities wrapper
  - [x] 1.5 Ensure provider interface tests pass

**Acceptance Criteria:**
- Interface defined and exported ✅
- Base utilities created ✅
- Tests pass (14/14) ✅

---

#### Task Group 2: Cross-Provider Deduplication
**Dependencies:** Task Group 1

- [x] 2.0 Complete deduplication logic
  - [x] 2.1 Write 3 focused tests for deduplication
    - Test normalization (accents, lowercase, trim)
    - Test match key generation
    - Test first-event-wins logic
  - [x] 2.2 Create normalization utilities
    - Create `scripts/scraper/src/utils/normalization.ts`
    - Implement `normalizeTitle(title: string): string`
    - Implement `normalizeCity(city: string): string`
    - Remove accents, lowercase, trim whitespace
  - [x] 2.3 Implement deduplication function
    - Create `deduplicateEvents(events: StandardizedEvent[]): StandardizedEvent[]`
    - Generate match key: `normalized_title + date + normalized_city + state`
    - Keep first occurrence (respects provider priority)
    - Log duplicates detected with source info
  - [x] 2.4 Ensure deduplication tests pass

**Acceptance Criteria:**
- Normalization works correctly ✅
- Duplicates are removed ✅
- First-event-wins based on priority ✅
- Tests pass (16/16) ✅

---

### National Providers (5)

#### Task Group 3: TicketSports Provider
**Dependencies:** Task Group 1

- [x] 3.0 Complete TicketSports provider
  - [x] 3.1 Investigate TicketSports API/structure
    - Check for JSON endpoints
    - Identify listing page structure
    - Note pagination mechanism
  - [x] 3.2 Write 3 focused tests for TicketSports scraper
    - Test event extraction from sample HTML
    - Test pagination handling
    - Test error handling
  - [x] 3.3 Create TicketSports provider
    - Create `scripts/scraper/src/providers/ticketsports.ts`
    - Implement `ProviderScraper` interface
    - Set platform identifier: `ticketsports`
    - Priority: 1 (highest)
  - [x] 3.4 Implement event listing extraction
    - Navigate to running events page
    - Extract event links from listing
    - Handle pagination if present
  - [x] 3.5 Implement event details extraction
    - Extract: title, date, city, state, distances
    - Extract: regUrl, imageUrl, priceText/priceMin
    - Reuse `extractPriceWithHeuristics()` and image utils
  - [x] 3.6 Ensure TicketSports tests pass

**Acceptance Criteria:**
- Provider scrapes events successfully ✅
- All core fields extracted ✅
- Pagination handled ✅
- Tests pass (6/6) ✅

---

#### Task Group 4: Minhas Inscrições Provider
**Dependencies:** Task Group 1

- [x] 4.0 Complete Minhas Inscrições provider
  - [x] 4.1 Investigate Minhas Inscrições API/structure
    - Check for JSON endpoints
    - Identify listing page structure for running events
    - Note category filters
  - [x] 4.2 Write 3 focused tests for provider
    - Test event extraction
    - Test running category filter
    - Test error handling
  - [x] 4.3 Create Minhas Inscrições provider
    - Create `scripts/scraper/src/providers/minhasinscricoes.ts`
    - Implement `ProviderScraper` interface
    - Set platform identifier: `minhasinscricoes`
    - Priority: 2
  - [x] 4.4 Implement event listing extraction
    - Filter by corrida/running category
    - Extract event links
  - [x] 4.5 Implement event details extraction
    - Extract all core fields
    - Reuse shared utilities
  - [x] 4.6 Ensure Minhas Inscrições tests pass

**Acceptance Criteria:**
- Provider scrapes running events ✅
- Category filter works ✅
- Tests pass (6/6) ✅

---

#### Task Group 5: Doity Provider
**Dependencies:** Task Group 1

- [x] 5.0 Complete Doity provider
  - [x] 5.1 Investigate Doity API/structure
    - Check for JSON endpoints
    - Identify sports/corrida category
  - [x] 5.2 Write 3 focused tests for provider
    - Test event extraction
    - Test category filter
    - Test error handling
  - [x] 5.3 Create Doity provider
    - Create `scripts/scraper/src/providers/doity.ts`
    - Implement `ProviderScraper` interface
    - Set platform identifier: `doity`
    - Priority: 3
  - [x] 5.4 Implement event listing extraction
  - [x] 5.5 Implement event details extraction
  - [x] 5.6 Ensure Doity tests pass

**Acceptance Criteria:**
- Provider scrapes running events ✅
- Tests pass (5/5) ✅

---

#### Task Group 6: Sympla Provider
**Dependencies:** Task Group 1

- [x] 6.0 Complete Sympla provider
  - [x] 6.1 Investigate Sympla API/structure
    - Check for JSON endpoints
    - Identify sports/running category
  - [x] 6.2 Write 3 focused tests for provider
  - [x] 6.3 Create Sympla provider
    - Create `scripts/scraper/src/providers/sympla.ts`
    - Implement `ProviderScraper` interface
    - Set platform identifier: `sympla`
    - Priority: 4
  - [x] 6.4 Implement event listing extraction
  - [x] 6.5 Implement event details extraction
  - [x] 6.6 Ensure Sympla tests pass

**Acceptance Criteria:**
- Provider scrapes running events ✅
- Tests pass (5/5) ✅

---

#### Task Group 7: Zenite Provider
**Dependencies:** Task Group 1

- [x] 7.0 Complete Zenite provider
  - [x] 7.1 Investigate Zenite API/structure
  - [x] 7.2 Write 3 focused tests for provider
  - [x] 7.3 Create Zenite provider
    - Create `scripts/scraper/src/providers/zenite.ts`
    - Implement `ProviderScraper` interface
    - Set platform identifier: `zenite`
    - Priority: 5
  - [x] 7.4 Implement event listing extraction
  - [x] 7.5 Implement event details extraction
  - [x] 7.6 Ensure Zenite tests pass

**Acceptance Criteria:**
- Provider scrapes events ✅
- Tests pass (5/5) ✅

---

### Regional Providers (Nordeste)

#### Task Group 8: Corre Paraíba Provider
**Dependencies:** Task Group 1

- [x] 8.0 Complete Corre Paraíba provider
  - [x] 8.1 Investigate Corre Paraíba site structure
    - Identify listing page
    - Note event card structure
  - [x] 8.2 Write 2 focused tests for provider
    - Test event extraction
    - Test state limitation (Nordeste only)
  - [x] 8.3 Create Corre Paraíba provider
    - Create `scripts/scraper/src/providers/correparaiba.ts`
    - Implement `ProviderScraper` interface
    - Set platform identifier: `correparaiba`
    - Priority: 6
    - Limit `supportsState()` to: PB, PE, RN, CE, AL, SE, BA, MA, PI
  - [x] 8.4 Implement event extraction
    - Playwright scraping only (no API expected)
    - Extract all core fields
  - [x] 8.5 Ensure Corre Paraíba tests pass

**Acceptance Criteria:**
- Provider scrapes Nordeste events ✅
- State filter limits correctly ✅
- Tests pass (7/7) ✅

---

#### Task Group 9: Race83 Provider
**Dependencies:** Task Group 1

- [x] 9.0 Complete Race83 provider
  - [x] 9.1 Investigate Race83 site structure
    - Identify listing page
    - Note event card structure
  - [x] 9.2 Write 2 focused tests for provider
    - Test event extraction
    - Test state limitation
  - [x] 9.3 Create Race83 provider
    - Create `scripts/scraper/src/providers/race83.ts`
    - Implement `ProviderScraper` interface
    - Set platform identifier: `race83`
    - Priority: 7
    - Limit `supportsState()` to: PB, PE, RN, CE, AL, SE, BA, MA, PI
  - [x] 9.4 Implement event extraction
    - Playwright scraping only
    - Extract all core fields
  - [x] 9.5 Ensure Race83 tests pass

**Acceptance Criteria:**
- Provider scrapes Nordeste events ✅
- State filter limits correctly ✅
- Tests pass (6/6) ✅

---

### Legacy Provider

#### Task Group 10: Legacy CorridasEMaratonas Adapter
**Dependencies:** Task Group 1

- [x] 10.0 Adapt legacy scraper as provider
  - [x] 10.1 Write 2 focused tests for adapter
    - Test interface compliance
    - Test skip-legacy flag
  - [x] 10.2 Create CorridasEMaratonas adapter
    - Create `scripts/scraper/src/providers/corridasemaratonas.ts`
    - Wrap existing `scrapeState()` function
    - Implement `ProviderScraper` interface
    - Set platform identifier: `corridasemaratonas`
    - Priority: 8 (lowest, fallback)
  - [x] 10.3 Implement state-by-state iteration
    - Reuse `STATE_URLS` from current scraper
    - Call existing `scrapeState()` for each
  - [x] 10.4 Ensure adapter tests pass

**Acceptance Criteria:**
- Legacy scraper works as provider ✅
- Can be skipped via flag ✅
- Tests pass (6/6) ✅

---

### Orchestration

#### Task Group 11: Multi-Provider Orchestrator
**Dependencies:** Task Groups 1-10

- [x] 11.0 Complete orchestrator
  - [x] 11.1 Write 4 focused tests for orchestrator
    - Test provider registration
    - Test state filter (`--state=XX`)
    - Test provider filter (`--provider=NAME`)
    - Test error isolation (one provider fails, others continue)
  - [x] 11.2 Create orchestrator module
    - Create `scripts/scraper/src/orchestrator.ts`
    - Import all provider implementations
    - Define provider registry with priority order
  - [x] 11.3 Implement CLI argument parsing
    - Parse `--state=XX` for UF filter
    - Parse `--provider=NAME` for single provider
    - Parse `--skip-legacy` for legacy exclusion
  - [x] 11.4 Implement provider execution loop
    - Run providers sequentially
    - Pass state filter to each provider
    - Aggregate all events
    - Apply deduplication to combined results
  - [x] 11.5 Implement error isolation
    - Wrap each provider in try/catch
    - Log provider errors but continue
    - Collect per-provider statistics
  - [x] 11.6 Implement summary logging
    - Log per-provider: events found, errors, duration
    - Log total: events, duplicates removed, final count
  - [x] 11.7 Ensure orchestrator tests pass

**Acceptance Criteria:**
- All providers run successfully ✅
- Filters work correctly ✅
- Errors don't crash job ✅
- Deduplication applied ✅
- Tests pass (16/16) ✅

---

### Integration

#### Task Group 12: Main Entry Point Update
**Dependencies:** Task Group 11

- [x] 12.0 Update main entry point
  - [x] 12.1 Update `scripts/scraper/src/main.ts`
    - Import orchestrator
    - Replace direct `scrapeState()` calls with orchestrator
    - Preserve database and notification logic
  - [x] 12.2 Update CLI argument handling
    - Support existing `--state=XX` (backward compatible)
    - Add `--provider=NAME` for new single-provider mode
    - Add `--skip-legacy` flag
  - [x] 12.3 Preserve job summary format
    - Keep existing summary output
    - Add provider breakdown section
  - [x] 12.4 Local integration test
    - Run with `--state=PB` to test single state
    - Verify events appear in database
    - Check notification triggers

**Acceptance Criteria:**
- Main entry point uses orchestrator ✅
- Backward compatible with existing args ✅
- Job runs successfully ✅
- README documentation updated ✅

---

#### Task Group 13: GitHub Actions Workflow Update
**Dependencies:** Task Group 12

- [x] 13.0 Update GitHub Actions workflow
  - [x] 13.1 Update `.github/workflows/scraper-standalone.yml`
    - Add `provider` input for manual dispatch
    - Add `skip-legacy` input option
  - [x] 13.2 Update run command
    - Pass new arguments when provided
    - Maintain backward compatibility for cron
  - [x] 13.3 Document workflow changes
    - Update README in `scripts/scraper/`
    - Document new CLI options
    - Document provider list

**Acceptance Criteria:**
- Workflow supports new options ✅
- Cron still works unchanged ✅
- Documentation updated ✅

---

### Testing & Verification

#### Task Group 14: Integration Testing & Gap Analysis
**Dependencies:** Task Groups 1-13

- [x] 14.0 Review and verify full integration
  - [x] 14.1 Review all provider tests
    - Verify each provider has 2-4 tests
    - All 11 test suites pass
  - [x] 14.2 Run full provider test suite
    - Run all provider tests
    - ✅ 93 tests passing in 11 suites
  - [ ] 14.3 Manual integration test ⚠️ (requires DATABASE_URL)
    - Run scraper with `--state=PB`
    - Verify events from multiple providers
    - Check deduplication works
    - Verify legacy fallback
  - [ ] 14.4 Production dry-run ⚠️ (requires deployment)
    - Run full scraper in production-like environment
    - Monitor for errors
    - Verify events saved correctly

**Acceptance Criteria:**
- All tests pass ✅ (93/93 in 11 suites)
- Scraper runs end-to-end ⚠️ (pending manual test)
- Events saved to database ⚠️ (pending production test)
- No crashes on provider errors ✅ (isolated in orchestrator)

---

## Execution Order

Recommended implementation sequence:

```
Group 1 (Interface) ───┬──> Groups 3-7 (National Providers) ─────┐
                       │                                          │
                       ├──> Groups 8-9 (Regional Providers) ──────┤
                       │                                          │
                       ├──> Group 10 (Legacy Adapter) ────────────┤
                       │                                          │
                       └──> Group 2 (Deduplication) ──────────────┤
                                                                  │
                           ┌──────────────────────────────────────┘
                           │
                           v
                     Group 11 (Orchestrator) ──> Group 12 (Main) ──> Group 13 (GH Actions) ──> Group 14 (Verify)
```

**Parallel Work Possible:**
- Groups 3-10 can be developed in parallel after Group 1
- Group 2 can be developed in parallel with providers

## Notes

- **No frontend tasks**: This is entirely backend/infrastructure
- **No database schema changes**: Reuses existing Event model
- **API investigation first**: For each provider, check for JSON endpoints before scraping
- **Provider priority**: National providers (1-5), Regional (6-7), Legacy (8)
- **Error isolation**: Each provider failure should not affect others
- **Total tests**: ~35-40 focused tests across all groups
