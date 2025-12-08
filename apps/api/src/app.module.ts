import { Module, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './events/events.module';
import { ScraperModule } from './scraper/scraper.module';
import { SupabaseModule } from './supabase/supabase.module';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from './notifications/notifications.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';

const logger = new Logger('AppModule');

/**
 * Check if running in AWS Lambda context
 */
function isLambdaContext(): boolean {
  return !!(process.env.IS_LAMBDA || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

/**
 * Build dynamic imports based on environment.
 * 
 * NOTE: BullMQ has been removed for Lambda compatibility.
 * - Scraper scheduling is now handled by GitHub Actions
 * - Push notifications are sent inline (synchronously)
 */
function buildDynamicImports(): any[] {
  const imports: any[] = [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
  ];

  // Only load ScheduleModule if NOT in Lambda (cron handled by GH Actions)
  if (!isLambdaContext()) {
    imports.push(ScheduleModule.forRoot());
    logger.log('ScheduleModule: Enabled (server mode)');
  } else {
    logger.log('ScheduleModule: Disabled (Lambda mode - cron via GH Actions)');
  }

  // Always load these modules
  imports.push(
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    EventsModule,
    ScraperModule,
    SupabaseModule,
    NotificationsModule,
    PrismaModule,
  );

  return imports;
}

@Module({
  imports: buildDynamicImports(),
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
