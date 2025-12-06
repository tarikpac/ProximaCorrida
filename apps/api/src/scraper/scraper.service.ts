import { Injectable, Logger } from '@nestjs/common';
import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { EventsService } from '../events/events.service';
import { BaseScraper } from './scrapers/base.scraper';
import { CorridasEMaratonasScraper } from './scrapers/corridas-emaratonas.scraper';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

chromium.use(stealthPlugin());

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly scrapers: BaseScraper[] = [];

  constructor(
    private readonly eventsService: EventsService,
    @InjectQueue('scraper') private readonly scraperQueue: Queue,
  ) {
    this.scrapers.push(new CorridasEMaratonasScraper());
  }

  async enqueueAllPlatforms() {
    this.logger.log('Enqueuing jobs for all platforms...');
    for (const scraper of this.scrapers) {
      await this.scraperQueue.add('scrape-platform', {
        platform: scraper.name,
      });
      this.logger.log(`Enqueued scrape-platform job for ${scraper.name}`);
    }
  }

  async runPlatform(platformName: string) {
    const scraper = this.scrapers.find((s) => s.name === platformName);
    if (!scraper) {
      throw new Error(`Scraper for platform ${platformName} not found`);
    }

    this.logger.log(`Starting scrape for platform: ${platformName}`);
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"',
      ],
    });

    const upsertEvent = async (event: any) => {
      try {
        await this.eventsService.upsertFromStandardized(event);
      } catch (err) {
        this.logger.error(
          `Failed to upsert event ${event.title}: ${(err as Error).message}`,
        );
      }
    };

    try {
      const events = await scraper.scrape(browser, upsertEvent);
      this.logger.log(
        `Scraped ${events.length} events from ${platformName}. (Real-time upsert enabled)`,
      );

      // If the scraper implementation doesn't support callback (or returned events for legacy reasons),
      // we could double-check, but assuming CorridasEMaratonasScraper will use the callback, we are good.
      // To be safe against double-upserts (wasteful db calls), we can empty the list or just trust idempotency.
      // Ideally, the scraper shouldn't return the list if it already pushed them, OR we just log summary.

      this.logger.log(`Finished processing ${platformName}`);
    } catch (error) {
      this.logger.error(`Failed to scrape platform ${platformName}`, error);
      throw error;
    } finally {
      await browser.close();
    }
  }
}
