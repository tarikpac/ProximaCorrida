/**
 * CorridasBR Provider
 * Scrapes running events from corridasbr.com.br
 * 
 * Priority: 3 (replaces Doity)
 * Coverage: Nacional (all Brazilian states except AP and PB which redirect to BA)
 * 
 * Note: This site is built with classic ASP and has simple HTML structure.
 * The site has invasive ads but they can be ignored during scraping.
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

const PROVIDER_NAME = 'corridasbr';
const PROVIDER_PRIORITY = 3;

// State calendar URLs - AP and PB don't work (redirect to BA), so exclude them
const STATE_URLS: Record<string, string> = {
    AC: 'https://www.corridasbr.com.br/ac/Calendario.asp',
    AL: 'https://www.corridasbr.com.br/al/Calendario.asp',
    AM: 'https://www.corridasbr.com.br/am/Calendario.asp',
    // AP excluded - redirects to BA
    BA: 'https://www.corridasbr.com.br/ba/Calendario.asp',
    CE: 'https://www.corridasbr.com.br/ce/Calendario.asp',
    DF: 'https://www.corridasbr.com.br/df/Calendario.asp',
    ES: 'https://www.corridasbr.com.br/es/Calendario.asp',
    GO: 'https://www.corridasbr.com.br/go/Calendario.asp',
    MA: 'https://www.corridasbr.com.br/ma/Calendario.asp',
    MT: 'https://www.corridasbr.com.br/mt/Calendario.asp',
    MS: 'https://www.corridasbr.com.br/ms/Calendario.asp',
    MG: 'https://www.corridasbr.com.br/mg/Calendario.asp',
    PA: 'https://www.corridasbr.com.br/pa/Calendario.asp',
    // PB excluded - redirects to BA
    PR: 'https://www.corridasbr.com.br/pr/Calendario.asp',
    PE: 'https://www.corridasbr.com.br/pe/Calendario.asp',
    PI: 'https://www.corridasbr.com.br/pi/Calendario.asp',
    RJ: 'https://www.corridasbr.com.br/rj/Calendario.asp',
    RN: 'https://www.corridasbr.com.br/rn/Calendario.asp',
    RS: 'https://www.corridasbr.com.br/rs/Calendario.asp',
    RO: 'https://www.corridasbr.com.br/ro/Calendario.asp',
    RR: 'https://www.corridasbr.com.br/rr/Calendario.asp',
    SC: 'https://www.corridasbr.com.br/sc/Calendario.asp',
    SP: 'https://www.corridasbr.com.br/sp/Calendario.asp',
    SE: 'https://www.corridasbr.com.br/se/Calendario.asp',
    TO: 'https://www.corridasbr.com.br/to/Calendario.asp',
};

// States that don't work and should be skipped
const EXCLUDED_STATES = ['AP', 'PB'];

interface RawEventCard {
    title: string;
    detailUrl: string;
    dateStr: string;
    city: string;
    distances: string;
}

/**
 * CorridasBR Provider Implementation
 */
export class CorridasBRProvider implements ProviderScraper {
    getName(): string {
        return PROVIDER_NAME;
    }

    getPriority(): number {
        return PROVIDER_PRIORITY;
    }

    supportsState(state: string): boolean {
        // Support all states except AP and PB
        if (EXCLUDED_STATES.includes(state)) {
            return false;
        }
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
            : Object.keys(STATE_URLS);

        if (statesToScrape.length === 0) {
            providerLog(PROVIDER_NAME, 'No states to scrape (AP and PB excluded)', 'warn');
            return emptyResult();
        }

        const allEvents: StandardizedEvent[] = [];
        let totalCards = 0;
        let totalProcessed = 0;
        let totalSkipped = 0;
        let totalDiscardedDate = 0;
        let totalErrors = 0;
        const stateCount: Record<string, number> = {};

        for (const state of statesToScrape) {
            try {
                const result = await this.scrapeState(context, state, options);
                allEvents.push(...result.events);
                totalCards += result.stats.cards || 0;
                totalProcessed += result.stats.processed;
                totalSkipped += result.stats.skipped || 0;
                totalDiscardedDate += result.stats.discardedDate || 0;
                totalErrors += result.stats.errors;

                // Merge state counts
                if (result.stats.stateCount) {
                    for (const [s, count] of Object.entries(result.stats.stateCount)) {
                        stateCount[s] = (stateCount[s] || 0) + count;
                    }
                }
            } catch (error) {
                providerLog(PROVIDER_NAME, `Failed to scrape ${state}: ${(error as Error).message}`, 'error');
                totalErrors++;
            }
        }

        return {
            events: allEvents,
            stats: {
                cards: totalCards,
                processed: totalProcessed,
                skipped: totalSkipped,
                discardedDate: totalDiscardedDate,
                errors: totalErrors,
                stateCount,
            },
        };
    }

