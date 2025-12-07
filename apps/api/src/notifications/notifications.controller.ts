import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  CreateSubscriptionDto,
  GetPreferencesDto,
} from './dto/create-subscription.dto';

export class TriggerNotificationDto {
  eventId: string;
  eventTitle: string;
  eventState: string;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Post('subscribe')
  async subscribe(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.notificationsService.upsertSubscription(createSubscriptionDto);
  }

  @Post('preferences')
  async getPreferences(@Body() body: GetPreferencesDto) {
    if (!body.endpoint) {
      throw new BadRequestException('Endpoint is required');
    }
    return this.notificationsService.getPreferences(body.endpoint);
  }

  @Post('test')
  async sendTestNotification(@Body() body: { endpoint: string }) {
    if (!body.endpoint) {
      throw new BadRequestException('Endpoint is required');
    }
    return this.notificationsService.sendTestNotification(body.endpoint);
  }

  /**
   * Trigger push notification for a new event
   * Called by the standalone scraper when a new event is created
   */
  @Post('trigger')
  async triggerNotification(@Body() body: TriggerNotificationDto) {
    if (!body.eventId || !body.eventTitle || !body.eventState) {
      throw new BadRequestException('eventId, eventTitle, and eventState are required');
    }
    return this.notificationsService.triggerEventNotification(
      body.eventId,
      body.eventTitle,
      body.eventState,
    );
  }
}
