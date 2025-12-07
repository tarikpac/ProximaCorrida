import { Browser } from 'playwright';
import { StandardizedEvent } from '../interfaces/standardized-event.interface';
import { ScraperOptions } from '../scraper-config.service';

/**
 * Context passed to scraper containing configuration and services.
 */
export interface ScraperContext {
  options: ScraperOptions;
  checkFreshness?: (urls: string[]) => Promise<Set<string>>;
}

export abstract class BaseScraper {
  abstract readonly name: string;

  /**
   * Optional: Returns a list of sub-targets (e.g. state codes) to split this scraper into multiple jobs.
   */
  getSplits?(): string[];

  /**
   * Executes the scraping process for this platform.
   * @param browser Playwright Browser instance to use for creating contexts/pages
   * @param onEventFound Optional callback for real-time upserting
   * @param filter Optional filter string (e.g., state code) to process only a subset
   * @param context Optional context with configuration options and services
   */
  abstract scrape(
    browser: Browser,
    onEventFound?: (event: StandardizedEvent) => Promise<void>,
    filter?: string,
    context?: ScraperContext,
  ): Promise<StandardizedEvent[]>;
}

