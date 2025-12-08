/**
 * Sympla Provider
 * Scrapes running events from sympla.com.br
 * 
 * Priority: 4
 * Coverage: Nacional (all Brazilian states)
 */

import { BrowserContext, Page } from 'playwright';
import {
    ProviderScraper,
    ProviderScraperOptions,
    ProviderScrapeResult,
    StandardizedEvent,
    ALL_BRAZILIAN_STATES,
} from '../interfaces';
import { providerLog, emptyResult, delay, closePage } from './base';
import { extractPriceWithHeuristics } from '../utils/price-extraction';

const PROVIDER_NAME = 'sympla';
const PROVIDER_PRIORITY = 4;

// Search URL for running events
const SEARCH_URL = 'https://www.sympla.com.br/eventos?s=corrida&c=esportes';

interface RawEventCard {
    title: string;
    detailUrl: string;
    dateStr: string;
    location: string;
    imageUrl: string | null;
}

/**
 * Sympla Provider Implementation
 */
export class SymplaProvider implements ProviderScraper {
    getName(): string {
        return PROVIDER_NAME;
    }

    getPriority(): number {
        return PROVIDER_PRIORITY;
    }

    supportsState(state: string): boolean {
        return ALL_BRAZILIAN_STATES.includes(state as any);
    }

    async scrape(
        context: BrowserContext,
        options: ProviderScraperOptions,
        states?: string[]
    ): Promise<ProviderScrapeResult> {
        providerLog(PROVIDER_NAME, 'Starting scraper...');

        const events: StandardizedEvent[] = [];
        let processed = 0;
        let skipped = 0;
        let errors = 0;

        const page = await context.newPage();

        try {
            await page.goto(SEARCH_URL, { timeout: options.detailTimeoutMs * 2 });

            // Wait for event cards to load
            try {
                await page.waitForSelector('[class*="EventCard"], [class*="event-card"], a[href*="/evento/"]', {
                    timeout: options.detailTimeoutMs
                });
            } catch {
                providerLog(PROVIDER_NAME, 'No events found or timeout', 'warn');
                await closePage(page);
                return emptyResult();
            }

            // Scroll to load more events
            await this.scrollToLoadMore(page);

            // Extract event cards
            const rawEvents = await this.extractEventCards(page);
            providerLog(PROVIDER_NAME, `Found ${rawEvents.length} events in listing`);

            // Filter by state if specified
            const filteredEvents = states && states.length > 0
                ? rawEvents.filter(e => this.matchesStateFilter(e.location, states))
                : rawEvents;

            providerLog(PROVIDER_NAME, `${filteredEvents.length} events after state filter`);

            // Process each event
            for (const rawEvent of filteredEvents) {
                try {
                    const event = await this.processEventDetail(context, rawEvent, options);

                    if (event) {
                        events.push(event);
                        processed++;
                    } else {
                        skipped++;
                    }

                    await delay(options.eventDelayMs);
                } catch (error) {
                    providerLog(PROVIDER_NAME, `Error processing ${rawEvent.title}: ${(error as Error).message}`, 'error');
                    errors++;
                }
            }
        } finally {
            await closePage(page);
        }

        return {
            events,
            stats: { processed, skipped, errors },
        };
    }

