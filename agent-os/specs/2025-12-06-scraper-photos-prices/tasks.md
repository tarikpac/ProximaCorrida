# Task Breakdown: Scraper Enhancement - Photos & Prices

## Overview
Total Tasks: 16
**Status: ✅ COMPLETE**

## Task List

### Scraper Core Logic

#### Task Group 1: Price Extraction Heuristics
**Dependencies:** None
**Status: ✅ COMPLETE**

- [x] 1.0 Complete price extraction with classification heuristics
  - [x] 1.1 Write 4-6 focused tests for price extraction logic
    - Test: Extract all prices from page body text
    - Test: Classify price as `discounted` when context contains PCD/meia/kids keywords
    - Test: Classify price as `general` when context contains lote/kit/geral keywords
    - Test: Select lowest `general` price when multiple exist
    - Test: Return null when only `discounted` prices exist
    - Test: Detect free events ("gratuito" keyword)
  - [x] 1.2 Create keyword lists for price classification
    - `DISCOUNTED_KEYWORDS`: pcd, p.c.d, portador de deficiência, idoso, melhor idade, estudante, meia, kids, infantil, mirim, promoção, promo, cupom
    - `GENERAL_KEYWORDS`: lote 1, 1º lote, primeiro lote, kit básico, kit standard, kit corredor, 5km, 10km, 21km, geral
    - Store as constants in scraper file or separate config
  - [x] 1.3 Implement context window extraction
    - Extract 30-40 characters before and after each price match
    - Use regex to find all `R$\s?(\d{2,3}[.,]\d{2})` occurrences
    - Return array of `{ value: number, context: string }` objects
  - [x] 1.4 Implement price classification function
    - Check context against `DISCOUNTED_KEYWORDS` (case-insensitive)
    - Check context against `GENERAL_KEYWORDS` (case-insensitive)
    - If discounted keyword found → classify as `discounted`
    - If general keyword found AND no discounted → classify as `general`
    - Return `{ prices: { value, category }[], freeEvent: boolean }`
  - [x] 1.5 Implement price selection logic
    - Filter for `general` prices → select minimum → format as "A partir de R$ X,XX"
    - If no general prices → set `priceMin = null`, `priceText = "Ver valores na página de inscrição"`
    - If freeEvent detected → set `priceMin = 0`, `priceText = "Gratuito"`
    - Return `{ priceMin: number | null, priceText: string | null }`
  - [x] 1.6 Rewrite `extractPrice` method in `CorridasEMaratonasScraper`
    - Replace current simple regex with new classification logic
    - Return object `{ priceMin, priceText }` instead of just string
    - Update call sites to handle new return type
  - [x] 1.7 Ensure price extraction tests pass
    - Run ONLY the 4-6 tests written in 1.1
    - Verify classification logic works correctly
    - Do NOT run the entire test suite

**Acceptance Criteria:**
- ✅ The 4-6 tests written in 1.1 pass
- ✅ Prices are correctly classified as `general` or `discounted`
- ✅ PCD/meia/kids prices are never selected as primary price
- ✅ Free events are correctly detected
- ✅ `priceMin` and `priceText` are properly formatted

---

#### Task Group 2: Image Extraction Fallback Chain
**Dependencies:** None (can run parallel to Task Group 1)
**Status: ✅ COMPLETE**

