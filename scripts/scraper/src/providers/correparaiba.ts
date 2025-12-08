/**
 * Corre Paraíba Provider (Regional - Nordeste)
 * Scrapes running events from correparaiba.com.br
 * 
 * Priority: 6
 * Coverage: Nordeste (PB, PE, RN, CE, AL, SE, BA, MA, PI)
 */

import { BrowserContext, Page } from 'playwright';
import {
    ProviderScraper,
    ProviderScraperOptions,
    ProviderScrapeResult,
    StandardizedEvent,
    NORDESTE_STATES,
} from '../interfaces';
import { providerLog, emptyResult, delay, closePage } from './base';
import { extractPriceWithHeuristics } from '../utils/price-extraction';

const PROVIDER_NAME = 'correparaiba';
const PROVIDER_PRIORITY = 6;

const LISTING_URL = 'https://correparaiba.com.br/eventos';

interface RawEventCard {
    title: string;
    detailUrl: string;
    imageUrl: string | null;
}

/**
 * Corre Paraíba Provider Implementation
 * Regional provider focused on Nordeste states
 */
export class CorreParaibaProvider implements ProviderScraper {
    getName(): string {
        return PROVIDER_NAME;
    }

    getPriority(): number {
        return PROVIDER_PRIORITY;
    }

    supportsState(state: string): boolean {
        // Only supports Nordeste states
        return NORDESTE_STATES.includes(state as any);
    }

