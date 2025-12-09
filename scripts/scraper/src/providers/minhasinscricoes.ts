/**
 * Minhas Inscrições Provider
 * Scrapes running events from minhasinscricoes.com.br
 * 
 * Priority: 2
 * Coverage: Nacional (all Brazilian states)
 * 
 * Note: Some events redirect to TicketSports for registration.
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

const PROVIDER_NAME = 'minhasinscricoes';
const PROVIDER_PRIORITY = 2;

// Base listing URL with corrida filter
const LISTING_URL = 'https://www.minhasinscricoes.com.br/pt-br/calendario#filtro=tipo:corrida de rua;';

interface RawEventCard {
    title: string;
    detailUrl: string;
    dateStr: string;
    location: string;
    imageUrl: string | null;
}

/**
 * Minhas Inscrições Provider Implementation
 */
export class MinhasInscricoesProvider implements ProviderScraper {
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
        let cards = 0;
        let processed = 0;
        let skipped = 0;
        let discardedDate = 0;
        let errors = 0;
        const stateCount: Record<string, number> = {};

        const page = await context.newPage();

        try {
            // Navigate to listing page
            await page.goto(LISTING_URL, { timeout: options.detailTimeoutMs * 2 });

            // Wait for events to load
            try {
                await page.waitForSelector('.lista-eventos, .box-conteudo', { timeout: options.detailTimeoutMs });
            } catch {
                providerLog(PROVIDER_NAME, 'No events found or timeout', 'warn');
                await closePage(page);
                return emptyResult();
            }

            // Try to load more events if button exists
            await this.loadMoreEvents(page, options);

            // Extract event cards
            const rawEvents = await this.extractEventCards(page);
            cards = rawEvents.length;

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
                        if (event.state) {
                            stateCount[event.state] = (stateCount[event.state] || 0) + 1;
                        }
                    } else {
                        discardedDate++;
                    }

                    await delay(options.eventDelayMs);
                } catch (error) {
                    errors++;
                }
            }
        } finally {
            await closePage(page);
        }

        return {
            events,
            stats: { cards, processed, skipped, discardedDate, errors, stateCount },
        };
    }

    private async loadMoreEvents(page: Page, options: ProviderScraperOptions): Promise<void> {
        // Try to click "Carregar mais" button up to 3 times
        for (let i = 0; i < 3; i++) {
            try {
                const loadMoreBtn = await page.$('button:has-text("Carregar mais"), .carregar-mais, [class*="load-more"]');
                if (loadMoreBtn) {
                    await loadMoreBtn.click();
                    await delay(2000); // Wait for content to load
                }
            } catch {
                break; // No more load button
            }
        }
    }

    private async extractEventCards(page: Page): Promise<RawEventCard[]> {
        return page.$$eval('.lista-eventos a[href*="/Evento/"], .box-conteudo a[href*="/Evento/"]', (links) => {
            return links.map((link) => {
                const anchor = link as HTMLAnchorElement;
                const parent = anchor.closest('.box-conteudo') || anchor.parentElement;

                const img = parent?.querySelector('img') as HTMLImageElement;
                const dateSpan = parent?.querySelector('.data-evento, span.data') as HTMLElement;
                const titleEl = parent?.querySelector('h3, h4, .titulo') as HTMLElement;
                const locationSpan = parent?.querySelector('span:not(.data-evento)') as HTMLElement;

                return {
                    title: titleEl?.textContent?.trim() || anchor.textContent?.trim() || '',
                    detailUrl: anchor.href,
                    dateStr: dateSpan?.textContent?.trim() || '',
                    location: locationSpan?.textContent?.trim() || '',
                    imageUrl: img?.src || null,
                };
            }).filter(e => e.title && e.detailUrl && e.detailUrl.includes('/Evento/'));
        });
    }

    private matchesStateFilter(location: string, states: string[]): boolean {
        if (!location) return true; // Include if no location info

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
                const h1 = document.querySelector('div.conteudo h1, h1');
                const title = h1?.textContent?.trim() || '';

                // Find paragraphs in content area for date and location
                const contentPs = Array.from(document.querySelectorAll('div.conteudo p'));
                let dateStr = '';
                let locationText = '';

                for (const p of contentPs) {
                    const text = p.textContent || '';
                    if (text.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2} de [a-zA-Z]+ de \d{4}/i)) {
                        dateStr = text.trim();
                    }
                    if (text.toLowerCase().includes(' em ') || text.match(/[A-Z]{2}$/)) {
                        locationText = text.trim();
                    }
                }

                // Find registration link (may point to TicketSports)
                const regLink = document.querySelector('a[href*="ticketsports.com.br"], a[href*="inscricao"], a.btn-inscricao') as HTMLAnchorElement;
                const regUrl = regLink?.href || window.location.href;

                // Find image
                const mainImg = document.querySelector('#conteudo-evento img, .banner img, .evento-imagem img') as HTMLImageElement;
                const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
                const imageUrl = mainImg?.src || ogImage?.content || null;

                // Find price from inscription table
                const priceCell = document.querySelector('#inscricoes table td:last-child, .valor, .preco');
                const priceText = priceCell?.textContent?.trim() || '';

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

            // Extract price (use our heuristics if table price not found)
            const priceResult = details.priceText
                ? { priceText: details.priceText, priceMin: this.parsePrice(details.priceText) }
                : extractPriceWithHeuristics(details.bodyText);

            const event: StandardizedEvent = {
                title: details.title || rawEvent.title,
                date,
                city,
                state,
                distances: details.distances.length > 0 ? details.distances : ['Corrida'],
                // Use event detail page URL - users see event info before registering
                regUrl: rawEvent.detailUrl,
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

        // Try "DD de MÊS de YYYY" format
        const monthNames: Record<string, string> = {
            'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03',
            'abril': '04', 'maio': '05', 'junho': '06',
            'julho': '07', 'agosto': '08', 'setembro': '09',
            'outubro': '10', 'novembro': '11', 'dezembro': '12',
        };

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

        return null;
    }

    private parseLocation(locationText: string): { city: string | null; state: string | null } {
        if (!locationText) {
            return { city: null, state: null };
        }

        // Pattern: "... em City - ST" or "City - ST" or "City/ST"
        const match = locationText.match(/(?:em\s+)?([^-\/]+?)[\s\-\/]+([A-Z]{2})$/i);
        if (match) {
            return {
                city: match[1].trim(),
                state: match[2].toUpperCase(),
            };
        }

        // Just a state code at the end
        const stateMatch = locationText.match(/([A-Z]{2})$/);
        if (stateMatch) {
            const beforeState = locationText.slice(0, -2).trim().replace(/[-\/,]$/, '').trim();
            return {
                city: beforeState || null,
                state: stateMatch[1],
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
        // Extract event ID from URL like: minhasinscricoes.com.br/Evento/EventName2025
        const match = url.match(/\/Evento\/([^\/\?]+)/i);
        return match ? match[1] : null;
    }
}

export const minhasInscricoesProvider = new MinhasInscricoesProvider();
