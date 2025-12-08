/**
 * Corre Paraíba Provider Tests
 */

import { CorreParaibaProvider } from './correparaiba';
import { NORDESTE_STATES, ALL_BRAZILIAN_STATES } from '../interfaces';

describe('CorreParaibaProvider', () => {
    let provider: CorreParaibaProvider;

    beforeEach(() => {
        provider = new CorreParaibaProvider();
    });

    describe('interface compliance', () => {
        it('should return correct provider name', () => {
            expect(provider.getName()).toBe('correparaiba');
        });

        it('should return priority 6', () => {
            expect(provider.getPriority()).toBe(6);
        });

        it('should implement all ProviderScraper methods', () => {
            expect(typeof provider.getName).toBe('function');
            expect(typeof provider.getPriority).toBe('function');
            expect(typeof provider.supportsState).toBe('function');
            expect(typeof provider.scrape).toBe('function');
        });
    });

    describe('supportsState (regional)', () => {
        it('should support all Nordeste states', () => {
            NORDESTE_STATES.forEach((state) => {
                expect(provider.supportsState(state)).toBe(true);
            });
        });

        it('should NOT support non-Nordeste states', () => {
            const nonNordeste = ALL_BRAZILIAN_STATES.filter(
                s => !NORDESTE_STATES.includes(s as any)
            );

            nonNordeste.forEach((state) => {
                expect(provider.supportsState(state)).toBe(false);
            });
        });

        it('should not support SP (São Paulo)', () => {
            expect(provider.supportsState('SP')).toBe(false);
        });

        it('should support PB (Paraíba)', () => {
            expect(provider.supportsState('PB')).toBe(true);
        });
    });
});
