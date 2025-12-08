/**
 * Sympla Provider Tests
 */

import { SymplaProvider } from './sympla';
import { ALL_BRAZILIAN_STATES } from '../interfaces';

describe('SymplaProvider', () => {
    let provider: SymplaProvider;

    beforeEach(() => {
        provider = new SymplaProvider();
    });

    describe('interface compliance', () => {
        it('should return correct provider name', () => {
            expect(provider.getName()).toBe('sympla');
        });

        it('should return priority 4', () => {
            expect(provider.getPriority()).toBe(4);
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
        });
    });
});
