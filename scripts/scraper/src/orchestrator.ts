/**
 * Multi-Provider Orchestrator
 * Manages execution of all provider scrapers and coordinates results
 */

import { BrowserContext } from 'playwright';
import {
    ProviderScraper,
    ProviderScraperOptions,
    ProviderScrapeResult,
    StandardizedEvent,
} from './interfaces';
import {
    ticketSportsProvider,
    minhasInscricoesProvider,
    doityProvider,
    symplaProvider,
    zeniteProvider,
    correParaibaProvider,
    race83Provider,
    corridasEMaratonasProvider,
} from './providers';
import { deduplicateEvents, logDeduplicationSummary, DeduplicationResult } from './utils/deduplication';
import { emptyResult, mergeResults } from './providers/base';

/**
 * Per-provider execution result
 */
export interface ProviderExecutionResult {
    providerName: string;
    priority: number;
    result: ProviderScrapeResult;
    durationMs: number;
    error?: string;
}

/**
 * Orchestrator execution result
 */
export interface OrchestratorResult {
    /** Final deduplicated events */
    events: StandardizedEvent[];
    /** Per-provider results */
    providerResults: ProviderExecutionResult[];
    /** Deduplication statistics */
    deduplication: DeduplicationResult;
    /** Total execution time */
    totalDurationMs: number;
    /** Summary statistics */
    summary: {
        totalProviders: number;
        successfulProviders: number;
        failedProviders: number;
        totalEventsBeforeDedup: number;
        totalEventsAfterDedup: number;
        duplicatesRemoved: number;
    };
}

/**
 * Provider registry with all available providers
 * Ordered by priority (lower number = higher priority)
 */
const PROVIDER_REGISTRY: ProviderScraper[] = [
    // National providers (all Brazilian states)
    ticketSportsProvider,              // Priority 1 (highest)
    minhasInscricoesProvider,          // Priority 2
    doityProvider,                     // Priority 3
    symplaProvider,                    // Priority 4
    zeniteProvider,                    // Priority 5
    // Regional providers (Nordeste only)
    correParaibaProvider,              // Priority 6
    race83Provider,                    // Priority 7
    // Legacy provider (fallback)
    corridasEMaratonasProvider,        // Priority 8 (legacy)
];

/**
 * Parse CLI arguments for orchestrator options
 */
export function parseOrchestratorArgs(args: string[]): {
    stateFilter?: string[];
    providerFilter?: string;
    skipLegacy: boolean;
} {
    let stateFilter: string[] | undefined;
    let providerFilter: string | undefined;
    let skipLegacy = false;

    for (const arg of args) {
        if (arg.startsWith('--state=')) {
            const states = arg.replace('--state=', '').split(',');
            stateFilter = states.map(s => s.toUpperCase().trim());
        } else if (arg.startsWith('--provider=')) {
            providerFilter = arg.replace('--provider=', '').toLowerCase().trim();
        } else if (arg === '--skip-legacy') {
            skipLegacy = true;
        }
    }

    return { stateFilter, providerFilter, skipLegacy };
}

/**
 * Get providers to execute based on options
 */
export function getProvidersToExecute(
    options: ProviderScraperOptions,
    registry: ProviderScraper[] = PROVIDER_REGISTRY
): ProviderScraper[] {
    let providers = [...registry];

    // Filter by specific provider if requested
    if (options.providerName) {
        providers = providers.filter(
            p => p.getName().toLowerCase() === options.providerName!.toLowerCase()
        );
    }

    // Skip legacy provider if requested
    if (options.skipLegacy) {
        providers = providers.filter(
            p => p.getName() !== 'corridasemaratonas'
        );
    }

    // Sort by priority
    providers.sort((a, b) => a.getPriority() - b.getPriority());

    return providers;
}

/**
 * Filter providers by state support
 */
export function filterProvidersByState(
    providers: ProviderScraper[],
    states: string[]
): ProviderScraper[] {
    if (!states || states.length === 0) {
        return providers;
    }

    return providers.filter(provider =>
        states.some(state => provider.supportsState(state))
    );
}

/**
 * Main orchestrator function
 * Runs all applicable providers and returns deduplicated results
 */
