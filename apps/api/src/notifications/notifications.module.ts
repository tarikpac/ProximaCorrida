import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

/**
 * NotificationsModule - Handles push notification subscriptions and sending.
 * 
 * NOTE: BullMQ queue was removed for Lambda compatibility.
 * Push notifications are now sent inline (synchronously).
 * 
 * If notification volume increases significantly in the future,
 * consider reintroducing async processing via:
 * - AWS SQS + Lambda trigger
 * - Or re-adding BullMQ with a separate worker container
 */
@Module({
  imports: [
    PrismaModule,
    ConfigModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule { }
