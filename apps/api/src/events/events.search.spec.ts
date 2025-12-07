import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { SupabaseService } from '../supabase/supabase.service';
import { SearchEventsDto } from './dto/search-events.dto';
import { PrismaService } from '../prisma/prisma.service';

describe('EventsService Search Logic', () => {
  let service: EventsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: SupabaseService,
          useValue: { getClient: jest.fn() },
        },
        { provide: 'BullQueue_notifications', useValue: { add: jest.fn() } },
        {
          provide: PrismaService,
          useValue: {
            event: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prisma = module.get<PrismaService>(PrismaService);

    // Default mock implementation
    (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.event.count as jest.Mock).mockResolvedValue(0);
  });

  it('should filter by state and city', async () => {
    const params: SearchEventsDto = {
      state: 'PB',
      city: 'Joao Pessoa',
    };

    await service.findAll(params);

    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          state: 'PB',
          city: { contains: 'Joao Pessoa', mode: 'insensitive' },
        }),
      }),
    );
  });

  it('should filter by date range', async () => {
    const params: SearchEventsDto = {
      from: '2025-01-01',
      to: '2025-01-31',
    };

    await service.findAll(params);

    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: expect.objectContaining({
            gte: '2025-01-01',
            lte: '2025-01-31',
          }),
        }),
      }),
    );
  });

  it('should filter by distances', async () => {
    const params: SearchEventsDto = {
      distances: ['5k', '10k'],
    };

    await service.findAll(params);

    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          distances: { hasSome: ['5k', '10k'] },
        }),
      }),
    );
  });

  it('should handle text search query', async () => {
    const params: SearchEventsDto = {
      query: 'Maratona',
    };

    await service.findAll(params);

    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          title: { contains: 'Maratona', mode: 'insensitive' },
        }),
      }),
    );
  });

  it('should apply pagination', async () => {
    const params: SearchEventsDto = {
      page: 2,
      limit: 10,
    };

    await service.findAll(params);

    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10, // (2 - 1) * 10
        take: 10,
      }),
    );
  });
});
