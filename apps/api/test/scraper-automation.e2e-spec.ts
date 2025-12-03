import { Test, TestingModule } from '@nestjs/testing';
import { ScraperSchedulerService } from '../src/scraper/scraper.scheduler.service';
import { ScraperProcessor } from '../src/scraper/scraper.processor';
import { ScraperService } from '../src/scraper/scraper.service';
import { getQueueToken } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

describe('Scraper Automation', () => {
  let schedulerService: ScraperSchedulerService;
  let processor: ScraperProcessor;
  let scraperService: ScraperService;
  let queue: any;

  const mockQueue = {
    add: jest.fn(),
  };

  const mockScraperService = {
    scrapeEvents: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperSchedulerService,
        ScraperProcessor,
        {
          provide: ScraperService,
          useValue: mockScraperService,
        },
        {
          provide: getQueueToken('scraper'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    schedulerService = module.get<ScraperSchedulerService>(
      ScraperSchedulerService,
    );
    processor = module.get<ScraperProcessor>(ScraperProcessor);
    scraperService = module.get<ScraperService>(ScraperService);
    queue = module.get(getQueueToken('scraper'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Scheduler', () => {
    it('should add a job to the queue when triggered', async () => {
      await schedulerService.handleCron();
      expect(queue.add).toHaveBeenCalledWith(
        'runScraper',
        {},
        expect.objectContaining({
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 30000,
          },
        }),
      );
    });
  });

  describe('Processor', () => {
    it('should call ScraperService.scrapeEvents', async () => {
      mockScraperService.scrapeEvents.mockResolvedValue({
        newEvents: 5,
        updatedEvents: 2,
      });
      const job = { id: '1', name: 'runScraper' } as any;

      await processor.process(job);

      expect(scraperService.scrapeEvents).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockScraperService.scrapeEvents.mockRejectedValue(
        new Error('Scraping failed'),
      );
      const job = { id: '1', name: 'runScraper' } as any;

      // We expect the processor to throw so BullMQ can handle retries
      await expect(processor.process(job)).rejects.toThrow('Scraping failed');
    });
  });
});
