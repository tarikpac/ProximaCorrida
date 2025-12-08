/**
 * Race83 Provider Tests
 */

import { Race83Provider } from './race83';
import { NORDESTE_STATES, ALL_BRAZILIAN_STATES } from '../interfaces';

describe('Race83Provider', () => {
    let provider: Race83Provider;

    beforeEach(() => {
        provider = new Race83Provider();
    });

    describe('interface compliance', () => {
        it('should return correct provider name', () => {
            expect(provider.getName()).toBe('race83');
        });

        it('should return priority 7', () => {
            expect(provider.getPriority()).toBe(7);
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

        it('should not support RJ (Rio de Janeiro)', () => {
            expect(provider.supportsState('RJ')).toBe(false);
        });
    });
});
