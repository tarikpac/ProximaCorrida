/**
 * Zenite Esportes Provider
 * Scrapes running events from zeniteesportes.com
 * 
 * Priority: 5
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

const PROVIDER_NAME = 'zenite';
const PROVIDER_PRIORITY = 5;

const LISTING_URL = 'https://www.zeniteesportes.com/proximos-eventos';

interface RawEventCard {
    title: string;
    detailUrl: string;
    dateStr: string;
    imageUrl: string | null;
}

/**
 * Zenite Esportes Provider Implementation
 */
export class ZeniteProvider implements ProviderScraper {
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
            await page.goto(LISTING_URL, { timeout: options.detailTimeoutMs * 2 });

            // Handle cookie consent if present
            try {
                const consentBtn = await page.$('button:has-text("Concordo"), button:has-text("Aceitar")');
                if (consentBtn) {
                    await consentBtn.click();
                    await delay(500);
                }
            } catch {
                // No consent dialog
            }

            // Wait for event cards to load
            try {
                await page.waitForTimeout(3000);
                await page.waitForSelector('.product-grid, .product-title, a', { timeout: options.detailTimeoutMs });
            } catch {
                providerLog(PROVIDER_NAME, 'No events found or timeout', 'warn');
                await closePage(page);
                return emptyResult();
            }

            // Extract event cards
            const rawEvents = await this.extractEventCards(page);
            cards = rawEvents.length;

            // Process each event
            for (const rawEvent of rawEvents) {
                try {
                    const event = await this.processEventDetail(context, rawEvent, states, options);

                    if (event) {
                        // Filter by state if specified
                        if (states && states.length > 0) {
                            if (!event.state) {
                                providerLog(PROVIDER_NAME, `Skipping event with unknown state: ${event.title}`, 'debug');
                                skipped++;
                                continue;
                            }
                            if (!states.includes(event.state)) {
                                providerLog(PROVIDER_NAME, `Skipping event in ${event.state} (not in filter)`, 'debug');
                                skipped++;
                                continue;
                            }
                        }

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

    private async extractEventCards(page: Page): Promise<RawEventCard[]> {
        // Zenite events are listed as links to detail pages
        // Known event patterns from debug:
        // "5ª CORRIDA CONTRA O CÂNCER - 2026", "CAMPINA BIG RUN 2025", etc.

        // Words that indicate navigation/menu links to skip
        const skipWords = [
            'WHATSAPP', 'CADASTRE', 'ACESSAR', 'MENU', 'HOME', 'RESULTADOS',
            'SOBRE', 'BLOGS', 'MINHA CONTA', 'CONTATO', 'CRONOMETRAGEM',
            'CONSULTORIA', 'PRÓXIMOS EVENTOS', 'POLÍTICA', 'CARRINHO'
        ];

        const events = await page.evaluate((skipWords) => {
            const results: Array<{ title: string, detailUrl: string, dateStr: string, imageUrl: string | null }> = [];
            const seen = new Set<string>();

            document.querySelectorAll('a').forEach((a) => {
                const href = a.href;
                const text = a.textContent?.trim() || '';

                // Must be zenite link
                if (!href.includes('zeniteesportes.com/')) return;

                // Skip navigation pages
                if (href.includes('/proximos-eventos')) return;
                if (href.includes('/resultados')) return;
                if (href.includes('/sobre')) return;
                if (href.includes('/blogs')) return;
                if (href.includes('/minha-conta')) return;
                if (href.includes('/home')) return;
                if (href.includes('/contato')) return;
                if (href.includes('/cronometragem')) return;
                if (href.includes('/consultoria')) return;
                if (href.includes('/promocoes')) return;

                // Skip if already seen
                if (seen.has(href)) return;

                // Skip short titles
                if (text.length < 10) return;

                // Skip known navigation words
                const textUpper = text.toUpperCase();
                for (const skip of skipWords) {
                    if (textUpper.includes(skip)) return;
                }

                // Skip if contains @ (email) or phone patterns
                if (text.includes('@')) return;
                if (text.match(/\d{2}\s*\d{4,5}/)) return;  // Phone number pattern

                // Event titles typically contain "CORRIDA", "CIRCUITO", "MARATONA", etc.
                const eventKeywords = ['CORRIDA', 'CIRCUITO', 'MARATONA', 'RUN', 'TRAIL', 'PROVA'];
                const isLikelyEvent = eventKeywords.some(kw => textUpper.includes(kw));

                if (!isLikelyEvent) return;

                seen.add(href);
                results.push({
                    title: text,
                    detailUrl: href,
                    dateStr: '',
                    imageUrl: null,
                });
            });

            return results;
        }, skipWords);

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
                // Title
                const h1 = document.querySelector('h1');
                const title = h1?.textContent?.trim() || '';

                // Find date from structured text (e.g., "Data da corrida: DD/MM/YYYY")
                const bodyText = document.body.innerText;
                let dateStr = '';

                const dateMatch = bodyText.match(/Data\s+da\s+corrida\s+(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/i);
                if (dateMatch) {
                    dateStr = dateMatch[1];
                } else {
                    // Fallback: find date from lines that are NOT about inscriptions/kits
                    const lines = bodyText.split('\n');
                    for (const line of lines) {
                        // Skip lines about inscriptions or kits
                        if (/inscri[çc]/i.test(line) || /kits?/i.test(line)) continue;
                        const lineDateMatch = line.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/);
                        if (lineDateMatch) {
                            dateStr = lineDateMatch[1];
                            break;
                        }
                    }
                }

                // Find location from text
                let locationText = '';
                const localMatch = bodyText.match(/Local[\s:]+([^\n]+)/i);
                if (localMatch) {
                    locationText = localMatch[1].trim();
                } else {
                    // Try to find city - state pattern
                    const cityStateMatch = bodyText.match(/([A-Za-zÀ-ú\s]+)\s*[-–]\s*([A-Z]{2})/);
                    if (cityStateMatch) {
                        locationText = `${cityStateMatch[1].trim()} - ${cityStateMatch[2]}`;
                    }
                }

                // Find image
                const mainImg = document.querySelector('.thumbnails img, .product-image img, #product img') as HTMLImageElement;
                const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
                const imageUrl = mainImg?.src || ogImage?.content || null;

                // Find price
                const priceEl = document.querySelector('.price, .preco, .valor');
                const priceText = priceEl?.textContent?.trim() || '';

                // Registration URL is the current page
                const regUrl = window.location.href;

                // Find distances
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
            const { city, state } = this.parseLocation(details.locationText);

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

        return null;
    }

    private parseLocation(locationText: string): { city: string | null; state: string | null } {
        if (!locationText) {
            return { city: null, state: null };
        }

        // Pattern: "City - ST" or "City/ST"
        const match = locationText.match(/([^-\/]+?)[\s\-\/]+([A-Z]{2})(?:\s|$)/i);
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
        // Extract event slug from URL like: zeniteesportes.com/event-name
        const match = url.match(/zeniteesportes\.com\/([^\/\?]+)$/i);
        return match ? match[1] : null;
    }
}

export const zeniteProvider = new ZeniteProvider();
