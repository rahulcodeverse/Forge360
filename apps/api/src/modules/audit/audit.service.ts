import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

export interface AuditEntry {
  tenantId: string;
  actorId: string;
  actorIp?: string;
  module: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'LOGIN' | 'LOGOUT';
  entityType: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: entry.tenantId,
          actorId: entry.actorId,
          actorIp: entry.actorIp ?? null,
          module: entry.module,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          before: (entry.before ?? undefined) as never,
          after: (entry.after ?? undefined) as never,
          createdAt: new Date(),
        },
      });
    } catch (err) {
      // Audit failures must never break business logic
      this.logger.error('Failed to write audit log', err);
    }
  }
}
