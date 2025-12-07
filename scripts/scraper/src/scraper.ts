/**
 * Scraper Core Module
 * Standalone version of CorridasEMaratonasScraper
 * Adapted from apps/api/src/scraper/scrapers/corridas-emaratonas.scraper.ts
 */

import { Browser, Page, BrowserContext } from 'playwright';
import { StandardizedEvent, ScraperOptions } from './interfaces';
import { extractPriceWithHeuristics, PriceResult } from './utils/price-extraction';
import { detectPlatform, getPlatformWaitConfig, getPlatformDelay, Platform } from './utils/image-extraction';

// All 27 Brazilian states
export const STATE_URLS = [
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

export interface StateConfig {
    state: string;
    url: string;
}

export interface RawEvent {
    title?: string;
    detailsUrl?: string;
    dateStr?: string;
    city?: string;
    distancesStr?: string;
}

function log(message: string, level: 'info' | 'debug' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    if (level === 'error') {
        console.error(`${prefix} ${message}`);
    } else if (level === 'warn') {
        console.warn(`${prefix} ${message}`);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Scrape a single state and return standardized events
 */
export async function scrapeState(
    context: BrowserContext,
    config: StateConfig,
    options: ScraperOptions,
    freshUrls: Set<string>
): Promise<{ events: StandardizedEvent[]; counters: { processed: number; skipped: number; errors: number } }> {
    const events: StandardizedEvent[] = [];
    const counters = { processed: 0, skipped: 0, errors: 0 };

    log(`Scraping ${config.state} from ${config.url}`);

    const page = await context.newPage();

    try {
        await page.goto(config.url, { timeout: options.detailTimeoutMs * 2 });

        // Wait for table rows
        try {
            await page.waitForSelector('.table-row', { timeout: options.detailTimeoutMs });
        } catch {
            log(`No events found for ${config.state} or timeout.`, 'warn');
            await page.close();
            return { events, counters };
        }

        // Extract raw events from table
        const rawEvents = await page.$$eval('.table-row', (rows) => {
            return rows.map((row) => {
                const titleLink = row.querySelector('td:nth-child(1) a') as HTMLAnchorElement;
                const dateStr = row.querySelector('td:nth-child(2)')?.textContent?.trim();
                const city = row.querySelector('td:nth-child(3)')?.textContent?.trim();
                const distancesStr = row.querySelector('td:nth-child(4)')?.textContent?.trim();

                return {
                    title: titleLink?.textContent?.trim(),
                    detailsUrl: titleLink?.href,
                    dateStr,
                    city,
                    distancesStr,
                };
            });
        });

        log(`Found ${rawEvents.length} raw events for ${config.state}`);

        // Create details page for reuse
        const detailsPage = await context.newPage();

        for (const raw of rawEvents) {
            let regLink: string | null = null;
            let priceText: string | null = null;
            let priceMin: number | null = null;
            let imageUrl: string | null = null;
            let finalSourceUrl = raw.detailsUrl;

            try {
                const isValidUrl =
                    raw.detailsUrl &&
                    !raw.detailsUrl.includes('#N/A') &&
                    raw.detailsUrl.startsWith('http');

                if (isValidUrl) {
                    // Pre-fetch filter: skip if fresh
                    if (freshUrls.has(raw.detailsUrl!)) {
                        counters.skipped++;
                        if (options.shouldLogDebug) {
                            log(`Skipping fresh event: ${raw.title}`, 'debug');
                        }
                        continue;
                    }

                    try {
                        await detailsPage.goto(raw.detailsUrl!, {
                            timeout: options.detailTimeoutMs,
                            waitUntil: 'domcontentloaded',
                        });

                        // Detect registration link
                        const regLinkInfo = await detectRegistrationLink(detailsPage);
                        regLink = regLinkInfo.url;

                        // Extract price from details page
                        const detailsPagePrice = await extractPriceFromPage(detailsPage);
                        priceText = detailsPagePrice.priceText;
                        priceMin = detailsPagePrice.priceMin;

                        // Extract image
                        imageUrl = await extractImageFromPage(detailsPage);

                        // If registration link exists, try to get better data
                        if (regLinkInfo.url) {
                            const regResult = await extractFromRegistrationPage(
                                detailsPage,
                                regLinkInfo,
                                options.regTimeoutMs
                            );

                            if (regResult.imageUrl) {
                                imageUrl = regResult.imageUrl;
                            }
                            if (regResult.priceResult?.priceText) {
                                priceText = regResult.priceResult.priceText;
                                priceMin = regResult.priceResult.priceMin;
                            }
                        }
                    } catch (navError) {
                        log(`Timeout loading details for ${raw.title}: ${(navError as Error).message}`, 'warn');
                        counters.errors++;
                    }
                } else {
                    // Fallback for invalid URLs
                    log(`Invalid details URL for ${raw.title}. Generating fallback ID.`, 'warn');
                    const slugTitle = slugify(raw.title || 'untitled');
                    const slugCity = slugify(raw.city || 'unknown');
                    const safeDate = raw.dateStr?.replace(/\//g, '') || 'nodate';

                    finalSourceUrl = `https://corridasemaratonas.com.br/fallback/${config.state}/${safeDate}-${slugTitle}-${slugCity}`;
                    priceText = 'Sob Consulta';
                }

                // Normalize date
                const dateParts = raw.dateStr?.split('/');
                const eventDate =
                    dateParts && dateParts.length === 3
                        ? new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`)
                        : new Date();

                const distances = raw.distancesStr
                    ? raw.distancesStr.split('/').map((d) => d.trim())
                    : [];

                const event: StandardizedEvent = {
                    title: raw.title || 'Untitled',
                    date: eventDate,
                    city: raw.city || null,
                    state: config.state,
                    distances,
                    regUrl: regLink || null,
                    sourceUrl: finalSourceUrl!,
                    sourcePlatform: 'corridasemaratonas',
                    sourceEventId: null,
                    imageUrl: imageUrl || null,
                    priceText: priceText || null,
                    priceMin,
                    rawLocation: raw.city ? `${raw.city} - ${config.state}` : null,
                };

                events.push(event);
                counters.processed++;

                // Delay between events
                if (isValidUrl) {
                    await new Promise((r) => setTimeout(r, options.eventDelayMs));
                } else {
                    await new Promise((r) => setTimeout(r, 100));
                }
            } catch (err) {
                counters.errors++;
                log(`Failed to process event ${raw.title}: ${(err as Error).message}`, 'error');
            }
        }

        await detailsPage.close();
        await page.close();
    } catch (error) {
        log(`Failed to scrape state ${config.state}: ${(error as Error).message}`, 'error');
        await page.close();
    }

    return { events, counters };
}

async function detectRegistrationLink(page: Page): Promise<{ url: string | null; platform: Platform }> {
    const regLink = await page.$$eval('a', (links) => {
        const keywords = ['inscreva', 'inscricao', 'inscriçao', 'inscri', 'ticket', 'cadastro', 'participar'];

        for (const link of links) {
            const href = link.href?.toLowerCase() ?? '';
            const text = link.textContent?.toLowerCase() ?? '';

            for (const kw of keywords) {
                if (href.includes(kw) || text.includes(kw)) {
                    return link.href;
                }
            }

            if (
                href.includes('ticketsports') ||
                href.includes('doity') ||
                href.includes('zenite') ||
                href.includes('sympla')
            ) {
                return link.href;
            }
        }
        return null;
    });

    return {
        url: regLink,
        platform: detectPlatform(regLink),
    };
}

async function extractPriceFromPage(page: Page): Promise<PriceResult> {
    const pageText = await page.evaluate(() => document.body?.innerText || '');
    return extractPriceWithHeuristics(pageText);
}

async function extractImageFromPage(page: Page): Promise<string | null> {
    return page.evaluate(() => {
        // Try og:image
        const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
        if (ogImage?.content) {
            return ogImage.content;
        }

        // Try twitter:image
        const twitterImage = document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement;
        if (twitterImage?.content) {
            return twitterImage.content;
        }

        // Try banner images
        const bannerKeywords = ['banner', 'cartaz', 'poster', 'capa', 'hero'];
        const images = Array.from(document.querySelectorAll('img'));

        for (const img of images) {
            const srcText = [img.src, img.alt, img.className].join(' ').toLowerCase();
            if (bannerKeywords.some((k) => srcText.includes(k))) {
                return img.src;
            }
        }

        // Largest image
        const validImages = images.filter((img) => img.naturalWidth >= 300);
        if (validImages.length > 0) {
            validImages.sort((a, b) => b.naturalWidth - a.naturalWidth);
            return validImages[0].src;
        }

        return null;
    });
}

async function extractFromRegistrationPage(
    page: Page,
    regLinkInfo: { url: string | null; platform: Platform },
    regTimeoutMs: number
): Promise<{ imageUrl: string | null; priceResult: PriceResult | null }> {
    if (!regLinkInfo.url) {
        return { imageUrl: null, priceResult: null };
    }

    try {
        await page.goto(regLinkInfo.url, {
            timeout: regTimeoutMs,
            waitUntil: 'domcontentloaded',
        });

        // Apply platform-specific wait
        const waitConfig = getPlatformWaitConfig(regLinkInfo.platform);
        if (waitConfig) {
            try {
                await page.waitForSelector(waitConfig.selector, { timeout: waitConfig.timeout });
            } catch {
                // Continue even if selector not found
            }
        }

        // Extra delay for platform
        const extraDelay = getPlatformDelay(regLinkInfo.platform);
        if (extraDelay > 0) {
            await new Promise((r) => setTimeout(r, extraDelay));
        }

        const imageUrl = await extractImageFromPage(page);
        const priceResult = await extractPriceFromPage(page);

        return { imageUrl, priceResult };
    } catch (error) {
        return { imageUrl: null, priceResult: null };
    }
}
