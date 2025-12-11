/**
 * BrasilQueCorre Provider
 * Scrapes running events from brasilquecorre.com
 * 
 * Priority: 4 (replaces Sympla)
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

const PROVIDER_NAME = 'brasilquecorre';
const PROVIDER_PRIORITY = 4;

// State URL mappings
const STATE_URLS: Record<string, string> = {
    AC: 'https://brasilquecorre.com/acre',
    AL: 'https://brasilquecorre.com/alagoas',
    AP: 'https://brasilquecorre.com/amapa',
    AM: 'https://brasilquecorre.com/amazonas',
    BA: 'https://brasilquecorre.com/bahia',
    CE: 'https://brasilquecorre.com/ceara',
    DF: 'https://brasilquecorre.com/distritofederal',
    ES: 'https://brasilquecorre.com/espiritosanto',
    GO: 'https://brasilquecorre.com/goias',
    MA: 'https://brasilquecorre.com/maranhao',
    MT: 'https://brasilquecorre.com/matogrosso',
    MS: 'https://brasilquecorre.com/matogrossodosul',
    MG: 'https://brasilquecorre.com/minasgerais',
    PA: 'https://brasilquecorre.com/para',
    PB: 'https://brasilquecorre.com/paraiba',
    PR: 'https://brasilquecorre.com/parana',
    PE: 'https://brasilquecorre.com/pernambuco',
    PI: 'https://brasilquecorre.com/piaui',
    RJ: 'https://brasilquecorre.com/riodejaneiro',
    RN: 'https://brasilquecorre.com/riograndedonorte',
    RS: 'https://brasilquecorre.com/riograndedosul',
    RO: 'https://brasilquecorre.com/rondonia',
    RR: 'https://brasilquecorre.com/roraima',
    SC: 'https://brasilquecorre.com/santacatarina',
    SP: 'https://brasilquecorre.com/saopaulo',
    SE: 'https://brasilquecorre.com/sergipe',
    TO: 'https://brasilquecorre.com/tocantins',
};

interface RawEventCard {
    title: string;
    dateStr: string;
    city: string;
    distances: string[];
    organizer: string;
}

/**
 * BrasilQueCorre Provider Implementation
 */
export class BrasilQueCorreProvider implements ProviderScraper {
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

        const statesToScrape = states && states.length > 0
            ? states.filter(s => this.supportsState(s))
            : [...ALL_BRAZILIAN_STATES];

        if (statesToScrape.length === 0) {
            providerLog(PROVIDER_NAME, 'No states to scrape', 'warn');
            return emptyResult();
        }

        providerLog(PROVIDER_NAME, `Scraping ${statesToScrape.length} states: ${statesToScrape.join(', ')}`, 'debug');

        for (const state of statesToScrape) {
            const url = STATE_URLS[state];
            if (!url) {
                providerLog(PROVIDER_NAME, `No URL for state ${state}`, 'debug');
                continue;
            }

            const page = await context.newPage();

            try {
                await page.goto(url, { timeout: options.detailTimeoutMs * 2 });
                await page.waitForLoadState('domcontentloaded');
                await page.waitForTimeout(3000);

                // Extract events from page
                const rawEvents = await this.extractEvents(page, state);
                cards += rawEvents.length;

                for (const rawEvent of rawEvents) {
                    try {
                        const event = this.processEvent(rawEvent, state, url);
                        if (event) {
                            events.push(event);
                            processed++;
                            stateCount[state] = (stateCount[state] || 0) + 1;
                        } else {
                            discardedDate++;
                        }
                    } catch (error) {
                        providerLog(PROVIDER_NAME, `[${state}] ${rawEvent.title.substring(0, 30)}: ${(error as Error).message}`, 'error');
                        errors++;
                    }
                }

                await delay(options.eventDelayMs);
            } catch (error) {
                const errMsg = (error as Error).message;
                providerLog(PROVIDER_NAME, `[${state}] timeout: ${url.substring(0, 40)}...`, 'error');
                errors++;
            } finally {
                await closePage(page);
            }
        }

