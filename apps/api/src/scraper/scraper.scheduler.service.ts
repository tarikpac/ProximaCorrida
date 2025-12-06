import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { EventsService } from '../events/events.service';

@Injectable()
export class ScraperSchedulerService {
  private readonly logger = new Logger(ScraperSchedulerService.name);

  constructor(
    @InjectQueue('scraper') private scraperQueue: Queue,
    private readonly eventsService: EventsService,
  ) { }

  // @Cron('0 3 * * *')
  async handleCron() {
    this.logger.log('Starting daily maintenance and scraper job...');

    // 1. Cleanup Past Events
    try {
      this.logger.log('Running cleanup of past events...');
      await this.eventsService.archivePastEvents();
      this.logger.log('Cleanup completed.');
    } catch (error) {
      this.logger.error('Failed to archive past events', error);
      // We continue to scraper even if cleanup fails?
      // Yes, scraper should still run to get new events. A cleanup failure is not blocking.
    }

    // 2. Trigger Scraper
    this.logger.log('Triggering scraper queue...');
    await this.scraperQueue.add(
      'orchestrate-scrapers',
      {},
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30000,
        },
      },
    );
    this.logger.log('Scraper job added to queue.');
  }
}
