import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';

import { PrismaService } from '../database/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

export interface NotificationPayload {
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  channels?: Array<'in_app' | 'email' | 'sms'>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
    @InjectQueue('notifications') private readonly queue: Queue,
  ) {}

  async send(payload: NotificationPayload): Promise<void> {
    const notification = await this.prisma.notification.create({
      data: {
        tenantId: payload.tenantId,
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        entityType: payload.entityType ?? null,
        entityId: payload.entityId ?? null,
        isRead: false,
      },
    });

    // Real-time in-app push
    this.gateway.sendToUser(payload.userId, 'notification', {
      id: notification.id,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      createdAt: notification.createdAt,
    });

    // Queue email/SMS delivery if requested
    const channels = payload.channels ?? ['in_app'];
    if (channels.includes('email')) {
      await this.queue.add('send-email', { notificationId: notification.id, ...payload });
    }
    if (channels.includes('sms')) {
      await this.queue.add('send-sms', { notificationId: notification.id, ...payload });
    }
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
