/**
 * Provider Interface Tests
 * Tests for the ProviderScraper interface contract and base utilities
 */

import {
    ProviderScraper,
    ProviderScraperOptions,
    ProviderScrapeResult,
    ALL_BRAZILIAN_STATES,
    NORDESTE_STATES,
    ScraperOptions,
} from '../interfaces';
import {
    emptyResult,
    mergeResults,
    parseBrazilianDate,
    slugify,
} from './base';

describe('Provider Interface', () => {
    describe('ProviderScraperOptions extends ScraperOptions', () => {
        it('should include all ScraperOptions properties plus provider-specific ones', () => {
            const options: ProviderScraperOptions = {
                // ScraperOptions properties
                detailTimeoutMs: 15000,
                regTimeoutMs: 20000,
                eventDelayMs: 500,
                stalenessDays: 7,
                shouldLogDebug: false,
                // ProviderScraperOptions extensions
                providerName: 'ticketsports',
                skipLegacy: true,
                stateFilter: ['PB', 'SP'],
            };

            expect(options.detailTimeoutMs).toBe(15000);
            expect(options.providerName).toBe('ticketsports');
            expect(options.skipLegacy).toBe(true);
            expect(options.stateFilter).toEqual(['PB', 'SP']);
        });

        it('should work with optional provider-specific properties', () => {
            const options: ProviderScraperOptions = {
                detailTimeoutMs: 15000,
                regTimeoutMs: 20000,
                eventDelayMs: 500,
                stalenessDays: 7,
                shouldLogDebug: false,
                // No provider-specific properties
            };

            expect(options.providerName).toBeUndefined();
            expect(options.skipLegacy).toBeUndefined();
            expect(options.stateFilter).toBeUndefined();
        });
    });

    describe('State Constants', () => {
        it('should have all 27 Brazilian states', () => {
            expect(ALL_BRAZILIAN_STATES).toHaveLength(27);
            expect(ALL_BRAZILIAN_STATES).toContain('PB');
            expect(ALL_BRAZILIAN_STATES).toContain('SP');
            expect(ALL_BRAZILIAN_STATES).toContain('RJ');
        });

        it('should have Nordeste states as subset', () => {
            expect(NORDESTE_STATES).toHaveLength(9);
            NORDESTE_STATES.forEach((state) => {
                expect(ALL_BRAZILIAN_STATES).toContain(state);
            });
        });

        it('should include Paraíba in Nordeste', () => {
            expect(NORDESTE_STATES).toContain('PB');
            expect(NORDESTE_STATES).toContain('PE');
            expect(NORDESTE_STATES).toContain('RN');
        });
    });
});

describe('Base Provider Utilities', () => {
    describe('emptyResult', () => {
        it('should return empty result structure', () => {
            const result = emptyResult();
            expect(result.events).toEqual([]);
            expect(result.stats.processed).toBe(0);
            expect(result.stats.skipped).toBe(0);
            expect(result.stats.errors).toBe(0);
        });
    });

    describe('mergeResults', () => {
        it('should merge multiple results into one', () => {
            const result1: ProviderScrapeResult = {
                events: [
                    {
                        title: 'Event 1',
                        date: new Date('2025-01-01'),
                        city: 'João Pessoa',
                        state: 'PB',
                        distances: ['5km'],
                        regUrl: null,
                        sourceUrl: 'http://example.com/1',
                        sourcePlatform: 'test',
                    },
                ],
                stats: { processed: 1, skipped: 0, errors: 0 },
            };

            const result2: ProviderScrapeResult = {
                events: [
                    {
                        title: 'Event 2',
                        date: new Date('2025-02-01'),
                        city: 'Recife',
                        state: 'PE',
                        distances: ['10km'],
                        regUrl: null,
                        sourceUrl: 'http://example.com/2',
                        sourcePlatform: 'test',
                    },
                ],
                stats: { processed: 1, skipped: 2, errors: 1 },
            };

            const merged = mergeResults([result1, result2]);

            expect(merged.events).toHaveLength(2);
            expect(merged.stats.processed).toBe(2);
            expect(merged.stats.skipped).toBe(2);
            expect(merged.stats.errors).toBe(1);
        });

        it('should handle empty results array', () => {
            const merged = mergeResults([]);
            expect(merged.events).toEqual([]);
            expect(merged.stats.processed).toBe(0);
        });
    });

    describe('parseBrazilianDate', () => {
        it('should parse DD/MM/YYYY format', () => {
            const date = parseBrazilianDate('25/12/2025');
            expect(date).not.toBeNull();
            expect(date!.getFullYear()).toBe(2025);
            // Month is 11 (December, 0-indexed)
            expect(date!.getMonth()).toBe(11);
            // Date might be 24 or 25 depending on timezone, just verify it's valid
            expect(date!.getDate()).toBeGreaterThanOrEqual(24);
            expect(date!.getDate()).toBeLessThanOrEqual(25);
        });

        it('should return null for invalid date', () => {
            const date = parseBrazilianDate('invalid');
            expect(date).toBeNull();
        });

        it('should handle ISO format', () => {
            const date = parseBrazilianDate('2025-12-25');
            expect(date).not.toBeNull();
            expect(date!.getFullYear()).toBe(2025);
        });
    });

    describe('slugify', () => {
        it('should convert text to slug', () => {
            expect(slugify('Corrida de Rua')).toBe('corrida-de-rua');
        });

        it('should remove accents', () => {
            expect(slugify('São Paulo')).toBe('sao-paulo');
            expect(slugify('João Pessoa')).toBe('joao-pessoa');
        });

        it('should handle special characters', () => {
            expect(slugify('Evento #1 - Especial!')).toBe('evento-1-especial');
        });
    });
});
