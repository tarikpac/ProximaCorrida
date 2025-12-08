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
                await page.waitForTimeout(5000);
                // Just check that the page loaded - we'll extract from text
                await page.waitForLoadState('domcontentloaded');
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
        // Race83 structure: Events are shown as blocks with date, title, location, and INSCREVA-SE button
        // The structure from debug shows patterns like:
        // DD/MM/YYYY
        // EVENT TITLE
        // CITY - ST
        // INSCREVA-SE

        // Get all page text and parse it
        const pageData = await page.evaluate(() => {
            const bodyText = document.body.innerText;

            // Get all INSCREVA-SE links
            const inscrevaLinks: Array<{ href: string, text: string }> = [];
            document.querySelectorAll('a').forEach((a) => {
                const text = a.textContent?.trim().toUpperCase() || '';
                if (text.includes('INSCREVA') && a.href.includes('race83.com.br')) {
                    inscrevaLinks.push({ href: a.href, text: text });
                }
            });

            return { bodyText, inscrevaLinks };
        });

        const events: RawEventCard[] = [];

        // Parse events from body text using pattern matching
        // Pattern: DD/MM/YYYY\n\nTITLE\n\n CITY - ST\n\nINSCREVA-SE
        const lines = pageData.bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Look for date pattern
            const dateMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{4})$/);
            if (!dateMatch) continue;

            const dateStr = dateMatch[1];

            // Next non-empty lines should be: title, location, INSCREVA-SE
            let title = '';
            let location = '';

            for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
                const nextLine = lines[j];

                if (nextLine.toUpperCase().includes('INSCREVA')) {
                    break; // We've hit the button, stop looking
                }

                // Skip lines that contain navigation words
                if (nextLine.toUpperCase().includes('INSCRIÇÃO')) continue;

                // Valid Brazilian state codes for Race83 (Nordeste focus)
                const validStates = ['PB', 'PE', 'RN', 'CE', 'BA', 'AL', 'SE', 'MA', 'PI',
                    'SP', 'RJ', 'MG', 'ES', 'SC', 'PR', 'RS', 'GO', 'DF'];

                // Check if it's a location (pattern: CITY - ST)
                const locationMatch = nextLine.match(/^(.+?)\s*[-–]\s*([A-Z]{2})\s*$/i);
                if (locationMatch) {
                    const potentialState = locationMatch[2].toUpperCase();
                    // Only accept if the state is valid AND the city part doesn't contain INSCREVA
                    if (validStates.includes(potentialState) &&
                        !locationMatch[1].toUpperCase().includes('INSCREVA')) {
                        if (!title) {
                            // This might be title if no title yet
                            title = nextLine;
                        } else {
                            // This is location
                            location = nextLine;
                        }
                    }
                } else if (!title && nextLine.length > 5 && !nextLine.match(/^\d/)) {
                    // This is the title
                    title = nextLine;
                } else if (title && !location && nextLine.length > 3) {
                    // This might be location if it follows the pattern
                    location = nextLine;
                }
            }

            if (title && title.length > 5) {
                // Find matching INSCREVA-SE link
                const eventSlug = this.slugify(title);
                let detailUrl = '';

                for (const link of pageData.inscrevaLinks) {
                    // Match by title similarity in URL
                    const urlLower = link.href.toLowerCase();
                    const titleLower = title.toLowerCase();
                    const titleWords = titleLower.split(/\s+/).filter(w => w.length > 3);

                    // Check if URL contains key words from title
                    const matches = titleWords.filter(w => urlLower.includes(w.replace(/[^a-z]/g, '')));
                    if (matches.length >= 2 || (titleWords.length === 1 && matches.length === 1)) {
                        detailUrl = link.href.replace('/login/', '/evento/');
                        break;
                    }
                }

                // Fallback: create URL from title
                if (!detailUrl) {
                    detailUrl = `https://www.race83.com.br/evento/2025/corrida-de-rua/${eventSlug}`;
                }

                events.push({
                    title,
                    detailUrl,
                    dateStr,
                    location,
                    imageUrl: null,
                });
            }
        }

        return events;
    }

    private slugify(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
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

                // Location - first use the raw location from listing (e.g., "JOÃO PESSOA - PB")
                let city = '';
                let state = '';

                // Try to extract from known location pattern at end of text block
                // Pattern examples: "JOÃO PESSOA - PB", "CAMPINA GRANDE-PB"
                const locationPatterns = [
                    /([A-Za-zÀ-ú\s]+)\s*[-–]\s*(PB|PE|RN|CE|BA|AL|SE|MA|PI)(?:\s|$)/,
                    /CIDADE[:\s]+([^,\n-]+)[-,\s]+([A-Z]{2})/i,
                    /LOCAL[:\s]+([^,\n-]+)[-,\s]+([A-Z]{2})/i,
                ];

                for (const pattern of locationPatterns) {
                    const match = bodyText.match(pattern);
                    if (match) {
                        city = match[1].trim();
                        state = match[2].toUpperCase();
                        break;
                    }
                }

                // If still no state, try explicit patterns
                if (!state) {
                    const estadoMatch = bodyText.match(/ESTADO[:\s]+([A-Z]{2})/i);
                    if (estadoMatch) {
                        state = estadoMatch[1].toUpperCase();
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

            // Use rawEvent.location as fallback for state if available
            // Format: "JOÃO PESSOA - PB" or " JOÃO PESSOA - PB"
            let finalCity = details.city;
            let finalState = details.state;

            // Valid Brazilian state codes
            const validStates = ['PB', 'PE', 'RN', 'CE', 'BA', 'AL', 'SE', 'MA', 'PI',
                'SP', 'RJ', 'MG', 'ES', 'SC', 'PR', 'RS', 'GO', 'DF',
                'AC', 'AM', 'AP', 'MT', 'MS', 'PA', 'RO', 'RR', 'TO'];

            // Validate that the state from details is valid and not from INSCREVA-SE
            if (finalState && !validStates.includes(finalState)) {
                finalState = '';
            }

            if (!finalState && rawEvent.location) {
                // Don't parse if location contains INSCREVA
                if (!rawEvent.location.toUpperCase().includes('INSCREVA')) {
                    const locMatch = rawEvent.location.match(/(.+?)\s*[-–]\s*([A-Z]{2})\s*$/i);
                    if (locMatch) {
                        const potentialState = locMatch[2].toUpperCase();
                        if (validStates.includes(potentialState)) {
                            if (!finalCity) finalCity = locMatch[1].trim();
                            finalState = potentialState;
                        }
                    }
                }
            }

            // Check state filter
            if (states && states.length > 0 && finalState) {
                if (!states.includes(finalState)) {
                    providerLog(PROVIDER_NAME, `Skipping event in ${finalState} (not in filter)`, 'debug');
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
                city: finalCity || null,
                state: finalState || null,
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
