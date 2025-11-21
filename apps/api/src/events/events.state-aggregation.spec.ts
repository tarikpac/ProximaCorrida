import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('EventsService - State Aggregation', () => {
    let service: EventsService;

    const mockSupabaseClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn(),
    };

    const mockSupabaseService = {
        getClient: jest.fn().mockReturnValue(mockSupabaseClient),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventsService,
                { provide: SupabaseService, useValue: mockSupabaseService },
            ],
        }).compile();

        service = module.get<EventsService>(EventsService);
    });

    it('should return event counts by state correctly', async () => {
        const mockData = [
            { state: 'PB' },
            { state: 'PB' },
            { state: 'PE' },
            { state: 'SP' },
            { state: 'SP' },
            { state: 'SP' },
        ];

        // Mock the chain
        mockSupabaseClient.from.mockReturnThis();
        mockSupabaseClient.select.mockResolvedValue({ data: mockData, error: null });

        const result = await service.getEventsByStateCount();

        // Expected result sorted by count desc or state asc? 
        // Let's assume no specific order for now, or maybe alphabetical.
        // The implementation should probably return them in a consistent order.
        // Let's expect alphabetical by state for consistency.

        const expected = [
            { state: 'PB', count: 2 },
            { state: 'PE', count: 1 },
            { state: 'SP', count: 3 }
        ];

        // Sort result to ensure test stability
        result.sort((a, b) => a.state.localeCompare(b.state));

        expect(result).toEqual(expected);
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('Event');
        expect(mockSupabaseClient.select).toHaveBeenCalledWith('state');
    });

    it('should handle empty data', async () => {
        mockSupabaseClient.select.mockResolvedValue({ data: [], error: null });
        const result = await service.getEventsByStateCount();
        expect(result).toEqual([]);
    });
});
