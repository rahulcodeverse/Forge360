import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PaginationDto, paginate } from '../../common/pagination/pagination.dto';

@Injectable()
export class PerformanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ── Goal cycles ──────────────────────────────────────────────────────────

  async getActiveCycles(tenantId: string) {
    return this.prisma.goalCycle.findMany({
      where: { tenantId, isActive: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async createCycle(
    tenantId: string,
    data: { name: string; startDate: string; endDate: string; type: string },
    actorId: string,
  ) {
    return this.prisma.goalCycle.create({
      data: {
        tenantId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        type: data.type,
        isActive: true,
      },
    });
  }

  // ── Goals ────────────────────────────────────────────────────────────────

  async getGoals(employeeId: string, tenantId: string, cycleId?: string) {
    return this.prisma.goal.findMany({
      where: {
        employeeId,
        tenantId,
        ...(cycleId && { cycleId }),
        status: { not: 'cancelled' },
      },
      include: {
        cycle: true,
        checkIns: { orderBy: { createdAt: 'desc' }, take: 3 },
        parent: { select: { id: true, title: true } },
        children: { select: { id: true, title: true, score: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGoal(
    employeeId: string,
    tenantId: string,
    data: {
      cycleId: string;
      title: string;
      description?: string;
      weight: number;
      targetValue?: number;
      unit?: string;
      parentGoalId?: string;
    },
  ) {
    // Validate total weight does not exceed 100
    const existingGoals = await this.prisma.goal.findMany({
      where: { employeeId, tenantId, cycleId: data.cycleId, status: { not: 'cancelled' } },
      select: { weight: true },
    });

    const totalWeight = existingGoals.reduce((sum, g) => sum + g.weight, 0) + data.weight;
    if (totalWeight > 100) {
      throw new BadRequestException(
        `Total goal weight would exceed 100% (current: ${totalWeight - data.weight}%, adding: ${data.weight}%)`,
      );
    }

    return this.prisma.goal.create({
      data: {
        tenantId,
        employeeId,
        cycleId: data.cycleId,
        title: data.title,
        description: data.description ?? null,
        weight: data.weight,
        targetValue: data.targetValue ?? null,
        unit: data.unit ?? null,
        parentGoalId: data.parentGoalId ?? null,
        status: 'active',
      },
    });
  }

  async addCheckIn(
    goalId: string,
    employeeId: string,
    tenantId: string,
    data: { actualValue?: number; progressNote?: string },
  ) {
    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, employeeId, tenantId },
    });
    if (!goal) throw new NotFoundException('Goal not found');

    const checkIn = await this.prisma.goalCheckIn.create({
      data: {
        goalId,
        employeeId,
        actualValue: data.actualValue ?? null,
        progressNote: data.progressNote ?? null,
      },
    });

    // Update goal actual value
    if (data.actualValue !== undefined) {
      await this.prisma.goal.update({
        where: { id: goalId },
        data: { actualValue: data.actualValue },
      });
    }

    return checkIn;
  }

  // ── Review cycles ────────────────────────────────────────────────────────

  async getReviewCycles(tenantId: string) {
    return this.prisma.reviewCycle.findMany({
      where: { tenantId },
      include: { goalCycle: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReviewCycle(
    tenantId: string,
    data: {
      name: string;
      type: string;
      goalCycleId?: string;
      timeline: Record<string, string>;
    },
  ) {
    return this.prisma.reviewCycle.create({
      data: {
        tenantId,
        name: data.name,
        type: data.type,
        goalCycleId: data.goalCycleId ?? null,
        timeline: data.timeline,
        isActive: true,
      },
    });
  }

  // ── Review submissions ───────────────────────────────────────────────────

  async getSubmissions(tenantId: string, filters: { cycleId?: string; revieweeId?: string; reviewerId?: string }) {
    return this.prisma.reviewSubmission.findMany({
      where: {
        tenantId,
        ...(filters.cycleId && { cycleId: filters.cycleId }),
        ...(filters.revieweeId && { revieweeId: filters.revieweeId }),
        ...(filters.reviewerId && { reviewerId: filters.reviewerId }),
      },
      include: {
        cycle: true,
        reviewer: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        reviewee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitReview(
    reviewerId: string,
    tenantId: string,
    data: {
      cycleId: string;
      revieweeId: string;
      reviewerType: string;
      responses: Array<{ questionId: string; rating?: number; text?: string }>;
      overallRating?: number;
      summaryComment?: string;
    },
  ) {
    // Prevent duplicate submissions
    const existing = await this.prisma.reviewSubmission.findFirst({
      where: {
        tenantId,
        cycleId: data.cycleId,
        reviewerId,
        revieweeId: data.revieweeId,
        reviewerType: data.reviewerType,
      },
    });

    if (existing) {
      // Update existing draft
      return this.prisma.reviewSubmission.update({
        where: { id: existing.id },
        data: {
          responses: data.responses,
          overallRating: data.overallRating ?? null,
          summaryComment: data.summaryComment ?? null,
          status: 'submitted',
          submittedAt: new Date(),
        },
      });
    }

    return this.prisma.reviewSubmission.create({
      data: {
        tenantId,
        cycleId: data.cycleId,
        reviewerId,
        revieweeId: data.revieweeId,
        reviewerType: data.reviewerType,
        responses: data.responses,
        overallRating: data.overallRating ?? null,
        summaryComment: data.summaryComment ?? null,
        status: 'submitted',
        submittedAt: new Date(),
      },
    });
  }

  // ── Calibration ──────────────────────────────────────────────────────────

  async getCalibrationData(cycleId: string, tenantId: string) {
    const submissions = await this.prisma.reviewSubmission.findMany({
      where: {
        tenantId,
        cycleId,
        reviewerType: 'manager',
        status: 'submitted',
      },
      include: {
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
    });

    // Group by rating for bell curve
    const ratingGroups = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: submissions.filter((s) => Math.round(s.overallRating ?? 0) === rating).length,
      employees: submissions
        .filter((s) => Math.round(s.overallRating ?? 0) === rating)
        .map((s) => ({
          employeeId: s.revieweeId,
          name: `${s.reviewee.firstName} ${s.reviewee.lastName}`,
          rating: s.overallRating,
          department: s.reviewee.department?.name,
          designation: s.reviewee.designation?.name,
        })),
    }));

    return {
      cycleId,
      totalReviewed: submissions.length,
      averageRating:
        submissions.length > 0
          ? parseFloat(
              (
                submissions.reduce((sum, s) => sum + (s.overallRating ?? 0), 0) /
                submissions.length
              ).toFixed(2),
            )
          : 0,
      distribution: ratingGroups,
    };
  }

  async overrideRating(
    submissionId: string,
    tenantId: string,
    hrId: string,
    newRating: number,
    justification: string,
  ) {
    const submission = await this.prisma.reviewSubmission.findFirst({
      where: { id: submissionId, tenantId },
    });
    if (!submission) throw new NotFoundException('Review submission not found');

    const updated = await this.prisma.reviewSubmission.update({
      where: { id: submissionId },
      data: { overallRating: newRating },
    });

    await this.audit.log({
      tenantId,
      actorId: hrId,
      module: 'performance',
      action: 'UPDATE',
      entityType: 'review_submission',
      entityId: submissionId,
      before: { overallRating: submission.overallRating },
      after: { overallRating: newRating, justification },
    });

    return updated;
  }
}
