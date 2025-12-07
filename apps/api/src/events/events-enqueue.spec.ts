import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

describe('EventsService Enqueueing', () => {
  let service: EventsService;
  let notificationsQueue: Queue;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: SupabaseService,
          useValue: { getClient: jest.fn() },
        },
        {
          provide: 'BullQueue_notifications',
          useValue: {
            add: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            event: {
              findUnique: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    notificationsQueue = module.get<Queue>(getQueueToken('notifications'));
    prisma = module.get<PrismaService>(PrismaService);
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

      // Mock findUnique: returns null (not found)
      (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);

      // Mock create: returns new event
      (prisma.event.create as jest.Mock).mockResolvedValue({
        ...eventData,
        id: 'new-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.upsertBySourceUrl(eventData as any);

      expect(prisma.event.create).toHaveBeenCalled();
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

      // Mock findUnique: returns existing event
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-id',
        sourceUrl: 'http://example.com/existing',
      });

      // Mock update: returns updated event
      (prisma.event.update as jest.Mock).mockResolvedValue({
        ...eventData,
        id: 'existing-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.upsertBySourceUrl(eventData as any);

      expect(prisma.event.update).toHaveBeenCalled();
      expect(prisma.event.create).not.toHaveBeenCalled();
      expect(notificationsQueue.add).not.toHaveBeenCalled();
    });
  });
});
