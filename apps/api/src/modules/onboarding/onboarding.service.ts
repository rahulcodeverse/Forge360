import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PaginationDto, paginate } from '../../common/pagination/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, dto: PaginationDto) {
    const where = { tenantId };
    const [items, total] = await Promise.all([
      this.prisma.onboardingSession.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.onboardingSession.count({ where }),
    ]);

    const employeeIds = items
      .map((session) => session.employeeId)
      .filter((employeeId): employeeId is string => Boolean(employeeId));
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, id: { in: employeeIds } },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        workEmail: true,
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    });
    const employeeById = new Map(employees.map((employee) => [employee.id, employee]));

    return paginate(
      items.map((session) => ({
        ...session,
        employee: session.employeeId ? employeeById.get(session.employeeId) ?? null : null,
        progressPercent: Math.round((session.currentStep / session.totalSteps) * 100),
      })),
      total,
      dto,
    );
  }

  async mine(tenantId: string, employeeId?: string) {
    if (!employeeId) throw new BadRequestException('Current user is not linked to an employee');
    return this.prisma.onboardingSession.findFirst({
      where: { tenantId, employeeId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(tenantId: string, employeeId: string | undefined, totalSteps: number) {
    if (employeeId) {
      const employee = await this.prisma.employee.findFirst({ where: { tenantId, id: employeeId } });
      if (!employee) throw new NotFoundException('Employee not found');
    }

    return this.prisma.onboardingSession.create({
      data: {
        tenantId,
        employeeId: employeeId ?? null,
        totalSteps,
        currentStep: 1,
        data: {},
      },
    });
  }

  async saveStep(
    tenantId: string,
    id: string,
    step: number,
    stepData: Record<string, unknown>,
    markComplete: boolean,
  ) {
    const session = await this.prisma.onboardingSession.findFirst({ where: { tenantId, id } });
    if (!session) throw new NotFoundException('Onboarding session not found');
    if (step < 1 || step > session.totalSteps) throw new BadRequestException('Invalid step number');

    const existingData =
      typeof session.data === 'object' && session.data !== null && !Array.isArray(session.data)
        ? (session.data as Record<string, unknown>)
        : {};
    const nextStep = markComplete
      ? Math.min(step + 1, session.totalSteps)
      : Math.max(session.currentStep, step);
    const nextData = { ...existingData, [`step${step}`]: stepData } as Prisma.InputJsonObject;

    const updated = await this.prisma.onboardingSession.update({
      where: { id },
      data: {
        data: nextData,
        currentStep: nextStep,
        isComplete: nextStep >= session.totalSteps && markComplete,
      },
    });

    await this.audit.log({
      tenantId,
      actorId: session.employeeId ?? 'system',
      module: 'onboarding',
      action: 'UPDATE',
      entityType: 'onboarding_session',
      entityId: id,
      before: { currentStep: session.currentStep },
      after: { currentStep: updated.currentStep, step },
    });

    return updated;
  }

  async complete(tenantId: string, id: string) {
    const session = await this.prisma.onboardingSession.findFirst({ where: { tenantId, id } });
    if (!session) throw new NotFoundException('Onboarding session not found');

    return this.prisma.onboardingSession.update({
      where: { id },
      data: { isComplete: true, currentStep: session.totalSteps },
    });
  }
}
