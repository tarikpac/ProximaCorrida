import { Browser } from 'playwright';
import { StandardizedEvent } from '../interfaces/standardized-event.interface';

export abstract class BaseScraper {
  abstract readonly name: string;

  /**
   * Executes the scraping process for this platform.
   * @param browser Playwright Browser instance to use for creating contexts/pages
   */
  abstract scrape(browser: Browser): Promise<StandardizedEvent[]>;
}