export async function orchestrateProviders(
    context: BrowserContext,
    options: ProviderScraperOptions,
    registry: ProviderScraper[] = PROVIDER_REGISTRY
): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const providerResults: ProviderExecutionResult[] = [];
    const allEvents: StandardizedEvent[] = [];

    log('=== Multi-Provider Orchestrator Started ===');

    // Get providers to execute
    let providers = getProvidersToExecute(options, registry);

    // Filter by state support if state filter is provided
    if (options.stateFilter && options.stateFilter.length > 0) {
        providers = filterProvidersByState(providers, options.stateFilter);
        log(`State filter applied: ${options.stateFilter.join(', ')}`);
    }

    log(`Providers to execute: ${providers.map(p => p.getName()).join(', ')}`);

    if (providers.length === 0) {
        log('No providers matched the specified filters', 'warn');
        return createEmptyResult(startTime);
    }

    // Execute each provider sequentially
    for (const provider of providers) {
        const providerName = provider.getName();
        const providerStart = Date.now();

        log(`\n--- Executing provider: ${providerName} (priority: ${provider.getPriority()}) ---`);

        try {
            // Determine states to pass to this provider
            const statesToScrape = options.stateFilter?.filter(
                state => provider.supportsState(state)
            );

            const result = await provider.scrape(context, options, statesToScrape);
            const durationMs = Date.now() - providerStart;

            providerResults.push({
                providerName,
                priority: provider.getPriority(),
                result,
                durationMs,
            });

            // Add events to pool (in priority order)
            allEvents.push(...result.events);

            log(
                `[${providerName}] Completed in ${(durationMs / 1000).toFixed(1)}s: ` +
                `${result.events.length} events, ${result.stats.errors} errors`
            );
        } catch (error) {
            const durationMs = Date.now() - providerStart;
            const errorMessage = (error as Error).message;

            log(`[${providerName}] FAILED: ${errorMessage}`, 'error');

            providerResults.push({
                providerName,
                priority: provider.getPriority(),
                result: emptyResult(),
                durationMs,
                error: errorMessage,
            });

            // Continue with next provider (error isolation)
        }
    }

    // Deduplicate all events
    log('\n--- Deduplicating events ---');
    const deduplicationResult = deduplicateEvents(allEvents);
    logDeduplicationSummary(deduplicationResult);

    const totalDurationMs = Date.now() - startTime;

    // Calculate summary
    const successfulProviders = providerResults.filter(r => !r.error).length;
    const failedProviders = providerResults.filter(r => !!r.error).length;

    const result: OrchestratorResult = {
        events: deduplicationResult.events,
        providerResults,
        deduplication: deduplicationResult,
        totalDurationMs,
        summary: {
            totalProviders: providers.length,
            successfulProviders,
            failedProviders,
            totalEventsBeforeDedup: allEvents.length,
            totalEventsAfterDedup: deduplicationResult.events.length,
            duplicatesRemoved: deduplicationResult.duplicatesRemoved,
        },
    };

    // Log final summary
    logOrchestratorSummary(result);

    return result;
}

/**
 * Create empty orchestrator result
 */
function createEmptyResult(startTime: number): OrchestratorResult {
    return {
        events: [],
        providerResults: [],
        deduplication: {
            events: [],
            duplicatesRemoved: 0,
            duplicateDetails: [],
        },
        totalDurationMs: Date.now() - startTime,
        summary: {
            totalProviders: 0,
            successfulProviders: 0,
            failedProviders: 0,
            totalEventsBeforeDedup: 0,
            totalEventsAfterDedup: 0,
            duplicatesRemoved: 0,
        },
    };
}

/**
 * Log orchestrator summary
 */
function logOrchestratorSummary(result: OrchestratorResult): void {
    log('\n=== ORCHESTRATOR SUMMARY ===');
    log(`Providers executed: ${result.summary.totalProviders}`);
    log(`  Successful: ${result.summary.successfulProviders}`);
    log(`  Failed: ${result.summary.failedProviders}`);
    log(`Events before dedup: ${result.summary.totalEventsBeforeDedup}`);
    log(`Events after dedup: ${result.summary.totalEventsAfterDedup}`);
    log(`Duplicates removed: ${result.summary.duplicatesRemoved}`);
    log(`Total duration: ${(result.totalDurationMs / 1000).toFixed(1)}s`);
    log('============================');
}

/**
 * Simple logging utility
 */
function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [ORCHESTRATOR]`;

    if (level === 'error') {
        console.error(`${prefix} ${message}`);
    } else if (level === 'warn') {
        console.warn(`${prefix} ${message}`);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

// Export registry for testing
export { PROVIDER_REGISTRY };
