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
                await page.waitForSelector('h5, h6, a[href*="/evento/"]', { timeout: options.detailTimeoutMs });
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
        return page.$$eval('a[href*="/evento/"], a[href*="/login/"]', (links) => {
            const seen = new Set<string>();
            const events: RawEventCard[] = [];

            links.forEach((link) => {
                const anchor = link as HTMLAnchorElement;

                // Skip if already seen
                if (seen.has(anchor.href)) return;

                // Only process event detail links
                if (!anchor.href.includes('/evento/') && !anchor.href.includes('/login/')) return;

                seen.add(anchor.href);

                // Try to find card container
                const card = anchor.closest('div, article, li') || anchor.parentElement;
                const img = card?.querySelector('img') as HTMLImageElement;

                // Get text content for title
                const h5 = card?.querySelector('h5');
                const h6 = card?.querySelector('h6');

                const title = h5?.textContent?.trim() || anchor.textContent?.trim() || '';
                const dateStr = h6?.textContent?.trim() || '';

                // Skip navigation links
                if (title.length < 5 || title.toUpperCase().includes('MENU')) return;

                events.push({
                    title,
                    detailUrl: anchor.href.replace('/login/', '/evento/'),
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

                // Registration link
                const regLink = document.querySelector('a[href*="/login/"], a:has-text("INSCREVA-SE")') as HTMLAnchorElement;
                const regUrl = regLink?.href || window.location.href;

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
