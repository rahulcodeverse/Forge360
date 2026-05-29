import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'notifications' })],
  providers: [NotificationsService, NotificationsGateway, EmailService, SmsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
