import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import type { JwtPayload } from '@hrms/shared-types';
import { PaginationDto, paginate } from '../../common/pagination/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(user: JwtPayload, dto: PaginationDto) {
    const canSeeAll = ['hr_admin', 'hr_manager', 'super_admin'].includes(user.role);
    const where = {
      tenantId: user.tenantId,
      ...(canSeeAll ? {} : { employeeId: user.employeeId ?? '' }),
    };

    const [items, total] = await Promise.all([
      this.prisma.expenseClaim.findMany({
        where,
        include: {
          employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true, workEmail: true } },
          items: true,
        },
        skip: dto.skip,
        take: dto.limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.expenseClaim.count({ where }),
    ]);
    return paginate(items, total, dto);
  }

  async summary(user: JwtPayload) {
    const canSeeAll = ['hr_admin', 'hr_manager', 'super_admin'].includes(user.role);
    const where = {
      tenantId: user.tenantId,
      ...(canSeeAll ? {} : { employeeId: user.employeeId ?? '' }),
    };
    const claims = await this.prisma.expenseClaim.findMany({ where });
    return {
      totalClaims: claims.length,
      draft: claims.filter((claim) => claim.status === 'draft').length,
      submitted: claims.filter((claim) => claim.status === 'submitted').length,
      approved: claims.filter((claim) => claim.status === 'approved').length,
      paid: claims.filter((claim) => claim.status === 'paid').length,
      totalAmount: claims.reduce((sum, claim) => sum + claim.totalAmount, 0),
    };
  }

  async create(
    user: JwtPayload,
    data: {
      title: string;
      employeeId?: string;
      currency?: string;
      items: Array<{ category: string; description: string; amount: number; date: string; receiptUrl?: string }>;
    },
  ) {
    const employeeId = data.employeeId ?? user.employeeId;
    if (!employeeId) throw new BadRequestException('Employee is required');
    if (employeeId !== user.employeeId && !['hr_admin', 'hr_manager', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException('Cannot create claims for another employee');
    }
    if (data.items.length === 0) throw new BadRequestException('At least one expense item is required');

    const employee = await this.prisma.employee.findFirst({
      where: { tenantId: user.tenantId, id: employeeId, deletedAt: null },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);

    return this.prisma.expenseClaim.create({
      data: {
        tenantId: user.tenantId,
        employeeId,
        title: data.title,
        currency: data.currency ?? 'INR',
        totalAmount,
        items: {
          create: data.items.map((item) => ({
            category: item.category,
            description: item.description,
            amount: item.amount,
            date: new Date(item.date),
            receiptUrl: item.receiptUrl ?? null,
          })),
        },
      },
      include: { items: true, employee: true },
    });
  }

  async submit(user: JwtPayload, claimId: string) {
    const claim = await this.prisma.expenseClaim.findFirst({ where: { tenantId: user.tenantId, id: claimId } });
    if (!claim) throw new NotFoundException('Expense claim not found');
    if (claim.employeeId !== user.employeeId && !['hr_admin', 'hr_manager', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException('Cannot submit this claim');
    }
    if (claim.status !== 'draft') throw new BadRequestException('Only draft claims can be submitted');

    const updated = await this.prisma.expenseClaim.update({
      where: { id: claimId },
      data: { status: 'submitted', submittedAt: new Date() },
      include: { items: true, employee: true },
    });

    await this.audit.log({
      tenantId: user.tenantId,
      actorId: user.sub,
      module: 'expenses',
      action: 'UPDATE',
      entityType: 'expense_claim',
      entityId: claimId,
      before: { status: claim.status },
      after: { status: updated.status },
    });

    return updated;
  }

  async decide(user: JwtPayload, claimId: string, decision: string) {
    const claim = await this.prisma.expenseClaim.findFirst({ where: { tenantId: user.tenantId, id: claimId } });
    if (!claim) throw new NotFoundException('Expense claim not found');

    const updated = await this.prisma.expenseClaim.update({
      where: { id: claimId },
      data: {
        status: decision,
        approvedAt: decision === 'approved' ? new Date() : claim.approvedAt,
        paidAt: decision === 'paid' ? new Date() : claim.paidAt,
      },
      include: { items: true, employee: true },
    });

    await this.audit.log({
      tenantId: user.tenantId,
      actorId: user.sub,
      module: 'expenses',
      action: 'APPROVE',
      entityType: 'expense_claim',
      entityId: claimId,
      before: { status: claim.status },
      after: { status: updated.status },
    });

    return updated;
  }
}
