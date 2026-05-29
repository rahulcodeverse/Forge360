import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Worker } from 'bullmq';

import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';
import { FormulaEngineService } from './formula-engine.service';
import { IndiaPayrollPlugin } from './plugins/india.plugin';
import { UsPayrollPlugin } from './plugins/us.plugin';
import { UkPayrollPlugin } from './plugins/uk.plugin';
import { UaePayrollPlugin } from './plugins/uae.plugin';
import type { PayrollPlugin, PayrollContext } from './payroll.interface';

export interface PayrollRunResult {
  runId: string;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  errors: string[];
}

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);
  private readonly plugins: Map<string, PayrollPlugin> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
    private readonly formulaEngine: FormulaEngineService,
    indiaPlugin: IndiaPayrollPlugin,
    usPlugin: UsPayrollPlugin,
    ukPlugin: UkPayrollPlugin,
    uaePlugin: UaePayrollPlugin,
    @InjectQueue('payroll-run') private readonly runQueue: Queue,
    @InjectQueue('payslip-generation') private readonly payslipQueue: Queue,
  ) {
    [indiaPlugin, usPlugin, ukPlugin, uaePlugin].forEach((p) =>
      this.plugins.set(p.countryCode, p),
    );
  }

  // ── Trigger run ──────────────────────────────────────────────────────────

  async triggerRun(tenantId: string, triggeredBy: string, month: number, year: number) {
    const existing = await this.prisma.payrollRun.findFirst({
      where: { tenantId, month, year, status: { in: ['processing', 'processed', 'approved', 'paid'] } },
    });

    if (existing) {
      throw new Error(`Payroll run for ${year}-${month} already exists (status: ${existing.status})`);
    }

    const run = await this.prisma.payrollRun.upsert({
      where: { tenantId_month_year: { tenantId, month, year } },
      create: {
        tenantId,
        month,
        year,
        status: 'draft',
        triggeredBy,
        triggeredAt: new Date(),
      },
      update: { status: 'draft', triggeredBy, triggeredAt: new Date() },
    });

    await this.runQueue.add(
      'process-payroll',
      { runId: run.id, tenantId, month, year },
      { jobId: `payroll:${tenantId}:${year}-${month}`, attempts: 1 },
    );

    return run;
  }

  // ── Core payroll computation ─────────────────────────────────────────────

  async processPayrollRun(
    runId: string,
    tenantId: string,
    month: number,
    year: number,
  ): Promise<PayrollRunResult> {
    await this.prisma.payrollRun.update({
      where: { id: runId },
      data: { status: 'processing' },
    });

    const errors: string[] = [];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let employeeCount = 0;

    const employees = await this.prisma.employee.findMany({
      where: { tenantId, deletedAt: null, employmentStatus: 'active' },
      include: {
        location: { select: { country: true } },
        salaryDetails: {
          where: { effectiveFrom: { lte: new Date(year, month - 1, 1) } },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
          include: { structure: true },
        },
      },
    });

    const workingDaysInMonth = this.getWorkingDays(year, month);

    for (const employee of employees) {
      try {
        const salaryDetail = employee.salaryDetails[0];
        if (!salaryDetail) {
          errors.push(`Employee ${employee.employeeCode}: No salary structure configured`);
          continue;
        }

        // Get attendance for LOP calculation
        const { presentDays, lopDays } = await this.getAttendanceStats(
          employee.id,
          tenantId,
          year,
          month,
          workingDaysInMonth,
        );

        const result = await this.computeEmployeePayroll({
          employee,
          salaryDetail,
          presentDays,
          lopDays,
          workingDays: workingDaysInMonth,
          month,
          year,
          tenantId,
        });

        await this.prisma.payrollRunItem.upsert({
          where: { runId_employeeId: { runId, employeeId: employee.id } },
          create: {
            runId,
            tenantId,
            employeeId: employee.id,
            workingDays: workingDaysInMonth,
            presentDays,
            lopDays,
            components: result.components,
            gross: result.gross,
            totalDeductions: result.totalDeductions,
            tds: result.tds,
            netPay: result.netPay,
          },
          update: {
            components: result.components,
            gross: result.gross,
            totalDeductions: result.totalDeductions,
            tds: result.tds,
            netPay: result.netPay,
            presentDays,
            lopDays,
          },
        });

        totalGross += result.gross;
        totalDeductions += result.totalDeductions;
        totalNet += result.netPay;
        employeeCount++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`Employee ${employee.employeeCode}: ${message}`);
        this.logger.error(`Payroll error for ${employee.id}: ${message}`);
      }
    }

    // Update run with totals
    await this.prisma.payrollRun.update({
      where: { id: runId },
      data: {
        status: errors.length === employees.length ? 'failed' : 'processed',
        processedAt: new Date(),
        totalGross,
        totalDeductions,
        totalNet,
        employeeCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });

    // Queue payslip generation for all successfully processed employees
    if (employeeCount > 0) {
      await this.payslipQueue.add(
        'generate-payslips',
        { runId, tenantId },
        { attempts: 3 },
      );
    }

    return { runId, employeeCount, totalGross, totalDeductions, totalNet, errors };
  }

  // ── Single employee payroll computation ──────────────────────────────────

  private async computeEmployeePayroll(params: {
    employee: { id: string; location: { country: string } | null };
    salaryDetail: { componentBreakup: unknown; structure: { components: unknown } };
    presentDays: number;
    lopDays: number;
    workingDays: number;
    month: number;
    year: number;
    tenantId: string;
  }) {
    const { employee, salaryDetail, presentDays, lopDays, workingDays } = params;

    const componentBreakup = salaryDetail.componentBreakup as Record<string, number>;
    const scope: Record<string, number> = {};

    // Apply LOP — proportional deduction
    const lopFactor = workingDays > 0 ? (workingDays - lopDays) / workingDays : 1;

    // Get payroll component definitions in order
    const components = await this.prisma.payrollComponent.findMany({
      where: { tenantId: params.tenantId, isActive: true },
      orderBy: { order: 'asc' },
    });

    const computedComponents: Record<string, number> = {};
    let gross = 0;

    // Build scope iteratively (components may depend on earlier ones)
    for (const component of components) {
      if (component.type === 'deduction' || component.type === 'statutory') continue;

      let value = 0;
      if (component.calculationType === 'fixed') {
        value = componentBreakup[component.code] ?? component.fixedAmount ?? 0;
      } else if (component.calculationType === 'formula' && component.formulaExpression) {
        value = this.formulaEngine.evaluate(component.formulaExpression, { ...scope, ...computedComponents });
      } else if (component.calculationType === 'percentage' && component.percentageBase && component.percentageValue != null) {
        value = (scope[component.percentageBase] ?? 0) * component.percentageValue / 100;
      }

      // Apply LOP
      value = parseFloat((value * lopFactor).toFixed(2));
      computedComponents[component.code] = value;
      scope[component.code] = value;
      gross += value;
    }

    scope['GROSS'] = parseFloat(gross.toFixed(2));

    // Run statutory plugin
    const country = employee.location?.country ?? 'IN';
    const plugin = this.plugins.get(country) ?? this.plugins.get('IN')!;
    const statutory = await plugin.compute({
      employeeId: employee.id,
      tenantId: params.tenantId,
      month: params.month,
      year: params.year,
      workingDays,
      presentDays,
      lopDays,
      components: scope,
      country,
    });

    // Compute deduction components using formula engine
    let totalDeductions = 0;
    for (const [code, amount] of Object.entries(statutory.employeeDeductions)) {
      computedComponents[code] = amount;
      totalDeductions += amount;
    }

    const tds = statutory.tds;
    const netPay = parseFloat((gross - totalDeductions).toFixed(2));

    return {
      components: computedComponents,
      gross: parseFloat(gross.toFixed(2)),
      totalDeductions: parseFloat(totalDeductions.toFixed(2)),
      tds,
      netPay,
    };
  }

  // ── Approve / pay ────────────────────────────────────────────────────────

  async approveRun(runId: string, tenantId: string, approverId: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: runId, tenantId, status: 'processed' },
    });
    if (!run) throw new NotFoundException('Payroll run not found or not in processed state');

    await this.prisma.payrollRun.update({
      where: { id: runId },
      data: { status: 'approved', approvedBy: approverId, approvedAt: new Date() },
    });

    await this.audit.log({
      tenantId,
      actorId: approverId,
      module: 'payroll',
      action: 'APPROVE',
      entityType: 'payroll_run',
      entityId: runId,
    });

    return { runId, status: 'approved' };
  }

  async getRun(runId: string, tenantId: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: runId, tenantId },
      include: {
        items: {
          include: {
            // employee included via relation — shape defined in Prisma schema
          },
        },
      },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
  }

  async getRuns(tenantId: string) {
    return this.prisma.payrollRun.findMany({
      where: { tenantId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getMyPayslips(employeeId: string, tenantId: string) {
    return this.prisma.payrollRunItem.findMany({
      where: { employeeId, tenantId },
      include: { run: { select: { month: true, year: true, status: true } } },
      orderBy: { run: { year: 'desc' } },
      take: 24,
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async getAttendanceStats(
    employeeId: string,
    tenantId: string,
    year: number,
    month: number,
    workingDays: number,
  ): Promise<{ presentDays: number; lopDays: number }> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const records = await this.prisma.attendanceRecord.findMany({
      where: { employeeId, tenantId, date: { gte: start, lte: end } },
      select: { status: true },
    });

    const approvedLeaveCount = await this.prisma.leaveRequest.count({
      where: {
        employeeId,
        tenantId,
        status: 'approved',
        fromDate: { lte: end },
        toDate: { gte: start },
      },
    });

    const presentDays = records.filter((r) =>
      ['present', 'work_from_home', 'half_day'].includes(r.status),
    ).length;

    const absentDays = records.filter((r) => r.status === 'absent').length;

    // LOP = absent days not covered by approved paid leave
    const lopDays = Math.max(0, absentDays - approvedLeaveCount);

    return { presentDays, lopDays };
  }

  private getWorkingDays(year: number, month: number): number {
    let count = 0;
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
      const day = date.getDay();
      if (day !== 0 && day !== 6) count++;
      date.setDate(date.getDate() + 1);
    }
    return count;
  }
}
