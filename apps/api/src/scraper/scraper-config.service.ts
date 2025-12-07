import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Configuration options for the scraper.
 * Used to pass config values to scraper instances.
 */
export interface ScraperOptions {
    detailTimeoutMs: number;
    regTimeoutMs: number;
    eventDelayMs: number;
    stalenessDays: number;
    batchSize: number;
    contextRenewalThreshold: number;
    shouldLogDebug: boolean;
}

/**
 * Service that provides scraper-specific configuration values.
 * Reads from environment variables with sensible defaults.
 */
@Injectable()
export class ScraperConfigService {
    constructor(private readonly configService: ConfigService) { }

    /**
     * Timeout for loading event details pages (ms).
     * Default: 15000 (15 seconds)
     */
    get detailTimeoutMs(): number {
        return this.configService.get<number>('DETAIL_TIMEOUT_MS') ?? 15000;
    }

    /**
     * Timeout for loading registration pages (ms).
     * Default: 20000 (20 seconds)
     */
    get regTimeoutMs(): number {
        return this.configService.get<number>('REG_TIMEOUT_MS') ?? 20000;
    }

    /**
     * Delay between processing each event (ms).
     * Default: 500 (0.5 seconds)
     */
    get eventDelayMs(): number {
        return this.configService.get<number>('SCRAPER_EVENT_DELAY_MS') ?? 500;
    }

    /**
     * Log level for scraper operations.
     * Options: 'debug', 'info', 'warn', 'error'
     * Default: 'info'
     */
    get logLevel(): string {
        return this.configService.get<string>('SCRAPER_LOG_LEVEL') ?? 'info';
    }

    /**
     * Number of days after which an event is considered stale and should be re-scraped.
     * Default: 7 days
     */
    get stalenessDays(): number {
        return this.configService.get<number>('SCRAPER_STALENESS_DAYS') ?? 7;
    }

    /**
     * Batch size for parallel event processing.
     * Default: 1 (sequential processing)
     */
    get batchSize(): number {
        return this.configService.get<number>('SCRAPER_BATCH_SIZE') ?? 1;
    }

    /**
     * Number of events after which to renew the browser context.
     * Default: 0 (disabled - no automatic renewal)
     */
    get contextRenewalThreshold(): number {
        return this.configService.get<number>('SCRAPER_CONTEXT_RENEWAL_THRESHOLD') ?? 0;
    }

    /**
     * Whether debug logging should be enabled.
     * Returns true if log level is 'debug' OR NODE_ENV is 'development'.
     */
    get shouldLogDebug(): boolean {
        const nodeEnv = this.configService.get<string>('NODE_ENV');
        return this.logLevel === 'debug' || nodeEnv === 'development';
    }

    /**
     * Get all scraper options as a single object.
     * Useful for passing to scraper instances.
     */
    getScraperOptions(): ScraperOptions {
        return {
            detailTimeoutMs: this.detailTimeoutMs,
            regTimeoutMs: this.regTimeoutMs,
            eventDelayMs: this.eventDelayMs,
            stalenessDays: this.stalenessDays,
            batchSize: this.batchSize,
            contextRenewalThreshold: this.contextRenewalThreshold,
            shouldLogDebug: this.shouldLogDebug,
        };
    }
}
