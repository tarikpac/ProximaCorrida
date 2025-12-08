import { Controller, Get, Post } from '@nestjs/common';
import { ScraperService } from './scraper.service';

/**
 * ScraperController - API endpoints for scraper status and info.
 * 
 * NOTE: Actual scraping is now handled by GitHub Actions (scripts/scraper).
 * These endpoints provide backward compatibility and status information.
 */
@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) { }

  @Get('status')
  async getStatus() {
    return this.scraperService.getStatus();
  }

  @Post('trigger')
  async triggerScraping() {
    return this.scraperService.enqueueAllPlatforms();
  }

  @Post('cron-trigger')
  async triggerCronManually() {
    return {
      success: false,
      message: 'Cron scheduling has been moved to GitHub Actions. Use the workflow dispatch to trigger manually.',
    };
  }
}
