import { parseLocation } from '../common/utils/location-utils';
import { CorridasEMaratonasScraper } from './scrapers/corridas-emaratonas.scraper';
import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from '../events/events.service';
import { PrismaService } from '../prisma/prisma.service';
import { StandardizedEvent } from './interfaces/standardized-event.interface';
import { SupabaseService } from '../supabase/supabase.service';
import { getQueueToken } from '@nestjs/bullmq';

// Mock EventsService dependencies
const mockPrismaService = {
  event: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('Scraper Logic', () => {
  describe('parseLocation', () => {
    it('should extract city and state from "City - UF"', () => {
      expect(parseLocation('João Pessoa - PB')).toEqual({
        city: 'João Pessoa',
        state: 'PB',
      });
    });

    it('should extract city and state from "City/UF"', () => {
      expect(parseLocation('Recife/PE')).toEqual({
        city: 'Recife',
        state: 'PE',
      });
    });

    it('should handle state names if mapped (optional)', () => {
      // Assuming we implement mapping
      expect(parseLocation('Natal - Rio Grande do Norte')).toEqual({
        city: 'Natal',
        state: 'RN',
      });
    });

    it('should return raw string if parsing fails', () => {
      expect(parseLocation('Some Random Place')).toEqual({
        city: 'Some Random Place',
        state: null,
      });
    });
  });

  describe('CorridasEMaratonasScraper', () => {
    let scraper: CorridasEMaratonasScraper;

    beforeEach(() => {
      scraper = new CorridasEMaratonasScraper();
    });

    it('should be defined', () => {
      expect(scraper).toBeDefined();
    });
  });

  describe('EventsService.upsertFromStandardized', () => {
    let service: EventsService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EventsService,
          { provide: PrismaService, useValue: mockPrismaService },
          {
            provide: SupabaseService,
            useValue: {
              getClient: jest.fn(),
            },
          },
          {
            provide: getQueueToken('notifications'),
            useValue: { add: jest.fn() },
          },
        ],
      }).compile();

      service = module.get<EventsService>(EventsService);
      jest.clearAllMocks();
    });

    it('should deduplicate by sourcePlatform + sourceEventId', async () => {
      const event: StandardizedEvent = {
        title: 'Test Event',
        date: new Date(),
        city: 'Test City',
        state: 'TS',
        distances: ['5km'],
        regUrl: 'http://reg.com',
        sourceUrl: 'http://source.com',
        sourcePlatform: 'test-platform',
        sourceEventId: '123',
        priceMin: 50,
      };

      // Mock findFirst to return existing event
      (mockPrismaService.event.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-id',
      });

      // Mock update
      (mockPrismaService.event.update as jest.Mock).mockResolvedValue({
        id: 'existing-id',
        title: 'Updated',
      });

      await service.upsertFromStandardized(event);

      expect(mockPrismaService.event.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.event.update).toHaveBeenCalled();
      expect(mockPrismaService.event.create).not.toHaveBeenCalled();
    });

    it('should create new event if not found', async () => {
      const event: StandardizedEvent = {
        title: 'New Event',
        date: new Date(),
        city: 'New City',
        state: 'NC',
        distances: ['10km'],
        regUrl: 'http://reg.com',
        sourceUrl: 'http://source.com/new',
        sourcePlatform: 'test-platform',
        sourceEventId: '456',
      };

      // Mock findFirst to return null (not found)
      (mockPrismaService.event.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock create
      (mockPrismaService.event.create as jest.Mock).mockResolvedValue({
        id: 'new-id',
        title: 'New Event',
      });

      await service.upsertFromStandardized(event);

      expect(mockPrismaService.event.create).toHaveBeenCalled();
      expect(mockPrismaService.event.update).not.toHaveBeenCalled();
    });
  });
});
