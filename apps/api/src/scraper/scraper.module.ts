import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { EventsModule } from '../events/events.module';
import { ScraperController } from './scraper.controller';

@Module({
  imports: [EventsModule],
  providers: [ScraperService],
  exports: [ScraperService],
  controllers: [ScraperController],
})
export class ScraperModule { }