    private async scrollToLoadMore(page: Page): Promise<void> {
        // Scroll down a few times to trigger lazy loading
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight));
            await delay(1500);
        }
    }

    private async extractEventCards(page: Page): Promise<RawEventCard[]> {
        return page.$$eval('a[href*="/evento/"]', (links) => {
            const seen = new Set<string>();
            return links.map((link) => {
                const anchor = link as HTMLAnchorElement;

                // Skip if already seen (dedup by URL)
                if (seen.has(anchor.href)) return null;
                seen.add(anchor.href);

                const parent = anchor.closest('[class*="Card"], [class*="card"], li, article') || anchor.parentElement;
                const img = parent?.querySelector('img') as HTMLImageElement;

                // Try to find event info from card structure
                const textElements = parent?.querySelectorAll('p, span, h2, h3, h4, div');
                let title = '';
                let dateStr = '';
                let location = '';

                textElements?.forEach((el) => {
                    const text = el.textContent?.trim() || '';
                    if (!title && text.length > 5 && text.length < 100) {
                        title = text;
                    } else if (!dateStr && text.match(/\d{1,2}.*\d{4}|^\d{1,2}\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i)) {
                        dateStr = text;
                    } else if (!location && text.match(/[A-Z]{2}$/)) {
                        location = text;
                    }
                });

                // Fallback title from anchor text
                if (!title) {
                    title = anchor.textContent?.trim() || '';
                }

                if (!title || !anchor.href.includes('/evento/')) {
                    return null;
                }

                return {
                    title,
                    detailUrl: anchor.href,
                    dateStr,
                    location,
                    imageUrl: img?.src || null,
                };
            }).filter((e): e is RawEventCard => e !== null);
        });
    }

    private matchesStateFilter(location: string, states: string[]): boolean {
        if (!location) return true;
        const upperLocation = location.toUpperCase();
        return states.some(state => upperLocation.includes(state));
    }

    private async processEventDetail(
        context: BrowserContext,
        rawEvent: RawEventCard,
        options: ProviderScraperOptions
    ): Promise<StandardizedEvent | null> {
        const page = await context.newPage();

        try {
            await page.goto(rawEvent.detailUrl, { timeout: options.detailTimeoutMs });
            await page.waitForLoadState('domcontentloaded');

            // Extract event details
            const details = await page.evaluate(() => {
                // Title
                const h1 = document.querySelector('h1');
                const title = h1?.textContent?.trim() || '';

                // Date - look for structured data or specific elements
                let dateStr = '';
                const dateElements = document.querySelectorAll('[class*="date"], [class*="Date"], time');
                dateElements.forEach((el) => {
                    const text = el.textContent?.trim() || '';
                    if (text.match(/\d{1,2}.*\d{4}/)) {
                        dateStr = text;
                    }
                });

                // Also try meta tags
                if (!dateStr) {
                    const metaDate = document.querySelector('meta[property="event:start_time"], meta[name="event-date"]');
                    dateStr = metaDate?.getAttribute('content') || '';
                }

                // Location
                let locationText = '';
                const locationElements = document.querySelectorAll('[class*="location"], [class*="Location"], address');
                locationElements.forEach((el) => {
                    const text = el.textContent?.trim() || '';
                    if (text.match(/[A-Z]{2}/) && text.length < 100) {
                        locationText = text;
                    }
                });

                // Image
                const bannerImg = document.querySelector('[class*="banner"] img, [class*="cover"] img, .event-image img') as HTMLImageElement;
                const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
                const imageUrl = bannerImg?.src || ogImage?.content || null;

                // Price
                const priceEl = document.querySelector('[class*="price"], [class*="Price"], .ticket-price');
                let priceText = priceEl?.textContent?.trim() || '';

                // Registration URL (current page is the registration page for Sympla)
                const regUrl = window.location.href;

                // Find distances
                const bodyText = document.body.innerText;
                const distanceMatches = bodyText.match(/\d+\s*(?:km|k|quilômetros?|quilometros?)/gi) || [];
                const distances = [...new Set(distanceMatches.map(d => d.toLowerCase().replace(/\s+/g, '')))];

                return {
                    title,
                    dateStr,
                    locationText,
                    regUrl,
                    imageUrl,
                    priceText,
                    distances,
                    bodyText: bodyText.substring(0, 5000),
                };
            });

            // Parse date
            const date = this.parseDate(details.dateStr || rawEvent.dateStr);
            if (!date) {
                providerLog(PROVIDER_NAME, `Could not parse date for ${rawEvent.title}`, 'warn');
                await closePage(page);
                return null;
            }

            // Parse location
            const { city, state } = this.parseLocation(details.locationText || rawEvent.location);

            // Extract price
            const priceResult = details.priceText
                ? { priceText: details.priceText, priceMin: this.parsePrice(details.priceText) }
                : extractPriceWithHeuristics(details.bodyText);

            const event: StandardizedEvent = {
                title: details.title || rawEvent.title,
                date,
                city,
                state,
                distances: details.distances.length > 0 ? details.distances : ['Corrida'],
                regUrl: details.regUrl,
                sourceUrl: rawEvent.detailUrl,
                sourcePlatform: PROVIDER_NAME,
                sourceEventId: this.extractEventId(rawEvent.detailUrl),
                imageUrl: details.imageUrl || rawEvent.imageUrl,
                priceText: priceResult.priceText,
                priceMin: priceResult.priceMin,
            };

            await closePage(page);
            return event;
        } catch (error) {
            await closePage(page);
            throw error;
        }
    }

    private parseDate(dateStr: string): Date | null {
        if (!dateStr) return null;

        // Try ISO format
        let date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date;
        }

        // Portuguese month names
        const monthNames: Record<string, string> = {
            'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04',
            'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08',
            'set': '09', 'out': '10', 'nov': '11', 'dez': '12',
            'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03',
            'abril': '04', 'maio': '05', 'junho': '06',
            'julho': '07', 'agosto': '08', 'setembro': '09',
            'outubro': '10', 'novembro': '11', 'dezembro': '12',
        };

        // Try "DD de MÊS de YYYY" format
        const ptMatch = dateStr.match(/(\d{1,2})\s+(?:de\s+)?([a-zA-Záéíóúâêô]+)\s+(?:de\s+)?(\d{4})/i);
        if (ptMatch) {
            const [, day, monthName, year] = ptMatch;
            const month = monthNames[monthName.toLowerCase()];
            if (month) {
                date = new Date(`${year}-${month}-${day.padStart(2, '0')}`);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }

        // Try DD/MM/YYYY format
        const brMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (brMatch) {
            const [, day, month, year] = brMatch;
            date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }

        return null;
    }

    private parseLocation(locationText: string): { city: string | null; state: string | null } {
        if (!locationText) {
            return { city: null, state: null };
        }

        // Pattern: "City - ST" or "City, ST"
        const match = locationText.match(/([^-,]+?)[\s\-,]+([A-Z]{2})(?:\s|$)/i);
        if (match) {
            return {
                city: match[1].trim(),
                state: match[2].toUpperCase(),
            };
        }

        return { city: locationText, state: null };
    }

    private parsePrice(priceText: string): number | null {
        const match = priceText.match(/R\$\s*([\d.,]+)/);
        if (match) {
            const value = match[1].replace('.', '').replace(',', '.');
            return parseFloat(value);
        }
        return null;
    }

    private extractEventId(url: string): string | null {
        // Extract event slug/ID from URL like: sympla.com.br/evento/event-name/12345
        const match = url.match(/\/evento\/[^\/]+\/(\d+)/);
        if (match) return match[1];

        // Or just the slug
        const slugMatch = url.match(/\/evento\/([^\/\?]+)/);
        return slugMatch ? slugMatch[1] : null;
    }
}

export const symplaProvider = new SymplaProvider();
