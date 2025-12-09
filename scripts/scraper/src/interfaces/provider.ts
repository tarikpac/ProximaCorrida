/**
 * Provider Scraper Interfaces
 * Defines the contract for all provider-specific scrapers
 */

import { BrowserContext } from 'playwright';
import { StandardizedEvent, ScraperOptions } from './index';

/**
 * Extended scraper options for multi-provider orchestration
 */
export interface ProviderScraperOptions extends ScraperOptions {
    /** If set, run only this provider */
    providerName?: string;
    /** If true, skip the legacy corridasemaratonas provider */
    skipLegacy?: boolean;
    /** States to filter (UF codes like 'PB', 'SP') */
    stateFilter?: string[];
}

/**
 * Result from a provider scrape operation
 */
export interface ProviderScrapeResult {
    /** Scraped events */
    events: StandardizedEvent[];
    /** Statistics */
    stats: {
        /** Number of event cards found in listing */
        cards?: number;
        /** Number of events successfully processed */
        processed: number;
        /** Number of events skipped (e.g., due to state filter) */
        skipped: number;
        /** Number of events discarded due to date parsing errors */
        discardedDate?: number;
        /** Number of errors (e.g., timeouts, page errors) */
        errors: number;
        /** Count of events by state */
        stateCount?: Record<string, number>;
    };
}

/**
 * Provider Scraper Interface
 * All provider implementations must implement this interface
 */
export interface ProviderScraper {
    /**
     * Get the provider name (used for logging and filtering)
     * @example 'ticketsports', 'sympla', 'corridasemaratonas'
     */
    getName(): string;

    /**
     * Get the provider priority (lower = higher priority for deduplication)
     * @example 1 for TicketSports, 8 for legacy corridasemaratonas
     */
    getPriority(): number;

    /**
     * Check if this provider supports scraping for a given state
     * @param state - UF code (e.g., 'PB', 'SP')
     * @returns true if provider can scrape events for this state
     */
    supportsState(state: string): boolean;

    /**
     * Scrape events from this provider
     * @param context - Playwright browser context
     * @param options - Scraper options
     * @param states - Optional list of states to scrape (if not provided, scrape all supported)
     * @returns Promise with scraped events and statistics
     */
    scrape(
        context: BrowserContext,
        options: ProviderScraperOptions,
        states?: string[]
    ): Promise<ProviderScrapeResult>;
}

/**
 * Provider registration entry
 */
export interface ProviderRegistryEntry {
    provider: ProviderScraper;
    enabled: boolean;
}

/**
 * All Brazilian states UF codes
 */
export const ALL_BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const;

/**
 * Nordeste region states (for regional providers)
 */
export const NORDESTE_STATES = [
    'AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'
] as const;

export type BrazilianState = typeof ALL_BRAZILIAN_STATES[number];
export type NordesteState = typeof NORDESTE_STATES[number];
