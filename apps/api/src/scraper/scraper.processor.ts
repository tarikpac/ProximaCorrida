import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Processor('scraper', { concurrency: 3 })
export class ScraperProcessor extends WorkerHost {
  private readonly logger = new Logger(ScraperProcessor.name);

  constructor(private readonly scraperService: ScraperService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'orchestrate-scrapers':
        return this.handleOrchestrate(job);
      case 'scrape-platform':
        return this.handleScrapePlatform(job);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleOrchestrate(job: Job): Promise<void> {
    this.logger.log(`Starting orchestration job ${job.id}...`);
    try {
      await this.scraperService.enqueueAllPlatforms();
      this.logger.log(`Orchestration job ${job.id} completed.`);
    } catch (error) {
      this.logger.error(
        `Orchestration job ${job.id} failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async handleScrapePlatform(
    job: Job<{ platform: string }>,
  ): Promise<void> {
    const platform = job.data.platform;
    this.logger.log(
      `Starting platform scrape job ${job.id} for ${platform}...`,
    );
    try {
      await this.scraperService.runPlatform(platform);
      this.logger.log(
        `Platform scrape job ${job.id} for ${platform} completed.`,
      );
    } catch (error) {
      this.logger.error(
        `Platform scrape job ${job.id} for ${platform} failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
