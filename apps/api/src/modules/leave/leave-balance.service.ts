import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class LeaveBalanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalances(employeeId: string, tenantId: string, year: number) {
    return this.prisma.leaveBalance.findMany({
      where: { employeeId, tenantId, year },
      include: { leaveType: true },
    });
  }

  async debit(
    employeeId: string,
    tenantId: string,
    leaveTypeId: string,
    year: number,
    days: number,
    requestId: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.leaveBalance.updateMany({
        where: { employeeId, tenantId, leaveTypeId, year },
        data: { taken: { increment: days }, pending: { decrement: days } },
      }),
      this.prisma.leaveTransaction.create({
        data: {
          tenantId,
          employeeId,
          leaveTypeId,
          year,
          type: 'DEBIT',
          days,
          reference: requestId,
          note: 'Leave approved',
        },
      }),
    ]);
  }

  async credit(
    employeeId: string,
    tenantId: string,
    leaveTypeId: string,
    year: number,
    days: number,
    note: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.leaveBalance.upsert({
        where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
        create: {
          tenantId,
          employeeId,
          leaveTypeId,
          year,
          opening: 0,
          accrued: days,
          taken: 0,
          pending: 0,
          closing: days,
        },
        update: { accrued: { increment: days }, closing: { increment: days } },
      }),
      this.prisma.leaveTransaction.create({
        data: { tenantId, employeeId, leaveTypeId, year, type: 'CREDIT', days, note },
      }),
    ]);
  }
}
