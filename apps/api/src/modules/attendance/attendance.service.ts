import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PaginationDto, paginate } from '../../common/pagination/pagination.dto';
import { AttendanceGateway } from './attendance.gateway';

export interface ClockInData {
  source: string;
  ip?: string;
  latitude?: number;
  longitude?: number;
  note?: string;
  timestamp?: Date;
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly gateway: AttendanceGateway,
  ) {}

  // ── Clock In/Out ─────────────────────────────────────────────────────────

  async clockIn(employeeId: string, tenantId: string, data: ClockInData) {
    const now = data.timestamp ?? new Date();
    const dateStr = now.toISOString().split('T')[0]!;
    const date = new Date(dateStr);

    const existing = await this.prisma.attendanceRecord.findFirst({
      where: { employeeId, tenantId, date },
    });

    if (existing?.clockIn) {
      throw new BadRequestException('Already clocked in today');
    }

    // Determine if employee is late based on their active shift
    const shift = await this.getActiveShift(employeeId, now);
    let isLate = false;
    let lateByMinutes: number | null = null;

    if (shift) {
      const [shiftHour, shiftMin] = shift.startTime.split(':').map(Number);
      const shiftStartToday = new Date(date);
      shiftStartToday.setHours(shiftHour!, shiftMin!, 0, 0);
      const graceEnd = new Date(shiftStartToday.getTime() + shift.gracePeriodMinutes * 60000);

      if (now > graceEnd) {
        isLate = true;
        lateByMinutes = Math.floor((now.getTime() - shiftStartToday.getTime()) / 60000);
      }
    }

    const record = await this.prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId, date } },
      create: {
        tenantId,
        employeeId,
        date,
        clockIn: now,
        clockInSource: data.source,
        clockInIp: data.ip ?? null,
        clockInLocation: data.latitude != null
          ? { lat: data.latitude, lng: data.longitude }
          : undefined,
        status: 'present',
        isLate,
        lateByMinutes,
        note: data.note ?? null,
      },
      update: {
        clockIn: now,
        clockInSource: data.source,
        clockInIp: data.ip ?? null,
        status: 'present',
        isLate,
        lateByMinutes,
      },
    });

    await this.broadcastSummary(tenantId, date);

    await this.audit.log({
      tenantId,
      actorId: employeeId,
      actorIp: data.ip,
      module: 'attendance',
      action: 'CREATE',
      entityType: 'attendance_record',
      entityId: record.id,
      after: { clockIn: now, source: data.source },
    });

    return record;
  }

  async clockOut(employeeId: string, tenantId: string, data: Partial<ClockInData> = {}) {
    const now = data.timestamp ?? new Date();
    const dateStr = now.toISOString().split('T')[0]!;
    const date = new Date(dateStr);

    const record = await this.prisma.attendanceRecord.findFirst({
      where: { employeeId, tenantId, date },
    });

    if (!record?.clockIn) throw new BadRequestException('No clock-in found for today');
    if (record.clockOut) throw new BadRequestException('Already clocked out today');

    const shift = await this.getActiveShift(employeeId, now);
    const totalMs = now.getTime() - record.clockIn.getTime();
    const totalHours = parseFloat((totalMs / 3600000).toFixed(2));

    // Calculate overtime
    const standardHours = shift
      ? (this.timeToMinutes(shift.endTime) - this.timeToMinutes(shift.startTime) - shift.breakDurationMinutes) / 60
      : 8;
    const overtimeHours = Math.max(0, totalHours - standardHours - (shift?.overtimeThresholdMins ?? 0) / 60);

    // Check for early leave
    let isEarlyLeave = false;
    if (shift) {
      const [endH, endM] = shift.endTime.split(':').map(Number);
      const shiftEndToday = new Date(date);
      shiftEndToday.setHours(endH!, endM!, 0, 0);
      isEarlyLeave = now < shiftEndToday;
    }

    const updated = await this.prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        clockOut: now,
        totalHours,
        overtimeHours: overtimeHours > 0 ? parseFloat(overtimeHours.toFixed(2)) : 0,
        isEarlyLeave,
      },
    });

    await this.broadcastSummary(tenantId, date);
    return updated;
  }

  // ── Monthly sheet ────────────────────────────────────────────────────────

  async getMonthlySheet(employeeId: string, tenantId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const [records, holidays] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where: {
          employeeId,
          tenantId,
          date: { gte: start, lte: end },
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.holiday.findMany({
        where: {
          calendar: {
            tenantId,
            isDefault: true,
          },
          date: { gte: start, lte: end },
        },
      }),
    ]);

    const holidayDates = new Set(holidays.map((h) => h.date.toISOString().split('T')[0]!));
    const recordMap = new Map(records.map((r) => [r.date.toISOString().split('T')[0]!, r]));

    const days = [];
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]!;
      const record = recordMap.get(dateStr);
      const isWeekend = current.getDay() === 0 || current.getDay() === 6;
      const isHoliday = holidayDates.has(dateStr);

      days.push({
        date: dateStr,
        status: record?.status ?? (isHoliday ? 'holiday' : isWeekend ? 'weekend' : 'absent'),
        clockIn: record?.clockIn,
        clockOut: record?.clockOut,
        totalHours: record?.totalHours,
        isLate: record?.isLate ?? false,
        isWeekend,
        isHoliday,
        isHolidayName: holidays.find((h) => h.date.toISOString().split('T')[0]! === dateStr)?.name,
      });

      current.setDate(current.getDate() + 1);
    }

    const summary = {
      totalDays: days.length,
      present: days.filter((d) => d.status === 'present').length,
      absent: days.filter((d) => d.status === 'absent').length,
      halfDay: days.filter((d) => d.status === 'half_day').length,
      late: days.filter((d) => d.isLate).length,
      totalHours: parseFloat(
        days.reduce((sum, d) => sum + (d.totalHours ?? 0), 0).toFixed(2),
      ),
    };

    return { employee: employeeId, year, month, days, summary };
  }

  // ── Live summary ─────────────────────────────────────────────────────────

  async getLiveSummary(tenantId: string): Promise<Record<string, unknown>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalEmployees, records] = await Promise.all([
      this.prisma.employee.count({
        where: { tenantId, deletedAt: null, employmentStatus: 'active' },
      }),
      this.prisma.attendanceRecord.findMany({
        where: { tenantId, date: today },
        select: { status: true, isLate: true, clockOut: true },
      }),
    ]);

    const present = records.filter((r) => r.status === 'present').length;
    const onLeave = records.filter((r) => r.status === 'on_leave').length;
    const late = records.filter((r) => r.isLate).length;

    return {
      date: today.toISOString().split('T')[0],
      totalEmployees,
      present,
      absent: totalEmployees - present - onLeave,
      late,
      onLeave,
      notMarked: totalEmployees - records.length,
      updatedAt: new Date().toISOString(),
    };
  }

  // ── Regularization ───────────────────────────────────────────────────────

  async submitRegularization(
    employeeId: string,
    tenantId: string,
    data: {
      date: string;
      requestedClockIn?: Date;
      requestedClockOut?: Date;
      reason: string;
      attachmentUrl?: string;
    },
  ) {
    return this.prisma.regularizationRequest.create({
      data: {
        tenantId,
        employeeId,
        date: new Date(data.date),
        requestedClockIn: data.requestedClockIn ?? null,
        requestedClockOut: data.requestedClockOut ?? null,
        reason: data.reason,
        attachmentUrl: data.attachmentUrl ?? null,
        status: 'pending',
      },
    });
  }

  async approveRegularization(
    requestId: string,
    tenantId: string,
    approverId: string,
    decision: 'approved' | 'rejected',
    comment?: string,
  ) {
    const req = await this.prisma.regularizationRequest.findFirst({
      where: { id: requestId, tenantId, status: 'pending' },
    });
    if (!req) throw new NotFoundException('Regularization request not found or already processed');

    await this.prisma.regularizationRequest.update({
      where: { id: requestId },
      data: { status: decision, approverId, approvedAt: new Date(), approverComment: comment ?? null },
    });

    if (decision === 'approved') {
      await this.prisma.attendanceRecord.updateMany({
        where: { employeeId: req.employeeId, date: req.date },
        data: {
          clockIn: req.requestedClockIn ?? undefined,
          clockOut: req.requestedClockOut ?? undefined,
          status: 'present',
          approvedBy: approverId,
          approvedAt: new Date(),
          regularizationRequestId: requestId,
        },
      });
    }

    return { decision, requestId };
  }

  // ── Shift management ─────────────────────────────────────────────────────

  async getShifts(tenantId: string) {
    return this.prisma.shift.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async assignShift(
    employeeId: string,
    tenantId: string,
    shiftId: string,
    effectiveFrom: string,
    effectiveTo?: string,
  ) {
    // End previous active assignment
    await this.prisma.shiftAssignment.updateMany({
      where: {
        employeeId,
        tenantId,
        effectiveTo: null,
      },
      data: {
        effectiveTo: new Date(new Date(effectiveFrom).getTime() - 86400000),
      },
    });

    return this.prisma.shiftAssignment.create({
      data: {
        tenantId,
        employeeId,
        shiftId,
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      },
    });
  }

  // ── Scheduled jobs ───────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async markAbsentees(): Promise<void> {
    // Auto-mark employees who haven't clocked in as absent for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const tenants = await this.prisma.tenant.findMany({ where: { isActive: true }, select: { id: true } });

    for (const tenant of tenants) {
      const activeEmployees = await this.prisma.employee.findMany({
        where: { tenantId: tenant.id, deletedAt: null, employmentStatus: 'active' },
        select: { id: true },
      });

      const existingRecords = await this.prisma.attendanceRecord.findMany({
        where: { tenantId: tenant.id, date: yesterday },
        select: { employeeId: true },
      });

      const markedIds = new Set(existingRecords.map((r) => r.employeeId));
      const unmarked = activeEmployees.filter((e) => !markedIds.has(e.id));

      if (unmarked.length > 0) {
        await this.prisma.attendanceRecord.createMany({
          data: unmarked.map((e) => ({
            tenantId: tenant.id,
            employeeId: e.id,
            date: yesterday,
            status: 'absent',
            isLate: false,
            isEarlyLeave: false,
          })),
          skipDuplicates: true,
        });
      }
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async getActiveShift(employeeId: string, date: Date) {
    const assignment = await this.prisma.shiftAssignment.findFirst({
      where: {
        employeeId,
        effectiveFrom: { lte: date },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }],
      },
      include: { shift: true },
      orderBy: { effectiveFrom: 'desc' },
    });
    return assignment?.shift ?? null;
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  }

  private async broadcastSummary(tenantId: string, date: Date): Promise<void> {
    const summary = await this.getLiveSummary(tenantId);
    this.gateway.broadcastAttendanceUpdate(tenantId, summary);
  }
}
