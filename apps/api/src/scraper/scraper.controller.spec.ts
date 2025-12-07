import { Test, TestingModule } from '@nestjs/testing';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { ScraperSchedulerService } from './scraper.scheduler.service';

describe('ScraperController', () => {
  let controller: ScraperController;

  const mockScraperService = {
    enqueueAllPlatforms: jest.fn(),
  };

  const mockScraperScheduler = {
    handleCron: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScraperController],
      providers: [
        { provide: ScraperService, useValue: mockScraperService },
        { provide: ScraperSchedulerService, useValue: mockScraperScheduler },
      ],
    }).compile();

    controller = module.get<ScraperController>(ScraperController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should trigger manual cron logic', async () => {
    await controller.triggerCronManually();
    expect(mockScraperScheduler.handleCron).toHaveBeenCalled();
  });
});
