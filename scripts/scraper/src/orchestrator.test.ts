/**
 * Orchestrator Tests
 * Tests for multi-provider orchestrator functionality
 */

import {
    parseOrchestratorArgs,
    getProvidersToExecute,
    filterProvidersByState,
    PROVIDER_REGISTRY,
} from './orchestrator';
import {
    ProviderScraper,
    ProviderScraperOptions,
    ProviderScrapeResult,
    ALL_BRAZILIAN_STATES,
    NORDESTE_STATES,
} from './interfaces';
import { BrowserContext } from 'playwright';

// Mock provider for testing
class MockProvider implements ProviderScraper {
    constructor(
        private name: string,
        private priority: number,
        private supportedStates: string[] = [...ALL_BRAZILIAN_STATES]
    ) { }

    getName(): string {
        return this.name;
    }

    getPriority(): number {
        return this.priority;
    }

    supportsState(state: string): boolean {
        return this.supportedStates.includes(state);
    }

    async scrape(): Promise<ProviderScrapeResult> {
        return {
            events: [],
            stats: { processed: 0, skipped: 0, errors: 0 },
        };
    }
}

describe('Orchestrator', () => {
    describe('parseOrchestratorArgs', () => {
        it('should parse --state=XX argument', () => {
            const result = parseOrchestratorArgs(['--state=PB']);
            expect(result.stateFilter).toEqual(['PB']);
        });

        it('should parse multiple states', () => {
            const result = parseOrchestratorArgs(['--state=PB,PE,RN']);
            expect(result.stateFilter).toEqual(['PB', 'PE', 'RN']);
        });

        it('should parse --provider=NAME argument', () => {
            const result = parseOrchestratorArgs(['--provider=ticketsports']);
            expect(result.providerFilter).toBe('ticketsports');
        });

        it('should parse --skip-legacy flag', () => {
            const result = parseOrchestratorArgs(['--skip-legacy']);
            expect(result.skipLegacy).toBe(true);
        });

        it('should parse all arguments together', () => {
            const result = parseOrchestratorArgs([
                '--state=PB,PE',
                '--provider=sympla',
                '--skip-legacy',
            ]);
            expect(result.stateFilter).toEqual(['PB', 'PE']);
            expect(result.providerFilter).toBe('sympla');
            expect(result.skipLegacy).toBe(true);
        });

        it('should handle no arguments', () => {
            const result = parseOrchestratorArgs([]);
            expect(result.stateFilter).toBeUndefined();
            expect(result.providerFilter).toBeUndefined();
            expect(result.skipLegacy).toBe(false);
        });
    });

    describe('getProvidersToExecute', () => {
        const mockRegistry: ProviderScraper[] = [
            new MockProvider('provider1', 1),
            new MockProvider('provider2', 2),
            new MockProvider('corridasemaratonas', 8),
        ];

        it('should return all providers when no filters', () => {
            const options: ProviderScraperOptions = {
                detailTimeoutMs: 15000,
                regTimeoutMs: 20000,
                eventDelayMs: 500,
                stalenessDays: 7,
                shouldLogDebug: false,
            };

            const result = getProvidersToExecute(options, mockRegistry);
            expect(result).toHaveLength(3);
        });

        it('should filter by provider name', () => {
            const options: ProviderScraperOptions = {
                detailTimeoutMs: 15000,
                regTimeoutMs: 20000,
                eventDelayMs: 500,
                stalenessDays: 7,
                shouldLogDebug: false,
                providerName: 'provider1',
            };

            const result = getProvidersToExecute(options, mockRegistry);
            expect(result).toHaveLength(1);
            expect(result[0].getName()).toBe('provider1');
        });

        it('should skip legacy provider when skipLegacy is true', () => {
            const options: ProviderScraperOptions = {
                detailTimeoutMs: 15000,
                regTimeoutMs: 20000,
                eventDelayMs: 500,
                stalenessDays: 7,
                shouldLogDebug: false,
                skipLegacy: true,
            };

            const result = getProvidersToExecute(options, mockRegistry);
            expect(result).toHaveLength(2);
            expect(result.find(p => p.getName() === 'corridasemaratonas')).toBeUndefined();
        });

        it('should sort by priority', () => {
            const options: ProviderScraperOptions = {
                detailTimeoutMs: 15000,
                regTimeoutMs: 20000,
                eventDelayMs: 500,
                stalenessDays: 7,
                shouldLogDebug: false,
            };

            const unsortedRegistry = [
                new MockProvider('last', 10),
                new MockProvider('first', 1),
                new MockProvider('middle', 5),
            ];

            const result = getProvidersToExecute(options, unsortedRegistry);
            expect(result[0].getName()).toBe('first');
            expect(result[1].getName()).toBe('middle');
            expect(result[2].getName()).toBe('last');
        });
    });

    describe('filterProvidersByState', () => {
        const mockProviders: ProviderScraper[] = [
            new MockProvider('national', 1, [...ALL_BRAZILIAN_STATES]),
            new MockProvider('nordeste', 2, [...NORDESTE_STATES]),
            new MockProvider('sp-only', 3, ['SP']),
        ];

        it('should return all providers when no state filter', () => {
            const result = filterProvidersByState(mockProviders, []);
            expect(result).toHaveLength(3);
        });

        it('should filter providers that support given state', () => {
            const result = filterProvidersByState(mockProviders, ['PB']);
            expect(result).toHaveLength(2); // national and nordeste
            expect(result.map(p => p.getName())).toContain('national');
            expect(result.map(p => p.getName())).toContain('nordeste');
        });

        it('should include provider if it supports any of the states', () => {
            const result = filterProvidersByState(mockProviders, ['SP', 'PB']);
            expect(result).toHaveLength(3); // all providers
        });

        it('should exclude providers that dont support any state', () => {
            const result = filterProvidersByState(mockProviders, ['SP']);
            expect(result).toHaveLength(2); // national and sp-only
            expect(result.map(p => p.getName())).not.toContain('nordeste');
        });
    });

    describe('PROVIDER_REGISTRY', () => {
        it('should contain at least 7 providers', () => {
            // After deprecating corridasemaratonas, we have 7 providers
            expect(PROVIDER_REGISTRY.length).toBeGreaterThanOrEqual(7);
        });

        it('should have providers sorted by priority', () => {
            for (let i = 1; i < PROVIDER_REGISTRY.length; i++) {
                expect(PROVIDER_REGISTRY[i].getPriority())
                    .toBeGreaterThanOrEqual(PROVIDER_REGISTRY[i - 1].getPriority());
            }
        });

        it('should include ticketsports as highest priority', () => {
            const ticketsports = PROVIDER_REGISTRY.find(p => p.getName() === 'ticketsports');
            expect(ticketsports).toBeDefined();
            expect(ticketsports?.getPriority()).toBe(1);
        });
    });
});