    private async scrapeState(
        context: BrowserContext,
        state: string,
        options: ProviderScraperOptions
    ): Promise<ProviderScrapeResult> {
        const url = STATE_URLS[state];
        if (!url) {
            providerLog(PROVIDER_NAME, `No URL for state ${state}`, 'warn');
            return emptyResult();
        }

        providerLog(PROVIDER_NAME, `Scraping state ${state}...`);

        const events: StandardizedEvent[] = [];
        let cards = 0;
        let processed = 0;
        let discardedDate = 0;
        let errors = 0;
        const stateCount: Record<string, number> = {};

        const page = await context.newPage();

        try {
            // Navigate with longer timeout and ignore ads
            await page.goto(url, { timeout: options.detailTimeoutMs * 3, waitUntil: 'domcontentloaded' });

            // Wait a bit for content to load
            await page.waitForTimeout(2000);

            // Extract event cards from the calendar page
            const rawEvents = await this.extractEventCards(page, state);
            cards = rawEvents.length;

            providerLog(PROVIDER_NAME, `Found ${cards} events in ${state}`);

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
                        stateCount[state] = (stateCount[state] || 0) + 1;
                    } else {
                        discardedDate++;
                    }

                    await delay(options.eventDelayMs);
                } catch (error) {
                    const errMsg = (error as Error).message;
                    if (errMsg.includes('Timeout') || errMsg.includes('timeout')) {
                        providerLog(PROVIDER_NAME, `timeout: ${rawEvent.detailUrl.substring(0, 60)}...`, 'error');
                    } else {
                        providerLog(PROVIDER_NAME, `Error processing ${rawEvent.title}: ${errMsg}`, 'error');
                    }
                    errors++;
                }
            }
        } finally {
            await closePage(page);
        }

        return {
            events,
            stats: { cards, processed, skipped: 0, discardedDate, errors, stateCount },
        };
    }

    private async extractEventCards(page: Page, state: string): Promise<RawEventCard[]> {
        // The site has a simple structure with links of class "tipo4" pointing to event details
        // Events are listed in text format with date, city, title, and distances
        return page.evaluate((stateCode) => {
            const events: Array<{ title: string; detailUrl: string; dateStr: string; city: string; distances: string }> = [];
            const seen = new Set<string>();

            // Find all links to mostracorrida.asp
            const eventLinks = document.querySelectorAll('a[href*="mostracorrida.asp"]');

            eventLinks.forEach((link) => {
                const anchor = link as HTMLAnchorElement;
                const href = anchor.href;

                // Skip if already seen
                if (seen.has(href)) return;
                seen.add(href);

                const title = anchor.textContent?.trim() || '';
                if (!title || title.length < 3) return;

                // Try to get context from surrounding text
                // The event info is usually in the same "row" as the link
                let parentText = '';
                let parent = anchor.parentElement;
                for (let i = 0; i < 3 && parent; i++) {
                    parentText = parent.textContent || '';
                    if (parentText.length > 50) break;
                    parent = parent.parentElement;
                }

                // Extract date from parentText (format: DD/MM/YYYY)
                const dateMatch = parentText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
                const dateStr = dateMatch ? dateMatch[1] : '';

                // Try to find city - usually near a link to por_cidade.asp
                let city = '';
                const cityLinks = document.querySelectorAll('a[href*="por_cidade.asp"]');
                // Find the closest city link to this event
                const anchorRect = anchor.getBoundingClientRect();
                let closestDist = Infinity;
                cityLinks.forEach((cl) => {
                    const cityRect = (cl as HTMLElement).getBoundingClientRect();
                    const dist = Math.abs(cityRect.top - anchorRect.top);
                    if (dist < closestDist && dist < 30) { // Same row
                        closestDist = dist;
                        city = (cl as HTMLElement).textContent?.trim() || '';
                    }
                });

                // Extract distances from parentText (look for km patterns)
                const distMatch = parentText.match(/(\d+\s*(?:km|k|m|metros?)?(?:\s*[,/e]\s*\d+\s*(?:km|k|m|metros?)?)*)/gi);
                const distances = distMatch ? distMatch[0] : '';

                events.push({
                    title,
                    detailUrl: href,
                    dateStr,
                    city: city || stateCode, // Fallback to state code
                    distances,
                });
            });

            return events;
        }, state);
    }

    private async processEventDetail(
        context: BrowserContext,
        rawEvent: RawEventCard,
        state: string,
        options: ProviderScraperOptions
    ): Promise<StandardizedEvent | null> {
        const page = await context.newPage();

        try {
            await page.goto(rawEvent.detailUrl, { timeout: options.detailTimeoutMs, waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1500);

            // Extract details from the page
            const details = await page.evaluate(() => {
                const bodyText = document.body.innerText;

                // Extract title - the line immediately after "reportar um erro" and before "Data:"
                // Structure: ... Quero reportar um erro ... TITLE ... Data: XX/XX/XXXX ...
                let title = '';
                const bodyLines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                let foundReportError = false;
                for (const line of bodyLines) {
                    // Find the "reportar um erro" line
                    if (line.toLowerCase().includes('reportar') && line.toLowerCase().includes('erro')) {
                        foundReportError = true;
                        continue;
                    }
                    // After finding reportar, the next valid line is the title
                    if (foundReportError) {
                        // Skip if it's still navigation or menu-like
                        if (line.includes('Outros Estados') || line.includes('AC') || line.includes('AL')) {
                            continue;
                        }
                        // Stop if we hit the data section
                        if (line.includes('Data:') || line.includes('Cidade:')) {
                            break;
                        }
                        // This should be the title
                        if (line.length >= 5 && line.length <= 150 && !line.includes('http')) {
                            title = line;
                            break;
                        }
                    }
                }

                // If we couldn't find title after "reportar", try looking before "Data:"
                if (!title) {
                    const dataIndex = bodyText.indexOf('Data:');
                    if (dataIndex > 0) {
                        const beforeData = bodyText.substring(0, dataIndex);
                        const lines = beforeData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                        // Get the last line before Data: that looks like a title
                        for (let i = lines.length - 1; i >= 0; i--) {
                            const line = lines[i];
                            if (line.length >= 5 && line.length <= 150 &&
                                !line.includes('http') &&
                                !line.includes('Outros Estados') &&
                                !line.includes('reportar')) {
                                title = line;
                                break;
                            }
                        }
                    }
                }

                // Extract date
                const dateMatch = bodyText.match(/Data:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
                const dateStr = dateMatch ? dateMatch[1] : '';

                // Extract city - clean up the "(Corrida nesta Cidade)" suffix
                const cityMatch = bodyText.match(/Cidade:\s*([^\n(]+)/i);
                let city = cityMatch ? cityMatch[1].trim() : '';
                // Clean up city (remove extra text)
                city = city.replace(/\(Corrida.*$/i, '').trim();
                city = city.replace(/Clique.*$/i, '').trim();

                // Extract location (Largada)
                const locationMatch = bodyText.match(/Largada:\s*([^\n]+)/i);
                const location = locationMatch ? locationMatch[1].trim() : '';

                // Extract distances
                const distMatch = bodyText.match(/Distância\(s\):\s*([^\n]+)/i);
                const distances = distMatch ? distMatch[1].trim() : '';

                // Find registration link
                // The site often uses a "Clique Aqui" button with an onclick="paraonde()" function
                // The paraonde() function contains the external URL in a window.open call
                let regUrl = '';

                // Method 1: Try to extract from the paraonde function source
                // @ts-ignore
                if (typeof window.paraonde === 'function') {
                    // @ts-ignore
                    const paraondeStr = window.paraonde.toString();
                    // Looks like: function paraonde() { window.open('siteevento.asp?c=URL', '_blank'); }
                    const match = paraondeStr.match(/siteevento\.asp\?c=([^'"]+)/);
                    if (match && match[1]) {
                        regUrl = match[1];
                    }
                }

                // Method 2: If Method 1 failed, look for "Clique Aqui" links/buttons
                if (!regUrl) {
                    const links = Array.from(document.querySelectorAll('a, button'));
                    for (const link of links) {
                        const text = link.textContent?.toLowerCase() || '';
                        if (text.includes('clique aqui') || text.includes('inscrição') || text.includes('inscricao')) {
                            // Check href for anchors
                            if (link.tagName === 'A') {
                                const href = (link as HTMLAnchorElement).href;
                                if (href && !href.includes('corridasbr.com.br') && !href.startsWith('javascript:')) {
                                    regUrl = href;
                                    break;
                                }
                            }
                        }

                        // Also check for known platforms in hrefs
                        if (link.tagName === 'A') {
                            const href = (link as HTMLAnchorElement).href;
                            if (href && (href.includes('ticketsports') || href.includes('sympla') || href.includes('minhasinscricoes'))) {
                                regUrl = href;
                            }
                        }
                    }
                }

                // Try to find image
                const imgs = Array.from(document.querySelectorAll('img'));
                let imageUrl: string | null = null;
                for (const img of imgs) {
                    const src = (img as HTMLImageElement).src;
                    // Skip small images and logos
                    if (src.includes('banner') || src.includes('cartaz') || src.includes('corrida')) {
                        imageUrl = src;
                        break;
                    }
                }

                // Check og:image as fallback
                if (!imageUrl) {
                    const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
                    if (ogImage?.content) {
                        imageUrl = ogImage.content;
                    }
                }

                return {
                    title,
                    dateStr,
                    city,
                    location,
                    distances,
                    regUrl,
                    imageUrl,
                };
            });

            // Parse date
            const date = this.parseDate(details.dateStr || rawEvent.dateStr);
            if (!date) {
                providerLog(PROVIDER_NAME, `Could not parse date for ${rawEvent.title}: ${details.dateStr || rawEvent.dateStr}`, 'warn');
                await closePage(page);
                return null;
            }

            // Parse distances
            const distanceList = this.parseDistances(details.distances || rawEvent.distances);

            // Determine city
            const city = details.city || rawEvent.city || null;

            // Generate event ID from URL
            const eventId = this.extractEventId(rawEvent.detailUrl);

            const event: StandardizedEvent = {
                title: details.title || rawEvent.title,
                date,
                city,
                state,
                distances: distanceList.length > 0 ? distanceList : ['Corrida'],
                // Use the external registration link (from "Clique Aqui") if available
                // Otherwise fallback to detail page URL
                regUrl: details.regUrl || rawEvent.detailUrl,
                sourceUrl: rawEvent.detailUrl,
                sourcePlatform: PROVIDER_NAME,
                sourceEventId: eventId,
                imageUrl: details.imageUrl,
                priceText: null,
                priceMin: null,
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
        const brMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (brMatch) {
            const [, day, month, year] = brMatch;
            const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }

        return null;
    }

    private parseDistances(distStr: string): string[] {
        if (!distStr) return [];

        // Extract all km values
        const matches = distStr.match(/\d+\s*(?:km|k)?/gi) || [];
        const distances = matches.map(d => {
            const num = d.replace(/\D/g, '');
            return `${num}km`;
        });

        return [...new Set(distances)]; // Remove duplicates
    }

    private extractEventId(url: string): string | null {
        // Extract event ID from URL like: mostracorrida.asp?escolha=51170
        const match = url.match(/escolha=(\d+)/);
        return match ? match[1] : null;
    }
}

// Export singleton instance
export const corridasBRProvider = new CorridasBRProvider();
