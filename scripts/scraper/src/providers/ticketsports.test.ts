/**
 * TicketSports Provider Tests
 */

import { TicketSportsProvider } from './ticketsports';
import { ALL_BRAZILIAN_STATES } from '../interfaces';

describe('TicketSportsProvider', () => {
    let provider: TicketSportsProvider;

    beforeEach(() => {
        provider = new TicketSportsProvider();
    });

    describe('interface compliance', () => {
        it('should return correct provider name', () => {
            expect(provider.getName()).toBe('ticketsports');
        });

        it('should return highest priority (1)', () => {
            expect(provider.getPriority()).toBe(1);
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

    describe('priority', () => {
        it('should have highest priority for deduplication', () => {
            // Priority 1 means events from this provider take precedence
            expect(provider.getPriority()).toBe(1);
        });
    });
});
