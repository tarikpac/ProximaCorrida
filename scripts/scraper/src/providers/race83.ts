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

// Default state for this regional provider (Paraíba/Pernambuco focused)
const DEFAULT_STATE = 'PB';

// Known cities by state - used when state is not explicit in the event
const KNOWN_CITIES_BY_STATE: Record<string, string[]> = {
    'PB': [
        'JOAO PESSOA', 'JOÃO PESSOA', 'CAMPINA GRANDE', 'PATOS', 'SOUSA', 'SOUZA',
        'CAJAZEIRAS', 'BAYEUX', 'SANTA RITA', 'CABEDELO', 'GUARABIRA', 'ESPERANCA',
        'ESPERANÇA', 'MAMANGUAPE', 'POMBAL', 'MONTEIRO', 'PICUI', 'PICUÍ', 'CUITÉ',
        'ITAPORANGA', 'SAO BENTO', 'SÃO BENTO', 'PIANCO', 'PIANCÓ', 'PRINCESA ISABEL',
        'AREIA', 'BANANEIRAS', 'SOLÂNEA', 'SOLANEA', 'ALAGOA GRANDE',
        'ALAGOINHA', 'ALAGOA NOVA', 'UIRAÚNA', 'UIRAUNA', 'QUEIMADAS', 'LAGOA SECA',
        'PUXINANÃ', 'PUXINANA', 'MASSARANDUBA', 'SERRA BRANCA', 'SUMÉ', 'SUME',
        'TEIXEIRA', 'TAPEROÁ', 'TAPEROA', 'DIAMANTE', 'CATOLE DO ROCHA', 'CATOLÉ DO ROCHA',
        'SAO JOAO DO RIO DO PEIXE', 'SÃO JOÃO DO RIO DO PEIXE', 'AGUA BRANCA', 'ÁGUA BRANCA',
        'COREMAS', 'PEDRAS DE FOGO', 'CONDE', 'PITIMBU', 'LUCENA', 'RIO TINTO',
        'SANTA LUZIA', 'PRATA', 'OURO VELHO', 'CONGO', 'CARAÚBAS', 'CARAUBAS',
        'JUAZEIRINHO', 'SAO JOSE DE PIRANHAS', 'SÃO JOSÉ DE PIRANHAS'
    ],
    'PE': [
        'RECIFE', 'OLINDA', 'JABOATAO', 'JABOATÃO', 'CARUARU', 'PETROLINA',
        'PAULISTA', 'GARANHUNS', 'VITORIA DE SANTO ANTAO', 'VITÓRIA DE SANTO ANTÃO',
        'IGARASSU', 'CABO DE SANTO AGOSTINHO', 'IPOJUCA', 'ABREU E LIMA',
        'SAO LOURENCO DA MATA', 'SÃO LOURENÇO DA MATA', 'ARCOVERDE', 'SERRA TALHADA',
        'GRAVATA', 'GRAVATÁ', 'BEZERROS', 'CARPINA', 'GOIANA', 'LIMOEIRO',
        'PALMARES', 'ESCADA', 'BELO JARDIM', 'PESQUEIRA', 'SALGUEIRO', 'ARARIPINA'
    ],
    'RN': [
        'NATAL', 'MOSSORO', 'MOSSORÓ', 'PARNAMIRIM', 'SAO GONCALO DO AMARANTE',
        'SÃO GONÇALO DO AMARANTE', 'CEARA MIRIM', 'CEARÁ MIRIM', 'MACAIBA', 'MACAÍBA',
        'CAICO', 'CAICÓ', 'CURRAIS NOVOS', 'SANTA CRUZ', 'NOVA CRUZ',
        'JOAO CAMARA', 'JOÃO CÂMARA', 'PATU', 'MARTINS', 'APODI', 'PAU DOS FERROS',
        'ALEXANDRIA', 'ASSÚ', 'ACU', 'ÁGUA NOVA', 'AGUA NOVA', 'TIBAU DO SUL',
        'PIPA', 'SAO MIGUEL DO GOSTOSO', 'SÃO MIGUEL DO GOSTOSO', 'TOUROS', 'EXTREMOZ'
    ],
    'CE': [
        'FORTALEZA', 'CAUCAIA', 'JUAZEIRO DO NORTE', 'MARACANAU', 'MARACANAÚ',
        'SOBRAL', 'CRATO', 'ITAPIPOCA', 'MARANGUAPE', 'IGUATU', 'QUIXADA', 'QUIXADÁ',
        'PACATUBA', 'AQUIRAZ', 'CANINDE', 'CANINDÉ', 'RUSSAS', 'TIANGUA', 'TIANGUÁ',
        'LIMOEIRO DO NORTE', 'CRATEUS', 'CRATEÚS', 'ARACATI', 'ICAPUI', 'ICAPUÍ',
        'JERICOACOARA', 'BEBERIBE', 'EUSEBIO', 'EUSÉBIO', 'HORIZONTE', 'PACAJUS'
    ],
    'AL': [
        'MACEIO', 'MACEIÓ', 'ARAPIRACA', 'RIO LARGO', 'PALMEIRA DOS INDIOS',
        'PALMEIRA DOS ÍNDIOS', 'PENEDO', 'SAO MIGUEL DOS CAMPOS', 'SÃO MIGUEL DOS CAMPOS',
        'MARECHAL DEODORO', 'DELMIRO GOUVEIA', 'CORURIPE', 'SANTANA DO IPANEMA',
        'MARAGOGI', 'BARRA DE SAO MIGUEL', 'BARRA DE SÃO MIGUEL', 'PILAR'
    ],
    'SE': [
        'ARACAJU', 'NOSSA SENHORA DO SOCORRO', 'LAGARTO', 'SAO CRISTOVAO',
        'SÃO CRISTÓVÃO', 'ESTANCIA', 'ESTÂNCIA', 'TOBIAS BARRETO', 'SIMAO DIAS',
        'SIMÃO DIAS', 'CAPELA', 'PROPRIÁ', 'PROPRIA', 'BARRA DOS COQUEIROS'
    ],
    'BA': [
        'SALVADOR', 'FEIRA DE SANTANA', 'VITORIA DA CONQUISTA', 'VITÓRIA DA CONQUISTA',
        'CAMACARI', 'CAMAÇARI', 'ITABUNA', 'JUAZEIRO', 'LAURO DE FREITAS', 'ILHEUS',
        'ILHÉUS', 'JEQUIE', 'JEQUIÉ', 'TEIXEIRA DE FREITAS', 'ALAGOINHAS', 'BARREIRAS',
        'PORTO SEGURO', 'SIMOES FILHO', 'SIMÕES FILHO', 'PAULO AFONSO', 'EUNAPOLIS',
        'EUNÁPOLIS', 'SANTO ANTONIO DE JESUS', 'SANTO ANTÔNIO DE JESUS', 'VALENCA', 'VALENÇA'
    ],
    'MA': [
        'SAO LUIS', 'SÃO LUÍS', 'IMPERATRIZ', 'SAO JOSE DE RIBAMAR', 'SÃO JOSÉ DE RIBAMAR',
        'TIMON', 'CAXIAS', 'CODÓ', 'CODO', 'PACO DO LUMIAR', 'PAÇO DO LUMIAR',
        'ACAILANDIA', 'AÇAILÂNDIA', 'BACABAL', 'BALSAS', 'SANTA INES', 'SANTA INÊS',
        'BARREIRINHAS', 'CHAPADINHA', 'PINHEIRO', 'CAROLINA'
    ],
    'PI': [
        'TERESINA', 'PARNAIBA', 'PARNAÍBA', 'PICOS', 'PIRIPIRI', 'FLORIANO',
        'CAMPO MAIOR', 'BARRAS', 'UNIÃO', 'UNIAO', 'ALTOS', 'PEDRO II',
        'ESPERANTINA', 'OEIRAS', 'SAO RAIMUNDO NONATO', 'SÃO RAIMUNDO NONATO',
        'CORRENTE', 'BOM JESUS', 'LUÍS CORREIA', 'LUIS CORREIA'
    ]
};

