import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Processor('scraper')
export class ScraperProcessor extends WorkerHost {
    private readonly logger = new Logger(ScraperProcessor.name);

    constructor(private readonly scraperService: ScraperService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        switch (job.name) {
            case 'runScraper':
                return this.handleRunScraper(job);
            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
    }

    private async handleRunScraper(job: Job): Promise<void> {
        this.logger.log(`Starting scraper job ${job.id}...`);
        try {
            const result = await this.scraperService.scrapeEvents();
            this.logger.log(`Scraper job ${job.id} completed successfully. New: ${result.newEvents}, Updated: ${result.updatedEvents}`);
        } catch (error) {
            this.logger.error(`Scraper job ${job.id} failed: ${error.message}`, error.stack);
            throw error; // Rethrow to allow BullMQ to handle retries
        }
    }
}
