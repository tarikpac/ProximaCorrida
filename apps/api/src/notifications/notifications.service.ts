import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import * as webpush from 'web-push';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const vapidSubject = this.configService.get<string>('VAPID_SUBJECT');

    if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    } else {
      this.logger.warn(
        'VAPID keys not configured. Push notifications will not work.',
      );
    }
  }

  async upsertSubscription(createSubscriptionDto: CreateSubscriptionDto) {
    const { endpoint, keys, statePreferences, userAgent } =
      createSubscriptionDto;

    return this.prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        keys: keys as any,
        statePreferences,
        userAgent,
        updatedAt: new Date(),
      },
      create: {
        endpoint,
        keys: keys as any,
        statePreferences,
        userAgent,
      },
    });
  }

  async getPreferences(endpoint: string) {
    const subscription = await this.prisma.pushSubscription.findUnique({
      where: { endpoint },
    });
    return subscription ? subscription.statePreferences : [];
  }

  async sendNotification(subscription: any, payload: any) {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error sending notification to ${subscription.endpoint}`,
        error,
      );
      if (error.statusCode === 410) {
        // Subscription expired or gone, remove it
        await this.prisma.pushSubscription.delete({
          where: { endpoint: subscription.endpoint },
        });
        this.logger.log(
          `Removed expired subscription: ${subscription.endpoint}`,
        );
      }
      throw error;
    }
  }

  async sendTestNotification(endpoint: string) {
    const subscription = await this.prisma.pushSubscription.findUnique({
      where: { endpoint },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const payload = {
      title: 'Test Notification',
      body: 'This is a test notification from Proxima Corrida!',
      url: 'https://proximacorrida.com.br',
    };

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: subscription.keys as any,
    };

    return this.sendNotification(pushSubscription, payload);
  }
}