// Helper function to find state from city name
function inferStateFromCity(cityName: string): string | null {
    const normalized = cityName.toUpperCase().trim();
    for (const [state, cities] of Object.entries(KNOWN_CITIES_BY_STATE)) {
        if (cities.some(city => normalized === city || normalized.includes(city) || city.includes(normalized))) {
            return state;
        }
    }
    return null;
}

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
        let cards = 0;
        let processed = 0;
        let skipped = 0;
        let discardedDate = 0;
        let errors = 0;
        const stateCount: Record<string, number> = {};

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
            cards = rawEvents.length;

            // Process each event
            for (const rawEvent of rawEvents) {
                try {
                    const event = await this.processEventDetail(context, rawEvent, states, options);

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

    private async extractEventCards(page: Page): Promise<RawEventCard[]> {
        // Race83 HTML structure (from user's sample):
        // <div class="element">
        //   <div class="blckbox"><h6 class="number">21/12/2025</h6></div>
        //   <figure class="zoom"><a href="evento/..."><img ...></a></figure>
        //   <p class="name title-event"> Corrida Do Choqueano</p>
        //   <p> <i class="fa fa-map-marker"></i>  JOÃO PESSOA  - PB</p>
        //   <div id="visualizar"><a href="evento/..."><button>INSCREVA-SE</button></a></div>
        // </div>

        const events = await page.$$eval('.element', (elements) => {
            const results: Array<{
                title: string;
                detailUrl: string;
                dateStr: string;
                location: string;
                imageUrl: string | null;
            }> = [];
            const seen = new Set<string>();

            elements.forEach((el) => {
                try {
                    // Extract date from h6.number
                    const dateEl = el.querySelector('h6.number, .blckbox h6');
                    const dateStr = dateEl?.textContent?.trim() || '';

                    // Extract title from p.name or p.title-event
                    const titleEl = el.querySelector('p.name, p.title-event, .title-event');
                    const title = titleEl?.textContent?.trim() || '';

                    // Extract location from p with map-marker icon
                    let location = '';
                    const allParagraphs = el.querySelectorAll('p');
                    allParagraphs.forEach((p) => {
                        const hasMapMarker = p.querySelector('i.fa-map-marker, i[class*="map"]');
                        if (hasMapMarker) {
                            location = p.textContent?.trim() || '';
                        }
                    });

                    // Extract detail URL from anchor
                    // First try race83 internal links, then fall back to any link
                    let anchor = el.querySelector('a[href*="evento"]') as HTMLAnchorElement;
                    if (!anchor) {
                        // Fall back to any link (for external events like circuitodasestacoes, ticketsports)
                        anchor = el.querySelector('a[href*="http"]') as HTMLAnchorElement;
                    }
                    let detailUrl = anchor?.href || '';

                    // Normalize URL (remove /login/ if present)
                    if (detailUrl) {
                        detailUrl = detailUrl.replace('/login/', '/evento/');
                    }

                    // Extract image
                    const img = el.querySelector('img') as HTMLImageElement;
                    const imageUrl = img?.src || null;

                    // Create unique key for deduplication
                    const key = `${title}|${dateStr}|${detailUrl}`;

                    if (title && title.length > 3 && dateStr && !seen.has(key)) {
                        seen.add(key);
                        results.push({
                            title,
                            detailUrl,
                            dateStr,
                            location,
                            imageUrl,
                        });
                    }
                } catch {
                    // Skip malformed elements
                }
            });

            return results;
        });

        // Fallback: if no events found with DOM parsing, try text-based extraction
        if (events.length === 0) {
            return this.extractEventCardsFromText(page);
        }

        return events;
    }

    private async extractEventCardsFromText(page: Page): Promise<RawEventCard[]> {
        // Fallback text-based extraction for older page structures
        const pageData = await page.evaluate(() => {
            const bodyText = document.body.innerText;
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
        const lines = pageData.bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const dateMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{4})$/);
            if (!dateMatch) continue;

            const dateStr = dateMatch[1];
            let title = '';
            let location = '';

            for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
                const nextLine = lines[j];
                if (nextLine.toUpperCase().includes('INSCREVA')) break;
                if (nextLine.toUpperCase().includes('INSCRIÇÃO')) continue;

                const locationMatch = nextLine.match(/^(.+?)\s*[-–]\s*([A-Z]{2})\s*$/i);
                if (locationMatch && !title) {
                    title = nextLine;
                } else if (locationMatch) {
                    location = nextLine;
                } else if (!title && nextLine.length > 5 && !nextLine.match(/^\d/)) {
                    title = nextLine;
                } else if (title && !location && nextLine.length > 3) {
                    location = nextLine;
                }
            }

            if (title && title.length > 5) {
                const eventSlug = this.slugify(title);
                let detailUrl = `https://www.race83.com.br/evento/2025/corrida-de-rua/${eventSlug}`;

                events.push({ title, detailUrl, dateStr, location, imageUrl: null });
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

    /**
     * Process external events (from ticketsports, circuitodasestacoes, etc.)
     * Uses only the data extracted from the listing page
     */
    private processExternalEvent(
        rawEvent: RawEventCard,
        states: string[] | undefined
    ): StandardizedEvent | null {
        // Parse location from rawEvent.location (e.g., "JOÃO PESSOA - PB")
        let city = '';
        let state = '';

        if (rawEvent.location) {
            const locMatch = rawEvent.location.match(/^(.+?)\s*[-–]\s*([A-Z]{2})\s*$/i);
            if (locMatch) {
                city = locMatch[1].trim();
                state = locMatch[2].toUpperCase();
            }
        }

        // If no state found, try to infer from known cities
        if (!state && city) {
            const inferredState = inferStateFromCity(city);
            if (inferredState) {
                state = inferredState;
            }
        }

        // Default state for this regional provider
        if (!state) {
            state = DEFAULT_STATE;
        }

        // Check state filter
        if (states && states.length > 0) {
            if (!states.includes(state)) {
                providerLog(PROVIDER_NAME, `Skipping external event in ${state} (not in filter)`, 'debug');
                return null;
            }
        }

        // Parse date
        const date = this.parseDate(rawEvent.dateStr);
        if (!date) {
            providerLog(PROVIDER_NAME, `Could not parse date for external event: ${rawEvent.title}`, 'warn');
            return null;
        }

        // Generate event ID from title
        const eventId = rawEvent.title
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);

        const event: StandardizedEvent = {
            title: rawEvent.title,
            date,
            city: city || null,
            state,
            distances: [],
            regUrl: rawEvent.detailUrl,
            imageUrl: rawEvent.imageUrl,
            sourceUrl: rawEvent.detailUrl,
            sourcePlatform: PROVIDER_NAME,
            sourceEventId: eventId,
            priceText: null,
            priceMin: null,
        };

        return event;
    }

    private async processEventDetail(
        context: BrowserContext,
        rawEvent: RawEventCard,
        states: string[] | undefined,
        options: ProviderScraperOptions
    ): Promise<StandardizedEvent | null> {
        // Check if this is an external URL (not from race83)
        const isExternalUrl = rawEvent.detailUrl && !rawEvent.detailUrl.includes('race83.com.br');

        // For external URLs, use the data from the listing page directly
        if (isExternalUrl) {
            return this.processExternalEvent(rawEvent, states);
        }

        const page = await context.newPage();

        try {
            await page.goto(rawEvent.detailUrl, { timeout: options.detailTimeoutMs });
            await page.waitForLoadState('domcontentloaded');

            // Extract event details
            const details = await page.evaluate(() => {
                const bodyText = document.body.innerText;

                // Title - on Race83, the event title is typically in h3, not h1 (h1 is the site logo)
                const h3 = document.querySelector('h3');
                const h2 = document.querySelector('h2');
                const h1 = document.querySelector('h1');

                let title = '';

                // Try h3 first (most common for event title)
                if (h3) {
                    const h3Text = h3.textContent?.trim() || '';
                    // Skip if it's just "Preços" or other section headers
                    if (h3Text.length > 5 && !h3Text.includes('Preços') && !h3Text.includes('Documentos')) {
                        title = h3Text;
                    }
                }

                // Try h2 if h3 didn't work
                if (!title && h2) {
                    const h2Text = h2.textContent?.trim() || '';
                    if (h2Text.length > 5) {
                        title = h2Text;
                    }
                }

                // Try h1 if nothing else worked (but filter out site name)
                if (!title && h1) {
                    const h1Text = h1.textContent?.trim() || '';
                    if (h1Text.length > 5 && !h1Text.includes('Race83')) {
                        title = h1Text;
                    }
                }

                if (!title) {
                    // Try to find title from page title
                    title = document.title.split('|')[0]?.trim() || '';
                }

                // Location - first use the raw location from listing (e.g., "JOÃO PESSOA - PB")
                let city = '';
                let state = '';

                // Try to extract from known location pattern at end of text block
                // Pattern examples: "JOÃO PESSOA - PB", "CAMPINA GRANDE-PB"
                // IMPORTANT: Must exclude "INSCREVA-SE" which would match SE (Sergipe)
                const locationPatterns = [
                    /([A-Za-zÀ-ú\s]+)\s*[-–]\s*(PB|PE|RN|CE|BA|AL|MA|PI)(?:\s|$)/,  // Removed SE from first pattern
                    /CIDADE[:\s]+([^,\n-]+)[-,\s]+([A-Z]{2})/i,
                    /LOCAL[:\s]+([^,\n-]+)[-,\s]+([A-Z]{2})/i,
                ];

                for (const pattern of locationPatterns) {
                    const match = bodyText.match(pattern);
                    if (match) {
                        const potentialCity = match[1].trim().toUpperCase();
                        // Skip if it looks like "INSCREVA" (from INSCREVA-SE)
                        if (potentialCity.includes('INSCREVA') || potentialCity.includes('INSCRI')) {
                            continue;
                        }
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
            // Format: "JOÃO PESSOA - PB" or " JOÃO PESSOA - PB" (with leading space)
            let finalCity = details.city;
            let finalState = details.state;

            // Valid Brazilian state codes
            const validStates = ['PB', 'PE', 'RN', 'CE', 'BA', 'AL', 'SE', 'MA', 'PI',
                'SP', 'RJ', 'MG', 'ES', 'SC', 'PR', 'RS', 'GO', 'DF',
                'AC', 'AM', 'AP', 'MT', 'MS', 'PA', 'RO', 'RR', 'TO'];

            // Validate that the state from details is valid
            if (finalState && !validStates.includes(finalState)) {
                finalState = '';
            }

            // Try to extract from rawEvent.location if no state yet
            if (!finalState && rawEvent.location) {
                // Normalize: remove extra spaces, trim
                const normalizedLoc = rawEvent.location.trim().replace(/\s+/g, ' ');

                // Don't parse if location contains INSCREVA
                if (!normalizedLoc.toUpperCase().includes('INSCREVA')) {
                    // Pattern: "CITY - ST" with optional multiple spaces
                    const locMatch = normalizedLoc.match(/^(.+?)\s*[-–]\s*([A-Z]{2})\s*$/i);
                    if (locMatch) {
                        const potentialState = locMatch[2].toUpperCase();
                        if (validStates.includes(potentialState)) {
                            if (!finalCity) finalCity = locMatch[1].trim();
                            finalState = potentialState;
                        }
                    }
                }
            }

            // Fallback 2: Check if city is a known city from any Nordeste state
            if (!finalState && finalCity) {
                const inferredState = inferStateFromCity(finalCity);
                if (inferredState) {
                    finalState = inferredState;
                    providerLog(PROVIDER_NAME, `Inferred state ${finalState} from known city: ${finalCity}`, 'debug');
                }
            }

            // Fallback 3: Default to PB for this regional provider
            if (!finalState) {
                finalState = DEFAULT_STATE;
                providerLog(PROVIDER_NAME, `Using default state ${DEFAULT_STATE} for: ${rawEvent.title}`, 'debug');
            }

            // Check state filter
            if (states && states.length > 0) {
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

            // Use rawEvent.title if details.title is just the site name
            const finalTitle = (details.title && details.title !== 'Race83')
                ? details.title
                : rawEvent.title;

            const event: StandardizedEvent = {
                title: finalTitle,
                date,
                city: finalCity || null,
                state: finalState || null,
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

    private extractEventId(url: string): string | null {
        // Extract event slug from URL like: race83.com.br/evento/2025/corrida-de-rua/event-name
        const match = url.match(/race83\.com\.br\/(?:evento|login)\/[^\/]+\/[^\/]+\/([^\/\?]+)/i);
        return match ? match[1] : null;
    }
}

export const race83Provider = new Race83Provider();
