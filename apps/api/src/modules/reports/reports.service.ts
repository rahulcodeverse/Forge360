import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';

import { PrismaService } from '../database/prisma.service';

export interface ReportFilter {
  fromDate?: Date;
  toDate?: Date;
  departmentId?: string;
  locationId?: string;
  gradeId?: string;
  employmentStatus?: string;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('report-generation') private readonly reportQueue: Queue,
  ) {}

  // ── Executive dashboard ──────────────────────────────────────────────────

  async getHeadcountSummary(tenantId: string) {
    const [total, byDepartment, byLocation, byGrade, byStatus, byGender, joinedThisMonth, exitedThisMonth] =
      await Promise.all([
        this.prisma.employee.count({ where: { tenantId, deletedAt: null } }),

        this.prisma.employee.groupBy({
          by: ['departmentId'],
          where: { tenantId, deletedAt: null },
          _count: { id: true },
        }),

        this.prisma.employee.groupBy({
          by: ['locationId'],
          where: { tenantId, deletedAt: null },
          _count: { id: true },
        }),

        this.prisma.employee.groupBy({
          by: ['gradeId'],
          where: { tenantId, deletedAt: null },
          _count: { id: true },
        }),

        this.prisma.employee.groupBy({
          by: ['employmentStatus'],
          where: { tenantId, deletedAt: null },
          _count: { id: true },
        }),

        this.prisma.employee.groupBy({
          by: ['gender'],
          where: { tenantId, deletedAt: null },
          _count: { id: true },
        }),

        this.prisma.employee.count({
          where: {
            tenantId,
            deletedAt: null,
            joiningDate: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),

        this.prisma.employee.count({
          where: {
            tenantId,
            deletedAt: {
              not: null,
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]);

    return {
      total,
      byDepartment,
      byLocation,
      byGrade,
      byStatus,
      byGender,
      joinedThisMonth,
      exitedThisMonth,
      attritionRate:
        total > 0 ? parseFloat(((exitedThisMonth / total) * 100).toFixed(2)) : 0,
    };
  }

  // ── Salary register ──────────────────────────────────────────────────────

  async getSalaryRegister(tenantId: string, month: number, year: number) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { tenantId, month, year, status: { in: ['approved', 'paid'] } },
      include: {
        items: {
          include: {},
        },
      },
    });

    if (!run) return { month, year, status: 'no_run', items: [] };

    return {
      month,
      year,
      status: run.status,
      totalGross: run.totalGross,
      totalDeductions: run.totalDeductions,
      totalNet: run.totalNet,
      employeeCount: run.employeeCount,
      items: run.items,
    };
  }

  // ── Leave liability ──────────────────────────────────────────────────────

  async getLeaveLiability(tenantId: string, year: number) {
    const balances = await this.prisma.leaveBalance.findMany({
      where: { tenantId, year },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } },
        },
        leaveType: { select: { name: true, encashable: true } },
      },
    });

    const encashableBalances = balances.filter((b) => b.leaveType.encashable);
    const totalPendingDays = encashableBalances.reduce(
      (sum, b) => sum + (b.accrued + b.opening - b.taken - b.pending),
      0,
    );

    return {
      year,
      totalEmployees: new Set(balances.map((b) => b.employeeId)).size,
      totalPendingEncashableDays: totalPendingDays,
      balances,
    };
  }

  // ── Async export ─────────────────────────────────────────────────────────

  async queueExport(
    tenantId: string,
    reportType: string,
    filters: ReportFilter,
    format: 'csv' | 'pdf',
    recipientEmail: string,
  ): Promise<string> {
    const job = await this.reportQueue.add('generate-report', {
      tenantId,
      reportType,
      filters,
      format,
      recipientEmail,
    });
    return String(job.id);
  }
}
