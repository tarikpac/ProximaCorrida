/**
 * TicketSports Provider
 * Scrapes running events from ticketsports.com.br
 * 
 * Priority: 1 (highest)
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

const PROVIDER_NAME = 'ticketsports';
const PROVIDER_PRIORITY = 1; // Highest priority

// Base URL for running events listing
const LISTING_URL = 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Todo-o-Brasil/Todas-as-cidades/0,00/0,00/false/?termo=&periodo=0&mes=&inicio=&fim=&ordenacao=2&pais=';

// State-specific listing URLs
const STATE_LISTING_URLS: Record<string, string> = {
    AC: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Acre/Todas-as-cidades/0,00/0,00/false/',
    AL: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Alagoas/Todas-as-cidades/0,00/0,00/false/',
    AP: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Amapa/Todas-as-cidades/0,00/0,00/false/',
    AM: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Amazonas/Todas-as-cidades/0,00/0,00/false/',
    BA: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Bahia/Todas-as-cidades/0,00/0,00/false/',
    CE: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Ceara/Todas-as-cidades/0,00/0,00/false/',
    DF: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Distrito-Federal/Todas-as-cidades/0,00/0,00/false/',
    ES: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Espirito-Santo/Todas-as-cidades/0,00/0,00/false/',
    GO: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Goias/Todas-as-cidades/0,00/0,00/false/',
    MA: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Maranhao/Todas-as-cidades/0,00/0,00/false/',
    MT: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Mato-Grosso/Todas-as-cidades/0,00/0,00/false/',
    MS: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Mato-Grosso-do-Sul/Todas-as-cidades/0,00/0,00/false/',
    MG: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Minas-Gerais/Todas-as-cidades/0,00/0,00/false/',
    PA: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Para/Todas-as-cidades/0,00/0,00/false/',
    PB: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Paraiba/Todas-as-cidades/0,00/0,00/false/',
    PR: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Parana/Todas-as-cidades/0,00/0,00/false/',
    PE: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Pernambuco/Todas-as-cidades/0,00/0,00/false/',
    PI: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Piaui/Todas-as-cidades/0,00/0,00/false/',
    RJ: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Rio-de-Janeiro/Todas-as-cidades/0,00/0,00/false/',
    RN: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Rio-Grande-do-Norte/Todas-as-cidades/0,00/0,00/false/',
    RS: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Rio-Grande-do-Sul/Todas-as-cidades/0,00/0,00/false/',
    RO: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Rondonia/Todas-as-cidades/0,00/0,00/false/',
    RR: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Roraima/Todas-as-cidades/0,00/0,00/false/',
    SC: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Santa-Catarina/Todas-as-cidades/0,00/0,00/false/',
    SP: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Sao-Paulo/Todas-as-cidades/0,00/0,00/false/',
    SE: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Sergipe/Todas-as-cidades/0,00/0,00/false/',
    TO: 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua/Tocantins/Todas-as-cidades/0,00/0,00/false/',
};

interface RawEventCard {
    title: string;
    detailUrl: string;
    dateStr: string;
    location: string;
    imageUrl: string | null;
}

/**
 * TicketSports Provider Implementation
 */
export class TicketSportsProvider implements ProviderScraper {
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

        const statesToScrape = states && states.length > 0
            ? states.filter(s => this.supportsState(s))
            : [...ALL_BRAZILIAN_STATES];

        if (statesToScrape.length === 0) {
            providerLog(PROVIDER_NAME, 'No states to scrape', 'warn');
            return emptyResult();
        }

        // For efficiency, scrape all Brazil at once if no specific states
        if (statesToScrape.length === ALL_BRAZILIAN_STATES.length) {
            return this.scrapeAllBrazil(context, options);
        }

        // Otherwise, scrape specific states
        const allEvents: StandardizedEvent[] = [];
        let totalProcessed = 0;
        let totalSkipped = 0;
        let totalErrors = 0;

        for (const state of statesToScrape) {
            try {
                const result = await this.scrapeState(context, state, options);
                allEvents.push(...result.events);
                totalProcessed += result.stats.processed;
                totalSkipped += result.stats.skipped;
                totalErrors += result.stats.errors;
            } catch (error) {
                providerLog(PROVIDER_NAME, `Failed to scrape ${state}: ${(error as Error).message}`, 'error');
                totalErrors++;
            }
        }

