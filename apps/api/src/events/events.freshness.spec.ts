import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('EventsService - checkEventsFreshness', () => {
    let service: EventsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        event: {
            findMany: jest.fn(),
        },
    };

    const mockSupabaseService = {};
    const mockQueue = { add: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventsService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: SupabaseService, useValue: mockSupabaseService },
                { provide: 'BullQueue_notifications', useValue: mockQueue },
            ],
        }).compile();

        service = module.get<EventsService>(EventsService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    describe('checkEventsFreshness', () => {
        it('should return empty Set for new URLs (not in database)', async () => {
            (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

            const result = await service.checkEventsFreshness(
                ['http://new-url-1.com', 'http://new-url-2.com'],
                7,
            );

            expect(result).toBeInstanceOf(Set);
            expect(result.size).toBe(0);
            expect(prisma.event.findMany).toHaveBeenCalledWith({
                where: {
                    sourceUrl: { in: ['http://new-url-1.com', 'http://new-url-2.com'] },
                    updatedAt: { gte: expect.any(Date) },
                },
                select: { sourceUrl: true },
            });
        });

        it('should return existing URLs with fresh updatedAt (within staleness threshold)', async () => {
            const freshUrl = 'http://fresh-event.com';
            (prisma.event.findMany as jest.Mock).mockResolvedValue([
                { sourceUrl: freshUrl },
            ]);

            const result = await service.checkEventsFreshness([freshUrl], 7);

            expect(result).toBeInstanceOf(Set);
            expect(result.has(freshUrl)).toBe(true);
            expect(result.size).toBe(1);
        });

        it('should return stale URLs as needing refresh (beyond threshold)', async () => {
            // When an event is stale (updatedAt older than threshold),
            // Prisma won't return it, so the Set should be empty for that URL
            const staleUrl = 'http://stale-event.com';
            (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

            const result = await service.checkEventsFreshness([staleUrl], 7);

            expect(result.has(staleUrl)).toBe(false);
            expect(result.size).toBe(0);
        });

        it('should handle batch lookup with multiple sourceUrls', async () => {
            const urls = [
                'http://url1.com',
                'http://url2.com',
                'http://url3.com',
                'http://url4.com',
                'http://url5.com',
            ];

            // Simulate: url2 and url4 are fresh, others are new or stale
            (prisma.event.findMany as jest.Mock).mockResolvedValue([
                { sourceUrl: 'http://url2.com' },
                { sourceUrl: 'http://url4.com' },
            ]);

            const result = await service.checkEventsFreshness(urls, 7);

            expect(result.size).toBe(2);
            expect(result.has('http://url2.com')).toBe(true);
            expect(result.has('http://url4.com')).toBe(true);
            expect(result.has('http://url1.com')).toBe(false);
            expect(result.has('http://url3.com')).toBe(false);
            expect(result.has('http://url5.com')).toBe(false);

            // Verify single batch query was made
            expect(prisma.event.findMany).toHaveBeenCalledTimes(1);
        });

        it('should handle empty sourceUrls array', async () => {
            const result = await service.checkEventsFreshness([], 7);

            expect(result).toBeInstanceOf(Set);
            expect(result.size).toBe(0);
            expect(prisma.event.findMany).not.toHaveBeenCalled();
        });

        it('should use correct staleness threshold calculation', async () => {
            const stalenessDays = 14;
            (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

            await service.checkEventsFreshness(['http://test.com'], stalenessDays);

            // Verify the threshold date is approximately 14 days ago
            const call = (prisma.event.findMany as jest.Mock).mock.calls[0][0];
            const thresholdDate = call.where.updatedAt.gte;

            const now = new Date();
            const expectedThreshold = new Date();
            expectedThreshold.setDate(now.getDate() - stalenessDays);

            // Allow 1 second tolerance for test execution time
            const diffMs = Math.abs(thresholdDate.getTime() - expectedThreshold.getTime());
            expect(diffMs).toBeLessThan(1000);
        });
    });
});
