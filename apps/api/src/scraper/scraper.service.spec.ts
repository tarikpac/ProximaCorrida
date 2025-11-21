import { Test, TestingModule } from '@nestjs/testing';
import { ScraperService } from './scraper.service';
import { EventsService } from '../events/events.service';

describe('ScraperService', () => {
  let service: ScraperService;

  const mockEventsService = {
    upsertBySourceUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperService,
        { provide: EventsService, useValue: mockEventsService },
      ],
    }).compile();

    service = module.get<ScraperService>(ScraperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