    async scrape(
        context: BrowserContext,
        options: ProviderScraperOptions,
        states?: string[]
    ): Promise<ProviderScrapeResult> {
        providerLog(PROVIDER_NAME, 'Starting scraper (regional Nordeste)...');

        // If states are specified, check if any are in Nordeste
        if (states && states.length > 0) {
            const nordesteStates = states.filter(s => this.supportsState(s));
            if (nordesteStates.length === 0) {
                providerLog(PROVIDER_NAME, 'No Nordeste states in filter - skipping', 'info');
                return emptyResult();
            }
        }

        const events: StandardizedEvent[] = [];
        let processed = 0;
        let skipped = 0;
        let errors = 0;

        const page = await context.newPage();

        try {
            await page.goto(LISTING_URL, { timeout: options.detailTimeoutMs * 2 });

            // Handle cookie consent
            try {
                const acceptBtn = await page.$('button:has-text("ACEITAR"), button:has-text("Aceitar")');
                if (acceptBtn) {
                    await acceptBtn.click();
                    await delay(500);
                }
            } catch {
                // No consent dialog
            }

            // Wait for event links to load
            try {
                await page.waitForSelector('a[href*="/corrida"], a[href*="corrida"]', { timeout: options.detailTimeoutMs });
            } catch {
                providerLog(PROVIDER_NAME, 'No events found or timeout', 'warn');
                await closePage(page);
                return emptyResult();
            }

            // Extract event cards
            const rawEvents = await this.extractEventCards(page);
            providerLog(PROVIDER_NAME, `Found ${rawEvents.length} events in listing`);

            // Process each event
            for (const rawEvent of rawEvents) {
                try {
                    const event = await this.processEventDetail(context, rawEvent, states, options);

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

    private async extractEventCards(page: Page): Promise<RawEventCard[]> {
        // Debug showed classes: tg-listing-card-title, tg-destination-item
        // Events format: DATE\nTITLE\nLOCATION

        // First try to find event items with TG classes
        const fromTgItems = await page.$$eval('.tg-destination-item, [class*="tg-listing"]', (items) => {
            const events: Array<{ title: string, detailUrl: string, imageUrl: string | null }> = [];

            items.forEach((item) => {
                const anchor = item.querySelector('a') as HTMLAnchorElement;
                const titleEl = item.querySelector('.tg-listing-card-title, [class*="card-title"]');
                const img = item.querySelector('img') as HTMLImageElement;

                const title = titleEl?.textContent?.trim() || anchor?.textContent?.trim() || '';
                const detailUrl = anchor?.href || '';

                if (title && title.length > 5 && detailUrl.includes('correparaiba.com.br')) {
                    events.push({
                        title,
                        detailUrl,
                        imageUrl: img?.src || null,
                    });
                }
            });

            return events;
        });

        if (fromTgItems.length > 0) {
            return fromTgItems;
        }

        // Fallback: Parse from page text - events appear as:
        // "DD de MÊS de YYYY" 
        // "TITLE"
        // "CITY - ST"
        const pageData = await page.evaluate(() => {
            const bodyText = document.body.innerText;
            const links: Array<{ href: string, text: string }> = [];

            document.querySelectorAll('a').forEach((a) => {
                if (a.href.includes('correparaiba.com.br/') &&
                    !a.href.endsWith('/eventos') &&
                    !a.href.includes('#') &&
                    a.href !== 'https://correparaiba.com.br/') {
                    links.push({ href: a.href, text: a.textContent?.trim() || '' });
                }
            });

            return { bodyText, links };
        });

        const events: RawEventCard[] = [];
        const seen = new Set<string>();

        // Parse events from body text
        const lines = pageData.bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Look for date pattern: "DD de MÊS de YYYY"
            const dateMatch = line.match(/^\d{1,2}\s+de\s+\w+\s+de\s+\d{4}$/i);
            if (!dateMatch) continue;

            // Next lines should be title and location
            let title = '';
            let location = '';

            for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
                const nextLine = lines[j];

                // Skip if it's another date
                if (nextLine.match(/^\d{1,2}\s+de\s+/i)) break;

                // Check if it's a location (CITY - ST pattern)
                const locationMatch = nextLine.match(/^(.+)\s*[-–]\s*([A-Z]{2})$/);
                if (locationMatch) {
                    location = nextLine;
                    break;
                } else if (!title && nextLine.length > 5) {
                    title = nextLine;
                }
            }

            if (title && title.length > 5) {
                // Find matching link
                let detailUrl = '';
                const titleLower = title.toLowerCase();

                for (const link of pageData.links) {
                    if (seen.has(link.href)) continue;

                    const urlLower = link.href.toLowerCase();
                    const titleWords = titleLower.split(/\s+/).filter(w => w.length > 3);
                    const matchCount = titleWords.filter(w => urlLower.includes(w.replace(/[^a-z]/g, ''))).length;

                    if (matchCount >= 2) {
                        detailUrl = link.href;
                        seen.add(link.href);
                        break;
                    }
                }

                if (detailUrl) {
                    events.push({
                        title,
                        detailUrl,
                        imageUrl: null,
                    });
                }
            }
        }

        return events;
    }

    private async processEventDetail(
        context: BrowserContext,
        rawEvent: RawEventCard,
        states: string[] | undefined,
        options: ProviderScraperOptions
    ): Promise<StandardizedEvent | null> {
        const page = await context.newPage();

        try {
            await page.goto(rawEvent.detailUrl, { timeout: options.detailTimeoutMs });
            await page.waitForLoadState('domcontentloaded');

            // Extract event details
            const details = await page.evaluate(() => {
                // Title from h1
                const h1 = document.querySelector('h1');
                const title = h1?.textContent?.trim() || '';

                // Location from h6 (typically "City - ST")
                const h6 = document.querySelector('h6');
                const locationText = h6?.textContent?.trim() || '';

                // Date from h5 or text containing date pattern
                const h5Elements = document.querySelectorAll('h5');
                let dateStr = '';

                h5Elements.forEach((h5) => {
                    const text = h5.textContent || '';
                    if (text.match(/\d{1,2}.*DE.*\d{4}/i)) {
                        dateStr = text.trim();
                    }
                });

                // Fallback: search body for date
                if (!dateStr) {
                    const bodyText = document.body.innerText;
                    const dateMatch = bodyText.match(/(\d{1,2}\s+DE\s+[A-Za-zÇç]+\s+DE\s+\d{4})/i);
                    dateStr = dateMatch ? dateMatch[1] : '';
                }

                // Image
                const mainImg = document.querySelector('article img, .post img, main img') as HTMLImageElement;
                const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
                const imageUrl = mainImg?.src || ogImage?.content || null;

                // Registration URL is the current page
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
                    distances,
                    bodyText: bodyText.substring(0, 5000),
                };
            });

            // Parse location first to check state filter
            const { city, state } = this.parseLocation(details.locationText);

            // If states are specified, check if this event matches
            if (states && states.length > 0 && state) {
                if (!states.includes(state)) {
                    providerLog(PROVIDER_NAME, `Skipping event in ${state} (not in filter)`, 'debug');
                    await closePage(page);
                    return null;
                }
            }

            // Parse date
            const date = this.parseDate(details.dateStr);
            if (!date) {
                providerLog(PROVIDER_NAME, `Could not parse date for ${rawEvent.title}`, 'warn');
                await closePage(page);
                return null;
            }

            // Extract price
            const priceResult = extractPriceWithHeuristics(details.bodyText);

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

        // Portuguese month names
        const monthNames: Record<string, string> = {
            'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03',
            'abril': '04', 'maio': '05', 'junho': '06',
            'julho': '07', 'agosto': '08', 'setembro': '09',
            'outubro': '10', 'novembro': '11', 'dezembro': '12',
        };

        // Try "DD DE MÊS DE YYYY" format
        const ptMatch = dateStr.match(/(\d{1,2})\s+DE\s+([A-Za-zÇç]+)\s+DE\s+(\d{4})/i);
        if (ptMatch) {
            const [, day, monthName, year] = ptMatch;
            const month = monthNames[monthName.toLowerCase()];
            if (month) {
                const date = new Date(`${year}-${month}-${day.padStart(2, '0')}`);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }

        // Try DD/MM/YYYY format
        const brMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (brMatch) {
            const [, day, month, year] = brMatch;
            const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
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

        // Pattern: "CITY - ST" (common in this site)
        const match = locationText.match(/^(.+?)\s*[-–]\s*([A-Z]{2})$/i);
        if (match) {
            return {
                city: match[1].trim(),
                state: match[2].toUpperCase(),
            };
        }

        return { city: locationText, state: null };
    }

    private extractEventId(url: string): string | null {
        // Extract event slug from URL like: correparaiba.com.br/corrida-name
        const match = url.match(/correparaiba\.com\.br\/([^\/\?]+)$/i);
        return match ? match[1] : null;
    }
}

export const correParaibaProvider = new CorreParaibaProvider();
