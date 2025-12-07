import { Injectable, Logger } from '@nestjs/common';
import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { EventsService } from '../events/events.service';
import { BaseScraper, ScraperContext } from './scrapers/base.scraper';
import { CorridasEMaratonasScraper } from './scrapers/corridas-emaratonas.scraper';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ScraperConfigService } from './scraper-config.service';

chromium.use(stealthPlugin());

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly scrapers: BaseScraper[] = [];

  constructor(
    private readonly eventsService: EventsService,
    @InjectQueue('scraper') private readonly scraperQueue: Queue,
    private readonly scraperConfigService: ScraperConfigService,
  ) {
    this.scrapers.push(new CorridasEMaratonasScraper());
  }

  async enqueueAllPlatforms() {
    this.logger.log('Enqueuing jobs for all platforms...');
    for (const scraper of this.scrapers) {
      if (scraper.getSplits) {
        const splits = scraper.getSplits();
        this.logger.log(
          `Scraper ${scraper.name} supports splitting. Enqueuing ${splits.length} jobs...`,
        );
        for (const split of splits) {
          await this.scraperQueue.add(
            'scrape-platform',
            {
              platform: scraper.name,
              filter: split,
            },
            {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 60000, // 1 min delay if fails
              },
            },
          );
        }
        this.logger.log(
          `Enqueued ${splits.length} split jobs for ${scraper.name}`,
        );
      } else {
        await this.scraperQueue.add('scrape-platform', {
          platform: scraper.name,
        });
        this.logger.log(`Enqueued scrape-platform job for ${scraper.name}`);
      }
    }
  }

  async runPlatform(platformName: string, filter?: string) {
    const scraper = this.scrapers.find((s) => s.name === platformName);
    if (!scraper) {
      throw new Error(`Scraper for platform ${platformName} not found`);
    }

    this.logger.log(
      `Starting scrape for platform: ${platformName} ${filter ? `[Target: ${filter}]` : ''
      }`,
    );

    // Get scraper configuration
    const scraperOptions = this.scraperConfigService.getScraperOptions();
    if (scraperOptions.shouldLogDebug) {
      this.logger.debug(`Scraper config: ${JSON.stringify(scraperOptions)}`);
    }

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

    // Create scraper context with configuration and freshness check function
    const scraperContext: ScraperContext = {
      options: scraperOptions,
      checkFreshness: async (urls: string[]) => {
        return this.eventsService.checkEventsFreshness(
          urls,
          scraperOptions.stalenessDays,
        );
      },
    };

    try {
      const events = await scraper.scrape(browser, upsertEvent, filter, scraperContext);
      this.logger.log(
        `Scraped ${events.length} events from ${platformName} ${filter ? `[${filter}]` : ''
        }. (Real-time upsert enabled)`,
      );

      this.logger.log(`Finished processing ${platformName}`);
    } catch (error) {
      this.logger.error(`Failed to scrape platform ${platformName}`, error);
      throw error;
    } finally {
      await browser.close();
    }
  }
}

