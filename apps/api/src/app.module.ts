import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { EventsModule } from './events/events.module';
import { ScraperModule } from './scraper/scraper.module';
import { SupabaseModule } from './supabase/supabase.module';

import { ConfigModule } from '@nestjs/config';

import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), EventsModule, ScraperModule, SupabaseModule, NotificationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
