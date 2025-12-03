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

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

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
}