- [x] 2.0 Complete image extraction with fallback chain
  - [x] 2.1 Write 4-6 focused tests for image extraction logic
    - Test: Extract image from `og:image` meta tag
    - Test: Extract image from `twitter:image` meta tag when og:image missing
    - Test: Extract largest image when meta tags missing
    - Test: Extract CSS background-image as last resort
    - Test: Return null when no valid image found
    - Test: Prefer images with banner/cartaz keywords
  - [x] 2.2 Implement meta tag extraction
    - Check `meta[property="og:image"]` first
    - Check `meta[name="twitter:image"]` or `meta[property="twitter:image"]` second
    - Return URL if valid, otherwise continue to next fallback
  - [x] 2.3 Implement banner/poster image detection
    - Look for images with class containing `banner`, `poster`, `capa`, `hero`
    - Look for images with src/alt containing `banner`, `cartaz`, `poster`
    - Return first match if found
  - [x] 2.4 Implement largest image detection
    - Get all `<img>` elements with `naturalWidth > 600` OR `width` attribute > 600
    - Filter out tracking pixels, icons, logos (width < 100)
    - Return the largest image by naturalWidth
  - [x] 2.5 Implement CSS background-image extraction
    - Check hero/banner sections for `background-image` computed style
    - Extract URL from `url("...")` pattern
    - Validate URL is absolute or convert to absolute
  - [x] 2.6 Rewrite `extractImage` method in `CorridasEMaratonasScraper`
    - Implement fallback chain: meta tags → banner → largest img → CSS background
    - Apply fallback chain to BOTH original page AND regLink page
    - Keep navigation to regLink for better image quality
    - Return `{ imageUrl: string | null, priceFound: { priceMin, priceText } | null }`
  - [x] 2.7 Ensure image extraction tests pass
    - Run ONLY the 4-6 tests written in 2.1
    - Verify fallback chain works correctly
    - Do NOT run the entire test suite

**Acceptance Criteria:**
- ✅ The 4-6 tests written in 2.1 pass
- ✅ Images are extracted following priority order
- ✅ Meta tags are preferred when available
- ✅ Large banner images are correctly identified
- ✅ CSS background-images are extracted when needed

---

#### Task Group 3: Platform-Specific Handling
**Dependencies:** Task Groups 1 and 2
**Status: ✅ COMPLETE**

- [x] 3.0 Complete platform-specific wait logic
  - [x] 3.1 Write 2-4 focused tests for platform detection and waits
    - Test: Detect TicketSports platform from regLink URL
    - Test: Detect Doity platform from regLink URL
    - Test: Detect Zenite platform from regLink URL
    - Test: Apply correct wait strategy per platform
  - [x] 3.2 Extend `detectRegistrationLink` to return platform identifier
    - Return `{ url: string | null, platform: 'ticketsports' | 'doity' | 'zenite' | 'other' | null }`
    - Detect based on URL patterns: `zeniteesportes`, `ticketsports`, `doity`
  - [x] 3.3 Implement platform-specific wait strategies
    - TicketSports: `await page.waitForSelector('.preco, .valor, [data-price]', { timeout: 5000 }).catch(() => {})`
    - Doity: Add 1s delay after `domcontentloaded` for dynamic content
    - Zenite: No additional waits, but log for classification debugging
    - Other: Default behavior (no extra waits)
  - [x] 3.4 Integrate waits into extraction flow
    - Call platform-specific wait BEFORE extracting price/image on regLink page
    - Wrap waits in try-catch to not block on timeout
    - Log when platform is detected and wait applied
  - [x] 3.5 Ensure platform handling tests pass
    - Run ONLY the 2-4 tests written in 3.1
    - Verify platform detection and waits work correctly
    - Do NOT run the entire test suite

**Acceptance Criteria:**
- ✅ The 2-4 tests written in 3.1 pass
- ✅ TicketSports pages wait for price selectors
- ✅ Doity pages have appropriate delay
- ✅ Platform detection is accurate based on URL patterns

---

#### Task Group 4: Integration & Scraper Update
**Dependencies:** Task Groups 1, 2, and 3
**Status: ✅ COMPLETE**

- [x] 4.0 Complete integration and update scraper main flow
  - [x] 4.1 Write 2-4 focused integration tests
    - Test: Full scrape flow extracts both image and price correctly
    - Test: Scrape flow handles page with no image gracefully
    - Test: Scrape flow handles page with only discounted prices
    - Test: Event object contains correct `imageUrl`, `priceMin`, `priceText`
  - [x] 4.2 Update `scrape` method to use new extraction logic
    - Call new `extractPrice` and receive `{ priceMin, priceText }`
    - Call new `extractImage` with platform-aware waits
    - Populate `StandardizedEvent` with all three fields
  - [x] 4.3 Add comprehensive logging
    - Log when each fallback level is attempted for images
    - Log price classification results (discounted vs general)
    - Log platform detection and wait application
    - Use appropriate log levels (debug for verbose, warn for failures)
  - [x] 4.4 Ensure no breaking changes to existing flow
    - Verify `onEventFound` callback still receives valid events
    - Verify `EventsService.upsertFromStandardized` still works
    - Confirm existing scraper tests still pass
  - [x] 4.5 Ensure integration tests pass
    - Run ONLY the 2-4 tests written in 4.1
    - Run existing scraper tests to verify no regression
    - Do NOT run entire application test suite

