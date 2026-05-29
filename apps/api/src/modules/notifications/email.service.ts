import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mjml2html = require('mjml') as (template: string, opts?: object) => { html: string; errors: unknown[] };

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    this.fromAddress = this.config.get<string>('EMAIL_FROM', 'noreply@hrms.local');

    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST', 'localhost'),
      port: this.config.get<number>('SMTP_PORT', 1025),
      auth: this.config.get<string>('SMTP_USER')
        ? {
            user: this.config.get<string>('SMTP_USER'),
            pass: this.config.get<string>('SMTP_PASS'),
          }
        : undefined,
      secure: this.config.get<number>('SMTP_PORT', 1025) === 465,
    });
  }

  async sendMjml(to: string, subject: string, mjmlTemplate: string): Promise<void> {
    const { html, errors } = mjml2html(mjmlTemplate, { minify: true });

    if (errors.length > 0) {
      this.logger.warn('MJML template errors', errors);
    }

    await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject,
      html,
    });
  }

  async sendHtml(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({ from: this.fromAddress, to, subject, html });
  }
}