        return {
            events: allEvents,
            stats: {
                processed: totalProcessed,
                skipped: totalSkipped,
                errors: totalErrors,
            },
        };
    }

    private async scrapeAllBrazil(
        context: BrowserContext,
        options: ProviderScraperOptions
    ): Promise<ProviderScrapeResult> {
        providerLog(PROVIDER_NAME, 'Scraping all Brazil...');
        return this.scrapeUrl(context, LISTING_URL, null, options);
    }

    private async scrapeState(
        context: BrowserContext,
        state: string,
        options: ProviderScraperOptions
    ): Promise<ProviderScrapeResult> {
        const url = STATE_LISTING_URLS[state];
        if (!url) {
            providerLog(PROVIDER_NAME, `No URL for state ${state}`, 'warn');
            return emptyResult();
        }

        providerLog(PROVIDER_NAME, `Scraping state ${state}...`);
        return this.scrapeUrl(context, url, state, options);
    }

    private async scrapeUrl(
        context: BrowserContext,
        url: string,
        state: string | null,
        options: ProviderScraperOptions
    ): Promise<ProviderScrapeResult> {
        const events: StandardizedEvent[] = [];
        let processed = 0;
        let skipped = 0;
        let errors = 0;

        const page = await context.newPage();

        try {
            await page.goto(url, { timeout: options.detailTimeoutMs * 2 });

            // Wait for event cards to load
            try {
                await page.waitForSelector('.card, a.card', { timeout: options.detailTimeoutMs });
            } catch {
                providerLog(PROVIDER_NAME, 'No events found or timeout', 'warn');
                await closePage(page);
                return emptyResult();
            }

            // Extract event cards from listing
            const rawEvents = await this.extractEventCards(page);
            providerLog(PROVIDER_NAME, `Found ${rawEvents.length} events in listing`);

            // Process each event detail
            for (const rawEvent of rawEvents) {
                try {
                    const event = await this.processEventDetail(
                        context,
                        rawEvent,
                        state,
                        options
                    );

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
        return page.$$eval('div.events-grid a.card, a.card', (cards) => {
            return cards.map((card) => {
                const anchor = card as HTMLAnchorElement;
                const img = card.querySelector('img') as HTMLImageElement;
                const timeEl = card.querySelector('time');

                // Extract title from card content
                const titleDiv = card.querySelector('div:nth-child(2) > div:nth-child(2)');
                const title = titleDiv?.textContent?.trim() || '';

                // Extract location
                const locationDiv = card.querySelector('div:last-child > div:last-child');
                const location = locationDiv?.textContent?.trim() || '';

                return {
                    title,
                    detailUrl: anchor.href,
                    dateStr: timeEl?.getAttribute('datetime') || timeEl?.textContent || '',
                    location,
                    imageUrl: img?.src || null,
                };
            }).filter(e => e.title && e.detailUrl);
        });
    }

    private async processEventDetail(
        context: BrowserContext,
        rawEvent: RawEventCard,
        stateHint: string | null,
        options: ProviderScraperOptions
    ): Promise<StandardizedEvent | null> {
        const page = await context.newPage();

        try {
            await page.goto(rawEvent.detailUrl, { timeout: options.detailTimeoutMs });
            await page.waitForLoadState('domcontentloaded');

            // Extract event details
            const details = await page.evaluate(() => {
                const h1 = document.querySelector('h1');
                const title = h1?.textContent?.trim() || '';

                // Find date (usually in a time element or structured div)
                const timeEl = document.querySelector('time');
                const dateStr = timeEl?.getAttribute('datetime') || timeEl?.textContent || '';

                // Find location with maps link
                const mapsLink = document.querySelector('a[href*="google.com/maps"]');
                const locationText = mapsLink?.textContent?.trim() || '';

                // Find registration button
                const regButton = document.querySelector('#bot_inscrever, a[href*="inscrever"], button:has-text("Inscrever")') as HTMLAnchorElement | HTMLButtonElement;
                const regUrl = (regButton as HTMLAnchorElement)?.href || window.location.href;

                // Find image
                const bannerImg = document.querySelector('.event-banner img, [class*="banner"] img') as HTMLImageElement;
                const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
                const imageUrl = bannerImg?.src || ogImage?.content || null;

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
                    bodyText: bodyText.substring(0, 5000), // For price extraction
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
            const { city, state } = this.parseLocation(details.locationText || rawEvent.location, stateHint);

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

        // Try ISO format first
        let date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date;
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

    private parseLocation(locationText: string, stateHint: string | null): { city: string | null; state: string | null } {
        if (!locationText) {
            return { city: null, state: stateHint };
        }

        // Common pattern: "City - ST" or "City, ST" or "City/ST"
        const match = locationText.match(/^(.+?)[\s,\-\/]+([A-Z]{2})$/i);
        if (match) {
            return {
                city: match[1].trim(),
                state: match[2].toUpperCase(),
            };
        }

        // If we have a state hint, use the full location as city
        if (stateHint) {
            return {
                city: locationText,
                state: stateHint,
            };
        }

        return { city: locationText, state: null };
    }

    private extractEventId(url: string): string | null {
        // Extract event ID from URL like: ticketsports.com.br/e/event-name-12345
        const match = url.match(/\/e\/[^\/]+-(\d+)/);
        return match ? match[1] : null;
    }
}

// Export singleton instance
export const ticketSportsProvider = new TicketSportsProvider();
