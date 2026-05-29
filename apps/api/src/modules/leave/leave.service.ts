import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { WorkflowService } from '../workflow/workflow.service';
import { LeaveBalanceService } from './leave-balance.service';
import { PaginationDto, paginate } from '../../common/pagination/pagination.dto';

export interface CreateLeaveRequestData {
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  isHalfDay?: boolean;
  halfDayType?: string;
  reason: string;
  attachmentUrl?: string;
}

@Injectable()
export class LeaveService {
  private readonly logger = new Logger(LeaveService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly workflow: WorkflowService,
    private readonly balance: LeaveBalanceService,
  ) {}

  // ── Leave requests ───────────────────────────────────────────────────────

  async findRequests(
    tenantId: string,
    filters: {
      employeeId?: string;
      status?: string;
      year?: number;
    },
    dto: PaginationDto,
  ) {
    const where = {
      tenantId,
      ...(filters.employeeId && { employeeId: filters.employeeId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.year && {
        fromDate: {
          gte: new Date(filters.year, 0, 1),
          lte: new Date(filters.year, 11, 31),
        },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          leaveType: true,
          employee: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true },
          },
        },
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return paginate(items, total, dto);
  }

  async create(employeeId: string, tenantId: string, data: CreateLeaveRequestData) {
    const fromDate = new Date(data.fromDate);
    const toDate = new Date(data.toDate);

    if (fromDate > toDate) {
      throw new BadRequestException('From date must be before to date');
    }

    // Calculate duration (excluding weekends and holidays for the location)
    const durationDays = await this.calculateLeaveDuration(
      employeeId,
      tenantId,
      fromDate,
      toDate,
      data.isHalfDay ?? false,
    );

    if (durationDays === 0) {
      throw new BadRequestException('Leave duration is zero — check for weekend/holiday overlap');
    }

    // Check leave balance
    const year = fromDate.getFullYear();
    const balances = await this.balance.getBalances(employeeId, tenantId, year);
    const balance = balances.find((b) => b.leaveTypeId === data.leaveTypeId);

    if (!balance) throw new BadRequestException('No leave balance found for this leave type');
    const available = balance.accrued + balance.opening - balance.taken - balance.pending;
    if (available < durationDays) {
      throw new BadRequestException(
        `Insufficient leave balance. Available: ${available}, Requested: ${durationDays}`,
      );
    }

    // Advance notice check
    const leaveType = await this.prisma.leaveType.findFirst({
      where: { id: data.leaveTypeId, tenantId },
    });
    if (!leaveType) throw new NotFoundException('Leave type not found');

    const noticeDays = Math.floor((fromDate.getTime() - Date.now()) / 86400000);
    if (noticeDays < leaveType.minAdvanceNoticeDays) {
      throw new BadRequestException(
        `Minimum ${leaveType.minAdvanceNoticeDays} day(s) advance notice required`,
      );
    }

    // Build approval chain
    const approverChain = await this.buildApprovalChain(employeeId, tenantId);

    const request = await this.prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId,
        leaveTypeId: data.leaveTypeId,
        fromDate,
        toDate,
        durationDays,
        isHalfDay: data.isHalfDay ?? false,
        halfDayType: data.halfDayType ?? null,
        reason: data.reason,
        attachmentUrl: data.attachmentUrl ?? null,
        status: 'pending',
        currentLevel: 1,
        approverChain,
      },
      include: { leaveType: true },
    });

    // Increment pending balance
    await this.prisma.leaveBalance.updateMany({
      where: { employeeId, tenantId, leaveTypeId: data.leaveTypeId, year },
      data: { pending: { increment: durationDays } },
    });

    // Schedule SLA timer for first approver
    const firstLevel = approverChain[0] as { slaHours?: number } | undefined;
    if (firstLevel && firstLevel.slaHours) {
      await this.workflow.scheduleEscalation(request.id, 'leave', 1, firstLevel.slaHours);
    }

    await this.audit.log({
      tenantId,
      actorId: employeeId,
      module: 'leave',
      action: 'CREATE',
      entityType: 'leave_request',
      entityId: request.id,
      after: { leaveTypeId: data.leaveTypeId, fromDate: data.fromDate, toDate: data.toDate, durationDays },
    });

    return request;
  }

  async approve(
    requestId: string,
    tenantId: string,
    approverId: string,
    decision: 'approved' | 'rejected',
    comment?: string,
  ) {
    const request = await this.prisma.leaveRequest.findFirst({
      where: { id: requestId, tenantId, status: 'pending' },
    });

    if (!request) throw new NotFoundException('Leave request not found or already processed');

    const chain = request.approverChain as Array<{
      level: number;
      approverId?: string;
      approverType: string;
      slaHours: number;
      decision: string;
      decidedAt: string | null;
      comment: string | null;
    }>;

    const currentLevel = chain.find((l) => l.level === request.currentLevel);
    if (!currentLevel) throw new BadRequestException('Invalid approval chain state');

    // Update chain
    currentLevel.decision = decision;
    currentLevel.decidedAt = new Date().toISOString();
    currentLevel.comment = comment ?? null;
    currentLevel.approverId = approverId;

    // Cancel SLA timer
    await this.workflow.cancelEscalation(requestId, 'leave', request.currentLevel);

    let newStatus = 'pending';
    let nextLevel = request.currentLevel;

    if (decision === 'rejected') {
      newStatus = 'rejected';
    } else if (request.currentLevel >= chain.length) {
      // All levels approved
      newStatus = 'approved';
    } else {
      nextLevel = request.currentLevel + 1;
      // Schedule next level SLA
      const next = chain.find((l) => l.level === nextLevel);
      if (next) {
        await this.workflow.scheduleEscalation(requestId, 'leave', nextLevel, next.slaHours);
      }
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        currentLevel: nextLevel,
        approverChain: chain,
      },
    });

    const year = request.fromDate.getFullYear();

    if (newStatus === 'approved') {
      await this.balance.debit(
        request.employeeId,
        tenantId,
        request.leaveTypeId,
        year,
        request.durationDays,
        requestId,
      );
    } else if (newStatus === 'rejected') {
      // Release pending
      await this.prisma.leaveBalance.updateMany({
        where: {
          employeeId: request.employeeId,
          tenantId,
          leaveTypeId: request.leaveTypeId,
          year,
        },
        data: { pending: { decrement: request.durationDays } },
      });
    }

    await this.audit.log({
      tenantId,
      actorId: approverId,
      module: 'leave',
      action: decision === 'approved' ? 'APPROVE' : 'REJECT',
      entityType: 'leave_request',
      entityId: requestId,
      after: { decision, comment },
    });

    return updated;
  }

  async cancel(requestId: string, tenantId: string, employeeId: string): Promise<void> {
    const request = await this.prisma.leaveRequest.findFirst({
      where: { id: requestId, tenantId, employeeId },
    });

    if (!request) throw new NotFoundException('Leave request not found');
    if (!['pending', 'approved'].includes(request.status)) {
      throw new BadRequestException('Cannot cancel a request in this state');
    }

    await this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });

    const year = request.fromDate.getFullYear();

    // Release the balance (pending or taken)
    if (request.status === 'pending') {
      await this.prisma.leaveBalance.updateMany({
        where: {
          employeeId,
          tenantId,
          leaveTypeId: request.leaveTypeId,
          year,
        },
        data: { pending: { decrement: request.durationDays } },
      });
    } else if (request.status === 'approved') {
      await this.prisma.leaveBalance.updateMany({
        where: {
          employeeId,
          tenantId,
          leaveTypeId: request.leaveTypeId,
          year,
        },
        data: { taken: { decrement: request.durationDays } },
      });
    }
  }

  // ── Leave types and policies ─────────────────────────────────────────────

  async getLeaveTypes(tenantId: string) {
    return this.prisma.leaveType.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getBalances(employeeId: string, tenantId: string, year: number) {
    return this.balance.getBalances(employeeId, tenantId, year);
  }

  // ── Accrual cron ─────────────────────────────────────────────────────────

  @Cron('0 0 1 * *') // 1st of every month
  async runMonthlyAccrual(): Promise<void> {
    this.logger.log('Running monthly leave accrual...');
    const tenants = await this.prisma.tenant.findMany({ where: { isActive: true }, select: { id: true } });
    const currentYear = new Date().getFullYear();

    for (const tenant of tenants) {
      const policies = await this.prisma.leavePolicy.findMany({
        where: { tenantId: tenant.id, accrualFrequency: 'monthly' },
      });

      const activeEmployees = await this.prisma.employee.findMany({
        where: { tenantId: tenant.id, deletedAt: null, employmentStatus: 'active' },
        select: { id: true, gradeId: true },
      });

      for (const employee of activeEmployees) {
        const applicablePolicies = policies.filter((p) => p.gradeId === employee.gradeId);
        for (const policy of applicablePolicies) {
          await this.balance.credit(
            employee.id,
            tenant.id,
            policy.leaveTypeId,
            currentYear,
            policy.accrualAmount,
            'Monthly accrual',
          );
        }
      }
    }

    this.logger.log('Monthly leave accrual complete');
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async calculateLeaveDuration(
    employeeId: string,
    tenantId: string,
    fromDate: Date,
    toDate: Date,
    isHalfDay: boolean,
  ): Promise<number> {
    if (isHalfDay) return 0.5;

    // Get employee's location for holiday calendar
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId },
      select: { locationId: true },
    });

    const holidays = employee?.locationId
      ? await this.prisma.holiday.findMany({
          where: {
            calendar: { tenantId, isDefault: true, locationId: employee.locationId },
            date: { gte: fromDate, lte: toDate },
          },
          select: { date: true },
        })
      : [];

    const holidayDates = new Set(holidays.map((h) => h.date.toISOString().split('T')[0]!));

    let days = 0;
    const current = new Date(fromDate);
    while (current <= toDate) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split('T')[0]!;
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateStr)) {
        days++;
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  private async buildApprovalChain(employeeId: string, tenantId: string) {
    // Default: direct manager → HR (2 levels)
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId },
      select: { reportingManagerId: true },
    });

    return [
      {
        level: 1,
        approverType: 'direct_manager',
        approverId: employee?.reportingManagerId ?? null,
        approverName: null,
        slaHours: 24,
        decision: 'pending',
        decidedAt: null,
        comment: null,
      },
      {
        level: 2,
        approverType: 'hr',
        approverId: null,
        approverName: null,
        slaHours: 48,
        decision: 'pending',
        decidedAt: null,
        comment: null,
      },
    ];
  }
}
