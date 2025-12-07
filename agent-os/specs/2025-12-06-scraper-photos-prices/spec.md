# Specification: Scraper Enhancement - Photos & Prices

## Goal
Improve the reliability and accuracy of event image and price extraction by implementing robust fallback chains for images and intelligent classification heuristics for prices, ensuring the scraper correctly captures usable data across different ticket platforms (TicketSports, Doity, Zenite).

## User Stories
- As a runner browsing events, I want to see accurate prices (not PCD/meia prices) so that I know how much the registration really costs for me.
- As a runner, I want to see event images on the cards so that I can quickly identify and remember events that interest me.

## Specific Requirements

**Image Extraction Fallback Chain**
- Implement a prioritized fallback chain: (1) `og:image` meta tag, (2) `twitter:image` meta tag, (3) banner/poster image on event page, (4) regLink page image, (5) largest `<img>` on page, (6) CSS `background-image`
- Return only ONE image URL per event (no multi-image support in MVP)
- For `<img>` fallback, prioritize images with `naturalWidth > 600` or containing keywords `banner`, `cartaz`, `poster` in src/alt
- For CSS background-image, extract URL from computed styles of hero/banner sections
- Continue navigating to regLink page when available to find higher-quality images

**Price Extraction Classification Heuristics**
- Extract ALL price occurrences matching pattern `R$\s?(\d{2,3}[.,]\d{2})` from page body
- For each price, capture a context window of 30-40 characters before and after
- Classify each price as `discounted` if context contains: `pcd`, `p.c.d`, `portador de deficiência`, `idoso`, `melhor idade`, `estudante`, `meia`, `kids`, `infantil`, `mirim`, `promoção`, `promo`, `cupom`
- Classify as `general` if context contains: `lote 1`, `1º lote`, `primeiro lote`, `kit básico`, `kit standard`, `kit corredor`, `5km`, `10km`, `21km`, `geral`, and does NOT contain any discounted keywords
- Use case-insensitive matching for all keyword comparisons

**Price Selection Logic**
- If `general` prices exist: `priceMin` = lowest general price, `priceText` = "A partir de R$ X,XX"
- If only `discounted` prices exist: `priceMin` = null, `priceText` = "Ver valores na página de inscrição"
- If no prices found: `priceMin` = null, `priceText` = null (fallback to "Sob Consulta" in UI)
- Detect free events: if "gratuito" or "grátis" or "gratuita" in page text and no prices found, set `priceMin` = 0, `priceText` = "Gratuito"

**Platform-Specific Waits (JS-Heavy Sites)**
- For TicketSports URLs: wait for selector `.preco`, `.valor`, or `[data-price]` with 5s timeout before extracting
- For Doity URLs: wait for `domcontentloaded` (already done) plus additional 1s delay for dynamic content
- For Zenite URLs: no additional waits needed, but apply price classification strictly due to many lot options
- Implement platform detection based on regLink URL patterns

**Price Normalization**
- Parse extracted price string to float (handle both `,` and `.` as decimal separators)
- Store in `priceMin` field as Decimal type (already supported in Prisma schema)
- Ensure consistent formatting for `priceText`: always "A partir de R$ X,XX" format with comma as decimal separator

**Error Handling & Logging**
- Log detailed debug info when image extraction fails at each fallback level
- Log when prices are classified as `discounted` vs `general` for debugging
- Never throw errors that stop scraping; always return null for failed extractions
- Continue processing next events even if individual extraction fails

## Visual Design
No visual assets provided. This is a backend-only enhancement.

## Existing Code to Leverage

**`CorridasEMaratonasScraper.extractImage` (lines 279-329)**
- Current implementation already navigates to regLink and checks `og:image`, `img.img-capa-evento`, and banner candidates
- Rewrite to implement full fallback chain with `twitter:image`, CSS background-image, and largest image logic
- Keep the regLink navigation pattern but apply image extraction to both original page AND regLink page

**`CorridasEMaratonasScraper.extractPrice` (lines 266-277)**
- Current implementation uses simple regex `/R\$\s?(\d{2,3}[.,]\d{2})/i` and returns first match
- Rewrite to extract ALL matches, capture context windows, classify each, and select appropriately
- Return object with both `priceText` and `priceMin` instead of just string

**`CorridasEMaratonasScraper.detectRegistrationLink` (lines 246-264)**
- Already detects regLink by keyword and domain patterns (zeniteesportes, ticketsports, doity)
- Extend to return platform identifier along with URL for platform-specific wait logic

**`StandardizedEvent` interface**
- Already has `imageUrl?: string | null`, `priceText?: string | null`, `priceMin?: number | null`
- No schema changes needed

**`EventsService.upsertBySourceUrl` / `upsertFromStandardized`**
- Already handles all fields correctly; no changes needed to persistence layer

## Out of Scope
- Downloading images to proprietary storage (use external URLs only)
- Image thumbnail generation or compression
- Multiple images per event (carousel feature)
- Local caching of extracted values
- CDN integration or asset optimization
- AI/ML-based price classification
- Creating new scrapers for additional platforms
- Modifying frontend EventCard display logic (already supports priceText/priceMin)
- Database schema changes
