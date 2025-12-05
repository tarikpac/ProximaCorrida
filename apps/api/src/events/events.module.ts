import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    SupabaseModule,
    PrismaModule,
    BullModule.registerQueue({
      name: 'notifications',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100,
      },
      // BullMQ v5/NestJS BullMQ: settings are part of the queue options directly or under 'settings' depending on version.
      // However, 'stalledInterval' is a Worker option, not a Queue option.
      // We cannot set worker options here in registerQueue.
      // We must set them in the Processor decorator or via a separate configuration.
    }),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule { }
