import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EventsService - State Aggregation', () => {
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
              groupBy: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should return event counts by state correctly', async () => {
    const mockData = [
      { state: 'PB', _count: { state: 2 } },
      { state: 'PE', _count: { state: 1 } },
      { state: 'SP', _count: { state: 3 } },
    ];

    (prisma.event.groupBy as jest.Mock).mockResolvedValue(mockData);

    const result = await service.getEventsByStateCount();

    const expected = [
      { state: 'PB', count: 2 },
      { state: 'PE', count: 1 },
      { state: 'SP', count: 3 },
    ];

    // Sorting by alphabetical order as per implementation
    expected.sort((a, b) => a.state.localeCompare(b.state));

    expect(result).toEqual(expected);
    expect(prisma.event.groupBy).toHaveBeenCalledWith({
      by: ['state'],
      _count: { state: true },
    });
  });

  it('should handle empty data', async () => {
    (prisma.event.groupBy as jest.Mock).mockResolvedValue([]);
    const result = await service.getEventsByStateCount();
    expect(result).toEqual([]);
  });
});
