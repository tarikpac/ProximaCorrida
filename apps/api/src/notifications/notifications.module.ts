import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsProcessor } from './notifications.processor';

@Module({
    imports: [
        PrismaModule,
        ConfigModule,
        BullModule.registerQueue({
            name: 'notifications',
        }),
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationsProcessor],
    exports: [NotificationsService],
})
export class NotificationsModule { }
