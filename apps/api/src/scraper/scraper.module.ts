import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScraperService } from './scraper.service';
import { EventsModule } from '../events/events.module';
import { ScraperController } from './scraper.controller';
import { BullModule } from '@nestjs/bullmq';
import { ScraperProcessor } from './scraper.processor';
import { ScraperSchedulerService } from './scraper.scheduler.service';
import { ScraperConfigService } from './scraper-config.service';

@Module({
  imports: [
    ConfigModule,
    EventsModule,
    BullModule.registerQueue({
      name: 'scraper',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100,
      },
    }),
  ],
  providers: [ScraperService, ScraperProcessor, ScraperSchedulerService, ScraperConfigService],
  exports: [ScraperService, ScraperConfigService],
  controllers: [ScraperController],
})
export class ScraperModule { }