        return {
            events,
            stats: { cards, processed, skipped, discardedDate, errors, stateCount },
        };
    }

    private async extractEvents(page: Page, state: string): Promise<RawEventCard[]> {
        // The page structure is:
        // ESTADO (h1/header)
        // EVENT NAME
        // 
        // DD de MÊS de YYYY
        // 
        // City
        // 
        // Distances
        // 
        // ORGANIZER
        // 
        // (repeat for each event)

        const events = await page.evaluate((stateCode) => {
            const bodyText = document.body.innerText;
            const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            const events: Array<{
                title: string;
                dateStr: string;
                city: string;
                distances: string[];
                organizer: string;
            }> = [];

            // Portuguese month names for date detection
            const monthPattern = /^\d{1,2}\s+de\s+(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+\d{4}$/i;

            // Skip navigation items
            const skipPatterns = [
                /^INÍCIO$/i, /^ESTADOS$/i, /^MODALIDADES$/i, /^DESTAQUES$/i,
                /^PONTO KIT$/i, /^CLUBE BQC$/i, /^CONTATO$/i, /^CADASTRAR$/i,
                /^Tel\s+/i, /^Provérbios/i, /^Brasil Que Corre/i,
                /^FAÇA PARTE/i, /^Acumule pontos/i, /^\*\s*Ao finalizar/i,
                /^Use o cupom/i, /corrida.*caminhada.*trail/i,
            ];

            // State names to skip in navigation
            const stateNames = [
                'ACRE', 'ALAGOAS', 'AMAPÁ', 'AMAZONAS', 'BAHIA', 'CEARÁ',
                'DISTRITO FEDERAL', 'ESPÍRITO SANTO', 'GOIÁS', 'MARANHÃO',
                'MATO GROSSO', 'MATO GROSSO DO SUL', 'MINAS GERAIS', 'PARÁ',
                'PARAÍBA', 'PARANÁ', 'PERNAMBUCO', 'PIAUÍ', 'RIO DE JANEIRO',
                'RIO GRANDE DO NORTE', 'RIO GRANDE DO SUL', 'RONDÔNIA', 'RORAIMA',
                'SANTA CATARINA', 'SÃO PAULO', 'SERGIPE', 'TOCANTINS',
                'MEIA MARATONA', 'MARATONA', 'ULTRAMARATONA', 'REVEZAMENTO',
                'BACKYARD', 'TRAIL RUN', 'OCR', 'FEMININA', 'INFANTIL',
                'INTERNACIONAL', 'MULTI ESPORTES', 'DESAFIOS',
            ];

            // Find events by looking for date patterns
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                // Skip navigation
                if (skipPatterns.some(p => p.test(line))) continue;
                if (stateNames.includes(line.toUpperCase())) continue;
                if (line === '‹' || line === '›') continue;

                // Check if this line is a date
                if (monthPattern.test(line)) {
                    // Look backwards for title (should be 1-2 lines before)
                    let title = '';
                    for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
                        const prevLine = lines[j];
                        if (skipPatterns.some(p => p.test(prevLine))) continue;
                        if (stateNames.includes(prevLine.toUpperCase())) continue;
                        if (prevLine === '‹' || prevLine === '›') continue;
                        if (monthPattern.test(prevLine)) continue;
                        if (prevLine.length > 5 && !prevLine.match(/^\d+km/i)) {
                            title = prevLine;
                            break;
                        }
                    }

                    if (!title) continue;

                    // Look forwards for city, distances, organizer
                    let city = '';
                    const distances: string[] = [];
                    let organizer = '';

                    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
                        const nextLine = lines[j];

                        // Stop if we hit another event (date pattern)
                        if (monthPattern.test(nextLine)) break;
                        if (skipPatterns.some(p => p.test(nextLine))) continue;
                        if (stateNames.includes(nextLine.toUpperCase())) continue;

                        // Check for distances (km patterns)
                        if (nextLine.match(/\d+km|\d+\s*km/i)) {
                            distances.push(nextLine);
                        }
                        // First non-km line after date is city
                        else if (!city && nextLine.length > 2 && !nextLine.match(/^\d/)) {
                            city = nextLine;
                        }
                        // Lines in ALL CAPS after distances are likely organizer
                        else if (distances.length > 0 && nextLine === nextLine.toUpperCase() &&
                            nextLine.length > 3 && !nextLine.match(/^\d/)) {
                            organizer = nextLine;
                            break;
                        }
                    }

                    if (title && city) {
                        events.push({
                            title,
                            dateStr: line,
                            city,
                            distances,
                            organizer,
                        });
                    }
                }
            }

            return events;
        }, state);

        return events;
    }

    private processEvent(rawEvent: RawEventCard, state: string, sourceUrl: string): StandardizedEvent | null {
        const date = this.parseDate(rawEvent.dateStr);
        if (!date) {
            providerLog(PROVIDER_NAME, `Could not parse date for ${rawEvent.title}: ${rawEvent.dateStr}`, 'warn');
            return null;
        }

        // Parse distances
        const distances = rawEvent.distances.length > 0
            ? this.parseDistances(rawEvent.distances)
            : ['Corrida'];

        const event: StandardizedEvent = {
            title: rawEvent.title,
            date,
            city: rawEvent.city,
            state,
            distances,
            regUrl: sourceUrl,  // BQC doesn't have direct links to events
            sourceUrl,
            sourcePlatform: PROVIDER_NAME,
            sourceEventId: this.generateEventId(rawEvent.title, date),
            imageUrl: null,
            priceText: null,
            priceMin: null,
        };

        return event;
    }

    private parseDate(dateStr: string): Date | null {
        if (!dateStr) return null;

        const monthNames: Record<string, string> = {
            'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03',
            'abril': '04', 'maio': '05', 'junho': '06',
            'julho': '07', 'agosto': '08', 'setembro': '09',
            'outubro': '10', 'novembro': '11', 'dezembro': '12',
        };

        // Try "DD de MÊS de YYYY" format
        const match = dateStr.match(/(\d{1,2})\s+de\s+([a-zA-Záéíóúâêôç]+)\s+de\s+(\d{4})/i);
        if (match) {
            const [, day, monthName, year] = match;
            const month = monthNames[monthName.toLowerCase()];
            if (month) {
                // Use T12:00:00 (noon) to prevent timezone offset from shifting the day
                // Without time, JS interprets as midnight UTC which becomes previous day in Brazil (GMT-3)
                const date = new Date(`${year}-${month}-${day.padStart(2, '0')}T12:00:00`);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }

        // Try "DD MÊS YYYY" without "de" (e.g., "12 Abril de 2026")
        const match2 = dateStr.match(/(\d{1,2})\s+([a-zA-Záéíóúâêôç]+)\s+(?:de\s+)?(\d{4})/i);
        if (match2) {
            const [, day, monthName, year] = match2;
            const month = monthNames[monthName.toLowerCase()];
            if (month) {
                // Use T12:00:00 (noon) to prevent timezone offset from shifting the day
                const date = new Date(`${year}-${month}-${day.padStart(2, '0')}T12:00:00`);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }

        return null;
    }

    private parseDistances(distanceLines: string[]): string[] {
        const distances: string[] = [];

        for (const line of distanceLines) {
            // Extract km values: "5km e 10km (corrida)" -> ["5km", "10km"]
            const matches = line.match(/\d+(?:,\d+)?(?:\.\d+)?\s*km/gi);
            if (matches) {
                distances.push(...matches.map(d => d.toLowerCase().replace(/\s+/g, '')));
            }
        }

        return [...new Set(distances)];
    }

    private generateEventId(title: string, date: Date): string {
        const slug = title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        const dateStr = date.toISOString().split('T')[0];
        return `${slug}-${dateStr}`;
    }
}

export const brasilQueCorreProvider = new BrasilQueCorreProvider();
