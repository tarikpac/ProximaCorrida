/**
 * Race83 Provider (Regional - Nordeste)
 * Scrapes running events from race83.com.br
 * 
 * Priority: 7
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

const PROVIDER_NAME = 'race83';
const PROVIDER_PRIORITY = 7;

const LISTING_URL = 'https://www.race83.com.br/eventos';

interface RawEventCard {
    title: string;
    detailUrl: string;
    dateStr: string;
    location: string;
    imageUrl: string | null;
}

/**
 * Race83 Provider Implementation
 * Regional provider focused on Nordeste states
 */
export class Race83Provider implements ProviderScraper {
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

            // Wait for event cards to load
            try {
                // Wait for page content to load
                await page.waitForTimeout(3000);
                await page.waitForSelector('img, a[href*="evento"], button', { timeout: options.detailTimeoutMs });
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
        // Race83 structure: Each event has an image, date text, title, location, and INSCREVA-SE button
        return page.evaluate(() => {
            const events: Array<{
                title: string;
                detailUrl: string;
                dateStr: string;
                location: string;
                imageUrl: string | null;
            }> = [];
            const seen = new Set<string>();

            // Find all INSCREVA-SE buttons which link to event pages
            const buttons = document.querySelectorAll('a, button');
            buttons.forEach((btn) => {
                const text = btn.textContent?.trim().toUpperCase() || '';
                if (!text.includes('INSCREVA') && !text.includes('INSCREV')) return;

                const anchor = btn.tagName === 'A'
                    ? btn as HTMLAnchorElement
                    : btn.closest('a') as HTMLAnchorElement;

                if (!anchor?.href) return;
                if (!anchor.href.includes('race83.com.br')) return;
                if (seen.has(anchor.href)) return;
                seen.add(anchor.href);

                // Find the parent container
                let container = anchor.closest('div, article, section, li');
                if (!container) container = anchor.parentElement;

                // Find event info - look for siblings or parent content
                const allText = container?.textContent || '';

                // Extract date (DD/MM/YYYY pattern)
                const dateMatch = allText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
                const dateStr = dateMatch ? dateMatch[1] : '';

                // Find image
                const img = container?.querySelector('img') as HTMLImageElement;

                // Extract title - usually the longest meaningful text
                const textElements = container?.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div') || [];
                let title = '';
                textElements.forEach((el) => {
                    const t = el.textContent?.trim() || '';
                    // Title should be longer than 10 chars, not a date, not "INSCREVA-SE"
                    if (t.length > 10 && t.length < 100 &&
                        !t.match(/^\d{1,2}\/\d{1,2}/) &&
                        !t.toUpperCase().includes('INSCREVA') &&
                        t.length > title.length) {
                        title = t;
                    }
                });

                // Skip if no meaningful title
                if (!title || title.length < 5) return;

                // Convert login URL to evento URL
                const detailUrl = anchor.href.replace('/login/', '/evento/');

                events.push({
                    title,
                    detailUrl,
                    dateStr,
                    location: '',
                    imageUrl: img?.src || null,
                });
            });

            return events;
        });
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
                const bodyText = document.body.innerText;

                // Title - often in h1 or prominent text
                const h1 = document.querySelector('h1');
                let title = h1?.textContent?.trim() || '';

                if (!title) {
                    // Try to find title from page title
                    title = document.title.split('|')[0]?.trim() || '';
                }

                // Location - look for patterns like "CIDADE: X" or "X - ST"
                let city = '';
                let state = '';

                const cidadeMatch = bodyText.match(/CIDADE[\s:]+([^\n]+)/i);
                if (cidadeMatch) {
                    city = cidadeMatch[1].trim();
                }

                const estadoMatch = bodyText.match(/ESTADO[\s:]+([A-Z]{2})/i);
                if (estadoMatch) {
                    state = estadoMatch[1];
                }

                // Try city-state pattern if not found
                if (!state) {
                    const cityStateMatch = bodyText.match(/([A-Za-zÀ-ú\s]+)\s*[-–]\s*([A-Z]{2})/);
                    if (cityStateMatch) {
                        if (!city) city = cityStateMatch[1].trim();
                        state = cityStateMatch[2];
                    }
                }

                // Date - look for DD/MM/YYYY pattern
                let dateStr = '';
                const dateMatch = bodyText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
                if (dateMatch) {
                    dateStr = dateMatch[1];
                }

                // Image
                const mainImg = document.querySelector('img.img-capa-evento, .event-image img') as HTMLImageElement;
                const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
                const imageUrl = mainImg?.src || ogImage?.content || null;

                // Registration link (note: :has-text is not valid for querySelector)
                const regLinks = document.querySelectorAll('a[href*="/login/"], a[href*="inscr"]');
                let regUrl = window.location.href;
                regLinks.forEach((link) => {
                    const a = link as HTMLAnchorElement;
                    if (a.textContent?.toUpperCase().includes('INSCREVA')) {
                        regUrl = a.href;
                    }
                });

                // Find distances
                const distanceMatches = bodyText.match(/\d+\s*(?:km|k|quilômetros?|quilometros?)/gi) || [];
                const distances = [...new Set(distanceMatches.map(d => d.toLowerCase().replace(/\s+/g, '')))];

                return {
                    title,
                    city,
                    state,
                    dateStr,
                    regUrl,
                    imageUrl,
                    distances,
                    bodyText: bodyText.substring(0, 5000),
                };
            });

            // Check state filter
            if (states && states.length > 0 && details.state) {
                if (!states.includes(details.state)) {
                    providerLog(PROVIDER_NAME, `Skipping event in ${details.state} (not in filter)`, 'debug');
                    await closePage(page);
                    return null;
                }
            }

            // Parse date
            const date = this.parseDate(details.dateStr || rawEvent.dateStr);
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
                city: details.city || null,
                state: details.state || null,
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

    private extractEventId(url: string): string | null {
        // Extract event slug from URL like: race83.com.br/evento/2025/corrida-de-rua/event-name
        const match = url.match(/race83\.com\.br\/(?:evento|login)\/[^\/]+\/[^\/]+\/([^\/\?]+)/i);
        return match ? match[1] : null;
    }
}

export const race83Provider = new Race83Provider();
