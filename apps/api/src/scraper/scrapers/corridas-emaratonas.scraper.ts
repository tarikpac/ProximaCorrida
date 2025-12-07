import { Browser, Page } from 'playwright';
import { BaseScraper, ScraperContext } from './base.scraper';
import { StandardizedEvent } from '../interfaces/standardized-event.interface';
import { Logger } from '@nestjs/common';
import {
  extractPriceWithHeuristics,
  PriceResult,
} from '../utils/price-extraction.utils';
import {
  detectPlatform,
  getPlatformWaitConfig,
  getPlatformDelay,
  Platform,
} from '../utils/image-extraction.utils';

const STATE_URLS = [
  { state: 'AC', url: 'https://corridasemaratonas.com.br/corridas-no-acre/' },
  { state: 'AL', url: 'https://corridasemaratonas.com.br/corridas-no-alagoas/' },
  { state: 'AP', url: 'https://corridasemaratonas.com.br/corridas-no-amapa/' },
  { state: 'AM', url: 'https://corridasemaratonas.com.br/corridas-no-amazonas/' },
  { state: 'BA', url: 'https://corridasemaratonas.com.br/corridas-na-bahia/' },
  { state: 'CE', url: 'https://corridasemaratonas.com.br/corridas-no-ceara/' },
  { state: 'DF', url: 'https://corridasemaratonas.com.br/corridas-no-distrito-federal/' },
  { state: 'ES', url: 'https://corridasemaratonas.com.br/corridas-no-espirito-santo/' },
  { state: 'GO', url: 'https://corridasemaratonas.com.br/corridas-em-goias/' },
  { state: 'MA', url: 'https://corridasemaratonas.com.br/corridas-no-maranhao/' },
  { state: 'MT', url: 'https://corridasemaratonas.com.br/corridas-no-mato-grosso/' },
  { state: 'MS', url: 'https://corridasemaratonas.com.br/corridas-no-mato-grosso-do-sul/' },
  { state: 'MG', url: 'https://corridasemaratonas.com.br/corridas-em-minas-gerais/' },
  { state: 'PA', url: 'https://corridasemaratonas.com.br/corridas-no-para/' },
  { state: 'PB', url: 'https://corridasemaratonas.com.br/corridas-na-paraiba/' },
  { state: 'PR', url: 'https://corridasemaratonas.com.br/corridas-no-parana/' },
  { state: 'PE', url: 'https://corridasemaratonas.com.br/corridas-em-pernambuco/' },
  { state: 'PI', url: 'https://corridasemaratonas.com.br/corridas-no-piaui/' },
  { state: 'RJ', url: 'https://corridasemaratonas.com.br/corridas-no-rio-de-janeiro/' },
  { state: 'RN', url: 'https://corridasemaratonas.com.br/corridas-no-rio-grande-do-norte/' },
  { state: 'RS', url: 'https://corridasemaratonas.com.br/corridas-no-rio-grande-do-sul/' },
  { state: 'RO', url: 'https://corridasemaratonas.com.br/corridas-em-rondonia/' },
  { state: 'RR', url: 'https://corridasemaratonas.com.br/corridas-em-roraima/' },
  { state: 'SC', url: 'https://corridasemaratonas.com.br/corridas-em-santa-catarina/' },
  { state: 'SP', url: 'https://corridasemaratonas.com.br/corridas-em-sao-paulo/' },
  { state: 'SE', url: 'https://corridasemaratonas.com.br/corridas-em-sergipe/' },
  { state: 'TO', url: 'https://corridasemaratonas.com.br/corridas-no-tocantins/' },
];

export class CorridasEMaratonasScraper extends BaseScraper {
  readonly name = 'corridasemaratonas';
  private readonly logger = new Logger(CorridasEMaratonasScraper.name);

  getSplits(): string[] {
    return STATE_URLS.map((s) => s.state);
  }

