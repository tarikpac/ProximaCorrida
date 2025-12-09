/**
 * BrasilQueCorre Provider Tests
 */

import { BrasilQueCorreProvider } from './brasilquecorre';

describe('BrasilQueCorreProvider', () => {
    const provider = new BrasilQueCorreProvider();

    describe('getName', () => {
        it('should return brasilquecorre', () => {
            expect(provider.getName()).toBe('brasilquecorre');
        });
    });

    describe('getPriority', () => {
        it('should return 4', () => {
            expect(provider.getPriority()).toBe(4);
        });
    });

    describe('supportsState', () => {
        it('should support all Brazilian states', () => {
            const states = ['SP', 'RJ', 'MG', 'BA', 'PB', 'CE', 'RN', 'PE', 'AL'];
            states.forEach(state => {
                expect(provider.supportsState(state)).toBe(true);
            });
        });

        it('should not support invalid state codes', () => {
            expect(provider.supportsState('XX')).toBe(false);
            expect(provider.supportsState('USA')).toBe(false);
        });
    });
});
