/**
 * Doity Provider
 * Scrapes running events from doity.com.br
 * 
 * Priority: 3
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

const PROVIDER_NAME = 'doity';
const PROVIDER_PRIORITY = 3;

// Sports category ID
const SPORTS_CATEGORY_ID = '24771';
const LISTING_URL = `https://doity.com.br/eventos?category=${SPORTS_CATEGORY_ID}`;

interface RawEventCard {
    title: string;
    detailUrl: string;
    dateStr: string;
    location: string;
    imageUrl: string | null;
}

/**
 * Doity Provider Implementation
 */
export class DoityProvider implements ProviderScraper {
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
            await page.goto(LISTING_URL, { timeout: options.detailTimeoutMs * 2 });

            // Wait for event cards to load
            try {
                await page.waitForSelector('a.wrapper__event-card, .event-card', { timeout: options.detailTimeoutMs });
            } catch {
                providerLog(PROVIDER_NAME, 'No events found or timeout', 'warn');
                await closePage(page);
                return emptyResult();
            }

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

    private async extractEventCards(page: Page): Promise<RawEventCard[]> {
        return page.$$eval('a.wrapper__event-card, a[class*="event-card"]', (links) => {
            return links.map((link) => {
                const anchor = link as HTMLAnchorElement;
                const img = anchor.querySelector('img') as HTMLImageElement;
                const paragraphs = anchor.querySelectorAll('p');

                // Typically: p[0] = marker, p[1] = date, p[2] = title, p[3] = location
                let dateStr = '';
                let title = '';
                let location = '';

                paragraphs.forEach((p, idx) => {
                    const text = p.textContent?.trim() || '';
                    if (idx === 1 || text.match(/\d{1,2}.*de.*\d{4}|^\d{1,2}\/\d{1,2}/i)) {
                        dateStr = text;
                    } else if (!title && text.length > 5) {
                        title = text;
                    } else if (title && !location && text.includes('-') && text.match(/[A-Z]{2}/)) {
                        location = text;
                    }
                });

                // Fallback: get title from any h-element or strong text
                if (!title) {
                    const titleEl = anchor.querySelector('h1, h2, h3, h4, strong');
                    title = titleEl?.textContent?.trim() || '';
                }

                return {
                    title,
                    detailUrl: anchor.href,
                    dateStr,
                    location,
                    imageUrl: img?.src || null,
                };
            }).filter(e => e.title && e.detailUrl && e.detailUrl.includes('doity.com.br'));
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
                // Title from h1
                const h1 = document.querySelector('h1');
                const title = h1?.textContent?.trim() || '';

                // Find date (e.g., "Domingo, 13 de Dezembro de 2025")
                const paragraphs = Array.from(document.querySelectorAll('p'));
                let dateStr = '';
                let locationText = '';

                for (const p of paragraphs) {
                    const text = p.textContent || '';
                    if (text.match(/\d{1,2}.*de.*\d{4}/i)) {
                        dateStr = text.trim();
                    }
                    if (text.match(/[A-Za-z\s]+-\s*[A-Z]{2},?\s*Brasil/i)) {
                        locationText = text.trim();
                    }
                }

                // Find location from links (often a Google Maps link)
                if (!locationText) {
                    const locationLink = document.querySelector('a[href*="maps.google"], a[href*="google.com/maps"]');
                    locationText = locationLink?.textContent?.trim() || '';
                }

                // Find image
                const logoImg = document.querySelector('img.event-logo-img, img.event-image-img') as HTMLImageElement;
                const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
                const imageUrl = logoImg?.src || ogImage?.content || null;

                // Find registration link and price
                const ticketBtn = document.querySelector('a.sub-button, a[href*="inscricao"], a:has-text("Ver ingressos")') as HTMLAnchorElement;
                const regUrl = ticketBtn?.href || window.location.href;

                // Find price near ticket button
                const priceEl = ticketBtn?.closest('div, li')?.querySelector('span, div');
                let priceText = '';
                if (priceEl) {
                    const txt = priceEl.textContent || '';
                    if (txt.includes('R$')) {
                        priceText = txt.trim();
                    }
                }

                // Fallback: search body for prices
                if (!priceText) {
                    const bodyText = document.body.innerText;
                    const priceMatch = bodyText.match(/R\$\s*[\d.,]+/);
                    priceText = priceMatch ? priceMatch[0] : '';
                }

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

        // Portuguese month names
        const monthNames: Record<string, string> = {
            'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03',
            'abril': '04', 'maio': '05', 'junho': '06',
            'julho': '07', 'agosto': '08', 'setembro': '09',
            'outubro': '10', 'novembro': '11', 'dezembro': '12',
        };

        // Try "DD de MÊS de YYYY" format
        const ptMatch = dateStr.match(/(\d{1,2})\s+de\s+([a-zA-Záéíóúâêô]+)\s+de\s+(\d{4})/i);
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

        // Pattern: "City - ST, Brasil" or "City - ST"
        const match = locationText.match(/([^-]+?)\s*-\s*([A-Z]{2})(?:,?\s*Brasil)?/i);
        if (match) {
            return {
                city: match[1].trim(),
                state: match[2].toUpperCase(),
            };
        }

        return { city: locationText.replace(/,?\s*Brasil$/i, '').trim(), state: null };
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
        // Extract event slug from URL like: doity.com.br/event-name-2025
        const match = url.match(/doity\.com\.br\/([^\/\?]+)$/i);
        return match ? match[1] : null;
    }
}

export const doityProvider = new DoityProvider();
