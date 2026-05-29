import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly client: twilio.Twilio | null = null;
  private readonly fromNumber: string;

  constructor(private readonly config: ConfigService) {
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.config.get<string>('TWILIO_FROM_NUMBER', '');

    if (sid && token) {
      this.client = twilio(sid, token);
    }
  }

  async sendSms(to: string, body: string): Promise<void> {
    if (!this.client) {
      this.logger.warn(`SMS not configured — would send to ${to}: ${body}`);
      return;
    }

    await this.client.messages.create({ to, from: this.fromNumber, body });
    this.logger.log(`SMS sent to ${to}`);
  }
}
