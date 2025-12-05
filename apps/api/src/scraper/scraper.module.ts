import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { EventsModule } from '../events/events.module';
import { ScraperController } from './scraper.controller';
import { BullModule } from '@nestjs/bullmq';
import { ScraperProcessor } from './scraper.processor';
import { ScraperSchedulerService } from './scraper.scheduler.service';

@Module({
  imports: [
    EventsModule,
    BullModule.registerQueue({
      name: 'scraper',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100,
      },
    }),
  ],
  providers: [ScraperService, ScraperProcessor, ScraperSchedulerService],
  exports: [ScraperService],
  controllers: [ScraperController],
})
export class ScraperModule { }
