import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ScraperSchedulerService {
    private readonly logger = new Logger(ScraperSchedulerService.name);

    constructor(@InjectQueue('scraper') private scraperQueue: Queue) { }

    @Cron('0 3 * * *')
    async handleCron() {
        this.logger.log('Triggering daily scraper job...');
        await this.scraperQueue.add(
            'runScraper',
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
