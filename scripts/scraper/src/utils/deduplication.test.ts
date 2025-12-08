/**
 * Deduplication Tests
 * Tests for normalization and deduplication functions
 */

import {
    normalizeTitle,
    normalizeCity,
    normalizeState,
    generateMatchKey,
    removeAccents,
} from './normalization';
import { deduplicateEvents, DeduplicationResult } from './deduplication';
import { StandardizedEvent } from '../interfaces';

describe('Normalization Utilities', () => {
    describe('removeAccents', () => {
        it('should remove common Brazilian accents', () => {
            expect(removeAccents('São Paulo')).toBe('Sao Paulo');
            expect(removeAccents('João Pessoa')).toBe('Joao Pessoa');
            expect(removeAccents('Belém')).toBe('Belem');
            expect(removeAccents('Brasília')).toBe('Brasilia');
            expect(removeAccents('Paraíba')).toBe('Paraiba');
        });
    });

    describe('normalizeTitle', () => {
        it('should lowercase and remove accents', () => {
            expect(normalizeTitle('Corrida São Silvestre')).toBe('sao silvestre');
        });

        it('should trim and collapse whitespace', () => {
            expect(normalizeTitle('  Maratona   de  Recife  ')).toBe('maratona de recife');
        });

        it('should handle empty/null input', () => {
            expect(normalizeTitle('')).toBe('');
        });
    });

    describe('normalizeCity', () => {
        it('should lowercase and remove accents', () => {
            expect(normalizeCity('João Pessoa')).toBe('joao pessoa');
        });

        it('should remove state suffix', () => {
            expect(normalizeCity('Recife - PE')).toBe('recife');
            expect(normalizeCity('São Paulo - SP')).toBe('sao paulo');
        });

        it('should handle null input', () => {
            expect(normalizeCity(null)).toBe('');
        });
    });

    describe('normalizeState', () => {
        it('should uppercase and trim', () => {
            expect(normalizeState('pb')).toBe('PB');
            expect(normalizeState('  sp  ')).toBe('SP');
        });

        it('should handle null input', () => {
            expect(normalizeState(null)).toBe('');
        });
    });

    describe('generateMatchKey', () => {
        it('should generate consistent keys for same event', () => {
            const date = new Date('2025-06-15');

            const key1 = generateMatchKey('Corrida São João', date, 'João Pessoa - PB', 'PB');
            const key2 = generateMatchKey('CORRIDA SÃO JOÃO', date, 'joao pessoa', 'pb');

            expect(key1).toBe(key2);
        });

        it('should generate different keys for different events', () => {
            const date1 = new Date('2025-06-15');
            const date2 = new Date('2025-06-16');

            const key1 = generateMatchKey('Maratona', date1, 'Recife', 'PE');
            const key2 = generateMatchKey('Maratona', date2, 'Recife', 'PE');

            expect(key1).not.toBe(key2);
        });
    });
});

describe('Deduplication', () => {
    const createEvent = (
        title: string,
        date: Date,
        city: string,
        state: string,
        sourcePlatform: string
    ): StandardizedEvent => ({
        title,
        date,
        city,
        state,
        distances: ['5km'],
        regUrl: null,
        sourceUrl: `http://${sourcePlatform}.com/${title.replace(/\s/g, '-')}`,
        sourcePlatform,
    });

    describe('deduplicateEvents', () => {
        it('should keep first occurrence (first-event-wins)', () => {
            const date = new Date('2025-06-15');
            const events: StandardizedEvent[] = [
                createEvent('Corrida São João', date, 'João Pessoa', 'PB', 'ticketsports'),
                createEvent('CORRIDA SÃO JOÃO', date, 'joao pessoa', 'pb', 'sympla'),
                createEvent('corrida sao joao', date, 'João Pessoa - PB', 'PB', 'doity'),
            ];

            const result = deduplicateEvents(events);

            expect(result.events).toHaveLength(1);
            expect(result.duplicatesRemoved).toBe(2);
            expect(result.events[0].sourcePlatform).toBe('ticketsports'); // First one wins
        });

        it('should keep different events', () => {
            const date1 = new Date('2025-06-15');
            const date2 = new Date('2025-06-20');
            const events: StandardizedEvent[] = [
                createEvent('Maratona de Recife', date1, 'Recife', 'PE', 'ticketsports'),
                createEvent('Corrida de Natal', date2, 'Natal', 'RN', 'sympla'),
            ];

            const result = deduplicateEvents(events);

            expect(result.events).toHaveLength(2);
            expect(result.duplicatesRemoved).toBe(0);
        });

        it('should track duplicate details', () => {
            const date = new Date('2025-06-15');
            const events: StandardizedEvent[] = [
                createEvent('Maratona PB', date, 'João Pessoa', 'PB', 'ticketsports'),
                createEvent('Maratona PB', date, 'João Pessoa', 'PB', 'sympla'),
            ];

            const result = deduplicateEvents(events);

            expect(result.duplicateDetails).toHaveLength(1);
            expect(result.duplicateDetails[0].keptEvent.sourcePlatform).toBe('ticketsports');
            expect(result.duplicateDetails[0].discardedEvents).toHaveLength(1);
            expect(result.duplicateDetails[0].discardedEvents[0].sourcePlatform).toBe('sympla');
        });

        it('should handle empty array', () => {
            const result = deduplicateEvents([]);

            expect(result.events).toHaveLength(0);
            expect(result.duplicatesRemoved).toBe(0);
            expect(result.duplicateDetails).toHaveLength(0);
        });

        it('should handle multiple duplicates of same event', () => {
            const date = new Date('2025-06-15');
            const events: StandardizedEvent[] = [
                createEvent('Corrida', date, 'Recife', 'PE', 'provider1'),
                createEvent('Corrida', date, 'Recife', 'PE', 'provider2'),
                createEvent('Corrida', date, 'Recife', 'PE', 'provider3'),
                createEvent('Corrida', date, 'Recife', 'PE', 'provider4'),
            ];

            const result = deduplicateEvents(events);

            expect(result.events).toHaveLength(1);
            expect(result.duplicatesRemoved).toBe(3);
            expect(result.duplicateDetails[0].discardedEvents).toHaveLength(3);
        });
    });
});
