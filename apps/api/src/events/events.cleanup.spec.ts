import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('EventsService - Cleanup & Filtering', () => {
    let service: EventsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        event: {
            updateMany: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
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
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('archivePastEvents', () => {
        it('should archive events older than today', async () => {
            const mockUpdateResult = { count: 5 };
            (prisma.event.updateMany as jest.Mock).mockResolvedValue(mockUpdateResult);

            const result = await service.archivePastEvents();

            expect(result).toEqual(mockUpdateResult);
            expect(prisma.event.updateMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    isActive: true,
                    date: expect.objectContaining({
                        lt: expect.any(Date),
                    }),
                }),
                data: expect.objectContaining({
                    isActive: false,
                    archivedAt: expect.any(Date),
                }),
            }));
        });
    });

    describe('findAll (Default Filtering)', () => {
        it('should filter active events by default', async () => {
            (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.event.count as jest.Mock).mockResolvedValue(0);

            await service.findAll({});

            expect(prisma.event.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    isActive: true,
                    date: expect.objectContaining({
                        gte: expect.any(Date),
                    }),
                }),
            }));
        });

        // Future proofing: ensure we don't break explicit searches if we add them later
        // For now, MVP says ALWAYS filter, so this test confirms strict default
    });
});
