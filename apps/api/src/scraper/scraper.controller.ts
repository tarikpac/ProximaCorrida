import { Controller, Post } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScraperSchedulerService } from './scraper.scheduler.service';

@Controller('scraper')
export class ScraperController {
  constructor(
    private readonly scraperService: ScraperService,
    private readonly scraperScheduler: ScraperSchedulerService,
  ) { }

  @Post('trigger')
  async triggerScraping() {
    await this.scraperService.enqueueAllPlatforms();
    return { message: 'Scraping started' };
  }

  @Post('cron-trigger')
  async triggerCronManually() {
    this.scraperScheduler.handleCron(); // Fire and forget, or await if needed
    return { message: 'Daily maintenance (Cleanup + Scraper) triggered manually' };
  }
}
