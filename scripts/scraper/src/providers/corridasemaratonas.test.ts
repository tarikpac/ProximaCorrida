/**
 * CorridasEMaratonas Provider Tests
 * Tests for legacy provider adapter
 */

import { CorridasEMaratonasProvider } from './corridasemaratonas';
import { ALL_BRAZILIAN_STATES } from '../interfaces';

describe('CorridasEMaratonasProvider', () => {
    let provider: CorridasEMaratonasProvider;

    beforeEach(() => {
        provider = new CorridasEMaratonasProvider();
    });

    describe('interface compliance', () => {
        it('should return correct provider name', () => {
            expect(provider.getName()).toBe('corridasemaratonas');
        });

        it('should return lowest priority (8)', () => {
            expect(provider.getPriority()).toBe(8);
        });

        it('should implement all ProviderScraper methods', () => {
            expect(typeof provider.getName).toBe('function');
            expect(typeof provider.getPriority).toBe('function');
            expect(typeof provider.supportsState).toBe('function');
            expect(typeof provider.scrape).toBe('function');
        });
    });

    describe('supportsState', () => {
        it('should support all Brazilian states', () => {
            ALL_BRAZILIAN_STATES.forEach((state) => {
                expect(provider.supportsState(state)).toBe(true);
            });
        });

        it('should not support invalid states', () => {
            expect(provider.supportsState('XX')).toBe(false);
            expect(provider.supportsState('USA')).toBe(false);
            expect(provider.supportsState('')).toBe(false);
        });
    });

    describe('priority', () => {
        it('should have lowest priority for fallback behavior', () => {
            // Priority 8 means events from this provider should be
            // overridden by events from providers with lower priority numbers
            expect(provider.getPriority()).toBeGreaterThan(5);
        });
    });
});
