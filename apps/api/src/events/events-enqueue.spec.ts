import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { SupabaseService } from '../supabase/supabase.service';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

describe('EventsService Enqueueing', () => {
    let service: EventsService;
    let supabaseService: SupabaseService;
    let notificationsQueue: Queue;

    const mockSupabaseClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        update: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventsService,
                {
                    provide: SupabaseService,
                    useValue: {
                        getClient: jest.fn().mockReturnValue(mockSupabaseClient),
                    },
                },
                {
                    provide: getQueueToken('notifications'),
                    useValue: {
                        add: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<EventsService>(EventsService);
        supabaseService = module.get<SupabaseService>(SupabaseService);
        notificationsQueue = module.get<Queue>(getQueueToken('notifications'));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('upsertBySourceUrl', () => {
        it('should enqueue notification job when inserting a new event', async () => {
            const eventData = {
                title: 'New Event',
                date: new Date(),
                city: 'João Pessoa',
                state: 'PB',
                sourceUrl: 'http://example.com/new',
                regLink: 'http://example.com/reg',
            };

            // Mock existing check: returns null (not found)
            mockSupabaseClient.single.mockResolvedValueOnce({ data: null });

            // Mock insert: returns new event
            mockSupabaseClient.single.mockResolvedValueOnce({
                data: { ...eventData, id: 'new-id' },
            });

            await service.upsertBySourceUrl(eventData as any);

            expect(notificationsQueue.add).toHaveBeenCalledWith(
                'send-push-notification',
                expect.objectContaining({
                    eventId: 'new-id',
                    eventTitle: 'New Event',
                    eventCity: 'João Pessoa',
                    eventState: 'PB',
                }),
            );
        });

        it('should NOT enqueue notification job when updating an existing event', async () => {
            const eventData = {
                title: 'Existing Event',
                date: new Date(),
                city: 'João Pessoa',
                state: 'PB',
                sourceUrl: 'http://example.com/existing',
                regLink: 'http://example.com/reg',
            };

            // Mock existing check: returns existing id
            mockSupabaseClient.single.mockResolvedValueOnce({ data: { id: 'existing-id' } });

            // Mock update: returns updated event
            mockSupabaseClient.single.mockResolvedValueOnce({
                data: { ...eventData, id: 'existing-id' },
            });

            await service.upsertBySourceUrl(eventData as any);

            expect(notificationsQueue.add).not.toHaveBeenCalled();
        });
    });
});
