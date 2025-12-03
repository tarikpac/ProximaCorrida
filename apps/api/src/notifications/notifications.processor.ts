import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case 'send-push-notification':
        return this.handleSendPushNotification(job);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleSendPushNotification(job: Job) {
    const { eventId, eventTitle, eventDate, eventCity, eventState } = job.data;

    this.logger.log(
      `Processing push notification for event: ${eventTitle} (${eventState})`,
    );

    try {
      // Find subscriptions that are interested in this state
      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: {
          statePreferences: {
            has: eventState,
          },
        },
      });

      this.logger.log(
        `Found ${subscriptions.length} subscriptions for state ${eventState}`,
      );

      if (subscriptions.length === 0) {
        return;
      }

      const payload = {
        title: eventTitle,
        body: `Nova corrida em ${eventCity}/${eventState} no dia ${new Date(eventDate).toLocaleDateString('pt-BR')}`,
        url: `/events/${eventId}`,
        data: {
          eventId,
          url: `/events/${eventId}`,
        },
      };

      let successCount = 0;
      let failureCount = 0;

      await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            await this.notificationsService.sendNotification(sub, payload);
            successCount++;
          } catch (error) {
            failureCount++;
          }
        }),
      );

      this.logger.log(
        `Notification summary for event ${eventId}: ${successCount} sent, ${failureCount} failed`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process notification job for event ${eventId}`,
        error,
      );
      throw error;
    }
  }
}
