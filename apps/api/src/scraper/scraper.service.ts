import { Injectable, Logger } from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { ScraperConfigService } from './scraper-config.service';

/**
 * ScraperService - Stub for API endpoints.
 * 
 * NOTE: The actual scraping work is now done by GitHub Actions (scripts/scraper).
 * This service provides minimal API functionality for:
 * - Status checks
 * - Manual trigger information
 * 
 * Playwright and BullMQ have been removed for Lambda compatibility.
 * The standalone scraper in scripts/scraper handles all scraping workloads.
 */
@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    private readonly eventsService: EventsService,
    private readonly scraperConfigService: ScraperConfigService,
  ) { }

  /**
   * Returns information about how to trigger scraping.
   * Actual scraping is done by GitHub Actions.
   */
  async getStatus() {
    return {
      message: 'Scraping is handled by GitHub Actions',
      documentation: 'See .github/workflows/scraper.yml for the cron schedule',
      manualTrigger: 'GitHub Actions -> proximacorrida-scraper -> Run workflow',
      lastRunInfo: 'Check GitHub Actions for recent runs',
    };
  }

  /**
   * Stub method for backward compatibility.
   * Returns error since scraping is no longer available in the API.
   */
  async enqueueAllPlatforms() {
    this.logger.warn('enqueueAllPlatforms called but scraping is now on GitHub Actions');
    return {
      success: false,
      message: 'Scraping has been moved to GitHub Actions. Use the workflow dispatch to trigger manually.',
    };
  }

  /**
   * Stub method for backward compatibility.
   * Returns error since scraping is no longer available in the API.
   */
  async runPlatform(platformName: string, _filter?: string) {
    this.logger.warn(`runPlatform called for ${platformName} but scraping is now on GitHub Actions`);
    return {
      success: false,
      message: `Scraping for ${platformName} has been moved to GitHub Actions. Use the workflow dispatch to trigger manually.`,
    };
  }
}
