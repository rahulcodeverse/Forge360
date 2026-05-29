import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';

import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';

export type ApproverType =
  | 'direct_manager'
  | 'skip_manager'
  | 'hr'
  | 'specific_role'
  | 'specific_user';

export interface WorkflowLevel {
  level: number;
  approverType: ApproverType;
  slaHours: number;
  escalateTo?: ApproverType;
  canDelegate: boolean;
  specificUserId?: string;
  specificRole?: string;
}

export interface WorkflowConfig {
  moduleType: string;
  levels: WorkflowLevel[];
  parallelLevels?: boolean;
  autoApproveRules?: Array<{ condition: string }>;
}

export interface ApprovalDecision {
  decision: 'approved' | 'rejected';
  comment?: string;
  approverId: string;
  tenantId: string;
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @InjectQueue('workflow-sla') private readonly slaQueue: Queue,
  ) {}

  /** Resolves the actual approver user IDs for a workflow level */
  async resolveApprovers(
    level: WorkflowLevel,
    employeeId: string,
    tenantId: string,
  ): Promise<string[]> {
    switch (level.approverType) {
      case 'direct_manager': {
        const emp = await this.prisma.employee.findUnique({
          where: { id: employeeId },
          select: { reportingManagerId: true },
        });
        return emp?.reportingManagerId ? [emp.reportingManagerId] : [];
      }

      case 'skip_manager': {
        const emp = await this.prisma.employee.findUnique({
          where: { id: employeeId },
          select: {
            reportingManager: {
              select: { reportingManagerId: true },
            },
          },
        });
        const skipId = emp?.reportingManager?.reportingManagerId;
        return skipId ? [skipId] : [];
      }

      case 'hr': {
        const hrUsers = await this.prisma.user.findMany({
          where: {
            tenantId,
            role: { in: ['hr_admin', 'hr_manager'] },
            isActive: true,
          },
          select: { id: true },
        });
        return hrUsers.map((u) => u.id);
      }

      case 'specific_user':
        return level.specificUserId ? [level.specificUserId] : [];

      case 'specific_role': {
        if (!level.specificRole) return [];
        const roleUsers = await this.prisma.user.findMany({
          where: { tenantId, role: level.specificRole as never, isActive: true },
          select: { id: true },
        });
        return roleUsers.map((u) => u.id);
      }

      default:
        return [];
    }
  }

  /** Schedules a BullMQ delayed job for SLA escalation */
  async scheduleEscalation(
    requestId: string,
    moduleType: string,
    level: number,
    slaHours: number,
  ): Promise<void> {
    await this.slaQueue.add(
      'sla-escalate',
      { requestId, moduleType, level },
      {
        delay: slaHours * 60 * 60 * 1000,
        jobId: `sla:${moduleType}:${requestId}:${level}`,
        removeOnComplete: true,
      },
    );
  }

  async cancelEscalation(requestId: string, moduleType: string, level: number): Promise<void> {
    const jobId = `sla:${moduleType}:${requestId}:${level}`;
    const job = await this.slaQueue.getJob(jobId);
    if (job) await job.remove();
  }
}
