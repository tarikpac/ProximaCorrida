/**
 * Minhas Inscrições Provider Tests
 */

import { MinhasInscricoesProvider } from './minhasinscricoes';
import { ALL_BRAZILIAN_STATES } from '../interfaces';

describe('MinhasInscricoesProvider', () => {
    let provider: MinhasInscricoesProvider;

    beforeEach(() => {
        provider = new MinhasInscricoesProvider();
    });

    describe('interface compliance', () => {
        it('should return correct provider name', () => {
            expect(provider.getName()).toBe('minhasinscricoes');
        });

        it('should return priority 2', () => {
            expect(provider.getPriority()).toBe(2);
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
        });
    });

    describe('priority ordering', () => {
        it('should have priority 2 (second highest)', () => {
            expect(provider.getPriority()).toBe(2);
        });
    });
});