  async scrape(
    browser: Browser,
    onEventFound?: (event: StandardizedEvent) => Promise<void>,
    filter?: string,
    scraperContext?: ScraperContext,
  ): Promise<StandardizedEvent[]> {
    // Extract configuration with defaults
    const detailTimeoutMs = scraperContext?.options?.detailTimeoutMs ?? 15000;
    const regTimeoutMs = scraperContext?.options?.regTimeoutMs ?? 20000;
    const eventDelayMs = scraperContext?.options?.eventDelayMs ?? 500;
    const shouldLogDebug = scraperContext?.options?.shouldLogDebug ?? false;

    // Counters for summary
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const results: StandardizedEvent[] = [];
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      extraHTTPHeaders: {
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Referer': 'https://www.google.com/',
      },
    });

    let targets = STATE_URLS;
    if (filter) {
      targets = STATE_URLS.filter((s) => s.state === filter);
      if (targets.length === 0) {
        this.logger.warn(`Filter ${filter} matched no states.`);
      } else {
        this.logger.log(`Filtering scraper to state: ${filter}`);
      }
    }

    for (const config of targets) {
      this.logger.log(`Scraping ${config.state} from ${config.url}`);
      try {
        const page = await context.newPage();
        await page.goto(config.url, { timeout: detailTimeoutMs * 2 });

        // Wait for table rows or check if empty
        try {
          await page.waitForSelector('.table-row', { timeout: detailTimeoutMs });
        } catch (e) {
          this.logger.warn(`No events found for ${config.state} or timeout.`);
          await page.close();
          continue;
        }

        const rawEvents = await page.$$eval('.table-row', (rows) => {
          return rows.map((row) => {
            const titleLink = row.querySelector(
              'td:nth-child(1) a',
            ) as HTMLAnchorElement;
            const dateStr = row
              .querySelector('td:nth-child(2)')
              ?.textContent?.trim();
            const city = row
              .querySelector('td:nth-child(3)')
              ?.textContent?.trim();
            const distancesStr = row
              .querySelector('td:nth-child(4)')
              ?.textContent?.trim();

            return {
              title: titleLink?.textContent?.trim(),
              detailsUrl: titleLink?.href,
              dateStr,
              city,
              distancesStr,
            };
          });
        });

        this.logger.log(
          `Found ${rawEvents.length} raw events for ${config.state}. Processing details...`,
        );

        // Create one page for details to be reused
        const detailsPage = await context.newPage();

        // Pre-fetch filter: check which URLs are fresh and can be skipped
        let freshUrls: Set<string> = new Set();
        if (scraperContext?.checkFreshness) {
          const allUrls = rawEvents
            .map((r) => r.detailsUrl)
            .filter((url): url is string => !!url && url.startsWith('http') && !url.includes('#N/A'));
          if (allUrls.length > 0) {
            freshUrls = await scraperContext.checkFreshness(allUrls);
            if (shouldLogDebug) {
              this.logger.debug(`Pre-fetch filter: ${freshUrls.size} fresh events will be skipped`);
            }
          }
        }

        for (const raw of rawEvents) {
          // Variables to accept either scraped data or fallback
          let regLink: string | null = null;
          let priceText: string | null = null;
          let priceMin: number | null = null;
          let imageUrl: string | null = null;
          let finalSourceUrl = raw.detailsUrl;

          // Helper for slugification
          const slugify = (text: string) =>
            text
              .toLowerCase()
              .normalize('NFD') // Decompose combined chars (e.g. 'é' -> 'e' + '´')
              .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
              .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanum with -
              .replace(/^-+|-+$/g, ''); // Trim -

          try {
            // Check if URL is valid (Fix for Task: Scraper dropping events with #N/A)
            const isValidUrl =
              raw.detailsUrl &&
              !raw.detailsUrl.includes('#N/A') &&
              raw.detailsUrl.startsWith('http');

            if (isValidUrl) {
              // Pre-fetch filter: skip if event is fresh
              if (freshUrls.has(raw.detailsUrl)) {
                skippedCount++;
                if (shouldLogDebug) {
                  this.logger.debug(`Skipping fresh event: ${raw.title}`);
                }
                continue;
              }

              try {
                await detailsPage.goto(raw.detailsUrl, {
                  timeout: detailTimeoutMs,
                  waitUntil: 'domcontentloaded',
                });

                // Detect registration link and platform
                const regLinkInfo = await this.detectRegistrationLink(detailsPage);
                regLink = regLinkInfo.url;

                // First try to get price from the details page
                const detailsPagePrice =
                  await this.extractPriceWithClassification(detailsPage);
                priceText = detailsPagePrice.priceText;
                priceMin = detailsPagePrice.priceMin;

                // Try to get image from details page first
                imageUrl = await this.extractImageWithFallback(detailsPage);

                // If we have a registration link, navigate there for better data
                if (regLinkInfo.url) {
                  const regResult = await this.extractImageAndPrice(
                    detailsPage,
                    regLinkInfo,
                  );

                  // Use registration page data if available (usually better)
                  if (regResult.imageUrl) {
                    imageUrl = regResult.imageUrl;
                  }
                  if (regResult.priceResult?.priceText) {
                    priceText = regResult.priceResult.priceText;
                    priceMin = regResult.priceResult.priceMin;
                  }
                }
              } catch (navError) {
                // Graceful fallback: log warning and continue with basic info
                this.logger.warn(`Timeout loading details for ${raw.title}: ${(navError as Error).message}`);
                errorCount++;
              }
            } else {
              // Fallback Logic for #N/A or invalid URLs
              // Instead of discarding the event, we register it with basic info
              this.logger.warn(
                `Invalid details URL for ${raw.title} (${raw.detailsUrl}). Generating fallback ID.`,
              );
              const slugTitle = slugify(raw.title || 'untitled');
              const slugCity = slugify(raw.city || 'unknown');
              const safeDate = raw.dateStr?.replace(/\//g, '') || 'nodate';

              // Generate a deterministic fake URL to serve as ID
              finalSourceUrl = `https://corridasemaratonas.com.br/fallback/${config.state}/${safeDate}-${slugTitle}-${slugCity}`;

              // Mark visually as unavailable/pending info
              priceText = 'Sob Consulta';
            }

            // Normalization
            const dateParts = raw.dateStr?.split('/');
            const eventDate =
              dateParts && dateParts.length === 3
                ? new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`)
                : new Date();

            const distances = raw.distancesStr
              ? raw.distancesStr.split('/').map((d) => d.trim())
              : [];

            const evtParams: StandardizedEvent = {
              title: raw.title || 'Untitled',
              date: eventDate,
              city: raw.city || null,
              state: config.state,
              distances,
              regUrl: regLink || null,
              sourceUrl: finalSourceUrl,
              sourcePlatform: this.name,
              sourceEventId: null,
              imageUrl: imageUrl || null,
              priceText: priceText || null,
              priceMin,
              rawLocation: raw.city ? `${raw.city} - ${config.state}` : null,
            };

            results.push(evtParams);

            if (onEventFound) {
              await onEventFound(evtParams);
            }

            // Small delay to be gentle on CPU and Server (configurable)
            if (isValidUrl) {
              await new Promise((r) => setTimeout(r, eventDelayMs));
            } else {
              // Minimal delay for fallback loops
              await new Promise((r) => setTimeout(r, 100));
            }

            processedCount++;
          } catch (err) {
            errorCount++;
            this.logger.error(
              `Failed to process event ${raw.title}: ${(err as Error).message}`,
            );
          }
        }
        // Close the reusable page after finishing the state
        await detailsPage.close();
        await page.close();
      } catch (error) {
        this.logger.error(`Failed to scrape state ${config.state}`, error);
      }

      // Job summary log for this state
      this.logger.log(
        `[${config.state}] Summary: processed=${processedCount}, skipped=${skippedCount}, errors=${errorCount}`,
      );
    }

    await context.close();
    return results;
  }

  // --- Helper Methods (Enhanced for Photos & Prices) ---

  /**
   * Detects the registration link and platform on the current page.
   * @param page The Playwright Page object.
   * @returns Object with registration URL and detected platform.
   */
  private async detectRegistrationLink(
    page: Page,
  ): Promise<{ url: string | null; platform: Platform }> {
    const url = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const found = links.find(
        (a) =>
          a.textContent?.toLowerCase().includes('inscrição') ||
          a.textContent?.toLowerCase().includes('inscreva-se') ||
          a.href.includes('zeniteesportes') ||
          a.href.includes('ticketsports') ||
          a.href.includes('doity'),
      );
      return found ? found.href : null;
    });

    return {
      url,
      platform: detectPlatform(url),
    };
  }

  /**
   * Extracts price information using intelligent heuristics.
   * Classifies prices as 'general' vs 'discounted' (PCD/meia/kids).
   * Only returns general public prices for the event card.
   * 
   * @param page The Playwright Page object.
   * @returns PriceResult with priceMin and priceText.
   */
  private async extractPriceWithClassification(page: Page): Promise<PriceResult> {
    const bodyText = await page.evaluate(() => document.body.innerText);
    return extractPriceWithHeuristics(bodyText);
  }

  /**
   * Extracts image URL using a fallback chain:
   * 1. og:image meta tag
   * 2. twitter:image meta tag
   * 3. Banner/poster images (by class/keyword)
   * 4. Largest image on page
   * 5. CSS background-image
   * 
   * @param page The Playwright Page object.
   * @returns The image URL or null.
   */
  private async extractImageWithFallback(page: Page): Promise<string | null> {
    return page.evaluate(() => {
      // 1. Try og:image meta tag
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        const content = (ogImage as HTMLMetaElement).content;
        if (content && content.startsWith('http')) {
          return content;
        }
      }

      // 2. Try twitter:image meta tag
      const twitterImage =
        document.querySelector('meta[name="twitter:image"]') ||
        document.querySelector('meta[property="twitter:image"]');
      if (twitterImage) {
        const content = (twitterImage as HTMLMetaElement).content;
        if (content && content.startsWith('http')) {
          return content;
        }
      }

      // 3. Try banner/poster images by class or keywords
      const bannerClasses = [
        'img.img-capa-evento',
        'img.banner',
        'img.poster',
        'img.capa',
        'img.hero-image',
        'img.event-image',
        '.banner img',
        '.hero img',
        '.capa img',
      ];

      for (const selector of bannerClasses) {
        const bannerImg = document.querySelector(selector);
        if (bannerImg) {
          const src = (bannerImg as HTMLImageElement).src;
          if (src && src.startsWith('http')) {
            return src;
          }
        }
      }

      // 4. Find banner by keyword in src/alt
      const images = Array.from(document.querySelectorAll('img'));
      const keywordBanner = images.find((img) => {
        const searchText = (img.src + ' ' + (img.alt || '')).toLowerCase();
        return (
          searchText.includes('banner') ||
          searchText.includes('cartaz') ||
          searchText.includes('poster') ||
          searchText.includes('capa')
        );
      });
      if (keywordBanner && keywordBanner.src.startsWith('http')) {
        return keywordBanner.src;
      }

      // 5. Find largest image (width > 300)
      const largeImages = images
        .filter((img) => {
          const width = img.naturalWidth || img.width || 0;
          return width > 300 && img.src.startsWith('http');
        })
        .sort((a, b) => {
          const widthA = a.naturalWidth || a.width || 0;
          const widthB = b.naturalWidth || b.width || 0;
          return widthB - widthA;
        });

      if (largeImages.length > 0) {
        return largeImages[0].src;
      }

      // 6. Try CSS background-image on hero/banner sections
      const heroSelectors = ['.hero', '.banner', '.capa', '.header', 'header'];
      for (const selector of heroSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const bgImage = window.getComputedStyle(element).backgroundImage;
          if (bgImage && bgImage !== 'none') {
            const match = bgImage.match(/url\(['"]?([^'"()]+)['"]?\)/i);
            if (match && match[1] && match[1].startsWith('http')) {
              return match[1];
            }
          }
        }
      }

      return null;
    });
  }

  /**
   * Applies platform-specific wait strategies before extraction.
   * TicketSports: wait for price selectors
   * Doity: extra delay for dynamic content
   * 
   * @param page The Playwright Page object.
   * @param platform The detected platform.
   */
  private async applyPlatformWait(page: Page, platform: Platform): Promise<void> {
    const waitConfig = getPlatformWaitConfig(platform);
    const delay = getPlatformDelay(platform);

    if (waitConfig) {
      try {
        await page.waitForSelector(waitConfig.selector, {
          timeout: waitConfig.timeout,
        });
        this.logger.debug(
          `Platform ${platform}: waited for selector "${waitConfig.selector}"`,
        );
      } catch {
        this.logger.debug(
          `Platform ${platform}: selector wait timed out, continuing`,
        );
      }
    }

    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
      this.logger.debug(`Platform ${platform}: applied ${delay}ms delay`);
    }
  }

  /**
   * Main extraction method that navigates to regLink and extracts both
   * image and price with enhanced heuristics.
   * 
   * @param page The Playwright Page object.
   * @param regLinkInfo Registration link info with URL and platform.
   * @returns Object with imageUrl and priceResult.
   */
  private async extractImageAndPrice(
    page: Page,
    regLinkInfo: { url: string | null; platform: Platform },
  ): Promise<{ imageUrl: string | null; priceResult: PriceResult | null }> {
    let imageUrl: string | null = null;
    let priceResult: PriceResult | null = null;

    if (regLinkInfo.url) {
      try {
        // Navigate to registration page
        await page.goto(regLinkInfo.url, {
          timeout: 20000,
          waitUntil: 'domcontentloaded',
        });

        // Apply platform-specific waits
        await this.applyPlatformWait(page, regLinkInfo.platform);

        // Extract price with classification heuristics
        priceResult = await this.extractPriceWithClassification(page);
        this.logger.debug(
          `Extracted price from ${regLinkInfo.platform}: ${priceResult.priceText}`,
        );

        // Extract image with fallback chain
        imageUrl = await this.extractImageWithFallback(page);
        this.logger.debug(
          `Extracted image from ${regLinkInfo.platform}: ${imageUrl ? 'found' : 'not found'}`,
        );
      } catch (e) {
        this.logger.warn(
          `Failed to load registration page for image/price: ${(e as Error).message}`,
        );
      }
    }

    return { imageUrl, priceResult };
  }
}

