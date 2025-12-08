import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScraperService } from './scraper.service';
import { EventsModule } from '../events/events.module';
import { ScraperController } from './scraper.controller';
import { ScraperConfigService } from './scraper-config.service';

/**
 * ScraperModule - Provides scraping utilities for the API.
 * 
 * NOTE: The main scraping work is now done by GitHub Actions (scripts/scraper).
 * This module provides:
 * - ScraperController: API endpoints for manual triggers or status checks
 * - ScraperService: Core scraping logic (shared with standalone scraper)
 * - ScraperConfigService: Configuration for scraper behavior
 * 
 * BullMQ queue and ScraperProcessor/ScraperSchedulerService were removed
 * since scheduling is now handled by GitHub Actions cron.
 */
@Module({
  imports: [
    ConfigModule,
    EventsModule,
  ],
  providers: [ScraperService, ScraperConfigService],
  exports: [ScraperService, ScraperConfigService],
  controllers: [ScraperController],
})
export class ScraperModule { }
