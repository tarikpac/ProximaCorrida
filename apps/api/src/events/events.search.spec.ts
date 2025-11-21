import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { SupabaseService } from '../supabase/supabase.service';
import { SearchEventsDto } from './dto/search-events.dto';

describe('EventsService Search Logic', () => {
    let service: EventsService;
    let supabaseService: SupabaseService;
    let mockSupabaseClient: any;
    let mockQueryBuilder: any;

    beforeEach(async () => {
        mockQueryBuilder = {
            select: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            contains: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            overlaps: jest.fn().mockReturnThis(),
            filter: jest.fn().mockReturnThis(),
            then: jest.fn().mockImplementation((callback) => {
                callback({ data: [], error: null });
            }),
        };

        mockSupabaseClient = {
            from: jest.fn().mockReturnValue(mockQueryBuilder),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventsService,
                {
                    provide: SupabaseService,
                    useValue: {
                        getClient: jest.fn().mockReturnValue(mockSupabaseClient),
                    },
                },
            ],
        }).compile();

        service = module.get<EventsService>(EventsService);
        supabaseService = module.get<SupabaseService>(SupabaseService);
    });

    it('should filter by state and city', async () => {
        const params: SearchEventsDto = {
            state: 'PB',
            city: 'Joao Pessoa',
        };

        await service.findAll(params);

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('Event');
        expect(mockQueryBuilder.select).toHaveBeenCalled();
        expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('state', 'PB');
        expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('city', '%Joao Pessoa%');
    });

    it('should filter by date range', async () => {
        const params: SearchEventsDto = {
            from: '2025-01-01',
            to: '2025-01-31',
        };

        await service.findAll(params);

        expect(mockQueryBuilder.gte).toHaveBeenCalledWith('date', '2025-01-01');
        expect(mockQueryBuilder.lte).toHaveBeenCalledWith('date', '2025-01-31');
    });

    it('should filter by distances', async () => {
        const params: SearchEventsDto = {
            distances: ['5k', '10k'],
        };

        await service.findAll(params);

        // Implementation uses .filter('distances', 'ov', '{5k,10k}')
        expect(mockQueryBuilder.filter).toHaveBeenCalledWith('distances', 'ov', '{5k,10k}');
    });

    it('should handle text search query', async () => {
        const params: SearchEventsDto = {
            query: 'Maratona',
        };

        await service.findAll(params);

        // Assuming implementation uses .or for title, city, organizer
        expect(mockQueryBuilder.or).toHaveBeenCalledWith('title.ilike.%Maratona%,city.ilike.%Maratona%,organizer.ilike.%Maratona%');
    });

    it('should apply pagination', async () => {
        const params: SearchEventsDto = {
            page: 2,
            limit: 10,
        };

        await service.findAll(params);

        // Page 2, limit 10 means range(10, 19)
        expect(mockQueryBuilder.range).toHaveBeenCalledWith(10, 19);
    });
});