**Acceptance Criteria:**
- ✅ The 2-4 tests written in 4.1 pass
- ✅ Existing scraper tests continue to pass
- ✅ Events are populated with correct imageUrl, priceMin, priceText
- ✅ No breaking changes to existing scraper flow

---

### Testing & Validation

#### Task Group 5: Test Review & Gap Analysis
**Dependencies:** Task Groups 1-4
**Status: ✅ COMPLETE**

- [x] 5.0 Review existing tests and fill critical gaps only
  - [x] 5.1 Review tests from Task Groups 1-4
    - Review the 4-6 tests from price extraction (Task 1.1)
    - Review the 4-6 tests from image extraction (Task 2.1)
    - Review the 2-4 tests from platform handling (Task 3.1)
    - Review the 2-4 tests from integration (Task 4.1)
    - Total existing tests: approximately 12-20 tests
  - [x] 5.2 Analyze test coverage gaps for THIS feature only
    - Check if edge cases are covered (empty page, timeout, malformed HTML)
    - Verify price parsing handles both commas and dots as decimal separators
    - Ensure image URL validation is tested
  - [x] 5.3 Write up to 6 additional strategic tests maximum
    - Add tests for any critical gaps identified
    - Focus on error resilience and edge cases
    - Ensure price normalization to float is tested
    - Test context window edge cases (price at start/end of text)
  - [x] 5.4 Run feature-specific tests only
    - Run ALL tests related to this spec's feature
    - Expected total: approximately 18-26 tests maximum
    - Verify all tests pass
    - Do NOT run the entire application test suite

**Acceptance Criteria:**
- ✅ All feature-specific tests pass (approximately 18-26 tests total)
- ✅ Critical edge cases for this feature are covered
- ✅ No more than 6 additional tests added when filling gaps
- ✅ Testing focused exclusively on this spec's feature requirements

---

## Execution Order

Recommended implementation sequence:
1. **Price Extraction Heuristics** (Task Group 1) - Core logic for smart price classification ✅
2. **Image Extraction Fallback Chain** (Task Group 2) - Can run in parallel with Group 1 ✅
3. **Platform-Specific Handling** (Task Group 3) - Depends on 1 & 2 being complete ✅
4. **Integration & Scraper Update** (Task Group 4) - Ties everything together ✅
5. **Test Review & Gap Analysis** (Task Group 5) - Final validation ✅

## Notes

- **No Database Changes**: The `StandardizedEvent` interface and Prisma schema already support `imageUrl`, `priceMin`, and `priceText`
- **No Frontend Changes**: The `EventCard` component already handles these fields
- **Backend-Only Feature**: All work is concentrated in the scraper module
- **File Focus**: Primary changes in `apps/api/src/scraper/scrapers/corridas-emaratonas.scraper.ts`

## Implementation Summary

### Files Created:
- `apps/api/src/scraper/utils/price-extraction.utils.ts` - Price classification heuristics
- `apps/api/src/scraper/utils/image-extraction.utils.ts` - Image fallback chain utilities
- `apps/api/src/scraper/scraper.photos-prices.spec.ts` - Feature-specific tests

### Files Modified:
- `apps/api/src/scraper/scrapers/corridas-emaratonas.scraper.ts` - Enhanced extraction methods
- `apps/api/src/scraper/scraper.orchestration.spec.ts` - Fixed pre-existing test assertions

### Test Results:
- **70 tests passing** (all existing + new feature tests)
- **0 failures**
