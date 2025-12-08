/**
 * CorridasEMaratonas Provider (Legacy)
 * Adapter that wraps the existing scraper as a ProviderScraper
 * 
 * This is the fallback/validation provider during transition to direct providers.
 * Priority: 8 (lowest)
 */

import { BrowserContext } from 'playwright';
import {
    ProviderScraper,
    ProviderScraperOptions,
    ProviderScrapeResult,
    ALL_BRAZILIAN_STATES,
} from '../interfaces';
import { scrapeState, STATE_URLS, StateConfig } from '../scraper';
import { checkEventsFreshness } from '../db';
import { providerLog, emptyResult, mergeResults } from './base';

const PROVIDER_NAME = 'corridasemaratonas';
const PROVIDER_PRIORITY = 8; // Lowest priority (fallback)

/**
 * CorridasEMaratonas Provider
 * Wraps the existing scraper functionality as a ProviderScraper
 */
export class CorridasEMaratonasProvider implements ProviderScraper {
    getName(): string {
        return PROVIDER_NAME;
    }

    getPriority(): number {
        return PROVIDER_PRIORITY;
    }

    supportsState(state: string): boolean {
        // Supports all Brazilian states
        return ALL_BRAZILIAN_STATES.includes(state as any);
    }

    async scrape(
        context: BrowserContext,
        options: ProviderScraperOptions,
        states?: string[]
    ): Promise<ProviderScrapeResult> {
        providerLog(PROVIDER_NAME, 'Starting legacy scraper...');

        // Determine which states to scrape
        const statesToScrape = this.getStatesToScrape(states);

        if (statesToScrape.length === 0) {
            providerLog(PROVIDER_NAME, 'No states to scrape', 'warn');
            return emptyResult();
        }

        providerLog(PROVIDER_NAME, `Will scrape ${statesToScrape.length} state(s)`);

        const results: ProviderScrapeResult[] = [];

        for (const stateConfig of statesToScrape) {
            try {
                const result = await this.scrapeStateWithFreshness(
                    context,
                    stateConfig,
                    options
                );
                results.push(result);

                providerLog(
                    PROVIDER_NAME,
                    `[${stateConfig.state}] processed=${result.stats.processed}, skipped=${result.stats.skipped}, errors=${result.stats.errors}`
                );
            } catch (error) {
                providerLog(
                    PROVIDER_NAME,
                    `Failed to scrape ${stateConfig.state}: ${(error as Error).message}`,
                    'error'
                );
                results.push({
                    events: [],
                    stats: { processed: 0, skipped: 0, errors: 1 },
                });
            }
        }

        const merged = mergeResults(results);

        providerLog(
            PROVIDER_NAME,
            `Completed. Total events: ${merged.events.length}, errors: ${merged.stats.errors}`
        );

        return merged;
    }

    /**
     * Get state configs to scrape based on filter
     */
    private getStatesToScrape(states?: string[]): StateConfig[] {
        if (!states || states.length === 0) {
            return STATE_URLS;
        }

        const upperStates = states.map(s => s.toUpperCase());
        return STATE_URLS.filter(config => upperStates.includes(config.state));
    }

    /**
     * Scrape a single state with freshness checking
     */
    private async scrapeStateWithFreshness(
        context: BrowserContext,
        stateConfig: StateConfig,
        options: ProviderScraperOptions
    ): Promise<ProviderScrapeResult> {
        // Get fresh URLs for pre-filter (skip recently scraped events)
        const freshUrls = await this.getFreshUrlsForState(
            context,
            stateConfig,
            options
        );

        // Call the existing scrapeState function
        const { events, counters } = await scrapeState(
            context,
            stateConfig,
            {
                detailTimeoutMs: options.detailTimeoutMs,
                regTimeoutMs: options.regTimeoutMs,
                eventDelayMs: options.eventDelayMs,
                stalenessDays: options.stalenessDays,
                shouldLogDebug: options.shouldLogDebug,
            },
            freshUrls
        );

        return {
            events,
            stats: {
                processed: counters.processed,
                skipped: counters.skipped,
                errors: counters.errors,
            },
        };
    }

    /**
     * Get URLs that are fresh and should be skipped
     */
    private async getFreshUrlsForState(
        context: BrowserContext,
        stateConfig: StateConfig,
        options: ProviderScraperOptions
    ): Promise<Set<string>> {
        try {
            // Quick scrape to get all source URLs from listing
            const page = await context.newPage();

            try {
                await page.goto(stateConfig.url, {
                    timeout: options.detailTimeoutMs * 2
                });

                try {
                    await page.waitForSelector('.table-row', {
                        timeout: options.detailTimeoutMs
                    });
                } catch {
                    await page.close();
                    return new Set();
                }

                const urls = await page.$$eval('.table-row', (rows) => {
                    return rows
                        .map((row) => {
                            const titleLink = row.querySelector('td:nth-child(1) a') as HTMLAnchorElement;
                            return titleLink?.href;
                        })
                        .filter((url): url is string =>
                            !!url && url.startsWith('http') && !url.includes('#N/A')
                        );
                });

                await page.close();

                // Check which are fresh in database
                return await checkEventsFreshness(urls, options.stalenessDays);
            } catch (error) {
                await page.close();
                return new Set();
            }
        } catch {
            return new Set();
        }
    }
}

// Export a singleton instance
export const corridasEMaratonasProvider = new CorridasEMaratonasProvider();
